import React, { useState, useEffect, useRef } from 'react';
import type { Article } from '../src/App';
import { XIcon, GlobeAltIcon, SparklesIcon, CpuChipIcon } from './icons';
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
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center pt-[calc(1rem+var(--safe-top))] pb-[calc(1rem+var(--safe-bottom))] px-2 md:px-6" onClick={onClose} role="dialog" aria-modal="true">
            {/* THEME WRAPPER: uses CSS variables for colors */}
            <div className="bg-app-bg w-full max-w-5xl h-full flex flex-col shadow-2xl border-4 border-app-accent relative animate-fade-in overflow-hidden" onClick={e => e.stopPropagation()}>
                
                <header className="bg-app-accent pt-[var(--safe-top)] relative z-20">
                    <div className="h-12 flex items-center justify-between px-1">
                        <div className="flex items-center gap-2 h-full overflow-hidden">
                            <button onClick={onClose} className="w-10 h-8 bg-app-bg border-2 border-app-accent flex items-center justify-center active:opacity-70 shrink-0">
                                <div className="w-5 h-0.5 bg-app-text shadow-[0_4px_0_var(--app-text)]" />
                            </button>
                            <div className="flex items-center gap-3 truncate">
                                <span className="text-[10px] font-black uppercase italic px-2 py-1 rounded-sm shrink-0 bg-app-bg/20 text-app-bg">
                                    {isLoading ? 'DECODING...' : displayCategory}
                                </span>
                                <h2 className="text-app-bg text-xs md:text-sm font-black uppercase tracking-widest truncate italic">
                                   SIG_DECODE: {parsedContent?.title || article.title}
                                </h2>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-10 h-8 bg-app-bg border-2 border-app-accent flex items-center justify-center hover:opacity-80 transition-colors shrink-0">
                            <XIcon className="w-5 h-5 text-app-text" />
                        </button>
                    </div>
                </header>
                
                <div className="flex-grow overflow-y-auto bg-app-bg p-6 md:p-14 relative scrollbar-hide text-app-text">
                    <div className="absolute inset-0 pointer-events-none opacity-[0.03] cctv-overlay z-10" />
                    
                    <div className="relative z-20">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-64 gap-8">
                                <div className="p-6 border-4 border-app-accent animate-pulse">
                                    <span className="text-sm font-black uppercase tracking-[0.6em] text-app-accent italic font-mono">Decoding Signal...</span>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="text-center py-24 border-4 border-red-600 bg-red-50">
                                <p className="font-black uppercase tracking-widest text-red-600 text-2xl italic mb-6">Signal Corruption</p>
                                <button onClick={handleExternalJump} className="px-12 py-5 bg-app-accent text-app-bg font-black uppercase tracking-[0.2em] italic">Access Raw Stream</button>
                            </div>
                        ) : parsedContent && (
                            <div className="max-w-none prose prose-app font-mono text-app-text prose-headings:text-app-text prose-p:text-app-text prose-p:leading-relaxed">
                                
                                <div className="mb-12 bg-app-accent/10 border-2 border-app-accent p-8 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
                                        <CpuChipIcon className="w-10 h-10 text-app-accent" />
                                    </div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <SparklesIcon className="w-5 h-5 text-app-accent animate-pulse" />
                                        <h3 className="text-xs font-black text-app-accent uppercase tracking-widest">Heuristic_Scan_Report</h3>
                                    </div>
                                    {intelBriefing ? (
                                        <div className="animate-fade-in space-y-4">
                                            {intelBriefing.map((point, idx) => (
                                                <div key={idx} className="text-xs md:text-sm leading-loose uppercase font-bold italic text-app-text border-l-4 border-app-accent pl-6">
                                                    {point}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={handleLocalIntelAnalysis}
                                            disabled={isProcessing}
                                            className="w-full py-4 border-2 border-dashed border-app-accent/30 text-app-accent hover:bg-app-accent hover:text-app-bg transition-all font-black uppercase italic text-xs tracking-[0.3em]"
                                        >
                                            {isProcessing ? 'Interrogating_Buffer...' : 'Initialize_Heuristic_Scan'}
                                        </button>
                                    )}
                                </div>

                                <div ref={contentRef} className="animate-fade-in" />
                                
                                <div className="mt-24 pb-24 flex flex-col items-center border-t-2 border-app-accent/20 pt-16 mb-12">
                                    <p className="text-xs font-black text-app-accent/40 uppercase tracking-[0.5em] mb-8 italic">End of Intercept</p>
                                    <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl">
                                        <button onClick={onClose} className="flex-1 py-6 bg-app-bg border-2 border-app-accent text-app-text font-black uppercase italic tracking-[0.2em] hover:opacity-80 transition-all text-xs md:text-sm">Close_Buffer</button>
                                        <button onClick={handleExternalJump} className="flex-1 py-6 bg-app-accent border-2 border-app-accent text-app-bg font-black uppercase italic tracking-[0.2em] hover:opacity-90 transition-all text-xs md:text-sm">Raw_Source</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <footer className="h-10 bg-app-accent/10 border-t-2 border-app-accent flex items-center px-6 justify-between shrink-0 z-20">
                    <span className="text-[10px] font-black text-app-text/60 uppercase tracking-widest font-mono">Sector_Sync: {article.source}</span>
                    <span className="text-[10px] font-black text-app-text/60 uppercase tracking-widest font-mono">Timestamp: {new Date().toLocaleTimeString()}</span>
                </footer>
            </div>
        </div>
    );
};

export default ReaderViewModal;
