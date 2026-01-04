import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { XIcon, SparklesIcon, ShieldCheckIcon } from './icons';

interface ContextualIntelProps {
    tipId: string;
    title: string;
    content: string;
    position?: 'top' | 'bottom' | 'center';
    onDismiss?: () => void;
}

const ContextualIntel: React.FC<ContextualIntelProps> = ({ tipId, title, content, onDismiss }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [dontShowAgain, setDontShowAgain] = useState(false);
    const storageKey = `void_intel_dismissed_${tipId}`;
    const checkboxRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const isDismissed = localStorage.getItem(storageKey);
        if (!isDismissed) {
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, [storageKey]);

    // Focus Trap for TV/D-Pad
    useLayoutEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                checkboxRef.current?.focus();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (dontShowAgain) {
            localStorage.setItem(storageKey, 'true');
        }
        setIsVisible(false);
        onDismiss?.();
    };

    if (!isVisible) return null;

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="void-card w-full max-w-sm relative overflow-hidden group shadow-[0_30px_100px_rgba(0,0,0,0.8)] border-2 border-pulse-500/30">
                <div className="absolute inset-0 cctv-overlay opacity-10 pointer-events-none" />
                
                <header className="flex items-center justify-between p-5 pb-0 relative z-10">
                    <div className="flex items-center gap-2">
                        <ShieldCheckIcon className="w-4 h-4 text-pulse-500" />
                        <span className="text-[10px] font-black text-pulse-500 uppercase tracking-[0.2em] italic">Tactical_Intel</span>
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsVisible(false); }} 
                        className="text-muted hover:text-terminal transition-colors p-1"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </header>

                <div className="p-5 relative z-10 space-y-3">
                    <h4 className="text-terminal text-sm font-black uppercase tracking-tight italic border-b border-void-border pb-2">{title}</h4>
                    <p className="text-muted text-[10px] leading-relaxed uppercase font-bold tracking-wide italic">
                        {content}
                    </p>
                </div>

                <footer className="p-5 pt-0 relative z-10 space-y-4">
                    <label 
                        className="flex items-center gap-3 cursor-pointer group/check outline-none"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <input 
                            ref={checkboxRef}
                            type="checkbox" 
                            className="sr-only" 
                            checked={dontShowAgain} 
                            onChange={(e) => setDontShowAgain(e.target.checked)} 
                        />
                        <div className={`w-4 h-4 border-2 rounded-sm transition-all flex items-center justify-center ${dontShowAgain ? 'bg-pulse-500 border-pulse-400' : 'bg-void-bg border-void-border group-hover/check:border-terminal/40'}`}>
                            {dontShowAgain && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted group-hover/check:text-terminal transition-colors">Do not show again</span>
                    </label>

                    <button 
                        onClick={handleClose}
                        className="w-full py-4 bg-terminal text-inverse text-[10px] font-black uppercase italic rounded-xl transition-all shadow-xl active:scale-95 focus:ring-4 focus:ring-pulse-500 outline-none"
                    >
                        Acknowledge Protocol
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ContextualIntel;