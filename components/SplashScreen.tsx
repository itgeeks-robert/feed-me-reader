import React, { useState, useEffect, useRef } from 'react';
import { VoidIcon, ControllerIcon, ListIcon, TrashIcon, XIcon, ExclamationTriangleIcon, PaletteIcon } from './icons';
import { soundService } from '../services/soundService';
import type { Theme } from '../src/App';

interface SplashScreenProps {
    theme: Theme;
    onEnterFeeds: () => void;
    onEnterArcade: () => void;
    onToggleTheme: () => void;
    isDecoding: boolean;
    onReset?: () => void;
}

const THEME_VERSIONS: Record<Theme, { v: string; tag: string; refraction: string }> = {
    'noir': { v: 'v2.0.5', tag: 'STABLE_CORE', refraction: '0px' },
    'liquid-glass': { v: 'v3.1.2', tag: 'REFRACTION_OS', refraction: '60px' },
    'bento-grid': { v: 'v1.9.8', tag: 'GRID_STRUCTURE', refraction: '4px' },
    'brutalist': { v: 'v0.4.1', tag: 'RAW_BINARY', refraction: '0px' },
    'claymorphism': { v: 'v2.2.4', tag: 'TACTILE_BUILD', refraction: '12px' },
    'monochrome-zen': { v: 'v4.0.0', tag: 'ZEN_FOCUSED', refraction: '2px' },
    'y2k': { v: 'v9.9.9', tag: 'FUTURE_WAVE', refraction: '20px' },
    'terminal': { v: 'v0.0.1', tag: 'KERNEL_LEVEL', refraction: '0px' },
    'comic': { v: 'v5.2.0', tag: 'INKED_FRAME', refraction: '0px' }
};

const BOOT_MESSAGES = [
    "INITIALIZING VOID_KERNEL...",
    "LINKING SYNAPTIC PROTOCOLS...",
    "MOUNTING ARCADE_FILESYSTEM...",
    "DECRYPTING FREQUENCY_BUFFER...",
    "ESTABLISHING SECURE_UPLINK...",
    "OPTIMIZING GLASS_RENDERER...",
    "SYNCING CRYSTALLINE_CACHES..."
];

const TechnicalBlueprint: React.FC<{ progress: number }> = ({ progress }) => (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none transition-opacity duration-1000" style={{ opacity: Math.max(0, 0.4 - (progress / 200)) }}>
        <svg width="100%" height="100%" className="absolute inset-0">
            <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--app-accent)" strokeWidth="1" strokeOpacity="0.2" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <g stroke="var(--app-accent)" fill="none" strokeWidth="1" strokeOpacity="0.1">
                <circle cx="50%" cy="50%" r="150" strokeDasharray="5,5" />
                <path d="M 50% 0 L 50% 100%" strokeDasharray="10,10" />
                <path d="M 0 50% L 100% 50%" strokeDasharray="10,10" />
            </g>
        </svg>
    </div>
);

const SplashScreen: React.FC<SplashScreenProps> = ({ theme, onEnterFeeds, onEnterArcade, onToggleTheme, isDecoding, onReset }) => {
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [currentMessage, setCurrentMessage] = useState(BOOT_MESSAGES[0]);
    const [isBootComplete, setIsBootComplete] = useState(false);
    const [showWipeConfirm, setShowWipeConfirm] = useState(false);
    const [breached, setBreached] = useState(false);
    const lastPingRef = useRef(0);
    const mainButtonRef = useRef<HTMLButtonElement>(null);

    const themeMeta = THEME_VERSIONS[theme];

    useEffect(() => {
        const totalDuration = 2000;
        const intervalTime = 20;
        const startTime = Date.now();

        const timer = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(100, (elapsed / totalDuration) * 100);
            setLoadingProgress(progress);

            if (progress >= 100) {
                clearInterval(timer);
                setIsBootComplete(true);
                soundService.playBootComplete();
                setTimeout(() => setBreached(true), 200);
            }

            const msgIndex = Math.floor((progress / 100) * BOOT_MESSAGES.length);
            setCurrentMessage(BOOT_MESSAGES[msgIndex] || BOOT_MESSAGES[BOOT_MESSAGES.length - 1]);
        }, intervalTime);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="fixed inset-0 z-[100] transition-all duration-[800ms] flex flex-col items-center justify-center overflow-hidden font-mono bg-app-bg text-app-text">
            
            <style>{`
                .glass-reveal {
                    background: var(--app-card);
                    backdrop-filter: blur(${themeMeta.refraction});
                    -webkit-backdrop-filter: blur(${themeMeta.refraction});
                    border: 4px solid var(--comic-ink);
                    box-shadow: var(--panel-shadow);
                    width: 100%;
                    border-radius: var(--void-radius);
                }
                .theme-comic .glass-reveal { border-width: 6px; box-shadow: 12px 12px 0 #000; }
                .theme-liquid-glass .glass-reveal { border: 1px solid rgba(255,255,255,1); }
            `}</style>

            {!breached && <TechnicalBlueprint progress={loadingProgress} />}
            
            <div className={`relative z-20 w-full max-w-lg flex flex-col items-center text-center py-6 transition-all duration-1000 ${breached ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'}`}>
                
                <div className="mb-8 landscape:mb-4 group relative">
                    <div className="absolute inset-[-20px] blur-[40px] md:blur-[60px] transition-all duration-1000 rounded-full opacity-30" style={{ backgroundColor: 'var(--app-accent)' }} />
                    
                    <div className="relative p-10 rounded-full transition-all duration-1000 border-4 border-zinc-950 bg-app-card shadow-[10px_10px_0_black]">
                        <VoidIcon className="w-16 h-16 md:w-24 md:h-24 transition-colors duration-1000 text-app-text" />
                    </div>
                </div>

                <div className="mb-8 landscape:mb-4 flex flex-col items-center">
                    <h1 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter mb-4 transition-colors duration-1000 text-app-text drop-shadow-[6px_6px_0_black]">
                        THE VOID
                    </h1>

                    <div className="flex items-center justify-center gap-3">
                        <div className="h-1 w-12 bg-zinc-950 transition-colors duration-1000"></div>
                        <p className="font-bold uppercase tracking-[0.6em] text-[8px] md:text-[10px] transition-colors duration-1000" style={{ color: 'var(--app-accent)' }}>
                            {themeMeta.v}_{themeMeta.tag}
                        </p>
                        <div className="h-1 w-12 bg-zinc-950 transition-colors duration-1000"></div>
                    </div>
                </div>

                {!isBootComplete ? (
                    <div className="w-full space-y-4 landscape:space-y-2 max-w-[280px] mx-auto animate-fade-in">
                        <div className="w-full h-4 bg-zinc-950 border-2 border-zinc-900 rounded-sm overflow-hidden p-1 shadow-inner">
                            <div 
                                className="h-full bg-app-accent transition-all duration-200"
                                style={{ width: `${loadingProgress}%` }}
                            />
                        </div>
                        <div className="flex justify-between items-center text-[8px] font-black text-zinc-500 italic tracking-[0.2em]">
                            <span className="truncate max-w-[80%] uppercase">{currentMessage}</span>
                            <span>{Math.floor(loadingProgress)}%</span>
                        </div>
                    </div>
                ) : (
                    <div className="w-full flex flex-col gap-6 landscape:gap-4 animate-fade-in max-w-md items-center main-content-area px-4">
                        <div className="glass-reveal p-1 shadow-2xl overflow-hidden w-full transform -rotate-1">
                            <button 
                                ref={mainButtonRef}
                                onClick={onEnterFeeds}
                                className="group relative w-full py-6 bg-app-text text-app-bg font-black uppercase italic text-lg shadow-xl transition-all active:translate-x-1 active:translate-y-1 flex items-center justify-center gap-4 border-2 border-app-bg outline-none focus:ring-8 focus:ring-app-accent"
                            >
                                <ListIcon className="w-8 h-8" />
                                <span>RECON_INTELLIGENCE</span>
                            </button>
                        </div>
                        
                        <div className="glass-reveal p-1 shadow-2xl overflow-hidden w-full transform rotate-1">
                            <button 
                                onClick={onEnterArcade}
                                className="group w-full py-6 bg-app-card border-2 border-zinc-950 text-app-text font-black uppercase italic text-lg hover:bg-app-bg transition-all active:translate-x-1 active:translate-y-1 flex items-center justify-center gap-4 outline-none focus:ring-8 focus:ring-app-accent"
                            >
                                <ControllerIcon className="w-8 h-8" />
                                <span>ARCADE_QUICK_ACCESS</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {isBootComplete && (
                <div className="fixed bottom-0 left-0 right-0 p-8 md:p-12 pb-[calc(2.5rem+var(--safe-bottom))] flex justify-between items-center z-50 pointer-events-none">
                    <button 
                        onClick={onToggleTheme}
                        className="footer-button group inline-flex items-center gap-3 text-zinc-500 hover:text-app-accent transition-all py-4 px-8 bg-app-card border-4 border-zinc-950 uppercase text-[10px] font-black italic tracking-widest active:translate-x-1 active:translate-y-1 outline-none focus:ring-8 focus:ring-app-accent pointer-events-auto shadow-[6px_6px_0_black] shrink-0"
                    >
                        <PaletteIcon className="w-5 h-5" />
                    </button>
                    
                    <button 
                        onClick={() => setShowWipeConfirm(true)}
                        className="footer-button group inline-flex items-center justify-center gap-3 text-zinc-500 hover:text-red-500 transition-all py-4 px-8 bg-app-card border-4 border-zinc-950 uppercase text-[10px] font-black italic tracking-widest active:translate-x-1 active:translate-y-1 outline-none focus:ring-8 focus:ring-red-500 pointer-events-auto shadow-[6px_6px_0_black] shrink-0"
                    >
                        <TrashIcon className="w-5 h-5" />
                        <span>PURGE</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default SplashScreen;