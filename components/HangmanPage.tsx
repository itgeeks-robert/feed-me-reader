
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { XIcon, RadioIcon, BoltIcon, SparklesIcon, VoidIcon, ShieldCheckIcon, GlobeAltIcon, ControllerIcon, FireIcon, CpuChipIcon } from './icons';
import { HANGMAN_DATA, HangmanWord } from '../services/hangmanData';
import { saveHighScore, getHighScores } from '../services/highScoresService';
import { useLocalStorage } from '../hooks/useLocalStorage';

const MAX_MISTAKES = 7;
const INITIAL_TIME = 60; 

type GameState = 'LOBBY' | 'ROUND_TRANSITION' | 'PLAYING' | 'WON' | 'LOST' | 'FINAL_RESULTS';
type CategoryFilter = 'ALL' | 'FILM' | 'MUSIC' | 'SPORT' | 'TECH' | 'FASHION' | 'GAMING';

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

const MainframeBackground: React.FC<{ level: number }> = ({ level }) => {
    const themeIndex = Math.min(level - 1, LEVEL_THEMES.length - 1);
    const theme = LEVEL_THEMES[themeIndex];
    const speed = Math.max(1, 10 - level); 

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-zinc-950 transition-colors duration-1000">
            <div 
                className="absolute inset-0 opacity-10 transition-colors duration-1000"
                style={{ 
                    backgroundImage: `linear-gradient(${theme.color}22 1px, transparent 1px), linear-gradient(90deg, ${theme.color}22 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                    animation: `pulse ${speed}s infinite ease-in-out`
                }} 
            />
            <div 
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 20px, ${theme.color} 20px, ${theme.color} 21px)`,
                    backgroundSize: '100% 40px',
                    animation: `scanline ${speed * 2}s linear infinite`
                }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
        </div>
    );
};

const UrgencyOverlay: React.FC<{ timeLeft: number }> = ({ timeLeft }) => {
    const isCritical = timeLeft <= 10 && timeLeft > 0;
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <div className={`absolute inset-0 bg-red-600/20 transition-opacity duration-1000 ${isCritical ? 'opacity-100' : 'opacity-0'}`} />
            {isCritical && (
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <span className="text-[40vw] font-black text-red-600 italic animate-pulse">{timeLeft}</span>
                </div>
            )}
        </div>
    );
};

const TelemetryHub: React.FC<{ level: number; timeLeft: number; color: string; isLandscape?: boolean }> = ({ level, timeLeft, color, isLandscape }) => (
    <div className={`flex items-stretch gap-px bg-zinc-800 border-2 border-black rounded-xl overflow-hidden shadow-2xl ${isLandscape ? 'w-full' : ''}`}>
        <div className="flex flex-col items-center flex-1 px-4 py-1.5 md:px-6 md:py-2 bg-zinc-900 border-r-2 border-black">
            <span className="text-[7px] md:text-[8px] text-zinc-500 font-black uppercase leading-none mb-1">Sector</span>
            <span className="text-base md:text-xl font-black italic transition-colors duration-500" style={{ color }}>0{level}</span>
        </div>
        <div className="flex flex-col items-center flex-1 px-4 py-1.5 md:px-6 md:py-2 bg-zinc-900">
            <span className="text-[7px] md:text-[8px] text-zinc-500 font-black uppercase leading-none mb-1">Time</span>
            <span className={`text-base md:text-xl font-black italic font-mono ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timeLeft}s</span>
        </div>
    </div>
);

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
    // PERSISTENT STATE: Using useLocalStorage to ensure rotation doesn't reset the game
    const [gameState, setGameState] = useLocalStorage<GameState>('void_hangman_state', 'LOBBY');
    const [category, setCategory] = useLocalStorage<CategoryFilter>('void_hangman_category', 'ALL');
    const [usedWords, setUsedWords] = useLocalStorage<Set<string>>('void_hangman_used_words', () => new Set());
    const [level, setLevel] = useLocalStorage<number>('void_hangman_level', 1);
    const [target, setTarget] = useLocalStorage<HangmanWord | null>('void_hangman_target', null);
    const [guessedLetters, setGuessedLetters] = useLocalStorage<Set<string>>('void_hangman_guesses', () => new Set());
    const [mistakes, setMistakes] = useLocalStorage<number>('void_hangman_mistakes', 0);
    const [timeLeft, setTimeLeft] = useLocalStorage<number>('void_hangman_time', INITIAL_TIME);
    
    // Transient UI states
    const [isShocking, setIsShocking] = useState(false);
    const [initials, setInitials] = useState("");
    const timerRef = useRef<number | null>(null);

    const handleSaveScore = () => {
        saveHighScore('hangman', {
            name: initials.toUpperCase() || "???",
            score: level,
            displayValue: `LVL ${level}`,
            date: new Date().toISOString()
        });
        setGameState('LOBBY');
        // Clear session
        setTarget(null);
        setGuessedLetters(new Set());
        setMistakes(0);
        setTimeLeft(INITIAL_TIME);
    };

    const startRound = useCallback((lvl: number) => {
        const difficulty = (lvl <= 3 ? 1 : lvl <= 7 ? 2 : 3);
        const pool = HANGMAN_DATA.filter(d => 
            d.difficulty <= difficulty && 
            CATEGORY_MAP[category].includes(d.category) && 
            !usedWords.has(d.word)
        );
        const random = (pool.length > 0 ? pool : HANGMAN_DATA)[Math.floor(Math.random() * (pool.length || HANGMAN_DATA.length))];
        
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
    }, [category, usedWords, setUsedWords, setTarget, setGuessedLetters, setMistakes, setTimeLeft, setGameState]);

    const handleGuess = useCallback((letter: string) => {
        if (gameState !== 'PLAYING' || !target || guessedLetters.has(letter)) return;
        
        const newGuessed = new Set(guessedLetters);
        newGuessed.add(letter);
        setGuessedLetters(newGuessed);

        if (!target.word.toUpperCase().includes(letter)) {
            const nextMistakes = mistakes + 1;
            setMistakes(nextMistakes);
            setIsShocking(true);
            setTimeout(() => setIsShocking(false), 200);
            
            if (nextMistakes >= MAX_MISTAKES) {
                setGameState('LOST');
            }
        } else {
            const isWon = target.word.toUpperCase().split('').every(char => 
                char === ' ' || !/[A-Z]/.test(char) || newGuessed.has(char)
            );
            if (isWon) setGameState('WON');
        }
    }, [gameState, target, guessedLetters, mistakes, setGuessedLetters, setMistakes, setGameState]);

    useEffect(() => {
        if (gameState === 'PLAYING') {
            timerRef.current = window.setInterval(() => {
                setTimeLeft(t => {
                    if (t <= 1) { 
                        setGameState('LOST'); 
                        return 0; 
                    }
                    return t - 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [gameState, setGameState, setTimeLeft]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { 
            if (/^[a-zA-Z]$/.test(e.key)) handleGuess(e.key.toUpperCase()); 
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleGuess]);

    const themeIndex = Math.min(level - 1, LEVEL_THEMES.length - 1);
    const themeColor = LEVEL_THEMES[themeIndex].color;

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
                        <button onClick={() => { setUsedWords(new Set()); setLevel(1); startRound(1); }} className="w-full py-6 bg-white text-black font-black uppercase italic rounded-2xl shadow-xl text-xl active:scale-95 transition-all">Solo_Link</button>
                        <button onClick={onBackToHub} className="text-zinc-600 font-bold uppercase tracking-[0.4em] text-[10px] pt-4 block w-full italic">Abort_System</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <main className={`w-full h-full flex flex-col overflow-hidden font-mono text-white transition-all duration-75 relative ${isShocking ? 'bg-red-900/40' : ''}`}>
            <style>{`
                @keyframes pulse { 0%, 100% { opacity: 0.1; } 50% { opacity: 0.2; } }
                @keyframes scanline { 0% { transform: translateY(0); } 100% { transform: translateY(40px); } }
            `}</style>

            <MainframeBackground level={level} />
            <UrgencyOverlay timeLeft={timeLeft} />

            {/* Clean Outer Frame */}
            <div className="absolute inset-0 border-[8px] md:border-[16px] border-zinc-900 pointer-events-none z-50">
                <div className="absolute inset-0 border-2 border-white/5" />
            </div>
            
            {/* Split View Container */}
            <div className="flex-1 flex flex-col landscape:flex-row items-center justify-between p-4 md:p-8 landscape:p-10 relative z-10 overflow-hidden">
                
                {/* Game Logic Area (Left Side in Landscape) */}
                <div className="w-full landscape:w-[50%] flex flex-col items-center justify-center gap-4 landscape:gap-8 landscape:h-full py-4">
                    
                    {/* Hangman Graphic - Large and centered on left */}
                    <HieroglyphicHangmanVisual mistakes={mistakes} isShaking={isShocking} level={level} />
                    
                    {/* Word Display - Improved logic to keep words together on wrap */}
                    <div className="text-[clamp(1.5rem,8vw,4rem)] landscape:text-[clamp(1.5rem,6vw,3.5rem)] font-black tracking-[0.2em] text-white italic whitespace-pre-wrap leading-tight font-horror drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] flex flex-wrap justify-center text-center px-4 gap-y-4">
                        {target?.word.toUpperCase().split(' ').map((word, wordIdx) => (
                            <span key={wordIdx} className="inline-flex whitespace-nowrap">
                                {word.split('').map((char, charIdx) => {
                                    if (!/[A-Z]/.test(char)) return <span key={charIdx}>{char}</span>;
                                    const isGuessed = guessedLetters.has(char);
                                    return (
                                        <span key={charIdx} className={`relative min-w-[0.8em] transition-all duration-300 ${isGuessed ? "text-white" : "text-white/60"}`}>
                                            {isGuessed ? char : "_"}
                                            {!isGuessed && <div className="absolute bottom-1 left-0 right-0 h-1 bg-white/20 rounded-full" />}
                                        </span>
                                    );
                                })}
                                {/* Add a spacer if not the last word */}
                                {wordIdx < target.word.split(' ').length - 1 && <span className="w-[0.5em] flex-shrink-0">&nbsp;</span>}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Right Side Column (Landscape): Data & Inputs */}
                <div className="w-full landscape:w-[50%] flex flex-col gap-4 md:gap-6 landscape:h-full landscape:justify-center relative z-20">
                    
                    {/* Telemetry and Info - Grouped at top of right column in landscape */}
                    <div className="flex flex-col gap-3 w-full max-w-sm mx-auto">
                        <div className="landscape:flex items-center gap-3">
                            <TelemetryHub level={level} timeLeft={timeLeft} color={themeColor} isLandscape={true} />
                        </div>
                        
                        <div className="flex items-center justify-center px-6 py-2 bg-black/40 border-2 rounded-full transition-colors duration-500 shadow-xl border-white/5" style={{ borderColor: `${themeColor}22` }}>
                            <span className="text-[9px] font-black uppercase tracking-[0.4em] italic transition-colors duration-500" style={{ color: themeColor }}>
                                {target?.category} // DATA_NODE
                            </span>
                        </div>
                        
                        <LinkIntegrityCounter mistakes={mistakes} level={level} />
                    </div>

                    {/* Keyboard - Optimized for bottom of right column in landscape */}
                    <div className="w-full bg-zinc-900/40 landscape:bg-void-900/40 backdrop-blur-2xl border-t-2 border-black/40 landscape:border-2 landscape:border-white/5 p-3 md:p-6 landscape:p-6 rounded-2xl flex flex-col gap-2 md:gap-4 shrink-0 shadow-2xl">
                        {KEYBOARD_ROWS.map((row, rowIndex) => (
                            <div key={rowIndex} className="flex justify-center gap-1 md:gap-3 landscape:gap-2.5">
                                {row.map(char => {
                                    const isGuessed = guessedLetters.has(char);
                                    const isCorrect = target?.word.toUpperCase().includes(char);
                                    return (
                                        <button
                                            key={char}
                                            onClick={() => handleGuess(char)}
                                            disabled={isGuessed}
                                            className={`flex-1 max-w-[80px] h-10 md:h-16 landscape:h-12 rounded-lg md:rounded-xl font-black text-xs md:text-2xl landscape:text-lg transition-all active:scale-90
                                                ${!isGuessed 
                                                    ? 'bg-zinc-800 text-white shadow-[0_4px_0_black] border-2 border-white/5 hover:bg-zinc-700' 
                                                    : isCorrect 
                                                        ? 'bg-emerald-600/20 text-emerald-400 border-2 border-emerald-500/30 opacity-40' 
                                                        : 'bg-red-600/20 text-red-500 border-2 border-red-500/30 opacity-20'}`}
                                        >
                                            {char}
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                    <div className="h-[env(safe-area-inset-bottom)] landscape:hidden" />
                </div>
            </div>

            {/* Overlays */}
            {(gameState === 'WON' || gameState === 'LOST') && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
                    <div className="w-full max-w-sm bg-zinc-900 border-4 border-white/10 p-8 md:p-10 rounded-[3rem] text-center shadow-2xl relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-full h-2 ${gameState === 'WON' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <h2 className={`text-4xl font-black italic uppercase tracking-tighter mb-6 ${gameState === 'WON' ? 'text-emerald-500' : 'text-red-500'}`}>
                            {gameState === 'WON' ? 'DECODED' : 'SIG_LOSS'}
                        </h2>
                        <div className="bg-black/60 p-6 rounded-3xl border border-white/5 text-left mb-8">
                            <p className="text-[10px] text-zinc-500 font-black uppercase mb-2">Resultant_String</p>
                            <p className="text-2xl font-black text-white italic tracking-widest uppercase">{target?.word}</p>
                            <p className="text-[10px] text-zinc-600 font-mono mt-4 italic border-t border-white/5 pt-2">{target?.hint}</p>
                        </div>
                        {gameState === 'WON' ? (
                            <button onClick={() => { setLevel(l => l + 1); startRound(level + 1); }} className="w-full py-5 bg-emerald-600 text-white font-black uppercase italic rounded-full text-lg shadow-xl active:scale-95 transition-all">Advance_Node</button>
                        ) : (
                            <div className="space-y-4">
                                <input autoFocus maxLength={3} value={initials} onChange={e => setInitials(e.target.value.toUpperCase())} className="bg-black/50 border-2 border-red-500 text-white rounded-xl px-4 py-4 text-center text-3xl font-black w-32 outline-none uppercase italic" placeholder="???" />
                                <button onClick={handleSaveScore} className="w-full py-5 bg-white text-black font-black uppercase italic rounded-full text-lg shadow-xl active:scale-95 transition-all">Transmit_Log</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
};

export default HangmanPage;
