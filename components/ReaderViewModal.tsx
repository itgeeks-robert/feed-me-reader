import React, { useState, useEffect, useRef } from 'react';
import type { Article } from '../src/App';
import { XIcon, GlobeAltIcon, SparklesIcon } from './icons';
import { fetchAndCacheArticleContent } from '../services/readerService';
import { soundService } from '../services/soundService';

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
    const [intelBriefing, setIntelBriefing] = useState<string[] | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const closeBtnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        onMarkAsRead(article.id);
        let isMounted = true;
        const fetchContent = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await fetchAndCacheArticleContent(article);
                if (isMounted) setParsedContent(result);
            } catch (e) {
                if (isMounted) setError(e instanceof Error ? e.message : 'An unknown error occurred.');
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        fetchContent();
        return () => { isMounted = false; };
    }, [article.id]);

    // TV FOCUS TRAP
    useEffect(() => {
        if (!isLoading && closeBtnRef.current) {
            closeBtnRef.current.focus();
        }
    }, [isLoading]);
    
    useEffect(() => {
        if (parsedContent && contentRef.current) {
            contentRef.current.innerHTML = parsedContent.content;
        }
    }, [parsedContent]);

    const handleLocalIntelAnalysis = () => {
        if (!parsedContent || isProcessing) return;
        setIsProcessing(true);
        soundService.playAction();
        
        setTimeout(() => {
            const text = contentRef.current?.innerText || "";
            // Explicitly cast the match result to an array of strings to avoid 'unknown' inference
            const sentences = (text.match(/[^.!?]+[.!?]+/g) || []) as string[];
            const tacticalWords = ['SYSTEM', 'NETWORK', 'DATA', 'SECURITY', 'GLOBAL', 'PROTOCOL', 'NODE', 'ACCESS', 'SIGNAL', 'ENCRYPT'];
            
            const scored = sentences.map(s => {
                let score = s.length > 40 && s.length < 150 ? 10 : 0;
                tacticalWords.forEach(w => {
                    // s is now correctly typed as string
                    if (s.toUpperCase().includes(w)) score += 5;
                });
                return { s, score };
            }).sort((a, b) => b.score - a.score);

            const results = Array.from(new Set(scored.slice(0, 3).map(i => i.s.trim())))
                .map((s: string) => s.toUpperCase());

            setIntelBriefing(results.length > 0 ? results : ["NO_CRITICAL_PATTERN_DETECTED"]);
            setIsProcessing(false);
            soundService.playCorrect();
        }, 800);
    };

    const handleExternalJump = (e: React.MouseEvent) => {
        e.preventDefault();
        onOpenExternal(article.link, article.id);
    };

    const displayCategory = parsedContent?.category || article.feedCategory || 'GENERAL';

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8" style={{ 
            paddingTop: 'max(1rem, var(--safe-top))',
            paddingBottom: 'max(1rem, var(--safe-bottom))',
            paddingLeft: 'max(1rem, var(--safe-left))',
            paddingRight: 'max(1rem, var(--safe-right))'
        }} onClick={onClose} role="dialog" aria-modal="true">
            {/* THEME WRAPPER: uses CSS variables for colors */}
            <div className="bg-app-bg w-full max-w-4xl h-full max-h-[90vh] flex flex-col shadow-2xl rounded-3xl relative animate-fade-in overflow-hidden border border-app-border" onClick={e => e.stopPropagation()}>
                
                <header className="bg-app-card border-b border-app-border relative z-20 shrink-0">
                    <div className="h-16 flex items-center justify-between px-6">
                        <div className="flex items-center gap-4 h-full overflow-hidden flex-grow">
                            <div className="flex items-center gap-3 truncate">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0 bg-app-accent/10 text-app-accent">
                                    {isLoading ? 'Loading...' : displayCategory}
                                </span>
                                <h2 className="text-app-text text-sm md:text-base font-semibold truncate">
                                   {parsedContent?.title || article.title}
                                </h2>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-4">
                            <button onClick={handleExternalJump} className="w-10 h-10 rounded-full hover:bg-app-border/50 flex items-center justify-center transition-colors text-muted hover:text-app-text outline-none focus-visible:ring-2 focus-visible:ring-app-accent" title="Open Original">
                                <GlobeAltIcon className="w-5 h-5" />
                            </button>
                            <button ref={closeBtnRef} onClick={onClose} className="w-10 h-10 rounded-full hover:bg-app-border/50 flex items-center justify-center transition-colors text-muted hover:text-app-text outline-none focus-visible:ring-2 focus-visible:ring-app-accent" title="Close">
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </header>
                
                <div className="flex-grow overflow-y-auto bg-app-bg p-6 md:p-12 relative scrollbar-hide text-app-text">
                    
                    <div className="relative z-20 max-w-3xl mx-auto">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-64 gap-6">
                                <div className="w-10 h-10 border-4 border-app-accent/20 border-t-app-accent rounded-full animate-spin" />
                                <span className="text-sm font-medium text-muted tracking-wide">Loading Content...</span>
                            </div>
                        ) : error ? (
                            <div className="text-center py-20 bg-app-card rounded-2xl border border-app-error/20">
                                <p className="font-semibold text-app-error text-lg mb-6">Failed to load content</p>
                                <button onClick={handleExternalJump} className="px-8 py-3 bg-app-accent text-white rounded-xl font-medium hover:opacity-90 transition-opacity outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg focus-visible:ring-app-accent">Read Original Article</button>
                            </div>
                        ) : parsedContent && (
                            <div className="prose prose-app max-w-none prose-headings:text-app-text prose-p:text-app-text/90 prose-p:leading-relaxed prose-a:text-app-accent hover:prose-a:text-app-accent/80 prose-strong:text-app-text prose-ul:text-app-text/90 prose-ol:text-app-text/90">
                                
                                <div className="mb-12 bg-app-card border border-app-border rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden group">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-app-accent/10 rounded-lg">
                                            <SparklesIcon className="w-5 h-5 text-app-accent" />
                                        </div>
                                        <h3 className="text-sm font-bold text-app-text tracking-wide m-0">AI Summary</h3>
                                    </div>
                                    {intelBriefing ? (
                                        <div className="animate-fade-in space-y-3 mt-4">
                                            {intelBriefing.map((point, idx) => (
                                                <div key={idx} className="text-sm leading-relaxed text-app-text/80 flex gap-3">
                                                    <span className="text-app-accent font-bold">•</span>
                                                    <span>{point}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={handleLocalIntelAnalysis}
                                            disabled={isProcessing}
                                            className="w-full mt-2 py-3 bg-app-bg border border-app-border rounded-xl text-app-text hover:border-app-accent/50 hover:shadow-sm transition-all font-medium text-sm outline-none focus-visible:ring-2 focus-visible:ring-app-accent flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-app-accent/20 border-t-app-accent rounded-full animate-spin" />
                                                    <span>Generating Summary...</span>
                                                </>
                                            ) : 'Generate Summary'}
                                        </button>
                                    )}
                                </div>

                                <div ref={contentRef} className="animate-fade-in article-content" />
                                
                                <div className="mt-20 pb-12 flex flex-col items-center border-t border-app-border pt-12">
                                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                                        <button onClick={onClose} className="flex-1 py-4 bg-app-card border border-app-border rounded-xl text-app-text font-medium hover:bg-app-border/50 transition-colors text-sm outline-none focus-visible:ring-2 focus-visible:ring-app-accent">Close</button>
                                        <button onClick={handleExternalJump} className="flex-1 py-4 bg-app-accent text-white rounded-xl font-medium hover:opacity-90 transition-opacity text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg focus-visible:ring-app-accent shadow-sm">Read Original</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReaderViewModal;