import React, { useState, useEffect } from 'react';
import type { Article } from '../../src/App';
import { BookOpenIcon, GlobeAltIcon, RadioIcon, BoltIcon, ArrowPathIcon } from '../icons';
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
        <div className="relative w-full h-full bg-black overflow-hidden group/monitor image-halftone-overlay">
            <div className="absolute inset-0 z-0">
                <ImageWithProxy
                    src={activeSrc}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-[20s] group-hover/monitor:scale-110 contrast-[1.1] brightness-[1.0]"
                    wrapperClassName="w-full h-full"
                    fallback={
                        <div className="w-full h-full static-noise flex flex-col items-center justify-center p-4">
                            {isSearching ? (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="void-spinner w-8 h-8 border-4 border-pulse-500/20 border-t-pulse-500 rounded-full animate-spin" />
                                    <span className="text-[10px] font-black text-pulse-500 tracking-widest uppercase italic animate-pulse">RECONSTRUCTING_SIGNAL...</span>
                                </div>
                            ) : (
                                <span className="text-xl font-black text-pulse-500 tracking-widest uppercase italic animate-pulse">NO_SIGNAL</span>
                            )}
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
        </div>
    );
};

const FeaturedStory: React.FC<{article: Article; onReadHere: () => void; onReadExternal: () => void; isRead: boolean;}> = ({ article, onReadHere, onReadExternal, isRead }) => {
    return (
        <div className="relative group/wrapper mb-8">
            <button 
                onClick={onReadHere}
                className={`w-full text-left group relative grid grid-cols-1 lg:grid-cols-[1.5fr,1fr] bg-app-card border border-app-border overflow-hidden min-h-[450px] md:min-h-[500px] transition-all duration-500 hover:border-app-accent hover:shadow-[0_20px_60px_rgba(0,0,0,0.1)] focus:ring-4 focus:ring-pulse-500 rounded-void shadow-[0_20px_40px_rgba(0,0,0,0.4)] outline-none ${isRead ? 'opacity-40' : ''}`}
            >
                <div className="h-64 sm:h-96 lg:h-auto border-b lg:border-b-0 lg:border-r border-app-border pointer-events-none">
                    <CCTVMonitor src={article.imageUrl} label={article.source} headline={article.title} url={article.link} />
                </div>

                <div className="relative p-6 md:p-12 flex flex-col justify-center bg-app-card pointer-events-none">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="bg-pulse-600 text-white text-[8px] font-black px-2 py-0.5 uppercase tracking-widest italic rounded-sm">BREAKING_INTEL</span>
                        <span className="text-muted text-[8px] font-black uppercase tracking-widest truncate">{article.source}</span>
                    </div>
                    
                    <h1 className="text-2xl md:text-5xl font-black italic uppercase tracking-tighter mb-8 leading-[0.95] line-clamp-4 text-app-text group-hover:text-pulse-400 transition-colors drop-shadow-md">
                        {article.title}
                    </h1>
                    
                    <p className="text-sm md:text-base text-muted line-clamp-3 mb-10 leading-relaxed uppercase tracking-tight italic border-l border-app-border pl-6">
                        {article.snippet}
                    </p>
                    
                    <div className="mt-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-app-text/5 border border-app-border rounded-sm">
                            <BoltIcon className="w-4 h-4 text-pulse-500" />
                            <span className="text-[10px] font-black uppercase text-app-text/50 tracking-widest italic">TAP_TO_DECODE</span>
                        </div>
                    </div>
                </div>
            </button>
            
            <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReadExternal(); }}
                className="absolute -bottom-6 right-2 text-[8px] font-black uppercase tracking-[0.3em] text-muted hover:text-app-text transition-colors italic z-20 focus:text-app-text outline-none"
            >
                Access_Raw_Data_Stream_0x{article.id.substring(0,4)}
            </button>
        </div>
    );
};

export default FeaturedStory;