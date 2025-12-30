
import React, { useState, useEffect } from 'react';
import { VoidIcon, ControllerIcon, ListIcon } from './icons';

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

    return (
        <div className="fixed inset-0 z-[100] bg-void-950 flex flex-col items-center justify-center overflow-hidden font-mono">
            <TechnicalBlueprint />
            <div className="absolute inset-0 z-10 pointer-events-none cctv-overlay opacity-30" />
            
            <div className="relative z-20 w-full max-w-lg px-8 flex flex-col items-center text-center pb-24">
                <div className="mb-10 mt-12 group">
                    <div className="p-6 bg-pulse-500 rounded-[2.5rem] shadow-[0_0_80px_rgba(225,29,72,0.5)] border-4 border-white/20 animate-pulse">
                        <VoidIcon className="w-20 h-20 text-white" />
                    </div>
                </div>

                <div className="mb-10">
                    <h1 className="text-6xl md:text-7xl font-black text-white italic uppercase tracking-tighter mb-4 glitch-text">THE VOID</h1>
                    <div className="flex items-center justify-center gap-4">
                        <div className="h-px w-12 bg-pulse-500"></div>
                        <p className="text-pulse-500 font-bold uppercase tracking-[0.6em] text-[10px]">RECRUIT_OS v1.8.4</p>
                        <div className="h-px w-12 bg-pulse-500"></div>
                    </div>
                </div>

                {!isBootComplete ? (
                    <div className="w-full space-y-6">
                        <div className="w-full h-2 bg-void-900 border border-white/10 rounded-none overflow-hidden p-0.5">
                            <div 
                                className={`h-full bg-pulse-500 shadow-[0_0_15px_#e11d48] transition-all duration-300 ${isDecoding && loadingProgress > 90 ? 'animate-pulse' : ''}`}
                                style={{ width: `${loadingProgress}%` }}
                            />
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-black text-zinc-500 italic tracking-[0.2em]">
                            <span>{currentMessage}</span>
                            <span>{Math.floor(loadingProgress)}%</span>
                        </div>
                    </div>
                ) : (
                    <div className="w-full grid grid-cols-1 gap-5 animate-fade-in mb-8">
                        <button 
                            onClick={onEnterFeeds}
                            className="group relative py-6 bg-white text-black font-black uppercase italic text-xl rounded-2xl shadow-[8px_8px_0px_#e11d48] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all active:scale-95 active:bg-pulse-500 active:text-white flex items-center justify-center gap-4"
                        >
                            <ListIcon className="w-6 h-6" />
                            <span>SIGNAL ACQUISITION</span>
                        </button>
                        <button 
                            onClick={onEnterArcade}
                            className="group py-6 bg-void-900 border-2 border-pulse-500 text-pulse-500 font-black uppercase italic text-xl rounded-2xl shadow-[8px_8px_0px_rgba(0,0,0,0.5)] hover:bg-pulse-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-4"
                        >
                            <ControllerIcon className="w-6 h-6" />
                            <span>ENTER ARCADE CORE</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="absolute bottom-14 left-10 right-10 flex justify-between items-end pointer-events-none z-20">
                <div className="text-[8px] font-black text-zinc-700 uppercase tracking-widest leading-loose italic">
                    SYSTEM_STATUS: {isDecoding ? 'DECODING' : 'NOMINAL'}<br/>
                    SECURITY: LEVEL_7_ENCRYPTED
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;
