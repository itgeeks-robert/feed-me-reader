
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
        <div className="relative group/wrapper pb-6">
            <div 
                onClick={onReadHere}
                className={`group relative flex flex-col bg-zinc-900 border border-white/5 overflow-hidden h-full transition-all duration-300 hover:bg-zinc-800/80 hover:border-white/20 hover:shadow-xl cursor-pointer rounded-sm ${isRead ? 'opacity-30' : ''}`}
            >
                <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-white/5 bg-black shrink-0">
                    <ImageWithProxy
                        src={activeSrc}
                        alt=""
                        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105 opacity-100"
                        wrapperClassName="w-full h-full"
                        fallback={<div className="w-full h-full static-noise flex items-center justify-center"></div>}
                    />
                    <div className="absolute inset-0 cctv-overlay pointer-events-none opacity-20" />
                </div>

                <div className="p-4 flex flex-col flex-grow">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-[8px] font-black text-pulse-500 uppercase tracking-widest italic">{article.source}</span>
                    </div>
                    
                    <h3 className="font-black text-white italic uppercase tracking-tighter line-clamp-3 leading-[1.05] mb-4 text-base md:text-lg group-hover:text-pulse-400 transition-colors">
                        {article.title}
                    </h3>
                    
                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[8px] font-mono font-black text-zinc-500 uppercase tracking-widest">{timeAgo(article.publishedDate)}</span>
                        <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                            <div className="w-1 h-1 rounded-full bg-pulse-500 animate-pulse" />
                            <span className="text-[7px] font-black text-white/50 uppercase italic tracking-widest">DECODE</span>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Raw Data Link: Placed outside frame at bottom right */}
            <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReadExternal(); }}
                className="absolute bottom-0 right-1 text-[7px] font-black uppercase tracking-[0.2em] text-zinc-700 hover:text-white transition-colors italic z-20"
            >
                Raw_Dat_0x{article.id.substring(0,4)}
            </button>
        </div>
    );
};

export default MagazineArticleListItem;
