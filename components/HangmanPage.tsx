
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { XIcon, RadioIcon, BoltIcon, SparklesIcon, VoidIcon, ShieldCheckIcon } from './icons';
import { HANGMAN_DATA, HangmanWord } from '../services/hangmanData';
import { saveHighScore, getHighScores } from '../services/highScoresService';

const MAX_MISTAKES = 7;
const INITIAL_TIME = 240;

type GameMode = 'SOLO' | 'VERSUS';
type GameState = 'LOBBY' | 'SETTING_WORD' | 'PLAYING' | 'WON' | 'LOST';

const MassiveShockOverlay: React.FC<{ active: boolean }> = ({ active }) => {
    if (!active) return null;
    return (
        <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden animate-[pulse_0.1s_infinite]">
            <div className="absolute inset-0 bg-white mix-blend-overlay opacity-30" />
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full fill-none stroke-cyan-400 stroke-[5] opacity-80">
                <path d="M0,50 L10,20 L25,80 L40,10 L60,90 L80,30 L100,50" className="animate-massive-arc" />
                <path d="M0,30 L20,70 L45,10 L70,80 L90,20 L100,60" className="animate-massive-arc-delayed" />
            </svg>
            <style>{`
                @keyframes massive-arc { 0% { opacity: 0; stroke-dashoffset: 1000; } 50% { opacity: 1; } 100% { opacity: 0; stroke-dashoffset: 0; } }
                .animate-massive-arc { stroke-dasharray: 1000; animation: massive-arc 0.2s linear infinite; }
                .animate-massive-arc-delayed { stroke-dasharray: 1000; animation: massive-arc 0.2s linear infinite 0.1s; }
            `}</style>
        </div>
    );
};

const SingularityCoreVisual: React.FC<{ mistakes: number; isShaking: boolean }> = ({ mistakes, isShaking }) => {
    const intensity = (mistakes / MAX_MISTAKES);
    const glowColor = mistakes > 5 ? '#e11d48' : mistakes > 3 ? '#fbbf24' : '#22d3ee';
    
    return (
        <div className={`relative w-72 h-72 mx-auto flex items-center justify-center transition-all duration-75 ${isShaking ? 'translate-x-2 translate-y-[-2px] scale-110' : ''}`}>
            {/* Energy Swirls */}
            <div className={`absolute inset-0 rounded-full border-4 border-dashed border-white/5 animate-[spin_10s_linear_infinite] ${intensity > 0.5 ? 'opacity-40' : 'opacity-10'}`} />
            <div className={`absolute inset-8 rounded-full border-2 border-white/10 animate-[spin_6s_linear_infinite_reverse] ${intensity > 0.7 ? 'opacity-60' : 'opacity-20'}`} />

            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                {/* The Core Octahedron */}
                <g className={`${intensity > 0.8 ? 'animate-bounce' : 'animate-[pulse_2s_infinite]'}`}>
                    <path 
                        d="M100,40 L160,100 L100,160 L40,100 Z" 
                        fill="none" 
                        stroke={glowColor} 
                        strokeWidth="2" 
                        className="transition-colors duration-500"
                    />
                    <path d="M100,40 L100,160 M40,100 L160,100" stroke={glowColor} strokeWidth="1" opacity="0.4" />
                    <circle cx="100" cy="100" r={20 + (intensity * 40)} fill={glowColor} className="opacity-20 transition-all duration-500" />
                    <circle cx="100" cy="100" r={10} fill="white" className="shadow-[0_0_15px_white]" />
                </g>

                {/* Arcing Voltage Lines */}
                {[...Array(mistakes)].map((_, i) => (
                    <line 
                        key={i} 
                        x1="100" y1="100" 
                        x2={100 + Math.cos(i) * 90} y2={100 + Math.sin(i) * 90} 
                        stroke={glowColor} 
                        strokeWidth="2" 
                        className="animate-pulse opacity-60" 
                    />
                ))}
            </svg>
            
            {/* Ground Technician */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="w-8 h-12 bg-zinc-900 border border-white/20 rounded-t-lg relative">
                    <div className={`absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-zinc-900 border border-white/20 ${isShaking ? 'animate-bounce' : ''}`} />
                </div>
                <div className="text-[6px] font-black text-zinc-600 uppercase tracking-widest mt-1 italic">ENG_NODE_07</div>
            </div>
        </div>
    );
};

const HangmanPage: React.FC<{ onBackToHub: () => void }> = ({ onBackToHub }) => {
    const [gameState, setGameState] = useState<GameState>('LOBBY');
    const [mode, setMode] = useState<GameMode>('SOLO');
    const [level, setLevel] = useState(1);
    const [target, setTarget] = useState<HangmanWord | null>(null);
    const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
    const [mistakes, setMistakes] = useState(0);
    const [isShocking, setIsShocking] = useState(false);
    const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
    const [customWord, setCustomWord] = useState("");
    const [initials, setInitials] = useState("");

    const timerRef = useRef<number | null>(null);

    const startLevel = useCallback((lvl: number) => {
        const difficulty = lvl <= 3 ? 1 : lvl <= 7 ? 2 : 3;
        const available = HANGMAN_DATA.filter(d => d.difficulty === difficulty);
        const random = available[Math.floor(Math.random() * available.length)];
        
        setTarget(random);
        setGuessedLetters(new Set());
        setMistakes(0);
        setTimeLeft(Math.max(20, INITIAL_TIME - (lvl * 3)));
        setGameState('PLAYING');
    }, []);

    const triggerShock = () => {
        setIsShocking(true);
        setTimeout(() => setIsShocking(false), 250);
    };

    const handleGuess = useCallback((letter: string) => {
        if (gameState !== 'PLAYING' || !target || guessedLetters.has(letter)) return;

        const newGuessed = new Set(guessedLetters);
        newGuessed.add(letter);
        setGuessedLetters(newGuessed);

        if (!target.word.toUpperCase().includes(letter)) {
            triggerShock();
            const newMistakes = mistakes + 1;
            setMistakes(newMistakes);
            if (newMistakes >= MAX_MISTAKES) setGameState('LOST');
        } else {
            const isWon = target.word.toUpperCase().split('').every(char => 
                char === ' ' || !/[A-Z]/.test(char) || newGuessed.has(char)
            );
            if (isWon) {
                setGameState('WON');
                if (mode === 'SOLO') {
                    saveHighScore('hangman' as any, { 
                        name: `LVL${level}`, 
                        score: level, 
                        displayValue: `LVL ${level}`, 
                        date: new Date().toISOString() 
                    });
                }
            }
        }
    }, [gameState, target, guessedLetters, mistakes, level, mode]);

    // Timer Effect
    useEffect(() => {
        if (gameState === 'PLAYING' && mode === 'SOLO') {
            timerRef.current = window.setInterval(() => {
                setTimeLeft(t => {
                    if (t <= 1) {
                        setGameState('LOST');
                        return 0;
                    }
                    return t - 1;
                });
            }, 1000);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [gameState, mode]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (/^[a-zA-Z]$/.test(e.key)) handleGuess(e.key.toUpperCase());
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleGuess]);

    const displayWord = useMemo(() => {
        if (!target) return "";
        return target.word.toUpperCase().split('').map(char => {
            if (char === ' ') return ' ';
            if (!/[A-Z]/.test(char)) return char;
            return guessedLetters.has(char) ? char : '_';
        }).join('');
    }, [target, guessedLetters]);

    if (gameState === 'LOBBY') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-6 font-mono overflow-y-auto scrollbar-hide">
                <div className="w-full max-w-sm text-center bg-zinc-900 p-10 rounded-[3rem] border-4 border-pulse-500 shadow-[0_0_50px_rgba(225,29,72,0.1)]">
                    <header className="mb-10">
                        <span className="text-[10px] font-black uppercase text-cyan-400 tracking-[0.3em] italic block mb-1">Containment Protocol</span>
                        <h1 className="text-4xl font-black italic uppercase text-white tracking-tighter leading-none">SIGNAL BREACH</h1>
                    </header>
                    
                    <div className="h-40 flex items-center justify-center mb-10">
                        <div className="relative p-6 bg-cyan-400/10 rounded-full animate-pulse border border-cyan-400/30">
                            <BoltIcon className="w-20 h-20 text-cyan-400" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <button 
                            onClick={() => { setMode('SOLO'); setLevel(1); startLevel(1); }} 
                            className="w-full py-5 bg-white text-black font-black uppercase italic rounded-2xl hover:scale-[1.02] transition-all shadow-[0_10px_20px_rgba(255,255,255,0.1)] active:scale-95 text-lg"
                        >
                            Solo Arcade
                        </button>
                        <button 
                            onClick={() => { setMode('VERSUS'); setGameState('SETTING_WORD'); }} 
                            className="w-full py-5 bg-zinc-800 text-cyan-400 border-2 border-cyan-400/30 font-black uppercase italic rounded-2xl hover:bg-cyan-400 hover:text-black transition-all active:scale-95"
                        >
                            Dual Link (2P)
                        </button>
                        <button onClick={onBackToHub} className="text-zinc-600 font-bold uppercase tracking-widest text-[10px] hover:text-white transition-colors pt-4 block w-full italic">Abort Mission</button>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'SETTING_WORD') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-6 font-mono">
                <div className="w-full max-w-sm bg-zinc-900 p-10 rounded-[3rem] border-4 border-cyan-400 text-center shadow-2xl">
                    <h2 className="text-2xl font-black italic text-white uppercase mb-6">Hide the Signal</h2>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-8">P1: ENTER THE TARGET DATA PACKET</p>
                    <input 
                        autoFocus
                        type="text" 
                        value={customWord} 
                        onChange={e => setCustomWord(e.target.value.toUpperCase())}
                        className="w-full bg-black/50 border-2 border-cyan-400/50 rounded-xl px-4 py-4 text-center text-xl font-black text-white outline-none focus:border-cyan-400 mb-8 uppercase italic"
                        placeholder="ENTER WORD..."
                    />
                    <button 
                        onClick={() => {
                            if (customWord.length < 2) return;
                            setTarget({ word: customWord, category: 'TECH', hint: 'Player Secret', difficulty: 2 });
                            setGuessedLetters(new Set());
                            setMistakes(0);
                            setGameState('PLAYING');
                        }}
                        className="w-full py-5 bg-cyan-400 text-black font-black uppercase italic rounded-full shadow-lg active:scale-95"
                    >
                        LOCK SIGNAL
                    </button>
                    <button onClick={() => setGameState('LOBBY')} className="mt-4 text-zinc-500 text-[10px] font-black uppercase italic">Back</button>
                </div>
            </div>
        );
    }

    return (
        <main className={`w-full h-full bg-zinc-950 flex flex-col items-center p-4 overflow-y-auto scrollbar-hide font-mono text-white transition-all duration-75 ${isShocking ? 'invert' : ''}`}>
            <MassiveShockOverlay active={isShocking} />
            
            <header className="w-full max-w-lg flex justify-between items-center mb-4 bg-zinc-900/50 p-4 rounded-3xl border border-white/5 flex-shrink-0">
                <button onClick={() => setGameState('LOBBY')} className="p-2 bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all"><XIcon className="w-6 h-6" /></button>
                <div className="text-center">
                    <span className="text-[9px] font-black uppercase text-cyan-400 tracking-[0.3em] italic">
                        {mode === 'SOLO' ? `SECTOR 0${level}` : 'DUAL LINK VS'}
                    </span>
                    <h1 className="text-xl font-black italic uppercase tracking-tighter leading-none">SIGNAL BREACH</h1>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[7px] font-black text-zinc-500 uppercase">Uptime</span>
                    <span className={`text-sm font-black font-mono ${timeLeft < 10 ? 'text-pulse-500 animate-pulse' : 'text-white'}`}>
                        {timeLeft}s
                    </span>
                </div>
            </header>

            <div className="w-full max-w-xl flex flex-col items-center gap-4 pb-20">
                <SingularityCoreVisual mistakes={mistakes} isShaking={isShocking} />
                
                <div className="text-center space-y-4">
                    <div className="inline-block px-3 py-1 bg-cyan-400/10 border border-cyan-400/30 rounded-full">
                        <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest italic leading-none">{target?.category} DATA PACKET</span>
                    </div>
                    <div className="text-3xl md:text-5xl font-black tracking-[0.3em] text-white italic transition-all duration-500 whitespace-pre-wrap leading-tight font-horror drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                        {displayWord}
                    </div>
                </div>

                {gameState === 'PLAYING' && (
                    <div className="w-full max-w-md grid grid-cols-7 md:grid-cols-9 gap-1.5 p-4 bg-void-900/40 rounded-3xl border border-white/5 backdrop-blur-sm shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-cyan-400/5 opacity-50" />
                        {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('').map(char => {
                            const isGuessed = guessedLetters.has(char);
                            const isCorrect = target?.word.toUpperCase().includes(char);
                            return (
                                <button
                                    key={char}
                                    onClick={() => handleGuess(char)}
                                    disabled={isGuessed}
                                    className={`h-10 md:h-12 relative z-10 rounded-lg font-black text-xs md:text-sm flex items-center justify-center transition-all active:scale-90
                                        ${!isGuessed 
                                            ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 shadow-md border-b-2 border-black' 
                                            : isCorrect 
                                                ? 'bg-cyan-600/20 text-cyan-400 opacity-40' 
                                                : 'bg-pulse-600/20 text-pulse-500 opacity-40'}`}
                                >
                                    {char}
                                </button>
                            );
                        })}
                    </div>
                )}

                {(gameState === 'WON' || gameState === 'LOST') && (
                    <div className="animate-fade-in w-full max-w-sm bg-zinc-900 p-8 rounded-[3.5rem] border-4 border-pulse-500 text-center shadow-[0_0_100px_rgba(0,0,0,1)] relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className={`text-3xl font-black italic uppercase tracking-tighter mb-4 ${gameState === 'WON' ? 'text-emerald-500' : 'text-pulse-500'}`}>
                                {gameState === 'WON' ? 'SIGNAL CLEAR' : 'LINK SEVERED'}
                            </h2>
                            <div className="mb-6 p-4 bg-black/40 rounded-2xl border border-white/5 text-left">
                                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1 italic">// {gameState === 'WON' ? 'Synchronized' : 'Terminated'} Packet</p>
                                <p className="text-xl font-black text-white italic tracking-widest uppercase">{target?.word}</p>
                                <p className="text-[9px] text-zinc-600 font-mono mt-2 uppercase italic">{target?.hint}</p>
                            </div>
                            
                            {gameState === 'WON' && mode === 'SOLO' ? (
                                <button onClick={() => { setLevel(l => l + 1); startLevel(level + 1); }} className="w-full py-4 bg-emerald-500 text-black font-black uppercase italic rounded-full text-sm tracking-widest hover:scale-105 transition-all shadow-xl">Advance to Sector {level + 1}</button>
                            ) : (
                                <button onClick={() => setGameState('LOBBY')} className="w-full py-4 bg-white text-black font-black uppercase italic rounded-full text-sm tracking-widest hover:bg-cyan-400 transition-all shadow-xl active:translate-y-1">Main Terminal</button>
                            )}
                        </div>
                        {gameState === 'LOST' && <div className="absolute inset-0 bg-pulse-500/10 animate-pulse" />}
                    </div>
                )}
            </div>
        </main>
    );
};

export default HangmanPage;
