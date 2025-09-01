import React from 'react';
import type { Folder, Selection } from '../App';
import { HomeIcon, NewspaperIcon, CpuChipIcon, TrophyIcon, RedditIcon, YoutubeIcon } from './icons';

interface BottomNavBarProps {
    folders: Folder[];
    selection: Selection;
    onSelect: (selection: Selection) => void;
}

const FolderIcon: React.FC<{ folderName: string }> = ({ folderName }) => {
    const name = folderName.toLowerCase();
    if (name.includes('news')) return <NewspaperIcon className="w-6 h-6" />;
    if (name.includes('tech')) return <CpuChipIcon className="w-6 h-6" />;
    if (name.includes('sport')) return <TrophyIcon className="w-6 h-6" />;
    return <HomeIcon className="w-6 h-6" />;
};

const NavItem: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {
    const activeClass = isActive ? 'text-orange-400' : 'text-zinc-400';
    return (
        <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-colors hover:text-white ${activeClass}`}>
            {icon}
            <span className="text-xs font-medium">{label}</span>
        </button>
    );
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ folders, selection, onSelect }) => {
    const sportFolder = folders.find(f => f.name.toLowerCase() === 'sport');

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-zinc-900/80 backdrop-blur-lg border-t border-zinc-700/50 z-50 md:hidden">
            <div className="flex justify-around items-center h-full max-w-md mx-auto px-2">
                <NavItem 
                    label="Home" 
                    icon={<HomeIcon className="w-6 h-6" />}
                    isActive={selection.type === 'all'}
                    onClick={() => onSelect({ type: 'all', id: null })}
                />
                {sportFolder && (
                    <NavItem 
                        key={sportFolder.id}
                        label={sportFolder.name}
                        icon={<FolderIcon folderName={sportFolder.name} />}
                        isActive={selection.type === 'folder' && selection.id === sportFolder.id}
                        onClick={() => onSelect({ type: 'folder', id: sportFolder.id })}
                    />
                )}
                <NavItem
                    label="Reddit"
                    icon={<RedditIcon className="w-6 h-6" />}
                    isActive={selection.type === 'reddit'}
                    onClick={() => onSelect({ type: 'reddit', id: null })}
                />
                <NavItem 
                    label="YouTube" 
                    icon={<YoutubeIcon className="w-6 h-6" />}
                    isActive={selection.type === 'youtube'}
                    onClick={() => onSelect({ type: 'youtube', id: null })}
                />
            </div>
        </nav>
    );
};

export default BottomNavBar;