
import React, { useState } from 'react';
import { RssIcon, PlusIcon, YoutubeIcon, GlobeAltIcon, RedditIcon, ArrowPathIcon } from './icons';

export type SourceType = 'rss' | 'youtube' | 'website' | 'reddit';

interface AddSourceProps {
    onAddSource: (url: string, type: SourceType) => Promise<void>;
    onSuccess?: () => void;
}

const AddSource: React.FC<AddSourceProps> = ({ onAddSource, onSuccess }) => {
    const [activeTab, setActiveTab] = useState<SourceType>('rss');
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedUrl = url.trim();
        if (!trimmedUrl || isLoading) return;

        setIsLoading(true);
        setError(null);
        try {
            await onAddSource(trimmedUrl, activeTab);
            setUrl('');
            onSuccess?.();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUrl(e.target.value);
        if (error) {
            setError(null);
        }
    };

    const placeholders: Record<SourceType, string> = {
        rss: "Feed URL",
        youtube: "Channel URL",
        website: "Site URL",
        reddit: "Subreddit"
    };

    const TabButton: React.FC<{ type: SourceType, children: React.ReactNode }> = ({ type, children }) => (
        <button 
            type="button"
            onClick={() => setActiveTab(type)} 
            className={`flex-1 min-w-0 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${activeTab === type ? 'bg-white dark:bg-zinc-800 text-orange-500 shadow-md ring-1 ring-black/5' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
        >
            {children}
        </button>
    );

    return (
        <div className="space-y-4">
            <div className="flex justify-around bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-2xl ring-1 ring-black/5">
                <TabButton type="rss">RSS</TabButton>
                <TabButton type="youtube">YT</TabButton>
                <TabButton type="reddit">RED</TabButton>
                <TabButton type="website">WEB</TabButton>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="relative group">
                    <input 
                        key={activeTab}
                        type="url" 
                        value={url} 
                        onChange={handleUrlChange}
                        placeholder={placeholders[activeTab]} 
                        required 
                        disabled={isLoading}
                        className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-2xl py-3.5 pl-5 pr-14 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-inner" />
                    <button type="submit" disabled={isLoading} className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-400 hover:text-orange-500 disabled:opacity-50 transition-all active:scale-90" aria-label="Add">
                        {isLoading ? <ArrowPathIcon className="w-6 h-6 animate-spin" /> : <PlusIcon className="w-8 h-8" />}
                    </button>
                </div>
                 {error && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-2 px-2 animate-pulse">{error}</p>}
            </form>
        </div>
    );
};

export default AddSource;
