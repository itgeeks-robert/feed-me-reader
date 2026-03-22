import React, { useState, useEffect } from 'react';
import type { Article } from '../../src/App';
import type { SourceType } from '../AddSource';
import { BookOpenIcon, GlobeAltIcon, RadioIcon } from '../icons';
import ImageWithProxy from '../ImageWithProxy';
import { timeAgo } from '../../services/utils';
import { SmartFeedIcon } from '../SmartFeedIcon';
import { reconstructSignalImage } from '../../services/imageSearchService';

interface MagazineArticleListItemProps {
    article: Article;
    onMarkAsRead: () => void;
    onReadHere: () => void;
    onReadExternal: () => void;
    isRead: boolean;
    sourceType?: SourceType;
    iconUrl?: string;
}

const MagazineArticleListItem: React.FC<MagazineArticleListItemProps> = ({ article, onMarkAsRead, onReadHere, onReadExternal, isRead, sourceType, iconUrl }) => {
    const [reconstructedSrc, setReconstructedSrc] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (!article.imageUrl && !reconstructedSrc && !isSearching) {
            setIsSearching(true);
            reconstructSignalImage(article.title, article.link).then(foundUrl => {
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
                className={`w-full text-left group relative flex flex-col bg-app-card border border-app-border overflow-hidden h-full transition-all duration-300 hover:border-app-accent/50 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-app-accent rounded-[var(--void-radius)] shadow-sm outline-none ${isRead ? 'opacity-60' : ''}`}
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

                <div className="p-5 flex flex-col flex-grow pointer-events-none">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-bold text-app-accent uppercase tracking-wider">{article.source}</span>
                    </div>
                    
                    <h3 className="font-bold text-app-text line-clamp-3 leading-snug mb-4 text-base md:text-lg group-hover:text-app-accent transition-colors">
                        {article.title}
                    </h3>
                    
                    <div className="mt-auto pt-4 border-t border-app-border/50 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted">{timeAgo(article.publishedDate)}</span>
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

export default MagazineArticleListItem;