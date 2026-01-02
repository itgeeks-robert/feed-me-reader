import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { XIcon, ClockIcon, SparklesIcon, FireIcon, BookOpenIcon, ArrowPathIcon } from './icons';
import { VOID_DATA } from '../voidDataArchive';
import { NEON_IMAGES } from '../neonSignalAssets';
import OrientationGuard from './OrientationGuard';

/**
 * NEON SIGNAL: DATA_SYNC v17.0
 * Optimized for Forehead-Mount Haptics and Kinetic Accuracy.
 * UI Enhancement: Rugged Terminal Bezel and High-Contrast Visuals.
 */

const GAME_DURATION = 60;

// THRESHOLDS for a Landscape device held on the forehead
const TILT_SYNC = 135;   // Tilt DOWN (forward)
const TILT_VOID = 45;    // Tilt UP (back)
const NEUTRAL_MIN = 75;  // Zone to reset trigger
const NEUTRAL_MAX = 105; // Zone to reset trigger

interface NeonSignalProps {
    onBack: () => void;
    onReturnToFeeds: () => void;
    onWin?: (score: number) => void;
}

const NeonSignalPage: React.FC<NeonSignalProps> = ({ onBack, onReturnToFeeds, onWin }) => {
    const [gameState, setGameState] = useState<'MENU' | 'COUNTDOWN' | 'PLAYING' | 'RESULTS'>('MENU');
    const [activePool, setActivePool] = useState<string[]>([]);
    const [selectedCatId, setSelectedCatId] = useState("");
    const [selectedCatName, setSelectedCatName] = useState("");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [history, setHistory] = useState<{ word: string; correct: boolean }[]>([]);
    const [flash, setFlash] = useState<'NONE' | 'SYNC' | 'VOID'>('NONE');
    
    const tiltLock = useRef(false);
    const neutralLock = useRef(false); 
    const timerRef = useRef<number | null>(null);

    const startTransmission = async (catId: string, catName: string) => {
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            try {
                const response = await (DeviceOrientationEvent as any).requestPermission();
                if (response !== 'granted') {
                    alert("GYROSCOPE ACCESS DENIED. KINETIC SYNC IMPOSSIBLE.");
                    return;
                }
            } catch (e) {
                console.error("Motion request failed", e);
            }
        }

        let words: string[] = [];
        if (catId === 'tie_breaker') {
            words = VOID_DATA.flatMap(cat => cat.words);
        } else {
            const found = VOID_DATA.find(c => c.id === catId);
            words = found ? [...found.words] : [];
        }

        if (words.length === 0) words = ["VOID", "SIGNAL", "NETWORK", "DECRYPT"];

        const shuffled = [...words];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        setActivePool(shuffled);
        setSelectedCatId(catId);
        setSelectedCatName(catName.toUpperCase());
        setGameState('COUNTDOWN');
        setTimeLeft(3);
        setHistory([]);
        setScore(0);
        setCurrentIndex(0);
        neutralLock.current = false;
        tiltLock.current = false;
    };

    const handleAction = useCallback((correct: boolean) => {
        if (gameState !== 'PLAYING' || tiltLock.current) return;
        
        tiltLock.current = true;
        neutralLock.current = true; 

        if (window.navigator.vibrate) {
            window.navigator.vibrate(correct ? 50 : [50, 50, 50]);
        }

        const currentWord = activePool[currentIndex];
        if (currentWord) {
            setHistory(prev => [...prev, { word: currentWord, correct }]);
            if (correct) setScore(s => s + 1);
        }

        setFlash(correct ? 'SYNC' : 'VOID');
        setTimeout(() => setFlash('NONE'), 400);
        
        if (currentIndex < activePool.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setTimeout(() => { 
                tiltLock.current = false; 
            }, 600);
        } else {
            setGameState('RESULTS');
        }
    }, [gameState, activePool, currentIndex]);

    useEffect(() => {
        const handleOrientation = (e: DeviceOrientationEvent) => {
            if (gameState !== 'PLAYING' || e.beta === null) return;
            
            const beta = e.beta;

            if (neutralLock.current) {
                if (beta > NEUTRAL_MIN && beta < NEUTRAL_MAX) {
                    neutralLock.current = false;
                }
                return; 
            }

            if (tiltLock.current) return;

            if (beta > TILT_SYNC) {
                handleAction(true);
            } else if (beta < TILT_VOID) {
                handleAction(false);
            }
        };

        if (gameState === 'PLAYING') {
            window.addEventListener('deviceorientation', handleOrientation);
        }
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, [gameState, handleAction]);

    useEffect(() => {
        if ((gameState === 'COUNTDOWN' || gameState === 'PLAYING') && timeLeft > 0) {
            timerRef.current = window.setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        } else if (gameState === 'COUNTDOWN' && timeLeft === 0) {
            setGameState('PLAYING');
            setTimeLeft(GAME_DURATION);
        } else if (gameState === 'PLAYING' && timeLeft === 0) {
            setGameState('RESULTS');
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [gameState, timeLeft]);

    useEffect(() => {
        if (gameState === 'RESULTS') {
            onWin?.(score);
        }
    }, [gameState, score, onWin]);

    const activeCatImage = useMemo(() => {
        if (selectedCatId === 'tie_breaker') return NEON_IMAGES.TIE_BREAKER;
        return VOID_DATA.find(c => c.id === selectedCatId)?.img || NEON_IMAGES.PEOPLE;
    }, [selectedCatId]);

    const abortNode = (e: React.MouseEvent) => {
        e.stopPropagation();
        setGameState('MENU');
    };

    if (gameState === 'MENU') return (
        <div className="w-full h-full bg-zinc-950 p-6 font-mono overflow-y-auto scrollbar-hide flex flex-col animate-fade-in pb-32">
            <header className="flex justify-between items-center mb-12 shrink-0 mt-[var(--safe-top)]">
                <button onClick={onBack} className="p-4 bg-zinc-900 rounded-2xl border border-white/10 active:scale-90 transition-all shadow-lg">
                    <XIcon className="w-6 h-6 text-white"/>
                </button>
                <div className="text-right">
                    <span className="text-[10px] text-emerald-500 font-black tracking-widest uppercase italic block mb-1">Protocol: NEON_SIGNAL</span>
                    <h1 className="text-2xl md:text-3xl font-black italic text-white tracking-tighter leading-none uppercase">DATA_SYNC</h1>
                </div>
            </header>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-3xl mx-auto w-full">
                {VOID_DATA.map((cat) => (
                    <button 
                        key={cat.id} 
                        onClick={() => startTransmission(cat.id, cat.name)}
                        className="relative w-full h-56 rounded-[3rem] bg-black border-2 border-zinc-800 overflow-hidden hover:border-emerald-500 transition-all active:scale-95 group shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                    >
                        <div className="absolute inset-0">
                            <img 
                                src={cat.img} 
                                alt="" 
                                className="w-full h-full object-cover opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-70 group-hover:scale-110 transition-all duration-1000 ease-out"
                            />
                            <div className="absolute inset-0 bg-emerald-950/20 mix-blend-color" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                        </div>
                        <div className="absolute bottom-8 left-8 text-left z-20">
                            <span className="text-[10px] text-emerald-400 font-black tracking-[0.3em] uppercase italic block mb-2 drop-shadow-md">
                                {cat.words.length} NODES DETECTED
                            </span>
                            <div className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter leading-none drop-shadow-2xl">
                                {cat.name}
                            </div>
                        </div>
                    </button>
                ))}
                
                <button 
                    onClick={() => startTransmission('tie_breaker', 'Tie Breaker')} 
                    className="relative w-full h-56 rounded-[3rem] bg-black border-2 border-pulse-500 overflow-hidden active:scale-95 shadow-[0_20px_50px_rgba(225,29,72,0.15)] group"
                >
                    <div className="absolute inset-0">
                        <img 
                            src={NEON_IMAGES.TIE_BREAKER} 
                            className="w-full h-full object-cover opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-70 group-hover:scale-110 transition-all duration-1000 ease-out" 
                            alt="" 
                        />
                        <div className="absolute inset-0 bg-pulse-950/30 mix-blend-color" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
                    </div>
                    <div className="absolute bottom-8 left-8 text-left z-20">
                        <span className="text-[10px] text-pulse-500 font-black tracking-[0.3em] uppercase italic block mb-2 drop-shadow-md">MASS_SIGNAL_SYNC</span>
                        <div className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter leading-none drop-shadow-2xl">TIE BREAKER</div>
                    </div>
                </button>
            </div>
            
            <div className="mt-16 flex flex-col items-center gap-6 shrink-0">
                <div className="h-px w-24 bg-zinc-800" />
                <button 
                    onClick={onReturnToFeeds} 
                    className="w-full max-w-xs py-5 bg-zinc-900 border border-white/5 rounded-2xl text-[10px] font-black text-zinc-500 uppercase italic tracking-[0.4em] hover:text-white hover:bg-zinc-800 transition-all shadow-xl active:scale-95"
                >
                    Abort_To_Intel
                </button>
            </div>
        </div>
    );

    return (
        <OrientationGuard landscapeOnly={gameState === 'COUNTDOWN' || gameState === 'PLAYING'}>
             <div className="w-full h-full bg-zinc-950 overflow-hidden font-mono relative">
                
                {/* DYNAMIC CCTV BACKGROUND LAYER - INTENSIFIED */}
                {(gameState === 'PLAYING' || gameState === 'COUNTDOWN') && (
                    <div className="absolute inset-0 z-0 bg-zinc-950">
                        <img 
                            src={activeCatImage} 
                            className={`w-full h-full object-cover saturate-0 brightness-150 contrast-150 transition-all duration-1000 scale-125 ${flash === 'SYNC' ? 'opacity-40 bg-emerald-500/30' : flash === 'VOID' ? 'opacity-40 bg-red-500/30' : 'opacity-[0.12]'}`}
                            alt=""
                        />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.9)_100%)] pointer-events-none" />
                        <div className="absolute inset-0 cctv-overlay opacity-30 pointer-events-none" />
                        <div className="absolute inset-0 static-noise opacity-[0.05] pointer-events-none" />
                    </div>
                )}

                {gameState === 'COUNTDOWN' && (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-10 relative z-10">
                        <div className="relative z-10">
                            <div className="inline-block px-12 py-4 bg-white text-black font-black uppercase italic tracking-[0.5em] rounded-full mb-12 shadow-[0_0_80px_rgba(255,255,255,0.2)] animate-pulse border-4 border-black/10">
                                MOUNT_TERMINAL_ON_FOREHEAD
                            </div>
                            <p className="text-white/40 text-[11px] font-black uppercase tracking-[0.4em] mb-12 italic">
                                Tilt DOWN for SYNC <span className="mx-4 text-white/20">//</span> Tilt UP for VOID
                            </p>
                            <div className="text-[clamp(8rem,40vw,20rem)] font-black text-white italic animate-ping leading-none drop-shadow-[0_0_40px_rgba(255,255,255,0.4)]">
                                {timeLeft}
                            </div>
                        </div>
                    </div>
                )}

                {gameState === 'PLAYING' && (
                    /* THE BOLD BEZEL BUFFER */
                    <div className="w-full h-full p-4 sm:p-8 md:p-12 relative z-10">
                        
                        {/* PHYSICAL TERMINAL FRAME EFFECT */}
                        <div className={`w-full h-full border-[6px] md:border-[12px] border-zinc-900 rounded-[2.5rem] md:rounded-[4rem] overflow-hidden flex flex-col transition-all duration-500 relative shadow-[0_0_100px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(255,255,255,0.05)] ${timeLeft <= 10 ? 'bg-red-950/25 border-red-900/40' : 'bg-black/30 border-zinc-800'}`}>
                            
                            {/* Inner Bezel Glow */}
                            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.5)] z-20" />

                            <header className="px-8 py-6 md:px-12 md:py-8 flex justify-between items-start shrink-0 z-50">
                                <button 
                                    onClick={abortNode} 
                                    className="flex items-center gap-3 px-5 py-3 bg-zinc-900/90 border-2 border-pulse-500/40 rounded-2xl text-pulse-500 font-black uppercase italic text-[10px] tracking-widest backdrop-blur-md active:scale-95 transition-all shadow-2xl"
                                >
                                    <XIcon className="w-5 h-5" />
                                    <span>ABORT_LINK</span>
                                </button>

                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] leading-none mb-2 italic">ENCRYPT_LEVEL_7</span>
                                    <span className="text-xs font-black text-emerald-500 uppercase tracking-[0.4em] leading-none italic animate-pulse flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                                        LIVE_SYNC
                                    </span>
                                </div>
                            </header>

                            {/* Progress Bar - Integrated into Bezel */}
                            <div className="h-1.5 md:h-2 bg-black/80 w-full relative z-20 overflow-hidden border-y border-white/5">
                                <div 
                                    className={`h-full transition-all duration-1000 ease-linear ${timeLeft <= 10 ? 'bg-red-500 shadow-[0_0_20px_#ef4444]' : 'bg-emerald-500 shadow-[0_0_20px_#10b981]'}`} 
                                    style={{ width: `${(timeLeft/GAME_DURATION)*100}%` }} 
                                />
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-20 text-center relative z-10">
                                {/* RESET INDICATOR */}
                                {neutralLock.current && (
                                    <div className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-2 bg-white/10 border-2 border-white/20 rounded-full animate-fade-in backdrop-blur-xl shadow-2xl">
                                        <ArrowPathIcon className="w-4 h-4 text-white animate-spin" />
                                        <span className="text-[10px] font-black text-white uppercase tracking-[0.4em] italic">RE-CENTERING</span>
                                    </div>
                                )}

                                <div className={`text-xs md:text-sm font-black tracking-[0.8em] mb-16 flex items-center gap-8 ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-zinc-600'}`}>
                                    DECRYPTING_SIGNAL: {selectedCatName}
                                </div>
                                
                                <h2 className="text-[clamp(3rem,14vw,10rem)] font-black text-white uppercase italic tracking-tighter leading-[0.8] mb-20 drop-shadow-[0_0_50px_rgba(255,255,255,0.4)] font-horror transition-all duration-300">
                                    {activePool[currentIndex]}
                                </h2>
                                
                                <div className="flex items-center gap-16">
                                    <div className="px-10 py-5 bg-zinc-900/80 border-2 border-white/10 rounded-[2rem] text-white/50 font-black text-5xl italic shadow-2xl backdrop-blur-md">
                                        {timeLeft}S
                                    </div>
                                    <div className="px-10 py-5 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-[2rem] text-emerald-400 font-black text-5xl italic shadow-2xl backdrop-blur-md">
                                        {score}
                                    </div>
                                </div>
                            </div>
                            
                            {/* DECORATIVE TERMINAL DATA */}
                            <footer className="px-12 py-8 flex justify-between items-end shrink-0 z-20 pointer-events-none border-t border-white/5">
                                <div className="text-[9px] font-black text-white/20 uppercase tracking-widest leading-loose italic">
                                    SIG_STRENGTH: 99.1%<br/>
                                    LATENCY: 0.001ms<br/>
                                    NODE_ID: {selectedCatId.toUpperCase()}
                                </div>
                                <div className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.5em] italic">
                                    VOID_PROTOCOL_RECRUIT_OS
                                </div>
                            </footer>
                        </div>
                    </div>
                )}

                {gameState === 'RESULTS' && (
                    <div className="w-full h-full bg-zinc-950 p-6 flex flex-col overflow-hidden animate-fade-in relative z-10">
                        <div className="text-center mt-12 shrink-0 relative">
                             <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-[150px] font-black text-white/5 italic select-none leading-none">DONE</div>
                            <h2 className="text-5xl md:text-7xl font-black italic uppercase text-white tracking-tighter leading-none mb-6 relative z-10">DATA_SYNC_COMPLETE</h2>
                            <div className="inline-block px-12 py-4 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-[2.5rem] shadow-2xl relative z-10">
                                <span className="text-emerald-400 font-black text-4xl italic uppercase tracking-widest">{score} PACKETS EXTRACTED</span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto mt-12 space-y-4 mb-10 scrollbar-hide bg-black/60 rounded-[4rem] p-10 border-2 border-white/5 shadow-inner">
                            {history.map((h, i) => (
                                <div key={i} className={`p-6 rounded-3xl flex justify-between items-center border-2 animate-fade-in ${h.correct ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-red-500/5 border-red-500/20 text-red-500/40'}`} style={{ animationDelay: `${i * 80}ms` }}>
                                    <span className="font-black italic uppercase text-3xl tracking-tighter truncate max-w-[75%]">{h.word}</span>
                                    <span className={`text-[10px] font-black border-2 px-5 py-2 rounded-full uppercase tracking-widest ${h.correct ? 'border-emerald-500/40 text-emerald-500' : 'border-red-500/40 text-red-500'}`}>
                                        {h.correct ? 'SYNCED' : 'VOID'}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-6 shrink-0 pb-[calc(2.5rem+var(--safe-bottom))] bg-zinc-950 pt-4 max-w-xl mx-auto w-full">
                            <button 
                                onClick={() => setGameState('MENU')} 
                                className="w-full py-8 bg-white text-black font-black uppercase italic rounded-3xl text-3xl shadow-[0_12px_0px_#10b981] active:translate-y-2 active:shadow-none transition-all hover:bg-emerald-50"
                            >
                                Establish_New_Link
                            </button>
                            <button 
                                onClick={onBack} 
                                className="w-full py-2 text-zinc-700 font-black uppercase text-xs tracking-[0.5em] italic hover:text-zinc-400 transition-colors text-center"
                            >
                                [ TERMINATE_SESSION ]
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </OrientationGuard>
    );
};

export default NeonSignalPage;
