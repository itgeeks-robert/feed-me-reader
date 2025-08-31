import React, { useState } from 'react';
import { RssIcon, PlusIcon, YoutubeIcon, GlobeAltIcon } from './icons';

export type SourceType = 'rss' | 'youtube' | 'website';

interface AddSourceProps {
    onAddSource: (url: string, type: SourceType) => void;
}

const AddSource: React.FC<AddSourceProps> = ({ onAddSource }) => {
    const [activeTab, setActiveTab] = useState<SourceType>('rss');
    const [url, setUrl] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url.trim()) {
            onAddSource(url.trim(), activeTab);
            setUrl('');
        }
    };

    const placeholders: Record<SourceType, string> = {
        rss: "Add RSS feed URL",
        youtube: "Add YouTube channel URL",
        website: "Add website URL to convert"
    };

    const TabButton: React.FC<{ type: SourceType, children: React.ReactNode }> = ({ type, children }) => (
        <button 
            type="button"
            onClick={() => setActiveTab(type)} 
            className={`w-full py-1 text-xs rounded-md flex justify-center items-center gap-1.5 transition-colors duration-200 ${activeTab === type ? 'bg-white dark:bg-zinc-700 text-lime-600 dark:text-lime-400 font-semibold shadow-sm' : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-200/50 dark:hover:bg-zinc-700/50'}`}
        >
            {children}
        </button>
    );

    return (
        <div className="px-2 space-y-2 mb-4">
            <div className="flex justify-around bg-gray-100 dark:bg-zinc-800 rounded-lg p-1">
                <TabButton type="rss"><RssIcon className="w-4 h-4" /> RSS</TabButton>
                <TabButton type="youtube"><YoutubeIcon className="w-4 h-4" /> YouTube</TabButton>
                <TabButton type="website"><GlobeAltIcon className="w-4 h-4" /> Website</TabButton>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="relative">
                    <input 
                        key={activeTab} // Re-renders input to show placeholder correctly on tab change
                        type="url" 
                        value={url} 
                        onChange={(e) => setUrl(e.target.value)} 
                        placeholder={placeholders[activeTab]} 
                        required 
                        className="w-full bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md py-2 pl-3 pr-10 text-sm text-zinc-800 dark:text-zinc-300 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500" />
                    <button type="submit" className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 dark:text-zinc-400 hover:text-lime-500 dark:hover:text-lime-400" aria-label="Add source">
                        <PlusIcon className="w-5 h-5" />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddSource;