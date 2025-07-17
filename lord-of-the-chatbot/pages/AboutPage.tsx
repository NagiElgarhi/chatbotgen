
import React from 'react';

const AboutPage: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto py-12">
            <h1 className="text-5xl font-cinzel font-bold text-center mb-4 text-amber-900 text-shadow">Our Quest</h1>
            <p className="text-center text-lg text-stone-600 mb-12">
                Forging the Future of Conversation
            </p>

            <div className="space-y-10 text-stone-800 text-lg leading-relaxed">
                <section>
                    <h2 className="text-3xl font-cinzel font-bold text-amber-800 mb-3 border-b-2 border-amber-200 pb-2">Our Mission</h2>
                    <p>
                        At the heart of "Lord of the Chatbot" lies a simple yet profound mission: to democratize the power of advanced AI. We believe that every creator, business, and visionary should have the tools to build intelligent, engaging, and helpful digital assistants without needing a legion of developers. Our quest is to provide a platform that is not only powerful and versatile but also intuitive and accessible, enabling you to bring your unique conversational AI to life.
                    </p>
                </section>

                <section>
                    <h2 className="text-3xl font-cinzel font-bold text-amber-800 mb-3 border-b-2 border-amber-200 pb-2">Our Vision</h2>
                    <p>
                        We envision a world where technology serves humanity in more personal and meaningful ways. A world where information is not just found, but conversed with. Where customer service is instant, personal, and always helpful. Our platform is the forge where these future companions are crafted. We are constantly exploring the frontiers of AI to ensure that your chatbots are not just tools, but intelligent partners that can learn, adapt, and provide real value.
                    </p>
                </section>

                <section>
                    <h2 className="text-3xl font-cinzel font-bold text-amber-800 mb-3 border-b-2 border-amber-200 pb-2">The Craft</h2>
                    <p>
                        Combining the latest in Large Language Models (LLMs) from Google's Gemini with a robust and scalable architecture, our platform is built for performance and reliability. From the secure SQLite backend that powers your bot's knowledge to the sleek, responsive frontend that your users interact with, every component has been crafted with care and precision. We provide the anvil and the hammer; you bring the vision to shape it.
                    </p>
                </section>
            </div>
        </div>
    );
};

export default AboutPage;
