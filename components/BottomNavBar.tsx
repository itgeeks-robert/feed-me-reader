import React from 'react';
import type { Selection } from '../src/App';
import { ControllerIcon, ListIcon, BookmarkIcon, SearchIcon } from './icons';

interface BottomNavBarProps {
    selection: Selection;
    onSelect: (selection: Selection) => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ selection, onSelect }) => {
    const navItems = [
        { type: 'game_hub', label: 'Play', icon: <ControllerIcon className="w-6 h-6" /> },
        { type: 'all', label: 'Feeds', icon: <ListIcon className="w-6 h-6" /> },
        { type: 'bookmarks', label: 'Saved', icon: <BookmarkIcon className="w-6 h-6" /> },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden pb-[env(safe-area-inset-bottom)] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border-t border-white/20 dark:border-white/10 shadow-2xl">
            <div className="px-6 py-2 flex justify-around items-center">
                {navItems.map((item) => {
                    const isActive = selection.type === item.type;
                    return (
                        <button
                            key={item.type}
                            onClick={() => onSelect({ type: item.type as any, id: null })}
                            className={`flex flex-col items-center gap-1 py-1 transition-all duration-300 ${
                                isActive 
                                    ? 'text-orange-500 scale-110' 
                                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                        >
                            <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-orange-500/10' : ''}`}>
                                {item.icon}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNavBar;