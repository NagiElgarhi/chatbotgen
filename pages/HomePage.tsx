

import React from 'react';

interface HomePageProps {
    onNavigate: (page: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {

    return (
        <div className="text-center py-16 sm:py-24">
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-cinzel font-bold text-shadow leading-tight">
                <span className="block">Lord</span>
                <div className="flex justify-center items-center -my-2 sm:-my-4">
                    <span className="text-4xl sm:text-5xl md:text-6xl bg-wavy-gold-button bg-clip-text text-transparent">of the</span>
                </div>
                <span className="bg-wavy-gold-button bg-clip-text text-transparent">Chatbot</span>
            </h1>
            
            <p className="mt-8 max-w-3xl mx-auto text-lg sm:text-xl text-stone-700 leading-relaxed">
                Welcome to the ultimate platform for creating, managing, and deploying intelligent AI assistants. 
                Whether you need a customer service agent, a product guide, or a specialized knowledge expert, our platform gives you the power to build it with ease.
            </p>

            <div className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-6">
                 <button
                    onClick={() => onNavigate('creations')}
                    className="px-8 py-4 bg-wavy-gold-button text-black text-xl font-bold rounded-full hover:shadow-lg transition-all shadow-md transform hover:scale-105"
                >
                    View Creations
                </button>
                <button
                    onClick={() => onNavigate('products')}
                    className="px-8 py-4 bg-wavy-gold-button-reversed text-black text-xl font-bold rounded-full hover:shadow-lg transition-all shadow-md transform hover:scale-105"
                >
                    View Products
                </button>
            </div>

            <div className="mt-20 max-w-5xl mx-auto grid md:grid-cols-3 gap-8 text-left">
                <div className="bg-white/50 p-6 rounded-lg shadow-md border border-amber-200">
                    <h3 className="text-2xl font-bold font-cinzel text-amber-800">Custom Knowledge</h3>
                    <p className="mt-2 text-stone-600">
                        Feed your chatbot with your own data. Upload PDFs and Word documents, or paste text directly to create a specialized knowledge base for each assistant.
                    </p>
                </div>
                 <div className="bg-white/50 p-6 rounded-lg shadow-md border border-amber-200">
                    <h3 className="text-2xl font-bold font-cinzel text-amber-800">Easy Deployment</h3>
                    <p className="mt-2 text-stone-600">
                        Generate a simple script tag to embed your fully-functional chatbot on any website. Integration is seamless and requires no complex coding.
                    </p>
                </div>
                 <div className="bg-white/50 p-6 rounded-lg shadow-md border border-amber-200">
                    <h3 className="text-2xl font-bold font-cinzel text-amber-800">Secure Management</h3>
                    <p className="mt-2 text-stone-600">
                        Control all your bots from a secure, password-protected admin panel. Manage your AI assistants with confidence and ease.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default HomePage;