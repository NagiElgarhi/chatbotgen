import React, { useState, useEffect } from 'react';
import { CheckIcon } from './Icons';

const API_KEY_STORAGE_ID = 'google_api_key';

export const ApiKeyManager: React.FC = () => {
    const [apiKey, setApiKey] = useState('');
    const [isSaved, setIsSaved] = useState(false);
    const [isKeyPresent, setIsKeyPresent] = useState(false);

    useEffect(() => {
        const storedKey = localStorage.getItem(API_KEY_STORAGE_ID);
        if (storedKey) {
            setApiKey(storedKey);
            setIsKeyPresent(true);
        }
    }, []);

    const handleSave = () => {
        if (!apiKey.trim()) {
            localStorage.removeItem(API_KEY_STORAGE_ID);
            setIsKeyPresent(false);
            alert("API Key removed.");
        } else {
            localStorage.setItem(API_KEY_STORAGE_ID, apiKey.trim());
            setIsKeyPresent(true);
            setIsSaved(true);
            setApiKey(''); // Clear input after save for security
            setTimeout(() => {
                 const storedKey = localStorage.getItem(API_KEY_STORAGE_ID);
                 if(storedKey) setApiKey(storedKey);
                 setIsSaved(false)
            }, 2000);
            alert("API Key saved successfully!");
        }
    };

    return (
        <div className="bg-amber-50/50 p-4 rounded-lg border-2 border-amber-200 shadow-inner">
            <h3 className="text-xl font-bold text-amber-900 mb-2 font-cinzel">Google AI API Key</h3>
            <p className="text-sm text-stone-600 mb-4">
                This key is required for the chatbots to function. It is stored securely in your browser's local storage and is not sent anywhere else.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
                <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API Key here"
                    className="flex-grow px-3 py-2 bg-white border-2 border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                    aria-label="API Key Input"
                />
                <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-amber-600 text-white font-bold rounded-md hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
                >
                    {isSaved ? <CheckIcon className="w-5 h-5" /> : null}
                    {isSaved ? 'Saved!' : 'Save Key'}
                </button>
            </div>
            <div className="mt-3 flex justify-between items-center">
                <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-amber-800 hover:text-amber-600 font-semibold hover:underline"
                >
                    Get your API key from Google AI Studio &rarr;
                </a>
                {isKeyPresent && !isSaved && (
                    <span className="text-sm text-green-700 font-semibold flex items-center gap-1">
                        <CheckIcon className="w-4 h-4" />
                        API Key is set
                    </span>
                )}
            </div>
        </div>
    );
};
