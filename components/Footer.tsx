import React from 'react';
import { WhatsAppIcon } from './Icons';

const Footer: React.FC = () => {
    return (
        <footer className="p-4 border-t border-amber-600/30 flex-shrink-0 bg-stone-100/30">
             <div className="text-center opacity-90 px-4 container mx-auto">
                 <p className="font-cinzel text-sm text-stone-800 select-none text-shadow">
                    Nagiz Smart Solutions © 2025
                </p>
                <div className="flex items-center justify-center gap-2 mt-1.5">
                    <a href="https://wa.me/201066802250" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-stone-700 hover:text-green-600 transition-colors text-sm font-semibold">
                        <WhatsAppIcon className="h-5 w-5 text-green-600"/>
                        <span>Take your Chatbot +20 106 680 2250</span>
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
