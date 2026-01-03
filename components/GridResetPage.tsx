
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { XIcon, VoidIcon, CpuChipIcon, ArrowPathIcon, SparklesIcon, BookOpenIcon, ExclamationTriangleIcon } from './icons';
import { saveHighScore, getHighScores, HighScoreEntry } from '../services/highScoresService';
import { soundService } from '../services/soundService';
import HighScoreTable from './HighScoreTable';
import Tooltip from './Tooltip';

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
        soundService.playClick();
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
        
        soundService.playAction();
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
            soundService.playWin();
            setGameState('won');
            onComplete?.();
        }
    };

    const requestHint = () => {
        if (gameState !== 'playing' || scramblePath.size === 0) return;
        soundService.playPop();
        const remaining = Array.from(scramblePath);
        const randomTarget = remaining[Math.floor(Math.random() * remaining.length)];
        const [r, c] = (randomTarget as string).split(',').map(Number);
        setHintNode({ r, c });
        setTimeout(() => setHintNode(null), 3000);
    };

    const handleSaveScore = () => {
        soundService.playClick();
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
                        <button onClick={() => { soundService.playWrong(); onBackToHub(); }} className="text-zinc-500 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors pt-4 block w-full italic tracking-[0.2em]">Return to Hub</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <main className="w-full h-full bg-zinc-950 text-white flex flex-col items-center justify-center p-4 pt-[calc(4rem+var(--safe-top))] overflow-y-auto scrollbar-hide font-mono relative">
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
                        <button onClick={() => { soundService.playWrong(); onBackToHub(); }} className="p-3 bg-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all border border-white/5 active:scale-95"><XIcon className="w-6 h-6" /></button>
                        <div>
                             <span className="text-[9px] font-black text-pulse-500 uppercase tracking-[0.4em] block mb-1">Status: MALFUNCTION</span>
                             <h2 className="text-xl font-black italic uppercase text-white tracking-tighter leading-none">GRID RESET</h2>
                        </div>
                    </div>
                    <button onClick={() => { soundService.playClick(); setShowHelp(true); }} className="p-3 bg-zinc-800 rounded-2xl text-neon-400 border border-neon-400/20 hover:bg-neon-400 hover:text-black transition-all">
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
                        <Tooltip text="Neural Probe: Calculate the hidden toggle sequence to resolve the grid.">
                            <button onClick={requestHint} className="flex-1 py-4 bg-zinc-900 border-2 border-amber-500/30 text-amber-500 rounded-2xl font-black uppercase italic text-[10px] tracking-widest hover:bg-amber-500 hover:text-black transition-all shadow-lg active:scale-95">REQUEST_PROBE</button>
                        </Tooltip>
                    </div>
                </div>
            </div>

            {showHelp && <TacticalManual onClose={() => { soundService.playClick(); setShowHelp(false); }} />}

            {gameState === 'won' && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-6 text-center animate-fade-in">
                    <div className="max-w-sm w-full bg-zinc-900 p-12 rounded-[3.5rem] border-4 border-emerald-500 shadow-[0_0_100px_rgba(16,185,129,0.3)]">
                        <h2 className="text-4xl font-black italic uppercase tracking-tighter text-emerald-500 mb-6 leading-none">GRID NORMALIZED</h2>
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[9px] mb-8 italic px-4 leading-relaxed">Circuit drift rectified.<br/>Logic gates secured.</p>
                        <div className="mb-10">
                            <p className="text-zinc-500 font-bold uppercase tracking-widest text-[9px] mb-4 italic">Post Record Token</p>
                            <input autoFocus maxLength={3} value={initials} onChange={e => setInitials(e.target.value.toUpperCase())} className="bg-black/50 border-2 border-emerald-500 text-white rounded-xl px-4 py-4 text-center text-3xl font-black w-32 outline-none uppercase italic shadow-2xl" placeholder="???" />
                        </div>
                        <button onClick={handleSaveScore} className="w-full py-5 bg-emerald-600 text-white font-black text-xl italic uppercase rounded-full hover:scale-105 transition-all shadow-xl">Commit_Update</button>
                    </div>
                </div>
            )}
        </main>
    );
};

// Added ManualPoint component
const ManualPoint: React.FC<{ title: string; desc: string; color: string }> = ({ title, desc, color }) => (
    <div className="space-y-2 group">
        <h4 className={`text-[9px] font-black ${color} uppercase tracking-[0.3em] italic flex items-center gap-2`}>
            <span className={`w-1.5 h-1.5 rounded-full ${color.replace('text-', 'bg-')} group-hover:scale-150 transition-transform`}></span>
            {title}
        </h4>
        <p className="text-[10px] md:text-xs text-zinc-300 font-bold uppercase tracking-wide leading-relaxed pl-3 border-l border-zinc-800">{desc}</p>
    </div>
);

// Added TacticalManual component
const TacticalManual: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-10 font-mono" onClick={onClose}>
        <div className="max-w-xl w-full bg-void-900 border-4 border-pulse-500 rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <header className="h-12 bg-pulse-600 flex items-center justify-between px-4 border-b-2 border-black shrink-0">
                <div className="flex items-center gap-2 h-full"><BookOpenIcon className="w-4 h-4 text-black" /><h2 className="text-white text-[10px] font-black uppercase tracking-[0.2em] italic">GRID_STABILIZATION.PDF</h2></div>
                <button onClick={onClose} className="hover:scale-110 transition-transform"><XIcon className="w-5 h-5 text-black"/></button>
            </header>
            <div className="p-8 md:p-12 overflow-y-auto bg-void-950/40 relative flex-grow scrollbar-hide">
                <div className="absolute inset-0 pointer-events-none opacity-5 cctv-overlay" />
                <section className="space-y-8 relative z-10">
                    <div><h3 className="text-lg font-black text-white italic uppercase tracking-tighter mb-4 flex items-center gap-3"><SparklesIcon className="w-5 h-5 text-pulse-500"/> Circuit Logic</h3><p className="text-[10px] text-zinc-400 uppercase font-black leading-relaxed tracking-wider border-l-2 border-pulse-500 pl-4">The grid is drifting into critical states (RED). You must toggle the nodes until all logic gates are deactivated (DARK).</p></div>
                    <div className="space-y-6">
                        <ManualPoint title="0x01_Cross_Toggle" desc="Toggling a node also flips the state of its four immediate cardinal neighbors. Plan for the ripple effect." color="text-pulse-500" />
                        <ManualPoint title="0x02_Neural_Probe" desc="If the sequence is lost, use Request_Probe to identify a node that must be toggled to reach the solution state." color="text-pulse-500" />
                        <ManualPoint title="0x03_Minimal_Attempts" desc="System stability is graded on moves. Fewer attempts indicate a higher-fidelity link with the core." color="text-pulse-500" />
                    </div>
                </section>
            </div>
            <footer className="p-4 bg-zinc-300 border-t-2 border-black shrink-0"><button onClick={onClose} className="w-full py-4 bg-pulse-600 text-white text-[10px] font-black uppercase italic shadow-lg active:scale-95">Confirm Protocols</button></footer>
        </div>
    </div>
);

// Added default export
export default GridResetPage;
