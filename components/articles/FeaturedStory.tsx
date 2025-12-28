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
                    <div className="w-full h-full static-noise flex flex-col items-center justify-center p-4">
                        <div className="border-4 border-signal-500 p-6 md:p-8 flex flex-col items-center gap-4 shadow-[0_0_40px_rgba(34,197,94,0.3)] animate-pulse">
                            <span className="text-3xl md:text-5xl font-black text-signal-500 tracking-[0.2em] uppercase italic text-center leading-none">SIGNAL<br/>LOST</span>
                            <div className="h-px w-full bg-signal-500/40"></div>
                            <span className="text-[10px] md:text-xs font-mono font-bold text-signal-500 uppercase tracking-widest">0x004_TRANS_ERR</span>
                        </div>
                    </div>
                }
            />
            <div className="absolute inset-0 cctv-overlay pointer-events-none" />
            <div className="absolute top-4 left-4 md:top-6 md:left-6 flex flex-col gap-1 md:gap-2 pointer-events-none">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_#e11d48]" />
                    <span className="text-[9px] md:text-xs font-mono font-bold text-white uppercase tracking-widest drop-shadow-md">REC</span>
                </div>
                <span className="text-[9px] md:text-xs font-mono text-white/70 uppercase tracking-tighter drop-shadow-md">{label}</span>
            </div>
            <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 pointer-events-none">
                <span className="text-[9px] md:text-xs font-mono text-white/50 uppercase tracking-widest drop-shadow-md">
                    {new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        </div>
    );
};

const FeaturedStory: React.FC<{article: Article; onReadHere: () => void; onMarkAsRead: () => void; isRead: boolean;}> = ({ article, onReadHere, onMarkAsRead, isRead }) => {
    return (
        <div className={`group grid grid-cols-1 lg:grid-cols-[1.2fr,1fr] bg-void-900 border-2 border-zinc-800 text-white shadow-[12px_12px_0px_black] overflow-hidden min-h-[400px] transition-all duration-500 hover:translate-x-[-4px] hover:translate-y-[-4px] ${isRead ? 'opacity-50 grayscale' : ''}`}>
            
            <div className="h-64 sm:h-80 lg:h-full border-b-2 lg:border-b-0 lg:border-r-2 border-zinc-800">
                <CCTVMonitor src={article.imageUrl} label={article.source} />
            </div>

            <div className="relative p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-center bg-void-950/40 backdrop-blur-sm border-l-8 border-pulse-500">
                <p className="text-[9px] md:text-xs font-black uppercase tracking-[0.4em] text-pulse-500 mb-3 md:mb-4 font-mono italic">// PRIME SIGNAL INTERCEPT</p>
                <h1 className="text-xl sm:text-2xl md:text-4xl font-black italic uppercase tracking-tighter mb-4 md:mb-6 leading-tight drop-shadow-lg font-horror line-clamp-4">{article.title}</h1>
                <p className="text-xs md:text-base text-white/90 font-mono line-clamp-3 sm:line-clamp-4 lg:line-clamp-5 mb-8 md:mb-12 leading-relaxed uppercase tracking-wider">{article.snippet}</p>
                
                <div className="flex flex-wrap items-center gap-6 md:gap-8 mt-auto">
                    <button onClick={onReadHere} className="inline-flex items-center gap-3 bg-pulse-500 hover:bg-white hover:text-black transition-all font-black uppercase italic py-3 px-8 md:py-4 md:px-10 text-xs md:text-sm tracking-widest shadow-[4px_4px_0px_white]">
                        <BookOpenIcon className="w-4 h-4 md:w-5 md:h-5" />
                        <span>Decode Signal</span>
                    </button>
                    <a href={article.link} target="_blank" rel="noopener noreferrer" onClick={onMarkAsRead} className="text-[10px] md:text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors font-mono">
                        View Original Source
                    </a>
                </div>
            </div>
            
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pulse-500/50 via-neon-400/30 to-pulse-500/50" />
        </div>
    );
};

export default FeaturedStory;