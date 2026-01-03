
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { XIcon, VoidIcon, SparklesIcon, ArrowPathIcon, WalkieTalkieIcon, BookOpenIcon, ExclamationTriangleIcon } from './icons';
import { saveHighScore, getHighScores, HighScoreEntry } from '../services/highScoresService';
import { soundService } from '../services/soundService';
import { resilientFetch } from '../services/fetch';
import HighScoreTable from './HighScoreTable';
import Tooltip from './Tooltip';

/**
 * CIPHER CORE v5.4 - NAVIGATION RESOLVED
 * A high-fidelity signal decryption simulation.
 * Updated with direct onBackToHub exits to ensure operator mobility.
 */

const MAX_ATTEMPTS = 6;
const FALLBACK_WORD = "FABLE";

interface CipherCoreProps {
    onBackToHub: () => void;
    uptime?: number;
    setUptime?: (v: number) => void;
    onWin?: () => void; 
    preloadedData?: { archiveMap: { date: string; word: string; label: string }[]; isSynced: boolean; loading: boolean };
}

const CipherGraphic: React.FC<{ isSynced: boolean }> = ({ isSynced }) => (
    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
        <div className={`absolute inset-0 ${isSynced ? 'bg-emerald-500/10' : 'bg-pulse-500/10'} rounded-full animate-ping`} />
        <div className={`absolute inset-4 ${isSynced ? 'bg-emerald-500/20' : 'bg-pulse-500/20'} rounded-full animate-pulse`} />
        <div className="relative z-10 p-8 bg-zinc-900 rounded-[2rem] border-4 border-pulse-500 shadow-[0_0_30px_rgba(225,29,72,0.4)]">
            <WalkieTalkieIcon className={`w-16 h-16 ${isSynced ? 'text-emerald-500' : 'text-pulse-500'}`} />
        </div>
        <div className="absolute -top-4 -left-4 text-[8px] font-mono text-pulse-500 uppercase tracking-widest animate-pulse font-black italic">
            {isSynced ? "GLOBAL_SYNC_LOCKED" : "ARCHIVE_MODE_ACTIVE"}
        </div>
    </div>
);

const CipherCorePage: React.FC<CipherCoreProps> = ({ onBackToHub, onWin, preloadedData }) => {
    // Sector Selection
    const [activeSector, setActiveSector] = useState(0); // 0 = Today
    
    // Game State
    const [gameState, setGameState] = useState<'syncing' | 'idle' | 'playing' | 'won' | 'lost'>('syncing');
    const [guesses, setGuesses] = useState<string[]>([]);
    const [currentGuess, setCurrentGuess] = useState("");
    const [shakeRow, setShakeRow] = useState<number | null>(null);
    const [isPosted, setIsPosted] = useState(false);
    const [initials, setInitials] = useState("");
    const [showCopySuccess, setShowCopySuccess] = useState(false);
    
    // UI State
    const [showHelp, setShowHelp] = useState(false);
    const [showScores, setShowScores] = useState(false);
    const [isGlobalSync, setIsGlobalSync] = useState(false);
    const [archiveMap, setArchiveMap] = useState<{ date: string; word: string; label: string }[]>([]);

    // Sync from props
    useEffect(() => {
        if (preloadedData && !preloadedData.loading) {
            setArchiveMap(preloadedData.archiveMap);
            setIsGlobalSync(preloadedData.isSynced);
            if (gameState === 'syncing') setGameState('idle');
        }
    }, [preloadedData, gameState]);

    const storageKey = useMemo(() => {
        const sectorDate = archiveMap[activeSector]?.date || new Date().toISOString().split('T')[0];
        return `void_cipher_v5_${sectorDate}`;
    }, [activeSector, archiveMap]);

    // Session Management
    useEffect(() => {
        if (gameState === 'playing' || gameState === 'won' || gameState === 'lost' || gameState === 'syncing') return;
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                setGuesses(data.guesses || []);
                setGameState(data.state || 'playing');
                setIsPosted(!!data.posted);
            } catch { setGuesses([]); setIsPosted(false); }
        } else {
            setGuesses([]);
            setIsPosted(false);
        }
    }, [storageKey, gameState]);

    const saveSession = useCallback((g: string[], s: string, p: boolean = false) => {
        localStorage.setItem(storageKey, JSON.stringify({ guesses: g, state: s, posted: p }));
    }, [storageKey]);

    const getStatus = (guess: string, i: number, sol: string) => {
        if (sol[i] === guess[i]) return 2; // Correct (Green)
        if (sol.includes(guess[i])) return 1; // Displaced (Pink)
        return 0; // Absent (Dark)
    };

    const handleKey = useCallback((key: string) => {
        if (gameState !== 'playing') return;
        const solution = archiveMap[activeSector]?.word;
        if (!solution) return;

        if (key === 'ENTER') {
            if (currentGuess.length !== 5) {
                soundService.playWrong();
                setShakeRow(guesses.length);
                setTimeout(() => setShakeRow(null), 500);
                return;
            }
            
            const nextGuesses = [...guesses, currentGuess];
            let nextState: any = 'playing';
            if (currentGuess === solution) {
                soundService.playWin();
                nextState = 'won';
                if (onWin) onWin();
            } else if (nextGuesses.length >= MAX_ATTEMPTS) {
                soundService.playLoss();
                nextState = 'lost';
            } else {
                soundService.playCorrect();
            }
            setGuesses(nextGuesses);
            setCurrentGuess("");
            setGameState(nextState);
            saveSession(nextGuesses, nextState);
        } else if (key === 'BACKSPACE' || key === 'DEL') {
            soundService.playClick();
            setCurrentGuess(prev => prev.slice(0, -1));
        } else if (/^[A-Z]$/.test(key) && currentGuess.length < 5) {
            soundService.playPop();
            setCurrentGuess(prev => prev + key);
        }
    }, [currentGuess, guesses, gameState, activeSector, archiveMap, saveSession, onWin]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            handleKey(e.key.toUpperCase());
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [handleKey]);

    useEffect(() => {
        if (gameState === 'idle') {
            const interval = setInterval(() => {
                setShowScores(prev => !prev);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [gameState]);

    const handleTransmitLog = () => {
        soundService.playAction();
        const sol = archiveMap[activeSector].word;
        const emojiGrid = guesses.map(g => 
            Array.from({length: 5}, (_, i) => {
                const s = getStatus(g, i, sol);
                return s === 2 ? '🟩' : s === 1 ? '🟪' : '⬛';
            }).join('')
        ).join('\n');
        
        const scoreStr = gameState === 'won' ? guesses.length : 'X';
        const text = `THE VOID // CIPHER CORE\nSECTOR ${archiveMap[activeSector].label}\n${scoreStr}/${MAX_ATTEMPTS}\n\n${emojiGrid}\n\n[TRANSMISSION SEALED]`;
        navigator.clipboard.writeText(text);
        setShowCopySuccess(true);
        setTimeout(() => setShowCopySuccess(false), 2000);
    };

    const handleSaveScore = () => {
        if (isPosted) return;
        soundService.playClick();
        const sol = archiveMap[activeSector].word;
        const grid = guesses.map(g => Array.from({length: 5}, (_, i) => getStatus(g, i, sol)));
        saveHighScore('spore_crypt', {
            name: initials.toUpperCase() || "???",
            score: guesses.length,
            displayValue: `${guesses.length}/${MAX_ATTEMPTS} TRIES`,
            date: new Date().toISOString(),
            metadata: { sporeGrid: grid }
        }, true);
        setIsPosted(true);
        saveSession(guesses, gameState, true);
    };

    if (gameState === 'syncing') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-6 font-mono text-center relative">
                <div className="absolute top-8 left-8">
                    <button onClick={() => { soundService.playWrong(); onBackToHub(); }} className="p-3 bg-zinc-900 border border-white/10 rounded-xl text-zinc-500 hover:text-white transition-all active:scale-95 flex items-center gap-2">
                        <XIcon className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Abort</span>
                    </button>
                </div>
                <div className="w-20 h-20 border-4 border-pulse-500 border-t-transparent rounded-full animate-spin mb-8 shadow-[0_0_40px_#e11d48]" />
                <p className="text-pulse-500 font-black uppercase italic tracking-widest animate-pulse text-lg">Finalizing Signal Intercept...</p>
                <p className="text-zinc-700 text-[10px] uppercase mt-4 tracking-[0.4em]">SYNC_MODE: CORE_PREFETCH</p>
            </div>
        );
    }

    if (gameState === 'idle') {
        return (
            <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-6 font-mono overflow-y-auto scrollbar-hide">
                <div className="w-full max-sm text-center bg-zinc-900 p-8 md:p-12 rounded-[3rem] border-4 border-pulse-500 shadow-2xl">
                    <header className="mb-10">
                        <div className={`inline-block px-3 py-1 rounded-sm border ${isGlobalSync ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-red-500/10 border-red-500/30 text-red-500'} text-[8px] font-black uppercase tracking-widest italic mb-4`}>
                            {isGlobalSync ? "UPLINK_STABLE: GLOBAL" : "UPLINK_FAIL: ARCHIVE_MODE"}
                        </div>
                        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none glitch-text">CIPHER CORE</h2>
                    </header>

                    <div className="h-[240px] flex items-center justify-center mb-10 overflow-hidden relative">
                        <div key={showScores ? 'scores' : 'graphic'} className="w-full animate-fade-in">
                            {showScores ? (
                                <HighScoreTable entries={getHighScores('spore_crypt')} title="CIPHER" />
                            ) : (
                                <CipherGraphic isSynced={isGlobalSync} />
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <button onClick={() => { soundService.playClick(); setActiveSector(0); setGameState('playing'); }} className="w-full py-6 bg-white text-black font-black uppercase italic rounded-2xl shadow-xl hover:bg-pulse-500 hover:text-white transition-all text-xl">Establish Link</button>
                        
                        <div className="pt-6 border-t border-white/5">
                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-4 block italic">T-Minus Sectors (Archive)</span>
                            <div className="grid grid-cols-4 gap-2">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <button 
                                        key={i} 
                                        onClick={() => { soundService.playClick(); setActiveSector(i); setGameState('playing'); }} 
                                        className="py-2.5 bg-zinc-800 border border-white/5 rounded-lg text-[10px] font-black text-zinc-500 hover:text-white hover:border-pulse-500 transition-all"
                                    >
                                        T-{i}
                                    </button>
                                ))}
                                <button onClick={() => { soundService.playClick(); setShowHelp(true); }} className="py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-400 flex items-center justify-center hover:text-white transition-all"><BookOpenIcon className="w-4 h-4"/></button>
                            </div>
                        </div>

                        <button onClick={() => { soundService.playWrong(); onBackToHub(); }} className="text-zinc-600 font-bold uppercase tracking-[0.4em] text-[9px] pt-4 block w-full italic hover:text-terminal transition-colors">Abort Intercept</button>
                    </div>
                </div>
                {showHelp && <TacticalManual onClose={() => setShowHelp(false)} />}
            </div>
        );
    }

    const activeWord = archiveMap[activeSector]?.word || FALLBACK_WORD;

    return (
        <main className="w-full h-full bg-zinc-950 flex flex-col items-center p-4 overflow-y-auto scrollbar-hide font-mono">
            <style>{`
                @keyframes flip { 0% { transform: rotateX(0); } 45% { transform: rotateX(90deg); } 55% { transform: rotateX(90deg); } 100% { transform: rotateX(0); } }
                @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
                .bit-2 { background-color: #10b981; border-color: #10b981; color: black; }
                .bit-1 { background-color: #ec4899; border-color: #ec4899; color: white; }
                .bit-0 { background-color: #18181b; border-color: #27272a; color: #52525b; }
                .animate-flip { animation: flip 0.6s ease-in-out forwards; }
                .animate-shake { animation: shake 0.4s ease-in-out; }
            `}</style>

            <header className="w-full max-w-lg flex justify-between items-center mb-8 bg-zinc-900/50 p-4 rounded-3xl border border-white/5 shrink-0 mt-[var(--safe-top)]">
                <button onClick={() => { soundService.playWrong(); onBackToHub(); }} className="p-2 bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all active:scale-95"><XIcon className="w-6 h-6"/></button>
                <div className="text-center">
                    <span className="text-[10px] font-black uppercase text-pulse-500 tracking-[0.3em] italic">Sector: {archiveMap[activeSector]?.label || 'TODAY'}</span>
                    <h1 className="text-2xl font-black italic uppercase text-white tracking-tighter leading-none">CIPHER CORE</h1>
                </div>
                <button onClick={() => { soundService.playClick(); setShowHelp(true); }} className="p-2 bg-zinc-800 rounded-xl text-zinc-400 hover:text-pulse-500 transition-all"><BookOpenIcon className="w-6 h-6"/></button>
            </header>

            <div className="flex flex-col items-center w-full max-w-lg pb-32">
                <div className="grid grid-rows-6 gap-2 mb-10">
                    {[...Array(MAX_ATTEMPTS)].map((_, r) => {
                        const guess = guesses[r] || (r === guesses.length ? currentGuess : "");
                        const isDone = r < guesses.length;
                        return (
                            <div key={r} className={`flex gap-2 ${shakeRow === r ? 'animate-shake' : ''}`}>
                                {[...Array(5)].map((_, c) => {
                                    const char = guess[c] || "";
                                    let cls = "border-zinc-800 bg-zinc-900/40 text-white";
                                    if (isDone) cls = `bit-${getStatus(guess, c, activeWord)} animate-flip`;
                                    else if (char) cls = "border-zinc-500 text-white scale-105 shadow-[0_0_15px_rgba(255,255,255,0.1)]";
                                    return <div key={c} className={`w-14 h-14 md:w-16 md:h-16 border-2 flex items-center justify-center text-2xl md:text-3xl font-black rounded-xl transition-all duration-300 ${cls}`} style={{ animationDelay: `${c * 100}ms` }}>{char}</div>;
                                })}
                            </div>
                        );
                    })}
                </div>

                {gameState === 'playing' ? (
                    <div className="w-full space-y-2 max-w-md">
                        {[
                            ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
                            ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
                            ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL']
                        ].map((row, i) => (
                            <div key={i} className="flex justify-center gap-1.5">
                                {row.map(k => (
                                    <button key={k} onClick={() => handleKey(k === 'DEL' ? 'BACKSPACE' : k)} className={`${k.length > 1 ? 'px-4 text-[10px]' : 'w-9 text-sm'} h-12 rounded-lg bg-zinc-800 text-zinc-300 font-black active:scale-90 transition-all border border-white/5 active:bg-zinc-700`}>{k}</button>
                                ))}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="w-full max-sm bg-zinc-900 p-8 rounded-[3rem] border-4 border-pulse-500 text-center animate-fade-in shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 pointer-events-none opacity-5 cctv-overlay" />
                        <div className="relative z-10">
                            <h2 className={`text-4xl font-black italic uppercase mb-6 ${gameState === 'won' ? 'text-emerald-500' : 'text-red-500'}`}>{gameState === 'won' ? 'DECODED' : 'SIG_LOSS'}</h2>
                            
                            {(gameState === 'lost' || gameState === 'won') && (
                                <div className="mb-8 p-6 bg-black/60 border border-white/5 rounded-2xl text-left">
                                    <p className="text-[10px] text-zinc-500 font-black uppercase mb-1">Final Result String</p>
                                    <p className="text-3xl font-black text-white italic tracking-widest uppercase mb-4">{activeWord}</p>
                                    <button 
                                        onClick={handleTransmitLog}
                                        className="w-full py-3 bg-white text-black font-black uppercase italic text-[10px] tracking-widest rounded-lg transition-all hover:bg-emerald-500 hover:text-white"
                                    >
                                        {showCopySuccess ? "PACKET_CLONED" : "TRANSMIT_GRID_LOG"}
                                    </button>
                                </div>
                            )}
                            
                            {gameState === 'won' && !isPosted && (
                                <div className="space-y-4 mb-4">
                                    <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest italic">Set Signal Identity</p>
                                    <input autoFocus maxLength={3} value={initials} onChange={e => setInitials(e.target.value.toUpperCase())} className="bg-black/50 border-2 border-emerald-500 text-white rounded-xl px-4 py-3 text-center text-2xl font-black w-32 outline-none uppercase italic" placeholder="???" />
                                    <button onClick={handleSaveScore} className="w-full py-5 bg-emerald-600 text-white font-black text-lg italic uppercase rounded-full shadow-xl hover:bg-emerald-500 transition-colors">Post Records</button>
                                </div>
                            )}
                            <button onClick={() => { soundService.playClick(); onBackToHub(); }} className="w-full py-4 bg-zinc-800 text-zinc-400 font-black uppercase text-[10px] tracking-widest rounded-full hover:text-white border border-white/5 transition-colors active:scale-95">Return_to_Core</button>
                        </div>
                    </div>
                )}
            </div>
            {showHelp && <TacticalManual onClose={() => { soundService.playClick(); setShowHelp(false); }} />}
        </main>
    );
};

const TacticalManual: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-10 font-mono" onClick={onClose}>
        <div className="max-w-xl w-full bg-zinc-900 border-4 border-pulse-500 rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh] pt-[var(--safe-top)] pb-[var(--safe-bottom)]" onClick={e => e.stopPropagation()}>
            <header className="h-12 bg-pulse-600 flex items-center justify-between px-4 border-b-2 border-black shrink-0">
                <div className="flex items-center gap-2 h-full">
                    <BookOpenIcon className="w-4 h-4 text-black" />
                    <h2 className="text-white text-[10px] font-black uppercase tracking-[0.2em] italic">DECRYPTION_MANUAL.PDF</h2>
                </div>
                <button onClick={onClose} className="hover:scale-110 transition-transform"><XIcon className="w-5 h-5 text-black"/></button>
            </header>
            <div className="p-8 md:p-12 overflow-y-auto bg-void-950/40 relative flex-grow scrollbar-hide">
                <div className="absolute inset-0 pointer-events-none opacity-5 cctv-overlay" />
                <section className="space-y-8 relative z-10">
                    <div>
                        <h3 className="text-lg font-black text-white italic uppercase tracking-tighter mb-4 flex items-center gap-3"><SparklesIcon className="w-5 h-5 text-emerald-500"/> Frequency Intercept</h3>
                        <p className="text-[10px] text-zinc-400 uppercase font-black leading-relaxed tracking-wider border-l-2 border-pulse-500 pl-4">To stabilize the core, you must identify the 5-bit sequence. The system interrogates ScreenRant archive nodes to verify global consistency.</p>
                    </div>
                    <div className="space-y-6">
                        <ManualPoint title="0x01_Logic_Protocol" desc="Only valid English 5-letter words will be processed. Binary noise or fragmented strings will result in a bit mismatch error." />
                        <ManualPoint title="0x02_Color_Heuristics" desc="GREEN: Bit confirmed in correct node. PINK: Bit present but displaced. DARK: Frequency is absent from current transmission packet." />
                        <ManualPoint title="0x03_The_Log_Transmission" desc="Successfully decoded sequences can be transmitted as a color-grid log (emoji) to your social network buffers." />
                    </div>
                    <div className="p-5 bg-pulse-500/10 border-2 border-pulse-500/30 rounded-2xl flex items-start gap-4 animate-pulse">
                        <ExclamationTriangleIcon className="w-6 h-6 text-pulse-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[9px] font-black text-pulse-500 uppercase italic mb-1">Warning: System Isolation</p>
                            <p className="text-[8px] text-zinc-500 uppercase font-bold leading-tight italic">Exceeding 6 logic faults will trigger a buffer lock. Verify your input before committing the frequency string.</p>
                        </div>
                    </div>
                </section>
            </div>
            <footer className="p-4 bg-zinc-300 border-t-2 border-black shrink-0">
                <button onClick={onClose} className="w-full py-4 bg-pulse-600 text-white text-[10px] font-black uppercase italic shadow-lg hover:bg-pulse-500 transition-colors active:scale-95">Acknowledge Protocols</button>
            </footer>
        </div>
    </div>
);

const ManualPoint: React.FC<{ title: string; desc: string }> = ({ title, desc }) => (
    <div className="space-y-1">
        <h4 className="text-[9px] font-black text-emerald-500 uppercase tracking-widest italic">{title}</h4>
        <p className="text-[10px] text-zinc-300 font-bold uppercase leading-relaxed pl-3 border-l border-zinc-800">{desc}</p>
    </div>
);

export default CipherCorePage;
