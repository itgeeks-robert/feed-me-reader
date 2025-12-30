
import React, { useState, useEffect, useRef } from 'react';
import type { Article } from '../src/App';
import { XIcon, GlobeAltIcon } from './icons';
import { fetchAndCacheArticleContent } from '../services/readerService';

interface ReaderViewModalProps {
    article: Article;
    onClose: () => void;
    onMarkAsRead: (articleId: string) => void;
    onOpenExternal: (url: string, id: string) => void;
}

const ReaderViewModal: React.FC<ReaderViewModalProps> = ({ article, onClose, onMarkAsRead, onOpenExternal }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [parsedContent, setParsedContent] = useState<{ title: string; content: string; category: string } | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // Initial load and marking as read
    useEffect(() => {
        // Stabilize mark-as-read
        onMarkAsRead(article.id);
        
        let isMounted = true;
        const fetchContent = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await fetchAndCacheArticleContent(article);
                if (isMounted) {
                    setParsedContent(result);
                }
            } catch (e) {
                if (isMounted) {
                    setError(e instanceof Error ? e.message : 'An unknown error occurred.');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };
        
        fetchContent();
        return () => { isMounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [article.id]); // Strict dependency on article ID prevents flickering loops
    
    // Inject content when available
    useEffect(() => {
        if (parsedContent && contentRef.current) {
            contentRef.current.innerHTML = parsedContent.content;
        }
    }, [parsedContent]);

    const handleExternalJump = (e: React.MouseEvent) => {
        e.preventDefault();
        onOpenExternal(article.link, article.id);
    };

    const displayCategory = parsedContent?.category || article.feedCategory || 'GENERAL';

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center pt-[calc(1rem+var(--safe-top))] pb-[calc(1rem+var(--safe-bottom))] px-2 md:px-6" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-void-950 w-full max-w-5xl h-full flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] border-4 border-zinc-800 relative animate-fade-in" onClick={e => e.stopPropagation()}>
                <div className="absolute inset-0 border-t-2 border-l-2 border-zinc-700/30 pointer-events-none z-10" />
                <div className="absolute inset-0 border-b-2 border-r-2 border-black/40 pointer-events-none z-10" />

                <header className="h-11 bg-pulse-600 flex items-center justify-between px-1 relative z-20 border-b-2 border-black">
                    <div className="flex items-center gap-2 h-full overflow-hidden">
                        <button onClick={onClose} className="w-10 h-8 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center active:bg-zinc-400 shrink-0">
                            <div className="w-5 h-1 bg-black shadow-[0_5px_0_black]" />
                        </button>
                        <div className="flex items-center gap-3 truncate">
                            <span className="text-[10px] font-black uppercase italic px-2 py-1 rounded-sm shrink-0 bg-black/40 text-white shadow-[0_0_8px_rgba(0,0,0,0.3)] transition-all">
                                {isLoading ? 'DECODING...' : displayCategory}
                            </span>
                            <h2 className="text-white text-xs md:text-sm font-black uppercase tracking-widest truncate italic">
                               SIG_DECODE: {parsedContent?.title || article.title}
                            </h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-8 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center hover:bg-white transition-colors shrink-0">
                        <XIcon className="w-5 h-5 text-black" />
                    </button>
                </header>
                
                <div className="flex-grow overflow-y-auto bg-void-950 p-6 md:p-14 relative scrollbar-hide">
                    <div className="absolute inset-0 pointer-events-none opacity-5 cctv-overlay z-10" />
                    
                    <div className="relative z-20 prose prose-base md:prose-lg dark:prose-invert max-w-none 
                        text-terminal selection:bg-pulse-500 selection:text-white font-mono
                        prose-h1:text-3xl md:prose-h1:text-5xl prose-h1:font-black prose-h1:italic prose-h1:tracking-tighter prose-h1:uppercase
                        prose-h2:text-2xl md:prose-h2:text-4xl prose-h2:font-black prose-h2:italic
                        prose-p:text-sm md:prose-p:text-lg prose-p:leading-relaxed md:prose-p:leading-loose
                        prose-img:border-8 prose-img:border-zinc-800 prose-img:shadow-2xl
                        prose-a:text-pulse-500 prose-a:italic prose-a:font-black
                        prose-strong:font-black">
                        
                        {isLoading && (
                            <div className="flex flex-col items-center justify-center h-full gap-8 py-24">
                                <div className="p-6 border-4 border-pulse-500 animate-pulse">
                                    <span className="text-sm font-black uppercase tracking-[0.6em] text-pulse-500 italic font-mono">Decoding Signal Sequence...</span>
                                </div>
                            </div>
                        )}
                        
                        {error && (
                            <div className="text-center py-24 border-4 border-red-500/20 bg-black/40">
                                <p className="font-black uppercase tracking-widest text-red-500 text-2xl italic mb-6">Signal Corruption</p>
                                <p className="text-zinc-500 text-xs md:text-sm uppercase font-mono mb-12 tracking-widest">{error}</p>
                                <button onClick={handleExternalJump} className="inline-flex items-center gap-4 px-12 py-5 bg-zinc-300 text-black border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 font-black uppercase tracking-[0.2em] italic active:bg-zinc-400">
                                    <GlobeAltIcon className="w-6 h-6" />
                                    Access Raw Stream
                                </button>
                            </div>
                        )}
                        
                        {parsedContent && (
                            <>
                                <div ref={contentRef} className="animate-fade-in" />
                                
                                <div className="mt-24 pb-24 flex flex-col items-center border-t-2 border-zinc-800/20 pt-16 mb-12">
                                    <p className="text-xs font-black text-zinc-500 uppercase tracking-[0.5em] mb-8 italic">Transmission Terminated</p>
                                    <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl">
                                        <button 
                                            onClick={onClose}
                                            className="flex-1 py-6 bg-zinc-800 border-t-2 border-l-2 border-white/5 border-b-2 border-r-2 border-black text-zinc-400 font-black uppercase italic tracking-[0.2em] hover:text-white transition-all active:scale-95 text-xs md:text-sm"
                                        >
                                            Close_Buffer
                                        </button>
                                        <button 
                                            onClick={handleExternalJump}
                                            className="flex-1 py-6 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 text-black font-black uppercase italic tracking-[0.2em] hover:bg-pulse-600 hover:text-white transition-all active:scale-95 text-xs md:text-sm"
                                        >
                                            Raw_Source
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                
                <footer className="h-10 bg-zinc-300 border-t-2 border-black flex items-center px-6 justify-between shrink-0 z-20">
                    <span className="text-[10px] font-black text-black/80 uppercase tracking-widest font-mono">Sector: {article.source}</span>
                    <span className="text-[10px] font-black text-black/80 uppercase tracking-widest font-mono">{new Date().toLocaleTimeString()}</span>
                </footer>
            </div>
        </div>
    );
};

export default ReaderViewModal;
