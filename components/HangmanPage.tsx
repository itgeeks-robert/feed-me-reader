
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { XIcon, RadioIcon, BoltIcon, SparklesIcon, VoidIcon, ShieldCheckIcon, GlobeAltIcon, ControllerIcon, FireIcon, CpuChipIcon, ArrowPathIcon, ExclamationTriangleIcon, BookOpenIcon } from './icons';
import { VOID_DATA, CategoryNode } from '../voidDataArchive';
import { saveHighScore, getHighScores } from '../services/highScoresService';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { NEON_IMAGES } from '../neonSignalAssets';

const MAX_MISTAKES = 7;
const INITIAL_TIME = 60; 

type GameState = 'LOBBY' | 'PLAYING' | 'WON' | 'LOST' | 'FINAL_RESULTS';

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
    const [gameState, setGameState] = useLocalStorage<GameState>('void_hangman_state', 'LOBBY');
    const [activeCategoryId, setCategoryId] = useLocalStorage<string>('void_hangman_cat_id', 'ALL');
    const [usedWords, setUsedWords] = useLocalStorage<Set<string>>('void_hangman_used_words', () => new Set());
    const [level, setLevel] = useLocalStorage<number>('void_hangman_level', 1);
    const [target, setTarget] = useLocalStorage<{ word: string, category: string, hint: string } | null>('void_hangman_target', null);
    const [guessedLetters, setGuessedLetters] = useLocalStorage<Set<string>>('void_hangman_guesses', () => new Set());
    const [mistakes, setMistakes] = useLocalStorage<number>('void_hangman_mistakes', 0);
    const [timeLeft, setTimeLeft] = useLocalStorage<number>('void_hangman_time', INITIAL_TIME);
    
    const [isShocking, setIsShocking] = useState(false);
    const [initials, setInitials] = useState("");
    const [showHelp, setShowHelp] = useState(false);
    const [showSeverConfirm, setShowSeverConfirm] = useState(false);
    const timerRef = useRef<number | null>(null);

    const startRound = useCallback((lvl: number, catId?: string) => {
        const categoryIdToUse = catId || activeCategoryId;
        let pool: { word: string, catName: string }[] = [];
        
        if (categoryIdToUse === 'ALL') {
            pool = VOID_DATA
                .filter(c => c.id !== 'actions_sounds') // Filter out non-text category
                .flatMap(c => c.words.map(w => ({ word: w, catName: c.name })));
        } else {
            const cat = VOID_DATA.find(c => c.id === categoryIdToUse);
            if (cat) pool = cat.words.map(w => ({ word: w, catName: cat.name }));
        }

        // Filter out used words if possible
        let candidates = pool.filter(p => !usedWords.has(p.word));
        if (candidates.length === 0) {
            setUsedWords(new Set());
            candidates = pool;
        }

        // Shuffle and pick
        const choice = candidates[Math.floor(Math.random() * candidates.length)];
        
        setUsedWords(prev => { const next = new Set(prev); next.add(choice.word); return next; });
        setTarget({ 
            word: choice.word.toUpperCase(), 
            category: choice.catName, 
            hint: `SYNCHRONIZED ARCHIVE NODE: ${choice.catName}` 
        });
        setGuessedLetters(new Set());
        setMistakes(0);
        setTimeLeft(INITIAL_TIME);
        setGameState('PLAYING');
    }, [activeCategoryId, usedWords, setUsedWords, setTarget, setGuessedLetters, setMistakes, setTimeLeft, setGameState]);

    const handleGuess = useCallback((letter: string) => {
        if (gameState !== 'PLAYING' || !target || guessedLetters.has(letter)) return;
        
        const newGuessed = new Set(guessedLetters);
        newGuessed.add(letter);
        setGuessedLetters(newGuessed);

        if (!target.word.includes(letter)) {
            const nextMistakes = mistakes + 1;
            setMistakes(nextMistakes);
            setIsShocking(true);
            setTimeout(() => setIsShocking(false), 200);
            if (nextMistakes >= MAX_MISTAKES) setGameState('LOST');
        } else {
            const isWon = target.word.split('').every(char => 
                char === ' ' || !/[A-Z]/.test(char) || newGuessed.has(char)
            );
            if (isWon) setGameState('WON');
        }
    }, [gameState, target, guessedLetters, mistakes, setGuessedLetters, setMistakes, setGameState]);

    useEffect(() => {
        if (gameState === 'PLAYING') {
            timerRef.current = window.setInterval(() => {
                setTimeLeft(t => { 
                    if (t <= 1) { setGameState('LOST'); return 0; } 
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

    const handleSaveScore = () => {
        saveHighScore('hangman', { 
            name: initials.toUpperCase() || "???", 
            score: level, 
            displayValue: `SECTOR ${level}`, 
            date: new Date().toISOString() 
        });
        setGameState('LOBBY'); 
        setTarget(null); 
        setGuessedLetters(new Set()); 
        setMistakes(0); 
        setTimeLeft(INITIAL_TIME);
    };

    const filteredCategories = useMemo(() => VOID_DATA.filter(cat => cat.id !== 'actions_sounds'), []);

    const themeIndex = Math.min(level - 1, LEVEL_THEMES.length - 1);
    const themeColor = LEVEL_THEMES[themeIndex].color;

    if (gameState === 'LOBBY') {
        return (
            <div className="w-full h-full bg-zinc-950 p-6 font-mono overflow-y-auto scrollbar-hide flex flex-col animate-fade-in pb-32">
                <header className="flex justify-between items-center mb-6 md:mb-12 shrink-0 mt-[var(--safe-top)]">
                    <button onClick={onBackToHub} className="p-3 md:p-4 bg-zinc-900 rounded-2xl border border-white/10 active:scale-90 transition-all shadow-lg">
                        <XIcon className="w-5 h-5 md:w-6 md:h-6 text-white"/>
                    </button>
                    <div className="text-right">
                        <span className="text-[9px] md:text-[10px] text-cyan-400 font-black tracking-widest uppercase italic block mb-1">Protocol: SIGNAL_BREACH</span>
                        <h1 className="text-xl md:text-3xl font-black italic text-white tracking-tighter leading-none uppercase">SECTOR_SELECT</h1>
                    </div>
                </header>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8 max-w-4xl mx-auto w-full">
                    {filteredCategories.map((cat) => (
                        <button 
                            key={cat.id} 
                            onClick={() => { setCategoryId(cat.id); setLevel(1); startRound(1, cat.id); }}
                            className="relative w-full h-36 md:h-56 rounded-2xl md:rounded-[3rem] bg-black border-2 border-zinc-800 overflow-hidden hover:border-cyan-500 transition-all active:scale-95 group shadow-lg"
                        >
                            <div className="absolute inset-0">
                                <img 
                                    src={cat.img} 
                                    alt="" 
                                    className="w-full h-full object-cover opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-70 group-hover:scale-110 transition-all duration-1000 ease-out"
                                />
                                <div className="absolute inset-0 bg-cyan-950/20 mix-blend-color" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                            </div>
                            <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 text-left z-20">
                                <span className="text-[7px] md:text-[10px] text-cyan-400 font-black tracking-[0.3em] uppercase italic block mb-1 md:mb-2 drop-shadow-md">
                                    {cat.words.length} NODES DETECTED
                                </span>
                                <div className="text-lg md:text-3xl font-black text-white italic uppercase tracking-tighter leading-none drop-shadow-2xl">
                                    {cat.name}
                                </div>
                            </div>
                        </button>
                    ))}
                    
                    <button 
                        onClick={() => { setCategoryId('ALL'); setLevel(1); startRound(1, 'ALL'); }} 
                        className="relative w-full h-36 md:h-56 rounded-2xl md:rounded-[3rem] bg-black border-2 border-pulse-500 overflow-hidden active:scale-95 shadow-lg group"
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
                        <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 text-left z-20">
                            <span className="text-[7px] md:text-[10px] text-pulse-500 font-black tracking-[0.3em] uppercase italic block mb-1 md:mb-2 drop-shadow-md">MIXED_FREQUENCY_SYNC</span>
                            <div className="text-lg md:text-3xl font-black text-white italic uppercase tracking-tighter leading-none drop-shadow-2xl">ALL SECTORS</div>
                        </div>
                    </button>
                </div>
                
                <div className="mt-8 md:mt-16 flex flex-col items-center gap-6 shrink-0">
                    <button onClick={() => setShowHelp(true)} className="flex items-center gap-3 px-8 py-3 bg-zinc-900 border border-white/5 rounded-2xl text-[9px] md:text-[10px] font-black text-zinc-500 uppercase italic tracking-[0.4em] hover:text-white transition-all shadow-xl">
                        <BookOpenIcon className="w-4 h-4" />
                        <span>Tactical_Manual</span>
                    </button>
                </div>
                {showHelp && <TacticalManual onClose={() => setShowHelp(false)} />}
            </div>
        );
    }

    return (
        <main className={`w-full h-full flex flex-col overflow-hidden font-mono text-white transition-all duration-75 relative ${isShocking ? 'bg-red-900/40' : ''}`}>
            <MainframeBackground level={level} isUrgent={timeLeft <= 30} urgencyType={timeLeft <= 10 ? 'RED' : timeLeft <= 30 ? 'AMBER' : 'NONE'} />
            <UrgencyOverlay timeLeft={timeLeft} />
            <div className="absolute inset-0 border-[4px] md:border-[16px] border-zinc-900 pointer-events-none z-50"><div className="absolute inset-0 border-2 border-white/5" /></div>
            
            <div className="flex-1 flex flex-col landscape:flex-row items-center justify-between p-4 md:p-8 landscape:p-6 relative z-10 overflow-hidden">
                
                <div className="w-full landscape:w-[50%] flex flex-col items-center justify-center gap-4 landscape:gap-2 landscape:h-full py-2 shrink-0">
                    <HieroglyphicHangmanVisual mistakes={mistakes} isShaking={isShocking} level={level} />
                    
                    <div className="text-[clamp(1.2rem,6vw,3.5rem)] landscape:text-[clamp(1rem,4vw,2.5rem)] font-black tracking-[0.2em] text-white italic whitespace-pre-wrap leading-tight font-horror drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] flex flex-wrap justify-center text-center px-4 gap-y-2 landscape:gap-y-1">
                        {target?.word.split(' ').map((word, wordIdx) => (
                            <span key={wordIdx} className="inline-flex whitespace-nowrap">
                                {word.split('').map((char, charIdx) => {
                                    if (!/[A-Z]/.test(char)) return <span key={charIdx}>{char}</span>;
                                    const isGuessed = guessedLetters.has(char);
                                    return (
                                        <span key={charIdx} className={`relative min-w-[0.8em] transition-all duration-300 ${isGuessed ? "text-white" : "text-white/60"}`}>
                                            {isGuessed ? char : "_"}
                                            {!isGuessed && <div className="absolute bottom-1 left-0 right-0 h-0.5 md:h-1 bg-white/20 rounded-full" />}
                                        </span>
                                    );
                                })}
                                {wordIdx < target.word.split(' ').length - 1 && <span className="w-[0.5em] flex-shrink-0">&nbsp;</span>}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="w-full landscape:w-[50%] flex flex-col gap-4 md:gap-6 landscape:gap-2 landscape:h-full landscape:justify-center relative z-20 overflow-y-auto scrollbar-hide">
                    <div className="flex flex-col gap-3 landscape:gap-2 w-full max-sm mx-auto shrink-0">
                        <TelemetryHub level={level} timeLeft={timeLeft} color={themeColor} isLandscape={true} />
                        <div className="flex items-center justify-between px-6 py-2 landscape:py-1 bg-black/40 border-2 rounded-full transition-colors duration-500 shadow-xl border-white/5" style={{ borderColor: `${themeColor}22` }}>
                            <span className="text-[9px] font-black uppercase tracking-[0.4em] italic transition-colors duration-500 truncate max-w-[80%]" style={{ color: themeColor }}>
                                {target?.category} // ARCHIVE_NODE
                            </span>
                            <button onClick={() => setShowHelp(true)} className="text-zinc-500 hover:text-white transition-colors shrink-0"><BookOpenIcon className="w-4 h-4" /></button>
                        </div>
                        <LinkIntegrityCounter mistakes={mistakes} level={level} />
                    </div>

                    <div className="w-full bg-zinc-900/40 landscape:bg-void-900/40 backdrop-blur-2xl border-t-2 border-black/40 landscape:border-2 landscape:border-white/5 p-3 md:p-6 landscape:p-4 rounded-2xl flex flex-col gap-2 md:gap-4 landscape:gap-1.5 shrink-0 shadow-2xl">
                        {KEYBOARD_ROWS.map((row, rowIndex) => (
                            <div key={rowIndex} className="flex justify-center gap-1 md:gap-3 landscape:gap-1.5">
                                {row.map(char => {
                                    const isGuessed = guessedLetters.has(char); 
                                    const isCorrect = target?.word.includes(char);
                                    return (
                                        <button 
                                            key={char} 
                                            onClick={() => handleGuess(char)} 
                                            disabled={isGuessed} 
                                            className={`flex-1 max-w-[80px] h-10 md:h-16 landscape:h-10 rounded-lg md:rounded-xl font-black text-xs md:text-2xl landscape:text-sm transition-all active:scale-90 
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
                        <div className="flex justify-center mt-2 border-t border-white/5 pt-4 landscape:pt-2">
                            <button onClick={() => setShowSeverConfirm(true)} className="flex items-center gap-2 px-8 py-3 landscape:py-1.5 bg-red-950/20 border-2 border-pulse-600/50 text-pulse-500 font-black uppercase italic text-[10px] tracking-widest rounded-xl hover:bg-pulse-600 hover:text-white transition-all active:scale-95 shadow-lg"><XIcon className="w-4 h-4" /><span>Sever_Link</span></button>
                        </div>
                    </div>
                </div>
            </div>

            {showHelp && <TacticalManual onClose={() => setShowHelp(false)} />}

            {showSeverConfirm && (
                <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
                    <div className="bg-zinc-900 border-4 border-pulse-600 shadow-[0_0_80px_rgba(225,29,72,0.3)] w-full max-w-sm relative overflow-hidden flex flex-col rounded-[2.5rem]">
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
                        <div className="bg-black/60 p-6 rounded-3xl border border-white/5 text-left mb-8">
                            <p className="text-[10px] text-zinc-500 font-black uppercase mb-2">ARCHIVE_STRING</p>
                            <p className="text-2xl font-black text-white italic tracking-widest uppercase break-words">{target?.word}</p>
                            <p className="text-[10px] text-zinc-600 font-mono mt-4 italic border-t border-white/5 pt-2 uppercase">ZONE: {target?.category}</p>
                        </div>
                        {gameState === 'WON' ? (
                            <button onClick={() => { setLevel(l => l + 1); startRound(level); }} className="w-full py-5 bg-emerald-600 text-white font-black uppercase italic rounded-full text-lg shadow-xl active:scale-95 transition-all">Advance_Node</button>
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
                                <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Archive Recovery</h3>
                            </div>
                            <p className="text-[10px] md:text-xs text-zinc-400 uppercase font-black leading-relaxed tracking-wider mb-4 border-l-2 border-pulse-500/30 pl-4">
                                Breach the encrypted archive word before the terminal lock triggers. Synchronized with THE VOID master data.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <ManualPoint title="0x01_Vowel_Probing" desc="Begin with A, E, I, O, U. Most signal packets are structured around these primary frequency anchors." color="text-emerald-500" />
                            <ManualPoint title="0x02_High_Freq_Bits" desc="Prioritize R, S, T, L, N. These consonants appear at a significantly higher rate within standard data streams." color="text-emerald-500" />
                            <ManualPoint title="0x03_The_Mistake_Buffer" desc="You have a 7-bit mistake buffer. If the integrity bar reaches zero, the link is severed and session data is wiped." color="text-emerald-500" />
                            <ManualPoint title="0x04_Multiword_Logic" desc="Archive strings may contain spaces. These are pre-synchronized and do not require decryption bits." color="text-emerald-500" />
                        </div>

                        <div className="p-5 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl flex items-start gap-4">
                            <ExclamationTriangleIcon className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5 animate-pulse" />
                            <div>
                                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1 italic">Pro Tip: Sector Knowledge</p>
                                <p className="text-[8px] text-zinc-500 uppercase font-black leading-tight italic">
                                    Operator, use the Sector metadata to narrow the logical search space. Each category follows specific thematic patterns.
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
