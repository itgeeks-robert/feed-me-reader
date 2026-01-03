
import React, { useState, useEffect } from 'react';
import { XIcon, SparklesIcon, ShieldCheckIcon } from './icons';

interface ContextualIntelProps {
    tipId: string;
    title: string;
    content: string;
    position?: 'top' | 'bottom' | 'center';
    onDismiss?: () => void;
}

const ContextualIntel: React.FC<ContextualIntelProps> = ({ tipId, title, content, position = 'bottom', onDismiss }) => {
    const [isVisible, setIsVisible] = useState(false);
    const storageKey = `void_intel_dismissed_${tipId}`;

    useEffect(() => {
        const isDismissed = localStorage.getItem(storageKey);
        if (!isDismissed) {
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, [storageKey]);

    const handleAcknowledge = () => {
        setIsVisible(false);
        localStorage.setItem(storageKey, 'true');
        onDismiss?.();
    };

    if (!isVisible) return null;

    const positionClasses = {
        top: 'top-24 left-1/2 -translate-x-1/2',
        bottom: 'bottom-24 left-1/2 -translate-x-1/2',
        center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
    };

    return (
        <div className={`fixed ${positionClasses[position]} z-[100] w-[90%] max-w-sm animate-fade-in pointer-events-none`}>
            <div className="bg-void-surface backdrop-blur-xl border-2 border-pulse-500/50 rounded-void p-5 shadow-2xl pointer-events-auto relative overflow-hidden group">
                <div className="absolute inset-0 cctv-overlay opacity-5 pointer-events-none" />
                
                <header className="flex items-center justify-between mb-3 relative z-10">
                    <div className="flex items-center gap-2">
                        <ShieldCheckIcon className="w-4 h-4 text-pulse-500" />
                        <span className="text-[10px] font-black text-pulse-500 uppercase tracking-[0.2em] italic">Tactical_Intel</span>
                    </div>
                    <button onClick={handleAcknowledge} className="text-muted hover:text-terminal transition-colors">
                        <XIcon className="w-4 h-4" />
                    </button>
                </header>

                <div className="relative z-10 space-y-2">
                    <h4 className="text-terminal text-xs font-black uppercase tracking-tight italic">{title}</h4>
                    <p className="text-muted text-[10px] leading-relaxed uppercase font-bold tracking-wide italic">
                        {content}
                    </p>
                </div>

                <footer className="mt-4 pt-3 border-t border-void-border relative z-10">
                    <button 
                        onClick={handleAcknowledge}
                        className="w-full py-3 bg-pulse-500 hover:bg-pulse-600 text-white text-[9px] font-black uppercase italic rounded-xl transition-all shadow-lg active:scale-95"
                    >
                        Acknowledge Protocol
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ContextualIntel;
