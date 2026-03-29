import React, { useState, useEffect, useRef } from 'react';
import { VoidIcon, ControllerIcon, ListIcon, PaletteIcon, PlayIcon, RadioIcon } from './icons';
import { soundService } from '../services/soundService';
import type { Mode as Theme } from '../src/App';

interface SplashScreenProps {
    theme: Theme;
    onEnterFeeds: () => void;
    onEnterUplink: () => void;
    onEnterArcade: () => void;
    onEnterTube: () => void;
    onToggleTheme: () => void;
}

const THEME_VERSIONS: Record<string, { v: string; tag: string; refraction: string }> = {
    'glass': { v: 'v3.1.2', tag: 'REFRACTION_OS', refraction: '60px' },
    'noir': { v: 'v4.0.0', tag: 'ZEN_FOCUSED', refraction: '2px' },
    'terminal': { v: 'v0.0.1', tag: 'KERNEL_LEVEL', refraction: '0px' },
    'horizon': { v: 'v1.0.0', tag: 'HORIZON_OS', refraction: '20px' }
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

const SplashScreen: React.FC<SplashScreenProps> = ({ theme, onEnterFeeds, onEnterUplink, onEnterArcade, onEnterTube, onToggleTheme }) => {
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [currentMessage, setCurrentMessage] = useState(BOOT_MESSAGES[0]);
    const [isBootComplete, setIsBootComplete] = useState(false);
    const [breached, setBreached] = useState(false);
    const mainButtonRef = useRef<HTMLButtonElement>(null);

    const themeMeta = (theme && THEME_VERSIONS[theme]) || THEME_VERSIONS['horizon'] || THEME_VERSIONS['noir'] || { v: 'v1.0.0', tag: 'VOID_OS', refraction: '20px' };

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

    const refractionValue = themeMeta?.refraction || '20px';

    return (
        <div className="fixed inset-0 z-[100] transition-all duration-[800ms] flex flex-col items-center justify-center overflow-hidden font-mono bg-app-bg text-app-text" style={{ 
            paddingTop: 'max(2rem, var(--safe-top))',
            paddingBottom: 'max(2rem, var(--safe-bottom))',
            paddingLeft: 'max(1.5rem, var(--safe-left), var(--safe-right))',
            paddingRight: 'max(1.5rem, var(--safe-left), var(--safe-right))'
        }}>
            
            <style>{`
                .glass-reveal {
                    background: var(--app-card);
                    backdrop-filter: blur(${refractionValue});
                    -webkit-backdrop-filter: blur(${refractionValue});
                    border: 4px solid var(--comic-ink);
                    box-shadow: var(--panel-shadow);
                    width: 100%;
                    border-radius: var(--void-radius);
                }
                /* Specialized overrides to prevent overlapping or cutoff issues */
                .theme-comic .glass-reveal { border-width: 6px; box-shadow: 12px 12px 0 #000; }
                .theme-liquid-glass .glass-reveal { border: 1px solid rgba(255,255,255,1); }
                /* Future Wave (Y2K) - Remove harsh inner border to prevent cutoff on high radius corners */
                .theme-y2k .glass-reveal { border: none; box-shadow: 0 20px 40px rgba(0,0,0,0.3); }
            `}</style>

            {!breached && <TechnicalBlueprint progress={loadingProgress} />}
            
            <div className={`relative z-20 w-full max-w-lg landscape:max-w-6xl flex flex-col landscape:flex-row items-center landscape:justify-center text-center landscape:gap-12 md:landscape:gap-20 py-6 px-6 landscape:px-12 transition-all duration-1000 ${breached ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'}`}>
                
                {/* Brand Assets Column */}
                <div className="flex flex-col items-center landscape:flex-1 shrink-0">
                    <div className="mb-4 md:mb-8 landscape:mb-12 group relative">
                        <div className="absolute inset-[-20px] blur-[40px] md:blur-[60px] transition-all duration-1000 rounded-full opacity-30" style={{ backgroundColor: 'var(--app-accent)' }} />
                        
                        <div className="relative p-6 md:p-10 rounded-full transition-all duration-1000 border-4 border-zinc-950 bg-app-card shadow-[10px_10px_0_black]">
                            <VoidIcon className="w-12 h-12 md:w-24 md:h-24 transition-colors duration-1000 text-app-text" />
                        </div>
                    </div>

                    <div className="mb-6 md:mb-8 landscape:mb-0 flex flex-col items-center">
                        <h1 className="void-title text-3xl xs:text-5xl md:text-8xl font-black italic uppercase tracking-tighter mb-2 md:mb-4 transition-all duration-1000 text-app-text whitespace-nowrap">
                            THE VOID
                        </h1>

                        <div className="flex items-center justify-center gap-3 w-full">
                            <div className="h-1 w-12 bg-zinc-950 transition-colors duration-1000 landscape:hidden"></div>
                            <p className="font-bold uppercase tracking-[0.6em] text-[8px] md:text-[10px] transition-colors duration-1000 whitespace-nowrap" style={{ color: 'var(--app-accent)' }}>
                                {themeMeta.v}_{themeMeta.tag}
                            </p>
                            <div className="h-1 w-full max-w-[100px] bg-zinc-950/20 transition-colors duration-1000 hidden landscape:block"></div>
                        </div>
                    </div>
                </div>

                {/* Interaction Section Column */}
                <div className="w-full max-w-md flex flex-col items-center landscape:items-stretch landscape:flex-1">
                    {!isBootComplete ? (
                        <div className="w-full space-y-4 landscape:space-y-6 max-w-[280px] md:max-w-full mx-auto animate-fade-in">
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
                        <div className="w-full flex flex-col gap-2 md:gap-3 animate-fade-in max-w-md items-center landscape:items-stretch main-content-area px-4 landscape:px-0">
                            <div className="relative group/menu w-full border-4 border-zinc-950 bg-zinc-950/40 backdrop-blur-xl p-2 md:p-4 rounded-2xl shadow-[30px_30px_0_rgba(0,0,0,0.4)] transform landscape:-skew-x-1">
                                {/* Corner Brackets */}
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-app-accent -translate-x-2 -translate-y-2 opacity-50" />
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-app-accent translate-x-2 -translate-y-2 opacity-50" />
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-app-accent -translate-x-2 translate-y-2 opacity-50" />
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-app-accent translate-x-2 translate-y-2 opacity-50" />

                                {/* Scanline effect */}
                                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-10 bg-[length:100%_3px,3px_100%]" />
                                
                                <div className="flex flex-col gap-2 relative z-20">
                                    <button 
                                        ref={mainButtonRef}
                                        onClick={onEnterUplink}
                                        className="group relative w-full py-4 md:py-6 bg-app-text text-app-bg font-black uppercase italic text-sm md:text-base transition-all active:scale-[0.97] flex items-center justify-between px-6 border-2 border-transparent outline-none focus:border-app-accent focus:ring-8 focus:ring-app-accent/30 rounded-xl overflow-hidden"
                                    >
                                        <div className="flex items-center gap-4">
                                            <RadioIcon className="w-5 h-5 md:w-7 md:h-7" />
                                            <span className="tracking-tight">DAILY_UPLINK_SYNC</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] opacity-40 font-bold tracking-[0.3em] hidden sm:block">SYNC_00</span>
                                            <div className="w-2 h-2 rounded-full bg-app-bg animate-pulse" />
                                        </div>
                                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                    </button>

                                    <button 
                                        onClick={onEnterFeeds}
                                        className="group relative w-full py-4 md:py-6 bg-app-card text-app-text font-black uppercase italic text-sm md:text-base transition-all active:scale-[0.97] flex items-center justify-between px-6 border-2 border-zinc-900/50 hover:border-app-accent/50 outline-none focus:border-app-accent focus:ring-8 focus:ring-app-accent/30 rounded-xl overflow-hidden"
                                    >
                                        <div className="flex items-center gap-4">
                                            <ListIcon className="w-5 h-5 md:w-7 md:h-7" />
                                            <span className="tracking-tight">RECON_INTELLIGENCE</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] opacity-40 font-bold tracking-[0.3em] hidden sm:block">UPLINK_01</span>
                                            <div className="w-2 h-2 rounded-full bg-app-accent/30" />
                                        </div>
                                        <div className="absolute inset-0 bg-app-accent/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                    </button>
                                    
                                    <button 
                                        onClick={onEnterArcade}
                                        className="group relative w-full py-4 md:py-6 bg-app-card text-app-text font-black uppercase italic text-sm md:text-base transition-all active:scale-[0.97] flex items-center justify-between px-6 border-2 border-zinc-900/50 hover:border-app-accent/50 outline-none focus:border-app-accent focus:ring-8 focus:ring-app-accent/30 rounded-xl overflow-hidden"
                                    >
                                        <div className="flex items-center gap-4">
                                            <ControllerIcon className="w-5 h-5 md:w-7 md:h-7" />
                                            <span className="tracking-tight">ARCADE_QUICK_ACCESS</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] opacity-40 font-bold tracking-[0.3em] hidden sm:block">SIM_02</span>
                                            <div className="w-2 h-2 rounded-full bg-app-accent/30" />
                                        </div>
                                        <div className="absolute inset-0 bg-app-accent/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                    </button>

                                    <button 
                                        onClick={onEnterTube}
                                        className="group relative w-full py-4 md:py-6 bg-app-card text-app-text font-black uppercase italic text-sm md:text-base transition-all active:scale-[0.97] flex items-center justify-between px-6 border-2 border-zinc-900/50 hover:border-app-accent/50 outline-none focus:border-app-accent focus:ring-8 focus:ring-app-accent/30 rounded-xl overflow-hidden"
                                    >
                                        <div className="flex items-center gap-4">
                                            <PlayIcon className="w-5 h-5 md:w-7 md:h-7 text-red-600" />
                                            <span className="tracking-tight">VOIDTUBE_ARCHIVE</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] opacity-40 font-bold tracking-[0.3em] hidden sm:block">BROADCAST_03</span>
                                            <div className="w-2 h-2 rounded-full bg-red-600/30" />
                                        </div>
                                        <div className="absolute inset-0 bg-red-600/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 mt-6 w-full px-4">
                                <div className="h-[2px] flex-1 bg-zinc-900" />
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-1 bg-app-accent rounded-full animate-ping" />
                                    <span className="text-[9px] font-black tracking-[0.5em] uppercase text-zinc-500">System_Ready</span>
                                </div>
                                <div className="h-[2px] flex-1 bg-zinc-900" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isBootComplete && (
                <div className="fixed bottom-0 left-0 right-0 p-4 md:p-8 landscape:p-4 pb-[max(1.5rem,var(--safe-bottom))] flex justify-end items-center z-50 pointer-events-none gap-3 md:gap-4">
                    <button 
                        onClick={onToggleTheme}
                        className="footer-button group inline-flex items-center justify-center gap-2 md:gap-3 text-zinc-500 hover:text-app-accent transition-all py-2 md:py-3 px-4 md:px-6 bg-app-card border-2 md:border-4 border-zinc-950 uppercase text-[8px] md:text-[10px] font-black italic tracking-widest active:translate-x-1 active:translate-y-1 outline-none focus:ring-8 focus:ring-app-accent pointer-events-auto shadow-[4px_4px_0_black] shrink-0"
                    >
                        <PaletteIcon className="w-4 h-4 md:w-5 md:h-5" />
                        <span>SKIN CHANGE</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default SplashScreen;