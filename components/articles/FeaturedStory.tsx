import React, { useState, useEffect } from 'react';
import type { Article } from '../../src/App';
import { BookOpenIcon, GlobeAltIcon, RadioIcon } from '../icons';
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
            <style>{`
                @keyframes signal-jitter {
                    0% { transform: translate(0,0); }
                    10% { transform: translate(-1px, 1px); }
                    20% { transform: translate(1px, -1px); }
                    100% { transform: translate(0,0); }
                }
                .jitter-effect { animation: signal-jitter 0.1s infinite alternate; }
            `}</style>
            
            <div className="absolute inset-0 z-0 transition-all duration-700 saturate-[0.2] contrast-150 brightness-[0.8] group-hover/monitor:saturate-[0.5] group-hover/monitor:brightness-100">
                <ImageWithProxy
                    src={activeSrc}
                    alt=""
                    className="w-full h-full object-cover opacity-60 transition-transform duration-[10s] group-hover/monitor:scale-110"
                    wrapperClassName="w-full h-full"
                    fallback={
                        <div className="w-full h-full static-noise flex flex-col items-center justify-center p-4">
                            <div className="border-4 border-pulse-500 p-8 flex flex-col items-center gap-4 shadow-[0_0_40px_rgba(225,29,72,0.3)] animate-pulse">
                                <span className="text-4xl font-black text-pulse-500 tracking-[0.2em] uppercase italic text-center leading-none">
                                    {isSearching ? "Acquiring\nUplink" : "Signal\nLost"}
                                </span>
                            </div>
                        </div>
                    }
                />
            </div>

            {/* CRT VISUAL LAYERS */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none z-10" />
            <div className="absolute inset-0 cctv-overlay opacity-60 pointer-events-none z-10" />
            <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.02)_2px,rgba(255,255,255,0.02)_4px)] pointer-events-none z-10" />
            
            {/* HUD ELEMENTS */}
            <div className="absolute top-4 left-4 md:top-8 md:left-8 flex flex-col gap-2 pointer-events-none z-20">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_12px_#ef4444]" />
                    <span className="text-[10px] md:text-xs font-mono font-black text-white uppercase tracking-[0.3em] drop-shadow-lg">
                        {reconstructedSrc && !src ? "PROBE_RECON" : "LIVE_STREAM"}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="bg-black/60 px-2 py-0.5 border border-white/20 text-[9px] md:text-[11px] font-mono text-emerald-400 uppercase tracking-tighter italic">CH: {label.replace(/\s/g, '_')}</span>
                </div>
            </div>
            
            <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 pointer-events-none z-20 flex flex-col items-end gap-1">
                <span className="text-[10px] md:text-xs font-mono text-white/40 uppercase tracking-[0.4em] italic">0x00A_PRIME_SYNC</span>
                <span className="text-[10px] md:text-xs font-mono text-white/30 uppercase tracking-widest">{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
        </div>
    );
};

const FeaturedStory: React.FC<{article: Article; onReadHere: () => void; onReadExternal: () => void; isRead: boolean;}> = ({ article, onReadHere, onReadExternal, isRead }) => {
    return (
        <div className={`group grid grid-cols-1 lg:grid-cols-[1.4fr,1fr] bg-zinc-900 border-4 border-zinc-800 shadow-[12px_12px_0px_#000] overflow-hidden min-h-[400px] md:min-h-[550px] transition-all duration-500 hover:translate-x-[-2px] hover:translate-y-[-2px] relative ${isRead ? 'opacity-30 grayscale blur-[1px]' : ''}`}>
            
            <div className="h-64 sm:h-96 lg:h-auto border-b-4 border-zinc-800 lg:border-b-0 lg:border-r-4">
                <CCTVMonitor src={article.imageUrl} label={article.source} headline={article.title} url={article.link} />
            </div>

            <div className="relative p-8 md:p-14 flex flex-col justify-center bg-void-950">
                <div className="absolute top-0 left-0 w-2 h-full bg-pulse-600/30" />
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pulse-500 via-transparent to-transparent opacity-20" />
                
                <div className="flex items-center gap-3 mb-6 md:mb-8">
                    <RadioIcon className="w-5 h-5 text-pulse-500" />
                    <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.5em] text-pulse-500 font-mono italic leading-none">PRIME_INTERCEPT</p>
                </div>
                
                <h1 className="text-2xl md:text-5xl font-black italic uppercase tracking-tighter mb-8 md:mb-10 leading-[0.95] font-horror line-clamp-4 text-white group-hover:text-pulse-400 transition-colors">
                    {article.title}
                </h1>
                
                <p className="text-sm md:text-lg text-zinc-400 font-mono line-clamp-4 md:line-clamp-6 mb-12 md:mb-16 leading-relaxed uppercase tracking-tight italic opacity-80 border-l-2 border-zinc-800 pl-6">
                    {article.snippet}
                </p>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 md:gap-10 mt-auto">
                    <button 
                        onClick={onReadHere}
                        className="flex-1 inline-flex items-center justify-center gap-4 bg-white text-black hover:bg-pulse-500 hover:text-white transition-all font-black uppercase italic py-5 px-10 text-xs md:text-base tracking-widest shadow-[6px_6px_0px_#e11d48] active:translate-x-1 active:translate-y-1 active:shadow-none"
                    >
                        <BookOpenIcon className="w-6 h-6" />
                        <span>Establish_Link</span>
                    </button>
                    
                    <button 
                        onClick={(e) => { e.preventDefault(); onReadExternal(); }}
                        className="flex items-center justify-center gap-3 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-zinc-600 hover:text-white transition-colors font-mono italic border-2 border-zinc-800 px-6 py-4 rounded-lg hover:border-zinc-500"
                    >
                        <GlobeAltIcon className="w-4 h-4" />
                        Raw_Stream
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FeaturedStory;