import React from 'react';
import type { Article } from '../../src/App';
import type { SourceType } from '../AddSource';
import { RedditIcon, YoutubeIcon, NewspaperIcon, BookOpenIcon } from '../icons';
import ImageWithProxy from '../ImageWithProxy';
import { timeAgo } from '../../services/utils';

const ArticleListItem: React.FC<{ article: Article; onMarkAsRead: () => void; onReadHere: () => void; isRead: boolean; iconUrl?: string; sourceType?: SourceType; }> = ({ article, onMarkAsRead, onReadHere, isRead, iconUrl, sourceType }) => {
    const FallbackDisplay = () => {
        if (sourceType === 'reddit') return <RedditIcon className="w-8 h-8 text-orange-500" />;
        if (sourceType === 'youtube') return <YoutubeIcon className="w-8 h-8 text-red-500" />;
        return <NewspaperIcon className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />;
    };

    return (
        <a href={article.link} target="_blank" rel="noopener noreferrer" onClick={onMarkAsRead}
            className={`flex items-stretch gap-4 bg-white/30 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl hover:border-white/50 dark:hover:border-white/20 hover:shadow-xl transition-all duration-200 overflow-hidden h-32 ${isRead ? 'opacity-50 saturate-50' : ''}`}
        >
            <div className="flex-grow flex flex-col p-4 justify-between overflow-hidden">
                <div>
                    <p className="font-semibold text-zinc-900 dark:text-white line-clamp-3 leading-tight">{article.title}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <div className="flex items-center gap-1.5 min-w-0">
                        {iconUrl && <img src={iconUrl} alt="" className="w-4 h-4 rounded-sm flex-shrink-0" />}
                        <span className="truncate">{article.source}</span>
                    </div>
                    <span className="opacity-50 flex-shrink-0">&middot;</span>
                    <span className="flex-shrink-0">{timeAgo(article.publishedDate)}</span>
                    <span className="opacity-50 flex-shrink-0">&middot;</span>
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReadHere(); }} className="flex items-center gap-1 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
                        <BookOpenIcon className="w-4 h-4" />
                        <span>Read</span>
                    </button>
                </div>
            </div>
            <ImageWithProxy
                src={article.imageUrl}
                alt=""
                className="w-full h-full object-cover"
                wrapperClassName="w-32 flex-shrink-0"
                fallback={
                    <div className="w-full h-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                        <FallbackDisplay />
                    </div>
                }
            />
        </a>
    );
};

export default ArticleListItem;