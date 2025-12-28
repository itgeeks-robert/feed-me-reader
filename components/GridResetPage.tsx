import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { XIcon, VoidIcon, CpuChipIcon, ArrowPathIcon } from './icons';
import { saveHighScore, getHighScores, HighScoreEntry } from '../services/highScoresService';
import HighScoreTable from './HighScoreTable';

type Grid = boolean[][];

const SIZE = 5;

const GridResetPage: React.FC<{ onBackToHub: () => void; onComplete?: () => void }> = ({ onBackToHub, onComplete }) => {
    const [grid, setGrid] = useState<Grid>([]);
    const [moves, setMoves] = useState(0);
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'won'>('idle');
    const [hoveredNode, setHoveredNode] = useState<{ r: number, c: number } | null>(null);
    const [initials, setInitials] = useState("");
    const [highScores, setHighScores] = useState<HighScoreEntry[]>([]);

    useEffect(() => {
        setHighScores(getHighScores('grid_reset'));
    }, [gameState]);

    const generateSolvableLevel = useCallback(() => {
        // Start with all OFF (false)
        let newGrid = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));
        
        // Simulate random clicks to ensure it is solvable
        const simulateClicks = Math.floor(Math.random() * 10) + 12;
        for (let i = 0; i < simulateClicks; i++) {
            const r = Math.floor(Math.random() * SIZE);
            const c = Math.floor(Math.random() * SIZE);
            newGrid = toggleInternal(newGrid, r, c);
        }
        
        // Ensure we didn't accidentally generate an already solved grid
        const isDark = newGrid.every(row => row.every(cell => !cell));
        if (isDark) return generateSolvableLevel();

        setGrid(newGrid);
        setMoves(0);
        setGameState('playing');
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

        // Win Condition: All nodes are False (Black/Dark)
        const isDark = next.every(row => row.every(cell => !cell));
        if (isDark) {
            setTimeout(() => {
                setGameState('won');
                onComplete?.();
            }, 300);
        }
    };

    const handleSaveScore = () => {
        saveHighScore('grid_reset', {
            name: initials.toUpperCase() || "???",
            score: moves,
            displayValue: `${moves} STEPS`,
            date: new Date().toISOString()
        }, true);
        onBackToHub();
    };

    const integrity = useMemo(() => {
        if (!grid.length) return 0;
        const total = SIZE * SIZE;
        const off = grid.flat().filter(cell => !cell).length;
        return Math.floor((off / total) * 100);
    }, [grid]);

    const isNeighbor = (r: number, c: number) => {
        if (!hoveredNode) return false;
        const dr = Math.abs(r - hoveredNode.r);
        const dc = Math.abs(c - hoveredNode.c);
        return (dr === 0 && dc === 0) || (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
    };

    if (gameState === 'idle') {
        return (
            <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-6 overflow-y-auto scrollbar-hide font-mono">
                <div className="w-full max-w-sm text-center bg-zinc-900 p-10 rounded-[3rem] border-4 border-pulse-500 shadow-[0_0_60px_rgba(225,29,72,0.2)]">
                    <div className="p-4 bg-pulse-500/10 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center border border-pulse-500/30">
                        <CpuChipIcon className="w-12 h-12 text-pulse-500 animate-pulse" />
                    </div>
                    <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">GRID RESET</h2>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-10 italic">Recalibration Protocol</p>
                    
                    <HighScoreTable entries={getHighScores('grid_reset')} title="CLEANEST" />

                    <div className="mt-10 space-y-4">
                        <button 
                            onClick={generateSolvableLevel} 
                            className="w-full py-5 bg-white text-black font-black uppercase italic rounded-2xl hover:scale-[1.02] transition-all shadow-xl active:scale-95 text-lg"
                        >
                            Sync Terminals
                        </button>
                        <button onClick={onBackToHub} className="text-zinc-500 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors pt-4 block w-full italic">Back to Arcade</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <main className="w-full h-full bg-zinc-950 text-white flex flex-col items-center justify-center p-6 overflow-y-auto scrollbar-hide font-mono">
            <style>{`
                .node-connection {
                    position: absolute;
                    background: rgba(225, 29, 72, 0.05);
                    z-index: 0;
                }
                .node-v { width: 1px; height: 100%; top: 0; left: 50%; transform: translateX(-50%); }
                .node-h { height: 1px; width: 100%; left: 0; top: 50%; transform: translateY(-50%); }
                @keyframes pulse-node {
                    0% { transform: scale(1); box-shadow: 0 0 10px rgba(225, 29, 72, 0.4); }
                    50% { transform: scale(1.05); box-shadow: 0 0 25px rgba(225, 29, 72, 0.7); }
                    100% { transform: scale(1); box-shadow: 0 0 10px rgba(225, 29, 72, 0.4); }
                }
                .active-node { animation: pulse-node 1.5s infinite; }
                .neighbor-preview { outline: 2px dashed rgba(225, 29, 72, 0.5); outline-offset: 2px; background: rgba(225, 29, 72, 0.1) !important; }
            `}</style>

            <div className="max-w-md w-full space-y-6">
                <header className="flex justify-between items-center bg-zinc-900/50 p-6 rounded-3xl border border-white/5 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <button onClick={onBackToHub} className="p-3 bg-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all border border-white/5"><XIcon className="w-6 h-6" /></button>
                        <div>
                             <span className="text-[10px] font-black text-pulse-500 uppercase tracking-[0.4em] block mb-1 font-mono">Panel Status: MALFUNCTION</span>
                             <h2 className="text-xl font-black italic uppercase text-white tracking-tighter leading-none">GRID RESET</h2>
                        </div>
                    </div>
                    <div className="bg-black/60 px-5 py-2.5 rounded-2xl border border-pulse-500/20 shadow-inner flex flex-col items-center">
                        <span className="text-[8px] font-black text-pulse-500 uppercase block mb-0.5 tracking-widest font-mono">Moves</span>
                        <span className="text-xl font-black italic font-mono text-white leading-none">{String(moves).padStart(3, '0')}</span>
                    </div>
                </header>

                <div className="bg-void-900/40 p-8 rounded-[2.5rem] border-4 border-zinc-800 shadow-2xl relative overflow-hidden">
                    <div className="mb-6 flex items-center justify-between px-2">
                        <div className="flex flex-col">
                            <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest mb-1 italic">System Stability</span>
                            <div className="flex items-center gap-3">
                                <div className="w-24 h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full bg-signal-500 transition-all duration-500" style={{ width: `${integrity}%` }} />
                                </div>
                                <span className="text-xs font-black text-signal-500">{integrity}%</span>
                            </div>
                        </div>
                        <div className="text-right">
                             <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-tighter block mb-1">Target:</span>
                             <span className="text-[10px] font-black text-white italic uppercase tracking-tighter">ALL DARK</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-5 gap-4 relative z-10" onMouseLeave={() => setHoveredNode(null)}>
                        {grid.map((row, r) => row.map((cell, c) => {
                            const isSelected = isNeighbor(r, c);
                            return (
                                <div key={`${r}-${c}`} className="relative aspect-square">
                                    {r < SIZE - 1 && <div className="node-connection node-v" />}
                                    {c < SIZE - 1 && <div className="node-connection node-h" />}
                                    
                                    <button
                                        onMouseEnter={() => setHoveredNode({r, c})}
                                        onClick={() => handleNodeClick(r, c)}
                                        className={`w-full h-full rounded-xl border-2 transition-all duration-300 relative z-10
                                            ${cell 
                                                ? 'bg-pulse-600 border-pulse-400 shadow-[0_0_20px_#e11d48] active-node' 
                                                : 'bg-zinc-950 border-zinc-900 hover:border-zinc-800 shadow-inner'
                                            } 
                                            ${isSelected ? 'neighbor-preview' : ''}
                                            active:scale-90`}
                                    >
                                        <div className={`absolute inset-0 m-auto w-1.5 h-1.5 rounded-full ${cell ? 'bg-white shadow-[0_0_5px_white]' : 'bg-zinc-800'}`} />
                                        {cell && <div className="absolute inset-0 animate-pulse bg-gradient-to-t from-transparent via-white/10 to-transparent h-1 top-1/2 -translate-y-1/2 rounded-xl" />}
                                    </button>
                                </div>
                            );
                        }))}
                    </div>
                    <div className="absolute inset-0 pointer-events-none opacity-20 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(225,29,72,0.1)_2px,rgba(225,29,72,0.1)_4px)]" />
                </div>

                <div className="flex flex-col gap-4">
                    <div className="bg-void-900 border border-pulse-500/20 p-5 rounded-2xl">
                        <p className="text-[10px] text-zinc-400 text-center uppercase font-bold tracking-widest leading-relaxed">
                            <span className="text-white block mb-2 font-black italic underline">CHAIN REACTION PROTOCOL:</span>
                            Clicking a node <span className="text-pulse-500">toggles itself</span> and its <span className="text-pulse-500">adjacent neighbors</span>.
                            <br/>
                            <span className="text-signal-500 font-black mt-2 block">GOAL: 100% GRID DARKNESS.</span>
                        </p>
                    </div>
                    
                    <button onClick={generateSolvableLevel} className="w-full py-4 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-center gap-4 text-zinc-500 font-black uppercase italic text-[10px] hover:text-white transition-all active:scale-95">
                        <ArrowPathIcon className="w-4 h-4" />
                        <span>Force Recalibration</span>
                    </button>
                </div>
            </div>

            {gameState === 'won' && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-6 text-center">
                    <div className="max-w-sm w-full bg-void-900 p-12 rounded-[3rem] border-4 border-signal-500 shadow-[0_0_100px_rgba(34,197,94,0.3)]">
                        <div className="mb-6 mx-auto w-20 h-20 bg-signal-500/10 rounded-full flex items-center justify-center border border-signal-500/30">
                            <VoidIcon className="w-12 h-12 text-signal-500 animate-pulse" />
                        </div>
                        <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-4 text-signal-500">GRID DARK</h2>
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[9px] mb-10 leading-relaxed italic">
                            Maintenance complete. Sector stable.<br/>Syncing adjustments to mainframe archives.
                        </p>
                        <div className="mb-10">
                            <p className="text-zinc-500 font-black uppercase tracking-[0.3em] text-[9px] mb-4 italic">Post Record Initials</p>
                            <input 
                                autoFocus 
                                maxLength={3} 
                                value={initials} 
                                onChange={e => setInitials(e.target.value.toUpperCase())} 
                                className="bg-black/50 border-2 border-signal-500 text-white rounded-xl px-4 py-3 text-center text-3xl font-black w-36 outline-none uppercase italic" 
                                placeholder="???" 
                            />
                        </div>
                        <button onClick={handleSaveScore} className="w-full py-5 bg-signal-600 text-black font-black text-xl italic uppercase rounded-full hover:scale-105 transition-all shadow-xl">LOG RECORD</button>
                    </div>
                </div>
            )}
        </main>
    );
};

export default GridResetPage;