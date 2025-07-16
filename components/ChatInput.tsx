import React, { useState, useRef, useEffect } from 'react';
import { SendIcon } from './Icons';

interface ChatInputProps {
    onSendMessage: (message: string) => void;
    disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
    const [text, setText] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSend = () => {
        if (text.trim() && !disabled) {
            onSendMessage(text.trim());
            setText('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    
    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            const scrollHeight = textarea.scrollHeight;
            textarea.style.height = `${scrollHeight}px`;
        }
    }, [text]);


    return (
        <div className="p-3 border-t border-amber-600/50 flex-shrink-0 bg-main-container">
            <div className="flex items-end gap-2 bg-black/10 p-2 rounded-xl">
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-grow bg-transparent text-stone-800 placeholder-stone-600 focus:outline-none resize-none px-2 py-1 max-h-28 overflow-y-auto wavy-gold-scrollbar"
                    rows={1}
                    disabled={disabled}
                    aria-label="Chat input"
                />
                <button
                    onClick={handleSend}
                    disabled={!text.trim() || disabled}
                    className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-wavy-gold-button text-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-110"
                    aria-label="Send Message"
                >
                    <SendIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
