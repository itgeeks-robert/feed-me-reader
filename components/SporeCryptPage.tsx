
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { XIcon, ArrowPathIcon, VoidIcon, SparklesIcon } from './icons';
import { saveHighScore, getHighScores, HighScoreEntry } from '../services/highScoresService';
import HighScoreTable from './HighScoreTable';

const WORDS = [
    "NODES", "VOIDS", "CORES", "BYTES", "CHIPS", "LINKS", "FILES", "USERS", "ROOTS", "CODES",
    "FAILS", "SYNCS", "WAVES", "GRIDS", "PORTS", "HOSTS", "NULLS", "PINGS", "TASKS", "DUMPS",
    "LOGIC", "ARRAY", "STACK", "SHIFT", "TRACE", "RECON", "PROBE", "CYBER", "INPUT", "PHASE",
    "DEATH", "BURST", "FRAME", "POINT", "BREAK", "WATCH", "ALARM", "CLOCK", "RESET", "CLEAR",
    "PULSE", "NEONS", "URBAN", "ALLEY", "METAL", "GLASS", "STONE", "BRICK", "DIRTY", "CLEAN"
].map(w => w.toUpperCase());

interface CipherCoreProps {
    onBackToHub: () => void;
    uptime?: number;
    setUptime?: (v: number) => void;
}

const CipherCorePage: React.FC<CipherCoreProps> = ({ onBackToHub, uptime = 0, setUptime }) => {
    const [solution, setSolution] = useState("");
    const [guesses, setGuesses] = useState<string[]>([]);
    const [currentGuess, setCurrentGuess] = useState("");
    const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
    const [isPosted, setIsPosted] = useState(false);
    const [initials, setInitials] = useState("");
    const [shakeRow, setShakeRow] = useState<number | null>(null);
    const [highScores, setHighScores] = useState<HighScoreEntry[]>([]);
    const [showCopySuccess, setShowCopySuccess] = useState(false);

    const daysSinceEpoch = useMemo(() => Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24)), []);

    useEffect(() => {
        const wordIndex = daysSinceEpoch % WORDS.length;
        setSolution(WORDS[wordIndex]);
        const saved = localStorage.getItem(`cipher_core_${daysSinceEpoch}`);
        if (saved) {
            const data = JSON.parse(saved);
            setGuesses(data.guesses || []);
            setGameState(data.gameState || 'playing');
            setIsPosted(!!data.isPosted);
        }
        setHighScores(getHighScores('spore_crypt'));
    }, [daysSinceEpoch]);

    const saveProgress = useCallback((newGuesses: string[], newState: 'playing' | 'won' | 'lost', posted: boolean = false) => {
        localStorage.setItem(`cipher_core_${daysSinceEpoch}`, JSON.stringify({
            guesses: newGuesses,
            gameState: newState,
            isPosted: posted
        }));
    }, [daysSinceEpoch]);

    const getStatus = useCallback((guess: string, index: number, sol: string) => {
        const letter = guess[index];
        if (sol[index] === letter) return 2; // Correct
        if (sol.includes(letter)) return 1; // Present
        return 0; // Absent
    }, []);

    const handleSaveScore = () => {
        if (isPosted) return;
        const sporeGrid = guesses.map(guess => Array.from({ length: 5 }, (_, i) => getStatus(guess, i, solution)));
        saveHighScore('spore_crypt', {
            name: initials.toUpperCase() || "???",
            score: guesses.length,
            displayValue: `${guesses.length} TRIES`,
            date: new Date().toISOString(),
            metadata: { sporeGrid }
        }, true);
        setIsPosted(true);
        setHighScores(getHighScores('spore_crypt'));
        saveProgress(guesses, gameState, true);
    };

    const handleBuyBack = () => {
        if (uptime >= 50 && setUptime) {
            setUptime(uptime - 50);
            alert("Signal Sequence Restored! (50 Uptime consumed)");
        }
    };

    const shareResults = () => {
        const grid = guesses.map(guess => Array.from({ length: 5 }, (_, i) => {
                const s = getStatus(guess, i, solution);
                return s === 2 ? '🟩' : s === 1 ? '🟪' : '⬛';
            }).join('')).join('\n');
        const text = `CIPHER CORE Sector ${daysSinceEpoch}\n${guesses.length}/6\n\n${grid}\n\n[LINK ESTABLISHED]`;
        navigator.clipboard.writeText(text);
        setShowCopySuccess(true);
        setTimeout(() => setShowCopySuccess(false), 2000);
    };

    const onKey = useCallback((key: string) => {
        if (gameState !== 'playing') return;
        if (key === 'ENTER') {
            if (currentGuess.length !== 5) {
                setShakeRow(guesses.length);
                setTimeout(() => setShakeRow(null), 500);
                return;
            }
            const newGuesses = [...guesses, currentGuess];
            let newState: 'playing' | 'won' | 'lost' = 'playing';
            if (currentGuess === solution) newState = 'won';
            else if (newGuesses.length >= 6) newState = 'lost';
            setGuesses(newGuesses);
            setCurrentGuess("");
            setGameState(newState);
            saveProgress(newGuesses, newState, false);
        } else if (key === 'BACKSPACE' || key === 'DELETE') {
            setCurrentGuess(prev => prev.slice(0, -1));
        } else if (/^[A-Z]$/.test(key) && currentGuess.length < 5) {
            setCurrentGuess(prev => prev + key);
        }
    }, [currentGuess, gameState, guesses, solution, saveProgress]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey || e.altKey || gameState !== 'playing') return;
            onKey(e.key.toUpperCase());
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onKey, gameState]);

    return (
        <main className="w-full h-full bg-zinc-950 flex flex-col items-center p-4 overflow-y-auto scrollbar-hide">
            <style>{`
                @keyframes flip { 0% { transform: rotateX(0); } 45% { transform: rotateX(90deg); } 55% { transform: rotateX(90deg); } 100% { transform: rotateX(0); } }
                @keyframes shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-5px); } 40%, 80% { transform: translateX(5px); } }
                .cell-correct { background-color: #10b981; border-color: #10b981; color: black; }
                .cell-present { background-color: #ec4899; border-color: #ec4899; color: white; }
                .cell-absent { background-color: #3f3f46; border-color: #3f3f46; color: #a1a1aa; }
                .animate-flip { animation: flip 0.6s ease-in-out forwards; }
                .animate-shake { animation: shake 0.4s ease-in-out; }
            `}</style>

            <header className="w-full max-w-lg flex justify-between items-center mb-8 bg-zinc-900/50 p-4 rounded-3xl border border-white/5 flex-shrink-0">
                <button onClick={onBackToHub} className="p-2 bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors"><XIcon className="w-6 h-6" /></button>
                <div className="text-center">
                    <span className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.3em] italic">Frequency Segment</span>
                    <h1 className="text-2xl font-black italic uppercase text-white tracking-tighter leading-none">CIPHER CORE</h1>
                </div>
                <button onClick={() => window.location.reload()} className="p-2 bg-zinc-800 rounded-xl text-zinc-400 hover:text-emerald-500 transition-colors"><ArrowPathIcon className="w-5 h-5" /></button>
            </header>

            <div className="flex flex-col lg:flex-row gap-8 items-start justify-center w-full max-w-6xl pb-20">
                <div className="flex-shrink-0 mx-auto lg:mx-0 w-full max-w-[320px] space-y-6">
                    <HighScoreTable entries={highScores} title="CIPHER" />
                    {uptime >= 50 && (
                        <button onClick={handleBuyBack} className="w-full p-4 bg-emerald-950/40 border-2 border-emerald-500/30 rounded-2xl flex items-center gap-3 group hover:border-emerald-500 transition-all shadow-xl">
                            <SparklesIcon className="w-8 h-8 text-emerald-500 animate-pulse" />
                            <div className="text-left">
                                <p className="text-[10px] font-black text-white uppercase italic">Sequence Restore</p>
                                <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Cost: 50 Uptime</p>
                            </div>
                        </button>
                    )}
                </div>

                <div className="flex flex-col items-center flex-grow w-full max-w-lg">
                    {gameState === 'playing' ? (
                        <>
                            <div className="grid grid-rows-6 gap-2 mb-8">
                                {[...Array(6)].map((_, i) => {
                                    const guess = guesses[i] || (i === guesses.length ? currentGuess : "");
                                    const isSubmitted = i < guesses.length;
                                    return (
                                        <div key={i} className={`flex gap-2 ${shakeRow === i ? 'animate-shake' : ''}`}>
                                            {[...Array(5)].map((_, j) => {
                                                const letter = guess[j] || "";
                                                let statusClass = "border-zinc-800 bg-zinc-900/40 text-white";
                                                if (isSubmitted) {
                                                    const s = getStatus(guess, j, solution);
                                                    statusClass = s === 2 ? 'cell-correct' : s === 1 ? 'cell-present' : 'cell-absent';
                                                } else if (letter) statusClass = "border-zinc-500 text-white scale-105";
                                                return <div key={j} className={`w-14 h-14 md:w-16 md:h-16 border-2 flex items-center justify-center text-2xl md:text-3xl font-black rounded-xl transition-all duration-300 ${statusClass} ${isSubmitted ? 'animate-flip' : ''}`} style={{ animationDelay: `${j * 100}ms` }}>{letter}</div>;
                                            })}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="w-full space-y-2">
                                {[
                                    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
                                    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
                                    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
                                ].map((row, i) => (
                                    <div key={i} className="flex justify-center gap-1.5">
                                        {row.map(key => {
                                            const isAction = key.length > 1;
                                            return (
                                                <button key={key} onClick={() => onKey(key)} className={`${isAction ? 'px-3 md:px-5 text-[10px]' : 'w-8 md:w-12 text-sm'} h-12 rounded-lg font-black uppercase transition-all active:scale-90 bg-zinc-800 text-zinc-300 shadow-md`}>
                                                    {key === 'BACKSPACE' ? '⌫' : key}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="w-full max-w-sm bg-zinc-900 p-8 rounded-[3.5rem] border-4 border-emerald-500/30 text-center shadow-[0_0_80px_rgba(16,185,129,0.15)] animate-fade-in relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-full w-16 h-16 mx-auto flex items-center justify-center shadow-lg animate-pulse"><VoidIcon className="w-10 h-10 text-emerald-500" /></div>
                                <h2 className={`text-4xl font-black italic uppercase tracking-tighter mb-6 ${gameState === 'won' ? 'text-emerald-500' : 'text-pulse-500'}`}>{gameState === 'won' ? 'DECODED' : 'SEQUENCE FAILED'}</h2>
                                <button onClick={shareResults} className="w-full py-3 bg-zinc-800 text-zinc-300 font-black text-[10px] uppercase tracking-widest rounded-full border border-white/10 hover:text-emerald-500 mb-4 transition-all">{showCopySuccess ? "LOG CLONED!" : "TRANSMIT LOG"}</button>
                                {gameState === 'won' && !isPosted && (
                                    <div className="pt-2">
                                        <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mb-3 italic">Set Signal Identity</p>
                                        <input autoFocus maxLength={3} value={initials} onChange={e => setInitials(e.target.value.toUpperCase())} className="bg-black/50 border-2 border-emerald-500 text-white rounded-xl px-4 py-3 text-center text-2xl font-black w-32 outline-none uppercase italic mb-4" placeholder="???" />
                                        <button onClick={handleSaveScore} className="w-full py-4 bg-emerald-600 text-white font-black text-lg italic uppercase rounded-full shadow-xl">Post Records</button>
                                    </div>
                                )}
                                <button onClick={onBackToHub} className="w-full py-3 bg-zinc-800 text-zinc-400 hover:text-white font-black text-[10px] uppercase tracking-widest rounded-full transition-colors border border-white/5 mt-4">Back to Hub</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};

export default CipherCorePage;
