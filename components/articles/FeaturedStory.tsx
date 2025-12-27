
import React from 'react';
import type { Article } from '../../src/App';
import { BookOpenIcon } from '../icons';
import ImageWithProxy from '../ImageWithProxy';

const CCTVMonitor: React.FC<{ src: string | null; label: string }> = ({ src, label }) => {
    return (
        <div className="relative w-full h-full bg-black group-hover:grayscale-0 transition-all duration-700 grayscale-[0.5] contrast-125">
            <ImageWithProxy
                src={src}
                alt=""
                className="w-full h-full object-cover opacity-80"
                wrapperClassName="w-full h-full"
                fallback={
                    <div className="w-full h-full static-noise flex items-center justify-center">
                        <span className="text-[8px] md:text-[10px] font-mono text-white/20 tracking-[0.5em] animate-pulse uppercase">Signal Lost</span>
                    </div>
                }
            />
            <div className="absolute inset-0 cctv-overlay pointer-events-none" />
            <div className="absolute top-3 left-3 md:top-4 md:left-4 flex flex-col gap-0.5 md:gap-1 pointer-events-none">
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_#e11d48]" />
                    <span className="text-[7px] md:text-[8px] font-mono font-bold text-white uppercase tracking-widest drop-shadow-md">REC</span>
                </div>
                <span className="text-[7px] md:text-[8px] font-mono text-white/70 uppercase tracking-tighter drop-shadow-md">{label}</span>
            </div>
            <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4 pointer-events-none">
                <span className="text-[7px] md:text-[8px] font-mono text-white/50 uppercase tracking-widest drop-shadow-md">
                    {new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        </div>
    );
};

const FeaturedStory: React.FC<{article: Article; onReadHere: () => void; onMarkAsRead: () => void; isRead: boolean;}> = ({ article, onReadHere, onMarkAsRead, isRead }) => {
    return (
        <div className={`group grid grid-cols-1 md:grid-cols-[1fr,1.3fr] bg-void-900 border border-zinc-800 text-white shadow-[10px_10px_0px_black] overflow-hidden min-h-[200px] md:min-h-[250px] transition-all duration-500 hover:translate-x-[-3px] hover:translate-y-[-3px] ${isRead ? 'opacity-50 grayscale' : ''}`}>
            
            <div className="h-40 md:h-full border-b md:border-b-0 md:border-r border-zinc-800">
                <CCTVMonitor src={article.imageUrl} label={article.source} />
            </div>

            <div className="relative p-4 md:p-8 flex flex-col justify-center bg-void-950/40 backdrop-blur-sm border-l-4 border-pulse-500">
                <p className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.3em] text-pulse-500 mb-1 md:mb-2 font-mono italic">// SIG INT</p>
                <h1 className="text-[10px] md:text-base font-black italic uppercase tracking-tighter mb-2 md:mb-3 leading-tight drop-shadow-lg font-horror line-clamp-3">{article.title}</h1>
                <p className="text-[8px] md:text-[10px] text-zinc-500 font-mono line-clamp-2 mb-4 md:mb-6 leading-relaxed uppercase tracking-wider">{article.snippet}</p>
                
                <div className="flex flex-wrap items-center gap-3 md:gap-5 mt-auto">
                    <button onClick={onReadHere} className="inline-flex items-center gap-2 bg-pulse-500 hover:bg-white hover:text-black transition-all font-black uppercase italic py-1.5 px-4 md:py-2 md:px-6 text-[8px] md:text-[9px] tracking-widest shadow-[2px_2px_0px_white]">
                        <BookOpenIcon className="w-3 h-3" />
                        <span>Decode</span>
                    </button>
                    <a href={article.link} target="_blank" rel="noopener noreferrer" onClick={onMarkAsRead} className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors font-mono">
                        Original Transm.
                    </a>
                </div>
            </div>
            
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-pulse-500/50 via-neon-400/30 to-pulse-500/50" />
        </div>
    );
};

export default FeaturedStory;
