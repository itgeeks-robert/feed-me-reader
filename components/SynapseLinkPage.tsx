
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { XIcon, ArrowPathIcon, VoidIcon, SparklesIcon } from './icons';
import { saveHighScore, getHighScores, HighScoreEntry } from '../services/highScoresService';
import HighScoreTable from './HighScoreTable';

interface SynapseGroup {
    words: string[];
    connection: string;
    color: string;
}

interface Wall {
    id: number;
    groups: SynapseGroup[];
}

const WALLS: Wall[] = [
    {
        id: 1,
        groups: [
            { words: ["PAGER", "RADIO", "SIGNAL", "BEACON"], connection: "TRANSMISSION DEVICES", color: "bg-emerald-600/40 border-emerald-500" },
            { words: ["VOID", "VACUUM", "ABYSS", "CHASM"], connection: "EMPTY SPACES", color: "bg-pulse-600/40 border-pulse-500" },
            { words: ["ARRAY", "STACK", "QUEUE", "BUFFER"], connection: "DATA STRUCTURES", color: "bg-neon-500/40 border-neon-400" },
            { words: ["DETECTIVE", "GRIFTER", "MOLE", "SENTINEL"], connection: "NOIR ARCHETYPES", color: "bg-yellow-600/40 border-yellow-500" }
        ]
    },
    {
        id: 2,
        groups: [
            { words: ["MARCH", "MAY", "JULY", "AUGUST"], connection: "MONTHS NAMED AFTER PEOPLE/TITLES", color: "bg-emerald-600/40 border-emerald-500" },
            { words: ["BRIDGE", "GUM", "CROWN", "ROOT"], connection: "DENTAL TERMS", color: "bg-pulse-600/40 border-pulse-500" },
            { words: ["BIT", "NIBBLE", "BYTE", "WORD"], connection: "COMPUTING UNITS", color: "bg-neon-500/40 border-neon-400" },
            { words: ["CLUB", "DIAMOND", "HEART", "SPADE"], connection: "CARD SUITS", color: "bg-yellow-600/40 border-yellow-500" }
        ]
    },
    {
        id: 3,
        groups: [
            { words: ["BREAD", "MONEY", "DOUGH", "SCRATCH"], connection: "SLANG FOR CASH", color: "bg-emerald-600/40 border-emerald-500" },
            { words: ["LOAF", "BUN", "ROLL", "BLOOMER"], connection: "TYPES OF BREAD", color: "bg-pulse-600/40 border-pulse-500" },
            { words: ["QUARTZ", "CROWN", "PLATE", "FLINT"], connection: "TYPES OF GLASS", color: "bg-neon-500/40 border-neon-400" },
            { words: ["ROULETTE", "POOL", "CRAPS", "BINGO"], connection: "GAMBLING GAMES", color: "bg-yellow-600/40 border-yellow-500" }
        ]
    }
];

const SynapseLinkPage: React.FC<{ onBackToHub: () => void; onComplete?: () => void }> = ({ onBackToHub, onComplete }) => {
    const [wall, setWall] = useState<Wall | null>(null);
    const [shuffledWords, setShuffledWords] = useState<string[]>([]);
    const [selection, setSelection] = useState<string[]>([]);
    const [solvedGroups, setSolvedGroups] = useState<SynapseGroup[]>([]);
    const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
    const [mistakes, setMistakes] = useState(0);
    const [shakeIndex, setShakeIndex] = useState(false);
    const [time, setTime] = useState(0);
    const [initials, setInitials] = useState("");
    const [isPosted, setIsPosted] = useState(false);

    const MISTAKE_LIMIT = 3;

    useEffect(() => {
        const randomWall = WALLS[Math.floor(Math.random() * WALLS.length)];
        const allWords = randomWall.groups.flatMap(g => g.words);
        setWall(randomWall);
        setShuffledWords([...allWords].sort(() => Math.random() - 0.5));
        
        const timer = setInterval(() => {
            if (gameState === 'playing') setTime(t => t + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [gameState]);

    const handleNodeClick = (word: string) => {
        if (gameState !== 'playing' || shakeIndex) return;

        if (selection.includes(word)) {
            setSelection(prev => prev.filter(w => w !== word));
            return;
        }

        if (selection.length === 4) return;

        const newSelection = [...selection, word];
        setSelection(newSelection);

        if (newSelection.length === 4) {
            checkSelection(newSelection);
        }
    };

    const checkSelection = (words: string[]) => {
        if (!wall) return;

        const groupMatch = wall.groups.find(g => 
            words.every(w => g.words.includes(w))
        );

        if (groupMatch) {
            // Correct Group
            const newSolved = [...solvedGroups, groupMatch];
            setSolvedGroups(newSolved);
            setShuffledWords(prev => prev.filter(w => !words.includes(w)));
            setSelection([]);

            if (newSolved.length === 4) {
                setGameState('won');
            }
        } else {
            // Wrong Group
            setShakeIndex(true);
            setTimeout(() => {
                setShakeIndex(false);
                setSelection([]);
                // Only count mistakes if 2 groups remain (Only Connect rules)
                if (solvedGroups.length === 2) {
                    setMistakes(m => {
                        const next = m + 1;
                        if (next >= MISTAKE_LIMIT) setGameState('lost');
                        return next;
                    });
                }
            }, 600);
        }
    };

    const handleSaveScore = () => {
        if (isPosted) return;
        saveHighScore('synapse_link', {
            name: initials.toUpperCase() || "???",
            score: time,
            displayValue: `${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}`,
            date: new Date().toISOString()
        }, true);
        setIsPosted(true);
        onBackToHub();
    };

    return (
        <main className="w-full h-full bg-void-950 flex flex-col items-center p-4 md:p-8 overflow-y-auto scrollbar-hide pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
            <style>{`
                @keyframes grid-shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
                .animate-grid-shake { animation: grid-shake 0.15s ease-in-out infinite; }
                .node-active { border-color: #06b6d4; box-shadow: 0 0 15px rgba(6, 182, 212, 0.4); transform: scale(1.02); }
            `}</style>

            <header className="w-full max-w-2xl flex justify-between items-center mb-8 bg-zinc-900/50 p-4 rounded-3xl border border-white/5 shadow-xl flex-shrink-0">
                <button onClick={onBackToHub} className="p-2 bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors">
                    <XIcon className="w-6 h-6" />
                </button>
                <div className="text-center">
                    <span className="text-[10px] font-black uppercase text-pulse-500 tracking-[0.4em] block mb-1">Connecting Wall</span>
                    <h1 className="text-xl md:text-2xl font-black italic uppercase text-white tracking-tighter leading-none">SYNAPSE LINK</h1>
                </div>
                <div className="bg-black/40 px-4 py-2 rounded-xl border border-white/5 min-w-[70px]">
                    <span className="text-[8px] font-black text-zinc-500 uppercase block tracking-widest leading-none mb-1">Time</span>
                    <span className="text-sm font-black font-mono leading-none">{Math.floor(time / 60)}:{String(time % 60).padStart(2, '0')}</span>
                </div>
            </header>

            <div className="w-full max-w-2xl space-y-3">
                {/* SOLVED GROUPS */}
                {solvedGroups.map((group, idx) => (
                    <div key={idx} className={`w-full p-4 rounded-2xl border-2 flex flex-col items-center justify-center text-center animate-fade-in ${group.color}`}>
                        <div className="flex flex-wrap justify-center gap-4 mb-2">
                            {group.words.map(w => <span key={w} className="text-sm font-black text-white italic uppercase tracking-widest">{w}</span>)}
                        </div>
                        <p className="text-[9px] font-black text-white/60 uppercase tracking-[0.3em] font-mono">{group.connection}</p>
                    </div>
                ))}

                {/* ACTIVE GRID */}
                {gameState !== 'won' && (
                    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 transition-all ${shakeIndex ? 'animate-grid-shake' : ''}`}>
                        {shuffledWords.map((word) => {
                            const isSelected = selection.includes(word);
                            return (
                                <button
                                    key={word}
                                    onClick={() => handleNodeClick(word)}
                                    className={`aspect-square sm:aspect-video flex items-center justify-center p-2 rounded-xl border-2 text-[10px] sm:text-xs font-black uppercase italic tracking-tighter transition-all break-words leading-tight
                                        ${isSelected ? 'node-active bg-cyan-900/20 text-cyan-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white shadow-lg active:scale-95'}`}
                                >
                                    {word}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* MISTAKES INDICATOR */}
            {solvedGroups.length === 2 && gameState === 'playing' && (
                <div className="mt-8 flex flex-col items-center gap-3">
                    <span className="text-[10px] font-black text-pulse-500 uppercase tracking-widest italic">Critical State: {MISTAKE_LIMIT - mistakes} Attempts Remain</span>
                    <div className="flex gap-2">
                        {[...Array(MISTAKE_LIMIT)].map((_, i) => (
                            <div key={i} className={`w-3 h-3 rounded-full border-2 ${i < mistakes ? 'bg-zinc-800 border-zinc-700' : 'bg-pulse-500 border-pulse-400 shadow-[0_0_10px_#e11d48]'}`}></div>
                        ))}
                    </div>
                </div>
            )}

            {/* GAME OVER STATES */}
            {(gameState === 'won' || gameState === 'lost') && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-6 text-center">
                    <div className={`max-w-sm w-full bg-zinc-900 p-10 rounded-[3rem] border-4 ${gameState === 'won' ? 'border-emerald-500' : 'border-pulse-500'} shadow-[0_0_100px_rgba(0,0,0,0.5)]`}>
                        <div className={`mb-6 mx-auto w-20 h-20 rounded-full flex items-center justify-center border ${gameState === 'won' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-pulse-500/10 border-pulse-500/30'}`}>
                            <VoidIcon className={`w-12 h-12 ${gameState === 'won' ? 'text-emerald-500' : 'text-pulse-500'}`} />
                        </div>
                        <h2 className={`text-4xl font-black italic uppercase tracking-tighter mb-4 ${gameState === 'won' ? 'text-emerald-500' : 'text-pulse-500'}`}>
                            {gameState === 'won' ? 'LINK SECURED' : 'LINK SEVERED'}
                        </h2>
                        
                        {gameState === 'won' ? (
                            <div className="mb-8">
                                <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-4">Register Operator ID</p>
                                <input autoFocus maxLength={3} value={initials} onChange={e => setInitials(e.target.value.toUpperCase())}
                                    className="bg-black/50 border-2 border-emerald-500 text-emerald-500 rounded-xl px-4 py-3 text-center text-2xl font-black w-32 outline-none uppercase italic mb-6" placeholder="???" />
                                <button onClick={handleSaveScore} className="w-full py-5 bg-emerald-600 text-white font-black text-xl italic uppercase rounded-full hover:scale-105 transition-all shadow-xl">Transmit Success</button>
                            </div>
                        ) : (
                            <>
                                <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-10 leading-relaxed italic">Synaptic pathway overloaded.<br/>Sequence synchronization failed.</p>
                                <button onClick={() => window.location.reload()} className="w-full py-5 bg-pulse-600 text-white font-black text-xl italic uppercase rounded-full hover:scale-105 transition-all shadow-xl">Restart Sync</button>
                            </>
                        )}
                        <button onClick={onBackToHub} className="mt-4 text-zinc-600 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors italic underline decoration-zinc-800">Return to Terminal</button>
                    </div>
                </div>
            )}
        </main>
    );
};

export default SynapseLinkPage;
