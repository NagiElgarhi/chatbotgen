import React, { useState } from 'react';
import { Message } from '../types';
import { UserIcon, BotIcon, ClipboardIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface ChatMessageProps {
  message: Message;
  onSendMessage?: (question: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onSendMessage }) => {
  const isUser = message.speaker === 'user';
  const [copied, setCopied] = useState(false);
  const [currentPart, setCurrentPart] = useState(0);

  const textParts = message.textParts || [];
  const hasMultipleParts = textParts.length > 1;

  const currentText = isUser ? message.text : (textParts[currentPart] || '');

  const handleCopy = () => {
    if (copied || !currentText) return;
    navigator.clipboard.writeText(currentText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
  };

  const goToNext = () => setCurrentPart(p => (p + 1) % textParts.length);
  const goToPrev = () => setCurrentPart(p => (p - 1 + textParts.length) % textParts.length);

  return (
    <div className={`flex items-start gap-3 sm:gap-4 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-wavy-gold-button flex items-center justify-center shadow-md text-black">
          <BotIcon />
        </div>
      )}
      <div
        className={`relative max-w-sm sm:max-w-md lg:max-w-2xl p-4 rounded-2xl shadow-lg flex flex-col bg-simple-gold-gradient text-stone-800 ${
          isUser
            ? 'rounded-br-none'
            : 'rounded-bl-none'
        }`}
      >
        {/* Main Content */}
        <div className="relative">
            {hasMultipleParts && (
                 <button 
                    onClick={goToPrev} 
                    className="absolute right-full mr-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-stone-700 hover:text-stone-900 transition-all"
                    aria-label="Previous"
                 >
                     <ChevronLeftIcon className="w-5 h-5" />
                 </button>
            )}
            <p className="text-base leading-relaxed whitespace-pre-wrap">{currentText}</p>
            {hasMultipleParts && (
                 <button 
                    onClick={goToNext} 
                    className="absolute left-full ml-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-stone-700 hover:text-stone-900 transition-all"
                    aria-label="Next"
                 >
                     <ChevronRightIcon className="w-5 h-5" />
                 </button>
            )}
        </div>

        {/* Footer for AI messages */}
        {!isUser && textParts.length > 0 && (
            <div className="mt-3 pt-2 border-t border-amber-900/20">
                <div className="flex justify-between items-center text-xs">
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 p-1 rounded-full text-stone-700 hover:text-stone-900 hover:bg-black/10 transition-all duration-200"
                        aria-label={copied ? "Copied!" : "Copy Text"}
                    >
                        {copied ? <CheckIcon className="w-4 h-4 text-green-600" /> : <ClipboardIcon className="w-4 h-4" />}
                        <span className={`transition-opacity ${copied ? 'opacity-100' : 'opacity-0'}`}>Copied!</span>
                    </button>
                     {hasMultipleParts && (
                        <div className="font-mono text-stone-600 select-none">
                            {currentPart + 1} / {textParts.length}
                        </div>
                    )}
                </div>

                {message.suggestedQuestions && message.suggestedQuestions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {message.suggestedQuestions.map((q, i) => (
                            <button
                                key={i}
                                onClick={() => onSendMessage?.(q)}
                                className="px-3 py-1.5 text-sm bg-amber-600/10 text-amber-900 rounded-full hover:bg-amber-600/20 transition-colors"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        )}
      </div>
       {isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-wavy-gold-button flex items-center justify-center shadow-md text-black">
          <UserIcon />
        </div>
      )}
    </div>
  );
};