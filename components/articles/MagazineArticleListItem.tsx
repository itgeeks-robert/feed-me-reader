import React from 'react';
import type { Article } from '../../src/App';
import type { SourceType } from '../AddSource';
import { BookOpenIcon } from '../icons';
import ImageWithProxy from '../ImageWithProxy';
import { timeAgo } from '../../services/utils';
import { SmartFeedIcon } from '../SmartFeedIcon';

interface MagazineArticleListItemProps {
    article: Article;
    onMarkAsRead: () => void;
    onReadHere: () => void;
    isRead: boolean;
    sourceType?: SourceType;
    iconUrl?: string;
}

const MagazineArticleListItem: React.FC<MagazineArticleListItemProps> = ({ article, onMarkAsRead, onReadHere, isRead, sourceType, iconUrl }) => {
    return (
        <div className={`group relative flex flex-col bg-void-900 border-2 border-zinc-800 shadow-[8px_8px_0px_black] hover:border-pulse-500/50 hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-300 overflow-hidden ${isRead ? 'opacity-40 grayscale' : ''}`}>
            {/* Visual Header Strip */}
            <div className="h-1 bg-gradient-to-r from-pulse-500/20 via-pulse-500/50 to-pulse-500/20 opacity-40"></div>
            
            <div className="relative aspect-video w-full overflow-hidden border-b-2 border-zinc-800 bg-black">
                <ImageWithProxy
                    src={article.imageUrl}
                    alt=""
                    className="w-full h-full object-cover saturate-[0.6] contrast-125 brightness-90 group-hover:saturate-100 transition-all duration-700 opacity-80"
                    wrapperClassName="w-full h-full"
                    fallback={
                        <div className="w-full h-full static-noise flex flex-col items-center justify-center p-4">
                            <span className="text-[10px] font-black text-signal-500 tracking-[0.3em] uppercase italic animate-pulse">SIGNAL_LOST</span>
                            <div className="w-1/2 h-px bg-signal-500/20 mt-2"></div>
                        </div>
                    }
                />
                <div className="absolute inset-0 cctv-overlay pointer-events-none opacity-40" />
                <div className="absolute top-2 left-2 flex items-center gap-1.5 opacity-60">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                    <span className="text-[7px] font-mono font-bold text-white uppercase tracking-widest">STNDBY</span>
                </div>
            </div>

            <div className="p-5 flex flex-col flex-grow bg-void-950/20">
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-0.5 bg-void-950 border border-zinc-800">
                        <SmartFeedIcon iconUrl={iconUrl || ''} feedTitle={article.source} sourceType={sourceType} className="w-3 h-3 grayscale group-hover:grayscale-0 transition-all" />
                    </div>
                    <span className="text-[8px] font-mono font-black text-pulse-600 uppercase tracking-widest truncate">{article.source}</span>
                </div>
                
                <h3 className="font-black text-white italic uppercase tracking-tighter line-clamp-3 leading-tight mb-3 font-horror text-sm group-hover:text-pulse-500 transition-colors">
                    {article.title}
                </h3>
                
                <p className="text-[10px] text-zinc-400 font-mono line-clamp-2 uppercase tracking-wide mb-6 opacity-80">
                    {article.snippet}
                </p>

                <div className="mt-auto flex items-center justify-between border-t border-zinc-800/50 pt-4">
                    <span className="text-[9px] font-mono font-bold text-zinc-600 uppercase tracking-tighter">{timeAgo(article.publishedDate)}</span>
                    <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReadHere(); }} 
                        className="flex items-center gap-2 px-4 py-2 bg-void-950 border border-pulse-500/20 text-pulse-500 hover:bg-pulse-500 hover:text-white transition-all active:scale-95 shadow-[3px_3px_0px_#e11d48]"
                    >
                        <BookOpenIcon className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase italic tracking-widest">DECODE</span>
                    </button>
                </div>
            </div>
            
            {/* Hidden link for SEO/accessibility */}
            <a href={article.link} target="_blank" rel="noopener noreferrer" onClick={onMarkAsRead} className="absolute inset-0 z-0">
                <span className="sr-only">Access Original: {article.title}</span>
            </a>
        </div>
    );
};

export default MagazineArticleListItem;