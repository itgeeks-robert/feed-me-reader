import React, { useState, useEffect } from 'react';
import { VoidIcon, ControllerIcon, ListIcon } from './icons';

interface SplashScreenProps {
    onEnterFeeds: () => void;
    onEnterArcade: () => void;
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
            
            {/* Decorative Blueprint Elements */}
            <g stroke="rgba(225,29,72,0.3)" fill="none" strokeWidth="1">
                <circle cx="10%" cy="10%" r="50" />
                <circle cx="10%" cy="10%" r="40" strokeDasharray="5,5" />
                <path d="M 0 10% L 20% 10% M 10% 0 L 10% 20%" />
                
                <rect x="80%" y="70%" width="120" height="180" />
                <path d="M 80% 75% L 90% 75% M 80% 80% L 90% 80%" />
                <text x="81%" y="73%" fill="rgba(225,29,72,0.5)" fontSize="8" fontFamily="monospace">MODULE_B12</text>
                
                <path d="M 50% 0 L 50% 100%" strokeDasharray="10,10" />
                <path d="M 0 50% L 100% 50%" strokeDasharray="10,10" />
            </g>
        </svg>
        <div className="absolute top-1/4 left-10 text-[10px] text-pulse-500 font-mono space-y-1 opacity-40">
            <div>[AXIS_X: 104.22]</div>
            <div>[AXIS_Y: 882.01]</div>
            <div>[ROTATION: NULL]</div>
            <div>[STATUS: LOCKED]</div>
        </div>
    </div>
);

const SplashScreen: React.FC<SplashScreenProps> = ({ onEnterFeeds, onEnterArcade }) => {
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [currentMessage, setCurrentMessage] = useState(BOOT_MESSAGES[0]);
    const [isBootComplete, setIsBootComplete] = useState(false);

    useEffect(() => {
        const totalDuration = 5000;
        const intervalTime = 50;
        const increment = (intervalTime / totalDuration) * 100;

        const timer = setInterval(() => {
            setLoadingProgress(prev => {
                if (prev >= 100) {
                    clearInterval(timer);
                    setIsBootComplete(true);
                    return 100;
                }
                const next = prev + increment;
                const msgIndex = Math.floor((next / 100) * BOOT_MESSAGES.length);
                setCurrentMessage(BOOT_MESSAGES[msgIndex] || BOOT_MESSAGES[BOOT_MESSAGES.length - 1]);
                return next;
            });
        }, intervalTime);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="fixed inset-0 z-[100] bg-void-950 flex flex-col items-center justify-center overflow-hidden font-mono">
            {/* Fixed Background Layer */}
            <TechnicalBlueprint />
            
            {/* CRT Overlays */}
            <div className="absolute inset-0 z-10 pointer-events-none cctv-overlay opacity-30" />
            <div className="absolute inset-0 z-10 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(225,29,72,0.05)_2px,rgba(225,29,72,0.05)_4px)]" />

            <div className="relative z-20 w-full max-w-lg px-8 flex flex-col items-center text-center">
                <div className="mb-12 group">
                    <div className="p-6 bg-pulse-500 rounded-[2.5rem] shadow-[0_0_80px_rgba(225,29,72,0.5)] border-4 border-white/20 animate-pulse transition-transform group-hover:scale-110">
                        <VoidIcon className="w-24 h-24 text-white" />
                    </div>
                </div>

                <div className="mb-12">
                    <h1 className="text-6xl md:text-7xl font-black text-white italic uppercase tracking-tighter mb-4 glitch-text drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">THE VOID</h1>
                    <div className="flex items-center justify-center gap-4">
                        <div className="h-px w-12 bg-pulse-500"></div>
                        <p className="text-pulse-500 font-bold uppercase tracking-[0.6em] text-[10px] animate-pulse">RECRUIT_OS v1.8.4</p>
                        <div className="h-px w-12 bg-pulse-500"></div>
                    </div>
                </div>

                {!isBootComplete ? (
                    <div className="w-full space-y-6">
                        <div className="w-full h-2 bg-void-900 border border-white/10 rounded-none overflow-hidden p-0.5">
                            <div 
                                className="h-full bg-pulse-500 shadow-[0_0_15px_#e11d48] transition-all duration-300"
                                style={{ width: `${loadingProgress}%` }}
                            />
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-black text-zinc-500 italic tracking-[0.2em]">
                            <span>{currentMessage}</span>
                            <span>{Math.floor(loadingProgress)}%</span>
                        </div>
                    </div>
                ) : (
                    <div className="w-full grid grid-cols-1 gap-5 animate-fade-in">
                        <button 
                            onClick={onEnterFeeds}
                            className="group relative py-6 bg-white text-black font-black uppercase italic text-xl rounded-2xl shadow-[8px_8px_0px_#e11d48] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all active:scale-95 flex items-center justify-center gap-4"
                        >
                            <ListIcon className="w-6 h-6" />
                            <span>ACCESS SIGNAL FEED</span>
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

            {/* Bottom Status Text */}
            <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end pointer-events-none z-20">
                <div className="text-[8px] font-black text-zinc-700 uppercase tracking-widest leading-loose italic">
                    SYSTEM_STATUS: NOMINAL<br/>
                    LOCATION_TAG: 00-VOID-HUB<br/>
                    SECURITY: LEVEL_7_ENCRYPTED
                </div>
                <div className="text-[8px] font-black text-zinc-700 uppercase tracking-widest italic">
                    © 1984 RECRUIT_CORP
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;