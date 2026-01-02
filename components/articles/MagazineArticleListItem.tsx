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
        <div className={`group relative flex flex-col bg-zinc-900 border-2 border-zinc-800 shadow-[6px_6px_0px_#000] hover:border-pulse-500/50 hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-300 overflow-hidden h-full ${isRead ? 'opacity-30 grayscale blur-[0.5px]' : ''}`}>
            
            <div className="relative aspect-[16/10] w-full overflow-hidden border-b-2 border-zinc-800 bg-black shrink-0">
                <ImageWithProxy
                    src={activeSrc}
                    alt=""
                    className="w-full h-full object-cover saturate-0 contrast-[1.4] brightness-[0.7] group-hover:saturate-50 group-hover:brightness-90 transition-all duration-1000 opacity-60 animate-fade-in"
                    wrapperClassName="w-full h-full"
                    fallback={
                        <div className="w-full h-full static-noise flex flex-col items-center justify-center p-4">
                            <span className="text-[9px] font-black text-signal-600 tracking-[0.3em] uppercase italic animate-pulse text-center">
                                {isSearching ? "Probing..." : "Off_Air"}
                            </span>
                        </div>
                    }
                />
                <div className="absolute inset-0 cctv-overlay pointer-events-none opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                
                <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 bg-black/80 backdrop-blur-md border border-white/5 rounded-sm">
                    <div className={`w-1 h-1 rounded-full ${reconstructedSrc && !article.imageUrl ? 'bg-amber-500 animate-pulse' : 'bg-pulse-600'}`} />
                    <span className="text-[8px] font-mono font-black text-zinc-500 uppercase tracking-tighter">
                        {article.feedCategory || 'CORE'}
                    </span>
                </div>

                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 opacity-40">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] font-mono font-black text-white uppercase tracking-widest italic">SYNC_ACTIVE</span>
                </div>
            </div>

            <div className="p-5 flex flex-col flex-grow bg-void-950/40">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-1 bg-black border border-zinc-800">
                        <SmartFeedIcon iconUrl={iconUrl || ''} feedTitle={article.source} sourceType={sourceType} className="w-3.5 h-3.5 grayscale opacity-60 group-hover:opacity-100 transition-all" />
                    </div>
                    <span className="text-[9px] font-mono font-black text-zinc-600 uppercase tracking-[0.2em] truncate italic">{article.source}</span>
                </div>
                
                <h3 className="font-black text-white italic uppercase tracking-tighter line-clamp-3 leading-[1.1] mb-4 font-horror text-base md:text-lg group-hover:text-pulse-500 transition-colors">
                    {article.title}
                </h3>
                
                <p className="text-[10px] md:text-[11px] text-zinc-500 font-mono line-clamp-3 md:line-clamp-4 uppercase tracking-tight mb-8 leading-relaxed italic opacity-70">
                    {article.snippet}
                </p>

                <div className="mt-auto flex flex-col gap-4 pt-4 border-t border-zinc-800/60">
                    <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReadHere(); }} 
                        className="flex items-center justify-center gap-3 w-full py-3.5 bg-zinc-800 border-t-2 border-l-2 border-white/5 border-b-2 border-r-2 border-black text-zinc-300 font-black uppercase italic tracking-widest hover:bg-pulse-600 hover:text-white hover:border-pulse-400 transition-all text-[10px] active:scale-95 shadow-lg"
                    >
                        <BookOpenIcon className="w-4 h-4" />
                        <span>Link_Node</span>
                    </button>
                    
                    <div className="flex items-center justify-between">
                        <span className="text-[8px] font-mono font-black text-zinc-700 uppercase tracking-widest">{timeAgo(article.publishedDate)}</span>
                        <button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReadExternal(); }} 
                            className="text-[8px] font-black uppercase text-zinc-600 hover:text-emerald-500 transition-colors flex items-center gap-2 tracking-widest"
                        >
                            <GlobeAltIcon className="w-3 h-3" />
                            RAW_DAT
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MagazineArticleListItem;