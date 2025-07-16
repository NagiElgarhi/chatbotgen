
import React from 'react';

const ContactPage: React.FC = () => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert('Thank you for your message! This is a demo form.');
    };

    return (
        <div className="max-w-4xl mx-auto py-12">
            <h1 className="text-5xl font-cinzel font-bold text-center mb-4 text-amber-900 text-shadow">Reach the Council</h1>
            <p className="text-center text-lg text-stone-600 mb-12">
                We are here to assist you on your quest. Send us a message.
            </p>

            <div className="bg-white/50 p-8 rounded-lg shadow-md border border-amber-200">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-stone-700">Your Name</label>
                            <input type="text" name="name" id="name" required className="mt-1 block w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500" />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-stone-700">Your Email</label>
                            <input type="email" name="email" id="email" required className="mt-1 block w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-stone-700">Subject</label>
                        <input type="text" name="subject" id="subject" required className="mt-1 block w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500" />
                    </div>
                    <div>
                        <label htmlFor="message" className="block text-sm font-medium text-stone-700">Message</label>
                        <textarea name="message" id="message" rows={6} required className="mt-1 block w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"></textarea>
                    </div>
                    <div className="text-center">
                        <button type="submit" className="px-10 py-4 bg-wavy-gold-button text-black text-xl font-bold rounded-full hover:shadow-lg transition-all shadow-md transform hover:scale-105">
                            Send Message
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ContactPage;
