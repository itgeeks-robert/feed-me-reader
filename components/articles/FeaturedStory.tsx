
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
        <div className={`p-6 rounded-3xl text-white shadow-lg relative overflow-hidden h-56 md:h-64 flex flex-col justify-end transition-opacity duration-300 ${isRead ? 'opacity-60 saturate-50' : ''}`}>
            <ImageWithProxy
                src={article.imageUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                wrapperClassName="absolute inset-0"
                fallback={<ModernVectorFallback />}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            </ImageWithProxy>
            
            <div className="relative z-10">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-plant-500 mb-1 italic">{article.source}</p>
                <h1 className="text-lg md:text-xl font-black italic uppercase tracking-tighter my-1 line-clamp-2 leading-tight drop-shadow-lg">{article.title}</h1>
                 <div className="flex items-center gap-2 mt-3">
                    <a href={article.link} target="_blank" rel="noopener noreferrer" onClick={onMarkAsRead} className="inline-block bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm font-black uppercase italic py-1.5 px-4 rounded-full text-[9px] tracking-widest transition-all">
                        Original
                    </a>
                    <button onClick={onReadHere} className="inline-flex items-center gap-2 bg-flesh-600 hover:bg-flesh-500 backdrop-blur-sm font-black uppercase italic py-1.5 px-4 rounded-full text-[9px] tracking-widest transition-all shadow-lg shadow-flesh-500/20">
                        <BookOpenIcon className="w-3.5 h-3.5" />
                        <span>FEED ME!</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FeaturedStory;
