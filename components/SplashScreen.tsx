
import React, { useState, useEffect } from 'react';
import { VoidIcon, ControllerIcon, ListIcon, TrashIcon, XIcon, ExclamationTriangleIcon } from './icons';

interface SplashScreenProps {
    onEnterFeeds: () => void;
    onEnterArcade: () => void;
    isDecoding: boolean;
}

const BOOT_MESSAGES = [
    "INITIALIZING VOID_KERNEL_7.2...",
    "LINKING SYNAPTIC PROTOCOLS...",
    "MOUNTING ARCADE_FILESYSTEM...",
    "DECRYPTING FREQUENCY_BUFFER...",
    "ESTABLISHING SECURE_UPLINK...",
    "OPTIMIZING NOIR_RENDERER...",
    "SYNCING DATA_CACHES..."
];

const TechnicalBlueprint: React.FC = () => (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
        <svg width="100%" height="100%" className="absolute inset-0">
            <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(225,29,72,0.2)" strokeWidth="1" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <g stroke="rgba(225,29,72,0.3)" fill="none" strokeWidth="1">
                <circle cx="10%" cy="10%" r="50" />
                <path d="M 50% 0 L 50% 100%" strokeDasharray="10,10" />
                <path d="M 0 50% L 100% 50%" strokeDasharray="10,10" />
            </g>
        </svg>
    </div>
);

const SplashScreen: React.FC<SplashScreenProps> = ({ onEnterFeeds, onEnterArcade, isDecoding }) => {
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [currentMessage, setCurrentMessage] = useState(BOOT_MESSAGES[0]);
    const [isBootComplete, setIsBootComplete] = useState(false);
    const [showWipeConfirm, setShowWipeConfirm] = useState(false);

    useEffect(() => {
        const totalDuration = 4000;
        const intervalTime = 50;
        const increment = (intervalTime / totalDuration) * 100;

        const timer = setInterval(() => {
            setLoadingProgress(prev => {
                if (prev >= 95 && isDecoding) return 95;
                if (prev >= 100) {
                    clearInterval(timer);
                    setIsBootComplete(true);
                    return 100;
                }
                const next = prev + increment;
                const msgIndex = Math.floor((next / 100) * BOOT_MESSAGES.length);
                setCurrentMessage(isDecoding && next > 70 ? "DECODING LIVE SIGNALS..." : BOOT_MESSAGES[msgIndex] || BOOT_MESSAGES[BOOT_MESSAGES.length - 1]);
                return next;
            });
        }, intervalTime);

        return () => clearInterval(timer);
    }, [isDecoding]);

    const handleSystemWipe = () => {
        localStorage.clear();
        const req = indexedDB.deleteDatabase('SeeMoreCache');
        req.onsuccess = () => window.location.reload();
        req.onerror = () => window.location.reload();
        req.onblocked = () => window.location.reload();
    };

    return (
        <div className="fixed inset-0 z-[100] bg-void-950 flex flex-col items-center justify-center overflow-x-hidden overflow-y-auto font-mono scrollbar-hide pt-[calc(2rem+var(--safe-top))] pb-[calc(2rem+var(--safe-bottom))] px-6">
            <TechnicalBlueprint />
            <div className="absolute inset-0 z-10 pointer-events-none cctv-overlay opacity-30" />
            
            <div className="relative z-20 w-full max-w-lg flex flex-col items-center text-center py-6">
                <div className="mb-6 landscape:mb-4 group">
                    <div className="p-4 bg-pulse-500 rounded-[2rem] landscape:rounded-2xl shadow-[0_0_80px_rgba(225,29,72,0.5)] border-4 border-white/20 animate-pulse transition-all">
                        <VoidIcon className="w-12 h-12 landscape:w-10 landscape:h-10 text-white" />
                    </div>
                </div>

                <div className="mb-8 landscape:mb-4">
                    <h1 className="text-4xl md:text-7xl font-black text-white italic uppercase tracking-tighter mb-2 glitch-text">THE VOID</h1>
                    <div className="flex items-center justify-center gap-3">
                        <div className="h-px w-10 bg-pulse-500"></div>
                        <p className="text-pulse-500 font-bold uppercase tracking-[0.6em] text-[8px] landscape:text-[7px]">RECRUIT_OS v1.8.4</p>
                        <div className="h-px w-10 bg-pulse-500"></div>
                    </div>
                </div>

                {!isBootComplete ? (
                    <div className="w-full space-y-4 landscape:space-y-2 max-w-[280px] mx-auto">
                        <div className="w-full h-1.5 bg-void-900 border border-white/10 rounded-none overflow-hidden p-0.5">
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
                    <div className="w-full flex flex-col gap-4 landscape:gap-3 animate-fade-in max-w-sm">
                        <button 
                            onClick={onEnterFeeds}
                            className="group relative py-4 bg-white text-black font-black uppercase italic text-base rounded-xl shadow-[6px_6px_0px_#e11d48] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all active:scale-95 active:bg-pulse-500 active:text-white flex items-center justify-center gap-3"
                        >
                            <ListIcon className="w-5 h-5" />
                            <span>SIGNAL ACQUISITION</span>
                        </button>
                        <button 
                            onClick={onEnterArcade}
                            className="group py-4 bg-void-900 border-2 border-pulse-500 text-pulse-500 font-black uppercase italic text-base rounded-xl shadow-[6px_6px_0px_rgba(0,0,0,0.5)] hover:bg-pulse-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            <ControllerIcon className="w-5 h-5" />
                            <span>ENTER ARCADE CORE</span>
                        </button>
                        
                        <button 
                            onClick={() => setShowWipeConfirm(true)}
                            className="mt-2 flex items-center justify-center gap-2 text-zinc-600 hover:text-pulse-500 transition-colors py-1 uppercase text-[8px] font-black italic tracking-widest active:scale-95"
                        >
                            <TrashIcon className="w-3 h-3" />
                            <span>PERFORM SYSTEM WIPE</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Pinned Metadata above Android Home Bar */}
            <div className="fixed bottom-[calc(1.5rem+var(--safe-bottom))] left-6 right-6 flex justify-between items-end pointer-events-none z-20 opacity-40 landscape:opacity-20 transition-opacity">
                <div className="text-[7px] font-black text-zinc-700 uppercase tracking-widest leading-loose italic">
                    SYSTEM_STATUS: {isDecoding ? 'DECODING' : 'NOMINAL'}<br/>
                    SECURITY: LEVEL_7_ENCRYPTED
                </div>
            </div>

            {showWipeConfirm && (
                <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-zinc-900 border-4 border-pulse-600 shadow-[0_0_120px_rgba(225,29,72,0.3)] w-full max-w-sm relative overflow-hidden flex flex-col rounded-3xl">
                        <header className="h-10 bg-pulse-600 flex items-center justify-between px-1 border-b-2 border-black">
                            <div className="flex items-center gap-2 h-full">
                                <div className="w-8 h-7 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center">
                                   <div className="w-4 h-1 bg-black shadow-[0_4px_0_black]" />
                                </div>
                                <h2 className="text-white text-[9px] font-black uppercase tracking-[0.2em] italic px-2 truncate">CRITICAL_PROTOCOL.EXE</h2>
                            </div>
                            <button onClick={() => setShowWipeConfirm(false)} className="w-8 h-7 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center active:bg-zinc-400">
                                <XIcon className="w-4 h-4 text-black" />
                            </button>
                        </header>
                        
                        <div className="p-8 landscape:p-4 bg-void-950 text-center space-y-6">
                            <div className="mx-auto w-12 h-12 bg-pulse-500/10 rounded-full flex items-center justify-center border-2 border-pulse-500 animate-pulse">
                                <ExclamationTriangleIcon className="w-6 h-6 text-pulse-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Complete Data Purge</h3>
                                <p className="text-[9px] text-zinc-500 leading-relaxed uppercase tracking-widest italic px-4">
                                    Committing to this action will <span className="text-pulse-500 font-black">permanently erase</span> all user signals, bookmarks, and arcade records.
                                </p>
                            </div>
                        </div>

                        <footer className="p-4 bg-zinc-300 border-t-2 border-black flex gap-3">
                            <button onClick={() => setShowWipeConfirm(false)} className="flex-1 py-3 bg-zinc-100 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-400 text-[9px] font-black uppercase italic text-zinc-600 active:bg-zinc-200">ABORT</button>
                            <button onClick={handleSystemWipe} className="flex-1 py-3 bg-pulse-600 border-t-2 border-l-2 border-white/50 border-b-2 border-r-2 border-pulse-950 text-[9px] font-black uppercase italic text-white hover:bg-pulse-500 active:bg-pulse-700">WIPE_SYSTEM</button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SplashScreen;
