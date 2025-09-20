import React, { useState } from 'react';
import type { Article } from '../../src/App';
import { NewspaperIcon, BookOpenIcon } from '../icons';
import { PROXIES } from '../../services/fetch';
import { timeAgo } from '../../services/utils';

const MagazineArticleListItem: React.FC<{ article: Article; onMarkAsRead: () => void; onReadHere: () => void; isRead: boolean; }> = ({ article, onMarkAsRead, onReadHere, isRead }) => {
    const [imageSrc, setImageSrc] = useState(article.imageUrl ? `${PROXIES[0].url}${article.imageUrl}` : '');
    const [imageError, setImageError] = useState(!article.imageUrl);

    return (
        <a href={article.link} target="_blank" rel="noopener noreferrer" onClick={onMarkAsRead}
            className={`flex flex-col bg-white/30 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl hover:border-white/50 dark:hover:border-white/20 hover:shadow-xl transition-all duration-200 overflow-hidden group ${isRead ? 'opacity-50 saturate-50' : ''}`}
        >
            <div className="aspect-video w-full overflow-hidden">
                {article.imageUrl && !imageError ? (
                    <img src={imageSrc} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={() => setImageError(true)} />
                ) : (
                     <div className="w-full h-full bg-black/5 dark:bg-white/5 flex items-center justify-center"><NewspaperIcon className="w-10 h-10 text-zinc-400 dark:text-zinc-500" /></div>
                )}
            </div>
            <div className="p-4 flex flex-col flex-grow justify-between">
                <div>
                    <p className="font-semibold text-zinc-900 dark:text-white line-clamp-3 leading-tight mb-2">{article.title}</p>
                </div>
                 <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 mt-auto">
                     <span className="truncate pr-2">{article.source}</span>
                     <span className="flex-shrink-0">{timeAgo(article.publishedDate)}</span>
                </div>
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReadHere(); }} className="mt-3 w-full flex items-center justify-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg py-2 transition-colors">
                    <BookOpenIcon className="w-4 h-4" />
                    <span>Read Here</span>
                </button>
            </div>
        </a>
    );
};

export default MagazineArticleListItem;
