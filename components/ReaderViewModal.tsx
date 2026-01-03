import React, { useState, useEffect, useRef } from 'react';
import type { Article } from '../src/App';
import { XIcon, GlobeAltIcon, SparklesIcon, CpuChipIcon } from './icons';
import { fetchAndCacheArticleContent } from '../services/readerService';
import { GoogleGenerativeAI } from "@google/generative-ai";
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
    const [aiBriefing, setAiBriefing] = useState<string | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    // Fetch and Cache Article Content
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
    
    // Set HTML Content
    useEffect(() => {
        if (parsedContent && contentRef.current) {
            contentRef.current.innerHTML = parsedContent.content;
        }
    }, [parsedContent]);

    // AI Intelligence Briefing Logic
    const handleAIBriefing = async () => {
        if (!parsedContent || isAiLoading) return;
        setIsAiLoading(true);
        soundService.playAction();
        
        try {
            // NOTE: Use VITE_ prefix for client-side env variables in Vite
            const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");
            const model = genAI.getGenerativeModel({ 
                model: "gemini-1.5-flash",
                systemInstruction: "You are a tactical signal analyst for THE VOID. Your output must be concise, technical, and formatted as a field report.",
            });

            const prompt = `Extract a tactical intelligence briefing from this news content. Return exactly 3 bullet points. Use cold, professional, noir spy terminology. Content: ${parsedContent.content.substring(0, 4000)}`;
            
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            setAiBriefing(text || "NO_DATA_EXTRACTED");
            soundService.playCorrect();
        } catch (err) {
            console.error("AI_LINK_ERROR:", err);
            setAiBriefing("CRITICAL_FAILURE: Neural link severed. Verify API_KEY in Vercel settings.");
            soundService.playWrong();
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleExternalJump = (e: React.MouseEvent) => {
        e.preventDefault();
        onOpenExternal(article.link, article.id);
    };

    const displayCategory = parsedContent?.category || article.feedCategory || 'GENERAL';

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center pt-[calc(1rem+var(--safe-top))] pb-[calc(1rem+var(--safe-bottom))] px-2 md:px-6" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-void-950 w-full max-w-5xl h-full flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] border-4 border-zinc-800 relative animate-fade-in" onClick={e => e.stopPropagation()}>
                <header className="h-11 bg-pulse-600 flex items-center justify-between px-1 relative z-20 border-b-2 border-black">
                    <div className="flex items-center gap-2 h-full overflow-hidden">
                        <button onClick={onClose} className="w-10 h-8 bg-zinc-300 border-2 border-white flex items-center justify-center active:bg-zinc-400 shrink-0">
                            <div className="w-5 h-1 bg-black shadow-[0_5px_0_black]" />
                        </button>
                        <div className="flex items-center gap-3 truncate">
                            <span className="text-[10px] font-black uppercase italic px-2 py-1 rounded-sm shrink-0 bg-black/40 text-white">
                                {isLoading ? 'DECODING...' : displayCategory}
                            </span>
                            <h2 className="text-white text-xs md:text-sm font-black uppercase tracking-widest truncate italic">
                               SIG_DECODE: {parsedContent?.title || article.title}
                            </h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-8 bg-zinc-300 border-2 border-white flex items-center justify-center hover:bg-white transition-colors shrink-0">
                        <XIcon className="w-5 h-5 text-black" />
                    </button>
                </header>
                
                <div className="flex-grow overflow-y-auto bg-void-950 p-6 md:p-14 relative scrollbar-hide">
                    <div className="absolute inset-0 pointer-events-none opacity-5 cctv-overlay z-10" />
                    
                    <div className="relative z-20">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-64 gap-8">
                                <div className="p-6 border-4 border-pulse-500 animate-pulse">
                                    <span className="text-sm font-black uppercase tracking-[0.6em] text-pulse-500 italic font-mono">Decoding Signal...</span>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="text-center py-24 border-4 border-red-500/20 bg-black/40">
                                <p className="font-black uppercase tracking-widest text-red-500 text-2xl italic mb-6">Signal Corruption</p>
                                <button onClick={handleExternalJump} className="px-12 py-5 bg-zinc-300 text-black border-2 border-white font-black uppercase tracking-[0.2em] italic">Access Raw Stream</button>
                            </div>
                        ) : parsedContent && (
                            <div className="max-w-none prose prose-invert font-mono text-terminal prose-h1:text-4xl prose-p:text-lg prose-p:leading-relaxed">
                                
                                {/* AI Briefing Section */}
                                <div className="mb-12 void-card bg-void-surface border-pulse-500/40 p-8 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
                                        <CpuChipIcon className="w-10 h-10 text-pulse-500" />
                                    </div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <SparklesIcon className="w-5 h-5 text-pulse-500 animate-pulse" />
                                        <h3 className="text-xs font-black text-pulse-500 uppercase tracking-widest">Neural_Intel_Briefing</h3>
                                    </div>
                                    {aiBriefing ? (
                                        <div className="animate-fade-in text-sm leading-loose uppercase font-bold italic text-white/90 whitespace-pre-line border-l-2 border-pulse-500 pl-6">
                                            {aiBriefing}
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={handleAIBriefing}
                                            disabled={isAiLoading}
                                            className="w-full py-4 border-2 border-dashed border-pulse-500/30 text-pulse-500 hover:bg-pulse-500/10 transition-all font-black uppercase italic text-xs tracking-[0.3em]"
                                        >
                                            {isAiLoading ? 'Interrogating_Network...' : 'Authorize_Neural_Recon'}
                                        </button>
                                    )}
                                </div>

                                <div ref={contentRef} className="animate-fade-in" />
                                
                                <div className="mt-24 pb-24 flex flex-col items-center border-t-2 border-zinc-800/20 pt-16 mb-12">
                                    <p className="text-xs font-black text-zinc-500 uppercase tracking-[0.5em] mb-8 italic">Transmission Terminated</p>
                                    <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl">
                                        <button onClick={onClose} className="flex-1 py-6 bg-zinc-800 border-2 border-white/5 text-zinc-400 font-black uppercase italic tracking-[0.2em] hover:text-white transition-all text-xs md:text-sm">Close_Buffer</button>
                                        <button onClick={handleExternalJump} className="flex-1 py-6 bg-zinc-300 border-2 border-white text-black font-black uppercase italic tracking-[0.2em] hover:bg-pulse-600 hover:text-white transition-all text-xs md:text-sm">Raw_Source</button>
                                    </div>
                                </div>
                            </div>
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