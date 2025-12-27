
import React from 'react';
import type { Article } from '../../src/App';
import type { SourceType } from '../AddSource';
import { BookOpenIcon } from '../icons';
import ImageWithProxy from '../ImageWithProxy';
import { timeAgo } from '../../services/utils';
import { SmartFeedIcon } from '../SmartFeedIcon';

const CCTVThumbnail: React.FC<{ src: string | null; }> = ({ src }) => {
    return (
        <div className="relative w-full h-full bg-black grayscale contrast-125 group-hover:grayscale-0 transition-all duration-500 overflow-hidden">
            <ImageWithProxy
                src={src}
                alt=""
                className="w-full h-full object-cover opacity-70"
                wrapperClassName="w-full h-full"
                fallback={
                    <div className="w-full h-full static-noise flex items-center justify-center">
                        <div className="w-4 h-4 border border-white/10 rounded-full animate-ping" />
                    </div>
                }
            />
            <div className="absolute inset-0 cctv-overlay opacity-40 pointer-events-none" />
            <div className="absolute top-2 left-2 flex items-center gap-1 opacity-60">
                <div className="w-1 h-1 rounded-full bg-red-600" />
                <span className="text-[6px] font-mono font-bold text-white uppercase tracking-widest">LIVE</span>
            </div>
        </div>
    );
};

const ArticleListItem: React.FC<{ article: Article; onMarkAsRead: () => void; onReadHere: () => void; isRead: boolean; iconUrl?: string; sourceType?: SourceType; }> = ({ article, onMarkAsRead, onReadHere, isRead, iconUrl, sourceType }) => {
    return (
        <div className={`group relative grid grid-cols-1 md:grid-cols-[1fr,150px] gap-0 bg-void-900 border border-zinc-800 shadow-[4px_4px_0px_black] hover:border-pulse-500/50 transition-all duration-300 overflow-hidden mb-3 md:mb-4 ${isRead ? 'opacity-40 grayscale' : ''}`}>
            <a href={article.link} target="_blank" rel="noopener noreferrer" onClick={onMarkAsRead} className="absolute inset-0 z-0">
                <span className="sr-only">Read Original: {article.title}</span>
            </a>
            
            <div className="flex flex-col p-3 md:p-4 justify-between overflow-hidden relative z-10 pointer-events-none border-l-[2px] md:border-l-[3px] border-zinc-800 group-hover:border-pulse-500 transition-colors">
                <div className="pointer-events-auto">
                    <div className="flex items-center gap-2 mb-1.5 md:mb-2">
                         <div className="p-0.5 bg-void-950 border border-zinc-800">
                            <SmartFeedIcon iconUrl={iconUrl || ''} feedTitle={article.source} sourceType={sourceType} className="w-2 h-2 grayscale" />
                         </div>
                         <span className="text-[6px] md:text-[7px] font-mono font-bold text-pulse-500 uppercase tracking-[0.2em]">{article.source}</span>
                    </div>
                    <p className="font-black text-[8px] md:text-[10px] text-white line-clamp-2 leading-tight italic uppercase tracking-tighter mb-1 font-horror">{article.title}</p>
                    <p className="text-[7px] md:text-[8px] text-zinc-600 font-mono line-clamp-1 opacity-60 uppercase tracking-wide mb-2">{article.snippet}</p>
                </div>
                
                <div className="flex items-center gap-3 md:gap-4 text-[6px] md:text-[7px] font-mono font-bold uppercase tracking-widest text-zinc-700 pointer-events-auto">
                    <span className="bg-void-950 px-1 py-0.5 border border-zinc-800">{timeAgo(article.publishedDate)}</span>
                    
                    <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReadHere(); }} 
                        className="ml-auto flex items-center gap-1.5 text-pulse-500 hover:text-white bg-void-950 px-2 py-1 border border-pulse-500/20 hover:border-pulse-500 transition-all group active:scale-95"
                    >
                        <BookOpenIcon className="w-2 h-2" />
                        <span className="italic font-black text-[7px]">DEC</span>
                    </button>
                </div>
            </div>

            <div className="hidden md:block h-full border-l border-zinc-800/40">
                <CCTVThumbnail src={article.imageUrl} />
            </div>
        </div>
    );
};

export default ArticleListItem;
