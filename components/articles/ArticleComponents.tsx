import React, { useState, useEffect } from 'react';
import type { Article } from '../../src/App';
import type { SourceType } from '../SharedUI';
import { BookOpenIcon, GlobeAltIcon, ArrowPathIcon } from '../icons';
import { ImageWithProxy, SmartFeedIcon } from '../SharedUI';
import { timeAgo } from '../../services/utils';
import { reconstructSignalImage } from '../../services/imageSearchService';

// --- CCTVThumbnail (Shared) ---
const CCTVThumbnail: React.FC<{ src: string | null; }> = ({ src }) => {
    return (
        <div className="relative w-full h-full bg-black saturate-[0.5] contrast-125 brightness-90 transition-all duration-500 overflow-hidden">
            <ImageWithProxy
                src={src}
                alt=""
                className="w-full h-full object-cover opacity-70"
                wrapperClassName="w-full h-full"
                fallback={
                    <div className="w-full h-full static-noise flex flex-col items-center justify-center p-2">
                        <span className="text-[10px] font-black text-signal-500 tracking-widest uppercase italic animate-pulse">NO_IMAGE</span>
                        <div className="w-full h-px bg-signal-500/20 mt-1"></div>
                    </div>
                }
            />
            <div className="absolute inset-0 cctv-overlay opacity-40 pointer-events-none" />
            <div className="absolute top-2 left-2 flex items-center gap-1.5 opacity-60">
                <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                <span className="text-[8px] font-mono font-bold text-white uppercase tracking-widest">LIVE</span>
            </div>
        </div>
    );
};

// --- CCTVMonitor (Shared) ---
const CCTVMonitor: React.FC<{ src: string | null; headline: string; url: string }> = ({ src, headline, url }) => {
    const [reconstructedSrc, setReconstructedSrc] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (!src && !reconstructedSrc && !isSearching) {
            setIsSearching(true);
            reconstructSignalImage(url).then(foundUrl => {
                if (foundUrl) setReconstructedSrc(foundUrl);
                setIsSearching(false);
            });
        }
    }, [src, headline, url]);

    const activeSrc = src || reconstructedSrc;

    return (
        <div className="relative w-full h-full bg-app-bg overflow-hidden group/monitor">
            <div className="absolute inset-0 z-0">
                <ImageWithProxy
                    src={activeSrc}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-[20s] group-hover/monitor:scale-105"
                    wrapperClassName="w-full h-full"
                    fallback={
                        <div className="w-full h-full bg-app-card flex flex-col items-center justify-center p-4">
                            {isSearching ? (
                                <div className="flex flex-col items-center gap-3">
                                    <ArrowPathIcon className="w-6 h-6 text-app-accent animate-spin" />
                                    <span className="text-xs font-medium text-muted tracking-wide">Loading Image...</span>
                                </div>
                            ) : (
                                <span className="text-sm font-medium text-muted tracking-wide">No Image Available</span>
                            )}
                        </div>
                    }
                />
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none z-10" />
            
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-black/50 backdrop-blur-md border border-white/10 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-app-accent animate-pulse" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Featured</span>
                </div>
            </div>
        </div>
    );
};

// --- ArticleListItem ---
export const ArticleListItem: React.FC<{ article: Article; onMarkAsRead: () => void; onReadHere: () => void; onReadExternal?: () => void; isRead: boolean; iconUrl?: string; sourceType?: SourceType; }> = ({ article, onMarkAsRead, onReadHere, onReadExternal, isRead, iconUrl, sourceType }) => {
    return (
        <div className={`group relative grid grid-cols-1 md:grid-cols-[1fr,200px] gap-0 bg-void-900 border border-zinc-800 shadow-[6px_6px_0px_black] hover:border-pulse-500/50 transition-all duration-300 overflow-hidden mb-4 md:mb-6 ${isRead ? 'opacity-40 grayscale' : ''}`}>
            <a href={article.link} target="_blank" rel="noopener noreferrer" onClick={onMarkAsRead} className="absolute inset-0 z-0">
                <span className="sr-only">Read Original: {article.title}</span>
            </a>
            
            <div className="flex flex-col p-4 md:p-6 justify-between overflow-hidden relative z-10 pointer-events-none border-l-[4px] md:border-l-[6px] border-zinc-800 group-hover:border-pulse-500 transition-colors">
                <div className="pointer-events-auto">
                    <div className="flex items-center gap-3 mb-3 md:mb-4">
                         <div className="p-1 bg-void-950 border border-zinc-800">
                            <SmartFeedIcon iconUrl={iconUrl || ''} feedTitle={article.source} sourceType={sourceType} className="w-3.5 h-3.5 grayscale" />
                         </div>
                         <span className="text-[10px] md:text-xs font-mono font-bold text-pulse-500 uppercase tracking-[0.3em]">{article.source}</span>
                    </div>
                    <p className="font-black text-base md:text-xl text-white line-clamp-3 leading-tight italic uppercase tracking-tighter mb-2 md:mb-3 font-horror">{article.title}</p>
                    <p className="text-xs md:text-sm text-zinc-200 font-mono line-clamp-2 uppercase tracking-wide mb-4 md:mb-6">{article.snippet}</p>
                </div>
                
                <div className="flex items-center gap-4 md:gap-6 text-[10px] md:text-xs font-mono font-bold uppercase tracking-widest text-zinc-600 pointer-events-auto">
                    <span className="bg-void-950 px-2 py-1 border border-zinc-800">{timeAgo(article.publishedDate)}</span>
                    
                    <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReadHere(); }} 
                        className="ml-auto flex items-center gap-2 text-pulse-500 hover:text-white bg-void-950 px-4 py-2 border border-pulse-500/20 hover:border-pulse-500 transition-all group active:scale-95 shadow-[2px_2px_0px_#e11d48]"
                    >
                        <BookOpenIcon className="w-4 h-4" />
                        <span className="italic font-black text-xs uppercase tracking-widest">Decode</span>
                    </button>
                    {onReadExternal && (
                        <button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReadExternal(); }}
                            className="flex items-center gap-2 text-zinc-500 hover:text-white bg-void-950 px-4 py-2 border border-zinc-800 hover:border-zinc-600 transition-all group active:scale-95 shadow-[2px_2px_0px_#3f3f46]"
                        >
                            <GlobeAltIcon className="w-4 h-4" />
                            <span className="italic font-black text-xs uppercase tracking-widest">Original</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="hidden md:block h-full border-l-2 border-zinc-800/40">
                <CCTVThumbnail src={article.imageUrl} />
            </div>
        </div>
    );
};

// --- FeaturedStory ---
export const FeaturedStory: React.FC<{article: Article; onReadHere: () => void; onReadExternal: () => void; isRead: boolean;}> = ({ article, onReadHere, onReadExternal, isRead }) => {
    return (
        <div className="relative group/wrapper mb-8">
            <button 
                onClick={onReadHere}
                className={`w-full text-left group relative grid grid-cols-1 lg:grid-cols-[1.5fr,1fr] bg-app-card border border-app-border overflow-hidden min-h-[400px] md:min-h-[450px] transition-all duration-300 hover:border-app-accent/50 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-app-accent rounded-[var(--void-radius)] shadow-md outline-none featured-story-card ${isRead ? 'opacity-60' : ''}`}
            >
                <div className="h-64 sm:h-96 lg:h-auto border-b lg:border-b-0 lg:border-r border-app-border pointer-events-none">
                    <CCTVMonitor src={article.imageUrl} headline={article.title} url={article.link} />
                </div>

                <div className="relative p-6 md:p-10 flex flex-col justify-center bg-app-card pointer-events-none">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="bg-app-accent/10 text-app-accent text-[10px] font-bold px-2.5 py-1 uppercase tracking-wider rounded-full">Top Story</span>
                        <span className="text-muted text-xs font-medium tracking-wide truncate">{article.source}</span>
                    </div>
                    
                    <h1 className="text-2xl md:text-4xl font-bold tracking-tight mb-6 leading-tight line-clamp-4 text-app-text group-hover:text-app-accent transition-colors">
                        {article.title}
                    </h1>
                    
                    <p className="text-sm md:text-base text-muted line-clamp-3 mb-8 leading-relaxed">
                        {article.snippet}
                    </p>
                    
                    <div className="mt-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-app-bg border border-app-border rounded-[var(--void-radius)] group-hover:bg-app-accent/5 transition-colors">
                            <BookOpenIcon className="w-4 h-4 text-app-accent" />
                            <span className="text-xs font-semibold text-app-text tracking-wide">Read Article</span>
                        </div>
                    </div>
                </div>
            </button>
            
            <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReadExternal(); }}
                className="absolute -bottom-8 right-4 text-xs font-medium text-muted hover:text-app-accent transition-colors z-20 focus-visible:text-app-accent outline-none flex items-center gap-1"
            >
                <span>View Original</span>
                <GlobeAltIcon className="w-3 h-3" />
            </button>
        </div>
    );
};

// --- MagazineArticleListItem ---
export const MagazineArticleListItem: React.FC<{ article: Article; onMarkAsRead: () => void; onReadHere: () => void; onReadExternal: () => void; isRead: boolean; sourceType?: SourceType; iconUrl?: string; }> = ({ article, onReadHere, onReadExternal, isRead }) => {
    const [reconstructedSrc, setReconstructedSrc] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (!article.imageUrl && !reconstructedSrc && !isSearching) {
            setIsSearching(true);
            reconstructSignalImage(article.link).then(foundUrl => {
                if (foundUrl) setReconstructedSrc(foundUrl);
                setIsSearching(false);
            });
        }
    }, [article.imageUrl, article.title, article.link]);

    const activeSrc = article.imageUrl || reconstructedSrc;

    return (
        <div className="relative group/wrapper h-full">
            <button 
                onClick={onReadHere}
                className={`w-full text-left group relative flex flex-col bg-app-card border border-app-border overflow-hidden h-full transition-all duration-300 hover:border-app-accent/50 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-app-accent rounded-[var(--void-radius)] shadow-sm outline-none magazine-article-card ${isRead ? 'opacity-60' : ''}`}
            >
                <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-app-border shrink-0 pointer-events-none bg-app-bg">
                    <ImageWithProxy
                        src={activeSrc}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        wrapperClassName="w-full h-full"
                        fallback={
                            <div className="w-full h-full bg-app-bg flex items-center justify-center">
                                {isSearching ? (
                                    <div className="w-5 h-5 border-2 border-app-accent/20 border-t-app-accent rounded-full animate-spin" />
                                ) : (
                                    <span className="text-xs font-medium text-muted">No Image</span>
                                )}
                            </div>
                        }
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                </div>

                <div className="p-3 md:p-4 flex flex-col flex-grow pointer-events-none">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] font-bold text-app-accent uppercase tracking-wider">{article.source}</span>
                    </div>
                    
                    <h3 className="font-bold text-app-text line-clamp-2 leading-tight mb-2 text-sm md:text-base group-hover:text-app-accent transition-colors">
                        {article.title}
                    </h3>
                    
                    <div className="mt-auto pt-2 border-t border-app-border/50 flex items-center justify-between">
                        <span className="text-[10px] font-medium text-muted">{timeAgo(article.publishedDate)}</span>
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-app-accent">
                            <span className="text-xs font-semibold tracking-wide">Read</span>
                            <BookOpenIcon className="w-3.5 h-3.5" />
                        </div>
                    </div>
                </div>
            </button>
            
            <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReadExternal(); }}
                className="absolute -bottom-6 right-2 text-[10px] font-medium text-muted hover:text-app-accent transition-colors z-20 focus-visible:text-app-accent outline-none flex items-center gap-1 opacity-0 group-hover/wrapper:opacity-100"
            >
                <span>Original</span>
                <GlobeAltIcon className="w-3 h-3" />
            </button>
        </div>
    );
};
