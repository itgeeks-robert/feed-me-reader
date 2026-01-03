
import React, { useState, useEffect } from 'react';
import type { Article } from '../../src/App';
import { BookOpenIcon, GlobeAltIcon, RadioIcon, BoltIcon } from '../icons';
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
        <div className="relative w-full h-full bg-black overflow-hidden group/monitor">
            <div className="absolute inset-0 z-0">
                <ImageWithProxy
                    src={activeSrc}
                    alt=""
                    /* Fully Restored Color: No saturation filters. Enhanced for high-contrast clarity. */
                    className="w-full h-full object-cover transition-transform duration-[20s] group-hover/monitor:scale-110 contrast-[1.1] brightness-[1.0]"
                    wrapperClassName="w-full h-full"
                    fallback={
                        <div className="w-full h-full static-noise flex flex-col items-center justify-center p-4">
                            <span className="text-xl font-black text-pulse-500 tracking-widest uppercase italic animate-pulse">NO_SIGNAL</span>
                        </div>
                    }
                />
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-0 cctv-overlay opacity-30 pointer-events-none z-10" />
            
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
                <div className="flex items-center gap-2 px-2 py-1 bg-black/80 border border-pulse-500/40 rounded-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_red]" />
                    <span className="text-[9px] font-black text-white uppercase tracking-widest italic">LIVE_INTERCEPT</span>
                </div>
            </div>
            
            <div className="absolute bottom-4 right-4 pointer-events-none z-20">
                <span className="text-[8px] text-white/30 uppercase tracking-[0.5em] font-mono">{new Date().toLocaleTimeString()}</span>
            </div>
        </div>
    );
};

const FeaturedStory: React.FC<{article: Article; onReadHere: () => void; onReadExternal: () => void; isRead: boolean;}> = ({ article, onReadHere, onReadExternal, isRead }) => {
    return (
        <div className={`group relative grid grid-cols-1 lg:grid-cols-[1.5fr,1fr] bg-black border border-white/10 overflow-hidden min-h-[450px] md:min-h-[500px] transition-all duration-500 hover:border-white/20 rounded-void shadow-[0_20px_60px_rgba(0,0,0,0.8)] ${isRead ? 'opacity-40' : ''}`}>
            
            <div className="h-64 sm:h-96 lg:h-auto border-b lg:border-b-0 lg:border-r border-white/10">
                <CCTVMonitor src={article.imageUrl} label={article.source} headline={article.title} url={article.link} />
            </div>

            <div className="relative p-6 md:p-12 flex flex-col justify-center bg-zinc-950">
                <div className="flex items-center gap-3 mb-6">
                    <span className="bg-pulse-600 text-white text-[8px] font-black px-2 py-0.5 uppercase tracking-widest italic rounded-sm">BREAKING_INTEL</span>
                    <span className="text-zinc-500 text-[8px] font-black uppercase tracking-widest truncate">{article.source}</span>
                </div>
                
                <h1 className="text-2xl md:text-5xl font-black italic uppercase tracking-tighter mb-8 leading-[0.95] line-clamp-4 text-white group-hover:text-pulse-400 transition-colors drop-shadow-md">
                    {article.title}
                </h1>
                
                <p className="text-sm md:text-base text-zinc-400 line-clamp-3 mb-10 leading-relaxed uppercase tracking-tight italic border-l border-zinc-800 pl-6">
                    {article.snippet}
                </p>
                
                <div className="mt-auto flex flex-col sm:flex-row gap-4">
                    <button 
                        onClick={onReadHere}
                        className="flex-1 inline-flex items-center justify-center gap-3 bg-white text-black hover:bg-pulse-500 hover:text-white transition-all font-black uppercase italic py-4 px-8 text-xs tracking-widest rounded-sm"
                    >
                        <BoltIcon className="w-5 h-5" />
                        <span>Link_Core</span>
                    </button>
                    
                    <button 
                        onClick={(e) => { e.preventDefault(); onReadExternal(); }}
                        className="flex items-center justify-center gap-3 text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors italic border border-white/10 px-6 py-4 rounded-sm"
                    >
                        Raw_Dat
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FeaturedStory;
