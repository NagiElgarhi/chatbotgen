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
                className={`flex h-full items-center justify-center gap-2 px-4 text-base font-bold transition-colors ${statusStyle}`}
                title={statusText}
            >
                <Icon className="w-5 h-5" />
            </div>
        </div>
    );
};