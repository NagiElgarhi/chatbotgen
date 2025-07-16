
import React from 'react';

interface NavbarProps {
    onNavigate: (page: string) => void;
    currentPage: string;
}

const NavLink: React.FC<{
    page: string;
    currentPage: string;
    onNavigate: (page: string) => void;
    children: React.ReactNode;
}> = ({ page, currentPage, onNavigate, children }) => {
    
    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        onNavigate(page);
    };

    const isActive = currentPage === page;
    const style = `text-lg font-semibold transition-colors cursor-pointer py-2 ${
        isActive
            ? 'text-amber-900 border-b-2 border-amber-800'
            : 'text-stone-700 hover:text-amber-800'
    }`;

    return (
        <a href={`?page=${page}`} onClick={handleLinkClick} className={style}>
            {children}
        </a>
    );
};


const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage }) => {
    
    const handleTitleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        onNavigate('home');
    };

    return (
        <nav className="sticky top-0 bg-white/80 backdrop-blur-md shadow-md z-30">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center py-4">
                    <a href="?page=home" onClick={handleTitleClick} className="text-2xl font-cinzel font-bold text-amber-900 cursor-pointer">
                        Lord <span className="text-xl">of the</span> Chatbot
                    </a>
                    <div className="flex items-center gap-6">
                        <NavLink page="home" currentPage={currentPage} onNavigate={onNavigate}>Home</NavLink>
                        <NavLink page="products" currentPage={currentPage} onNavigate={onNavigate}>Creations</NavLink>
                        <NavLink page="about" currentPage={currentPage} onNavigate={onNavigate}>About Us</NavLink>
                        <NavLink page="contact" currentPage={currentPage} onNavigate={onNavigate}>Contact Us</NavLink>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;