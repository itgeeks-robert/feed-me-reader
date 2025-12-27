
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { XIcon, ArrowPathIcon, SeymourIcon, SparklesIcon } from './icons';
import { saveHighScore, getHighScores, HighScoreEntry } from '../services/highScoresService';
import HighScoreTable from './HighScoreTable';

const WORDS = [
    "PLANT", "SPORE", "GREEN", "BLOOM", "FLESH", "ROOTS", "VINES", "PETAL", "STALK", "GRASS",
    "JUNGLE", "FIELD", "SMELL", "WATER", "EARTH", "GENES", "TOXIC", "SEEDS", "FRUIT", "MOWER",
    "LIGHT", "CREEP", "GROWTH", "SPOUT", "DECAY", "SHADE", "SWAMP", "SNAKE", "BERRY", "BLADE",
    "HEDGE", "SHRUB", "MOSSES", "GRAIN", "THORN", "BOUGH", "WOODS", "ORGAN", "BLOOD", "ALIVE",
    "ALGAE", "FUNGI", "YEAST", "FERNS", "MAPLE", "CEDAR", "BIRCH", "BEECH", "PINES", "DRUID",
    "BREAD", "FLOUR", "SPICE", "SALTY", "SWEET", "BITTER", "SOURY", "FRESH", "TASTE", "SMELL",
    "NIGHT", "DARKS", "NEONS", "URBAN", "ALLEY", "METAL", "GLASS", "STONE", "BRICK", "DIRTY",
    "CLEAR", "CLEAN", "STORM", "RAINY", "WINDY", "SUNNY", "CLOUD", "GHOST", "DEADS", "SKULL"
].map(w => w.toUpperCase().slice(0, 5));

interface SporeCryptProps {
    onBackToHub: () => void;
    fertilizer?: number;
    setFertilizer?: (v: number) => void;
}

const SporeCryptPage: React.FC<SporeCryptProps> = ({ onBackToHub, fertilizer = 0, setFertilizer }) => {
    const [solution, setSolution] = useState("");
    const [guesses, setGuesses] = useState<string[]>([]);
    const [currentGuess, setCurrentGuess] = useState("");
    const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
    const [isPosted, setIsPosted] = useState(false);
    const [initials, setInitials] = useState("");
    const [shakeRow, setShakeRow] = useState<number | null>(null);
    const [highScores, setHighScores] = useState<HighScoreEntry[]>([]);
    const [showCopySuccess, setShowCopySuccess] = useState(false);

    const daysSinceEpoch = useMemo(() => {
        const startOfEpoch = new Date(0).getTime();
        return Math.floor((new Date().getTime() - startOfEpoch) / (1000 * 60 * 60 * 24));
    }, []);

    useEffect(() => {
        const wordIndex = daysSinceEpoch % WORDS.length;
        setSolution(WORDS[wordIndex]);
        
        const saved = localStorage.getItem(`spore_crypt_${daysSinceEpoch}`);
        if (saved) {
            const data = JSON.parse(saved);
            setGuesses(data.guesses || []);
            setGameState(data.gameState || 'playing');
            setIsPosted(!!data.isPosted);
        }
        setHighScores(getHighScores('spore_crypt'));
    }, [daysSinceEpoch]);

    const saveProgress = useCallback((newGuesses: string[], newState: 'playing' | 'won' | 'lost', posted: boolean = false) => {
        localStorage.setItem(`spore_crypt_${daysSinceEpoch}`, JSON.stringify({
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
        
        const sporeGrid = guesses.map(guess => 
            Array.from({ length: 5 }, (_, i) => getStatus(guess, i, solution))
        );

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
        if (fertilizer >= 50 && setFertilizer) {
            setFertilizer(fertilizer - 50);
            // Logic to restore streak would normally live in a global stats manager,
            // here we simulate a "success" state for visual feedback.
            alert("Streak Bio-Restored! (50 Fertilizer consumed)");
        }
    };

    const shareResults = () => {
        const grid = guesses.map(guess => {
            return Array.from({ length: 5 }, (_, i) => {
                const s = getStatus(guess, i, solution);
                return s === 2 ? '🟩' : s === 1 ? '🟪' : '⬛';
            }).join('');
        }).join('\n');
        
        const text = `SPORE CRYPT Day ${daysSinceEpoch}\n${guesses.length}/6\n\n${grid}\n\nFeed Seymour! 🌱`;
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
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            if (gameState !== 'playing') return;
            onKey(e.key.toUpperCase());
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onKey, gameState]);

    const getStatusText = (guess: string, index: number) => {
        const status = getStatus(guess, index, solution);
        if (status === 2) return 'correct';
        if (status === 1) return 'present';
        return 'absent';
    };

    const getUsedKeyStatus = (key: string) => {
        let status = 'unused';
        for (const guess of guesses) {
            for (let i = 0; i < 5; i++) {
                if (guess[i] === key) {
                    if (solution[i] === key) return 'correct';
                    if (status !== 'correct') status = 'present';
                }
            }
            if (status === 'unused' && guess.includes(key)) status = 'absent';
        }
        return status;
    };

    const FinalRecapGrid = () => (
        <div className="flex flex-col gap-2 p-4 bg-black/40 rounded-3xl border-2 border-white/5 mb-6">
            {guesses.map((guess, i) => (
                <div key={i} className="flex gap-2 justify-center">
                    {Array.from({ length: 5 }).map((_, j) => {
                        const status = getStatus(guess, j, solution);
                        let color = "bg-zinc-800";
                        if (status === 2) color = "bg-plant-500";
                        else if (status === 1) color = "bg-flesh-500";
                        return <div key={j} className={`w-8 h-8 rounded-lg ${color} shadow-sm border border-white/5`} />;
                    })}
                </div>
            ))}
        </div>
    );

    return (
        <main className="w-full h-full bg-zinc-950 flex flex-col items-center p-4 overflow-y-auto scrollbar-hide">
            <style>{`
                @keyframes flip {
                    0% { transform: rotateX(0); }
                    45% { transform: rotateX(90deg); }
                    55% { transform: rotateX(90deg); }
                    100% { transform: rotateX(0); }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    20%, 60% { transform: translateX(-5px); }
                    40%, 80% { transform: translateX(5px); }
                }
                .cell-correct { background-color: #22c55e; border-color: #22c55e; color: black; }
                .cell-present { background-color: #ec4899; border-color: #ec4899; color: white; }
                .cell-absent { background-color: #3f3f46; border-color: #3f3f46; color: #a1a1aa; }
                .animate-flip { animation: flip 0.6s ease-in-out forwards; }
                .animate-shake { animation: shake 0.4s ease-in-out; }
            `}</style>

            <header className="w-full max-w-lg flex justify-between items-center mb-8 bg-zinc-900/50 p-4 rounded-3xl border border-white/5 flex-shrink-0">
                <button onClick={onBackToHub} className="p-2 bg-zinc-800 rounded-xl text-zinc-400 hover:text-flesh-500 transition-colors">
                    <XIcon className="w-6 h-6" />
                </button>
                <div className="text-center">
                    <span className="text-[10px] font-black uppercase text-plant-500 tracking-[0.3em]">Genetic Sequence</span>
                    <h1 className="text-2xl font-black italic uppercase text-white tracking-tighter leading-none">SPORE CRYPT</h1>
                </div>
                <button onClick={() => { localStorage.removeItem(`spore_crypt_${daysSinceEpoch}`); window.location.reload(); }} className="p-2 bg-zinc-800 rounded-xl text-zinc-400 hover:text-plant-500 transition-colors">
                    <ArrowPathIcon className="w-5 h-5" />
                </button>
            </header>

            <div className="flex flex-col lg:flex-row gap-8 items-start justify-center w-full max-w-6xl pb-20">
                <div className="flex-shrink-0 mx-auto lg:mx-0 w-full max-w-[320px] space-y-6">
                    <HighScoreTable entries={highScores} title="SEQUENCE" />
                    {fertilizer >= 50 && (
                        <button 
                            onClick={handleBuyBack}
                            className="w-full p-4 bg-plant-950/40 border-2 border-plant-500/30 rounded-2xl flex items-center gap-3 group hover:border-plant-500 transition-all"
                        >
                            <SparklesIcon className="w-8 h-8 text-plant-500 animate-pulse" />
                            <div className="text-left">
                                <p className="text-[10px] font-black text-white uppercase italic">Streak Bio-Restore</p>
                                <p className="text-[9px] font-bold text-plant-500 uppercase tracking-widest">Cost: 50 Fertilizer</p>
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
                                    const isShaking = shakeRow === i;

                                    return (
                                        <div key={i} className={`flex gap-2 ${isShaking ? 'animate-shake' : ''}`}>
                                            {[...Array(5)].map((_, j) => {
                                                const letter = guess[j] || "";
                                                let statusClass = "border-zinc-800 bg-zinc-900/40 text-white";
                                                if (isSubmitted) {
                                                    const status = getStatusText(guess, j);
                                                    statusClass = status === 'correct' ? 'cell-correct' : status === 'present' ? 'cell-present' : 'cell-absent';
                                                } else if (letter) {
                                                    statusClass = "border-zinc-500 text-white scale-105";
                                                }

                                                return (
                                                    <div key={j} className={`w-14 h-14 md:w-16 md:h-16 border-2 flex items-center justify-center text-2xl md:text-3xl font-black rounded-xl transition-all duration-300 ${statusClass} ${isSubmitted ? 'animate-flip' : ''}`} style={{ animationDelay: `${j * 100}ms` }}>
                                                        {letter}
                                                    </div>
                                                );
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
                                            const status = getUsedKeyStatus(key);
                                            const isAction = key.length > 1;
                                            let keyClass = "bg-zinc-800 text-zinc-300";
                                            if (status === 'correct') keyClass = "bg-plant-600 text-black";
                                            else if (status === 'present') keyClass = "bg-flesh-600 text-white";
                                            else if (status === 'absent') keyClass = "bg-zinc-900 text-zinc-700";

                                            return (
                                                <button
                                                    key={key}
                                                    onClick={() => onKey(key)}
                                                    className={`${isAction ? 'px-3 md:px-5 text-[10px]' : 'w-8 md:w-12 text-sm'} h-12 rounded-lg font-black uppercase transition-all active:scale-90 ${keyClass}`}
                                                >
                                                    {key === 'BACKSPACE' ? '⌫' : key}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="w-full max-w-sm bg-zinc-900 p-8 rounded-[3.5rem] border-4 border-plant-500/30 text-center shadow-[0_0_80px_rgba(34,197,94,0.15)] animate-fade-in relative overflow-hidden">
                            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/leaves.png')]"></div>
                            
                            <div className="relative z-10">
                                <div className="mb-4 p-3 bg-plant-500 rounded-full w-16 h-16 mx-auto flex items-center justify-center shadow-lg">
                                    <SeymourIcon className="w-10 h-10 text-black" />
                                </div>
                                
                                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.4em] mb-1">Daily Sequence Status</p>
                                <h2 className={`text-4xl font-black italic uppercase tracking-tighter mb-6 ${gameState === 'won' ? 'text-plant-500' : 'text-flesh-500'}`}>
                                    {gameState === 'won' ? 'DECODED' : 'WILTED'}
                                </h2>
                                
                                <FinalRecapGrid />

                                <div className="mb-8 space-y-4">
                                    <button 
                                        onClick={shareResults}
                                        className="w-full py-3 bg-zinc-800 text-zinc-300 font-black text-xs uppercase rounded-full border border-white/10 hover:text-plant-500 hover:border-plant-500/50 transition-all flex items-center justify-center gap-2"
                                    >
                                        {showCopySuccess ? "DNA COPIED!" : "GENERATE FEEDING REPORT"}
                                    </button>

                                    {gameState === 'won' && !isPosted && (
                                        <>
                                            <div className="pt-2">
                                                <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-4 text-center">Enter Arcade Initials</p>
                                                <div className="flex justify-center mb-6">
                                                    <input 
                                                        autoFocus
                                                        maxLength={3} 
                                                        value={initials} 
                                                        onChange={e => setInitials(e.target.value.toUpperCase())}
                                                        className="bg-black/50 border-2 border-plant-500 text-plant-500 rounded-xl px-4 py-3 text-center text-2xl font-black w-32 outline-none uppercase italic shadow-inner"
                                                        placeholder="???"
                                                    />
                                                </div>
                                                <button onClick={handleSaveScore} className="w-full py-4 bg-plant-600 text-black font-black text-lg italic uppercase rounded-full hover:scale-105 transition-transform shadow-xl hover:bg-plant-500">Post Records</button>
                                            </div>
                                        </>
                                    )}
                                    {isPosted && (
                                        <div className="py-2">
                                            <p className="text-zinc-400 font-bold uppercase tracking-widest text-[9px] mb-1">DNA Pattern Stored</p>
                                            <p className="text-plant-400 font-black text-3xl italic tracking-tighter">{guesses.length}/6</p>
                                        </div>
                                    )}
                                </div>
                                
                                {gameState === 'lost' && (
                                    <div className="mb-8">
                                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-2">The DNA pattern was:</p>
                                        <p className="text-3xl font-black text-white italic uppercase tracking-[0.2em] mb-4 drop-shadow-md">{solution}</p>
                                    </div>
                                )}
                                
                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <button onClick={onBackToHub} className="w-full py-3 bg-zinc-800 text-zinc-400 hover:text-white font-black text-xs uppercase rounded-full transition-colors border border-white/5">Back to Feed Pit</button>
                                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.3em]">Next culture growing in 24h</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};

export default SporeCryptPage;
