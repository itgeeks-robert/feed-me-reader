
import React from 'react';
import type { Selection } from '../src/App';
import { ListIcon, SettingsIcon, PlayPauseIcon, VoidIcon } from './icons';

interface BottomNavBarProps {
    selection: Selection;
    onSelect: (selection: Selection) => void;
    onOpenSettings: () => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ selection, onSelect, onOpenSettings }) => {
    const navItems = [
        { type: 'game_hub', label: 'Arcade', icon: <VoidIcon className="w-6 h-6" /> },
        { type: 'all', label: 'Intel', icon: <ListIcon className="w-6 h-6" /> },
        { type: 'utility_hub', label: 'Media', icon: <PlayPauseIcon className="w-6 h-6" /> },
        { type: 'settings', label: 'Terminal', icon: <SettingsIcon className="w-6 h-6" /> },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-void-950/80 backdrop-blur-2xl border-t border-white/5 shadow-2xl pb-[var(--safe-bottom)]">
            <div className="px-6 py-2 flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const isActive = item.type === 'settings' ? false : selection.type === item.type;
                    const handleClick = () => {
                        if (item.type === 'settings') onOpenSettings();
                        else onSelect({ type: item.type as any, id: null });
                    };

                    return (
                        <button
                            key={item.type}
                            onClick={handleClick}
                            className={`flex flex-col items-center gap-1 py-1 transition-all duration-300 ${
                                isActive 
                                    ? 'text-pulse-500 scale-110' 
                                    : 'text-zinc-500 hover:text-white'
                            }`}
                        >
                            <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-pulse-500/10' : ''}`}>
                                {item.icon}
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest italic">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNavBar;
