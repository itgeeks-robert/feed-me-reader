import React, { useState } from 'react';
import type { Feed, Folder, Selection } from '../src/App';
import type { SourceType } from './AddSource';
import AddSource from './AddSource';
import { Disclosure, DisclosureButton, DisclosurePanel } from './Disclosure';
import {
    SeymourIcon, ListIcon, PlusIcon, RssIcon, TrashIcon, FolderIcon, PencilIcon, ChevronDownIcon, ChevronRightIcon, XIcon, BookmarkIcon, SettingsIcon, RedditIcon, YoutubeIcon, GlobeAltIcon, CubeTransparentIcon
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

const NewFolderInput: React.FC<{ onAddFolder: (name: string) => void; onCancel: () => void; }> = ({ onAddFolder, onCancel }) => {
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onAddFolder(name.trim());
        }
        onCancel();
    };

    return (
        <form onSubmit={handleSubmit} className="px-3 py-1">
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={onCancel}
                placeholder="New folder name"
                autoFocus
                className="w-full bg-zinc-100/50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-md py-1 px-2 text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
        </form>
    );
};

const FolderItem: React.FC<{
    folder: Folder;
    feeds: Feed[];
    selection: Selection;
    onSelect: (selection: Selection) => void;
    onRenameFolder: (id: number, newName: string) => void;
    onDeleteFolder: (id: number) => void;
    onRemoveFeed: (id: number) => void;
    onMoveFeedToFolder: (feedId: number, folderId: number | null) => void;
    isDragTarget: boolean;
    onDragEnter: () => void;
    onDragLeave: () => void;
}> = ({ folder, feeds, selection, onSelect, onRenameFolder, onDeleteFolder, onRemoveFeed, onMoveFeedToFolder, isDragTarget, onDragEnter, onDragLeave }) => {
    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState(folder.name);

    const handleRenameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (newName.trim()) {
            onRenameFolder(folder.id, newName.trim());
        }
        setIsRenaming(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const feedId = Number(e.dataTransfer.getData('feedId'));
        if (feedId) {
            onMoveFeedToFolder(feedId, folder.id);
        }
        onDragLeave();
    };
    
    const isActive = selection.type === 'folder' && selection.id === folder.id;
    const activeClasses = isActive ? 'bg-orange-500/20 text-orange-600 dark:text-white dark:bg-orange-500/30' : 'hover:bg-black/5 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400';
    const dragTargetClasses = isDragTarget ? 'bg-orange-900/50 ring-1 ring-orange-500' : '';

    return (
        <Disclosure defaultOpen={true}>
            <div>
                <div
                    onClick={() => onSelect({ type: 'folder', id: folder.id })}
                    onDrop={handleDrop}
                    onDragOver={e => e.preventDefault()}
                    onDragEnter={onDragEnter}
                    onDragLeave={onDragLeave}
                    className={`group flex items-center justify-between pl-1 pr-3 py-2 rounded-lg cursor-pointer transition-colors duration-150 ${activeClasses} ${dragTargetClasses}`}
                >
                    <div className="flex items-center space-x-2 truncate">
                        <DisclosureButton className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-white p-1 rounded-md">
                            {({ open }) => open ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
                        </DisclosureButton>
                        {isRenaming ? (
                            <form onSubmit={handleRenameSubmit} className="flex-1">
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    onBlur={() => setIsRenaming(false)}
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded py-0 px-1 text-sm text-zinc-800 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-orange-500"
                                />
                            </form>
                        ) : (
                            <span className="truncate font-medium">{folder.name}</span>
                        )}
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={(e) => { e.stopPropagation(); setIsRenaming(true); }} className="p-1 rounded-md text-zinc-400 dark:text-zinc-500 hover:text-orange-500 dark:hover:text-orange-400" aria-label={`Rename ${folder.name}`}><PencilIcon className="w-4 h-4" /></button>
                         <button onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }} className="p-1 rounded-md text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400" aria-label={`Delete ${folder.name}`}><TrashIcon className="w-4 h-4" /></button>
                    </div>
                </div>
                 <DisclosurePanel>
                    <div className="pl-6 pt-1 space-y-1">
                        {feeds.map(feed => (
                            <FeedItem key={feed.id} feed={feed} selection={selection} onSelect={onSelect} onRemoveFeed={onRemoveFeed} />
                        ))}
                    </div>
                </DisclosurePanel>
            </div>
        </Disclosure>
    );
};


const FeedItem: React.FC<{
    feed: Feed;
    selection: Selection;
    onSelect: (selection: Selection) => void;
    onRemoveFeed: (id: number) => void;
}> = ({ feed, selection, onSelect, onRemoveFeed }) => {
    const isActive = selection.type === 'feed' && selection.id === feed.id;
    const activeClasses = isActive ? 'bg-orange-500/20 text-orange-600 dark:text-white dark:bg-orange-500/30' : 'hover:bg-black/5 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-300';

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('feedId', String(feed.id));
    };

    return (
        <div
            draggable="true"
            onDragStart={handleDragStart}
            onClick={() => onSelect({ type: 'feed', id: feed.id })}
            className={`group flex items-center justify-between pl-3 pr-2 py-2 rounded-lg cursor-pointer transition-colors duration-150 ${activeClasses}`}
        >
            <div className="flex items-center space-x-3 truncate">
                <SmartFeedIcon iconUrl={feed.iconUrl} feedTitle={feed.title} sourceType={feed.sourceType} className="w-5 h-5 text-xs rounded-sm" />
                <span className="truncate">{feed.title}</span>
            </div>
            <button
                onClick={(e) => { e.stopPropagation(); onRemoveFeed(feed.id); }}
                className="opacity-0 group-hover:opacity-100 text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-opacity p-1 rounded-md"
                aria-label={`Remove ${feed.title} feed`}
            >
                <TrashIcon className="w-4 h-4" />
            </button>
        </div>
    );
};

const Sidebar: React.FC<SidebarProps> = (props) => {
    const { feeds, folders, selection, onAddSource, onRemoveFeed, onSelect, onAddFolder, onRenameFolder, onDeleteFolder, onMoveFeedToFolder, isSidebarOpen, onClose, onOpenSettings } = props;
    const [isAddingFolder, setIsAddingFolder] = useState(false);
    const [dragOverTarget, setDragOverTarget] = useState<number | 'unfiled' | null>(null);

    const unfiledFeeds = feeds.filter(f => f.folderId === null);
    
    const handleUnfiledDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const feedId = Number(e.dataTransfer.getData('feedId'));
        if (feedId) {
            onMoveFeedToFolder(feedId, null);
        }
        setDragOverTarget(null);
    };

    const NavItem: React.FC<{sel: Selection, label: string, icon: React.ReactNode}> = ({sel, label, icon}) => {
        const isActive = selection.type === sel.type && selection.id === sel.id;
        const activeClasses = isActive ? 'bg-orange-500/20 text-orange-600 dark:text-white dark:bg-orange-500/30' : 'hover:bg-black/5 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400';
        return (
            <div onClick={() => onSelect(sel)} className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 ${activeClasses}`}>
                {icon}
                <span className="truncate font-medium min-w-0">{label}</span>
            </div>
        )
    };

    return (
        <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-white/30 dark:bg-zinc-900/40 backdrop-blur-2xl border-r border-white/20 dark:border-white/10 flex flex-col h-full transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-4 flex-shrink-0">
                <div className="flex items-center justify-between space-x-2 mb-4 px-2">
                    <div className="flex items-center space-x-2">
                        <SeymourIcon className="w-8 h-8" />
                        <span className="text-xl font-bold text-zinc-900 dark:text-white">See More</span>
                    </div>
                    <button onClick={onClose} className="p-2 -mr-2 rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-black/10 dark:hover:bg-white/10 md:hidden" aria-label="Close sidebar">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <AddSource onAddSource={onAddSource} />
            </div>
            
            <div className="flex-grow overflow-y-auto mt-2 px-4 space-y-1.5">
                <NavItem sel={{type: 'all', id: null}} label="All" icon={<ListIcon className="w-5 h-5 flex-shrink-0" />} />
                <NavItem sel={{type: 'bookmarks', id: 'bookmarks'}} label="Saved" icon={<BookmarkIcon className="w-5 h-5 flex-shrink-0" />} />
                <NavItem sel={{type: 'game_hub', id: null}} label="Game Hub" icon={<CubeTransparentIcon className="w-5 h-5 flex-shrink-0" />} />
                <NavItem sel={{type: 'reddit', id: null}} label="Reddit" icon={<RedditIcon className="w-5 h-5 flex-shrink-0" />} />
                <NavItem sel={{type: 'youtube', id: null}} label="YouTube" icon={<YoutubeIcon className="w-5 h-5 flex-shrink-0" />} />
                
                <div className="pt-4 space-y-2">
                    <button onClick={() => setIsAddingFolder(true)} className="w-full text-left text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg py-2.5 px-3 flex items-center space-x-2 transition-colors">
                        <FolderIcon className="w-5 h-5" />
                        <span>New Folder</span>
                    </button>
                </div>

                <nav className="space-y-1 pt-2">
                    {isAddingFolder && <NewFolderInput onAddFolder={onAddFolder} onCancel={() => setIsAddingFolder(false)} />}
                    {folders.map(folder => (
                        <FolderItem
                            key={folder.id} folder={folder} feeds={feeds.filter(f => f.folderId === folder.id)} selection={selection} onSelect={onSelect}
                            onRenameFolder={onRenameFolder} onDeleteFolder={onDeleteFolder} onRemoveFeed={onRemoveFeed} onMoveFeedToFolder={onMoveFeedToFolder}
                            isDragTarget={dragOverTarget === folder.id} onDragEnter={() => setDragOverTarget(folder.id)} onDragLeave={() => setDragOverTarget(null)}
                        />
                    ))}
                </nav>
                 {unfiledFeeds.length > 0 && (
                     <div className="pt-4">
                         <div 
                            onDrop={handleUnfiledDrop} onDragOver={e => e.preventDefault()} onDragEnter={() => setDragOverTarget('unfiled')}
                            onDragLeave={() => setDragOverTarget(null)} className={`py-2 rounded-lg ${dragOverTarget === 'unfiled' ? 'bg-orange-900/50 ring-1 ring-orange-500' : ''}`}
                         >
                             <h3 className="px-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Unfiled Feeds</h3>
                             <div className="space-y-1">
                                 {unfiledFeeds.map(feed => (
                                     <FeedItem key={feed.id} feed={feed} selection={selection} onSelect={onSelect} onRemoveFeed={onRemoveFeed} />
                                 ))}
                             </div>
                         </div>
                     </div>
                 )}
            </div>
            <div className="p-4 mt-auto flex-shrink-0">
                <button onClick={onOpenSettings} className="w-full flex items-center gap-3 py-2.5 px-3 text-sm font-medium rounded-lg text-zinc-600 dark:text-zinc-300 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white transition-colors">
                    <SettingsIcon className="w-5 h-5" />
                    <span>Settings</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;