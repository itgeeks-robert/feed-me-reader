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
        <div className={`group relative flex flex-col bg-void-900 border-2 border-zinc-800 shadow-[6px_6px_0px_black] hover:border-pulse-500/50 hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-300 overflow-hidden h-full ${isRead ? 'opacity-40 grayscale' : ''}`}>
            {/* Visual Header Strip */}
            <div className="h-1 bg-gradient-to-r from-pulse-500/20 via-pulse-500/50 to-pulse-500/20 opacity-40"></div>
            
            <div className="relative aspect-[16/10] w-full overflow-hidden border-b-2 border-zinc-800 bg-black shrink-0">
                <ImageWithProxy
                    src={article.imageUrl}
                    alt=""
                    className="w-full h-full object-cover saturate-[0.6] contrast-125 brightness-90 group-hover:saturate-100 transition-all duration-700 opacity-80"
                    wrapperClassName="w-full h-full"
                    fallback={
                        <div className="w-full h-full static-noise flex flex-col items-center justify-center p-4">
                            <span className="text-[8px] font-black text-signal-500 tracking-[0.2em] uppercase italic animate-pulse">SIG_LOST</span>
                        </div>
                    }
                />
                <div className="absolute inset-0 cctv-overlay pointer-events-none opacity-40" />
                
                {/* Sector/Category Overlay */}
                <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-sm">
                    <div className="w-1 h-1 rounded-full bg-pulse-500" />
                    <span className="text-[7px] font-mono font-black text-zinc-300 uppercase tracking-tighter">ZONE: {article.feedCategory || 'GEN'}</span>
                </div>

                <div className="absolute top-1.5 left-1.5 flex items-center gap-1 opacity-60">
                    <div className="w-1 h-1 rounded-full bg-red-600 animate-pulse" />
                    <span className="text-[6px] font-mono font-bold text-white uppercase tracking-widest">STNDBY</span>
                </div>
            </div>

            <div className="p-3.5 flex flex-col flex-grow bg-void-950/20">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-0.5 bg-void-950 border border-zinc-800">
                        <SmartFeedIcon iconUrl={iconUrl || ''} feedTitle={article.source} sourceType={sourceType} className="w-2.5 h-2.5 grayscale group-hover:grayscale-0 transition-all" />
                    </div>
                    <span className="text-[7px] font-mono font-black text-pulse-600 uppercase tracking-widest truncate">{article.source}</span>
                </div>
                
                <h3 className="font-black text-white italic uppercase tracking-tighter line-clamp-3 leading-tight mb-2 font-horror text-xs group-hover:text-pulse-500 transition-colors">
                    {article.title}
                </h3>
                
                <p className="text-[9px] text-zinc-500 font-mono line-clamp-2 uppercase tracking-tight mb-4 opacity-70">
                    {article.snippet}
                </p>

                <div className="mt-auto flex items-center justify-between border-t border-zinc-800/40 pt-3">
                    <span className="text-[8px] font-mono font-bold text-zinc-600 uppercase tracking-tighter">{timeAgo(article.publishedDate)}</span>
                    <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReadHere(); }} 
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-void-950 border border-pulse-500/20 text-pulse-500 hover:bg-pulse-500 hover:text-white transition-all active:scale-95 shadow-[2px_2px_0px_#e11d48]"
                    >
                        <BookOpenIcon className="w-3 h-3" />
                        <span className="text-[9px] font-black uppercase italic tracking-widest">DECODE</span>
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