import React from 'react';
import type { Feed, Folder, Selection } from '../src/App';
import type { SourceType } from './AddSource';
import AddSource from './AddSource';
import {
    VoidIcon, ListIcon, PlusIcon, TrashIcon, FolderIcon, BookmarkIcon, SettingsIcon, XIcon, RadioIcon, ShieldCheckIcon, ControllerIcon
} from './icons';

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
    const { feeds, folders, selection, onAddSource, onSelect, onAddFolder, isSidebarOpen, onClose, onOpenSettings } = props;
    
    const NavItem: React.FC<{sel: Selection, label: string, icon: React.ReactNode}> = ({sel, label, icon}) => {
        const isActive = selection.type === sel.type && (sel.id === null || selection.id === sel.id);
        
        return (
            <div 
                onClick={() => onSelect(sel)} 
                className={`group relative flex items-center space-x-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 overflow-hidden
                    ${isActive 
                        ? 'bg-app-accent/10 text-app-accent font-medium' 
                        : 'hover:bg-app-border/30 text-muted hover:text-app-text'}`}
            >
                {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-app-accent rounded-r-full" />
                )}
                
                <div className={`transition-colors duration-200 ${isActive ? 'text-app-accent' : 'text-muted group-hover:text-app-text'}`}>
                    {icon}
                </div>
                <span className="truncate text-sm tracking-wide min-w-0 transition-all duration-200">
                    {label}
                </span>
            </div>
        )
    };

    return (
        <aside className={`fixed inset-y-0 left-0 z-[70] w-72 bg-app-card border-r border-app-border flex flex-col h-full transform transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]`}>
            <div className="p-6 flex-shrink-0">
                <div className="flex items-center justify-between space-x-2 mb-10">
                    <div className="flex items-center space-x-4">
                        <div className="p-1.5 bg-app-accent rounded-xl shadow-[0_0_15px_var(--app-accent)]">
                            <VoidIcon className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-app-text tracking-tight uppercase leading-none">THE VOID</span>
                            <span className="text-[10px] font-medium text-muted uppercase tracking-widest">S I G N A L</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 -mr-2 rounded-xl text-muted hover:bg-app-border/50 focus:outline-none focus:ring-2 focus:ring-app-accent">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="mb-2 px-1 flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">Establish Uplink</span>
                    <RadioIcon className="w-4 h-4 text-app-accent animate-pulse" />
                </div>
                <div className="bg-app-bg/50 p-3 rounded-xl border border-app-border mb-6">
                    <AddSource onAddSource={onAddSource} />
                </div>
            </div>
            
            <div className="flex-grow overflow-y-auto px-6 space-y-1 scrollbar-hide pb-12">
                <h3 className="px-3 mb-2 text-xs font-semibold text-muted uppercase tracking-wider">Core Interface</h3>
                <NavItem sel={{type: 'game_hub', id: null}} label="The Arcade" icon={<ControllerIcon className="w-5 h-5 flex-shrink-0" />} />
                <NavItem sel={{type: 'utility_hub', id: null}} label="Tactical Hub" icon={<ShieldCheckIcon className="w-5 h-5 flex-shrink-0" />} />
                <NavItem sel={{type: 'all', id: null}} label="Incoming Intel" icon={<ListIcon className="w-5 h-5 flex-shrink-0" />} />
                <NavItem sel={{type: 'bookmarks', id: 'bookmarks'}} label="Saved Signals" icon={<BookmarkIcon className="w-5 h-5 flex-shrink-0" />} />
                
                <div className="pt-6 pb-2 border-t border-app-border mt-4">
                    <div className="flex items-center justify-between px-3 mb-3">
                        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Zones</h3>
                        <button onClick={() => onAddFolder("New Zone")} className="p-1.5 hover:bg-app-border/50 rounded-lg text-muted transition-colors">
                            <PlusIcon className="w-4 h-4" />
                        </button>
                    </div>
                    <nav className="space-y-1">
                        {folders.map(folder => {
                            const isActive = selection.type === 'folder' && selection.id === folder.id;
                            return (
                                <div 
                                    key={folder.id} 
                                    onClick={() => onSelect({type: 'folder', id: folder.id})} 
                                    className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group
                                        ${isActive 
                                            ? 'bg-app-accent/10 text-app-accent font-medium' 
                                            : 'text-muted hover:text-app-text hover:bg-app-border/30'}`}
                                >
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-app-accent rounded-r-full" />
                                    )}
                                    <FolderIcon className={`w-4 h-4 transition-colors ${isActive ? 'text-app-accent' : 'text-muted group-hover:text-app-text'}`} />
                                    <span className="text-sm truncate transition-all">
                                        {folder.name}
                                    </span>
                                </div>
                            );
                        })}
                    </nav>
                </div>
            </div>
            
            <div className="p-6 mt-auto flex-shrink-0 bg-app-card border-t border-app-border">
                <button onClick={onOpenSettings} className="w-full flex items-center gap-3 py-3 px-4 text-sm font-medium rounded-xl text-muted bg-app-bg hover:bg-app-border/30 hover:text-app-text transition-all focus:ring-2 focus:ring-app-accent outline-none">
                    <SettingsIcon className="w-5 h-5" />
                    <span>Diagnostics</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;