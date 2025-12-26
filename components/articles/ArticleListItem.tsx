
import React from 'react';
import type { Article } from '../../src/App';
import type { SourceType } from '../AddSource';
import { BookOpenIcon } from '../icons';
import ImageWithProxy from '../ImageWithProxy';
import { timeAgo } from '../../services/utils';
import { SmartFeedIcon } from '../SmartFeedIcon';

const ArticleListItem: React.FC<{ article: Article; onMarkAsRead: () => void; onReadHere: () => void; isRead: boolean; iconUrl?: string; sourceType?: SourceType; }> = ({ article, onMarkAsRead, onReadHere, isRead, iconUrl, sourceType }) => {
    return (
        <div className={`relative flex flex-col md:flex-row items-stretch gap-0 bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[1.5rem] md:rounded-[2rem] hover:border-plant-500/30 hover:shadow-[0_0_25px_rgba(34,197,94,0.08)] transition-all duration-300 overflow-hidden mb-4 ${isRead ? 'opacity-40 grayscale blur-[0.3px]' : ''}`}>
            <a href={article.link} target="_blank" rel="noopener noreferrer" onClick={onMarkAsRead} className="absolute inset-0 z-0">
                <span className="sr-only">Read Original: {article.title}</span>
            </a>
            
            <div className="flex-grow flex flex-col p-5 md:p-6 justify-between overflow-hidden relative z-10 pointer-events-none">
                <div className="pointer-events-auto">
                    <p className="font-black text-base md:text-lg text-white line-clamp-2 leading-snug italic uppercase tracking-tighter mb-2 pr-10 md:pr-0">{article.title}</p>
                    <p className="text-[10px] text-zinc-500 font-medium line-clamp-1 opacity-60 italic mb-2">{article.snippet}</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 text-[9px] font-black uppercase tracking-widest text-zinc-500 pointer-events-auto mt-2">
                    <div className="flex items-center gap-2 min-w-0 bg-black/40 px-2 py-1 rounded-full border border-white/5">
                        <SmartFeedIcon iconUrl={iconUrl || ''} feedTitle={article.source} sourceType={sourceType} className="w-2.5 h-2.5 rounded-sm" />
                        <span className="truncate text-plant-500">{article.source}</span>
                    </div>
                    <span className="bg-zinc-800/50 px-2 py-1 rounded-full">{timeAgo(article.publishedDate)}</span>
                    
                    <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReadHere(); }} 
                        className="ml-auto flex items-center gap-2 text-flesh-500 hover:text-white hover:bg-flesh-600 bg-flesh-900/20 px-3 py-1.5 rounded-full border border-flesh-500/30 transition-all group active:scale-95"
                    >
                        <BookOpenIcon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                        <span className="italic font-black text-[10px]">FEED ME!</span>
                    </button>
                </div>
            </div>

            <div className="relative w-full md:w-48 h-32 md:h-auto flex-shrink-0 z-10 pointer-events-none">
                <ImageWithProxy
                    src={article.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    wrapperClassName="w-full h-full"
                    fallback={
                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                          <SmartFeedIcon iconUrl={iconUrl || ''} feedTitle={article.source} sourceType={sourceType} className="w-10 h-10 opacity-10" />
                        </div>
                    }
                />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-zinc-950/60 via-transparent to-transparent"></div>
            </div>
        </div>
    );
};

export default ArticleListItem;
