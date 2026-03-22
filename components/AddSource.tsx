import React, { useState } from 'react';
import { RssIcon, PlusIcon, GlobeAltIcon, RedditIcon, ArrowPathIcon, ExclamationTriangleIcon } from './icons';
import { discoverFeedSignals } from '../services/feedDiscoveryService';

export type SourceType = 'rss' | 'website' | 'reddit';

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
            if (activeTab === 'website') {
                // Discover signals first
                const discovered = await discoverFeedSignals(trimmedUrl);
                if (discovered && discovered.length > 0) {
                    // Just take the first valid one for now to keep it streamlined
                    await onAddSource(discovered[0].url, 'rss');
                    setUrl('');
                    onSuccess?.();
                } else {
                    throw new Error("0x404_SIGNAL_NOT_FOUND - Frequency is silent.");
                }
            } else {
                await onAddSource(trimmedUrl, activeTab);
                setUrl('');
                onSuccess?.();
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown link error.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUrl(e.target.value);
        if (error) setError(null);
    };

    const placeholders: Record<SourceType, string> = {
        rss: "Direct XML/RSS Link",
        website: "Website URL (e.g. cnn.com)",
        reddit: "Subreddit (e.g. /r/news)"
    };

    const instructions: Record<SourceType, string> = {
        rss: "INPUT DIRECT CHANNEL FREQUENCY",
        website: "SCAN HOMEPAGE FOR HIDDEN SIGNALS",
        reddit: "INTERCEPT REDDIT DATA STREAM"
    };

    const TabButton: React.FC<{ type: SourceType, label: string }> = ({ type, label }) => (
        <button 
            type="button"
            onClick={() => setActiveTab(type)} 
            className={`flex-1 min-w-0 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-200 border ${activeTab === type ? 'bg-app-accent border-app-accent text-white shadow-sm' : 'bg-app-bg border-app-border text-muted hover:text-app-text'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-4">
            <div className="flex gap-1.5 bg-app-bg p-1 rounded-xl border border-app-border">
                <TabButton type="rss" label="RSS" />
                <TabButton type="website" label="Sniffer" />
                <TabButton type="reddit" label="Reddit" />
            </div>

            <div className="px-1">
                <span className={`text-[10px] font-semibold uppercase tracking-widest transition-colors duration-300 ${activeTab === 'website' ? 'text-app-accent' : 'text-muted'}`}>
                    {instructions[activeTab]}
                </span>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="relative group">
                    <input 
                        key={activeTab}
                        type={activeTab === 'reddit' ? 'text' : 'url'} 
                        value={url} 
                        onChange={handleUrlChange}
                        placeholder={placeholders[activeTab]} 
                        required 
                        disabled={isLoading}
                        className={`w-full bg-app-card border rounded-xl py-3 pl-4 pr-12 text-sm text-app-text placeholder-muted focus:outline-none transition-all shadow-sm
                            ${error ? 'border-app-error focus:ring-2 focus:ring-app-error' : 'border-app-border focus:ring-2 focus:ring-app-accent'}`} 
                    />
                    <button type="submit" disabled={isLoading} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted hover:text-app-accent disabled:opacity-50 transition-all active:scale-95">
                        {isLoading ? (
                            <ArrowPathIcon className="w-5 h-5 animate-spin text-app-accent" />
                        ) : (
                            <PlusIcon className="w-6 h-6" />
                        )}
                    </button>
                </div>
                 
                 {isLoading && activeTab === 'website' && (
                    <div className="flex items-center gap-3 mt-3 px-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-app-accent animate-ping" />
                        <p className="text-app-accent text-xs font-medium animate-pulse">Probing website metadata...</p>
                    </div>
                 )}

                 {error && (
                    <div className="mt-3 p-3 bg-app-error/10 border border-app-error/30 rounded-lg flex items-start gap-3">
                        <ExclamationTriangleIcon className="w-5 h-5 text-app-error shrink-0 mt-0.5" />
                        <p className="text-app-error text-sm font-medium leading-relaxed">
                            {error}
                        </p>
                    </div>
                 )}
            </form>
        </div>
    );
};

export default AddSource;
