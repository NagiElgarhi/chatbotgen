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
        <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${getStatusStyle()}`}>
            {getStatusIcon()}
        </div>
    );
};