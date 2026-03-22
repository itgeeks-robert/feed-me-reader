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

const FeaturedStory: React.FC<{article: Article; onReadHere: () => void; onReadExternal: () => void; isRead: boolean;}> = ({ article, onReadHere, onReadExternal, isRead }) => {
    return (
        <div className="relative group/wrapper mb-8">
            <button 
                onClick={onReadHere}
                className={`w-full text-left group relative grid grid-cols-1 lg:grid-cols-[1.5fr,1fr] bg-app-card border border-app-border overflow-hidden min-h-[400px] md:min-h-[450px] transition-all duration-300 hover:border-app-accent/50 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-app-accent rounded-[var(--void-radius)] shadow-md outline-none featured-story-card ${isRead ? 'opacity-60' : ''}`}
            >
                <div className="h-64 sm:h-96 lg:h-auto border-b lg:border-b-0 lg:border-r border-app-border pointer-events-none">
                    <CCTVMonitor src={article.imageUrl} label={article.source} headline={article.title} url={article.link} />
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

export default FeaturedStory;