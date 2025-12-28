import React from 'react';
import type { Feed, Folder, Selection } from '../src/App';
import type { SourceType } from './AddSource';
import AddSource from './AddSource';
import {
    VoidIcon, ListIcon, PlusIcon, TrashIcon, FolderIcon, BookmarkIcon, SettingsIcon, ControllerIcon, XIcon, SparklesIcon
} from './icons';
import { SmartFeedIcon } from './SmartFeedIcon';

interface SidebarProps {
    feeds: Feed[];
    folders: Folder[];
    selection: Selection;
    onAddSource: (url: string, type: SourceType) => Promise<void>;
    onRemoveFeed: (id: number) => void;
    onSelect: (selection: Selection) => void;
    onAddFolder: (name: string) => void;
    onRenameFolder: (id: number, newName: string) => void;
    onDeleteFolder: (id: number) => void;
    onMoveFeedToFolder: (feedId: number, folderId: number | null) => void;
    isSidebarOpen: boolean;
    onClose: () => void;
    onOpenSettings: () => void;
    credits: number;
    onOpenShop: () => void;
}

const Sidebar: React.FC<SidebarProps> = (props) => {
    const { feeds, folders, selection, onAddSource, onRemoveFeed, onSelect, onAddFolder, isSidebarOpen, onClose, onOpenSettings, credits, onOpenShop } = props;
    
    const NavItem: React.FC<{sel: Selection, label: string, icon: React.ReactNode}> = ({sel, label, icon}) => {
        const isActive = selection.type === sel.type && (sel.id === null || selection.id === sel.id);
        
        return (
            <div 
                onClick={() => onSelect(sel)} 
                className={`group relative flex items-center space-x-4 px-5 py-4 rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden
                    ${isActive 
                        ? 'bg-pulse-600 text-white shadow-lg scale-[1.02] z-10' 
                        : 'hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'}`}
            >
                {/* Active Indicator Bar */}
                {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-white rounded-r-full shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-pulse" />
                )}
                
                <div className={`p-2.5 rounded-xl transition-colors duration-300 ${isActive ? 'bg-white/20' : 'bg-zinc-800 group-hover:bg-zinc-700'}`}>
                    {icon}
                </div>
                <span className={`truncate uppercase tracking-widest min-w-0 transition-all duration-300 font-black text-xs`}>
                    {label}
                </span>
            </div>
        )
    };

    return (
        <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-zinc-950 border-r border-zinc-900 flex flex-col h-full transform transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl md:shadow-none pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]`}>
            <div className="p-6 flex-shrink-0">
                <div className="flex items-center justify-between space-x-2 mb-10">
                    <div className="flex items-center space-x-4">
                        <div className="p-1.5 bg-pulse-500 rounded-xl shadow-[0_0_15px_rgba(225,29,72,0.4)]">
                            <VoidIcon className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-black text-white tracking-tighter uppercase italic leading-none">THE VOID</span>
                            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-[0.4em]">S I G N A L</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 -mr-2 rounded-2xl text-zinc-500 hover:bg-zinc-900 md:hidden">
                        <XIcon className="w-7 h-7" />
                    </button>
                </div>

                {/* SIGNAL CREDITS DISPLAY */}
                <button 
                    onClick={onOpenShop}
                    className="w-full mb-8 p-4 bg-void-900 border border-pulse-500/20 rounded-2xl flex items-center gap-4 group hover:border-pulse-500/50 transition-all cursor-pointer shadow-lg relative overflow-hidden active:scale-95"
                >
                    <div className="absolute inset-0 bg-pulse-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    <div className="p-2 bg-pulse-500/10 rounded-lg">
                        <SparklesIcon className="w-5 h-5 text-pulse-500 animate-pulse" />
                    </div>
                    <div className="text-left">
                        <span className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em] block mb-0.5 italic">Frequency Assets</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-black text-white italic tracking-tighter leading-none">{credits.toLocaleString()}</span>
                            <span className="text-[9px] font-black text-pulse-500 uppercase tracking-tighter italic">SC</span>
                        </div>
                    </div>
                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                         <div className="text-[8px] font-black text-pulse-500 uppercase italic">SHOP</div>
                    </div>
                </button>
                
                <AddSource onAddSource={onAddSource} />
            </div>
            
            <div className="flex-grow overflow-y-auto px-6 space-y-3 scrollbar-hide pb-12">
                <NavItem sel={{type: 'game_hub', id: null}} label="The Arcade" icon={<ControllerIcon className="w-5 h-5 flex-shrink-0" />} />
                <NavItem sel={{type: 'all', id: null}} label="Frequency" icon={<ListIcon className="w-5 h-5 flex-shrink-0" />} />
                <NavItem sel={{type: 'bookmarks', id: 'bookmarks'}} label="Saved Signals" icon={<BookmarkIcon className="w-5 h-5 flex-shrink-0" />} />
                
                <div className="pt-8 pb-3 border-t border-zinc-900/50 mt-6">
                    <div className="flex items-center justify-between px-3 mb-5">
                        <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Zones</h3>
                        <button onClick={() => onAddFolder("New Zone")} className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-500 transition-colors">
                            <PlusIcon className="w-5 h-5" />
                        </button>
                    </div>
                    <nav className="space-y-2">
                        {folders.map(folder => {
                            const isActive = selection.type === 'folder' && selection.id === folder.id;
                            return (
                                <div 
                                    key={folder.id} 
                                    onClick={() => onSelect({type: 'folder', id: folder.id})} 
                                    className={`relative flex items-center gap-4 px-5 py-3 rounded-xl cursor-pointer transition-all duration-300 group
                                        ${isActive 
                                            ? 'bg-pulse-600 text-white shadow-md scale-[1.01]' 
                                            : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'}`}
                                >
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full" />
                                    )}
                                    <FolderIcon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-zinc-600 group-hover:text-zinc-400'}`} />
                                    <span className={`text-xs uppercase truncate transition-all font-black`}>
                                        {folder.name}
                                    </span>
                                </div>
                            );
                        })}
                    </nav>
                </div>

                <div className="pt-8 pb-3">
                    <div className="flex items-center justify-between px-3 mb-5">
                        <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Streams</h3>
                    </div>
                    <nav className="space-y-2">
                        {feeds.map(feed => {
                            const isActive = selection.type === 'feed' && selection.id === feed.id;
                            return (
                                <div 
                                    key={feed.id} 
                                    onClick={() => onSelect({type: 'feed', id: feed.id})} 
                                    className={`relative flex items-center gap-4 px-5 py-3 rounded-xl cursor-pointer transition-all duration-300 group
                                        ${isActive 
                                            ? 'bg-pulse-600 text-white shadow-md scale-[1.01]' 
                                            : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'}`}
                                >
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full" />
                                    )}
                                    <SmartFeedIcon 
                                        iconUrl={feed.iconUrl} 
                                        feedTitle={feed.title} 
                                        sourceType={feed.sourceType} 
                                        className={`w-4.5 h-4.5 transition-all ${isActive ? 'grayscale-0' : 'grayscale group-hover:grayscale-0'}`} 
                                    />
                                    <span className={`text-xs uppercase truncate leading-none transition-all font-black`}>
                                        {feed.title}
                                    </span>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onRemoveFeed(feed.id); }}
                                        className={`ml-auto p-1.5 rounded-lg transition-all ${isActive ? 'text-white/40 hover:text-white' : 'opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-500'}`}
                                        title="Eject Source"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </nav>
                </div>
            </div>
            
            <div className="p-6 mt-auto flex-shrink-0 bg-zinc-950 border-t border-zinc-900">
                <button onClick={onOpenSettings} className="w-full flex items-center gap-4 py-4 px-5 text-xs font-black uppercase tracking-widest rounded-2xl text-zinc-500 bg-zinc-900 hover:bg-zinc-800 hover:text-white transition-all">
                    <SettingsIcon className="w-5 h-5" />
                    <span>Diagnostics</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;