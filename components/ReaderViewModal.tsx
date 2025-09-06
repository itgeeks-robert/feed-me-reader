import React, { useState, useEffect, useRef } from 'react';
// FIX: Corrected import path for App types
import type { Article } from '../src/App';
import { XIcon, ArrowPathIcon } from './icons';
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-lg border border-zinc-300/50 dark:border-zinc-700/50 rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
                    <div className="flex-grow min-w-0">
                        {isLoading ? (
                            <div className="h-6 bg-zinc-300 dark:bg-zinc-700 rounded w-3/4 animate-pulse"></div>
                        ) : (
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white truncate">{parsedContent?.title || article.title}</h2>
                        )}
                        <a href={article.link} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-orange-500 dark:hover:text-orange-400 truncate block">
                            {article.source}
                        </a>
                    </div>
                    <button onClick={onClose} className="ml-4 p-2 rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex-shrink-0" aria-label="Close reader view">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>
                
                <div className="p-6 md:p-8 overflow-y-auto flex-grow prose dark:prose-invert prose-zinc max-w-none prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-headings:text-zinc-900 dark:prose-headings:text-white prose-a:text-orange-600 dark:prose-a:text-orange-400 hover:prose-a:text-orange-500 dark:hover:prose-a:text-orange-300 prose-strong:text-zinc-900 dark:prose-strong:text-white prose-img:rounded-lg">
                    {isLoading && (
                        <div className="flex items-center justify-center h-full">
                             <div className="flex flex-col items-center gap-4">
                                <ArrowPathIcon className="w-8 h-8 text-zinc-400 dark:text-zinc-500 animate-spin" />
                                <span className="text-zinc-500 dark:text-zinc-400">Fetching article...</span>
                            </div>
                        </div>
                    )}
                    {error && (
                        <div className="text-center text-red-500 dark:text-red-400">
                            <p className="font-semibold">Could not load content</p>
                            <p className="text-sm">{error}</p>
                            <a href={article.link} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700">
                                View Original
                            </a>
                        </div>
                    )}
                    {parsedContent && <div ref={contentRef} />}
                </div>
            </div>
        </div>
    );
};

export default ReaderViewModal;