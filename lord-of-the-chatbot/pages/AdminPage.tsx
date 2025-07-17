import React, { useState, useCallback, useEffect } from 'react';
import { Bot, Knowledge } from '../types';
import { getBots, createBot, deleteBot, updateBotKnowledge, backupDatabase, getBot } from '../services/databaseService';
import { PlusIcon, TrashIcon, CodeIcon, ClipboardIcon, CheckIcon, UploadIcon, ChevronLeftIcon, SpinnerIcon, CheckCircleIcon, DownloadIcon, UserIcon, DocumentTextIcon, PlatformLogoIcon } from '../components/Icons';
import { colorOptions } from '../utils/colors';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { ApiKeyManager } from '../components/ApiKeyManager';
import JSZip from 'jszip';
import saveAs from 'file-saver';

// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@5.3.93/build/pdf.worker.mjs`;

// --- Standalone Bot Templates ---
// By embedding the file contents here, we avoid fetching non-existent source files on a deployed server.

const typesTsContent = `
export enum Status {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  THINKING = 'THINKING',
  SPEAKING = 'SPEAKING',
  ERROR = 'ERROR',
}

export interface Message {
  speaker: 'user' | 'ai';
  // A user message will only have \`text\`.
  text?: string; 
  // An AI message will have the following properties.
  textParts?: string[];
  spokenSummary?: string;
  suggestedQuestions?: string[];
}


export interface Knowledge {
  texts: string[];
  files: string[];
}

export interface Bot {
  id: string;
  name: string;
  welcome_message: string;
  knowledge?: Knowledge;
  created_at: string;
  updated_at: string;
  admin_pass: string;
  image_base64?: string | null;
  wavy_color?: string | null;
}

export interface Product {
  id: number;
  name: string;
  product_url: string;
  details: string;
  company_name: string;
  company_url: string;
  created_at: string;
}`;

const iconsTsxContent = `
import React from 'react';

export const PlatformLogoIcon: React.FC<{ className?: string }> = ({ className = "h-16 w-16" }) => (
    <svg role="img" aria-label="Platform Logo" className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
            <linearGradient id="logo-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor: '#f9d976'}} />
              <stop offset="100%" style={{stopColor: '#b48a02'}} />
            </linearGradient>
        </defs>
        <path 
            d="M50 5 C 55 5, 65 10, 80 20 L 90 60 C 90 70, 70 95, 50 95 C 30 95, 10 70, 10 60 L 20 20 C 35 10, 45 5, 50 5 Z" 
            stroke="url(#logo-gold-grad)" 
            strokeWidth="4" 
            fill="#292524"
        />
        <text x="50" y="65" fontFamily="Cinzel Decorative, cursive" fontSize="48" fill="url(#logo-gold-grad)" textAnchor="middle">
            L
        </text>
    </svg>
);


export const PhoneIcon: React.FC<{className?: string}> = ({ className = "h-6 w-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
);

export const StopCircleIcon: React.FC<{className?: string}> = ({ className = "h-6 w-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6" />
    </svg>
);

export const MicrophoneIcon: React.FC<{className?: string}> = ({ className = "h-8 w-8" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
);

export const BrainIcon: React.FC<{className?: string}> = ({ className = "h-8 w-8" }) => (
     <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15a7 7 0 017-7m0 0a7 7 0 017 7m-7-7v2m0 0v2m0-2h.01M5 15a7 7 0 007 7m0 0a7 7 0 007-7M5 15h14M5 15a7 7 0 01-2-1.5M19 15a7 7 0 002-1.5M5 15V9a2 2 0 012-2h10a2 2 0 012 2v6" />
    </svg>
);

export const VolumeUpIcon: React.FC<{className?: string}> = ({ className = "h-8 w-8" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
);

export const XCircleIcon: React.FC<{className?: string}> = ({ className = "h-8 w-8" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2 2m2-2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const UserIcon: React.FC<{className?: string}> = ({ className = "h-6 w-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

export const BotIcon: React.FC<{className?: string}> = ({ className = "h-6 w-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
);

export const WhatsAppIcon: React.FC<{className?: string}> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.269.654 4.288 1.902 6.046l-1.105 4.054 4.205-1.106z" />
    </svg>
);

export const XIcon: React.FC<{className?: string}> = ({ className = "h-6 w-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const ClipboardIcon: React.FC<{className?: string}> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
);

export const CheckIcon: React.FC<{className?: string}> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

export const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
);

export const ChevronRightIcon: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
);

export const UploadIcon: React.FC<{className?: string}> = ({ className = "h-6 w-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

export const DocumentTextIcon: React.FC<{className?: string}> = ({ className = "h-6 w-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

export const CheckCircleIcon: React.FC<{className?: string}> = ({ className = "h-6 w-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const TrashIcon: React.FC<{className?: string}> = ({ className = "h-6 w-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

export const CogIcon: React.FC<{className?: string}> = ({ className = "h-6 w-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const ArrowRightIcon: React.FC<{className?: string}> = ({ className = "h-6 w-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
);

export const PlusIcon: React.FC<{className?: string}> = ({ className = "h-6 w-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);

export const CodeIcon: React.FC<{className?: string}> = ({ className = "h-6 w-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
);

export const DownloadIcon: React.FC<{className?: string}> = ({ className = "h-6 w-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

export const SendIcon: React.FC<{ className?: string }> = ({ className = "h-6 w-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
);

export const SpinnerIcon: React.FC<{className?: string}> = ({ className="h-6 w-6" }) => (
    <svg className={\`animate-spin \${className}\`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);
`;

const chatMessageTsxContent = `
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
    <div className={\`flex items-start gap-3 sm:gap-4 my-4 \${isUser ? 'justify-end' : 'justify-start'}\`}>
      {!isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-wavy-gold-button flex items-center justify-center shadow-md text-black">
          <BotIcon />
        </div>
      )}
      <div
        className={\`relative max-w-sm sm:max-w-md lg:max-w-2xl p-4 rounded-2xl shadow-lg flex flex-col bg-simple-gold-gradient text-stone-800 \${
          isUser
            ? 'rounded-br-none'
            : 'rounded-bl-none'
        }\`}
      >
        {/* Main Content */}
        <div className="relative">
            {hasMultipleParts && (
                 <button 
                    onClick={goToPrev} 
                    className="absolute right-full mr-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-stone-700 hover:text-stone-900 transition-all"
                    aria-label="Previous"
                 >
                     <ChevronRightIcon className="w-5 h-5" />
                 </button>
            )}
            <p className="text-base leading-relaxed whitespace-pre-wrap">{currentText}</p>
            {hasMultipleParts && (
                 <button 
                    onClick={goToNext} 
                    className="absolute left-full ml-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-stone-700 hover:text-stone-900 transition-all"
                    aria-label="Next"
                 >
                     <ChevronLeftIcon className="w-5 h-5" />
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
                        <span className={\`transition-opacity \${copied ? 'opacity-100' : 'opacity-0'}\`}>Copied!</span>
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
`;

const statusIndicatorTsxContent = `
import React from 'react';
import { Status } from '../types';
import { MicrophoneIcon, BrainIcon, VolumeUpIcon, PhoneIcon, XCircleIcon } from './Icons';

interface StatusIndicatorProps {
    status: Status;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
    const getStatusStyle = () => {
        switch (status) {
            case Status.LISTENING:
                return 'bg-blue-600 pulse text-white';
            case Status.THINKING:
                return 'bg-purple-600 pulse-thinking text-white';
            case Status.SPEAKING:
                return 'bg-green-600 animate-pulse text-white';
            case Status.ERROR:
                return 'bg-red-600 text-white';
            case Status.IDLE:
            default:
                return 'bg-wavy-gold-button text-black';
        }
    };

    const getStatusIcon = () => {
        switch (status) {
            case Status.LISTENING:
                return <MicrophoneIcon />;
            case Status.THINKING:
                return <BrainIcon />;
            case Status.SPEAKING:
                return <VolumeUpIcon />;
            case Status.ERROR:
                return <XCircleIcon />;
            case Status.IDLE:
            default:
                return <PhoneIcon />;
        }
    };

    return (
        <div className={\`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl \${getStatusStyle()}\`}>
            {getStatusIcon()}
        </div>
    );
};
`;

const voiceExperienceTsxContent = `
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
`;

const useVoiceAssistantTsContent = `
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
                console.error(\`SpeechSynthesis Error: \${event.error}\`, 'for text:', \`"\${event.utterance.text}"\`);
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
            // Immediately stop any ongoing speech or recognition for better responsiveness
            window.speechSynthesis.cancel();
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }

            const userMessage: Message = { speaker: 'user', text: text };
            setTranscript(prev => [...prev, userMessage]);
            processTranscript(text);
        }
    }, [processTranscript]);
    
    return { status, transcript, error, startSession, stopSession, isSessionActive, sendTextMessage };
};
`;

const geminiServiceTsContent = `
import { GoogleGenAI, Type } from "@google/genai";
import { Knowledge, Message } from '../types';

let ai: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
    if (ai) {
        // Here we could add logic to re-init if the key changes, but for now this is fine.
        return ai;
    }

    const apiKey = localStorage.getItem('google_api_key');
    if (!apiKey) {
        throw new Error("API Key not found in local storage. Please set it on the Admin page.");
    }
    ai = new GoogleGenAI({ apiKey });
    return ai;
}


// --- Knowledge Base Retrieval ---
const findRelevantChunks = (query: string, knowledgeBase: Knowledge, count = 3): string[] => {
    if (!knowledgeBase || !knowledgeBase.texts) return [];
    
    const queryWords = new Set(query.toLowerCase().split(/\\s+/).filter(word => word.length > 2));
    if (queryWords.size === 0) return [];

    const scoredChunks = knowledgeBase.texts.map(textChunk => {
        const lowerChunk = textChunk.toLowerCase();
        let score = 0;
        for (const word of queryWords) {
            if (lowerChunk.includes(word)) {
                score++;
            }
        }
        return { score, text: textChunk };
    });

    return scoredChunks
        .sort((a, b) => b.score - a.score)
        .filter(chunk => chunk.score > 0)
        .slice(0, count)
        .map(chunk => chunk.text);
};


// --- Gemini API Interaction ---

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        answer: {
            type: Type.STRING,
            description: "A detailed, helpful, and friendly answer to the user's question. Base the answer on the provided context.",
        },
        spoken_summary: {
            type: Type.STRING,
            description: "A concise, single-sentence summary of the answer, suitable for text-to-speech. Should be less than 200 characters.",
        },
        suggested_questions: {
            type: Type.ARRAY,
            description: "Three relevant follow-up questions that the user might ask.",
            items: { type: Type.STRING },
        },
    },
    required: ["answer", "spoken_summary", "suggested_questions"],
};

interface GeminiResponse {
    answer: string[];
    spoken_summary: string;
    suggested_questions: string[];
}


export const generateResponse = async (query: string, chatHistory: Message[], knowledge: Knowledge): Promise<GeminiResponse> => {
    try {
        const geminiClient = getAiClient();
        const relevantChunks = findRelevantChunks(query, knowledge);

        const context = relevantChunks.length > 0
            ? \`Use the following information from the knowledge base to answer the question:\\n\\n---\\n\${relevantChunks.join('\\n---\\n')}\\n---\`
            : "I couldn't find direct information in the knowledge base, but try to answer in a general, helpful way.";

        const systemInstruction = \`You are an intelligent and friendly voice assistant.
        Your task is to answer user queries accurately, based on the provided context.
        If the information is not available in the context, politely state that you do not have the information.
        Maintain a professional and helpful tone.
        Always provide an answer, a spoken summary, and three suggested questions in the required JSON format.\`;

        const recentHistory = chatHistory.slice(-4).map(m => \`\${m.speaker}: \${m.text || m.textParts?.join(' ')}\`).join('\\n');
        
        const prompt = \`\${context}\\n\\nRecent conversation history:\\n\${recentHistory}\\n\\nCurrent user question: "\${query}"\`;

        const response = await geminiClient.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.5,
            }
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        
        if (result && result.answer && result.spoken_summary && Array.isArray(result.suggested_questions)) {
            return {
                answer: [result.answer], // Return as array to match Message type
                spoken_summary: result.spoken_summary,
                suggested_questions: result.suggested_questions,
            };
        } else {
            console.error("Invalid JSON structure from Gemini:", result);
            throw new Error("Received an invalid response structure from the AI.");
        }

    } catch (e) {
        console.error("Gemini Service Error:", e);
        const errorMessage = (e as Error).message.includes("API Key not found")
            ? "The Google AI API Key is not set. Please configure it in the Admin panel."
            : "Sorry, I'm having trouble connecting to the smart assistant right now. Please try again later.";
        
        // Return a fallback response
        return {
            answer: [errorMessage],
            spoken_summary: errorMessage,
            suggested_questions: [
                "What services are available?",
                "How can I subscribe?",
                "What are the business hours?"
            ]
        };
    }
};
`;

const callControlButtonTsxContent = `
import React from 'react';
import { Status } from '../types';
import { PhoneIcon, StopCircleIcon, MicrophoneIcon, BrainIcon, VolumeUpIcon, XCircleIcon } from './Icons';

interface CallControlButtonProps {
    status: Status;
    isSessionActive: boolean;
    onStart: () => void;
    onEnd: () => void;
}

const getStatusInfo = (status: Status): { Icon: React.FC<{className?: string}>, style: string, text: string } => {
    switch (status) {
        case Status.LISTENING:
            return { Icon: MicrophoneIcon, style: 'bg-wavy-gold-button text-black pulse', text: 'Listening...' };
        case Status.THINKING:
            return { Icon: BrainIcon, style: 'bg-wavy-gold-button text-black pulse-thinking', text: 'Thinking...' };
        case Status.SPEAKING:
            return { Icon: VolumeUpIcon, style: 'bg-wavy-gold-button text-black animate-pulse', text: 'Speaking...' };
        case Status.ERROR:
            return { Icon: XCircleIcon, style: 'bg-red-700 text-white', text: 'Error' };
        case Status.IDLE:
        default:
            // This case only happens briefly when the session is active but waiting for the next action
            return { Icon: MicrophoneIcon, style: 'bg-wavy-gold-button text-black', text: 'Ready' };
    }
};

export const CallControlButton: React.FC<CallControlButtonProps> = ({ status, isSessionActive, onStart, onEnd }) => {

    if (!isSessionActive) {
        return (
            <button
                onClick={onStart}
                className="flex items-center justify-center gap-2 px-4 py-2 text-base font-bold rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 shadow-md bg-wavy-gold-button hover:shadow-lg focus:ring-amber-500 text-black"
                aria-label="Start Call"
            >
                <PhoneIcon className="w-5 h-5"/>
                <span>Start</span>
            </button>
        );
    }

    const { Icon, style: statusStyle, text: statusText } = getStatusInfo(status);

    return (
        <div className="flex items-center rounded-full shadow-md overflow-hidden ring-1 ring-black/10 h-10">
            {/* End Button Part */}
            <button
                onClick={onEnd}
                className="flex h-full items-center justify-center gap-2 px-4 text-base font-bold bg-wavy-gold-button-reversed text-black transition-all hover:shadow-inner"
                aria-label="End Call"
            >
                <StopCircleIcon className="w-5 h-5" />
                <span className="hidden sm:inline">End</span>
            </button>
            
            {/* Separator */}
            <div className="w-px bg-black/20 h-full"></div>

            {/* Status Indicator Part */}
            <div 
                className={\`flex h-full items-center justify-center gap-2 px-4 text-base font-bold transition-colors \${statusStyle}\`}
                title={statusText}
            >
                <Icon className="w-5 h-5" />
            </div>
        </div>
    );
};
`;

const chatInputTsxContent = `
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
            textarea.style.height = \`\${scrollHeight}px\`;
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
`;

const botClientTsxContent = `
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
                const fetchedBot = await getBot(botId);
                if (fetchedBot) {
                    setBot(fetchedBot);
                    setView('bot');
                } else {
                    throw new Error("Bot not found.");
                }
            } catch (err: any) {
                console.error("Failed to fetch bot data:", err);
                setError("Could not load bot data. Please ensure the backend server is running and the Bot ID is correct.");
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
        fabStyle.background = \`linear-gradient(270deg, \${bot.wavy_color})\`;
        fabAnimationClass = 'wavy-animation';
    }
    
    return (
        <>
            {/* Floating Action Button */}
            <button
                onClick={handleOpenChat}
                style={fabStyle}
                className={\`\${fabBaseClassName} \${fabAnimationClass} \${isChatOpen ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100 scale-100'}\`}
                aria-label="Open Chat"
            >
                <img src={bot.image_base64 || "logo.png"} alt="Bot Logo" className="w-16 h-16 p-1 rounded-full object-cover" />
            </button>

            {/* Chat Window */}
            <div className={\`fixed bottom-4 right-4 z-50 flex flex-col bg-main-container text-stone-800 shadow-2xl rounded-2xl ring-1 ring-amber-700/50 w-[95vw] max-w-md h-[90vh] max-h-[700px] transform transition-all duration-500 ease-in-out \${isChatOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16 pointer-events-none'}\`}>
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
`;

const indexHtmlContent = `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Lord of the Chatbot</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Cinzel+Decorative:wght@700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #fdfaf5;
        }
        .font-cinzel {
            font-family: 'Cinzel Decorative', cursive;
        }
        .z-special {
            font-size: 200%;
            display: inline-block;
            vertical-align: -0.3em; /* Fine-tune vertical alignment */
            margin: 0 -0.05em; /* Adjust spacing around the letter */
            background: linear-gradient(45deg, #2c1e02, #8b6d1e);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-fill-color: transparent;
        }
        .pulse {
            animation: pulse-animation 1.5s infinite;
        }
        @keyframes pulse-animation {
            0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
            70% { box-shadow: 0 0 0 20px rgba(59, 130, 246, 0); }
            100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
        .pulse-thinking {
             animation: pulse-thinking-animation 1.5s infinite;
        }
        @keyframes pulse-thinking-animation {
            0% { box-shadow: 0 0 0 0 rgba(217, 119, 6, 0.7); } /* Amber 600 */
            70% { box-shadow: 0 0 0 20px rgba(217, 119, 6, 0); }
            100% { box-shadow: 0 0 0 0 rgba(217, 119, 6, 0); }
        }
        
        @keyframes wavy-background {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        .wavy-animation {
            background-size: 400% 400%;
            animation: wavy-background 4s ease-in-out infinite;
        }
        
        .bg-main-container {
            background: linear-gradient(145deg, #f3e5b0, #c5a32c);
        }

        .bg-wavy-gold-button {
            background: linear-gradient(270deg, #c5a32c, #f9d976, #b48a02, #f3e5b0, #c5a32c);
            background-size: 400% 400%;
            animation: wavy-background 4s ease-in-out infinite;
        }
        
        .bg-wavy-gold-button-reversed {
            background: linear-gradient(90deg, #c5a32c, #f9d976, #b48a02, #f3e5b0, #c5a32c);
            background-size: 400% 400%;
            animation: wavy-background 4s ease-in-out infinite;
        }

        .text-shadow {
            text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.4);
        }
        .bg-simple-gold-gradient {
            background: linear-gradient(145deg, #f3e5b0, #d6b56a);
        }
        
        /* Custom Scrollbar Styles */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        ::-webkit-scrollbar-track {
            background: rgba(243, 229, 176, 0.2); /* Light amber background */
        }
        ::-webkit-scrollbar-thumb {
            background: linear-gradient(145deg, #f3e5b0, #c5a32c);
            border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(145deg, #f9d976, #b48a02);
        }
        
        /* Wavy Gold Scrollbar */
        .wavy-gold-scrollbar::-webkit-scrollbar {
            width: 12px;
        }
        .wavy-gold-scrollbar::-webkit-scrollbar-track {
            background: rgba(243, 229, 176, 0.2);
            border-radius: 10px;
        }
        .wavy-gold-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(270deg, #c5a32c, #f9d976, #b48a02, #f3e5b0, #c5a32c);
            background-size: 400% 400%;
            animation: wavy-background 4s ease-in-out infinite;
            border-radius: 10px;
            border: 2px solid #fdfaf5;
        }

    </style>
<script type="importmap">
{
  "imports": {
    "react/": "https://esm.sh/react@^19.1.0/",
    "react": "https://esm.sh/react@^19.1.0",
    "react-dom/": "https://esm.sh/react-dom@^19.1.0/",
    "@google/genai": "https://esm.sh/@google/genai@^1.10.0",
    "pdfjs-dist": "https://esm.sh/pdfjs-dist@^5.3.93",
    "mammoth": "https://esm.sh/mammoth@^1.9.1",
    "jszip": "https://esm.sh/jszip@^3.10.1",
    "file-saver": "https://esm.sh/file-saver@^2.0.5"
  }
}
</script>
</head>
<body class="text-stone-800">
    <div id="root"></div>
    <script type="module" src="index.tsx"></script>
</body>
</html>
`;

const metadataJsonContent = `
{
  "name": "Lord of the Chatbot",
  "description": "A powerful, multi-tenant platform to create, manage, and embed your own AI-powered chatbots. Each bot has its own knowledge base and can be deployed on any website.",
  "requestFramePermissions": [
    "microphone"
  ],
  "prompt": ""
}
`;


// --- Helper Components ---
const Modal: React.FC<{ children: React.ReactNode; onClose: () => void; title: string }> = ({ children, onClose, title }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-auto ring-1 ring-amber-300 flex flex-col max-h-[90vh]" 
            onClick={(e) => e.stopPropagation()}
        >
            <h2 className="text-2xl font-bold text-amber-800 p-6 sm:p-8 pb-4 text-center flex-shrink-0 border-b border-amber-200">{title}</h2>
            <div className="overflow-y-auto wavy-gold-scrollbar p-6 sm:p-8 pt-6">
                {children}
            </div>
        </div>
    </div>
);

const EmbedCodeModal: React.FC<{ botId: string; onClose: () => void }> = ({ botId, onClose }) => {
    const [copied, setCopied] = useState(false);
    const embedUrl = `${window.location.origin}${window.location.pathname}?botId=${botId}`;
    const embedCode = `<iframe src="${embedUrl}" width="450" height="750" style="border:none; border-radius: 1rem;" title="Lord of the Chatbot"></iframe>`;

    const handleCopy = () => {
        navigator.clipboard.writeText(embedCode).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <Modal onClose={onClose} title="Embed Bot Code">
            <p className="text-lg mb-4 text-stone-700 text-center">
                Copy this iframe code and paste it into your website's HTML to display this bot.
            </p>
            <div className="bg-stone-800 text-stone-100 p-4 rounded-lg font-mono text-sm relative" dir="ltr">
                {embedCode}
                <button onClick={handleCopy} className="absolute top-2 right-2 p-2 rounded-md bg-stone-700 hover:bg-stone-600">
                    {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <ClipboardIcon className="w-5 h-5" />}
                </button>
            </div>
             <div className="text-center mt-8">
                <button onClick={onClose} className="px-10 py-3 bg-amber-600 text-white text-lg font-bold rounded-full hover:bg-amber-700 transition-colors">
                    Close
                </button>
            </div>
        </Modal>
    );
};

// --- Knowledge Management View ---
interface ProcessedFile { name: string; text: string; }
const KnowledgeManager: React.FC<{ bot: Bot; onBack: () => void }> = ({ bot, onBack }) => {
    const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
    const [parsingFiles, setParsingFiles] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    
    useEffect(() => {
        if (bot.knowledge?.files) {
            setProcessedFiles(bot.knowledge.files.map(name => ({name, text: '...'})));
        }
    }, [bot]);

    const extractTextFromLocalFile = async (file: File): Promise<string> => {
        const mimeType = file.type;
        const arrayBuffer = await file.arrayBuffer();

        if (mimeType === 'application/pdf') {
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                // @ts-ignore
                fullText += content.items.map(item => item.str).join(' ') + '\n';
            }
            return fullText;
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth.extractRawText({ arrayBuffer });
            return result.value;
        }
        throw new Error(`File type ${mimeType} is not supported.`);
    };

     const processFile = useCallback(async (file: File) => {
        if (processedFiles.some(pf => pf.name === file.name) || parsingFiles.includes(file.name)) return;
        setParsingFiles(prev => [...prev, file.name]);
        try {
            const text = await extractTextFromLocalFile(file);
            setProcessedFiles(prev => [...prev.filter(pf => pf.text !== '...'), { name: file.name, text }]);
        } catch (error) {
            alert(`Error processing file ${file.name}: ${(error as Error).message}`);
        } finally {
            setParsingFiles(prev => prev.filter(name => name !== file.name));
        }
    }, [processedFiles, parsingFiles]);

    const handleFileSelection = (files: FileList | null) => files && Array.from(files).forEach(processFile);
    const handleRemoveFile = (fileName: string) => setProcessedFiles(prev => prev.filter(f => f.name !== fileName));
    
    const handleUpdateKnowledge = async () => {
        const texts = processedFiles.flatMap(f => f.text.split(/\n\s*\n+/).map(c => c.trim()).filter(c => c.length > 20));
        if (texts.length === 0) {
            alert('No valid content to save. Ensure files contain text.');
            return;
        }
        
        const newKnowledge: Knowledge = {
            texts,
            files: processedFiles.map(f => f.name),
        };

        setIsUploading(true);
        try {
            await updateBotKnowledge(bot.id, newKnowledge);
            alert("Knowledge base updated successfully!");
            onBack();
        } catch (error) {
            alert(`Failed to update knowledge base: ${(error as Error).message}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div>
            <button onClick={onBack} className="flex items-center gap-2 text-amber-800 hover:text-amber-600 font-semibold mb-6">
                <ChevronLeftIcon className="w-5 h-5"/>
                <span>Back to Bot List</span>
            </button>
            <h2 className="text-3xl font-bold text-black mb-1">Manage Knowledge for: <span className="text-amber-700">{bot.name}</span></h2>
            <p className="text-lg text-stone-700 mt-2 mb-8">Upload PDF and Word files to feed data to this bot.</p>

            {/* File Upload UI */}
             <div className="space-y-8 max-w-2xl mx-auto">
                <div className="text-center p-10 border-2 border-dashed border-amber-600/30 bg-black/5 rounded-2xl">
                    <label htmlFor="file-upload" className="inline-flex items-center justify-center gap-4 px-8 py-4 text-xl font-bold rounded-full transition-all duration-300 transform hover:scale-105 bg-wavy-gold-button text-black shadow-lg cursor-pointer">
                        <UploadIcon className="h-8 w-8" /> <span>Choose Files</span>
                    </label>
                    <p className="text-sm text-stone-600 mt-3">(PDF and DOCX files are supported)</p>
                    <input id="file-upload" type="file" multiple className="hidden" onChange={(e) => handleFileSelection(e.target.files)} accept=".pdf,.docx" disabled={parsingFiles.length > 0 || isUploading} />
                </div>

                {parsingFiles.length > 0 && <div className="text-center text-stone-700 animate-pulse">Parsing: {parsingFiles.join(', ')}...</div>}

                {processedFiles.length > 0 && (
                    <div className="bg-black/5 p-4 rounded-lg border border-amber-600/20">
                        <h3 className="flex items-center gap-2 text-lg font-semibold mb-3 text-amber-900"><DocumentTextIcon /><span>Processed Files</span></h3>
                        <div className="space-y-2">
                            {processedFiles.map((file, index) => (
                                <div key={index} className="flex items-center justify-between bg-black/5 p-2 rounded-md text-stone-800 border border-amber-600/10">
                                    <p className="truncate pr-2 font-mono" title={file.name}>{file.name}</p>
                                    <button onClick={() => handleRemoveFile(file.name)} className="p-1 text-red-700 hover:bg-red-300/50 rounded-full" aria-label={`Remove ${file.name}`}><TrashIcon className="h-4 w-4" /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                <div className="text-center pt-4 border-t border-amber-600/20 mt-8">
                    <button onClick={handleUpdateKnowledge} className="flex items-center justify-center gap-3 w-full sm:w-auto px-10 py-4 text-xl font-bold rounded-full transition-all bg-wavy-gold-button text-black shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" disabled={parsingFiles.length > 0 || processedFiles.length === 0 || isUploading}>
                        {isUploading ? <SpinnerIcon className="h-8 w-8" /> : <CheckCircleIcon className="h-8 w-8" />}
                        <span>{isUploading ? 'Saving...' : 'Save Knowledge Base'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdminPage: React.FC = () => {
    const [view, setView] = useState<'list' | 'knowledge'>('list');
    const [bots, setBots] = useState<Omit<Bot, 'knowledge'>[]>([]);
    const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [downloadingBotId, setDownloadingBotId] = useState<string | null>(null);
    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
    
    const fetchBotsList = useCallback(async () => {
        setIsLoading(true);
        try {
            const botList = await getBots();
            setBots(botList);
        } catch (err) {
            setError('Failed to load the bot list. Make sure the backend server is running.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (view === 'list') {
             fetchBotsList();
        }
    }, [view, fetchBotsList]);
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleCloseCreateModal = () => {
        setIsCreateModalOpen(false);
        setImagePreview(null);
    };

    const handleCreateBot = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get('botName') as string;
        const welcome_message = formData.get('welcomeMessage') as string;
        const initialKnowledgeText = formData.get('initialKnowledge') as string;
        const image_base64 = imagePreview;
        const wavy_color = formData.get('wavyColor') as string;

        if (!name || !welcome_message) {
            alert('Please fill in the bot name and welcome message.');
            return;
        }

        let initialKnowledge: Knowledge | undefined = undefined;
        if (initialKnowledgeText && initialKnowledgeText.trim()) {
            const texts = initialKnowledgeText.split(/\n\s*\n+/).map(t => t.trim()).filter(Boolean);
            if (texts.length > 0) {
                 initialKnowledge = { texts, files: [] };
            }
        }
        
        try {
            await createBot({ name, welcome_message, knowledge: initialKnowledge, image_base64, wavy_color });
            handleCloseCreateModal();
            fetchBotsList();
        } catch (err) {
            alert(`Failed to create bot: ${(err as Error).message}`);
        }
    };

    const handleDeleteBot = async (botId: string) => {
        if (window.confirm("Are you sure you want to delete this bot? This action cannot be undone.")) {
            try {
                await deleteBot(botId);
                fetchBotsList();
            } catch (err) {
                alert(`Failed to delete bot: ${(err as Error).message}`);
            }
        }
    };
    
    const handleManageKnowledge = (bot: Omit<Bot, 'knowledge'>) => {
        setSelectedBot(bot as Bot);
        setView('knowledge');
    };

    const handleShowEmbed = (bot: Omit<Bot, 'knowledge'>) => {
        setSelectedBot(bot as Bot);
        setIsEmbedModalOpen(true);
    };

    const handleBackup = async () => {
        if (isBackingUp) return;
        setIsBackingUp(true);
        try {
            await backupDatabase();
        } catch (err) {
            alert(`Failed to create backup: ${(err as Error).message}`);
        } finally {
            setIsBackingUp(false);
        }
    };

    const handleDownloadBot = async (botId: string) => {
        setDownloadingBotId(botId);
        try {
            const bot = await getBot(botId);
            if (!bot) throw new Error("Bot not found");

            const zip = new JSZip();

            const readmeContent = `# Standalone AI Chatbot

This folder contains your generated standalone AI chatbot, "${bot.name}", powered by Google Gemini.

## 🚀 Quick Start

1.  **Add your API Key:**
    *   Open the \`config.js\` file in a text editor.
    *   Paste your Google AI API Key into the \`API_KEY\` constant.
    *   You can get a key from [Google AI Studio](https://aistudio.google.com/app/apikey).
    *   **IMPORTANT:** Without a valid API key, the chatbot will not work.

2.  **Run Locally:**
    *   This project uses modern JavaScript modules (ESM), so you need a simple local web server to run it. You cannot just open \`index.html\` from the filesystem.
    *   If you have Python 3, navigate to this folder in your terminal and run: \`python -m http.server\`
    *   Then, open your browser and go to \`http://localhost:8000\`.

3.  **Deploy:**
    *   To deploy this chatbot, simply upload all the files and folders from this zip to any static web hosting service (like Vercel, Netlify, GitHub Pages, etc.).

## ⚙️ Configuration

All of your bot's settings (name, welcome message, knowledge base, colors, etc.) are stored in \`bot.json\`. You can edit this file directly to make changes.`;
            
            const configJsContent = `// IMPORTANT: Paste your Google AI API Key here
// You can get one from https://aistudio.google.com/app/apikey
export const API_KEY = "PASTE_YOUR_GOOGLE_AI_API_KEY_HERE";
`;
            const standaloneIndexTsxContent = `import React from 'react';
import ReactDOM from 'react-dom/client';
import BotClient from './BotClient';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BotClient />
  </React.StrictMode>
);`;
            
            // Modify templates
            const standaloneIndexHtml = indexHtmlContent.replace(/<title>.*<\/title>/, `<title>${bot.name}</title>`);
            
            const standaloneBotClient = botClientTsxContent
                .replace(`import { getBot } from './services/databaseService';`, "")
                .replace(/interface BotClientProps[^}]+}/s, "")
                .replace(`const BotClient: React.FC<BotClientProps> = ({ botId }) => {`, `const BotClient: React.FC = () => {`)
                .replace(/useEffect\(\s*()?\s*=>\s*{[^}]*fetchBotData\(\);[^}]*},\s*\[botId\]\s*\);/s, `useEffect(() => {
        const fetchBotData = async () => {
            setView('loading');
            try {
                // For standalone bot, fetch config from local JSON file
                const response = await fetch('./bot.json');
                if (!response.ok) throw new Error('Could not load bot.json. Make sure the file is in the same directory.');
                const fetchedBot = await response.json();
                setBot(fetchedBot);
                setView('bot');
            } catch (err: any) {
                console.error("Failed to fetch bot data:", err);
                setError("Could not load bot data. Please check bot.json and ensure the server is running.");
                setView('error');
            }
        };

        fetchBotData();
    }, []);`);

            const standaloneGeminiService = geminiServiceTsContent
                .replace(`import { GoogleGenAI, Type } from "@google/genai";`, `import { GoogleGenAI, Type } from "@google/genai";\nimport { API_KEY } from '../config';`)
                .replace(/const getAiClient = \(\): GoogleGenAI => {[^}]+};/s, `let ai: GoogleGenAI | null = null;
const getAiClient = (): GoogleGenAI => {
    if (ai) {
        return ai;
    }

    if (!API_KEY || API_KEY.includes("PASTE_YOUR")) {
         const errorMsg = "Google AI API Key not found. Please add it to config.js.";
         console.error(errorMsg);
         throw new Error(errorMsg);
    }
    ai = new GoogleGenAI({ apiKey: API_KEY });
    return ai;
};`);
                
            const filesToZip = {
                'bot.json': JSON.stringify(bot, null, 2),
                'config.js': configJsContent,
                'README.md': readmeContent,
                'index.html': standaloneIndexHtml,
                'index.tsx': standaloneIndexTsxContent,
                'BotClient.tsx': standaloneBotClient,
                'metadata.json': metadataJsonContent,
                'types.ts': typesTsContent,
                'VoiceExperience.tsx': voiceExperienceTsxContent,
                'hooks/useVoiceAssistant.ts': useVoiceAssistantTsContent,
                'services/geminiService.ts': standaloneGeminiService,
                'components/CallControlButton.tsx': callControlButtonTsxContent,
                'components/ChatInput.tsx': chatInputTsxContent,
                'components/ChatMessage.tsx': chatMessageTsxContent,
                'components/Icons.tsx': iconsTsxContent,
                'components/StatusIndicator.tsx': statusIndicatorTsxContent,
            };

            for (const [path, content] of Object.entries(filesToZip)) {
                zip.file(path, content);
            }

            const blob = await zip.generateAsync({ type: 'blob' });
            saveAs(blob, `${bot.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.zip`);

        } catch (error) {
            console.error("Failed to download bot:", error);
            alert(`Could not download bot. See console for details: ${(error as Error).message}`);
        } finally {
            setDownloadingBotId(null);
        }
    };


    if (isLoading && view === 'list') {
        return <div className="flex items-center justify-center min-h-screen bg-stone-50"><SpinnerIcon className="w-16 h-16 text-amber-700"/></div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-600 bg-red-100 min-h-screen">{error}</div>;
    }
    
    if (view === 'knowledge' && selectedBot) {
        return (
             <div className="p-4 sm:p-8 my-4 bg-stone-50 min-h-screen">
                <KnowledgeManager bot={selectedBot} onBack={() => { setView('list'); setSelectedBot(null); }} />
             </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 my-4 bg-stone-50 min-h-screen">
            <header className="flex flex-col sm:flex-row justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-black font-cinzel">Lord of the Chatbot</h1>
                    <p className="text-lg text-stone-700 mt-2">
                        Create and manage your AI voice assistants.
                    </p>
                </div>
                <div className="flex items-center gap-4 mt-4 sm:mt-0">
                    <button
                        onClick={handleBackup}
                        disabled={isBackingUp}
                        className="flex items-center justify-center gap-2 px-4 py-3 text-lg font-bold rounded-full transition-all transform hover:scale-105 bg-stone-100 text-amber-800 border-2 border-amber-600 shadow-md disabled:opacity-50 disabled:cursor-wait"
                        title="Download a backup of the database"
                    >
                        {isBackingUp ? <SpinnerIcon className="w-5 h-5" /> : <DownloadIcon className="w-5 h-5"/>}
                        <span className="hidden sm:inline">{isBackingUp ? "Working..." : "Backup"}</span>
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3 text-lg font-bold rounded-full transition-all transform hover:scale-105 bg-wavy-gold-button text-black shadow-lg"
                    >
                        <PlusIcon />
                        <span>New Bot</span>
                    </button>
                </div>
            </header>
            
            <div className="mb-8">
                <ApiKeyManager />
            </div>

            <div className="bg-white shadow-lg rounded-2xl overflow-hidden ring-1 ring-amber-200">
                <div className="overflow-x-auto">
                    <div className="min-w-[700px]">
                        <div className="grid grid-cols-12 text-sm font-bold text-amber-900 bg-amber-50 p-4 border-b border-amber-200 uppercase tracking-wider">
                            <div className="col-span-3">Bot Name</div>
                            <div className="col-span-2">Admin Pass</div>
                            <div className="col-span-3">Last Updated</div>
                            <div className="col-span-4 text-center">Actions</div>
                        </div>
                        <div className="divide-y divide-amber-100 max-h-[60vh] overflow-y-auto wavy-gold-scrollbar pr-2">
                            {bots.length === 0 ? (
                                <div className="text-center p-8">
                                    <PlatformLogoIcon className="h-24 w-24 mx-auto mb-4 opacity-70" />
                                    <h3 className="text-2xl font-bold text-stone-800 font-cinzel">No Assistants Forged Yet</h3>
                                    <p className="mt-2 mb-6 text-stone-600 max-w-md mx-auto">It looks like your forge is quiet. It's time to create your first intelligent assistant!</p>
                                    <button
                                        onClick={() => setIsCreateModalOpen(true)}
                                        className="flex items-center justify-center gap-2 px-6 py-3 mx-auto text-lg font-bold rounded-full transition-all transform hover:scale-105 bg-wavy-gold-button text-black shadow-lg"
                                    >
                                        <PlusIcon />
                                        <span>Forge a New Bot</span>
                                    </button>
                                </div>
                            ) : (
                                (bots as Bot[]).map(bot => (
                                    <div key={bot.id} className="grid grid-cols-12 items-center p-4 hover:bg-amber-50/50 transition-colors">
                                        <p className="col-span-3 font-semibold text-stone-800 text-lg truncate pr-2" title={bot.name}>{bot.name}</p>
                                        <p className="col-span-2 font-mono text-sm text-blue-700 bg-blue-100 px-2 py-1 rounded-md inline-block">{bot.admin_pass}</p>
                                        <p className="col-span-3 text-sm text-stone-600">{new Date(bot.updated_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                        <div className="col-span-4 flex justify-center items-center gap-1 sm:gap-2">
                                            <button onClick={() => handleManageKnowledge(bot)} className="px-3 py-1.5 text-xs sm:text-sm rounded-full bg-amber-100 text-amber-800 hover:bg-amber-200 transition">Manage Knowledge</button>
                                            <button onClick={() => handleShowEmbed(bot)} className="p-2 rounded-full hover:bg-blue-100 text-blue-700 transition" aria-label="Embed Code"><CodeIcon className="w-5 h-5"/></button>
                                            <button onClick={() => handleDownloadBot(bot.id)} disabled={downloadingBotId === bot.id} className="p-2 rounded-full hover:bg-green-100 text-green-700 transition disabled:opacity-50 disabled:cursor-wait" aria-label="Download Bot">
                                                {downloadingBotId === bot.id ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <DownloadIcon className="w-5 h-5"/>}
                                            </button>
                                            <button onClick={() => handleDeleteBot(bot.id)} className="p-2 rounded-full hover:bg-red-100 text-red-700 transition" aria-label="Delete Bot"><TrashIcon className="w-5 h-5"/></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {isCreateModalOpen && (
                <Modal onClose={handleCloseCreateModal} title="Create New Bot">
                    <form onSubmit={handleCreateBot} className="space-y-6">
                        <div>
                            <label htmlFor="botName" className="block text-lg font-medium text-stone-700 mb-2">Bot Name</label>
                            <input type="text" name="botName" id="botName" required className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"/>
                        </div>
                         <div>
                            <label htmlFor="botImage" className="block text-lg font-medium text-stone-700 mb-2">Bot Image (for Icon & Welcome)</label>
                            <div className="mt-2 flex items-center gap-4">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Bot preview" className="w-16 h-16 rounded-full object-cover border-2 border-amber-300" />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-stone-200 flex items-center justify-center text-stone-500">
                                        <UserIcon className="w-8 h-8"/>
                                    </div>
                                )}
                                <input type="file" name="botImage" id="botImage" accept="image/png, image/jpeg, image/gif" onChange={handleImageChange} className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer"/>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="wavyColor" className="block text-lg font-medium text-stone-700 mb-2">Bot Color Theme</label>
                            <select name="wavyColor" id="wavyColor" className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors">
                                {colorOptions.map(opt => (
                                    <option key={opt.name} value={opt.value}>{opt.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="welcomeMessage" className="block text-lg font-medium text-stone-700 mb-2">Welcome Message</label>
                            <textarea name="welcomeMessage" id="welcomeMessage" rows={3} required className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"></textarea>
                        </div>
                        <div>
                            <label htmlFor="initialKnowledge" className="block text-lg font-medium text-stone-700 mb-2">Initial Knowledge Base (Optional)</label>
                             <textarea name="initialKnowledge" id="initialKnowledge" rows={5} placeholder="Paste text here. Separate paragraphs with a blank line..." className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"></textarea>
                        </div>
                        <div className="text-center pt-4">
                            <button type="submit" className="px-12 py-4 bg-wavy-gold-button text-black text-xl font-bold rounded-full hover:shadow-lg transition-shadow shadow-md transform hover:scale-105">
                                Create Bot
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {isEmbedModalOpen && selectedBot && (
                <EmbedCodeModal botId={selectedBot.id} onClose={() => setIsEmbedModalOpen(false)} />
            )}
        </div>
    );
};

export default AdminPage;