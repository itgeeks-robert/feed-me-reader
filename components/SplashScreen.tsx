
import React, { useState, useEffect, useRef } from 'react';
import { VoidIcon, ControllerIcon, ListIcon, TrashIcon, XIcon, ExclamationTriangleIcon } from './icons';
import { soundService } from '../services/soundService';

interface SplashScreenProps {
    onEnterFeeds: () => void;
    onEnterArcade: () => void;
    isDecoding: boolean;
    onReset?: () => void;
}

const BOOT_MESSAGES = [
    "INITIALIZING VOID_KERNEL_7.2...",
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
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(225,29,72,0.15)" strokeWidth="1" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <g stroke="rgba(225,29,72,0.2)" fill="none" strokeWidth="1">
                <circle cx="50%" cy="50%" r="150" strokeDasharray="5,5" />
                <path d="M 50% 0 L 50% 100%" strokeDasharray="10,10" />
                <path d="M 0 50% L 100% 50%" strokeDasharray="10,10" />
            </g>
        </svg>
    </div>
);

const VoidParticles: React.FC = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        <style>{`
            @keyframes float {
                0% { transform: translateY(100vh) translateX(0); opacity: 0; }
                50% { opacity: 0.5; }
                100% { transform: translateY(-100px) translateX(20px); opacity: 0; }
            }
            .particle {
                position: absolute;
                background: white;
                border-radius: 50%;
                filter: blur(1px);
                animation: float linear infinite;
            }
        `}</style>
        {[...Array(30)].map((_, i) => (
            <div 
                key={i} 
                className="particle"
                style={{
                    width: `${Math.random() * 4 + 1}px`,
                    height: `${Math.random() * 4 + 1}px`,
                    left: `${Math.random() * 100}%`,
                    animationDuration: `${Math.random() * 5 + 5}s`,
                    animationDelay: `${Math.random() * 5}s`,
                    opacity: Math.random() * 0.4
                }}
            />
        ))}
    </div>
);

const SplashScreen: React.FC<SplashScreenProps> = ({ onEnterFeeds, onEnterArcade, isDecoding, onReset }) => {
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [currentMessage, setCurrentMessage] = useState(BOOT_MESSAGES[0]);
    const [isBootComplete, setIsBootComplete] = useState(false);
    const [showWipeConfirm, setShowWipeConfirm] = useState(false);
    const [breached, setBreached] = useState(false);
    const lastPingRef = useRef(0);

    useEffect(() => {
        const totalDuration = 4500;
        const intervalTime = 40;
        const increment = (intervalTime / totalDuration) * 100;

        const timer = setInterval(() => {
            setLoadingProgress(prev => {
                if (prev >= 95 && isDecoding) return 95;
                if (prev >= 100) {
                    clearInterval(timer);
                    setIsBootComplete(true);
                    soundService.playBootComplete();
                    setTimeout(() => setBreached(true), 200);
                    return 100;
                }
                const next = prev + increment;

                const currentThresh = Math.floor(next / 20);
                if (currentThresh > lastPingRef.current) {
                    soundService.playBootPing(next);
                    lastPingRef.current = currentThresh;
                }

                const msgIndex = Math.floor((next / 100) * BOOT_MESSAGES.length);
                setCurrentMessage(isDecoding && next > 70 ? "DECODING LIVE SIGNALS..." : BOOT_MESSAGES[msgIndex] || BOOT_MESSAGES[BOOT_MESSAGES.length - 1]);
                return next;
            });
        }, intervalTime);

        return () => clearInterval(timer);
    }, [isDecoding]);

    const handleSystemWipe = () => {
        if (onReset) {
            onReset();
            setShowWipeConfirm(false);
        } else {
            localStorage.clear();
            const req = indexedDB.deleteDatabase('SeeMoreCache');
            req.onsuccess = () => window.location.reload();
            req.onerror = () => window.location.reload();
            req.onblocked = () => window.location.reload();
        }
    };

    return (
        <div className={`fixed inset-0 z-[100] transition-all duration-[2000ms] flex flex-col items-center justify-center overflow-x-hidden overflow-y-auto font-mono scrollbar-hide pt-[calc(2rem+var(--safe-top))] pb-[calc(2rem+var(--safe-bottom))] px-6
            ${breached ? 'bg-white shadow-[inset_0_0_200px_rgba(0,0,0,0.05)]' : 'bg-void-950'}`}>
            
            <style>{`
                @keyframes dimension-shift {
                    0% { clip-path: circle(0% at 50% 50%); }
                    100% { clip-path: circle(150% at 50% 50%); }
                }
                .dimension-breach {
                    animation: dimension-shift 2.5s cubic-bezier(0.23, 1, 0.32, 1) forwards;
                }
                .glass-reveal {
                    background: rgba(255, 255, 255, 0.3);
                    backdrop-filter: blur(60px);
                    -webkit-backdrop-filter: blur(60px);
                    border: 1px solid rgba(255,255,255,0.8);
                    box-shadow: 0 40px 100px rgba(0,0,0,0.1);
                    width: 100%;
                }
                .neon-stroke-text {
                    color: transparent;
                    -webkit-text-stroke: 2px currentColor;
                }
            `}</style>

            {!breached && <TechnicalBlueprint progress={loadingProgress} />}
            {breached && <VoidParticles />}
            
            <div className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-1000 ${breached ? 'opacity-0' : 'opacity-30 cctv-overlay'}`} />
            
            <div className={`relative z-20 w-full max-w-lg flex flex-col items-center text-center py-6 transition-all duration-1000 ${breached ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'}`}>
                
                <div className="mb-8 landscape:mb-4 group relative">
                    {/* REFINED GLOW AREA - Tighter and less intense */}
                    <div className={`absolute inset-[-20px] blur-[40px] md:blur-[60px] transition-all duration-1000 rounded-full
                        ${breached ? 'bg-blue-500 opacity-40' : 'bg-red-700 opacity-60'}`} />
                    <div className={`absolute inset-[-5px] blur-[15px] transition-all duration-1000 rounded-full
                        ${breached ? 'bg-blue-400/30' : 'bg-red-500/40'}`} />
                    
                    <div className={`relative p-8 md:p-10 rounded-full transition-all duration-1000 border-4
                        ${breached 
                            ? 'bg-white border-blue-500 shadow-[0_0_80px_rgba(37,99,235,0.5)]' 
                            : 'bg-pulse-500 border-white/20 shadow-[0_0_60px_rgba(225,29,72,0.4)]'}`}>
                        <VoidIcon className={`w-16 h-16 md:w-24 md:h-24 transition-colors duration-1000 ${breached ? 'text-blue-600' : 'text-white'}`} />
                    </div>
                </div>

                <div className="mb-8 landscape:mb-4 flex flex-col items-center">
                    <h1 className={`text-5xl md:text-8xl font-black italic uppercase tracking-tighter mb-4 transition-colors duration-1000
                        ${breached ? 'text-slate-900' : 'text-white'}`}>
                        THE VOID
                    </h1>

                    <div className="flex items-center justify-center gap-3">
                        <div className={`h-px w-12 transition-colors duration-1000 ${breached ? 'bg-blue-500' : 'bg-pulse-500'}`}></div>
                        <p className={`font-bold uppercase tracking-[0.6em] text-[8px] md:text-[10px] transition-colors duration-1000 ${breached ? 'text-blue-600' : 'text-pulse-500'}`}>CRYSTAL_OS v1.8.5</p>
                        <div className={`h-px w-12 transition-colors duration-1000 ${breached ? 'bg-blue-500' : 'bg-pulse-500'}`}></div>
                    </div>
                </div>

                {!isBootComplete ? (
                    <div className="w-full space-y-4 landscape:space-y-2 max-w-[280px] mx-auto animate-fade-in">
                        <div className="w-full h-1.5 bg-void-900 border border-white/10 rounded-full overflow-hidden p-0.5 shadow-inner">
                            <div 
                                className={`h-full bg-pulse-500 shadow-[0_0_15px_#e11d48] transition-all duration-300 ${isDecoding && loadingProgress > 90 ? 'animate-pulse' : ''}`}
                                style={{ width: `${loadingProgress}%` }}
                            />
                        </div>
                        <div className="flex justify-between items-center text-[8px] font-black text-zinc-500 italic tracking-[0.2em]">
                            <span className="truncate max-w-[80%]">{currentMessage}</span>
                            <span>{Math.floor(loadingProgress)}%</span>
                        </div>
                    </div>
                ) : (
                    <div className="w-full flex flex-col gap-5 landscape:gap-3 animate-fade-in max-w-md items-center">
                        <div className="glass-reveal p-1 rounded-[2.25rem] shadow-2xl overflow-hidden">
                            <button 
                                onClick={onEnterFeeds}
                                className="group relative w-full py-5 bg-slate-900 text-inverse font-black uppercase italic text-base rounded-[1.75rem] shadow-xl hover:translate-y-[-2px] transition-all active:scale-95 active:bg-blue-600 flex items-center justify-center gap-4 border border-white/10"
                            >
                                <ListIcon className="w-6 h-6" />
                                <span>RECON_INTELLIGENCE</span>
                            </button>
                        </div>
                        
                        <button 
                            onClick={onEnterArcade}
                            className="group w-full py-5 bg-white border-2 border-slate-200 text-slate-700 font-black uppercase italic text-base rounded-[1.75rem] hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95 flex items-center justify-center gap-4 shadow-sm"
                        >
                            <ControllerIcon className="w-6 h-6" />
                            <span>ARCADE_QUICK_ACCESS</span>
                        </button>
                        
                        <button 
                            onClick={() => setShowWipeConfirm(true)}
                            className="mt-4 flex items-center justify-center gap-2 text-slate-300 hover:text-red-500 transition-colors py-1 uppercase text-[8px] font-black italic tracking-widest active:scale-95"
                        >
                            <TrashIcon className="w-3 h-3" />
                            <span>PURGE_STATION_CACHE</span>
                        </button>
                    </div>
                )}
            </div>

            <div className={`fixed bottom-[calc(1.5rem+var(--safe-bottom))] left-6 right-6 flex justify-between items-end pointer-events-none z-20 transition-all duration-1000 ${breached ? 'opacity-20 text-slate-900' : 'opacity-40 text-white'}`}>
                <div className="text-[7px] font-black uppercase tracking-widest leading-loose italic">
                    DIMENSION: {breached ? 'THE_REVEAL' : 'THE_VEIL'}<br/>
                    STATUS: {isDecoding ? 'DECODING' : 'CALIBRATED'}
                </div>
                <div className="text-[7px] font-black uppercase tracking-widest italic text-right">
                    SECTOR: LOCAL_NODE<br/>
                    ENCRYPTION: 0xCRYSTAL
                </div>
            </div>

            {showWipeConfirm && (
                <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
                    <div className="bg-white border-2 border-white shadow-[0_30px_100px_rgba(0,0,0,0.2)] w-full max-w-sm relative overflow-hidden flex flex-col rounded-[2rem]">
                        <header className="h-12 bg-slate-100 flex items-center justify-between px-4 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                                <h2 className="text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] italic">SYSTEM_PURGE.DAT</h2>
                            </div>
                            <button onClick={() => { soundService.playClick(); setShowWipeConfirm(false); }} className="text-slate-400 hover:text-slate-900">
                                <XIcon className="w-5 h-5" />
                            </button>
                        </header>
                        
                        <div className="p-8 text-center space-y-6">
                            <p className="text-xs text-slate-500 leading-relaxed uppercase font-bold tracking-tight px-4 italic">
                                Operator, committing to a <span className="text-red-500">System Wipe</span> will permanently erase all crystalline cache data, discovered signals, and mission records.
                            </p>
                        </div>

                        <footer className="p-5 flex gap-3 bg-slate-50 border-t border-slate-100">
                            <button onClick={() => { soundService.playClick(); setShowWipeConfirm(false); }} className="flex-1 py-4 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase italic text-slate-400">Abort</button>
                            <button onClick={handleSystemWipe} className="flex-1 py-4 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase italic shadow-lg active:scale-95">Confirm Purge</button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SplashScreen;
