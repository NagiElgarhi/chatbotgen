import { useState, useRef, useCallback, useEffect } from 'react';
import { Status, Message, Bot } from '../types';
import { generateResponse } from '../services/geminiService';

// Type definitions for the Web Speech API
interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
}
type SpeechRecognitionErrorCode = 'no-speech' | 'aborted' | 'audio-capture' | 'network' | 'not-allowed' | 'service-not-allowed' | 'bad-grammar' | 'language-not-supported';
interface SpeechRecognitionErrorEvent extends Event {
    readonly error: SpeechRecognitionErrorCode;
    readonly message: string;
}
interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    start(): void;
    stop(): void;
    abort(): void;
}
interface SpeechRecognitionStatic { new (): SpeechRecognition; }
const SpeechRecognition: SpeechRecognitionStatic | undefined = 
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const useVoiceAssistant = () => {
    const [status, setStatus] = useState<Status>(Status.IDLE);
    const [error, setError] = useState<string | null>(null);
    const [transcript, setTranscript] = useState<Message[]>([]);
    const [isSessionActive, setIsSessionActive] = useState(false);
    
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const botRef = useRef<Bot | null>(null);
    const isMounted = useRef(true);
    const isSessionActiveRef = useRef(isSessionActive);
    const statusRef = useRef(status);

    useEffect(() => { isSessionActiveRef.current = isSessionActive; }, [isSessionActive]);
    useEffect(() => { statusRef.current = status; }, [status]);

    useEffect(() => {
        isMounted.current = true;
        return () => { 
            isMounted.current = false;
            if (recognitionRef.current) recognitionRef.current.abort();
            window.speechSynthesis.cancel();
        };
    }, []);

    const startListening = useCallback(() => {
        if (!recognitionRef.current || !isMounted.current) return;
        try {
            recognitionRef.current.start();
            setStatus(Status.LISTENING);
        } catch (e) {
            console.warn("Speech recognition could not start.", e);
        }
    }, []);

    const speakResponse = useCallback((text: string) => {
        if (!isMounted.current || !text || !text.trim()) {
            if (isMounted.current && isSessionActiveRef.current) startListening();
            else if (isMounted.current) setStatus(Status.IDLE);
            return;
        }

        const executeSpeak = async () => {
            window.speechSynthesis.cancel();
            if (!isMounted.current) return;
            
            setStatus(Status.SPEAKING);

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 1.0;
            utteranceRef.current = utterance;
            
            utterance.onend = () => {
                if (isMounted.current) {
                    if(isSessionActiveRef.current) startListening();
                    else setStatus(Status.IDLE);
                }
            };

            utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
                console.error(`SpeechSynthesis Error: ${event.error}`, 'for text:', `"${event.utterance.text}"`);
                if (isMounted.current) {
                    setError('An error occurred during audio playback.');
                    setStatus(Status.ERROR);
                }
            };

            window.speechSynthesis.speak(utterance);
        };
        executeSpeak();
    }, [startListening]);


    const processTranscript = useCallback(async (text: string) => {
        if (!botRef.current?.knowledge) {
            console.error("No bot or knowledge loaded to process transcript.");
            setError("The bot's knowledge base has not been loaded.");
            setStatus(Status.ERROR);
            return;
        }
        setStatus(Status.THINKING);

        try {
            const result = await generateResponse(text, transcript, botRef.current.knowledge);
            
            if (isMounted.current) {
                const { answer, spoken_summary, suggested_questions } = result;
                const aiMessage: Message = { speaker: 'ai', textParts: answer, spokenSummary: spoken_summary, suggestedQuestions: suggested_questions };
                setTranscript(prev => [...prev, aiMessage]);
                speakResponse(spoken_summary);
            }
        } catch (e: any) {
            console.error("Error processing transcript in hook:", e);
            const errorMessage = (e as Error).message || "Sorry, I'm having trouble finding an answer.";
            if (isMounted.current) {
                setError(errorMessage);
                setStatus(Status.ERROR);
                const fallbackMessage: Message = { speaker: 'ai', textParts: [errorMessage], spokenSummary: errorMessage, suggestedQuestions: [] };
                setTranscript(prev => [...prev, fallbackMessage]);
                speakResponse(errorMessage);
            }
        }
    }, [speakResponse, transcript]);
    
    const handleSpeechResult = useCallback((event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        }

        if (finalTranscript.trim() && isMounted.current) {
            const userMessage: Message = { speaker: 'user', text: finalTranscript.trim() };
            setTranscript(prev => [...prev, userMessage]);
            processTranscript(finalTranscript.trim());
        }
    }, [processTranscript]);

    const setupRecognition = useCallback(() => {
        if (!SpeechRecognition) return;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.onresult = handleSpeechResult;
        
        recognition.onend = () => {
            if (isMounted.current && isSessionActiveRef.current && statusRef.current === Status.LISTENING) {
                 startListening();
            }
        };
        
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            if (!isMounted.current) return;
            if (event.error === 'no-speech' || event.error === 'aborted') return;

            console.error('SpeechRecognition Error:', event.error, event.message);
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                 setError("Microphone access was denied. Please check browser permissions.");
                 setStatus(Status.ERROR);
                 setIsSessionActive(false);
            } else {
                 setError('A speech recognition error occurred.');
                 setStatus(Status.ERROR);
            }
        };
        recognitionRef.current = recognition;
    }, [handleSpeechResult, startListening]);


    const startSession = useCallback(async (bot: Bot, initialMessages: Message[] = []) => {
        if (!SpeechRecognition) {
            setError("Your browser does not support speech recognition.");
            setStatus(Status.ERROR);
            return;
        }
        
        botRef.current = bot;
        setIsSessionActive(true);
        setError(null);
        setStatus(Status.IDLE);
        setTranscript(initialMessages);
        setupRecognition();

        const firstMessage = initialMessages.find(m => m.speaker === 'ai');
        if (firstMessage?.spokenSummary) {
             speakResponse(firstMessage.spokenSummary);
        } else {
            setTimeout(() => { if(isMounted.current) startListening(); }, 100);
        }
    }, [setupRecognition, speakResponse, startListening]);

    const stopSession = useCallback(() => {
        setIsSessionActive(false);
        botRef.current = null;
        
        if (recognitionRef.current) {
            recognitionRef.current.onresult = null;
            recognitionRef.current.onend = null;
            recognitionRef.current.onerror = null;
            recognitionRef.current.abort();
        }
        if (utteranceRef.current) utteranceRef.current.onend = null;
        window.speechSynthesis.cancel();
        
        setStatus(Status.IDLE);
        setTranscript([]);
    }, []);



    const sendTextMessage = useCallback((text: string) => {
        if (isMounted.current) {
            const userMessage: Message = { speaker: 'user', text: text };
            setTranscript(prev => [...prev, userMessage]);
            processTranscript(text);
            window.speechSynthesis.cancel();
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        }
    }, [processTranscript]);
    
    return { status, transcript, error, startSession, stopSession, isSessionActive, sendTextMessage };
};
