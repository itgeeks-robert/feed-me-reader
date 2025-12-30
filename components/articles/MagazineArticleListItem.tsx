import React, { useState, useEffect } from 'react';
import type { Article } from '../../src/App';
import type { SourceType } from '../AddSource';
import { BookOpenIcon, GlobeAltIcon } from '../icons';
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
        <div className={`group relative flex flex-col bg-void-900 border-2 border-zinc-300 dark:border-zinc-800 shadow-[6px_6px_0px_black] dark:shadow-[6px_6px_0px_#000] hover:border-pulse-500/50 hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-300 overflow-hidden h-full ${isRead ? 'opacity-40 grayscale' : ''}`}>
            <div className="h-1 bg-gradient-to-r from-pulse-500/20 via-pulse-500/50 to-pulse-500/20 opacity-40"></div>
            
            <div className="relative aspect-[16/10] w-full overflow-hidden border-b-2 border-zinc-300 dark:border-zinc-800 bg-black shrink-0">
                <ImageWithProxy
                    src={activeSrc}
                    alt=""
                    className="w-full h-full object-cover saturate-[0.6] contrast-125 brightness-90 group-hover:saturate-100 transition-all duration-700 opacity-80 animate-fade-in"
                    wrapperClassName="w-full h-full"
                    fallback={
                        <div className="w-full h-full static-noise flex flex-col items-center justify-center p-4">
                            <span className="text-[8px] font-black text-signal-500 tracking-[0.2em] uppercase italic animate-pulse text-center">
                                {isSearching ? "DEEP_SCAN" : "SIG_LOST"}
                            </span>
                        </div>
                    }
                />
                <div className="absolute inset-0 cctv-overlay pointer-events-none opacity-40" />
                
                <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-sm">
                    <div className={`w-1 h-1 rounded-full ${reconstructedSrc && !article.imageUrl ? 'bg-amber-500 animate-pulse' : 'bg-pulse-500'}`} />
                    <span className="text-[7px] font-mono font-black text-zinc-300 uppercase tracking-tighter">
                        {reconstructedSrc && !article.imageUrl ? 'RECON' : `ZONE: ${article.feedCategory || 'GEN'}`}
                    </span>
                </div>

                <div className="absolute top-1.5 left-1.5 flex items-center gap-1 opacity-60">
                    <div className="w-1 h-1 rounded-full bg-red-600 animate-pulse" />
                    <span className="text-[6px] font-mono font-bold text-white uppercase tracking-widest">STNDBY</span>
                </div>
            </div>

            <div className="p-3.5 flex flex-col flex-grow bg-void-950/20">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-0.5 bg-void-950 border border-zinc-300 dark:border-zinc-800">
                        <SmartFeedIcon iconUrl={iconUrl || ''} feedTitle={article.source} sourceType={sourceType} className="w-2.5 h-2.5 grayscale group-hover:grayscale-0 transition-all" />
                    </div>
                    <span className="text-[7px] font-mono font-black text-pulse-600 dark:text-pulse-500 uppercase tracking-widest truncate">{article.source}</span>
                </div>
                
                <h3 className="font-black text-zinc-900 dark:text-white italic uppercase tracking-tighter line-clamp-3 leading-tight mb-2 font-horror text-xs group-hover:text-pulse-600 dark:group-hover:text-pulse-500 transition-colors">
                    {article.title}
                </h3>
                
                <p className="text-[9px] text-zinc-600 dark:text-zinc-400 font-mono line-clamp-2 uppercase tracking-tight mb-4">
                    {article.snippet}
                </p>

                <div className="mt-auto flex flex-col gap-2.5 border-t border-zinc-200 dark:border-zinc-800/40 pt-3">
                    <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReadHere(); }} 
                        className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-pulse-500 text-white font-black uppercase italic tracking-widest shadow-[2px_2px_0px_black] dark:shadow-[2px_2px_0px_white] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all text-[10px]"
                    >
                        <BookOpenIcon className="w-3.5 h-3.5" />
                        <span>Analyze Local</span>
                    </button>
                    
                    <div className="flex items-center justify-between">
                        <span className="text-[8px] font-mono font-bold text-zinc-500 dark:text-zinc-600 uppercase tracking-tighter">{timeAgo(article.publishedDate)}</span>
                        <button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReadExternal(); }} 
                            className="text-[8px] font-black uppercase text-zinc-500 hover:text-terminal transition-colors underline decoration-dotted underline-offset-2 flex items-center gap-1"
                        >
                            <GlobeAltIcon className="w-2.5 h-2.5" />
                            Raw Stream
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MagazineArticleListItem;