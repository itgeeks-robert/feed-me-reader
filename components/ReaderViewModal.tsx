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
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-6" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-void-950 w-full max-w-5xl h-full flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] border-4 border-zinc-800 relative animate-fade-in" onClick={e => e.stopPropagation()}>
                <div className="absolute inset-0 border-t-2 border-l-2 border-zinc-700/30 pointer-events-none z-10" />
                <div className="absolute inset-0 border-b-2 border-r-2 border-black/40 pointer-events-none z-10" />

                <header className="h-10 bg-pulse-600 flex items-center justify-between px-1 relative z-20 border-b-2 border-black">
                    <div className="flex items-center gap-2 h-full">
                        <button onClick={onClose} className="w-8 h-7 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center active:bg-zinc-400">
                            <div className="w-4 h-1 bg-black shadow-[0_4px_0_black]" />
                        </button>
                        <h2 className="text-white text-[10px] md:text-xs font-black uppercase tracking-widest truncate max-w-[200px] md:max-w-md italic px-2">
                           SIG_DECODE: {parsedContent?.title || article.title}
                        </h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-7 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center hover:bg-white transition-colors">
                        <XIcon className="w-4 h-4 text-black" />
                    </button>
                </header>
                
                <div className="flex-grow overflow-y-auto bg-void-950 p-6 md:p-12 relative scrollbar-hide">
                    <div className="absolute inset-0 pointer-events-none opacity-5 cctv-overlay z-10" />
                    
                    <div className="relative z-20 prose prose-sm md:prose-base dark:prose-invert max-w-none 
                        text-terminal selection:bg-pulse-500 selection:text-white font-mono
                        prose-h1:text-2xl prose-h1:font-black prose-h1:italic prose-h1:tracking-tighter prose-h1:uppercase
                        prose-h2:text-xl prose-h2:font-black prose-h2:italic
                        prose-p:text-sm prose-p:leading-relaxed
                        prose-img:border-4 prose-img:border-zinc-800 prose-img:shadow-2xl
                        prose-a:text-pulse-500 prose-a:italic prose-a:font-black
                        prose-strong:font-black">
                        
                        {isLoading && (
                            <div className="flex flex-col items-center justify-center h-full gap-8 py-20">
                                <div className="p-4 border-2 border-pulse-500 animate-pulse">
                                    <span className="text-xs font-black uppercase tracking-[0.6em] text-pulse-500 italic font-mono">Decoding Signal Sequence...</span>
                                </div>
                            </div>
                        )}
                        
                        {error && (
                            <div className="text-center py-20 border-2 border-red-500/20 bg-black/40">
                                <p className="font-black uppercase tracking-widest text-red-500 text-lg italic mb-4">Signal Corruption</p>
                                <p className="text-zinc-500 text-[10px] uppercase font-mono mb-10 tracking-widest">{error}</p>
                                <a href={article.link} target="_blank" rel="noopener noreferrer" className="inline-block px-10 py-3 bg-zinc-300 text-black border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 font-black uppercase tracking-[0.2em] italic">
                                    Access Raw Stream
                                </a>
                            </div>
                        )}
                        
                        {parsedContent && (
                            <>
                                <div ref={contentRef} className="animate-fade-in" />
                                
                                {/* FOOTER BUFFER: Pushes "Eject_Link" away from the bottom system navigation zone */}
                                <div className="mt-20 pb-20 flex flex-col items-center border-t-2 border-zinc-800/20 pt-12 mb-10">
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em] mb-6 italic">Transmission Terminated</p>
                                    <button 
                                        onClick={onClose}
                                        className="w-full max-w-xs py-5 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 text-black font-black uppercase italic tracking-[0.2em] hover:bg-pulse-600 hover:text-white transition-all active:scale-95"
                                    >
                                        Eject_Link
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                
                <footer className="h-8 bg-zinc-300 border-t-2 border-black flex items-center px-4 justify-between shrink-0">
                    <span className="text-[8px] font-black text-black/60 uppercase tracking-widest font-mono">Sector: {article.source}</span>
                    <span className="text-[8px] font-black text-black/60 uppercase tracking-widest font-mono">{new Date().toLocaleTimeString()}</span>
                </footer>
            </div>
        </div>
    );
};

export default ReaderViewModal;
