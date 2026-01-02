
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { generateSudoku } from '../services/sudoku';
import { PencilIcon, LightBulbIcon, EraserIcon, VoidIcon, XIcon, ArrowPathIcon, CpuChipIcon, SparklesIcon, BookOpenIcon, ExclamationTriangleIcon } from './icons';
import type { SudokuStats, SudokuDifficulty as Difficulty } from '../src/App';
import { saveHighScore, getHighScores, ScoreCategory } from '../services/highScoresService';
import { useLocalStorage } from '../hooks/useLocalStorage';
import HighScoreTable from './HighScoreTable';
import Tooltip from './Tooltip';

type GameState = 'LOADING' | 'IDLE' | 'PLAYING' | 'ERROR' | 'WON' | 'LOST';

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
        className={`w-6 h-6 transition-all duration-500 ${filled ? 'text-pulse-500 drop-shadow-[0_0_8px_#e11d48]' : 'text-zinc-800'} ${animated && !filled ? 'animate-bounce' : ''}`} 
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
        <div className="absolute inset-0 bg-neon-400/10 rounded-full animate-ping" />
        <div className="absolute inset-4 bg-neon-400/20 rounded-full animate-pulse" />
        <div className="relative z-10 p-8 bg-zinc-900 rounded-[2rem] border-4 border-neon-400 shadow-[0_0_30px_rgba(34,211,238,0.4)]">
            <CpuChipIcon className="w-16 h-16 text-neon-400" />
        </div>
        <div className="absolute -top-4 -left-4 text-[8px] font-mono text-neon-400 uppercase tracking-widest animate-pulse font-black italic">ANALYSIS_ACTIVE</div>
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
    const [view, setView] = useLocalStorage<'IDLE' | 'PLAYING'>('void_sudoku_view', 'IDLE');
    const [gameState, setGameState] = useLocalStorage<GameState>('void_sudoku_state', 'IDLE');
    const [difficulty, setDifficulty] = useLocalStorage<Difficulty>('void_sudoku_difficulty', 'Easy');
    const [grid, setGrid] = useLocalStorage<Grid | null>('void_sudoku_grid', null);
    const [solution, setSolution] = useLocalStorage<number[][] | null>('void_sudoku_solution', null);
    const [mistakes, setMistakes] = useLocalStorage<number>('void_sudoku_mistakes', 0);
    const [time, setTime] = useLocalStorage<number>('void_sudoku_time', 0);
    
    const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
    const [isNotesMode, setIsNotesMode] = useState(false);
    const [initials, setInitials] = useState("");
    const [showScores, setShowScores] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [isDailyChallenge, setIsDailyChallenge] = useState(false);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        if (view === 'IDLE') {
            const interval = setInterval(() => {
                setShowScores(prev => !prev);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [view]);

    const stringToGrid = (puzzleString: string): Grid =>
        Array.from({ length: 9 }, (_, r) =>
            Array.from({ length: 9 }, (_, c) => {
                const valChar = puzzleString[r * 9 + c];
                const value = (valChar === '0' || valChar === '.' || !valChar) ? null : parseInt(valChar, 10);
                return {
                    value,
                    isPrefilled: value !== null,
                    notes: [],
                    isError: false,
                };
            })
        );
    
    const startTimer = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = window.setInterval(() => {
            setTime(prevTime => prevTime + 1);
        }, 1000);
    }, [setTime]);

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const formatTime = (seconds: number | null) => {
        if (seconds === null) return "--:--";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const handleCellClick = (row: number, col: number) => {
        if (gameState !== 'PLAYING') return;
        setSelectedCell({ row, col });
    };

    const startNewGame = useCallback(async (newDifficulty: Difficulty, isDaily: boolean = false) => {
        setView('PLAYING');
        setGameState('LOADING');
        setSelectedCell(null);
        setDifficulty(newDifficulty);
        setIsDailyChallenge(isDaily);
        try {
            const now = new Date();
            const seed = isDaily ? parseInt(`${now.getFullYear()}${now.getMonth() + 1}${now.getDate()}`, 10) : undefined;
            const { puzzle, solution: sol } = await generateSudoku(isDaily ? 'Hard' : newDifficulty, seed);
            const newGrid = stringToGrid(puzzle);
            setGrid(newGrid);
            setSolution(sol);
            setIsNotesMode(false);
            setMistakes(0);
            setTime(0);
            setInitials("");
            setGameState('PLAYING');
            startTimer();
        } catch (error) {
            setGameState('ERROR');
        }
    }, [startTimer, setView, setGameState, setDifficulty, setGrid, setSolution, setMistakes, setTime]);

    const handleSaveScore = () => {
        const cat = `sudoku_${difficulty.toLowerCase()}` as ScoreCategory;
        saveHighScore(cat, {
            name: initials.toUpperCase() || "???",
            score: time,
            displayValue: formatTime(time),
            date: new Date().toISOString()
        }, true);
        setView('IDLE');
        setGameState('IDLE');
    };

    useEffect(() => {
        if (gameState === 'PLAYING') startTimer();
        return () => stopTimer();
    }, [gameState, startTimer, stopTimer]);

    const handleNumberInput = (num: number) => {
        if (!selectedCell || !grid || !solution || grid[selectedCell.row][selectedCell.col].isPrefilled || gameState !== 'PLAYING') return;
        
        const { row, col } = selectedCell;
        let newGrid: Grid = grid.map(r => r.map(c => ({...c, notes: [...c.notes]})));
        
        if (isNotesMode) {
            let notes = newGrid[row][col].notes;
            if (notes.includes(num)) notes = notes.filter(n => n !== num); else notes.push(num);
            newGrid[row][col].notes = notes;
        } else {
            if (solution[row][col] === num) {
                newGrid[row][col].value = num;
                newGrid[row][col].isError = false;
                newGrid[row][col].notes = [];
            } else {
                newGrid[row][col].value = num; 
                newGrid[row][col].isError = true;
                setMistakes(m => {
                    const next = m + 1;
                    if (next >= MISTAKE_LIMIT) {
                        setGameState('LOST');
                        onGameLoss();
                    }
                    return next;
                });
            }
        }
        setGrid(newGrid);
        if (newGrid.every(r => r.every(c => c.value !== null && !c.isError))) {
            setGameState('WON');
            stopTimer();
            onGameWin(difficulty, time, isDailyChallenge);
        }
    };

    // Calculate which numbers are already in the constraints of the selected cell
    const usedInConstraints = useMemo(() => {
        if (!selectedCell || !grid) return new Set<number>();
        const { row: r, col: c } = selectedCell;
        const used = new Set<number>();
        
        // Check Row
        for (let j = 0; j < 9; j++) if (grid[r][j].value && !grid[r][j].isError) used.add(grid[r][j].value!);
        // Check Col
        for (let i = 0; i < 9; i++) if (grid[i][c].value && !grid[i][c].isError) used.add(grid[i][c].value!);
        // Check 3x3 Block
        const startR = Math.floor(r / 3) * 3;
        const startC = Math.floor(c / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const val = grid[startR + i][startC + j].value;
                if (val && !grid[startR + i][startC + j].isError) used.add(val);
            }
        }
        return used;
    }, [selectedCell, grid]);

    if (view === 'IDLE') {
        const cat = `sudoku_${difficulty.toLowerCase()}` as ScoreCategory;
        const topScores = getHighScores(cat);
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-6 overflow-y-auto scrollbar-hide">
                <div className="w-full max-w-sm text-center bg-zinc-900 p-8 md:p-10 rounded-[3rem] border-4 border-neon-400 shadow-[0_0_50px_rgba(34,211,238,0.1)] mb-6">
                    <header className="mb-8">
                        <span className="text-[10px] font-black uppercase text-neon-400 tracking-[0.3em] italic block mb-1">Logic Analysis</span>
                        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">PATTERN ZERO</h2>
                    </header>
                    <div className="flex gap-1.5 mb-8">
                        {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
                            <button key={d} onClick={() => setDifficulty(d)} className={`flex-1 py-2 rounded-xl font-black uppercase italic text-[9px] transition-all border ${difficulty === d ? 'bg-neon-500 border-neon-400 text-white shadow-lg' : 'bg-zinc-800 border-white/5 text-zinc-500'}`}>{d}</button>
                        ))}
                    </div>
                    <div className="h-[240px] flex items-center justify-center mb-8 overflow-hidden relative">
                        <div key={showScores ? 'scores' : 'graphic'} className="w-full animate-glitch-in">
                            {showScores ? <HighScoreTable entries={topScores} title={difficulty} /> : <LogicGraphic />}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <button onClick={() => startNewGame(difficulty)} className="w-full py-4 bg-white text-black font-black uppercase italic rounded-2xl hover:scale-[1.02] transition-all shadow-xl active:scale-95">Initiate Sync</button>
                        <button onClick={() => setShowHelp(true)} className="w-full py-3 bg-zinc-800 text-zinc-400 font-black uppercase italic rounded-xl border border-white/5 hover:text-white transition-all text-[10px] tracking-widest flex items-center justify-center gap-2">
                            <BookOpenIcon className="w-4 h-4" /> Tactical Manual
                        </button>
                        <button onClick={onBackToHub} className="text-zinc-500 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors pt-2 block w-full italic tracking-[0.2em]">Abort Link</button>
                    </div>
                </div>
                {showHelp && <TacticalManual type="SUDOKU" onClose={() => setShowHelp(false)} />}
            </div>
        );
    }

    return (
        <main className="w-full h-full bg-zinc-950 text-white flex flex-col items-center justify-center font-sans overflow-y-auto scrollbar-hide relative">
            <div className="max-w-md w-full h-full flex flex-col p-4 gap-4 z-10">
                <header className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-3xl border border-white/5 flex-shrink-0 mt-[var(--safe-top)]">
                    <button onClick={onBackToHub} className="p-2 bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors"><XIcon className="w-6 h-6" /></button>
                    <div className="flex gap-4 items-center">
                        <div className="flex items-center gap-1">
                            <HeartIcon filled={mistakes < 1} animated={mistakes === 0} />
                            <HeartIcon filled={mistakes < 2} animated={mistakes === 1} />
                            <HeartIcon filled={mistakes < 3} animated={mistakes === 2} />
                        </div>
                        <div className="w-px h-8 bg-zinc-800 mx-1" />
                        <div><span className="text-[8px] font-black uppercase text-zinc-500 block leading-none mb-1 italic">Uptime</span><span className="text-sm font-black font-mono leading-none">{formatTime(time)}</span></div>
                    </div>
                    <button onClick={() => setShowHelp(true)} className="p-2 bg-zinc-800 rounded-xl text-zinc-400 hover:text-neon-400 transition-colors"><BookOpenIcon className="w-6 h-6" /></button>
                </header>

                <div className="flex-grow flex items-center justify-center min-h-0">
                    {gameState === 'LOADING' ? <div className="text-neon-400 font-black animate-pulse uppercase tracking-[0.4em] italic">Synthesizing...</div> : (
                        <div className="aspect-square w-full max-w-[360px] grid grid-cols-9 bg-zinc-900 border-[3px] border-neon-400 shadow-[0_0_50px_rgba(34,211,238,0.3)] relative overflow-hidden ring-1 ring-white/5">
                            {grid?.map((row, r) => row.map((cell, c) => {
                                const isSelected = selectedCell?.row === r && selectedCell?.col === c;
                                const selectedCellValue = selectedCell ? grid[selectedCell.row][selectedCell.col].value : null;
                                
                                const isSameValue = cell.value !== null && selectedCellValue !== null && cell.value === selectedCellValue;
                                const isSameRow = selectedCell?.row === r;
                                const isSameCol = selectedCell?.col === c;
                                
                                const blockIndex = Math.floor(r / 3) * 3 + Math.floor(c / 3);
                                const selectedBlockIndex = selectedCell ? Math.floor(selectedCell.row / 3) * 3 + Math.floor(selectedCell.col / 3) : -1;
                                const isSameBlock = blockIndex === selectedBlockIndex;

                                // 3x3 BLOCK BOUNDARIES
                                // Consistent borders for all cells, thick for block edges
                                const isRightBlockEdge = (c + 1) % 3 === 0 && c < 8;
                                const isBottomBlockEdge = (r + 1) % 3 === 0 && r < 8;
                                
                                const borderClasses = `
                                    border-r ${isRightBlockEdge ? 'border-r-4 border-neon-400/80' : 'border-r-zinc-700/50'}
                                    border-b ${isBottomBlockEdge ? 'border-b-4 border-neon-400/80' : 'border-b-zinc-700/50'}
                                `;

                                // HIGHLIGHT LOGIC
                                let cellBg = "bg-zinc-900/40";
                                if (isSelected) {
                                    cellBg = "bg-neon-500 shadow-[inset_0_0_15px_rgba(0,0,0,0.5)] scale-[1.02] z-20";
                                } else if (isSameValue) {
                                    cellBg = "bg-neon-400/30"; // Highlight same digits
                                } else if (isSameRow || isSameCol) {
                                    cellBg = "bg-amber-500/15"; // Amber row/column axis highlight
                                } else if (isSameBlock) {
                                    cellBg = "bg-zinc-800/40";
                                }

                                return (
                                    <div 
                                        key={`${r}-${c}`} 
                                        onClick={() => handleCellClick(r, c)} 
                                        className={`aspect-square flex items-center justify-center text-xl font-bold cursor-pointer transition-all duration-150 ${cellBg} ${borderClasses}`}
                                    >
                                        {cell.value !== null ? (
                                            <span className={`
                                                ${cell.isError ? 'text-pulse-500' : cell.isPrefilled ? 'text-white' : 'text-emerald-400'} 
                                                ${isSelected ? 'text-black' : ''}
                                            `}>
                                                {cell.value}
                                            </span>
                                        ) : (
                                            <div className="grid grid-cols-3 gap-[1px] p-1 w-full h-full opacity-30">
                                                {[1,2,3,4,5,6,7,8,9].map(n => (
                                                    <div key={n} className="flex items-center justify-center text-[7px] leading-none font-black text-neon-400">
                                                        {cell.notes.includes(n) ? n : ''}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            }))}
                        </div>
                    )}
                </div>

                <div className="flex-shrink-0 grid grid-cols-6 gap-2 pb-8">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
                        const isBlocked = selectedCell && usedInConstraints.has(num);
                        return (
                            <button 
                                key={num} 
                                onClick={() => handleNumberInput(num)} 
                                disabled={isBlocked === true}
                                className={`aspect-square border-2 rounded-xl text-xl font-black italic transition-all active:scale-90 shadow-lg
                                    ${isBlocked 
                                        ? 'bg-zinc-950 border-zinc-900 text-zinc-800 opacity-30 grayscale cursor-not-allowed' 
                                        : 'bg-zinc-800 border-white/10 text-white hover:bg-neon-500 hover:text-black hover:border-white'}`}
                            >
                                {num}
                            </button>
                        );
                    })}
                    <Tooltip text="Neural Probe: Mark potential node values without committing.">
                        <button onClick={() => setIsNotesMode(!isNotesMode)} className={`aspect-square rounded-xl flex items-center justify-center transition-all border-2 w-full h-full ${isNotesMode ? 'bg-neon-400 border-white text-black' : 'bg-zinc-800 border-white/5 text-zinc-500'}`}><PencilIcon className="w-6 h-6" /></button>
                    </Tooltip>
                    <Tooltip text="Logic Siphon: Reveal correct node value (25 SC).">
                        <button onClick={() => { if (!selectedCell || !grid || !solution) return; handleNumberInput(solution[selectedCell.row][selectedCell.col]); }} className="aspect-square bg-zinc-800 border border-white/5 rounded-xl flex items-center justify-center text-yellow-500 active:scale-90 w-full h-full"><LightBulbIcon className="w-6 h-6" /></button>
                    </Tooltip>
                    <Tooltip text="Node Eraser: Clear current bit selection.">
                        <button onClick={() => { if (!selectedCell || !grid) return; const {row, col} = selectedCell; if (grid[row][col].isPrefilled) return; const ng = grid.map(r=>r.map(c=>({...c, notes:[...c.notes]}))); ng[row][col].value = null; ng[row][col].notes = []; ng[row][col].isError = false; setGrid(ng); }} className="aspect-square bg-zinc-800 border border-white/5 rounded-xl flex items-center justify-center text-zinc-400 active:scale-90 w-full h-full"><EraserIcon className="w-6 h-6" /></button>
                    </Tooltip>
                </div>
            </div>

            {showHelp && <TacticalManual type="SUDOKU" onClose={() => setShowHelp(false)} />}

            {(gameState === 'WON' || gameState === 'LOST') && (
                <div className="fixed inset-0 bg-black/98 backdrop-blur-xl z-50 flex items-center justify-center p-6 text-center">
                    <div className="max-w-sm w-full bg-zinc-900 p-10 rounded-[3rem] border-4 border-neon-400 text-center shadow-[0_0_120px_rgba(34,211,238,0.2)]">
                        <h2 className={`text-4xl font-black italic uppercase tracking-tighter mb-4 ${gameState === 'WON' ? 'text-neon-400' : 'text-pulse-500'}`}>{gameState === 'WON' ? 'SYSTEM_CLEAN' : 'KERNAL_PANIC'}</h2>
                        {gameState === 'WON' ? (
                            <div className="mb-8"><input autoFocus maxLength={3} value={initials} onChange={e => setInitials(e.target.value.toUpperCase())} className="bg-black/50 border-2 border-neon-400 text-white rounded-xl px-4 py-3 text-center text-2xl font-black w-32 outline-none uppercase italic" placeholder="???" /></div>
                        ) : <p className="text-zinc-500 text-xs mb-8">Memory corrupted. Access denied.</p>}
                        <button onClick={gameState === 'WON' ? handleSaveScore : () => setView('IDLE')} className="w-full py-4 bg-neon-500 text-black font-black text-lg italic uppercase rounded-full shadow-xl">Transmit Signal</button>
                    </div>
                </div>
            )}
        </main>
    );
};

const TacticalManual: React.FC<{ onClose: () => void; type: string }> = ({ onClose, type }) => {
    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-10 font-mono" onClick={onClose}>
            <div className="max-w-xl w-full bg-zinc-900 border-4 border-neon-400 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh] pt-[var(--safe-top)] pb-[var(--safe-bottom)]" onClick={e => e.stopPropagation()}>
                
                <header className="h-12 bg-neon-600 flex items-center justify-between px-1 relative z-20 border-b-2 border-black shrink-0">
                    <div className="flex items-center gap-2 h-full">
                        <div className="w-10 h-8 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center">
                           <BookOpenIcon className="w-5 h-5 text-black" />
                        </div>
                        <h2 className="text-white text-[10px] font-black uppercase tracking-[0.2em] italic px-2">LOGIC_RECOVERY_PROTOCOL.PDF</h2>
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
                                <SparklesIcon className="w-5 h-5 text-neon-400" />
                                <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Grid Recalibration</h3>
                            </div>
                            <p className="text-[10px] md:text-xs text-zinc-400 uppercase font-black leading-relaxed tracking-wider mb-4 border-l-2 border-neon-400/30 pl-4">
                                Pattern Zero requires precise numerical sequencing. Stabilize the grid to restore system logic.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <ManualPoint title="0x01_Node_Isolation" desc="Scan for rows, columns, or 3x3 blocks missing a single frequency bit. These are your entry points." color="text-neon-400" />
                            <ManualPoint title="0x02_Cross_Analysis" desc="Compare overlapping row and column data to eliminate redundant digits and reveal hidden node values." color="text-neon-400" />
                            <ManualPoint title="0x03_Note_Buffering" desc="Use the Neural Probe (Pencil) to map multiple possibilities within a single node before committing." color="text-neon-400" />
                            <ManualPoint title="0x04_The_Block_Rule" desc="Every 3x3 mainframe segment must contain bits 1 through 9. Verify integrity often." color="text-neon-400" />
                        </div>

                        <div className="p-5 bg-neon-400/10 border-2 border-neon-400/30 rounded-2xl flex items-start gap-4">
                            <ExclamationTriangleIcon className="w-6 h-6 text-neon-400 shrink-0 mt-0.5 animate-pulse" />
                            <div>
                                <p className="text-[9px] font-black text-neon-400 uppercase tracking-widest mb-1 italic">Pro Tip: Mistake Mitigation</p>
                                <p className="text-[8px] text-zinc-500 uppercase font-black leading-tight italic">
                                    Operator, three logic faults will trigger a kernel panic. Commit only when frequency alignment is verified.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>

                <footer className="p-4 bg-zinc-300 border-t-2 border-black shrink-0">
                    <button onClick={onClose} className="w-full py-4 bg-neon-600 border-t-2 border-l-2 border-white/50 border-b-2 border-r-2 border-neon-950 text-[10px] font-black uppercase italic text-white hover:bg-neon-500 active:bg-neon-700 transition-all shadow-lg">
                        CONFIRM_PROTOCOLS
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

export default SudokuPage;
