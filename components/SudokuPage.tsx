import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { generateSudoku } from '../services/sudoku';
import { PencilIcon, LightBulbIcon, EraserIcon, VoidIcon, XIcon, ArrowPathIcon, CpuChipIcon, SparklesIcon, BookOpenIcon, ExclamationTriangleIcon } from './icons';
import type { SudokuStats, SudokuDifficulty as Difficulty } from '../src/App';
import { saveHighScore, getHighScores, ScoreCategory } from '../services/highScoresService';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { soundService } from '../services/soundService';
import HighScoreTable from './HighScoreTable';
import Tooltip from './Tooltip';

type GameState = 'LOADING' | 'BOOTING' | 'IDLE' | 'PLAYING' | 'ERROR' | 'WON' | 'LOST';

interface Cell {
  value: number | null;
  isPrefilled: boolean;
  isCorrect?: boolean;
  notes: number[]; 
  isError: boolean;
}

type Grid = Cell[][];

const MISTAKE_LIMIT = 3;

const HeartIcon: React.FC<{ filled: boolean; animated?: boolean }> = ({ filled, animated }) => (
    <svg 
        className={`w-6 h-6 transition-all duration-500 ${filled ? 'text-app-accent drop-shadow-[0_0_8px_var(--app-accent)]' : 'text-zinc-800'} ${animated && !filled ? 'animate-bounce' : ''}`} 
        viewBox="0 0 24 24" 
        fill={filled ? "currentColor" : "none"} 
        stroke="currentColor" 
        strokeWidth="2"
    >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
);

const LogicGraphic: React.FC = () => (
    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 bg-app-accent/10 rounded-full animate-ping" />
        <div className="absolute inset-4 bg-app-accent/20 rounded-full animate-pulse" />
        <div className="relative z-10 p-8 bg-app-card rounded-[2rem] border-4 border-app-accent shadow-[0_0_30px_rgba(34,211,238,0.4)]">
            <CpuChipIcon className="w-16 h-16 text-app-accent" />
        </div>
        <div className="absolute -top-4 -left-4 text-[8px] font-mono text-app-accent uppercase tracking-widest animate-pulse font-black italic">CORE_STABILITY_SCAN</div>
    </div>
);

interface SudokuPageProps {
  stats: SudokuStats;
  onGameWin: (difficulty: Difficulty, time: number, isDaily: boolean) => void;
  onGameLoss: () => void;
  onBackToHub: () => void;
  onReturnToFeeds: () => void;
}

const SudokuPage: React.FC<SudokuPageProps> = ({ stats, onGameWin, onGameLoss, onBackToHub, onReturnToFeeds }) => {
    const [view, setView] = useState<'IDLE' | 'BOOTING' | 'PLAYING'>('IDLE');
    const [gameState, setGameState] = useState<GameState>('IDLE');
    const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
    const [grid, setGrid] = useState<Grid | null>(null);
    const [solution, setSolution] = useState<number[][] | null>(null);
    const [mistakes, setMistakes] = useState<number>(0);
    const [time, setTime] = useState<number>(0);
    const [bootLog, setBootLog] = useState<string[]>([]);
    
    const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
    const [isNotesMode, setIsNotesMode] = useState(false);
    const [initials, setInitials] = useState("");
    const [showScores, setShowScores] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [isDailyChallenge, setIsDailyChallenge] = useState(false);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        if (view === 'IDLE') {
            const interval = setInterval(() => setShowScores(prev => !prev), 5000);
            return () => clearInterval(interval);
        }
    }, [view]);

    const stringToGrid = (puzzleString: string): Grid =>
        Array.from({ length: 9 }, (_, r) =>
            Array.from({ length: 9 }, (_, c) => {
                const valChar = puzzleString[r * 9 + c];
                const value = (valChar === '0' || valChar === '.' || !valChar) ? null : parseInt(valChar, 10);
                return { value, isPrefilled: value !== null, notes: [], isError: false };
            })
        );
    
    const startTimer = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = window.setInterval(() => setTime(prevTime => prevTime + 1), 1000);
    }, []);

    const stopTimer = useCallback(() => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }, []);

    const formatTime = (seconds: number | null) => {
        if (seconds === null) return "--:--";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const handleInitReboot = async () => {
        soundService.playAction();
        setView('BOOTING');
        setGameState('BOOTING');
        setBootLog([]);
        const logs = [
            "> mount -o logic matrix_0x00.dat",
            "> for sector in 0..8: verify_symmetry(sector)",
            "> while grid_is_unstable: assign_frequencies()",
            "> checking_collisions... NONE",
            "> locking_prefilled_nodes... DONE",
            "> SYSTEM_READY: CALIBRATION_REQUIRED"
        ];
        for(let i=0; i<logs.length; i++) {
            setBootLog(prev => [...prev, logs[i]]);
            soundService.playPop();
            await new Promise(r => setTimeout(r, 400));
        }
        await startNewGame(difficulty);
    };

    const startNewGame = useCallback(async (newDifficulty: Difficulty, isDaily: boolean = false) => {
        setGameState('LOADING');
        setSelectedCell({ row: 4, col: 4 });
        setDifficulty(newDifficulty);
        setIsDailyChallenge(isDaily);
        try {
            const now = new Date();
            const seed = isDaily ? parseInt(`${now.getFullYear()}${now.getMonth() + 1}${now.getDate()}`, 10) : undefined;
            const { puzzle, solution: sol } = await generateSudoku(isDaily ? 'Hard' : newDifficulty, seed);
            setGrid(stringToGrid(puzzle));
            setSolution(sol);
            setIsNotesMode(false);
            setMistakes(0);
            setTime(0);
            setInitials("");
            setGameState('PLAYING');
            setView('PLAYING');
            startTimer();
        } catch (error) { setGameState('ERROR'); }
    }, [startTimer]);

    const handleSaveScore = () => {
        soundService.playClick();
        const cat = `sudoku_${difficulty.toLowerCase()}` as ScoreCategory;
        saveHighScore(cat, { name: initials.toUpperCase() || "???", score: time, displayValue: formatTime(time), date: new Date().toISOString() }, true);
        setView('IDLE');
        setGameState('IDLE');
    };

    const handleCellClick = (row: number, col: number) => {
        if (gameState !== 'PLAYING') return;
        soundService.playClick();
        setSelectedCell({ row, col });
    };

    const handleNumberInput = (num: number) => {
        if (!selectedCell || !grid || !solution || grid[selectedCell.row][selectedCell.col].isPrefilled || gameState !== 'PLAYING') return;
        const { row, col } = selectedCell;
        let newGrid: Grid = grid.map(r => r.map(c => ({...c, notes: [...c.notes]})));
        if (isNotesMode) {
            soundService.playPop();
            let notes = newGrid[row][col].notes;
            if (notes.includes(num)) notes = notes.filter(n => n !== num); else notes.push(num);
            newGrid[row][col].notes = notes;
        } else {
            if (solution[row][col] === num) {
                soundService.playCorrect();
                newGrid[row][col].value = num;
                newGrid[row][col].isError = false;
                newGrid[row][col].notes = [];
            } else {
                soundService.playWrong();
                newGrid[row][col].value = num; 
                newGrid[row][col].isError = true;
                setMistakes(m => {
                    const next = m + 1;
                    if (next >= MISTAKE_LIMIT) {
                        soundService.playLoss();
                        setGameState('LOST');
                        onGameLoss();
                    }
                    return next;
                });
            }
        }
        setGrid(newGrid);
        if (newGrid.every(r => r.every(c => c.value !== null && !c.isError))) {
            soundService.playWin(); setGameState('WON'); stopTimer(); onGameWin(difficulty, time, isDailyChallenge);
        }
    };

    // Keyboard/Remote D-Pad Logic
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameState !== 'PLAYING' || !selectedCell) return;
            const { row, col } = selectedCell;

            if (e.key === 'ArrowUp') setSelectedCell({ row: Math.max(0, row - 1), col });
            else if (e.key === 'ArrowDown') setSelectedCell({ row: Math.min(8, row + 1), col });
            else if (e.key === 'ArrowLeft') setSelectedCell({ row, col: Math.max(0, col - 1) });
            else if (e.key === 'ArrowRight') setSelectedCell({ row, col: Math.min(8, col + 1) });
            else if (e.key >= '1' && e.key <= '9') handleNumberInput(parseInt(e.key, 10));
            else if (e.key === 'Backspace' || e.key === 'Delete') {
                if (!grid![row][col].isPrefilled) {
                    const ng = grid!.map(r => r.map(c => ({...c})));
                    ng[row][col].value = null;
                    ng[row][col].notes = [];
                    ng[row][col].isError = false;
                    setGrid(ng);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState, selectedCell, grid, handleNumberInput]);

    const usedInConstraints = useMemo(() => {
        if (!selectedCell || !grid) return new Set<number>();
        const { row: r, col: c } = selectedCell;
        const used = new Set<number>();
        for (let i = 0; i < 9; i++) {
            if (grid[r][i].value && !grid[r][i].isError) used.add(grid[r][i].value!);
            if (grid[i][c].value && !grid[i][c].isError) used.add(grid[i][c].value!);
        }
        const startR = Math.floor(r / 3) * 3, startC = Math.floor(c / 3) * 3;
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
            const val = grid[startR + i][startC + j].value;
            if (val && !grid[startR + i][startC + j].isError) used.add(val);
        }
        return used;
    }, [selectedCell, grid]);

    if (view === 'IDLE') {
        return (
            <div className="w-full h-full bg-app-bg flex flex-col items-center justify-center p-6 overflow-y-auto scrollbar-hide">
                <div className="w-full max-w-sm text-center bg-app-card p-8 md:p-10 rounded-[3rem] border-4 border-app-accent shadow-[0_0_50px_rgba(34,211,238,0.1)] mb-6">
                    <header className="mb-8">
                        <span className="text-[10px] font-black uppercase text-app-accent tracking-[0.3em] italic block mb-1">Matrix Calibration</span>
                        <h2 className="text-3xl font-black text-app-text italic uppercase tracking-tighter leading-none">PATTERN ZERO</h2>
                    </header>
                    <div className="flex gap-1.5 mb-8">
                        {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
                            <button key={d} onClick={() => { soundService.playClick(); setDifficulty(d); }} className={`flex-1 py-2 rounded-xl font-black uppercase italic text-[9px] transition-all border ${difficulty === d ? 'bg-app-accent border-app-accent text-app-bg shadow-lg' : 'bg-zinc-800 border-white/5 text-zinc-500'}`}>{d}</button>
                        ))}
                    </div>
                    <div className="h-[240px] flex items-center justify-center mb-8 overflow-hidden relative">
                        <div key={showScores ? 'scores' : 'graphic'} className="w-full animate-fade-in">
                            {showScores ? <HighScoreTable entries={getHighScores(`sudoku_${difficulty.toLowerCase()}` as ScoreCategory)} title={difficulty} /> : <LogicGraphic />}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <button onClick={handleInitReboot} className="w-full py-5 bg-app-text text-app-bg font-black uppercase italic rounded-2xl hover:scale-[1.02] transition-all shadow-xl active:scale-95 text-lg">RE-CALIBRATE CORE</button>
                        <button onClick={() => { soundService.playClick(); setShowHelp(true); }} className="w-full py-3 bg-zinc-800 text-zinc-400 font-black uppercase italic rounded-xl border border-white/5 hover:text-white transition-all text-[10px] tracking-widest flex items-center justify-center gap-2"><BookOpenIcon className="w-4 h-4" /> Tactical Manual</button>
                        <button onClick={onBackToHub} className="text-zinc-500 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors pt-2 block w-full italic tracking-[0.2em]">Abort Link</button>
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'BOOTING') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-black/90 p-8 text-left font-mono relative z-20">
                <div className="max-w-md w-full">
                    <div className="mb-8 flex items-center gap-4">
                        <CpuChipIcon className="w-10 h-10 text-app-accent animate-pulse" />
                        <span className="text-xl font-black text-white italic">GRID_RECALIBRATION...</span>
                    </div>
                    <div className="space-y-2 border-l-2 border-app-accent/30 pl-4 py-2 bg-zinc-950/50">
                        {bootLog.map((log, i) => (
                            <p key={i} className="text-[10px] md:text-xs text-app-accent font-black uppercase tracking-widest animate-fade-in">{log}</p>
                        ))}
                    </div>
                    <div className="mt-12 h-1 w-full bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-white/5">
                        <div className="h-full bg-app-accent animate-pulse" style={{ width: `${(bootLog.length / 6) * 100}%` }} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <main className="w-full h-full bg-app-bg text-app-text flex flex-col items-center justify-center font-sans overflow-y-auto scrollbar-hide pt-[calc(4rem+var(--safe-top))] relative pb-20">
            <style>{`
                .grid-crt::before {
                    content: " "; display: block; position: absolute; top: 0; left: 0; bottom: 0; right: 0;
                    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%), 
                                repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34, 211, 238, 0.05) 2px, rgba(34, 211, 238, 0.05) 4px);
                    z-index: 10; pointer-events: none;
                }
            `}</style>

            <div className="max-w-md w-full h-full flex flex-col p-4 gap-4 z-10">
                <header className="flex justify-between items-center bg-app-card/80 p-4 rounded-3xl border border-white/5 backdrop-blur-xl shrink-0">
                    <button onClick={() => { soundService.playWrong(); setView('IDLE'); }} className="p-2 bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors focus:ring-2 focus:ring-app-accent"><XIcon className="w-6 h-6" /></button>
                    <div className="flex gap-4 items-center">
                        <div className="flex items-center gap-1">
                            {[...Array(3)].map((_, i) => <HeartIcon key={i} filled={i < 3 - mistakes} animated={i === 2 - mistakes} />)}
                        </div>
                        <div className="w-px h-8 bg-zinc-800 mx-1" />
                        <div className="text-right"><span className="text-[8px] font-black uppercase text-zinc-500 block mb-0.5 italic">Uptime</span><span className="text-sm font-black font-mono text-app-text leading-none">{formatTime(time)}</span></div>
                    </div>
                    <button onClick={() => { soundService.playClick(); setShowHelp(true); }} className="p-2 bg-zinc-800 rounded-xl text-zinc-400 hover:text-app-accent border border-white/5 transition-colors focus:ring-2 focus:ring-app-accent"><BookOpenIcon className="w-6 h-6" /></button>
                </header>

                <div className="flex-grow flex items-center justify-center min-h-0">
                    <div className="aspect-square w-full max-w-[360px] grid grid-cols-9 bg-app-card border-[4px] border-app-accent shadow-[0_0_50px_rgba(34,211,238,0.3)] relative overflow-hidden ring-1 ring-white/5 rounded-lg grid-crt">
                        {grid?.map((row, r) => row.map((cell, c) => {
                            const isSelected = selectedCell?.row === r && selectedCell?.col === c;
                            const isSameValue = cell.value !== null && selectedCell && grid[selectedCell.row][selectedCell.col].value === cell.value;
                            const isSameSector = selectedCell && (Math.floor(r/3) === Math.floor(selectedCell.row/3)) && (Math.floor(c/3) === Math.floor(selectedCell.col/3));
                            const borderR = (c + 1) % 3 === 0 && c < 8 ? 'border-r-[3px] border-app-accent' : c < 8 ? 'border-r border-zinc-800' : '';
                            const borderB = (r + 1) % 3 === 0 && r < 8 ? 'border-b-[3px] border-app-accent' : r < 8 ? 'border-b border-zinc-800' : '';
                            const borderCls = `${borderR} ${borderB}`;
                            let cellBg = isSelected ? "bg-app-accent text-app-bg scale-105 z-20 shadow-xl" : isSameValue ? "bg-app-accent/20" : isSameSector ? "bg-zinc-800/40" : "bg-app-card/40";
                            return (
                                <div key={`${r}-${c}`} onClick={() => handleCellClick(r, c)} className={`aspect-square flex items-center justify-center text-xl font-black cursor-pointer transition-all duration-150 ${cellBg} ${borderCls}`}>
                                    {cell.value ? <span className={cell.isError ? 'text-pulse-500 animate-pulse' : cell.isPrefilled ? 'text-app-text/40' : 'text-app-accent'}>{cell.value}</span> : (
                                        <div className="grid grid-cols-3 gap-[1px] p-0.5 w-full h-full opacity-20">
                                            {[1,2,3,4,5,6,7,8,9].map(n => <div key={n} className="flex items-center justify-center text-[6px] font-black text-app-accent">{cell.notes.includes(n) ? n : ''}</div>)}
                                        </div>
                                    )}
                                </div>
                            );
                        }))}
                    </div>
                </div>

                <div className="flex-shrink-0 grid grid-cols-6 gap-2 pb-8">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
                        const isBlocked = selectedCell && usedInConstraints.has(num);
                        return (
                            <button key={num} onClick={() => handleNumberInput(num)} disabled={!!isBlocked}
                                className={`aspect-square border-2 rounded-xl text-xl font-black italic transition-all active:scale-90 shadow-lg ${isBlocked ? 'bg-black border-zinc-900 text-zinc-800 opacity-20 grayscale' : 'bg-zinc-800 border-white/10 text-app-text hover:bg-app-accent hover:text-app-bg focus:ring-2 focus:ring-white'}`}>
                                {num}
                            </button>
                        );
                    })}
                    <button onClick={() => { soundService.playClick(); setIsNotesMode(!isNotesMode); }} className={`aspect-square rounded-xl flex items-center justify-center transition-all border-2 focus:ring-2 focus:ring-white ${isNotesMode ? 'bg-app-accent border-white text-app-bg' : 'bg-zinc-800 border-white/5 text-zinc-500'}`}><PencilIcon className="w-6 h-6" /></button>
                    <button onClick={() => { if (!selectedCell || !grid || !solution) return; soundService.playAction(); handleNumberInput(solution[selectedCell.row][selectedCell.col]); }} className="aspect-square bg-zinc-800 border border-white/5 rounded-xl flex items-center justify-center text-amber-500 active:scale-90 focus:ring-2 focus:ring-white"><LightBulbIcon className="w-6 h-6" /></button>
                    <button onClick={() => { if (!selectedCell || !grid) return; const {row, col} = selectedCell; if (grid[row][col].isPrefilled) return; soundService.playWrong(); const ng = grid.map(r=>r.map(c=>({...c, notes:[...c.notes]}))); ng[row][col].value = null; ng[row][col].notes = []; ng[row][col].isError = false; setGrid(ng); }} className="aspect-square bg-zinc-800 border border-white/5 rounded-xl flex items-center justify-center text-zinc-500 active:scale-90 focus:ring-2 focus:ring-white"><EraserIcon className="w-6 h-6" /></button>
                </div>
            </div>

            {showHelp && <TacticalManual onClose={() => { soundService.playClick(); setShowHelp(false); }} />}

            {(gameState === 'WON' || gameState === 'LOST') && (
                <div className="fixed inset-0 bg-black/98 backdrop-blur-xl z-50 flex items-center justify-center p-6 text-center animate-fade-in">
                    <div className={`max-w-sm w-full bg-app-card p-10 rounded-[3rem] border-4 ${gameState === 'WON' ? 'border-app-accent shadow-[0_0_100px_rgba(34,211,238,0.2)]' : 'border-pulse-500 shadow-[0_0_100px_rgba(225,29,72,0.2)]'}`}>
                        <h2 className={`text-4xl font-black italic uppercase tracking-tighter mb-4 ${gameState === 'WON' ? 'text-app-accent' : 'text-pulse-500'}`}>{gameState === 'WON' ? 'MATRIX STABLE' : 'KERNEL PANIC'}</h2>
                        {gameState === 'WON' ? (
                            <div className="mb-8"><p className="text-[9px] text-zinc-500 uppercase font-black mb-4">Register Stability Token</p><input autoFocus maxLength={3} value={initials} onChange={e => setInitials(e.target.value.toUpperCase())} className="bg-black/50 border-2 border-app-accent text-white rounded-xl px-4 py-3 text-center text-2xl font-black w-32 outline-none uppercase italic" placeholder="???" /></div>
                        ) : <p className="text-zinc-500 text-[10px] font-black uppercase mb-10 leading-relaxed italic">Numerical matrix fragmented.<br/>Grid calibration failed.</p>}
                        <button onClick={gameState === 'WON' ? handleSaveScore : () => { soundService.playClick(); setView('IDLE'); }} className="w-full py-5 bg-app-accent text-app-bg font-black text-lg italic uppercase rounded-full shadow-xl active:scale-95 transition-transform">Transmit Sequence</button>
                    </div>
                </div>
            )}
        </main>
    );
};

const TacticalManual: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-10 font-mono" onClick={onClose}>
        <div className="max-w-xl w-full bg-app-card border-4 border-app-accent rounded-[2.5rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <header className="h-12 bg-app-accent flex items-center justify-between px-1 relative z-20 border-b-2 border-black shrink-0">
                <div className="flex items-center gap-2 h-full"><div className="w-10 h-8 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center"><BookOpenIcon className="w-5 h-5 text-black" /></div><h2 className="text-app-bg text-[10px] font-black uppercase tracking-[0.2em] italic px-2">SYMMETRY_VERIFICATION.PDF</h2></div>
                <button onClick={onClose} className="w-10 h-8 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center active:bg-zinc-400 transition-colors"><XIcon className="w-5 h-5 text-black" /></button>
            </header>
            <div className="p-6 md:p-10 overflow-y-auto flex-grow bg-app-bg/40 relative">
                <div className="absolute inset-0 pointer-events-none opacity-5 cctv-overlay" />
                <section className="space-y-8 relative z-10">
                    <div>
                        <h3 className="text-lg font-black text-app-text italic uppercase tracking-tighter mb-4 flex items-center gap-3"><SparklesIcon className="w-5 h-5 text-app-accent" /> Matrix Stabilization</h3>
                        <p className="text-[10px] md:text-xs text-zinc-400 uppercase font-black leading-relaxed tracking-wider mb-4 border-l-2 border-app-accent/30 pl-4">The core logic matrix (Pattern Zero) has fragmented. Each sector and rail must contain a unique set of 1-9 frequencies.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                        <ManualPoint title="0x01_Numerical_Integrity" desc="No digit may repeat within a single horizontal rail, vertical rail, or 3x3 mainframe sector." color="text-app-accent" />
                        <ManualPoint title="0x02_Remote_Link" desc="Use D-Pad / Arrows to navigate nodes. Enter / OK to cycle digits. Backspace to clear entries." color="text-app-accent" />
                        <ManualPoint title="0x03_Stability_Faults" desc="The core can withstand only 3 logic faults. On the 4th, the matrix undergoes total collapse." color="text-app-accent" />
                    </div>
                    <div className="p-5 bg-app-accent/10 border-2 border-app-accent/30 rounded-2xl flex items-start gap-4">
                        <ExclamationTriangleIcon className="w-6 h-6 text-app-accent shrink-0 mt-0.5 animate-pulse" />
                        <div><p className="text-[9px] font-black text-app-accent uppercase tracking-widest mb-1 italic">Pro Tip: Sector Isolation</p><p className="text-[8px] text-zinc-500 uppercase font-black leading-tight italic">Focus on sectors with the highest density of locked nodes first.</p></div>
                    </div>
                </section>
            </div>
            <footer className="p-4 bg-zinc-300 border-t-2 border-black shrink-0"><button onClick={onClose} className="w-full py-4 bg-app-accent text-app-bg text-[10px] font-black uppercase italic shadow-lg active:opacity-90">ACKNOWLEDGE_STABILITY</button></footer>
        </div>
    </div>
);

const ManualPoint: React.FC<{ title: string; desc: string; color: string }> = ({ title, desc, color }) => (
    <div className="space-y-2 group">
        <h4 className={`text-[9px] font-black ${color} uppercase tracking-[0.3em] italic flex items-center gap-2`}><span className={`w-1.5 h-1.5 rounded-full ${color.replace('text-', 'bg-')} group-hover:scale-150 transition-transform`}></span>{title}</h4>
        <p className="text-[10px] md:text-xs text-zinc-300 font-bold uppercase tracking-wide leading-relaxed pl-3 border-l border-zinc-800">{desc}</p>
    </div>
);

export default SudokuPage;