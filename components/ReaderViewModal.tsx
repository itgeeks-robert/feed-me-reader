import React, { useState, useEffect, useRef } from 'react';
import type { Article } from '../src/App';
import { XIcon } from './icons';
import { fetchAndCacheArticleContent } from '../services/readerService';

interface ReaderViewModalProps {
    article: Article;
    onClose: () => void;
    onMarkAsRead: (articleId: string) => void;
}

const ReaderViewModal: React.FC<ReaderViewModalProps> = ({ article, onClose, onMarkAsRead }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [parsedContent, setParsedContent] = useState<{ title: string; content: string } | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        onMarkAsRead(article.id);
        const fetchContent = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const content = await fetchAndCacheArticleContent(article);
                setParsedContent(content);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'An unknown error occurred.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchContent();
    }, [article, onMarkAsRead]);
    
    useEffect(() => {
        if (parsedContent && contentRef.current) {
            contentRef.current.innerHTML = parsedContent.content;
        }
    }, [parsedContent]);

    return (
        <div className="fixed inset-0 bg-void-950/95 backdrop-blur-xl z-50 flex items-end md:items-center justify-center p-0 md:p-10" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-void-900 w-full max-w-5xl h-[92vh] md:h-full md:rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.9)] border border-white/5 flex flex-col overflow-hidden animate-slide-in-up ring-4 ring-pulse-950/50" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-6 md:p-8 border-b border-white/5 flex-shrink-0 pt-safe">
                    <div className="flex-grow min-w-0 pr-6">
                        {isLoading ? (
                            <div className="h-6 bg-zinc-800 rounded-full w-3/4 animate-pulse"></div>
                        ) : (
                            <h2 className="text-base md:text-lg font-black text-white truncate uppercase italic tracking-tighter leading-tight drop-shadow-md">{parsedContent?.title || article.title}</h2>
                        )}
                        <p className="text-[9px] font-black text-pulse-500 uppercase tracking-[0.4em] mt-1 italic font-mono">{article.source} // DATA INTERCEPT</p>
                    </div>
                    <button onClick={onClose} className="p-3 md:p-4 rounded-[1.5rem] bg-void-950 text-zinc-400 hover:text-white hover:bg-pulse-600 transition-all flex-shrink-0 active:scale-90 border border-white/5 shadow-lg" aria-label="Close">
                        <XIcon className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                </header>
                
                <div className="p-8 md:p-16 overflow-y-auto flex-grow prose prose-sm md:prose-base prose-invert max-w-none 
                    prose-h1:text-2xl prose-h1:font-black prose-h1:italic prose-h1:tracking-tighter prose-h1:uppercase
                    prose-p:text-base prose-p:leading-relaxed prose-p:text-zinc-300 prose-p:font-medium
                    prose-img:rounded-[2.5rem] prose-img:shadow-[0_0_50px_rgba(0,0,0,0.5)] prose-img:mx-auto prose-img:border-2 prose-img:border-white/5
                    prose-a:text-pulse-500 prose-a:italic prose-a:font-black hover:prose-a:text-pulse-400
                    scrollbar-hide">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-full gap-8 py-20">
                            <div className="w-16 h-16 border-4 border-void-950 border-t-pulse-500 rounded-full animate-spin"></div>
                            <span className="text-xs font-black uppercase tracking-[0.6em] text-pulse-500 italic animate-pulse font-mono">Processing Signals...</span>
                        </div>
                    )}
                    {error && (
                        <div className="text-center py-20 bg-black/40 rounded-[3rem] border-2 border-red-500/20 m-4">
                            <div className="text-5xl mb-6 animate-bounce">⚠️</div>
                            <p className="font-black uppercase tracking-widest text-white text-xl italic mb-4 glitch-text">Frequency Corruption</p>
                            <p className="text-zinc-500 text-[10px] uppercase font-mono mb-10 max-w-md mx-auto tracking-widest">{error}</p>
                            <a href={article.link} target="_blank" rel="noopener noreferrer" className="inline-block px-10 py-4 bg-pulse-600 text-white rounded-full font-black uppercase tracking-[0.2em] italic hover:scale-105 transition-transform shadow-xl">
                                Access Raw Stream
                            </a>
                        </div>
                    )}
                    {parsedContent && <div ref={contentRef} className="animate-fade-in" />}
                </div>
                
                {/* Visual Footer Elements */}
                <div className="h-2 bg-gradient-to-r from-pulse-500 via-neon-400 to-pulse-500 opacity-30"></div>
            </div>
        </div>
    );
};

export default ReaderViewModal;