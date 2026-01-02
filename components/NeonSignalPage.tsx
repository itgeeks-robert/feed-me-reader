
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { XIcon, ClockIcon, SparklesIcon, FireIcon, BookOpenIcon, ArrowPathIcon, VoidIcon } from './icons';
import { VOID_DATA } from '../voidDataArchive';
import { NEON_IMAGES } from '../neonSignalAssets';
import OrientationGuard from './OrientationGuard';

/**
 * NEON SIGNAL: DATA_SYNC v19.1
 * Refined for Responsive Landscape:
 * - Increased item font size (clamp 2.5rem to 8rem).
 * - Reduced vertical footprints in landscape mode.
 * - Scaled down result screens to fit within mobile horizontal heights.
 */

const GAME_DURATION = 60;
const CORRECT_DELTA = 30; 
const PASS_DELTA = -20; 
const NEUTRAL_DELTA = 15; 

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
    const [timeLeft, setTimeLeft] = useState(3); 
    const [history, setHistory] = useState<{ word: string; correct: boolean }[]>([]);
    const [flash, setFlash] = useState<'NONE' | 'SYNC' | 'VOID'>('NONE');
    
    const referencePitch = useRef<number | null>(null);
    const neutralLock = useRef(false);
    const actionLock = useRef(false);
    const gracePeriodActive = useRef(false);
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
        referencePitch.current = null; 
        neutralLock.current = false;
        actionLock.current = false;
    };

    const handleAction = useCallback((correct: boolean) => {
        if (gameState !== 'PLAYING' || actionLock.current || gracePeriodActive.current) return;
        
        actionLock.current = true;
        neutralLock.current = true; 

        if (window.navigator.vibrate) {
            window.navigator.vibrate(correct ? 60 : [40, 40, 40]);
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
                actionLock.current = false; 
            }, 800); 
        } else {
            setGameState('RESULTS');
        }
    }, [gameState, activePool, currentIndex]);

    useEffect(() => {
        const handleOrientation = (e: DeviceOrientationEvent) => {
            if (gameState !== 'PLAYING' || e.beta === null) return;
            if (referencePitch.current === null) {
                referencePitch.current = e.beta;
                return;
            }
            const currentPitch = e.beta;
            const delta = currentPitch - referencePitch.current;

            if (neutralLock.current) {
                if (Math.abs(delta) < NEUTRAL_DELTA) {
                    neutralLock.current = false;
                }
                return; 
            }

            if (actionLock.current || gracePeriodActive.current) return;

            if (delta > CORRECT_DELTA) handleAction(true);
            else if (delta < PASS_DELTA) handleAction(false);
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
            referencePitch.current = null; 
            gracePeriodActive.current = true;
            setTimeout(() => { gracePeriodActive.current = false; }, 1500);
        } else if (gameState === 'PLAYING' && timeLeft === 0) {
            setGameState('RESULTS');
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [gameState, timeLeft]);

    useEffect(() => {
        if (gameState === 'RESULTS') onWin?.(score);
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
        <div className="w-full h-full bg-zinc-950 p-4 md:p-6 font-mono overflow-y-auto scrollbar-hide flex flex-col animate-fade-in pb-32">
            <header className="flex justify-between items-center mb-6 md:mb-12 shrink-0 mt-[var(--safe-top)]">
                <button onClick={onBack} className="p-3 md:p-4 bg-zinc-900 rounded-2xl border border-white/10 active:scale-90 transition-all shadow-lg">
                    <XIcon className="w-5 h-5 md:w-6 md:h-6 text-white"/>
                </button>
                <div className="text-right">
                    <span className="text-[9px] md:text-[10px] text-emerald-500 font-black tracking-widest uppercase italic block mb-1">Protocol: NEON_SIGNAL</span>
                    <h1 className="text-xl md:text-3xl font-black italic text-white tracking-tighter leading-none uppercase">DATA_SYNC</h1>
                </div>
            </header>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8 max-w-4xl mx-auto w-full">
                {VOID_DATA.map((cat) => (
                    <button 
                        key={cat.id} 
                        onClick={() => startTransmission(cat.id, cat.name)}
                        className="relative w-full h-36 md:h-56 rounded-2xl md:rounded-[3rem] bg-black border-2 border-zinc-800 overflow-hidden hover:border-emerald-500 transition-all active:scale-95 group shadow-lg"
                    >
                        <div className="absolute inset-0">
                            <img src={cat.img} alt="" className="w-full h-full object-cover opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-70 group-hover:scale-110 transition-all duration-1000 ease-out" />
                            <div className="absolute inset-0 bg-emerald-950/20 mix-blend-color" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                        </div>
                        <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 text-left z-20">
                            <span className="text-[7px] md:text-[10px] text-emerald-400 font-black tracking-[0.3em] uppercase italic block mb-1 md:mb-2 drop-shadow-md">
                                {cat.words.length} NODES DETECTED
                            </span>
                            <div className="text-lg md:text-3xl font-black text-white italic uppercase tracking-tighter leading-none drop-shadow-2xl">
                                {cat.name}
                            </div>
                        </div>
                    </button>
                ))}
                
                <button 
                    onClick={() => startTransmission('tie_breaker', 'Tie Breaker')} 
                    className="relative w-full h-36 md:h-56 rounded-2xl md:rounded-[3rem] bg-black border-2 border-pulse-500 overflow-hidden active:scale-95 shadow-lg group"
                >
                    <div className="absolute inset-0">
                        <img src={NEON_IMAGES.TIE_BREAKER} className="w-full h-full object-cover opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-70 group-hover:scale-110 transition-all duration-1000 ease-out" alt="" />
                        <div className="absolute inset-0 bg-pulse-950/30 mix-blend-color" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
                    </div>
                    <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 text-left z-20">
                        <span className="text-[7px] md:text-[10px] text-pulse-500 font-black tracking-[0.3em] uppercase italic block mb-1 md:mb-2 drop-shadow-md">MASS_SIGNAL_SYNC</span>
                        <div className="text-lg md:text-3xl font-black text-white italic uppercase tracking-tighter leading-none drop-shadow-2xl">TIE BREAKER</div>
                    </div>
                </button>
            </div>
            
            <div className="mt-8 md:mt-16 flex flex-col items-center gap-6 shrink-0">
                <div className="h-px w-24 bg-zinc-800" />
                <button 
                    onClick={onReturnToFeeds} 
                    className="w-full max-w-xs py-4 md:py-5 bg-zinc-900 border border-white/5 rounded-2xl text-[9px] font-black text-zinc-500 uppercase italic tracking-[0.4em] hover:text-white hover:bg-zinc-800 transition-all shadow-xl active:scale-95"
                >
                    Abort_To_Intel
                </button>
            </div>
        </div>
    );

    return (
        <OrientationGuard landscapeOnly={gameState === 'COUNTDOWN' || gameState === 'PLAYING'}>
             <div className="w-full h-full bg-zinc-950 overflow-hidden font-mono relative">
                
                {(gameState === 'PLAYING' || gameState === 'COUNTDOWN') && (
                    <div className="absolute inset-0 z-0 bg-zinc-950">
                        <img src={activeCatImage} className={`w-full h-full object-cover saturate-0 brightness-150 contrast-150 transition-all duration-1000 scale-125 ${flash === 'SYNC' ? 'opacity-40 bg-emerald-500/30' : flash === 'VOID' ? 'opacity-40 bg-red-500/30' : 'opacity-[0.12]'}`} alt="" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.9)_100%)] pointer-events-none" />
                        <div className="absolute inset-0 cctv-overlay opacity-30 pointer-events-none" />
                        <div className="absolute inset-0 static-noise opacity-[0.05] pointer-events-none" />
                    </div>
                )}

                {gameState === 'COUNTDOWN' && (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 relative z-10">
                        <div className="relative z-10 flex flex-col items-center max-w-md w-full scale-75 md:scale-100">
                            <div className="p-4 md:p-6 bg-pulse-500/10 border-4 border-pulse-500 rounded-[2rem] mb-4 shadow-[0_0_100px_rgba(225,29,72,0.3)] animate-pulse">
                                <VoidIcon className="w-10 h-10 md:w-16 md:h-16 text-white" />
                            </div>
                            <h2 className="text-base md:text-2xl font-black text-white italic uppercase tracking-widest mb-2">CALIBRATING_SENSORS</h2>
                            <div className="inline-block px-6 py-2 bg-white text-black font-black uppercase italic tracking-[0.4em] rounded-full mb-4 shadow-2xl border-2 border-black/10 text-[9px] md:text-base">
                                PLACE_ON_FOREHEAD_NOW
                            </div>
                            <div className="text-[clamp(3rem,15vh,8rem)] md:text-[clamp(4rem,20vw,12rem)] font-black text-white italic animate-ping leading-none drop-shadow-[0_0_60px_rgba(255,255,255,0.4)]">
                                {timeLeft}
                            </div>
                        </div>
                    </div>
                )}

                {gameState === 'PLAYING' && (
                    <div className="w-full h-full p-2 md:p-6 landscape:p-1 relative z-10">
                        <div className={`w-full h-full border-2 md:border-[12px] landscape:border-2 border-zinc-900 rounded-2xl md:rounded-[3rem] landscape:rounded-xl overflow-hidden flex flex-col transition-all duration-500 relative shadow-[0_0_100px_rgba(0,0,0,0.8)] ${timeLeft <= 10 ? 'bg-red-950/25 border-red-900/40' : 'bg-black/30 border-zinc-800'}`}>
                            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.5)] z-20" />

                            <header className="px-4 py-2 md:px-12 md:py-6 landscape:py-1 flex justify-between items-center shrink-0 z-50">
                                <button onClick={abortNode} className="flex items-center gap-2 px-3 py-1 bg-zinc-900/95 border border-pulse-500/40 rounded-lg text-pulse-500 font-black uppercase italic text-[8px] tracking-widest backdrop-blur-md active:scale-95 transition-all shadow-lg">
                                    <XIcon className="w-3 h-3" />
                                    <span>ABORT</span>
                                </button>
                                <span className="text-[8px] md:text-xs font-black text-emerald-500 uppercase tracking-[0.3em] leading-none italic animate-pulse">
                                    NODE {String(currentIndex + 1).padStart(3, '0')} / {activePool.length}
                                </span>
                            </header>

                            <div className="h-1 bg-black/80 w-full relative z-20 overflow-hidden">
                                <div className={`h-full transition-all duration-1000 ease-linear ${timeLeft <= 10 ? 'bg-red-500 shadow-[0_0_20px_#ef4444]' : 'bg-emerald-500 shadow-[0_0_20px_#10b981]'}`} style={{ width: `${(timeLeft/GAME_DURATION)*100}%` }} />
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-center p-2 md:p-12 landscape:p-2 text-center relative z-10 min-h-0 overflow-hidden">
                                {neutralLock.current && (
                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full animate-fade-in backdrop-blur-xl shadow-2xl z-50">
                                        <ArrowPathIcon className="w-2.5 h-2.5 text-white animate-spin" />
                                        <span className="text-[7px] font-black text-white uppercase tracking-[0.1em] italic">RE-CENTERING</span>
                                    </div>
                                )}

                                <div className={`text-[7px] md:text-sm font-black tracking-[0.3em] mb-2 md:mb-12 landscape:mb-1 flex items-center gap-3 ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-zinc-600'}`}>
                                    DECRYPTING: {selectedCatName}
                                </div>
                                
                                <div className="max-w-full w-full flex items-center justify-center flex-1 max-h-[50vh] md:max-h-[60vh]">
                                    <h2 className="text-[clamp(2.5rem,18vh,8rem)] md:text-[clamp(3.5rem,14vw,10rem)] font-black text-emerald-400 uppercase italic tracking-tighter leading-[0.9] font-horror drop-shadow-[0_10px_60px_rgba(0,0,0,1)] transition-all duration-300 w-full px-4 break-words">
                                        {activePool[currentIndex] || "NODE_EMPTY"}
                                    </h2>
                                </div>
                                
                                <div className="flex items-center gap-4 md:gap-16 mt-2 mb-2 landscape:mt-1 landscape:mb-0">
                                    <div className="px-4 py-1 md:px-10 md:py-5 bg-zinc-900/80 border border-white/10 rounded-lg text-white/50 font-black text-lg md:text-5xl italic shadow-2xl backdrop-blur-md">
                                        {timeLeft}S
                                    </div>
                                    <div className="px-4 py-1 md:px-10 md:py-5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 font-black text-lg md:text-5xl italic shadow-2xl backdrop-blur-md">
                                        {score}
                                    </div>
                                </div>
                            </div>
                            
                            <footer className="px-6 py-1 flex justify-between items-end shrink-0 z-20 pointer-events-none border-t border-white/5">
                                <div className="text-[6px] md:text-[8px] font-black text-white/20 uppercase tracking-widest italic">
                                    PITCH: {referencePitch.current ? referencePitch.current.toFixed(1) : 'CAL...'}°
                                </div>
                                <div className="text-[6px] md:text-[8px] font-black text-zinc-800 uppercase tracking-[0.4em] italic">
                                    VOID_RECRUIT_OS
                                </div>
                            </footer>
                        </div>
                    </div>
                )}

                {gameState === 'RESULTS' && (
                    <div className="w-full h-full bg-zinc-950 p-4 md:p-6 flex flex-col overflow-hidden animate-fade-in relative z-10">
                        <div className="text-center mt-2 md:mt-12 shrink-0 relative">
                            <div className="absolute -top-4 md:-top-10 left-1/2 -translate-x-1/2 text-[40px] md:text-[120px] font-black text-white/5 italic select-none leading-none">DONE</div>
                            <h2 className="text-xl md:text-7xl font-black italic uppercase text-white tracking-tighter leading-none mb-2 md:mb-6 relative z-10">DATA_SYNC_COMPLETE</h2>
                            <div className="inline-block px-6 py-1 md:px-12 md:py-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg md:rounded-[2.5rem] shadow-2xl relative z-10">
                                <span className="text-emerald-400 font-black text-sm md:text-4xl italic uppercase tracking-widest">{score} PACKETS EXTRACTED</span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto mt-4 md:mt-12 space-y-2 md:space-y-4 mb-4 md:mb-10 scrollbar-hide bg-black/60 rounded-xl md:rounded-[4rem] p-4 md:p-10 border border-white/5 shadow-inner">
                            {history.map((h, i) => (
                                <div key={i} className={`p-2 md:p-6 rounded-lg md:rounded-3xl flex justify-between items-center border animate-fade-in ${h.correct ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-red-500/5 border-red-500/20 text-red-500/40'}`} style={{ animationDelay: `${i * 80}ms` }}>
                                    <span className="font-black italic uppercase text-sm md:text-3xl tracking-tighter truncate max-w-[75%] font-horror">{h.word}</span>
                                    <span className={`text-[7px] md:text-[10px] font-black border px-2 py-0.5 md:px-5 md:py-2 rounded-full uppercase tracking-widest ${h.correct ? 'border-emerald-500/40 text-emerald-500' : 'border-red-500/40 text-red-500'}`}>
                                        {h.correct ? 'SYNCED' : 'VOID'}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2 md:space-y-6 shrink-0 pb-[calc(1rem+var(--safe-bottom))] bg-zinc-950 pt-1 max-w-xl mx-auto w-full">
                            <button onClick={() => setGameState('MENU')} className="w-full py-3 md:py-8 bg-white text-black font-black uppercase italic rounded-xl md:rounded-3xl text-sm md:text-3xl shadow-[0_4px_0px_#10b981] active:translate-y-1 active:shadow-none transition-all hover:bg-emerald-50">
                                New_Uplink
                            </button>
                            <button onClick={onBack} className="w-full py-1 text-zinc-700 font-black uppercase text-[8px] tracking-[0.5em] italic hover:text-zinc-400 transition-colors text-center">
                                [ TERMINATE ]
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </OrientationGuard>
    );
};

export default NeonSignalPage;
