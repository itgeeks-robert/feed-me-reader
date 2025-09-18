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
            setError(null); // Clear error on new input
        }
    };

    const placeholders: Record<SourceType, string> = {
        rss: "Add RSS feed URL",
        youtube: "Add YouTube channel URL",
        website: "Add website URL to convert",
        reddit: "Add Reddit user or subreddit URL"
    };

    const TabButton: React.FC<{ type: SourceType, children: React.ReactNode }> = ({ type, children }) => (
        <button 
            type="button"
            onClick={() => setActiveTab(type)} 
            className={`flex-1 min-w-0 py-2 text-sm rounded-md flex justify-center items-center gap-1.5 transition-colors duration-200 ${activeTab === type ? 'bg-black/10 dark:bg-white/10 text-zinc-900 dark:text-white font-semibold' : 'text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5'}`}
        >
            {children}
        </button>
    );

    return (
        <div className="space-y-4">
            <div className="flex justify-around bg-black/5 dark:bg-white/5 rounded-lg p-1">
                <TabButton type="rss"><RssIcon className="w-5 h-5" /> RSS</TabButton>
                <TabButton type="youtube"><YoutubeIcon className="w-5 h-5" /> YT</TabButton>
                <TabButton type="reddit"><RedditIcon className="w-5 h-5" /> Reddit</TabButton>
                <TabButton type="website"><GlobeAltIcon className="w-5 h-5" /> Web</TabButton>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="relative">
                    <input 
                        key={activeTab}
                        type="url" 
                        value={url} 
                        onChange={handleUrlChange}
                        placeholder={placeholders[activeTab]} 
                        required 
                        disabled={isLoading}
                        className="w-full bg-black/5 dark:bg-white/5 border border-zinc-300/50 dark:border-zinc-700/50 rounded-lg py-2.5 pl-4 pr-12 text-sm text-zinc-900 dark:text-white placeholder-zinc-600 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-70" />
                    <button type="submit" disabled={isLoading} className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-400 hover:text-orange-500 disabled:text-zinc-500 dark:disabled:text-zinc-600 disabled:cursor-not-allowed" aria-label="Add source">
                        {isLoading ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <PlusIcon className="w-6 h-6" />}
                    </button>
                </div>
                 {error && <p className="text-red-700 dark:text-red-400 text-xs mt-2 px-1">{error}</p>}
            </form>
        </div>
    );
};

export default AddSource;