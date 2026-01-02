import React, { useState, useEffect, useCallback, useRef } from 'react';
import { XIcon, VoidIcon, SparklesIcon, ArrowPathIcon, ListIcon, BookOpenIcon, ExclamationTriangleIcon } from './icons';
import { saveHighScore, getHighScores, HighScoreEntry } from '../services/highScoresService';
import { resilientFetch } from '../services/fetch';
import { ARCADE_RULES } from '../services/gameRules';
import HighScoreTable from './HighScoreTable';

const HeartIcon: React.FC<{ filled: boolean; animated?: boolean }> = ({ filled, animated }) => (
    <svg 
        className={`w-5 h-5 transition-all duration-500 ${filled ? 'text-pulse-500 drop-shadow-[0_0_8px_#e11d48]' : 'text-zinc-800'} ${animated && filled ? 'animate-pulse' : ''}`} 
        viewBox="0 0 24 24" 
        fill={filled ? "currentColor" : "none"} 
        stroke="currentColor" 
        strokeWidth="2"
    >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
);

interface SynapseGroup {
    words: string[];
    connection: string;
    color: string;
}

interface Wall {
    id: string | number;
    groups: SynapseGroup[];
}

const INTERNAL_WALLS: Wall[] = [
    {
        id: 'fallback_1',
        groups: [
            { words: ["PAGER", "RADIO", "SIGNAL", "BEACON"], connection: "TRANSMISSION DEVICES", color: "bg-emerald-600/40 border-emerald-500" },
            { words: ["VOID", "VACUUM", "ABYSS", "CHASM"], connection: "EMPTY SPACES", color: "bg-pulse-600/40 border-pulse-500" },
            { words: ["ARRAY", "STACK", "QUEUE", "BUFFER"], connection: "DATA STRUCTURES", color: "bg-neon-500/40 border-neon-400" },
            { words: ["DETECTIVE", "GRIFTER", "MOLE", "SENTINEL"], connection: "NOIR ARCHETYPES", color: "bg-yellow-600/40 border-yellow-500" }
        ]
    }
];

const COLORS = [
    "bg-yellow-600/40 border-yellow-500",
    "bg-emerald-600/40 border-emerald-500",
    "bg-pulse-600/40 border-pulse-500",
    "bg-purple-600/40 border-purple-500"
];

const NeuralNodeGraphic: React.FC = () => (
    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 bg-pulse-500/10 rounded-full animate-ping" />
        <div className="absolute inset-4 bg-pulse-500/20 rounded-full animate-pulse" />
        <div className="relative z-10 p-8 bg-zinc-900 rounded-[2rem] border-4 border-pulse-500 shadow-[0_0_30px_rgba(225,29,72,0.4)]">
            <ListIcon className="w-16 h-16 text-white" />
        </div>
        <div className="absolute -top-4 -left-4 text-[8px] font-mono text-pulse-500 uppercase tracking-widest animate-pulse font-black">SYNAPTIC_LINK_v2</div>
        <div className="absolute -bottom-4 -right-4 text-[8px] font-mono text-emerald-500 uppercase tracking-widest animate-pulse font-black">STATUS: ACTIVE</div>
    </div>
);

const SynapseLinkPage: React.FC<{ onBackToHub: () => void; onComplete?: () => void }> = ({ onBackToHub, onComplete }) => {
    const [wall, setWall] = useState<Wall | null>(null);
    const [shuffledWords, setShuffledWords] = useState<string[]>([]);
    const [selection, setSelection] = useState<string[]>([]);
    const [solvedGroups, setSolvedGroups] = useState<SynapseGroup[]>([]);
    const [gameState, setGameState] = useState<'loading' | 'idle' | 'playing' | 'won' | 'lost' | 'error'>('loading');
    const [showScores, setShowScores] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState("Establishing Uplink...");
    const [mistakes, setMistakes] = useState(0);
    const [shakeIndex, setShakeIndex] = useState(false);
    const [guessFeedback, setGuessFeedback] = useState<string | null>(null);
    const [time, setTime] = useState(0);
    const [initials, setInitials] = useState("");
    const [aiSummary, setAiSummary] = useState<string>("");
    const timerRef = useRef<number | null>(null);

    const MISTAKE_LIMIT = ARCADE_RULES.SYNAPSE_LINK.MAX_MISTAKES;

    useEffect(() => {
        if (gameState === 'idle') {
            const interval = setInterval(() => {
                setShowScores(prev => !prev);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [gameState]);

    const stopTimer = useCallback(() => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }, []);

    const initGame = useCallback((groups: SynapseGroup[]) => {
        const allWords = groups.flatMap(g => g.words);
        const shuffled = [...allWords];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setShuffledWords(shuffled);
        setSolvedGroups([]);
        setSelection([]);
        setMistakes(0);
        setGuessFeedback(null);
        setAiSummary("");
        setGameState('playing');
        setTime(0);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = window.setInterval(() => setTime(t => t + 1), 1000);
    }, []);

    useEffect(() => {
        return () => stopTimer();
    }, [stopTimer]);

    const extractConnectionsData = (html: string): SynapseGroup[] | null => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const groups: SynapseGroup[] = [];
        const uniqueWordSets = new Set<string>();
        
        const elements = Array.from(doc.querySelectorAll('h1, h2, h3, h4, p, li, strong, b, div'));
        
        for (let i = 0; i < elements.length; i++) {
            const el = elements[i];
            const text = el.textContent?.trim() || "";
            if (!text) continue;

            const commaParts = text.split(/,|\n/).map(p => p.trim()).filter(p => p.length > 0);
            
            if (commaParts.length === 4) {
                const isWordSet = commaParts.every(p => p.length >= 2 && p.length < 20);
                if (!isWordSet) continue;

                const words = commaParts.map(w => w.toUpperCase().replace(/[^A-Z0-9-]/g, ''));
                const wordKey = [...words].sort().join('|');

                if (!uniqueWordSets.has(wordKey)) {
                    let category = "DECODED SIGNAL";
                    for (let j = i - 1; j >= 0 && j >= i - 5; j--) {
                        const prevText = (elements[j].textContent || "").trim();
                        if (prevText && prevText.length > 2 && prevText.length < 80 && !prevText.includes(',') && !prevText.includes('202') && !prevText.includes('#')) {
                            category = prevText.toUpperCase();
                            break;
                        }
                    }

                    uniqueWordSets.add(wordKey);
                    groups.push({
                        words,
                        connection: category.replace(/^(YELLOW|GREEN|BLUE|PURPLE|CATEGORY|GROUP)[:\s]*/i, '').substring(0, 60),
                        color: COLORS[groups.length]
                    });
                }
            }
            if (groups.length === 4) break;
        }

        return groups.length === 4 ? groups : null;
    };

    const fetchTodayGame = async (): Promise<SynapseGroup[] | null> => {
        setLoadingStatus("Connecting to connectionsgame.org...");
        const url = `https://connectionsgame.org/`;

        try {
            const response = await resilientFetch(url, { timeout: 15000 });
            if (!response.ok) throw new Error("Fetch failed");
            const html = await response.text();
            setLoadingStatus("Decoding Packet Sequence...");
            const data = extractConnectionsData(html);
            if (data) return data;
            
            setLoadingStatus("Initial decode failed. Accessing Archive...");
            const gitRes = await resilientFetch('https://raw.githubusercontent.com/Eyefyre/NYT-Connections-Answers/master/connections.json');
            if (gitRes.ok) {
                const gitData = await gitRes.json();
                const latest = Object.values(gitData)
                    .filter((a: any) => a && typeof a === 'object' && a.answers)
                    .sort((a: any, b: any) => {
                        const dateA = a.date ? new Date(a.date).getTime() : 0;
                        const dateB = b.date ? new Date(b.date).getTime() : 0;
                        return dateB - dateA;
                    })[0] as any;
                
                if (latest && latest.answers) {
                    return latest.answers.map((ans: any, i: number) => ({
                        words: (ans.members || []).map((m: any) => (m || "???").toString().toUpperCase().replace(/[^A-Z0-9-]/g, '')),
                        connection: (ans.description || "DECODED SIGNAL").toString().toUpperCase().substring(0, 60),
                        color: COLORS[i]
                    }));
                }
            }
            return null;
        } catch (e: any) {
            return null;
        }
    };

    const fetchAndSynthesizePuzzle = useCallback(async () => {
        setGameState('loading');
        const data = await fetchTodayGame();
        if (data) {
            setWall({ id: `live_${Date.now()}`, groups: data });
            setGameState('idle');
            return;
        }

        setLoadingStatus("External signals lost. Reverting to local storage...");
        setTimeout(() => {
            const fallback = INTERNAL_WALLS[0];
            setWall(fallback);
            setGameState('idle');
        }, 1500);
    }, []);

    useEffect(() => {
        fetchAndSynthesizePuzzle();
    }, [fetchAndSynthesizePuzzle]);

    const handleWordClick = (word: string) => {
        if (gameState !== 'playing') return;
        setGuessFeedback(null);
        if (selection.includes(word)) {
            setSelection(prev => prev.filter(w => w !== word));
        } else if (selection.length < 4) {
            setSelection(prev => [...prev, word]);
        }
    };

    const handleSubmit = () => {
        if (selection.length !== 4 || !wall) return;

        const group = wall.groups.find(g => selection.every(w => g.words.includes(w)));
        if (group) {
            const newSolved = [...solvedGroups, group];
            setSolvedGroups(newSolved);
            setShuffledWords(prev => prev.filter(w => !selection.includes(w)));
            setSelection([]);
            setGuessFeedback(null);
            
            if (newSolved.length === 4) {
                setGameState('won');
                stopTimer();
                onComplete?.();
            }
        } else {
            let maxMatches = 0;
            wall.groups.forEach(g => {
                if (solvedGroups.some(sg => sg.words[0] === g.words[0])) return;
                const matchCount = selection.filter(w => g.words.includes(w)).length;
                if (matchCount > maxMatches) maxMatches = matchCount;
            });

            const feedback = maxMatches === 3 ? "3 LINKED" : maxMatches === 2 ? "2 LINKED" : "NO LINKS";
            setGuessFeedback(feedback);

            setMistakes(m => {
                const next = m + 1;
                if (next >= MISTAKE_LIMIT) {
                    setGameState('lost');
                    stopTimer();
                }
                return next;
            });
            setShakeIndex(true);
            setTimeout(() => setShakeIndex(false), 500);
        }
    };

    const handleSaveScore = () => {
        saveHighScore('synapse_link', {
            name: initials.toUpperCase() || "???",
            score: time,
            displayValue: `${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}`,
            date: new Date().toISOString()
        }, true);
        onBackToHub();
    };

    const generateNeuralLog = () => {
        const phrases = gameState === 'won' ? 
            ["Synaptic pathways aligned.", "Network integrity 100%.", "Logical clusters synchronized."] :
            ["Synaptic overload.", "Connection failure.", "Logic nodes disconnected."];
        setAiSummary(phrases[Math.floor(Math.random() * phrases.length)]);
    };

    if (gameState === 'loading') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-6 text-center">
                <div className="w-16 h-16 border-4 border-pulse-500 border-t-transparent rounded-full animate-spin mb-6 mx-auto shadow-[0_0_20px_#e11d48]" />
                <p className="text-pulse-500 font-black uppercase italic tracking-widest animate-pulse">{loadingStatus}</p>
            </div>
        );
    }

    if (gameState === 'idle') {
        return (
            <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-6 overflow-y-auto scrollbar-hide">
                <div className="w-full max-w-sm text-center bg-zinc-900 p-8 md:p-10 rounded-[3rem] border-4 border-pulse-500 shadow-[0_0_50px_rgba(225,29,72,0.1)] mb-6">
                    <header className="mb-10">
                        <span className="text-[10px] font-black uppercase text-neon-400 tracking-[0.3em] italic block mb-1">Cluster Analysis</span>
                        <h1 className="text-3xl font-black italic uppercase text-white tracking-tighter leading-none">SYNAPSE LINK</h1>
                    </header>

                    <div className="h-[240px] flex items-center justify-center mb-8 overflow-hidden relative">
                        <div key={showScores ? 'scores' : 'graphic'} className="w-full animate-glitch-in">
                            {showScores ? (
                                <HighScoreTable entries={getHighScores('synapse_link')} title="SYNAPSE" />
                            ) : (
                                <NeuralNodeGraphic />
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <button 
                            onClick={() => wall && initGame(wall.groups)} 
                            className="w-full py-5 bg-white text-black font-black uppercase italic rounded-2xl hover:scale-[1.02] transition-all shadow-xl border-2 border-white/10 active:scale-95 text-lg"
                        >
                            Sync Nodes
                        </button>
                        <button onClick={() => setShowHelp(true)} className="w-full py-3 bg-zinc-800 text-zinc-400 font-black uppercase italic rounded-xl border border-white/5 hover:text-white transition-all text-[10px] tracking-widest flex items-center justify-center gap-2">
                            <BookOpenIcon className="w-4 h-4" /> Tactical Manual
                        </button>
                        <button onClick={onBackToHub} className="text-zinc-500 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors pt-2 block w-full italic">Abort Link</button>
                    </div>
                </div>
                {showHelp && <TacticalManual onClose={() => setShowHelp(false)} />}
            </div>
        );
    }

    return (
        <main className="w-full h-full bg-zinc-950 flex flex-col items-center p-4 overflow-y-auto scrollbar-hide pb-[calc(2rem+var(--safe-bottom))]">
            <style>{`
                @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
                .animate-shake { animation: shake 0.2s ease-in-out 2; }
                @keyframes glitch-in {
                    0% { opacity: 0; transform: scale(0.9) skew(0deg); }
                    10% { opacity: 0.8; transform: scale(1.05) skew(5deg); filter: hue-rotate(90deg); }
                    20% { opacity: 1; transform: scale(1) skew(0deg); filter: hue-rotate(0deg); }
                }
                .animate-glitch-in { animation: glitch-in 0.4s ease-out forwards; }
            `}</style>
            
            <header className="w-full max-w-lg flex justify-between items-center mb-8 bg-zinc-900/50 p-4 rounded-3xl border border-white/5 flex-shrink-0 mt-[var(--safe-top)]">
                <button onClick={onBackToHub} className="p-2 bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors">
                    <XIcon className="w-6 h-6" />
                </button>
                <div className="text-center">
                    <span className="text-[10px] font-black uppercase text-neon-400 tracking-[0.3em] italic">Cluster Analysis</span>
                    <h1 className="text-2xl font-black italic uppercase text-white tracking-tighter leading-none">SYNAPSE LINK</h1>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowHelp(true)} className="p-2 bg-zinc-800 rounded-xl text-zinc-400 hover:text-white border border-white/5"><BookOpenIcon className="w-6 h-6" /></button>
                    <div className="bg-black/40 px-3 py-1 rounded-xl border border-white/10 text-xs font-mono font-black text-white flex items-center">
                        {Math.floor(time / 60)}:{String(time % 60).padStart(2, '0')}
                    </div>
                </div>
            </header>

            <div className="w-full max-w-xl flex flex-col gap-6">
                <div className="flex flex-col items-center gap-3">
                    <div className="flex justify-center gap-2">
                        {[...Array(MISTAKE_LIMIT)].map((_, i) => (
                            <HeartIcon key={i} filled={i < MISTAKE_LIMIT - mistakes} animated={gameState === 'playing'} />
                        ))}
                    </div>
                    {guessFeedback && (
                        <div className="bg-pulse-500/20 border border-pulse-500 text-pulse-500 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest italic animate-bounce">
                            {guessFeedback}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-2">
                    {solvedGroups.map((g, i) => (
                        <div key={i} className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center text-center animate-fade-in ${g.color}`}>
                            <span className="text-xs font-black text-white italic mb-1 uppercase tracking-widest">{g.connection}</span>
                            <span className="text-[10px] font-mono text-white/80 font-black">{g.words.join(", ")}</span>
                        </div>
                    ))}
                </div>

                {gameState === 'playing' && (
                    <>
                        <div className={`grid grid-cols-4 gap-2 ${shakeIndex ? 'animate-shake' : ''}`}>
                            {shuffledWords.map(word => {
                                const isSelected = selection.includes(word);
                                return (
                                    <button
                                        key={word}
                                        onClick={() => handleWordClick(word)}
                                        className={`aspect-square md:aspect-auto md:h-20 rounded-xl border-2 font-black text-[10px] md:text-xs p-1 transition-all flex items-center justify-center text-center uppercase break-words
                                            ${isSelected 
                                                ? 'bg-pulse-500 border-pulse-400 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)] scale-95' 
                                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'}`}
                                    >
                                        {word}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex gap-4 mt-4">
                            <button 
                                onClick={() => { setSelection([]); setGuessFeedback(null); }}
                                className="flex-1 py-4 bg-zinc-800 text-zinc-400 font-black uppercase italic rounded-2xl hover:text-white transition-all border border-white/5"
                            >
                                Clear
                            </button>
                            <button 
                                onClick={handleSubmit}
                                disabled={selection.length !== 4}
                                className="flex-2 py-4 bg-pulse-600 text-white font-black uppercase italic rounded-2xl shadow-xl hover:bg-pulse-500 disabled:opacity-30 disabled:grayscale transition-all border-2 border-pulse-400 px-8"
                            >
                                Submit Link
                            </button>
                        </div>
                    </>
                )}

                {(gameState === 'won' || gameState === 'lost') && (
                    <div className="mt-8 bg-zinc-900 p-8 rounded-[3rem] border-4 border-pulse-500 text-center shadow-2xl animate-fade-in relative overflow-hidden">
                        <h2 className={`text-4xl font-black italic uppercase mb-4 ${gameState === 'won' ? 'text-emerald-500' : 'text-pulse-500'}`}>
                            {gameState === 'won' ? 'SYNC SUCCESS' : 'LINK SEVERED'}
                        </h2>
                        
                        <div className="bg-black/40 p-4 rounded-2xl border border-white/5 mb-6 text-left">
                            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-2 italic">// Neural Summary</p>
                            {aiSummary ? (
                                <p className="text-xs text-emerald-400 font-black italic animate-fade-in leading-relaxed">{aiSummary}</p>
                            ) : (
                                <button onClick={generateNeuralLog} className="w-full py-2 bg-void-950 border border-white/10 rounded-lg text-[9px] font-black text-zinc-400 uppercase italic flex items-center justify-center gap-2">
                                    <SparklesIcon className="w-3 h-3" /> Analyze Session
                                </button>
                            )}
                        </div>

                        <div className="bg-void-950/60 p-4 rounded-2xl border border-white/5 mb-8 text-left space-y-4">
                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest italic border-b border-white/5 pb-2">// Data Packet Structure (Reveal)</p>
                            <div className="space-y-3">
                                {wall?.groups.map((g, i) => (
                                    <div key={i} className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${g.color.split(' ')[0]}`} />
                                            <span className="text-[10px] font-black text-white italic uppercase tracking-tighter">{g.connection}</span>
                                        </div>
                                        <span className="text-[9px] font-mono text-zinc-500 ml-3.5 leading-none">{g.words.join(" • ")}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {gameState === 'won' ? (
                            <div className="space-y-4">
                                <input 
                                    autoFocus 
                                    maxLength={3} 
                                    value={initials} 
                                    onChange={e => setInitials(e.target.value.toUpperCase())} 
                                    className="bg-black/50 border-2 border-emerald-500 text-white rounded-xl px-4 py-3 text-center text-2xl font-black w-32 outline-none uppercase italic" 
                                    placeholder="???" 
                                />
                                <button onClick={handleSaveScore} className="w-full py-5 bg-emerald-600 text-white font-black text-xl italic uppercase rounded-full shadow-xl hover:scale-105 transition-transform">Post Records</button>
                            </div>
                        ) : (
                            <button onClick={() => fetchAndSynthesizePuzzle()} className="w-full py-5 bg-pulse-600 text-white font-black text-xl italic uppercase rounded-full shadow-xl hover:scale-105 transition-transform">Retry Sync</button>
                        )}
                        <button onClick={onBackToHub} className="mt-4 text-zinc-500 font-bold uppercase tracking-widest text-[9px] hover:text-white transition-colors block w-full italic">Back to Terminal</button>
                    </div>
                )}
            </div>
            {showHelp && <TacticalManual onClose={() => setShowHelp(false)} />}
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
                        <h2 className="text-white text-[10px] font-black uppercase tracking-[0.2em] italic px-2">CLUSTER_ANALYSIS_PROTOCOLS.PDF</h2>
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
                                <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Logical Association</h3>
                            </div>
                            <p className="text-[10px] md:text-xs text-zinc-400 uppercase font-black leading-relaxed tracking-wider mb-4 border-l-2 border-emerald-500/30 pl-4">
                                Identify four groups of four words that share a common synaptic connection.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <ManualPoint title="0x01_Synaptic_Divergence" desc="Many words belong to multiple potential clusters. Look for the most exclusive link first to prevent signal bleed." color="text-emerald-500" />
                            <ManualPoint title="0x02_Complexity_Scaling" desc="Connections range from surface-level (Synonyms) to high-level meta-logical patterns. Probing deeper yields better results." color="text-emerald-500" />
                            <ManualPoint title="0x03_Feedback_Loop" desc="The 'X LINKED' signal indicates you have three correct nodes in your current selection. Adjust one bit to resolve the cluster." color="text-emerald-500" />
                            <ManualPoint title="0x04_The_Pantry_Strategy" desc="Eliminate confirmed groups to simplify the remaining network. The last group often requires the highest cognitive sync." color="text-emerald-500" />
                        </div>

                        <div className="p-5 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl flex items-start gap-4">
                            <ExclamationTriangleIcon className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5 animate-pulse" />
                            <div>
                                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1 italic">Pro Tip: Pattern Evasion</p>
                                <p className="text-[8px] text-zinc-500 uppercase font-black leading-tight italic">
                                    Operator, do not rush. Faulty submissions drain the link integrity buffer. Verify the association before committing.
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

export default SynapseLinkPage;