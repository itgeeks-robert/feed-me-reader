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
            className={`flex-1 min-w-0 py-2 text-[8px] font-black uppercase tracking-tighter rounded-lg transition-all duration-300 border ${activeTab === type ? 'bg-pulse-500 border-pulse-400 text-white shadow-[0_0_10px_rgba(225,29,72,0.3)]' : 'bg-void-950 border-zinc-800 text-zinc-600 hover:text-zinc-400'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-4 font-mono">
            <div className="flex gap-1.5 bg-void-950/50 p-1 rounded-xl border border-zinc-800/50">
                <TabButton type="rss" label="RSS" />
                <TabButton type="website" label="SNIFFER" />
                <TabButton type="reddit" label="REDDIT" />
            </div>

            <div className="px-1">
                <span className={`text-[7px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${activeTab === 'website' ? 'text-emerald-500' : 'text-zinc-600'}`}>
                    // {instructions[activeTab]}
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
                        className={`w-full bg-void-950 border-2 rounded-xl py-3 pl-4 pr-12 text-xs text-white placeholder-zinc-800 focus:outline-none transition-all shadow-inner font-mono
                            ${error ? 'border-red-900/50 focus:border-red-500' : 'border-zinc-800 focus:border-pulse-500'}`} 
                    />
                    <button type="submit" disabled={isLoading} className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-700 hover:text-pulse-500 disabled:opacity-50 transition-all active:scale-90">
                        {isLoading ? (
                            <ArrowPathIcon className="w-5 h-5 animate-spin text-pulse-500" />
                        ) : (
                            <PlusIcon className="w-7 h-7" />
                        )}
                    </button>
                </div>
                 
                 {isLoading && activeTab === 'website' && (
                    <div className="flex items-center gap-3 mt-3 px-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        <p className="text-emerald-500 text-[8px] font-black uppercase tracking-[0.4em] animate-pulse italic">Probing_Website_Metadata...</p>
                    </div>
                 )}

                 {error && (
                    <div className="mt-3 p-3 bg-red-950/20 border border-red-500/30 rounded-lg flex items-start gap-3 animate-shake">
                        <ExclamationTriangleIcon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-red-500 text-[8px] font-black uppercase tracking-widest leading-relaxed italic">
                            SYSTEM_ALERT: {error}
                        </p>
                    </div>
                 )}
            </form>
        </div>
    );
};

export default AddSource;
