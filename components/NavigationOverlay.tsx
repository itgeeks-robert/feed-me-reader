import React from 'react';
// FIX: Corrected import path for App types
import type { Selection } from '../src/App';
import { XIcon, ListIcon, TrophyIcon, RedditIcon, YoutubeIcon, SettingsIcon, ArrowsRightLeftIcon } from './icons';

interface NavPage {
    selection: Selection;
    name: string;
    icon: React.ReactNode;
}

interface NavigationOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    pages: NavPage[];
    currentPageIndex: number;
    onNavigate: (index: number) => void;
    onOpenSidebar: () => void;
    onOpenSettings: () => void;
}

const NavigationOverlay: React.FC<NavigationOverlayProps> = ({ isOpen, onClose, pages, currentPageIndex, onNavigate, onOpenSidebar, onOpenSettings }) => {
    if (!isOpen) return null;

    const handleNavigate = (index: number) => {
        onNavigate(index);
        onClose();
    };
    
    const handleOpenSidebar = () => {
        onOpenSidebar();
        onClose();
    };

    const handleOpenSettings = () => {
        onOpenSettings();
        onClose();
    }

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
            onClick={onClose}
        >
            <div 
                className="absolute inset-y-0 left-0 w-full max-w-sm bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-lg border-r border-zinc-300/80 dark:border-zinc-700/50 shadow-2xl p-6 flex flex-col transition-transform duration-300 ease-in-out"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-center justify-end mb-8">
                    <button onClick={onClose} className="p-2 rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 -mr-2" aria-label="Close menu">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>
                
                <nav className="flex-grow flex flex-col space-y-4">
                    {pages.map((page, index) => (
                        <button
                            key={page.name}
                            onClick={() => handleNavigate(index)}
                            className={`flex items-center gap-4 p-4 rounded-lg text-left text-lg font-semibold transition-colors duration-200 ${
                                index === currentPageIndex
                                    ? 'bg-orange-100 dark:bg-orange-600/30 text-orange-700 dark:text-orange-300'
                                    : 'text-zinc-800 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
                            }`}
                        >
                            {page.icon}
                            <span>{page.name}</span>
                        </button>
                    ))}
                </nav>

                <footer className="mt-auto pt-6 border-t border-zinc-300/80 dark:border-zinc-700/50 space-y-3">
                    <button onClick={handleOpenSidebar} className="w-full flex items-center gap-3 py-3 px-4 text-base font-medium rounded-md text-zinc-600 dark:text-zinc-400 bg-zinc-200/50 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors">
                        <ArrowsRightLeftIcon className="w-6 h-6" />
                        <span>Manage Feeds</span>
                    </button>
                    <button onClick={handleOpenSettings} className="w-full flex items-center gap-3 py-3 px-4 text-base font-medium rounded-md text-zinc-600 dark:text-zinc-400 bg-zinc-200/50 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors">
                        <SettingsIcon className="w-6 h-6" />
                        <span>Settings</span>
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default NavigationOverlay;