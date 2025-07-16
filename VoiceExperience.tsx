import React, { useEffect, useRef } from 'react';
import { Status, Message } from './types';
import { ChatMessage } from './components/ChatMessage';

interface VoiceExperienceProps {
    botName: string;
    botImage?: string | null;
    status: Status;
    transcript: Message[];
    error: string | null;
    isSessionActive: boolean;
    sendTextMessage: (question: string) => void;
}

export const VoiceExperience: React.FC<VoiceExperienceProps> = ({ 
    botName, botImage, status, transcript, error, isSessionActive, sendTextMessage 
}) => {
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [transcript]);

    const showWelcomeMessage = transcript.length === 0 && !isSessionActive;

    return (
        <div className="flex flex-col h-full">
            <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6 wavy-gold-scrollbar">
                {showWelcomeMessage && (
                     <div className="flex flex-col items-center justify-center h-full text-center text-amber-900/80 px-4">
                         <img src={botImage || "logo.png?v=3"} alt="Bot Logo" className="w-32 h-32 mb-6 rounded-full object-cover border-4 border-white/50 shadow-lg opacity-90" />
                        <h2 className="text-2xl font-bold font-cinzel">{botName}</h2>
                        <p className="mt-2 max-w-md">Press the "Start" button to talk to the voice assistant, or type a message once the session begins.</p>
                     </div>
                )}
                {transcript.map((message, index) => (
                    <ChatMessage 
                        key={index} 
                        message={message}
                        onSendMessage={sendTextMessage}
                    />
                ))}
                {status === Status.ERROR && error && (
                     <div className="flex justify-center">
                        <div className="bg-red-200 border border-red-400 text-red-800 p-3 rounded-lg max-w-md text-center">
                            {error}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};