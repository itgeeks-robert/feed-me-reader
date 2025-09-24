import React from 'react';
import type { Article } from '../../src/App';
import { BookOpenIcon } from '../icons';
import ImageWithProxy from '../ImageWithProxy';

const ModernVectorFallback: React.FC = () => (
    <div className="absolute inset-0 overflow-hidden opacity-50">
         <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-br from-indigo-500/30 via-purple-500/30 to-pink-500/30 animate-[spin_20s_linear_infinite]" />
    </div>
);

const FeaturedStory: React.FC<{article: Article; onReadHere: () => void; onMarkAsRead: () => void; isRead: boolean;}> = ({ article, onReadHere, onMarkAsRead, isRead }) => {
    return (
        <div className={`p-6 rounded-3xl text-white shadow-lg relative overflow-hidden h-56 flex flex-col justify-end transition-opacity duration-300 ${isRead ? 'opacity-60 saturate-50' : ''}`}>
            <ImageWithProxy
                src={article.imageUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                wrapperClassName="absolute inset-0"
                fallback={<ModernVectorFallback />}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            </ImageWithProxy>
            
            <div className="relative z-10">
                <p className="text-sm font-semibold opacity-80">{article.source}</p>
                <h1 className="text-2xl font-bold my-1 line-clamp-2 leading-tight">{article.title}</h1>
                 <div className="flex items-center gap-2 mt-3">
                    <a href={article.link} target="_blank" rel="noopener noreferrer" onClick={onMarkAsRead} className="inline-block bg-white/20 hover:bg-white/30 backdrop-blur-sm font-semibold py-2 px-4 rounded-full text-sm transition-colors">
                        Read Original
                    </a>
                    <button onClick={onReadHere} className="inline-flex items-center gap-2 bg-orange-600/80 hover:bg-orange-600 backdrop-blur-sm font-semibold py-2 px-4 rounded-full text-sm transition-colors">
                        <BookOpenIcon className="w-4 h-4" />
                        <span>Read Here</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FeaturedStory;