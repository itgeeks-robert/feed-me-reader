
import React, { useState, useEffect } from 'react';
import type { Article } from '../../src/App';
import { BookOpenIcon, GlobeAltIcon } from '../icons';
import ImageWithProxy from '../ImageWithProxy';
import { reconstructSignalImage } from '../../services/imageSearchService';

const CCTVMonitor: React.FC<{ src: string | null; label: string; headline: string; url: string }> = ({ src, label, headline, url }) => {
    const [reconstructedSrc, setReconstructedSrc] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (!src && !reconstructedSrc && !isSearching) {
            setIsSearching(true);
            reconstructSignalImage(headline, url).then(foundUrl => {
                if (foundUrl) setReconstructedSrc(foundUrl);
                setIsSearching(false);
            });
        }
    }, [src, headline, url]);

    const activeSrc = src || reconstructedSrc;

    return (
        <div className="relative w-full h-full bg-black transition-all duration-700 saturate-[0.7] contrast-125 brightness-90">
            <ImageWithProxy
                src={activeSrc}
                alt=""
                className="w-full h-full object-cover opacity-80 animate-fade-in"
                wrapperClassName="w-full h-full"
                fallback={
                    <div className="w-full h-full static-noise flex flex-col items-center justify-center p-4">
                        <div className="border-4 border-signal-500 p-6 md:p-8 flex flex-col items-center gap-4 shadow-[0_0_40px_rgba(34,197,94,0.3)] animate-pulse">
                            <span className="text-2xl md:text-5xl font-black text-signal-500 tracking-[0.2em] uppercase italic text-center leading-none">
                                {isSearching ? "DEEP_SCAN\nACTIVE" : "SIGNAL\nLOST"}
                            </span>
                            <div className="h-px w-full bg-signal-500/40"></div>
                            <span className="text-[10px] md:text-sm font-mono font-bold text-signal-500 uppercase tracking-widest">
                                {isSearching ? "0x009_RECON_INT" : "0x004_TRANS_ERR"}
                            </span>
                        </div>
                    </div>
                }
            />
            <div className="absolute inset-0 cctv-overlay pointer-events-none" />
            <div className="absolute top-3 left-3 md:top-6 md:left-6 flex flex-col gap-1 md:gap-2 pointer-events-none">
                <div className="flex items-center gap-1.5 md:gap-2">
                    <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_#e11d48]" />
                    <span className="text-[10px] md:text-sm font-mono font-bold text-white uppercase tracking-widest drop-shadow-md">
                        {reconstructedSrc && !src ? "DEEP_SYNC" : "REC"}
                    </span>
                </div>
                <span className="text-[10px] md:text-sm font-mono text-white uppercase tracking-tighter drop-shadow-md">{label}</span>
            </div>
            <div className="absolute bottom-3 right-3 md:bottom-6 md:right-6 pointer-events-none">
                <span className="text-[10px] md:text-sm font-mono text-white/50 uppercase tracking-widest drop-shadow-md">
                    {new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        </div>
    );
};

const FeaturedStory: React.FC<{article: Article; onReadHere: () => void; onReadExternal: () => void; isRead: boolean;}> = ({ article, onReadHere, onReadExternal, isRead }) => {
    return (
        <div className={`group grid grid-cols-1 lg:grid-cols-[1.2fr,1fr] bg-void-900 border-2 border-zinc-300 dark:border-zinc-800 text-terminal shadow-[8px_8px_0px_black] dark:shadow-[8px_8px_0px_#000] overflow-hidden min-h-[320px] md:min-h-[450px] transition-all duration-500 hover:translate-x-[-2px] hover:translate-y-[-2px] ${isRead ? 'opacity-50 grayscale' : ''}`}>
            
            <div className="h-56 sm:h-80 lg:h-auto border-b-2 border-zinc-300 dark:border-zinc-800 lg:border-b-0 lg:border-r-2">
                <CCTVMonitor src={article.imageUrl} label={article.source} headline={article.title} url={article.link} />
            </div>

            <div className="relative p-6 sm:p-10 md:p-12 flex flex-col justify-center bg-void-950/40 backdrop-blur-sm border-l-[8px] md:border-l-[12px] border-pulse-500">
                <p className="text-[10px] md:text-sm font-black uppercase tracking-[0.4em] text-pulse-600 dark:text-pulse-500 mb-3 md:mb-5 font-mono italic">// PRIME SIGNAL INTERCEPT</p>
                <h1 className="text-xl sm:text-3xl md:text-5xl font-black italic uppercase tracking-tighter mb-5 md:mb-8 leading-tight drop-shadow-sm font-horror line-clamp-3 md:line-clamp-4 text-zinc-900 dark:text-white">{article.title}</h1>
                <p className="text-sm md:text-xl text-zinc-800 dark:text-white/95 font-mono line-clamp-3 sm:line-clamp-4 lg:line-clamp-6 mb-8 md:mb-14 leading-relaxed uppercase tracking-wider">{article.snippet}</p>
                
                <div className="flex flex-wrap items-center gap-6 md:gap-12 mt-auto">
                    <button 
                        onClick={onReadHere}
                        className="inline-flex items-center gap-3 md:gap-4 bg-pulse-500 hover:bg-zinc-900 dark:hover:bg-white text-white dark:hover:text-black transition-all font-black uppercase italic py-4 px-10 md:py-5 md:px-16 text-xs md:text-lg tracking-widest shadow-[5px_5px_0px_rgba(0,0,0,0.2)] dark:shadow-[5px_5px_0px_white] active:scale-95"
                    >
                        <BookOpenIcon className="w-5 h-5 md:w-6 md:h-6" />
                        <span>Analyze Local Node</span>
                    </button>
                    
                    <button 
                        onClick={(e) => { e.preventDefault(); onReadExternal(); }}
                        className="flex items-center gap-3 text-xs md:text-base font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-500 hover:text-pulse-600 dark:hover:text-white transition-colors font-mono italic underline decoration-dotted underline-offset-4"
                    >
                        <GlobeAltIcon className="w-4 h-4 md:w-5 md:h-5" />
                        Raw Source
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FeaturedStory;
