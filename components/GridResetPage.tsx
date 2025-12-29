import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { XIcon, VoidIcon, CpuChipIcon, ArrowPathIcon, SparklesIcon, BookOpenIcon } from './icons';
import { saveHighScore, getHighScores, HighScoreEntry } from '../services/highScoresService';
import HighScoreTable from './HighScoreTable';

type Grid = boolean[][];

const SIZE = 5;

const ResetGraphic: React.FC = () => (
    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 bg-pulse-500/10 rounded-full animate-ping" />
        <div className="absolute inset-4 bg-pulse-500/20 rounded-full animate-pulse" />
        <div className="relative z-10 p-8 bg-zinc-900 rounded-[2rem] border-4 border-pulse-500 shadow-[0_0_30px_rgba(225,29,72,0.4)]">
            <CpuChipIcon className="w-16 h-16 text-pulse-500" />
        </div>
        <div className="absolute -top-4 -left-4 text-[8px] font-mono text-pulse-500 uppercase tracking-widest animate-pulse font-black italic">CALIBRATING_GRID...</div>
    </div>
);

const GridResetPage: React.FC<{ onBackToHub: () => void; onComplete?: () => void }> = ({ onBackToHub, onComplete }) => {
    const [grid, setGrid] = useState<Grid>([]);
    const [moves, setMoves] = useState(0);
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'won'>('idle');
    const [initials, setInitials] = useState("");
    const [hintNode, setHintNode] = useState<{ r: number, c: number } | null>(null);
    const [hoverNode, setHoverNode] = useState<{ r: number, c: number } | null>(null);
    const [showHelp, setShowHelp] = useState(false);
    const [showScores, setShowScores] = useState(false);
    const [scramblePath, setScramblePath] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (gameState === 'idle') {
            const interval = setInterval(() => {
                setShowScores(prev => !prev);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [gameState]);

    const generateSolvableLevel = useCallback(() => {
        let newGrid = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));
        const path = new Set<string>();
        
        const scrambleCount = 13;
        for (let i = 0; i < scrambleCount; i++) {
            const r = Math.floor(Math.random() * SIZE);
            const c = Math.floor(Math.random() * SIZE);
            const key = `${r},${c}`;
            
            if (path.has(key)) path.delete(key);
            else path.add(key);

            newGrid = toggleInternal(newGrid, r, c);
        }
        
        if (newGrid.every(row => row.every(cell => !cell))) return generateSolvableLevel();

        setScramblePath(path);
        setGrid(newGrid);
        setMoves(0);
        setGameState('playing');
        setHintNode(null);
        setShowHelp(false);
    }, []);

    const toggleInternal = (currentGrid: Grid, r: number, c: number): Grid => {
        const next = currentGrid.map(row => [...row]);
        const directions = [[0, 0], [0, 1], [0, -1], [1, 0], [-1, 0]];
        directions.forEach(([dr, dc]) => {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) {
                next[nr][nc] = !next[nr][nc];
            }
        });
        return next;
    };

    const handleNodeClick = (r: number, c: number) => {
        if (gameState !== 'playing') return;
        
        const next = toggleInternal(grid, r, c);
        setGrid(next);
        setMoves(m => m + 1);
        setHintNode(null);

        const key = `${r},${c}`;
        const newPath = new Set(scramblePath);
        if (newPath.has(key)) newPath.delete(key);
        else newPath.add(key);
        setScramblePath(newPath);

        const isDark = next.every(row => row.every(cell => !cell));
        if (isDark) {
            setGameState('won');
            onComplete?.();
        }
    };

    const requestHint = () => {
        if (gameState !== 'playing' || scramblePath.size === 0) return;
        const remaining = Array.from(scramblePath);
        const randomTarget = remaining[Math.floor(Math.random() * remaining.length)];
        const [r, c] = (randomTarget as string).split(',').map(Number);
        setHintNode({ r, c });
        setTimeout(() => setHintNode(null), 3000);
    };

    const handleSaveScore = () => {
        saveHighScore('grid_reset', {
            name: initials.toUpperCase() || "???",
            score: moves,
            displayValue: `${moves} STEPS`,
            date: new Date().toISOString()
        }, true);
        setGameState('idle');
    };

    const isHoverTarget = (r: number, c: number) => {
        if (!hoverNode) return false;
        const dr = Math.abs(r - hoverNode.r);
        const dc = Math.abs(c - hoverNode.c);
        return (dr === 0 && dc === 0) || (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
    };

    const deactivationProgress = useMemo(() => {
        if (!grid.length) return 0;
        const off = grid.flat().filter(cell => !cell).length;
        return Math.floor((off / (SIZE * SIZE)) * 100);
    }, [grid]);

    if (gameState === 'idle') {
        return (
            <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-6 font-mono">
                <style>{`
                    @keyframes glitch-in {
                        0% { opacity: 0; transform: scale(0.9) skew(0deg); }
                        10% { opacity: 0.8; transform: scale(1.05) skew(5deg); filter: hue-rotate(90deg); }
                        20% { opacity: 1; transform: scale(1) skew(0deg); filter: hue-rotate(0deg); }
                    }
                    .animate-glitch-in { animation: glitch-in 0.4s ease-out forwards; }
                `}</style>
                
                <div className="w-full max-w-sm text-center bg-zinc-900 p-10 rounded-[3rem] border-4 border-pulse-500 shadow-[0_0_60px_rgba(225,29,72,0.2)]">
                    <header className="mb-8">
                        <span className="text-[10px] font-black uppercase text-pulse-500 tracking-[0.3em] italic block mb-1">Grid Integrity</span>
                        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">GRID RESET</h2>
                    </header>

                    <div className="h-[240px] flex items-center justify-center mb-8 overflow-hidden relative">
                        <div key={showScores ? 'scores' : 'graphic'} className="w-full animate-glitch-in">
                            {showScores ? (
                                <HighScoreTable entries={getHighScores('grid_reset')} title="CLEAN_UP" />
                            ) : (
                                <ResetGraphic />
                            )}
                        </div>
                    </div>

                    <div className="mt-10 space-y-4">
                        <button onClick={generateSolvableLevel} className="w-full py-5 bg-white text-black font-black uppercase italic rounded-2xl hover:scale-[1.02] transition-all shadow-xl active:scale-95 text-lg">Sync Sector</button>
                        <button onClick={onBackToHub} className="text-zinc-500 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors pt-4 block w-full italic tracking-[0.2em]">Return to Hub</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <main className="w-full h-full bg-zinc-950 text-white flex flex-col items-center justify-center p-4 overflow-y-auto scrollbar-hide font-mono relative">
            <style>{`
                @keyframes glitch-fast {
                    0% { transform: translate(0); filter: hue-rotate(0deg); }
                    20% { transform: translate(-2px, 1px); filter: hue-rotate(90deg); }
                    40% { transform: translate(2px, -1px); }
                    60% { transform: translate(-1px, -2px); }
                    80% { transform: translate(1px, 2px); }
                    100% { transform: translate(0); filter: hue-rotate(0deg); }
                }
                .node-active {
                    background-color: #be123c !important;
                    border-color: #f43f5e !important;
                    box-shadow: 0 0 25px #e11d48, inset 0 0 10px rgba(255,255,255,0.3);
                    animation: glitch-fast 0.2s infinite linear;
                }
                .node-hint { 
                    border-color: #fbbf24 !important; 
                    box-shadow: 0 0 30px #fbbf24, inset 0 0 10px #fbbf24 !important;
                    z-index: 50;
                }
                .node-dark { background-color: #050505 !important; border-color: #18181b !important; }
                .grid-bus-h { position: absolute; height: 2px; background: rgba(255,255,255,0.03); top: 50%; left: 0; right: 0; transform: translateY(-50%); z-index: 0; }
                .grid-bus-v { position: absolute; width: 2px; background: rgba(255,255,255,0.03); top: 0; bottom: 0; left: 50%; transform: translateX(-50%); z-index: 0; }
                .target-reticle { outline: 2px solid rgba(225,29,72,0.6); outline-offset: 4px; z-index: 20; }
                .help-node { width: 12px; height: 12px; border-radius: 2px; }
            `}</style>

            <div className="max-w-md w-full space-y-6">
                <header className="flex justify-between items-center bg-zinc-900/50 p-6 rounded-3xl border border-white/5 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <button onClick={onBackToHub} className="p-3 bg-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all border border-white/5 active:scale-95"><XIcon className="w-6 h-6" /></button>
                        <div>
                             <span className="text-[9px] font-black text-pulse-500 uppercase tracking-[0.4em] block mb-1">Status: MALFUNCTION</span>
                             <h2 className="text-xl font-black italic uppercase text-white tracking-tighter leading-none">GRID RESET</h2>
                        </div>
                    </div>
                    <button onClick={() => setShowHelp(true)} className="p-3 bg-zinc-800 rounded-2xl text-neon-400 border border-neon-400/20 hover:bg-neon-400 hover:text-black transition-all">
                        <BookOpenIcon className="w-6 h-6" />
                    </button>
                </header>

                <div className="bg-void-900/40 p-8 rounded-[2.5rem] border-4 border-zinc-800 shadow-2xl relative overflow-hidden">
                    <div className="mb-8 flex items-center justify-between px-2">
                        <div className="flex flex-col">
                            <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest mb-1 italic">Circuit Integrity</span>
                            <div className="flex items-center gap-3">
                                <div className="w-32 h-2 bg-black rounded-none overflow-hidden border border-white/5">
                                    <div className="h-full bg-signal-500 transition-all duration-700 shadow-[0_0_15px_#22c55e]" style={{ width: `${deactivationProgress}%` }} />
                                </div>
                                <span className="text-xs font-black text-signal-500 font-mono">{deactivationProgress}%</span>
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                             <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-tighter block mb-1 italic">Attempts</span>
                             <span className="text-sm font-black text-white italic font-mono bg-pulse-950 px-3 py-0.5 rounded-sm">{String(moves).padStart(3, '0')}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-5 gap-4 relative z-10" onMouseLeave={() => setHoverNode(null)}>
                        {grid.map((row, r) => row.map((cell, c) => {
                            const isHint = hintNode?.r === r && hintNode?.c === c;
                            const isTargeted = isHoverTarget(r, c);
                            return (
                                <div key={`${r}-${c}`} className="relative aspect-square">
                                    {r < SIZE - 1 && <div className="grid-bus-v h-[200%]" />}
                                    {c < SIZE - 1 && <div className="grid-bus-h w-[200%]" />}
                                    
                                    <button
                                        onMouseEnter={() => setHoverNode({r, c})}
                                        onClick={() => handleNodeClick(r, c)}
                                        className={`relative w-full h-full rounded-2xl border-2 transition-all duration-150 overflow-hidden
                                            ${cell ? 'node-active' : 'node-dark'}
                                            ${isHint ? 'node-hint' : ''}
                                            ${isTargeted ? 'target-reticle' : ''}
                                            active:scale-90`}
                                    >
                                        {cell && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_15px_white] animate-pulse" />
                                            </div>
                                        )}
                                        {isTargeted && (
                                            <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />
                                        )}
                                    </button>
                                </div>
                            );
                        }))}
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex gap-4">
                        <button onClick={requestHint} className="flex-1 py-4 bg-zinc-900 border-2 border-amber-500/30 text-amber-500 rounded-2xl flex items-center justify-center gap-3 font-black uppercase italic text-[10px] hover:border-amber-500 transition-all active:scale-95 shadow-lg">
                            <SparklesIcon className="w-4 h-4 animate-pulse" />
                            <span>Neural Probe</span>
                        </button>
                        
                        <button onClick={generateSolvableLevel} className="px-6 py-4 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-center text-zinc-500 hover:text-white transition-all active:scale-95">
                            <ArrowPathIcon className="w-4 h-4" />
                        </button>
                    </div>
                    
                    <div className="bg-void-900 border border-pulse-500/20 p-5 rounded-2xl">
                         <p className="text-[10px] text-zinc-500 text-center uppercase font-bold tracking-widest italic">
                            TARGET: <span className="text-signal-500 font-black">100% BLACKOUT</span> (ALL NODES DARK)
                         </p>
                    </div>
                </div>
            </div>

            {/* TACTICAL BRIEFING OVERLAY */}
            {showHelp && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[60] flex items-center justify-center p-6" onClick={() => setShowHelp(false)}>
                    <div className="max-w-md w-full bg-void-900 p-8 rounded-[3rem] border-4 border-neon-400 shadow-[0_0_80px_rgba(34,211,238,0.2)]" onClick={e => e.stopPropagation()}>
                        <header className="flex justify-between items-center mb-8 border-b border-neon-400/20 pb-4">
                            <h3 className="text-2xl font-black italic uppercase text-neon-400 tracking-tighter">Tactical Briefing</h3>
                            <button onClick={() => setShowHelp(false)} className="text-zinc-500 hover:text-white"><XIcon className="w-6 h-6" /></button>
                        </header>
                        
                        <div className="space-y-6 text-[11px] font-mono leading-relaxed uppercase tracking-wider text-zinc-300">
                            <div>
                                <p className="text-white font-black mb-3 text-sm underline">Logic: The Cross Pattern</p>
                                <p>Every node is linked in a <span className="text-pulse-500 font-black">logic cross</span>. Toggling one node flips the state of itself and its four cardinal neighbors.</p>
                            </div>

                            <div className="bg-black/60 p-4 rounded-2xl border border-white/5 flex items-center justify-center gap-6">
                                <div className="grid grid-cols-3 gap-1">
                                    <div className="help-node bg-zinc-800" /><div className="help-node bg-pulse-500" /><div className="help-node bg-zinc-800" />
                                    <div className="help-node bg-pulse-500" /><div className="help-node bg-pulse-500 animate-pulse border-2 border-white" /><div className="help-node bg-pulse-500" />
                                    <div className="help-node bg-zinc-800" /><div className="help-node bg-pulse-500" /><div className="help-node bg-zinc-800" />
                                </div>
                                <div className="text-[9px] text-zinc-500 italic font-black">
                                    NODE TRIGGERED <br/> &rarr; 5 POINTS FLIP
                                </div>
                            </div>

                            <div>
                                <p className="text-white font-black mb-3 text-sm underline">The 96% Trap</p>
                                <p>If only <span className="text-pulse-500">1 node</span> remains active, clicking it will extinguish that light but <span className="text-signal-500">IGNITE 4 neighbors</span>. You cannot win by chasing only red nodes.</p>
                            </div>

                            <div className="bg-void-950 p-4 rounded-xl border border-neon-400/20">
                                <p className="text-neon-400 font-black mb-2">PRO TIP: Neural Probes</p>
                                <p>If stuck, deploy the <span className="text-amber-500">Neural Probe</span>. It calculates the hidden toggle path. Click the gold node—even if it's currently dark—to resolve the sequence.</p>
                            </div>
                        </div>

                        <button onClick={() => setShowHelp(false)} className="w-full mt-8 py-4 bg-neon-400 text-black font-black uppercase italic rounded-full shadow-lg active:scale-95 transition-all">Acknowledge</button>
                    </div>
                </div>
            )}

            {gameState === 'won' && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-6 text-center">
                    <div className="max-w-sm w-full bg-void-900 p-12 rounded-[3rem] border-4 border-signal-500 shadow-[0_0_100px_rgba(34,197,94,0.3)]">
                        <div className="mb-6 mx-auto w-20 h-20 bg-signal-500/10 rounded-full flex items-center justify-center border border-signal-500/30">
                            <VoidIcon className="w-12 h-12 text-signal-500 animate-pulse" />
                        </div>
                        <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-4 text-signal-500 leading-none">GRID DARK</h2>
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[9px] mb-10 leading-relaxed italic">
                            Signal termination successful. Node isolated.<br/>Syncing adjustments to mainframe archives.
                        </p>
                        <div className="mb-10">
                            <p className="text-zinc-500 font-black uppercase tracking-[0.3em] text-[9px] mb-4 italic">Post Record Initials</p>
                            <input autoFocus maxLength={3} value={initials} onChange={e => setInitials(e.target.value.toUpperCase())} className="bg-black/50 border-2 border-signal-500 text-white rounded-xl px-4 py-3 text-center text-3xl font-black w-36 outline-none uppercase italic" placeholder="???" />
                        </div>
                        <button onClick={handleSaveScore} className="w-full py-5 bg-signal-600 text-black font-black text-xl italic uppercase rounded-full hover:scale-105 transition-all shadow-xl active:scale-95">TRANSMIT DATA</button>
                    </div>
                </div>
            )}
        </main>
    );
};

export default GridResetPage;