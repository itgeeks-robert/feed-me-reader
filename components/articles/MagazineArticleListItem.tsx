
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
        <div className={`group relative flex flex-col bg-zinc-900 border border-white/5 overflow-hidden h-full transition-all duration-300 hover:bg-zinc-800/80 hover:border-white/15 rounded-sm ${isRead ? 'opacity-30' : ''}`}>
            
            <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-white/5 bg-black shrink-0">
                <ImageWithProxy
                    src={activeSrc}
                    alt=""
                    /* Color Update: Removed saturate-0 and opacity-60 to restore full tactical color clarity by default. */
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
                    <div className="flex gap-4">
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReadHere(); }} className="text-[8px] font-black text-zinc-400 hover:text-white uppercase tracking-widest italic">Link_Node</button>
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReadExternal(); }} className="text-[8px] font-black text-zinc-600 hover:text-white uppercase tracking-widest italic">Raw_Dat</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MagazineArticleListItem;
