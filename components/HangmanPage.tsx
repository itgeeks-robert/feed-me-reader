
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { XIcon, RadioIcon, BoltIcon, SparklesIcon, VoidIcon, ShieldCheckIcon, GlobeAltIcon, ControllerIcon, FireIcon, CpuChipIcon } from './icons';
import { HANGMAN_DATA, HangmanWord } from '../services/hangmanData';
import { saveHighScore, getHighScores } from '../services/highScoresService';

const MAX_MISTAKES = 7;
const INITIAL_TIME = 60; 

type GameMode = 'SOLO' | 'VERSUS';
type GameState = 'LOBBY' | 'ROUND_TRANSITION' | 'PLAYING' | 'WON' | 'LOST' | 'FINAL_RESULTS';
type CategoryFilter = 'ALL' | 'FILM' | 'MUSIC' | 'SPORT' | 'TECH' | 'FASHION' | 'GAMING';

interface PlayerStats {
    score: number;
    totalTime: number;
}

const CATEGORY_MAP: Record<CategoryFilter, string[]> = {
    ALL: ['ACTOR', 'FILM', 'ARTIST', 'SONG', 'TECH', 'GAMING', 'SPORT', 'FASHION'],
    FILM: ['ACTOR', 'FILM'],
    MUSIC: ['ARTIST', 'SONG'],
    SPORT: ['SPORT'],
    TECH: ['TECH'],
    FASHION: ['FASHION'],
    GAMING: ['GAMING']
};

const KEYBOARD_ROWS = [
    ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
    ["K", "L", "M", "N", "O", "P", "Q", "R", "S"],
    ["T", "U", "V", "W", "X", "Y", "Z"]
];

const UrgencyOverlay: React.FC<{ timeLeft: number }> = ({ timeLeft }) => {
    const isCritical = timeLeft <= 10 && timeLeft > 0;
    const isWarning = timeLeft <= 20 && timeLeft > 10;
    const isPulseTime = timeLeft > 0 && timeLeft % 10 === 0 && timeLeft !== INITIAL_TIME;

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <style>{`
                @keyframes bg-shimmer-ripple {
                    0% { transform: scale(0.8); opacity: 0; }
                    50% { opacity: 0.4; }
                    100% { transform: scale(1.5); opacity: 0; }
                }
                @keyframes ghost-count {
                    0% { transform: scale(0.5); opacity: 0; filter: blur(10px); }
                    30% { opacity: 0.15; filter: blur(0px); }
                    100% { transform: scale(2); opacity: 0; filter: blur(20px); }
                }
                .shimmer-ripple {
                    position: absolute;
                    inset: -50%;
                    background: radial-gradient(circle, rgba(34,211,238,0.4) 0%, transparent 70%);
                    animation: bg-shimmer-ripple 1s ease-out forwards;
                }
            `}</style>

            {isPulseTime && <div key={`pulse-${timeLeft}`} className="shimmer-ripple" />}
            <div className={`absolute inset-0 bg-orange-500/10 transition-opacity duration-1000 ${isWarning ? 'opacity-100' : 'opacity-0'}`} />
            <div className={`absolute inset-0 bg-red-600/20 transition-opacity duration-1000 ${isCritical ? 'opacity-100' : 'opacity-0'}`} />

            {isCritical && (
                <div key={`ghost-${timeLeft}`} className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[30rem] md:text-[50rem] font-black text-red-600/10 italic leading-none select-none animate-[ghost-count_1s_ease-out_forwards]">
                        {timeLeft}
                    </span>
                </div>
            )}
        </div>
    );
};

const MassiveShockOverlay: React.FC<{ active: boolean }> = ({ active }) => {
    if (!active) return null;
    return (
        <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden animate-[pulse_0.1s_infinite]">
            <div className="absolute inset-0 bg-white mix-blend-overlay opacity-30" />
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full fill-none stroke-cyan-400 stroke-[5] opacity-80">
                <path d="M0,50 L10,20 L25,80 L40,10 L60,90 L80,30 L100,50" className="animate-massive-arc" />
            </svg>
        </div>
    );
};

const LinkIntegrityCounter: React.FC<{ mistakes: number }> = ({ mistakes }) => {
    const isCritical = mistakes === MAX_MISTAKES - 1;

    return (
        <div className="flex flex-col items-center gap-1 p-2 bg-black/40 backdrop-blur-sm border border-white/5 rounded-xl w-fit mx-auto animate-fade-in relative z-20">
            <style>{`
                @keyframes bar-shimmer-red {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                .shimmer-last-bar {
                    background: linear-gradient(90deg, #e11d48 25%, #ff4d4d 50%, #e11d48 75%);
                    background-size: 200% 100%;
                    animation: bar-shimmer-red 0.8s infinite linear;
                }
            `}</style>
            <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest italic leading-none">Link_Integrity</span>
            <div className="flex gap-1 relative z-10">
                {[...Array(MAX_MISTAKES)].map((_, i) => {
                    const isActive = i < (MAX_MISTAKES - mistakes);
                    const isLastLife = isCritical && i === 0;
                    return (
                        <div key={i} className={`w-2.5 h-4 md:w-3 md:h-5 border-2 transition-all duration-300 
                            ${isActive 
                                ? isLastLife 
                                    ? 'shimmer-last-bar border-white shadow-[0_0_15px_#e11d48]' 
                                    : 'bg-cyan-400 border-cyan-300 shadow-[0_0_8px_#22d3ee]' 
                                : 'bg-transparent border-zinc-800'}`} />
                    );
                })}
            </div>
        </div>
    );
};

const HieroglyphicHangmanVisual: React.FC<{ mistakes: number; isShaking: boolean }> = ({ mistakes, isShaking }) => {
    const isCritical = mistakes === MAX_MISTAKES - 1;
    const color = mistakes >= MAX_MISTAKES - 1 ? '#e11d48' : '#22d3ee';
    const drawPart = (threshold: number) => mistakes >= threshold ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none';

    return (
        <div className={`relative w-24 h-32 md:w-48 md:h-56 mx-auto flex items-center justify-center transition-all duration-75 z-10 shrink-0
            ${isShaking ? 'translate-x-1 -translate-y-0.5' : ''}
            ${isCritical ? 'animate-[shake_0.1s_infinite] scale-105' : ''}`}>
            
            {isCritical && (
                <div className="absolute inset-0 bg-red-600/20 rounded-full blur-[60px] animate-pulse" />
            )}

            <svg viewBox="0 0 200 250" className="w-full h-full drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
                <style>{`
                    @keyframes shake {
                        0% { transform: translate(1px, 1px) rotate(0deg); }
                        10% { transform: translate(-1px, -2px) rotate(-1deg); }
                        20% { transform: translate(-3px, 0px) rotate(1deg); }
                        30% { transform: translate(3px, 2px) rotate(0deg); }
                        100% { transform: translate(1px, -2px) rotate(-1deg); }
                    }
                `}</style>
                <rect x="20" y="230" width="160" height="4" fill="#3f3f46" rx="2" />
                <g className={`transition-all duration-500 stroke-[3] fill-none stroke-zinc-700`}>
                    <path d="M40,230 L40,20 L140,20 L140,50" />
                    <path d="M40,60 L80,20" />
                </g>
                <g className="stroke-[3] fill-none" style={{ stroke: color }}>
                    <path d="M40,230 L40,20" className={`transition-all duration-300 ${drawPart(1)}`} />
                    <path d="M40,20 L140,20" className={`transition-all duration-300 ${drawPart(2)}`} />
                    <path d="M140,20 L140,50" className={`transition-all duration-300 ${drawPart(3)}`} />
                    <path d="M140,50 L155,65 L155,85 L140,100 L125,85 L125,65 Z" className={`transition-all duration-500 ${drawPart(4)}`} />
                    <path d="M140,100 L140,170" className={`transition-all duration-500 ${drawPart(5)}`} />
                    <path d="M140,120 L110,150 M140,120 L170,150" className={`transition-all duration-500 ${drawPart(6)}`} />
                    <path d="M140,170 L115,210 M140,170 L165,210" className={`transition-all duration-500 ${drawPart(7)}`} />
                </g>
            </svg>
        </div>
    );
};

const HangmanPage: React.FC<{ onBackToHub: () => void }> = ({ onBackToHub }) => {
    const [gameState, setGameState] = useState<GameState>('LOBBY');
    const [mode, setMode] = useState<GameMode>('SOLO');
    const [category, setCategory] = useState<CategoryFilter>('ALL');
    const [usedWords, setUsedWords] = useState<Set<string>>(new Set());
    const [level, setLevel] = useState(1);
    const [totalSessionTime, setTotalSessionTime] = useState(0);
    const [round, setRound] = useState(1); 
    const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
    const [p1Stats, setP1Stats] = useState<PlayerStats>({ score: 0, totalTime: 0 });
    const [p2Stats, setP2Stats] = useState<PlayerStats>({ score: 0, totalTime: 0 });
    const [target, setTarget] = useState<HangmanWord | null>(null);
    const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
    const [mistakes, setMistakes] = useState(0);
    const [isShocking, setIsShocking] = useState(false);
    const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
    const timerRef = useRef<number | null>(null);
    const [initials, setInitials] = useState("");

    const triggerVibrate = (pattern: number | number[] = 100) => {
        if ('vibrate' in navigator) navigator.vibrate(pattern);
    };

    const startRound = useCallback((lvl: number, isVersus: boolean = false) => {
        const difficulty = isVersus ? (round === 1 ? 1 : round === 2 ? 2 : 3) : (lvl <= 3 ? 1 : lvl <= 7 ? 2 : 3);
        const allowedCats = CATEGORY_MAP[category];
        const available = HANGMAN_DATA.filter(d => 
            d.difficulty <= difficulty && 
            allowedCats.includes(d.category) && 
            !usedWords.has(d.word)
        );
        
        const pool = available.length > 0 ? available : HANGMAN_DATA.filter(d => allowedCats.includes(d.category));
        const random = pool[Math.floor(Math.random() * pool.length)];
        
        setUsedWords(prev => { 
            const next = new Set(prev); 
            next.add(random.word); 
            return next; 
        });
        setTarget(random);
        setGuessedLetters(new Set());
        setMistakes(0);
        setTimeLeft(INITIAL_TIME);
        setGameState('PLAYING');
    }, [round, usedWords, category]);

    const handleGuess = useCallback((letter: string) => {
        if (gameState !== 'PLAYING' || !target || guessedLetters.has(letter)) return;
        const newGuessed = new Set(guessedLetters);
        newGuessed.add(letter);
        setGuessedLetters(newGuessed);

        if (!target.word.toUpperCase().includes(letter)) {
            const newMistakes = mistakes + 1;
            setMistakes(newMistakes);
            setIsShocking(true);
            triggerVibrate([150, 50, 150]);
            setTimeout(() => setIsShocking(false), 250);
            if (newMistakes >= MAX_MISTAKES) {
                setGameState('LOST');
                triggerVibrate([500, 100, 500]);
            }
        } else {
            const isWon = target.word.toUpperCase().split('').every(char => char === ' ' || !/[A-Z]/.test(char) || newGuessed.has(char));
            if (isWon) { setGameState('WON'); triggerVibrate(50); }
        }
    }, [gameState, target, guessedLetters, mistakes]);

    const handleSoloWin = () => {
        const nextLevel = level + 1;
        setTotalSessionTime(prev => prev + (INITIAL_TIME - timeLeft));
        setLevel(nextLevel);
        startRound(nextLevel);
    };

    const handleVersusWinOrLoss = (won: boolean) => {
        const points = won ? timeLeft : 0;
        if (currentPlayer === 1) {
            setP1Stats(prev => ({ score: prev.score + points, totalTime: prev.totalTime + (INITIAL_TIME - timeLeft) }));
            setCurrentPlayer(2);
            setGameState('ROUND_TRANSITION');
        } else {
            setP2Stats(prev => ({ score: prev.score + points, totalTime: prev.totalTime + (INITIAL_TIME - timeLeft) }));
            if (round >= 3) setGameState('FINAL_RESULTS');
            else { setRound(r => r + 1); setCurrentPlayer(1); setGameState('ROUND_TRANSITION'); }
        }
    };

    const resetSession = () => { 
        setUsedWords(new Set()); 
        setGameState('LOBBY'); 
        setLevel(1);
        setTotalSessionTime(0);
    };

    const handleSaveScore = () => {
        saveHighScore('hangman', {
            name: initials.toUpperCase() || "???",
            score: level,
            displayValue: `SECTOR ${level}`,
            date: new Date().toISOString(),
            metadata: { totalTime: totalSessionTime }
        });
        resetSession();
    };

    useEffect(() => {
        if (gameState === 'PLAYING') {
            timerRef.current = window.setInterval(() => {
                setTimeLeft(t => {
                    if (t <= 1) { 
                        setGameState('LOST'); 
                        triggerVibrate([600, 100, 600]);
                        return 0; 
                    }
                    if (t <= 11) triggerVibrate(15); 
                    return t - 1;
                });
            }, 1000);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [gameState]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { if (/^[a-zA-Z]$/.test(e.key)) handleGuess(e.key.toUpperCase()); };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleGuess]);

    if (gameState === 'LOBBY') {
        const topScores = getHighScores('hangman');
        return (
            <div className="dark w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-6 font-mono overflow-y-auto scrollbar-hide">
                <div className="w-full max-w-sm text-center bg-zinc-900 p-8 landscape:p-6 rounded-[3rem] border-4 border-pulse-500 shadow-[0_0_50px_rgba(225,29,72,0.1)]">
                    <header className="mb-4">
                        <span className="text-[10px] font-black uppercase text-cyan-400 tracking-[0.3em] italic block mb-1">Decryption Battle</span>
                        <h1 className="text-2xl md:text-3xl font-black italic uppercase text-white tracking-tighter leading-none">SIGNAL BREACH</h1>
                    </header>

                    <div className="mb-4 landscape:hidden">
                        {topScores.length > 0 && (
                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 text-left">
                                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-2 italic">// TOP OPERATOR</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-white font-black italic">{topScores[0].name}</span>
                                    <span className="text-pulse-500 font-black">{topScores[0].displayValue}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mb-6 landscape:mb-4">
                        <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-3 italic">// Sector Categories</p>
                        <div className="flex flex-wrap justify-center gap-1.5">
                            {(Object.keys(CATEGORY_MAP) as CategoryFilter[]).map(cat => (
                                <button key={cat} onClick={() => setCategory(cat)} className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase border transition-all ${category === cat ? 'bg-cyan-500 border-cyan-400 text-black shadow-[0_0_10px_#22d3ee]' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}>{cat}</button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <button onClick={() => { setUsedWords(new Set()); setMode('SOLO'); setLevel(1); setTotalSessionTime(0); startRound(1); }} className="w-full py-5 bg-white text-black font-black uppercase italic rounded-xl shadow-xl text-lg hover:scale-[1.02] active:scale-95 transition-all">Solo Arcade</button>
                        <button onClick={() => { setUsedWords(new Set()); setMode('VERSUS'); setRound(1); setCurrentPlayer(1); setP1Stats({score:0, totalTime:0}); setP2Stats({score:0, totalTime:0}); setGameState('ROUND_TRANSITION'); }} className="w-full py-4 bg-zinc-800 text-cyan-400 border-2 border-cyan-400/30 font-black uppercase italic rounded-xl hover:bg-cyan-400 hover:text-black transition-all active:scale-95 text-sm">Dual Link Battle</button>
                        <button onClick={onBackToHub} className="text-zinc-600 font-bold uppercase tracking-widest text-[9px] hover:text-white transition-colors pt-2 block w-full italic">Abort Link</button>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'ROUND_TRANSITION') {
        return (
            <div className="dark w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-6 font-mono text-center overflow-y-auto scrollbar-hide">
                <div className="max-w-sm w-full bg-zinc-900 p-8 rounded-[3rem] border-4 border-cyan-400 shadow-2xl">
                    <h2 className="text-2xl font-black text-white italic uppercase mb-2">Round {round}</h2>
                    <div className={`p-6 rounded-2xl border-2 mb-8 ${currentPlayer === 1 ? 'border-blue-500 bg-blue-500/10' : 'border-pink-500 bg-pink-500/10'}`}>
                        <h3 className={`text-3xl font-black italic uppercase ${currentPlayer === 1 ? 'text-blue-500' : 'text-pink-500'}`}>Player {currentPlayer}</h3>
                    </div>
                    <button onClick={() => startRound(round, true)} className={`w-full py-4 font-black uppercase italic rounded-full shadow-lg active:scale-95 transition-all ${currentPlayer === 1 ? 'bg-blue-500 text-white' : 'bg-pink-500 text-white'}`}>Initialize Intercept</button>
                </div>
            </div>
        );
    }

    return (
        <main className={`dark w-full h-full bg-zinc-950 flex flex-col items-center p-2 md:p-4 overflow-hidden font-mono text-white transition-all duration-75 relative ${isShocking ? 'invert' : ''}`}>
            <style>{`
                @keyframes revealed-shimmer {
                    0%, 100% { color: #f43f5e; text-shadow: 0 0 10px #e11d48; opacity: 0.7; }
                    50% { color: #fff; text-shadow: 0 0 25px #fff, 0 0 40px #e11d48; opacity: 1; }
                }
                .animate-shimmer-char { animation: revealed-shimmer 2s infinite ease-in-out; }
            `}</style>
            <UrgencyOverlay timeLeft={timeLeft} />
            <MassiveShockOverlay active={isShocking} />
            
            <header className="w-full max-w-lg flex justify-between items-center mb-2 bg-zinc-900/50 p-3 rounded-2xl border border-white/5 flex-shrink-0 relative z-20 landscape:hidden">
                <button onClick={resetSession} className="p-2 bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all active:scale-95 shadow-md"><XIcon className="w-5 h-5" /></button>
                <div className="text-center">
                    <span className={`text-[9px] font-black uppercase tracking-[0.3em] italic ${mode === 'VERSUS' ? (currentPlayer === 1 ? 'text-blue-500' : 'text-pink-500') : 'text-cyan-400'}`}>
                        {mode === 'SOLO' ? `SECTOR 0${level}` : `ROUND ${round} - P${currentPlayer}`}
                    </span>
                    <h1 className="text-sm md:text-xl font-black italic uppercase tracking-tighter leading-none text-white">SIGNAL BREACH</h1>
                </div>
                <div className="flex flex-col items-end min-w-[50px]">
                    <span className="text-[7px] font-black text-zinc-500 uppercase leading-none mb-1">Uptime</span>
                    <span className={`text-xs md:text-sm font-black font-mono transition-colors duration-500 ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                        {timeLeft}s
                    </span>
                </div>
            </header>

            <div className="w-full h-full flex flex-col landscape:flex-row items-center justify-center flex-grow min-h-0 relative z-10 overflow-hidden landscape:gap-4">
                
                {/* Left Section: Visuals & Word */}
                <div className="flex-1 flex flex-col items-center justify-center min-h-0 w-full landscape:w-1/2 overflow-hidden py-2 landscape:py-0">
                    <div className="flex flex-col items-center gap-1 shrink-0 landscape:scale-90">
                        <HieroglyphicHangmanVisual mistakes={mistakes} isShaking={isShocking} />
                        <LinkIntegrityCounter mistakes={mistakes} />
                        <div className="landscape:block hidden mt-2">
                             <div className={`px-3 py-1 bg-opacity-10 border rounded-full ${mode === 'VERSUS' ? (currentPlayer === 1 ? 'bg-blue-500 border-blue-500 text-blue-500' : 'bg-pink-500 border-pink-500 text-pink-500') : 'bg-cyan-400 border-cyan-400 text-cyan-400'}`}>
                                <span className="text-[8px] font-black uppercase tracking-widest italic">{target?.category} INTERCEPT</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-grow flex items-center justify-center w-full min-h-0 landscape:mt-2">
                        <div className="text-[clamp(1.2rem,6vw,3.5rem)] landscape:text-[clamp(1rem,4vw,2.5rem)] font-black tracking-[0.1em] text-white italic transition-all duration-500 whitespace-pre-wrap leading-tight font-horror drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] flex flex-wrap justify-center overflow-y-auto scrollbar-hide max-h-full px-4">
                            {target?.word.toUpperCase().split('').map((char, idx) => {
                                if (char === ' ') return <span key={idx} className="w-[0.5em]">&nbsp;</span>;
                                if (!/[A-Z]/.test(char)) return <span key={idx}>{char}</span>;
                                const isGuessed = guessedLetters.has(char);
                                if (isGuessed) return <span key={idx} className="text-white">{char}</span>;
                                if (gameState === 'LOST') return <span key={idx} className="animate-shimmer-char">{char}</span>;
                                return <span key={idx} className="opacity-20">_</span>;
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Section: Keyboard (Visible in PLAYING state) */}
                {gameState === 'PLAYING' && (
                    <div className="w-full landscape:w-1/2 max-w-lg flex flex-col gap-1 md:gap-2 p-3 bg-void-900/60 landscape:bg-transparent rounded-t-3xl landscape:rounded-none border-t border-x landscape:border-none border-white/10 backdrop-blur-xl landscape:backdrop-blur-none shadow-2xl landscape:shadow-none relative overflow-hidden z-20 shrink-0 mt-auto landscape:mt-0 landscape:justify-center">
                        
                        {/* Landscape Header Replacement */}
                        <div className="landscape:flex hidden justify-between items-center mb-4 px-4">
                             <button onClick={resetSession} className="p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all active:scale-95"><XIcon className="w-4 h-4" /></button>
                             <div className="text-center">
                                <span className="text-[8px] font-black uppercase text-zinc-500 block mb-1">Uptime</span>
                                <span className={`text-sm font-black font-mono ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timeLeft}s</span>
                             </div>
                        </div>

                        {KEYBOARD_ROWS.map((row, rowIndex) => (
                            <div key={rowIndex} className="flex justify-center gap-1 md:gap-2">
                                {row.map(char => {
                                    const isGuessed = guessedLetters.has(char);
                                    const isCorrect = target?.word.toUpperCase().includes(char);
                                    return (
                                        <button
                                            key={char}
                                            onClick={() => handleGuess(char)}
                                            disabled={isGuessed}
                                            className={`h-10 md:h-14 landscape:h-10 w-8 md:w-12 landscape:w-9 relative z-10 rounded-lg font-black text-xs md:text-xl flex items-center justify-center transition-all active:scale-90
                                                ${!isGuessed 
                                                    ? 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 shadow-[0_3px_0_black] hover:translate-y-[1px] border-b border-black' 
                                                    : isCorrect 
                                                        ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/50 opacity-60' 
                                                        : 'bg-red-600/30 text-red-400 border border-red-500/50 opacity-60'}`}
                                        >
                                            {char}
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                )}

                {/* Overlays for Win/Loss */}
                {(gameState === 'WON' || gameState === 'LOST') && (
                    <div className="animate-fade-in fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <div className="w-full max-w-sm bg-zinc-900 border-4 border-pulse-500 text-center shadow-[0_0_100px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col max-h-[95vh] rounded-[2.5rem]">
                            <div className="relative z-10 p-6 landscape:p-4 overflow-y-auto scrollbar-hide flex-grow">
                                <h2 className={`text-3xl md:text-4xl font-black italic uppercase tracking-tighter mb-4 ${gameState === 'WON' ? 'text-emerald-500' : 'text-pulse-500'}`}>
                                    {gameState === 'WON' ? 'SIGNAL CLEAR' : 'LINK SEVERED'}
                                </h2>
                                <div className="mb-4 p-4 bg-black/60 rounded-[1.5rem] border-2 border-white/5 text-left shadow-inner">
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 italic">
                                        {gameState === 'LOST' ? '// Correct Signal' : '// Target Signal'}
                                    </p>
                                    <p className={`text-xl md:text-2xl font-black italic tracking-wider uppercase mb-1 ${gameState === 'LOST' ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                                        {target?.word}
                                    </p>
                                    <p className="text-[9px] text-zinc-400 font-mono uppercase italic leading-tight border-t border-white/5 pt-2 mt-2">
                                        {target?.hint}
                                    </p>
                                </div>
                                
                                <div className="space-y-3">
                                    {mode === 'SOLO' ? (
                                        gameState === 'WON' ? (
                                            <button onClick={handleSoloWin} className="w-full py-4 bg-emerald-500 text-black font-black uppercase italic rounded-full text-sm tracking-widest hover:scale-105 transition-all">Advance: Sector {level + 1}</button>
                                        ) : (
                                            <div className="space-y-3">
                                                <p className="text-[9px] font-black uppercase text-zinc-500 italic">Establish Record ID</p>
                                                <div className="bg-black/50 border-2 border-pulse-500 rounded-xl p-2 mx-auto w-28">
                                                    <input autoFocus maxLength={3} value={initials} onChange={e => setInitials(e.target.value.toUpperCase())} className="bg-transparent text-white text-center text-xl font-black w-full outline-none uppercase italic" placeholder="???" />
                                                </div>
                                                <button onClick={handleSaveScore} className="w-full py-3 bg-white text-black font-black uppercase italic rounded-full text-sm tracking-widest hover:bg-cyan-400 transition-all">Post Records</button>
                                            </div>
                                        )
                                    ) : (
                                        <button onClick={() => handleVersusWinOrLoss(gameState === 'WON')} className={`w-full py-4 font-black uppercase italic rounded-full text-sm tracking-widest transition-all ${currentPlayer === 1 ? 'bg-blue-600' : 'bg-pink-600'}`}>
                                            {currentPlayer === 1 ? 'Player 2 Awaiting' : round === 3 ? 'Final Tally' : 'Next Round'}
                                        </button>
                                    )}
                                    <button onClick={resetSession} className="mt-2 text-zinc-500 font-bold uppercase tracking-widest text-[8px] hover:text-white transition-colors block w-full italic">Back to Lobby</button>
                                </div>
                            </div>
                            {gameState === 'LOST' && <div className="absolute inset-0 bg-red-600/5 animate-pulse pointer-events-none" />}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
};

export default HangmanPage;
