import React, { useState, useCallback, useEffect } from 'react';
import { VoiceExperience } from './VoiceExperience';
import { XIcon, SpinnerIcon } from './components/Icons';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import { CallControlButton } from './components/CallControlButton';
import { getBot } from './services/databaseService';
import { Bot, Status } from './types';
import { ChatInput } from './components/ChatInput';


interface BotClientProps {
    botId: string;
}

const BotClient: React.FC<BotClientProps> = ({ botId }) => {
    const [view, setView] = useState<'loading' | 'bot' | 'error'>('loading');
    const [bot, setBot] = useState<Bot | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBotData = async () => {
            try {
                // Standalone package check: fetch local data file first.
                const response = await fetch('./bot_data.json');
                if (response.ok) {
                    const localBot = await response.json();
                    if (localBot && localBot.id) {
                        setBot(localBot);
                        setView('bot');
                        return; // Local data loaded, we're done.
                    }
                }

                // Fallback to production mode: Use botId from props to get from DB.
                if (botId) {
                    const dbBot = await getBot(botId);
                    if (dbBot) {
                        setBot(dbBot);
                        setView('bot');
                    } else {
                        throw new Error(`Bot with ID "${botId}" not found in the database.`);
                    }
                } else {
                    // This state is reached if bot_data.json is not found AND no botId is provided.
                    throw new Error("No bot data source available. 'bot_data.json' is missing and no 'botId' was provided.");
                }
            } catch (err: any) {
                console.error("Failed to load bot data:", err);
                setError(err.message || "An unknown error occurred while loading bot data.");
                setView('error');
            }
        };

        fetchBotData();
    }, [botId]);

    // --- State-based Rendering ---
    if (view === 'loading') {
        return (
            <div className="flex items-center justify-center h-screen text-center text-amber-900/80">
                <div className="flex flex-col items-center">
                    <SpinnerIcon className="w-16 h-16" />
                    <p className="mt-4 text-lg">Loading Assistant...</p>
                </div>
            </div>
        );
    }
    
    if (view === 'error') {
        return (
            <div className="flex items-center justify-center h-screen p-4">
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded-lg shadow-md max-w-lg text-center">
                    <h3 className="font-bold text-xl mb-2">Loading Error</h3>
                    <p className="text-base">{error}</p>
                </div>
            </div>
        );
    }
    
    if (!bot) {
        return null;
    }

    return <ChatInterface bot={bot} />;
};

const ChatInterface: React.FC<{ bot: Bot }> = ({ bot }) => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const { status, transcript, startSession, stopSession, isSessionActive, sendTextMessage, error: assistantError } = useVoiceAssistant();

    const handleStartSession = useCallback(() => {
        const welcomeMessage = bot.welcome_message || 'Welcome, how can I help you today?';
        startSession(bot, [{
            speaker: 'ai', 
            textParts: [welcomeMessage], 
            spokenSummary: welcomeMessage,
            suggestedQuestions: []
        }]);
    }, [startSession, bot]);

    const handleOpenChat = () => setIsChatOpen(true);
    
    const handleCloseChat = () => {
        setIsChatOpen(false);
        if (isSessionActive) {
            stopSession();
        }
    };

    const fabBaseClassName = 'fixed bottom-6 right-6 z-40 w-20 h-20 rounded-full shadow-2xl flex items-center justify-center transform hover:scale-110 transition-all duration-300';
    const fabStyle: React.CSSProperties = {};
    let fabAnimationClass = 'bg-wavy-gold-button';

    if (bot.wavy_color) {
        fabStyle.background = `linear-gradient(270deg, ${bot.wavy_color})`;
        fabAnimationClass = 'wavy-animation';
    }
    
    return (
        <>
            {/* Floating Action Button */}
            <button
                onClick={handleOpenChat}
                style={fabStyle}
                className={`${fabBaseClassName} ${fabAnimationClass} ${isChatOpen ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100 scale-100'}`}
                aria-label="Open Chat"
            >
                <img src={bot.image_base64 || "logo.png"} alt="Bot Logo" className="w-16 h-16 p-1 rounded-full object-cover" />
            </button>

            {/* Chat Window */}
            <div className={`fixed bottom-4 right-4 z-50 flex flex-col bg-main-container text-stone-800 shadow-2xl rounded-2xl ring-1 ring-amber-700/50 w-[95vw] max-w-md h-[90vh] max-h-[700px] transform transition-all duration-500 ease-in-out ${isChatOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16 pointer-events-none'}`}>
                <header className="p-3 flex justify-between items-center border-b border-amber-600/50 flex-shrink-0">
                   <>
                        <CallControlButton 
                            status={status} 
                            isSessionActive={isSessionActive}
                            onStart={handleStartSession}
                            onEnd={stopSession}
                        />
                        <div className="flex items-center gap-3 flex-1 justify-center">
                            <h1 className="text-base sm:text-lg font-bold text-black text-center">{bot.name}</h1>
                        </div>
                        <div className="flex items-center gap-1">
                            <button 
                                onClick={handleCloseChat} 
                                className="p-2 rounded-full text-amber-800 hover:bg-black/10 transition-colors"
                                aria-label="Close Chat"
                            >
                                <XIcon className="w-6 h-6"/>
                            </button>
                        </div>
                   </>
                </header>
                <div className="flex-1 flex flex-col overflow-hidden">
                    <VoiceExperience 
                        botName={bot.name}
                        botImage={bot.image_base64}
                        status={status}
                        transcript={transcript}
                        error={assistantError}
                        isSessionActive={isSessionActive}
                        sendTextMessage={sendTextMessage}
                     />
                    {isSessionActive && (
                        <ChatInput 
                            onSendMessage={sendTextMessage} 
                            disabled={status === Status.THINKING || status === Status.SPEAKING}
                        />
                    )}
                </div>
            </div>
        </>
    );
}

export default BotClient;