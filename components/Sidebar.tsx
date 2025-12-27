
import React, { useState } from 'react';
import type { Feed, Folder, Selection } from '../src/App';
import type { SourceType } from './AddSource';
import AddSource from './AddSource';
import { Disclosure, DisclosureButton, DisclosurePanel } from './Disclosure';
import {
    SeymourIcon, ListIcon, PlusIcon, RssIcon, TrashIcon, FolderIcon, PencilIcon, ChevronDownIcon, ChevronRightIcon, XIcon, BookmarkIcon, SettingsIcon, RedditIcon, GlobeAltIcon, ControllerIcon
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
}

const Sidebar: React.FC<SidebarProps> = (props) => {
    const { feeds, folders, selection, onAddSource, onRemoveFeed, onSelect, onAddFolder, onRenameFolder, onDeleteFolder, onMoveFeedToFolder, isSidebarOpen, onClose, onOpenSettings } = props;
    const [isAddingFolder, setIsAddingFolder] = useState(false);
    const unfiledFeeds = feeds.filter(f => f.folderId === null);
    
    const NavItem: React.FC<{sel: Selection, label: string, icon: React.ReactNode}> = ({sel, label, icon}) => {
        const isActive = selection.type === sel.type && selection.id === sel.id;
        const activeClasses = isActive ? 'bg-plant-600 text-white shadow-lg' : 'hover:bg-zinc-900 text-zinc-400';
        return (
            <div onClick={() => onSelect(sel)} className={`flex items-center space-x-3 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 ${activeClasses} ${isActive ? 'scale-[1.02]' : ''}`}>
                <div className={`p-2 rounded-xl ${isActive ? 'bg-white/20' : 'bg-zinc-800'}`}>{icon}</div>
                <span className="truncate font-black text-xs uppercase tracking-widest min-w-0">{label}</span>
            </div>
        )
    };

    return (
        <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-zinc-950 border-r border-zinc-900 flex flex-col h-full transform transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl md:shadow-none`}>
            <div className="p-6 flex-shrink-0">
                <div className="flex items-center justify-between space-x-2 mb-8">
                    <div className="flex items-center space-x-3">
                        <div className="p-1 bg-plant-500 rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.4)]">
                            <SeymourIcon className="w-6 h-6 text-black" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-white tracking-tighter uppercase italic leading-none">THE VOID</span>
                            <span className="text-[6px] font-bold text-pulse-500 uppercase tracking-[0.3em]">S I G N A L</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 -mr-2 rounded-2xl text-zinc-500 hover:bg-zinc-900 md:hidden">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <AddSource onAddSource={onAddSource} />
            </div>
            
            <div className="flex-grow overflow-y-auto px-6 space-y-2 scrollbar-hide">
                <NavItem sel={{type: 'game_hub', id: null}} label="The Arcade" icon={<ControllerIcon className="w-4 h-4 flex-shrink-0" />} />
                <NavItem sel={{type: 'all', id: null}} label="Frequency" icon={<ListIcon className="w-4 h-4 flex-shrink-0" />} />
                <NavItem sel={{type: 'bookmarks', id: 'bookmarks'}} label="Saved Signals" icon={<BookmarkIcon className="w-4 h-4 flex-shrink-0" />} />
                
                <div className="pt-6 pb-2">
                    <div className="flex items-center justify-between px-2 mb-4">
                        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Folders</h3>
                        <button onClick={() => setIsAddingFolder(true)} className="p-1 hover:bg-zinc-900 rounded-lg text-zinc-500">
                            <PlusIcon className="w-4 h-4" />
                        </button>
                    </div>
                    <nav className="space-y-1">
                        {folders.map(folder => (
                            <div key={folder.id} onClick={() => onSelect({type: 'folder', id: folder.id})} className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all ${selection.type === 'folder' && selection.id === folder.id ? 'bg-plant-900/50 text-plant-500' : 'text-zinc-500 hover:text-zinc-300'}`}>
                                <FolderIcon className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase truncate">{folder.name}</span>
                            </div>
                        ))}
                    </nav>
                </div>
            </div>
            
            <div className="p-6 mt-auto flex-shrink-0 bg-zinc-950 border-t border-zinc-900">
                <button onClick={onOpenSettings} className="w-full flex items-center gap-3 py-3 px-4 text-[9px] font-black uppercase tracking-widest rounded-2xl text-zinc-500 bg-zinc-900 hover:bg-zinc-800 hover:text-white transition-all">
                    <SettingsIcon className="w-4 h-4" />
                    <span>Configuration</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
