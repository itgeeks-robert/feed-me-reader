import React, { useState } from 'react';
import type { Feed, Folder, Selection, Theme } from '../App';
import {
    AudreyIcon, ListIcon, PlusIcon, RssIcon, TrashIcon, FolderIcon, PencilIcon, ChevronDownIcon, ChevronRightIcon, SunIcon, MoonIcon, NewspaperIcon
} from './icons';

interface SidebarProps {
    feeds: Feed[];
    folders: Folder[];
    selection: Selection;
    onAddFeed: (url: string) => void;
    onRemoveFeed: (id: number) => void;
    onSelect: (selection: Selection) => void;
    onAddFolder: (name: string) => void;
    onRenameFolder: (id: number, newName: string) => void;
    onDeleteFolder: (id: number) => void;
    onMoveFeedToFolder: (feedId: number, folderId: number | null) => void;
    theme: Theme;
    toggleTheme: () => void;
}

const FeedIcon: React.FC<{ iconUrl: string, feedTitle: string }> = ({ iconUrl, feedTitle }) => {
    const [hasError, setHasError] = useState(false);
    if (hasError || !iconUrl) return <RssIcon className="w-5 h-5 flex-shrink-0" />;
    return <img src={iconUrl} alt={`${feedTitle} icon`} className="w-5 h-5 flex-shrink-0 rounded-sm" onError={() => setHasError(true)} aria-hidden="true" />;
};

const NewFolderInput: React.FC<{ onAddFolder: (name: string); onCancel: () => void; }> = ({ onAddFolder, onCancel }) => {
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
                className="w-full bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md py-1 px-2 text-sm text-zinc-800 dark:text-zinc-300 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-lime-500"
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
    const [isExpanded, setIsExpanded] = useState(true);

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
    const activeClasses = isActive ? 'bg-gray-200 dark:bg-zinc-700/50 text-zinc-900 dark:text-white' : 'hover:bg-gray-200 dark:hover:bg-zinc-700/50 text-gray-600 dark:text-zinc-400';
    const dragTargetClasses = isDragTarget ? 'bg-lime-200/50 dark:bg-lime-900/50 ring-1 ring-lime-500' : '';

    return (
        <div>
            <div
                onClick={() => onSelect({ type: 'folder', id: folder.id })}
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                className={`group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors duration-150 ${activeClasses} ${dragTargetClasses}`}
            >
                <div className="flex items-center space-x-3 truncate">
                    <button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded);}} className="text-gray-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-white">
                        {isExpanded ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
                    </button>
                    {isRenaming ? (
                        <form onSubmit={handleRenameSubmit} className="flex-1">
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onBlur={() => setIsRenaming(false)}
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                                className="w-full bg-white dark:bg-zinc-800 border-none rounded py-0 px-1 text-sm text-zinc-800 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-lime-500"
                            />
                        </form>
                    ) : (
                        <span className="truncate font-medium">{folder.name}</span>
                    )}
                </div>
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={(e) => { e.stopPropagation(); setIsRenaming(true); }} className="text-gray-400 dark:text-zinc-500 hover:text-lime-500 dark:hover:text-lime-400" aria-label={`Rename ${folder.name}`}><PencilIcon className="w-4 h-4" /></button>
                     <button onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }} className="text-gray-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400" aria-label={`Delete ${folder.name}`}><TrashIcon className="w-4 h-4" /></button>
                </div>
            </div>
             {isExpanded && (
                <div className="pl-6 pt-1 space-y-1">
                    {feeds.map(feed => (
                        <FeedItem key={feed.id} feed={feed} selection={selection} onSelect={onSelect} onRemoveFeed={onRemoveFeed} />
                    ))}
                </div>
            )}
        </div>
    );
};


const FeedItem: React.FC<{
    feed: Feed;
    selection: Selection;
    onSelect: (selection: Selection) => void;
    onRemoveFeed: (id: number) => void;
}> = ({ feed, selection, onSelect, onRemoveFeed }) => {
    const isActive = selection.type === 'feed' && selection.id === feed.id;
    const activeClasses = isActive ? 'bg-gray-200 dark:bg-zinc-700/50 text-zinc-900 dark:text-white' : 'hover:bg-gray-200 dark:hover:bg-zinc-700/50 text-gray-600 dark:text-zinc-400';

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('feedId', String(feed.id));
    };

    return (
        <div
            draggable="true"
            onDragStart={handleDragStart}
            onClick={() => onSelect({ type: 'feed', id: feed.id })}
            className={`group flex items-center justify-between pl-3 pr-2 py-2 rounded-md cursor-pointer transition-colors duration-150 ${activeClasses}`}
        >
            <div className="flex items-center space-x-3 truncate">
                <FeedIcon iconUrl={feed.iconUrl} feedTitle={feed.title} />
                <span className="truncate">{feed.title}</span>
            </div>
            <button
                onClick={(e) => { e.stopPropagation(); onRemoveFeed(feed.id); }}
                className="opacity-0 group-hover:opacity-100 text-gray-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-opacity"
                aria-label={`Remove ${feed.title} feed`}
            >
                <TrashIcon className="w-4 h-4" />
            </button>
        </div>
    );
};


const Sidebar: React.FC<SidebarProps> = (props) => {
    const { feeds, folders, selection, onAddFeed, onRemoveFeed, onSelect, onAddFolder, onRenameFolder, onDeleteFolder, onMoveFeedToFolder, theme, toggleTheme } = props;
    const [newFeedUrl, setNewFeedUrl] = useState('');
    const [isAddingFolder, setIsAddingFolder] = useState(false);
    const [dragOverTarget, setDragOverTarget] = useState<number | 'unfiled' | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddFeed(newFeedUrl);
        setNewFeedUrl('');
    };
    
    const unfiledFeeds = feeds.filter(f => f.folderId === null);
    const allFeedsIsActive = selection.type === 'all';
    const briefingIsActive = selection.type === 'briefing';


    const handleUnfiledDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const feedId = Number(e.dataTransfer.getData('feedId'));
        if (feedId) {
            onMoveFeedToFolder(feedId, null);
        }
        setDragOverTarget(null);
    };

    return (
        <aside className="w-72 bg-gray-50 dark:bg-zinc-900 flex-shrink-0 p-4 flex flex-col h-full overflow-y-auto border-r border-gray-200 dark:border-zinc-800">
            <div className="flex items-center justify-between space-x-2 mb-6 px-2">
                <div className="flex items-center space-x-2">
                    <AudreyIcon className="w-8 h-8 text-lime-500" />
                    <span className="text-lg font-bold text-zinc-900 dark:text-white">Feed Me</span>
                </div>
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                    aria-label="Toggle theme"
                >
                    {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                </button>
            </div>

            <form onSubmit={handleSubmit} className="px-2 mb-4">
                <div className="relative">
                    <input id="feed-url" type="url" value={newFeedUrl} onChange={(e) => setNewFeedUrl(e.target.value)} placeholder="Add RSS feed URL" required className="w-full bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md py-2 pl-3 pr-10 text-sm text-zinc-800 dark:text-zinc-300 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500" />
                    <button type="submit" className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 dark:text-zinc-400 hover:text-lime-500 dark:hover:text-lime-400" aria-label="Add feed"><PlusIcon className="w-5 h-5" /></button>
                </div>
            </form>
             <div className="px-2 mb-6">
                <button onClick={() => setIsAddingFolder(true)} className="w-full text-left text-sm text-gray-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-gray-200/50 dark:bg-zinc-800/50 hover:bg-gray-200 dark:hover:bg-zinc-700/50 rounded-md py-2 px-3 flex items-center space-x-2 transition-colors">
                    <FolderIcon className="w-5 h-5" />
                    <span>New Folder</span>
                </button>
            </div>


            <div className="flex-grow">
                 <div onClick={() => onSelect({ type: 'all', id: null })} className={`flex items-center space-x-3 px-3 py-2 rounded-md cursor-pointer transition-colors duration-150 ${allFeedsIsActive ? 'bg-gray-200 dark:bg-zinc-700/50 text-zinc-900 dark:text-white' : 'hover:bg-gray-200 dark:hover:bg-zinc-700/50 text-gray-600 dark:text-zinc-400'}`}>
                    <ListIcon className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate font-medium">All Feeds</span>
                </div>
                <div onClick={() => onSelect({ type: 'briefing', id: 'briefing' })} className={`flex items-center space-x-3 px-3 py-2 rounded-md cursor-pointer transition-colors duration-150 mb-4 ${briefingIsActive ? 'bg-gray-200 dark:bg-zinc-700/50 text-zinc-900 dark:text-white' : 'hover:bg-gray-200 dark:hover:bg-zinc-700/50 text-gray-600 dark:text-zinc-400'}`}>
                    <NewspaperIcon className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate font-medium">Daily Briefing</span>
                </div>
                
                <nav className="space-y-1">
                    {isAddingFolder && <NewFolderInput onAddFolder={onAddFolder} onCancel={() => setIsAddingFolder(false)} />}
                    {folders.map(folder => (
                        <FolderItem
                            key={folder.id}
                            folder={folder}
                            feeds={feeds.filter(f => f.folderId === folder.id)}
                            selection={selection}
                            onSelect={onSelect}
                            onRenameFolder={onRenameFolder}
                            onDeleteFolder={onDeleteFolder}
                            onRemoveFeed={onRemoveFeed}
                            onMoveFeedToFolder={onMoveFeedToFolder}
                            isDragTarget={dragOverTarget === folder.id}
                            onDragEnter={() => setDragOverTarget(folder.id)}
                            onDragLeave={() => setDragOverTarget(null)}
                        />
                    ))}
                </nav>
                 {unfiledFeeds.length > 0 && (
                     <div className="mt-4">
                         <div 
                            onDrop={handleUnfiledDrop}
                            onDragOver={e => e.preventDefault()}
                            onDragEnter={() => setDragOverTarget('unfiled')}
                            onDragLeave={() => setDragOverTarget(null)}
                            className={`px-3 py-2 rounded-md transition-colors ${dragOverTarget === 'unfiled' ? 'bg-lime-200/50 dark:bg-lime-900/50 ring-1 ring-lime-500' : ''}`}
                         >
                             <h3 className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Unfiled</h3>
                             <div className="space-y-1">
                                 {unfiledFeeds.map(feed => (
                                     <FeedItem key={feed.id} feed={feed} selection={selection} onSelect={onSelect} onRemoveFeed={onRemoveFeed} />
                                 ))}
                             </div>
                         </div>
                     </div>
                 )}
            </div>
        </aside>
    );
};

export default Sidebar;
