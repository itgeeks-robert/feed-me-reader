import React from 'react';
import type { Selection } from '../src/App';
import { PlusIcon, ArrowPathIcon } from './icons';

interface NavPage {
    selection: Selection;
    name: string;
    icon: React.ReactNode;
}

interface BottomNavBarProps {
    pages: NavPage[];
    currentPageIndex: number;
    onNavigate: (index: number) => void;
    onAddSource: () => void;
    onRefresh: () => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ pages, currentPageIndex, onNavigate, onAddSource, onRefresh }) => {
    
    const navItems = pages.slice(0, 3); // Show first 3 main pages

    return (
        <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 md:hidden w-[calc(100%-2rem)] max-w-sm">
            <div className="h-16 bg-white/50 dark:bg-zinc-900/60 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl shadow-lg flex items-center justify-around px-2">
                {navItems.map((page, index) => (
                    <button 
                        key={page.name}
                        onClick={() => onNavigate(index)}
                        className={`flex flex-col items-center justify-center w-16 h-12 rounded-lg transition-colors ${currentPageIndex === index ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5'}`}
                    >
                        {page.icon}
                        <span className="text-[10px] font-medium mt-1">{page.name}</span>
                    </button>
                ))}
                 <button 
                    onClick={onRefresh}
                    className="flex flex-col items-center justify-center w-16 h-12 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                    <ArrowPathIcon className="w-6 h-6" />
                    <span className="text-[10px] font-medium mt-1">Refresh</span>
                </button>
            </div>
        </footer>
    );
};

export default BottomNavBar;
