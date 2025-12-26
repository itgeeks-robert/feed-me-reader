
import React, { useState, useEffect, useCallback } from 'react';
import { XIcon, ArrowPathIcon, SeymourIcon } from './icons';

// Hardcoded word list for a zero-AI, deterministic experience
const WORDS = [
    "PLANT", "SPORE", "GREEN", "BLOOM", "FLESH", "ROOTS", "VINES", "PETAL", "STALK", "GRASS",
    "JUNGLE", "FIELD", "SMELL", "WATER", "EARTH", "GENES", "TOXIC", "SEEDS", "FRUIT", "MOWER",
    "LIGHT", "CREEP", "GROWTH", "SPOUT", "DECAY", "SHADE", "SWAMP", "SNAKE", "BERRY", "BLADE",
    "HEDGE", "SHRUB", "MOSSES", "GRAIN", "THORN", "BOUGH", "WOODS", "ORGAN", "BLOOD", "ALIVE",
    "ALGAE", "FUNGI", "YEAST", "FERNS", "MAPLE", "CEDAR", "BIRCH", "BEECH", "PINES", "DRUID",
    "BREAD", "FLOUR", "SPICE", "Salty", "Sweet", "Bitter", "SourY", "Fresh", "Taste", "Smell",
    "Night", "DarkS", "NeonS", "Urban", "Alley", "Metal", "Glass", "Stone", "Brick", "Dirty",
    "Clear", "Clean", "Storm", "Rainy", "Windy", "Sunny", "Cloud", "Ghost", "DeadS", "Skull"
].map(w => w.toUpperCase().slice(0, 5));

const SporeCryptPage: React.FC<{ onBackToHub: () => void }> = ({ onBackToHub }) => {
    const [solution, setSolution] = useState("");
    const [guesses, setGuesses] = useState<string[]>([]);
    const [currentGuess, setCurrentGuess] = useState("");
    const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
    const [shakeRow, setShakeRow] = useState<number | null>(null);

    useEffect(() => {
        // Deterministic Daily Word Selection
        const startOfEpoch = new Date(0).getTime();
        const now = new Date();
        const daysSinceEpoch = Math.floor((now.getTime() - startOfEpoch) / (1000 * 60 * 60 * 24));
        const wordIndex = daysSinceEpoch % WORDS.length;
        setSolution(WORDS[wordIndex]);
        
        // Load progress for today if it exists
        const saved = localStorage.getItem(`spore_crypt_${daysSinceEpoch}`);
        if (saved) {
            const data = JSON.parse(saved);
            setGuesses(data.guesses);
            setGameState(data.gameState);
        }
    }, []);

    const saveProgress = (newGuesses: string[], newState: 'playing' | 'won' | 'lost') => {
        const startOfEpoch = new Date(0).getTime();
        const daysSinceEpoch = Math.floor((new Date().getTime() - startOfEpoch) / (1000 * 60 * 60 * 24));
        localStorage.setItem(`spore_crypt_${daysSinceEpoch}`, JSON.stringify({
            guesses: newGuesses,
            gameState: newState
        }));
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
            saveProgress(newGuesses, newState);
        } else if (key === 'BACKSPACE' || key === 'DELETE') {
            setCurrentGuess(prev => prev.slice(0, -1));
        } else if (/^[A-Z]$/.test(key) && currentGuess.length < 5) {
            setCurrentGuess(prev => prev + key);
        }
    }, [currentGuess, gameState, guesses, solution]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            onKey(e.key.toUpperCase());
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onKey]);

    const getStatus = (guess: string, index: number) => {
        const letter = guess[index];
        if (solution[index] === letter) return 'correct';
        if (solution.includes(letter)) return 'present';
        return 'absent';
    };

    const getUsedKeyStatus = (key: string) => {
        let status = 'unused';
        for (const guess of guesses) {
            for (let i = 0; i < 5; i++) {
                if (guess[i] === key) {
                    if (solution[i] === key) return 'correct';
                    status = 'present';
                }
            }
            if (status !== 'present' && guess.includes(key)) status = 'absent';
        }
        return status;
    };

    return (
        <main className="w-full h-full bg-zinc-950 flex flex-col items-center p-4 overflow-y-auto">
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

            <header className="w-full max-w-lg flex justify-between items-center mb-8 bg-zinc-900/50 p-4 rounded-3xl border border-white/5">
                <button onClick={onBackToHub} className="p-2 bg-zinc-800 rounded-xl text-zinc-400 hover:text-flesh-500 transition-colors">
                    <XIcon className="w-6 h-6" />
                </button>
                <div className="text-center">
                    <span className="text-[10px] font-black uppercase text-plant-500 tracking-[0.3em]">Genetic Sequence</span>
                    <h1 className="text-2xl font-black italic uppercase text-white tracking-tighter">SPORE CRYPT</h1>
                </div>
                <div className="w-10"></div>
            </header>

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
                                    const status = getStatus(guess, j);
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

            <div className="w-full max-w-lg space-y-2">
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

            {gameState !== 'playing' && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-6">
                    <div className="max-w-sm w-full bg-zinc-900 p-10 rounded-[3rem] border-4 border-plant-500 text-center shadow-[0_0_100px_rgba(34,197,94,0.3)]">
                        <div className="mb-6 p-4 bg-plant-500 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                            <SeymourIcon className="w-12 h-12 text-black" />
                        </div>
                        <h2 className={`text-5xl font-black italic uppercase tracking-tighter mb-2 ${gameState === 'won' ? 'text-plant-500' : 'text-flesh-500'}`}>
                            {gameState === 'won' ? 'DECODED!' : 'WILTED'}
                        </h2>
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-2">The daily spore was:</p>
                        <p className="text-3xl font-black text-white italic uppercase tracking-[0.2em] mb-8">{solution}</p>
                        <div className="flex flex-col gap-3">
                            <button onClick={onBackToHub} className="w-full py-4 bg-plant-600 text-black font-black text-lg italic uppercase rounded-full hover:scale-105 transition-transform shadow-xl">Back to Pit</button>
                            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">A NEW SPORE GROWS TOMORROW</p>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default SporeCryptPage;
