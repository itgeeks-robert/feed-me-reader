import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { XIcon, RadioIcon, BoltIcon, SparklesIcon, VoidIcon, ShieldCheckIcon, GlobeAltIcon, ControllerIcon, FireIcon, CpuChipIcon, ArrowPathIcon, ExclamationTriangleIcon, BookOpenIcon } from './icons';
import { HANGMAN_DATA, HangmanWord, fetchDynamicHangmanData } from '../services/hangmanData';
import { saveHighScore, getHighScores } from '../services/highScoresService';
import { useLocalStorage } from '../hooks/useLocalStorage';

const MAX_MISTAKES = 7;
const INITIAL_TIME = 60; 

type GameState = 'INITIAL_SYNC' | 'LOBBY' | 'PLAYING' | 'WON' | 'LOST' | 'FINAL_RESULTS';
type CategoryFilter = 'ALL' | 'FILM' | 'MUSIC' | 'SPORT' | 'TECH' | 'FASHION' | 'GAMING';

const CATEGORY_MAP: Record<CategoryFilter, string[]> = {
    ALL: ['ACTOR', 'FILM', 'ARTIST', 'SONG', 'TECH', 'GAMING', 'SPORT', 'FASHION', 'OBJECT', 'RANDOM'],
    FILM: ['ACTOR', 'FILM'],
    MUSIC: ['ARTIST', 'SONG'],
    SPORT: ['SPORT'],
    TECH: ['TECH'],
    FASHION: ['FASHION'],
    GAMING: ['GAMING']
};

const KEYBOARD_ROWS = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Z", "X", "C", "V", "B", "N", "M"]
];

const LEVEL_THEMES = [
    { color: '#22d3ee', name: 'CYAN' },    
    { color: '#10b981', name: 'EMERALD' }, 
    { color: '#3b82f6', name: 'BLUE' },    
    { color: '#8b5cf6', name: 'VIOLET' },  
    { color: '#d946ef', name: 'FUCHSIA' }, 
    { color: '#f59e0b', name: 'AMBER' },   
    { color: '#e11d48', name: 'CRIMSON' }, 
];

const shufflePool = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

const MainframeBackground: React.FC<{ level: number; isUrgent: boolean; urgencyType: 'NONE' | 'AMBER' | 'RED' }> = ({ level, isUrgent, urgencyType }) => {
    const themeIndex = Math.min(level - 1, LEVEL_THEMES.length - 1);
    const baseTheme = LEVEL_THEMES[themeIndex];
    const activeColor = urgencyType === 'RED' ? '#ef4444' : urgencyType === 'AMBER' ? '#f59e0b' : baseTheme.color;
    const speed = urgencyType === 'RED' ? 0.3 : urgencyType === 'AMBER' ? 0.8 : Math.max(1, 10 - level); 

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-zinc-950 transition-colors duration-1000">
            <div 
                className="absolute inset-0 opacity-10 transition-colors duration-1000"
                style={{ 
                    backgroundImage: `linear-gradient(${activeColor}22 1px, transparent 1px), linear-gradient(90deg, ${activeColor}22 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                    animation: `pulse ${speed}s infinite ease-in-out`
                }} 
            />
            <div 
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 20px, ${activeColor} 20px, ${activeColor} 21px)`,
                    backgroundSize: '100% 40px',
                    animation: `scanline ${speed / 2}s linear infinite`
                }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
        </div>
    );
};

const UrgencyOverlay: React.FC<{ timeLeft: number }> = ({ timeLeft }) => {
    const isUrgent = timeLeft <= 30 && timeLeft > 0;
    const isCritical = timeLeft <= 10 && timeLeft > 0;
    const isExtreme = timeLeft <= 5 && timeLeft > 0;
    
    if (!isUrgent) return null;

    const phaseColor = isCritical ? '#ef4444' : '#f59e0b';
    const phaseLabel = isCritical ? 'TERMINAL_CRITICAL' : 'SIGNAL_DEGRADATION';
    const bpm = isExtreme ? '0.3s' : isCritical ? '0.6s' : '1.2s';

    return (
        <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
            <style>{`
                @keyframes heartbeat-alert {
                    0%, 100% { box-shadow: inset 0 0 40px ${phaseColor}22; }
                    50% { box-shadow: inset 0 0 120px ${phaseColor}66; }
                }
                @keyframes ticker-scroll {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
                .animate-heartbeat-alert { animation: heartbeat-alert ${bpm} infinite ease-in-out; }
                .animate-ticker { animation: ticker-scroll 10s linear infinite; }
            `}</style>
            <div className="absolute inset-0 animate-heartbeat-alert border-[4px] transition-colors duration-500" style={{ borderColor: `${phaseColor}44` }} />
            <div className={`absolute inset-8 transition-opacity duration-500 ${isCritical ? 'opacity-100' : 'opacity-40'}`}>
                <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 transition-colors duration-500" style={{ borderColor: phaseColor, boxShadow: `0 0 15px ${phaseColor}` }} />
                <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 transition-colors duration-500" style={{ borderColor: phaseColor, boxShadow: `0 0 15px ${phaseColor}` }} />
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 transition-colors duration-500" style={{ borderColor: phaseColor, boxShadow: `0 0 15px ${phaseColor}` }} />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 transition-colors duration-500" style={{ borderColor: phaseColor, boxShadow: `0 0 15px ${phaseColor}` }} />
            </div>
            <div className="absolute top-12 right-12 opacity-30 select-none transition-all duration-500">
                <span className="text-8xl font-black text-white italic" style={{ filter: `drop-shadow(0 0 30px ${phaseColor})` }}>{timeLeft}</span>
            </div>
            <div className="absolute top-4 left-0 right-0 h-4 bg-black/40 border-y transition-colors duration-500 flex items-center overflow-hidden" style={{ borderColor: `${phaseColor}33` }}>
                <div className="animate-ticker whitespace-nowrap">
                    <span className="text-[10px] font-black uppercase tracking-[0.8em] italic transition-colors duration-500" style={{ color: phaseColor }}>
                        {phaseLabel}_0xVOID_{timeLeft}_SEC_REMAINING_{phaseLabel}_0xVOID_{timeLeft}_SEC_REMAINING
                    </span>
                </div>
            </div>
        </div>
    );
};

const TelemetryHub: React.FC<{ level: number; timeLeft: number; color: string; isLandscape?: boolean }> = ({ level, timeLeft, color, isLandscape }) => {
    const isAmber = timeLeft <= 30 && timeLeft > 10;
    const isRed = timeLeft <= 10;
    const urgencyColor = isRed ? '#ef4444' : isAmber ? '#f59e0b' : null;
    
    return (
        <div className={`flex items-stretch gap-px bg-zinc-800 border-2 border-black rounded-xl overflow-hidden shadow-2xl transition-all duration-300 ${isLandscape ? 'w-full' : ''} ${urgencyColor ? 'scale-105 shadow-[0_0_30px_rgba(0,0,0,0.5)]' : ''}`}>
            <div className={`flex flex-col items-center flex-1 px-4 py-1.5 md:px-6 md:py-2 border-r-2 border-black transition-colors duration-500 ${isRed ? 'bg-red-600' : isAmber ? 'bg-amber-500' : 'bg-zinc-900'}`}>
                <span className={`text-[7px] md:text-[8px] font-black uppercase leading-none mb-1 ${urgencyColor ? 'text-white' : 'text-zinc-500'}`}>Sector</span>
                <span className={`text-base md:text-xl font-black italic transition-all duration-500 ${urgencyColor ? 'text-white' : ''}`} style={{ color: urgencyColor ? undefined : color }}>0{level}</span>
            </div>
            <div className={`flex flex-col items-center flex-1 px-4 py-1.5 md:px-6 md:py-2 transition-colors duration-500 ${isRed ? 'bg-red-950 animate-pulse' : isAmber ? 'bg-amber-950 animate-pulse' : 'bg-zinc-900'}`}>
                <span className={`text-[7px] md:text-[8px] font-black uppercase leading-none mb-1 ${isRed ? 'text-red-400' : isAmber ? 'text-amber-400' : 'text-zinc-500'}`}>Time</span>
                <span className={`text-base md:text-xl font-black italic font-mono transition-all duration-500 ${urgencyColor ? 'text-white text-2xl' : 'text-white'}`} style={{ filter: urgencyColor ? `drop-shadow(0 0 10px ${urgencyColor})` : 'none' }}>{timeLeft}s</span>
            </div>
        </div>
    );
};

const LinkIntegrityCounter: React.FC<{ mistakes: number; level: number }> = ({ mistakes, level }) => {
    const isCritical = mistakes === MAX_MISTAKES - 1;
    const themeIndex = Math.min(level - 1, LEVEL_THEMES.length - 1);
    const themeColor = LEVEL_THEMES[themeIndex].color;

    return (
        <div className="flex flex-col items-center gap-1.5 p-3 bg-black/60 border-y border-white/10 w-full relative z-20 landscape:rounded-xl landscape:border-2 landscape:border-white/5">
            <div className="flex justify-between w-full max-w-lg px-4">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em] italic">Link_Integrity</span>
                <span className={`text-[9px] font-black uppercase italic transition-colors duration-500`} style={{ color: isCritical ? '#ef4444' : themeColor }}>
                    {isCritical ? 'FAILURE' : 'STABLE'}
                </span>
            </div>
            <div className="flex gap-1 w-full max-w-lg px-4 h-2 md:h-3">
                {[...Array(MAX_MISTAKES)].map((_, i) => {
                    const isActive = i < (MAX_MISTAKES - mistakes);
                    const isLastLife = isCritical && i === 0;
                    return (
                        <div key={i} className="flex-1 border-2 transition-all duration-300 rounded-sm"
                            style={{ 
                                backgroundColor: isActive ? (isLastLife ? '#ef4444' : themeColor) : 'transparent',
                                borderColor: isActive ? (isLastLife ? '#fff' : themeColor) : '#18181b',
                                boxShadow: isActive ? `0 0 10px ${isLastLife ? '#ef4444' : themeColor}` : 'none'
                            }} 
                        />
                    );
                })}
            </div>
        </div>
    );
};

const HieroglyphicHangmanVisual: React.FC<{ mistakes: number; isShaking: boolean; level: number }> = ({ mistakes, isShaking, level }) => {
    const themeIndex = Math.min(level - 1, LEVEL_THEMES.length - 1);
    const themeColor = LEVEL_THEMES[themeIndex].color;
    const color = mistakes >= MAX_MISTAKES - 1 ? '#e11d48' : themeColor;
    const drawPart = (threshold: number) => mistakes >= threshold ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none';

    return (
        <div className={`relative w-full h-[25vh] md:h-[35vh] landscape:h-[45vh] mx-auto flex items-center justify-center transition-all duration-75 z-10 shrink-0
            ${isShaking ? 'translate-x-2' : ''}`}>
            <svg viewBox="0 0 200 250" className="h-full drop-shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                <rect x="20" y="230" width="160" height="4" fill="#3f3f46" rx="2" />
                <g className="stroke-[3] fill-none stroke-zinc-800">
                    <path d="M40,230 L40,20 L140,20 L140,50" />
                </g>
                <g className="stroke-[4] fill-none" style={{ stroke: color }}>
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
    const [gameState, setGameState] = useLocalStorage<GameState>('void_hangman_state', 'INITIAL_SYNC');
    const [category, setCategory] = useLocalStorage<CategoryFilter>('void_hangman_category', 'ALL');
    const [usedWords, setUsedWords] = useLocalStorage<Set<string>>('void_hangman_used_words', () => new Set());
    const [level, setLevel] = useLocalStorage<number>('void_hangman_level', 1);
    const [target, setTarget] = useLocalStorage<HangmanWord | null>('void_hangman_target', null);
    const [guessedLetters, setGuessedLetters] = useLocalStorage<Set<string>>('void_hangman_guesses', () => new Set());
    const [mistakes, setMistakes] = useLocalStorage<number>('void_hangman_mistakes', 0);
    const [timeLeft, setTimeLeft] = useLocalStorage<number>('void_hangman_time', INITIAL_TIME);
    
    const [dynamicPool, setDynamicPool] = useState<HangmanWord[]>([]);
    const [isSyncing, setIsSyncing] = useState(true);
    const [showSeverConfirm, setShowSeverConfirm] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);

    useEffect(() => {
        setIsSyncing(true);
        fetchDynamicHangmanData().then(data => {
            setDynamicPool(data);
            setIsSyncing(false);
        });
    }, []);
    
    useEffect(() => {
        if (gameState === 'INITIAL_SYNC') {
            const duration = 3500;
            const step = (50 / duration) * 100;
            const timer = setInterval(() => {
                setSyncProgress(prev => {
                    if (prev >= 100 && !isSyncing) { clearInterval(timer); setGameState('LOBBY'); return 100; }
                    if (prev >= 98 && isSyncing) return 98;
                    return prev + step;
                });
            }, 50);
            return () => clearInterval(timer);
        }
    }, [gameState, isSyncing]);

    const [isShocking, setIsShocking] = useState(false);
    const [initials, setInitials] = useState("");
    const timerRef = useRef<number | null>(null);

    const handleSaveScore = () => {
        saveHighScore('hangman', { name: initials.toUpperCase() || "???", score: level, displayValue: `LVL ${level}`, date: new Date().toISOString() });
        setGameState('LOBBY'); setTarget(null); setGuessedLetters(new Set()); setMistakes(0); setTimeLeft(INITIAL_TIME);
    };

    const startRound = useCallback((lvl: number) => {
        const difficultyCeiling = (lvl <= 3 ? 1 : lvl <= 7 ? 2 : 3);
        const combinedPool = [...HANGMAN_DATA, ...dynamicPool];
        let candidates = combinedPool.filter(d => d.difficulty <= difficultyCeiling && CATEGORY_MAP[category].includes(d.category) && !usedWords.has(d.word));
        const totalMatchingPool = combinedPool.filter(d => d.difficulty <= difficultyCeiling && CATEGORY_MAP[category].includes(d.category));
        if (candidates.length < Math.max(1, totalMatchingPool.length * 0.1)) {
            const nextUsed = new Set(usedWords); totalMatchingPool.forEach(w => nextUsed.delete(w.word));
            setUsedWords(nextUsed); candidates = totalMatchingPool;
        }
        const firstPass = shufflePool(candidates);
        const secondPass = shufflePool(firstPass);
        const finalChoice = secondPass[Math.floor(Math.random() * secondPass.length)];
        setUsedWords(prev => { const next = new Set(prev); next.add(finalChoice.word); return next; });
        setTarget(finalChoice); setGuessedLetters(new Set()); setMistakes(0); setTimeLeft(INITIAL_TIME); setGameState('PLAYING');
    }, [category, dynamicPool, usedWords, setUsedWords, setTarget, setGuessedLetters, setMistakes, setTimeLeft, setGameState]);

    const handleGuess = useCallback((letter: string) => {
        if (gameState !== 'PLAYING' || !target || guessedLetters.has(letter)) return;
        const newGuessed = new Set(guessedLetters); newGuessed.add(letter); setGuessedLetters(newGuessed);
        if (!target.word.toUpperCase().includes(letter)) {
            const nextMistakes = mistakes + 1; setMistakes(nextMistakes); setIsShocking(true);
            setTimeout(() => setIsShocking(false), 200);
            if (nextMistakes >= MAX_MISTAKES) setGameState('LOST');
        } else {
            const isWon = target.word.toUpperCase().split('').every(char => char === ' ' || !/[A-Z]/.test(char) || newGuessed.has(char));
            if (isWon) setGameState('WON');
        }
    }, [gameState, target, guessedLetters, mistakes, setGuessedLetters, setMistakes, setGameState]);

    useEffect(() => {
        if (gameState === 'PLAYING') {
            timerRef.current = window.setInterval(() => {
                setTimeLeft(t => { if (t <= 1) { setGameState('LOST'); return 0; } return t - 1; });
            }, 1000);
        } else { if (timerRef.current) clearInterval(timerRef.current); }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [gameState, setGameState, setTimeLeft]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { if (/^[a-zA-Z]$/.test(e.key)) handleGuess(e.key.toUpperCase()); };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleGuess]);

    const themeIndex = Math.min(level - 1, LEVEL_THEMES.length - 1);
    const themeColor = LEVEL_THEMES[themeIndex].color;

    if (gameState === 'INITIAL_SYNC') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-6 font-mono text-white">
                <div className="w-full max-w-sm">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-2 bg-cyan-500/20 rounded-xl border border-cyan-500/30">
                            <ArrowPathIcon className="w-10 h-10 text-cyan-400 animate-spin" />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none">SIGNAL_BREACH</h2>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400 mt-2">Initialize_Uplink</span>
                        </div>
                    </div>
                    <div className="bg-zinc-900 border-2 border-zinc-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 pointer-events-none opacity-10">
                            <div className="w-full h-full bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(34,211,238,0.1)_2px,rgba(34,211,238,0.1)_4px)]" />
                        </div>
                        <div className="relative z-10 space-y-6">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black uppercase text-zinc-500 italic tracking-widest leading-none">OPTIMIZING_DECRYPTOR...</span>
                                <span className="text-xl font-black italic font-mono text-cyan-400 leading-none">{Math.floor(syncProgress)}%</span>
                            </div>
                            <div className="w-full h-4 bg-black border-2 border-zinc-800 rounded-full p-1 overflow-hidden">
                                <div className="h-full bg-cyan-500 shadow-[0_0_15px_#22d3ee] transition-all duration-300 rounded-full" style={{ width: `${syncProgress}%` }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'LOBBY') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-4 font-mono overflow-y-auto scrollbar-hide">
                <div className="w-full max-w-sm text-center bg-zinc-900 p-10 border-4 border-pulse-500 shadow-[0_0_100px_rgba(225,29,72,0.2)] rounded-[3rem]">
                    <header className="mb-6">
                        <span className="text-[10px] font-black uppercase text-cyan-400 tracking-[0.3em] italic block mb-1">High_Voltage_Intercept</span>
                        <h1 className="text-4xl font-black italic uppercase text-white tracking-tighter leading-none glitch-text">SIGNAL BREACH</h1>
                    </header>
                    <div className="mb-8 space-y-4">
                        <div className="flex flex-wrap justify-center gap-2">
                            {(Object.keys(CATEGORY_MAP) as CategoryFilter[]).map(cat => (
                                <button key={cat} onClick={() => setCategory(cat)} className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-all ${category === cat ? 'bg-cyan-500 border-cyan-400 text-black shadow-[0_0_15px_#22d3ee]' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}>{cat}</button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <button onClick={() => { setUsedWords(new Set()); setLevel(1); startRound(1); }} className="w-full py-6 bg-white text-black font-black uppercase italic rounded-2xl shadow-xl text-xl active:scale-95 transition-all">Establish Link</button>
                        <button onClick={() => setShowHelp(true)} className="w-full py-3 bg-zinc-800 text-zinc-400 font-black uppercase italic rounded-xl border border-white/5 hover:text-white transition-all text-[10px] tracking-widest flex items-center justify-center gap-2">
                            <BookOpenIcon className="w-4 h-4" /> Tactical Manual
                        </button>
                        <button onClick={onBackToHub} className="text-zinc-600 font-bold uppercase tracking-[0.4em] text-[10px] pt-4 block w-full italic">Abort_System</button>
                    </div>
                </div>
                {showHelp && <TacticalManual onClose={() => setShowHelp(false)} />}
            </div>
        );
    }

    return (
        <main className={`w-full h-full flex flex-col overflow-hidden font-mono text-white transition-all duration-75 relative ${isShocking ? 'bg-red-900/40' : ''}`}>
            <style>{`
                @keyframes pulse { 0%, 100% { opacity: 0.1; } 50% { opacity: 0.2; } }
                @keyframes scanline { 0% { transform: translateY(0); } 100% { transform: translateY(40px); } }
            `}</style>
            <MainframeBackground level={level} isUrgent={timeLeft <= 30} urgencyType={timeLeft <= 10 ? 'RED' : timeLeft <= 30 ? 'AMBER' : 'NONE'} />
            <UrgencyOverlay timeLeft={timeLeft} />
            <div className="absolute inset-0 border-[8px] md:border-[16px] border-zinc-900 pointer-events-none z-50"><div className="absolute inset-0 border-2 border-white/5" /></div>
            <div className="flex-1 flex flex-col landscape:flex-row items-center justify-between p-4 md:p-8 landscape:p-10 relative z-10 overflow-hidden">
                <div className="w-full landscape:w-[50%] flex flex-col items-center justify-center gap-4 landscape:gap-8 landscape:h-full py-4">
                    <HieroglyphicHangmanVisual mistakes={mistakes} isShaking={isShocking} level={level} />
                    <div className="text-[clamp(1.5rem,8vw,4rem)] landscape:text-[clamp(1.2rem,5vw,3rem)] font-black tracking-[0.2em] text-white italic whitespace-pre-wrap leading-tight font-horror drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] flex flex-wrap justify-center text-center px-4 gap-y-4">
                        {target?.word.toUpperCase().split(' ').map((word, wordIdx) => (
                            <span key={wordIdx} className="inline-flex whitespace-nowrap">
                                {word.split('').map((char, charIdx) => {
                                    if (!/[A-Z]/.test(char)) return <span key={charIdx}>{char}</span>;
                                    const isGuessed = guessedLetters.has(char);
                                    return <span key={charIdx} className={`relative min-w-[0.8em] transition-all duration-300 ${isGuessed ? "text-white" : "text-white/60"}`}>{isGuessed ? char : "_"}{!isGuessed && <div className="absolute bottom-1 left-0 right-0 h-1 bg-white/20 rounded-full" />}</span>;
                                })}
                                {wordIdx < target.word.split(' ').length - 1 && <span className="w-[0.5em] flex-shrink-0">&nbsp;</span>}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="w-full landscape:w-[50%] flex flex-col gap-4 md:gap-6 landscape:h-full landscape:justify-center relative z-20">
                    <div className="flex flex-col gap-3 w-full max-w-sm mx-auto">
                        <TelemetryHub level={level} timeLeft={timeLeft} color={themeColor} isLandscape={true} />
                        <div className="flex items-center justify-between px-6 py-2 bg-black/40 border-2 rounded-full transition-colors duration-500 shadow-xl border-white/5" style={{ borderColor: `${themeColor}22` }}>
                            <span className="text-[9px] font-black uppercase tracking-[0.4em] italic transition-colors duration-500" style={{ color: themeColor }}>{target?.category} // DATA_NODE</span>
                            <button onClick={() => setShowHelp(true)} className="text-zinc-500 hover:text-white transition-colors"><BookOpenIcon className="w-4 h-4" /></button>
                        </div>
                        <LinkIntegrityCounter mistakes={mistakes} level={level} />
                    </div>
                    <div className="w-full bg-zinc-900/40 landscape:bg-void-900/40 backdrop-blur-2xl border-t-2 border-black/40 landscape:border-2 landscape:border-white/5 p-3 md:p-6 landscape:p-6 rounded-2xl flex flex-col gap-2 md:gap-4 shrink-0 shadow-2xl">
                        {KEYBOARD_ROWS.map((row, rowIndex) => (
                            <div key={rowIndex} className="flex justify-center gap-1 md:gap-3 landscape:gap-2.5">
                                {row.map(char => {
                                    const isGuessed = guessedLetters.has(char); const isCorrect = target?.word.toUpperCase().includes(char);
                                    return <button key={char} onClick={() => handleGuess(char)} disabled={isGuessed} className={`flex-1 max-w-[80px] h-10 md:h-16 landscape:h-12 rounded-lg md:rounded-xl font-black text-xs md:text-2xl landscape:text-lg transition-all active:scale-90 ${!isGuessed ? 'bg-zinc-800 text-white shadow-[0_4px_0_black] border-2 border-white/5 hover:bg-zinc-700' : isCorrect ? 'bg-emerald-600/20 text-emerald-400 border-2 border-emerald-500/30 opacity-40' : 'bg-red-600/20 text-red-500 border-2 border-red-500/30 opacity-20'}`}>{char}</button>;
                                })}
                            </div>
                        ))}
                        <div className="flex justify-center mt-2 border-t border-white/5 pt-4">
                            <button onClick={() => setShowSeverConfirm(true)} className="flex items-center gap-2 px-8 py-3 bg-red-950/20 border-2 border-pulse-600/50 text-pulse-500 font-black uppercase italic text-[10px] tracking-widest rounded-xl hover:bg-pulse-600 hover:text-white transition-all active:scale-95 shadow-lg"><XIcon className="w-4 h-4" /><span>Sever_Link</span></button>
                        </div>
                    </div>
                </div>
            </div>
            {showHelp && <TacticalManual onClose={() => setShowHelp(false)} />}
            {showSeverConfirm && (
                <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
                    <div className="bg-zinc-900 border-4 border-pulse-600 shadow-[0_0_120px_rgba(225,29,72,0.3)] w-full max-w-sm relative overflow-hidden flex flex-col rounded-[2.5rem]">
                        <header className="h-10 bg-pulse-600 flex items-center justify-between px-1 border-b-2 border-black">
                            <div className="flex items-center gap-2 h-full"><div className="w-8 h-7 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center"><div className="w-4 h-1 bg-black shadow-[0_4px_0_black]" /></div><h2 className="text-white text-[9px] font-black uppercase tracking-[0.2em] italic px-2 truncate">PROTOCOL_ABORT.EXE</h2></div>
                            <button onClick={() => setShowSeverConfirm(false)} className="w-8 h-7 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center active:bg-zinc-400"><XIcon className="w-4 h-4 text-black" /></button>
                        </header>
                        <div className="p-8 bg-void-950 text-center space-y-6"><div className="mx-auto w-12 h-12 bg-pulse-500/10 rounded-full flex items-center justify-center border-2 border-pulse-500 animate-pulse"><ExclamationTriangleIcon className="w-6 h-6 text-pulse-500" /></div><div className="space-y-4"><h3 className="text-lg font-black text-white italic uppercase tracking-tighter">TERMINATE SESSION?</h3><p className="text-[9px] text-zinc-500 leading-relaxed uppercase tracking-widest italic px-4">Operator, you are about to <span className="text-pulse-500 font-black">abort the intercept</span>. Current session data will be lost.</p></div></div>
                        <footer className="p-4 bg-zinc-300 border-t-2 border-black flex gap-3"><button onClick={() => setShowSeverConfirm(false)} className="flex-1 py-3 bg-zinc-100 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-400 text-[10px] font-black uppercase italic text-zinc-600 active:bg-zinc-200">RESUME</button><button onClick={onBackToHub} className="flex-1 py-3 bg-pulse-600 border-t-2 border-l-2 border-white/50 border-b-2 border-r-2 border-pulse-950 text-[10px] font-black uppercase italic text-white hover:bg-pulse-500 active:bg-pulse-700">CONFIRM</button></footer>
                    </div>
                </div>
            )}
            {(gameState === 'WON' || gameState === 'LOST') && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
                    <div className="w-full max-w-sm bg-zinc-900 border-4 border-white/10 p-8 md:p-10 rounded-[3rem] text-center shadow-2xl relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-full h-2 ${gameState === 'WON' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <h2 className={`text-4xl font-black italic uppercase tracking-tighter mb-6 ${gameState === 'WON' ? 'text-emerald-500' : 'text-red-500'}`}>{gameState === 'WON' ? 'DECODED' : 'SIG_LOSS'}</h2>
                        <div className="bg-black/60 p-6 rounded-3xl border border-white/5 text-left mb-8"><p className="text-[10px] text-zinc-500 font-black uppercase mb-2">Resultant_String</p><p className="text-2xl font-black text-white italic tracking-widest uppercase">{target?.word}</p><p className="text-[10px] text-zinc-600 font-mono mt-4 italic border-t border-white/5 pt-2">{target?.hint}</p></div>
                        {gameState === 'WON' ? <button onClick={() => { setLevel(l => l + 1); startRound(level); }} className="w-full py-5 bg-emerald-600 text-white font-black uppercase italic rounded-full text-lg shadow-xl active:scale-95 transition-all">Advance_Node</button> : <div className="space-y-4"><input autoFocus maxLength={3} value={initials} onChange={e => setInitials(e.target.value.toUpperCase())} className="bg-black/50 border-2 border-red-500 text-white rounded-xl px-4 py-4 text-center text-3xl font-black w-32 outline-none uppercase italic" placeholder="???" /><button onClick={handleSaveScore} className="w-full py-5 bg-white text-black font-black uppercase italic rounded-full text-lg shadow-xl active:scale-95 transition-all">Transmit_Log</button></div>}
                    </div>
                </div>
            )}
        </main>
    );
};

const TacticalManual: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-10 font-mono" onClick={onClose}>
            <div className="max-w-xl w-full bg-void-900 border-4 border-pulse-500 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh] pt-[var(--safe-top)] pb-[var(--safe-bottom)]" onClick={e => e.stopPropagation()}>
                
                <header className="h-12 bg-emerald-600 flex items-center justify-between px-1 relative z-20 border-b-2 border-black shrink-0">
                    <div className="flex items-center gap-2 h-full">
                        <div className="w-10 h-8 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center">
                           <BookOpenIcon className="w-5 h-5 text-black" />
                        </div>
                        <h2 className="text-white text-[10px] font-black uppercase tracking-[0.2em] italic px-2">DECRYPTION_MANUAL.PDF</h2>
                    </div>
                    <button onClick={onClose} className="w-10 h-8 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center active:bg-zinc-400 transition-colors">
                        <XIcon className="w-5 h-5 text-black" />
                    </button>
                </header>

                <div className="p-6 md:p-10 overflow-y-auto flex-grow bg-void-950/40 relative">
                    <div className="absolute inset-0 pointer-events-none opacity-5 cctv-overlay" />
                    
                    <section className="space-y-8 relative z-10">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <SparklesIcon className="w-5 h-5 text-emerald-500" />
                                <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Signal Recovery</h3>
                            </div>
                            <p className="text-[10px] md:text-xs text-zinc-400 uppercase font-black leading-relaxed tracking-wider mb-4 border-l-2 border-emerald-500/30 pl-4">
                                Breach the encrypted word signal before the terminal lock triggers. High-voltage execution required.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <ManualPoint title="0x01_Vowel_Probing" desc="Begin with A, E, I, O, U. Most signal packets are structured around these primary frequency anchors." color="text-emerald-500" />
                            <ManualPoint title="0x02_High_Freq_Bits" desc="Prioritize R, S, T, L, N. These consonants appear at a significantly higher rate within standard data streams." color="text-emerald-500" />
                            <ManualPoint title="0x03_Pattern_Matching" desc="Look for common terminal sequences like -ING, -ED, or -TION. Use the category metadata to narrow the logical search space." color="text-emerald-500" />
                            <ManualPoint title="0x04_Mistake_Buffer" desc="You have a 7-bit mistake buffer. If the integrity bar reaches zero, the link is severed and session data is wiped." color="text-emerald-500" />
                        </div>

                        <div className="p-5 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl flex items-start gap-4">
                            <ExclamationTriangleIcon className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5 animate-pulse" />
                            <div>
                                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1 italic">Pro Tip: Time Management</p>
                                <p className="text-[8px] text-zinc-500 uppercase font-black leading-tight italic">
                                    Operator, the timer is constant. Do not fixate on a single incorrect bit. Move quickly to re-establish the connection.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>

                <footer className="p-4 bg-zinc-300 border-t-2 border-black shrink-0">
                    <button onClick={onClose} className="w-full py-4 bg-emerald-600 border-t-2 border-l-2 border-white/50 border-b-2 border-r-2 border-emerald-950 text-[10px] font-black uppercase italic text-white hover:bg-emerald-500 active:bg-emerald-700 transition-all shadow-lg">
                        ACKNOWLEDGE_PROTOCOLS
                    </button>
                </footer>
            </div>
        </div>
    );
};

const ManualPoint: React.FC<{ title: string; desc: string; color: string }> = ({ title, desc, color }) => (
    <div className="space-y-2 group">
        <h4 className={`text-[9px] font-black ${color} uppercase tracking-[0.3em] italic flex items-center gap-2`}>
            <span className={`w-1.5 h-1.5 rounded-full ${color.replace('text-', 'bg-')} group-hover:scale-150 transition-transform`}></span>
            {title}
        </h4>
        <p className="text-[10px] md:text-xs text-zinc-300 font-bold uppercase tracking-wide leading-relaxed pl-3 border-l border-zinc-800">
            {desc}
        </p>
    </div>
);

export default HangmanPage;