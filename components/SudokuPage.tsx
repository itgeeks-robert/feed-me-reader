
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { generateSudoku } from '../services/sudoku';
import { PencilIcon, LightBulbIcon, EraserIcon, VoidIcon, XIcon, ArrowPathIcon, CpuChipIcon, SparklesIcon } from './icons';
import type { SudokuStats, SudokuDifficulty as Difficulty } from '../src/App';
import { saveHighScore, getHighScores, ScoreCategory } from '../services/highScoresService';
import HighScoreTable from './HighScoreTable';

type GameState = 'LOADING' | 'IDLE' | 'PLAYING' | 'ERROR' | 'WON' | 'LOST';

interface Cell {
  value: number | null;
  isPrefilled: boolean;
  notes: Set<number>;
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

interface SudokuPageProps {
  stats: SudokuStats;
  onGameWin: (difficulty: Difficulty, time: number, isDaily: boolean) => void;
  onGameLoss: () => void;
  onBackToHub: () => void;
  onReturnToFeeds: () => void;
}

const SudokuPage: React.FC<SudokuPageProps> = ({ stats, onGameWin, onGameLoss, onBackToHub, onReturnToFeeds }) => {
    const [view, setView] = useState<'IDLE' | 'PLAYING'>('IDLE');
    const [gameState, setGameState] = useState<GameState>('IDLE');
    const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
    const [isDailyChallenge, setIsDailyChallenge] = useState(false);
    const [grid, setGrid] = useState<Grid | null>(null);
    const [solution, setSolution] = useState<number[][] | null>(null);
    const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
    const [isNotesMode, setIsNotesMode] = useState(false);
    const [isSmartPad, setIsSmartPad] = useState(false);
    const [mistakes, setMistakes] = useState(0);
    const [time, setTime] = useState(0);
    const [initials, setInitials] = useState("");
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [completedRows, setCompletedRows] = useState<Set<number>>(new Set());
    const [completedCols, setCompletedCols] = useState<Set<number>>(new Set());
    const [completedBlocks, setCompletedBlocks] = useState<Set<number>>(new Set());
    const [lastCompleted, setLastCompleted] = useState<{type: 'row' | 'col' | 'block', index: number} | null>(null);

    const stringToGrid = (puzzleString: string): Grid =>
        Array.from({ length: 9 }, (_, r) =>
            Array.from({ length: 9 }, (_, c) => {
                const valChar = puzzleString[r * 9 + c];
                const value = (valChar === '0' || valChar === '.' || !valChar) ? null : parseInt(valChar, 10);
                return {
                    value,
                    isPrefilled: value !== null,
                    notes: new Set(),
                    isError: false,
                };
            })
        );
    
    const startTimer = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTime(prevTime => prevTime + 1);
        }, 1000);
    }, []);

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

    const checkCompletions = (currentGrid: Grid) => {
        const newRows = new Set<number>();
        const newCols = new Set<number>();
        const newBlocks = new Set<number>();

        for (let r = 0; r < 9; r++) {
            if (currentGrid[r].every(c => c.value !== null && !c.isError)) newRows.add(r);
        }
        for (let c = 0; c < 9; c++) {
            let full = true;
            for (let r = 0; r < 9; r++) if (currentGrid[r][c].value === null || currentGrid[r][c].isError) full = false;
            if (full) newCols.add(c);
        }
        for (let b = 0; b < 9; b++) {
            let full = true;
            const startR = Math.floor(b / 3) * 3;
            const startC = (b % 3) * 3;
            for (let r = startR; r < startR + 3; r++) {
                for (let c = startC; c < startC + 3; c++) {
                    if (currentGrid[r][c].value === null || currentGrid[r][c].isError) full = false;
                }
            }
            if (full) newBlocks.add(b);
        }

        const justDoneRow = Array.from(newRows).find(r => !completedRows.has(r));
        const justDoneCol = Array.from(newCols).find(c => !completedCols.has(c));
        const justDoneBlock = Array.from(newBlocks).find(b => !completedBlocks.has(b));

        if (justDoneRow !== undefined) setLastCompleted({type: 'row', index: justDoneRow});
        else if (justDoneCol !== undefined) setLastCompleted({type: 'col', index: justDoneCol});
        else if (justDoneBlock !== undefined) setLastCompleted({type: 'block', index: justDoneBlock});

        setCompletedRows(newRows);
        setCompletedCols(newCols);
        setCompletedBlocks(newBlocks);

        if (justDoneRow !== undefined || justDoneCol !== undefined || justDoneBlock !== undefined) {
            setTimeout(() => setLastCompleted(null), 1000);
        }
    };

    const cellContext = useMemo(() => {
        if (!selectedCell || !grid) return { 
            inBlock: new Set<number>(),
            inRow: new Set<number>(),
            inCol: new Set<number>(),
            invalid: new Set<number>()
        };

        const { row, col } = selectedCell;
        const inRow = new Set<number>();
        const inCol = new Set<number>();
        const inBlock = new Set<number>();
        
        for (let i = 0; i < 9; i++) {
            if (grid[row][i].value && !grid[row][i].isError) inRow.add(grid[row][i].value!);
            if (grid[i][col].value && !grid[i][col].isError) inCol.add(grid[i][col].value!);
        }
        
        const boxRowStart = Math.floor(row / 3) * 3;
        const boxColStart = Math.floor(col / 3) * 3;
        for (let r = boxRowStart; r < boxRowStart + 3; r++) {
            for (let c = boxColStart; c < boxColStart + 3; c++) {
                if (grid[r][c].value && !grid[r][c].isError) inBlock.add(grid[r][c].value!);
            }
        }
        
        const invalid = new Set([...inRow, ...inCol, ...inBlock]);
        return { inRow, inCol, inBlock, invalid };
    }, [selectedCell, grid]);

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
        setCompletedRows(new Set());
        setCompletedCols(new Set());
        setCompletedBlocks(new Set());
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
            checkCompletions(newGrid);
        } catch (error) {
            setGameState('ERROR');
        }
    }, [startTimer]);

    const handleSaveScore = () => {
        const cat = `sudoku_${difficulty.toLowerCase()}` as ScoreCategory;
        saveHighScore(cat, {
            name: initials.toUpperCase() || "???",
            score: time,
            displayValue: formatTime(time),
            date: new Date().toISOString()
        }, true);
        onBackToHub();
    };

    useEffect(() => {
        return () => stopTimer();
    }, [stopTimer]);

    const handleNumberInput = (num: number) => {
        if (!selectedCell || !grid || !solution || grid[selectedCell.row][selectedCell.col].isPrefilled || gameState !== 'PLAYING') return;
        
        const { row, col } = selectedCell;
        let newGrid: Grid = grid.map(r => r.map(c => ({...c, notes: new Set(c.notes)})));
        
        if (isNotesMode) {
            const notes = newGrid[row][col].notes;
            if (notes.has(num)) notes.delete(num); else notes.add(num);
        } else {
            if (solution[row][col] === num) {
                newGrid[row][col].value = num;
                newGrid[row][col].isError = false;
                newGrid[row][col].notes = new Set();
                checkCompletions(newGrid);
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

    if (view === 'IDLE') {
        const cat = `sudoku_${difficulty.toLowerCase()}` as ScoreCategory;
        const topScores = getHighScores(cat);
        const today = new Date().toISOString().split('T')[0];
        const hasDoneDaily = stats.lastDailyCompletionDate === today;

        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-6 overflow-y-auto scrollbar-hide">
                <div className="w-full max-w-sm text-center bg-zinc-900 p-8 md:p-10 rounded-[3rem] border-4 border-signal-500 shadow-[0_0_50px_rgba(34,197,94,0.1)] mb-6">
                    <div className="p-3 bg-signal-500/10 border border-signal-500/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <VoidIcon className="w-10 h-10 text-signal-500" />
                    </div>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">PATTERN ZERO</h2>
                    
                    <div className="flex gap-2 mb-6">
                        {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
                            <button key={d} onClick={() => setDifficulty(d)} className={`flex-1 py-2.5 rounded-xl font-black uppercase italic text-[10px] transition-all border ${difficulty === d ? 'bg-signal-600 border-signal-400 text-white shadow-lg' : 'bg-zinc-800 border-white/5 text-zinc-500'}`}>{d}</button>
                        ))}
                    </div>

                    <HighScoreTable entries={topScores} title={difficulty} />

                    <div className="mt-8 space-y-3">
                        <button 
                            onClick={() => startNewGame('Hard', true)} 
                            disabled={hasDoneDaily}
                            className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black uppercase italic transition-all shadow-xl border-2 ${hasDoneDaily ? 'bg-zinc-800 border-zinc-700 text-zinc-600 grayscale' : 'bg-pulse-600 border-pulse-400 text-white hover:scale-[1.02]'}`}
                        >
                            <SparklesIcon className="w-5 h-5" />
                            <span>{hasDoneDaily ? 'Daily Decoded' : 'Daily Segment'}</span>
                        </button>
                        <button onClick={() => startNewGame(difficulty)} className="w-full py-4 bg-white text-black font-black uppercase italic rounded-2xl hover:scale-[1.02] transition-all shadow-xl">Logic Sync</button>
                        <button onClick={onBackToHub} className="text-zinc-500 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors pt-2 block w-full italic">Back to Hub</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <main className="w-full h-full bg-zinc-950 text-white flex flex-col items-center justify-center font-sans overflow-y-auto scrollbar-hide relative">
            <style>{`
                @keyframes selection-glow {
                    0%, 100% { box-shadow: 0 0 15px #e11d48, inset 0 0 5px #e11d48; transform: scale(1); }
                    50% { box-shadow: 0 0 30px #e11d48, inset 0 0 15px #e11d48; transform: scale(1.02); }
                }
                .animate-selection { animation: selection-glow 0.6s ease-in-out infinite; }

                @keyframes cross-highlight {
                    0% { background-color: rgba(225, 29, 72, 0.1); }
                    50% { background-color: rgba(225, 29, 72, 0.35); box-shadow: inset 0 0 10px rgba(225, 29, 72, 0.2); }
                    100% { background-color: rgba(225, 29, 72, 0.1); }
                }
                .animate-cross-highlight { animation: cross-highlight 1.5s ease-in-out infinite; }

                @keyframes completion-flash {
                    0% { background-color: white; transform: scale(1); box-shadow: 0 0 50px white; z-index: 50; }
                    50% { background-color: #22c55e; transform: scale(1.1); box-shadow: 0 0 100px #22c55e; }
                    100% { background-color: transparent; transform: scale(1); box-shadow: none; }
                }
                .animate-completion { animation: completion-flash 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
            `}</style>

            <div className="max-w-md w-full h-full flex flex-col p-4 gap-4 z-10">
                <header className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-3xl border border-white/5 flex-shrink-0">
                    <button onClick={onBackToHub} className="p-2 bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                    <div className="flex gap-4 text-center items-center">
                        <button 
                            onClick={() => setIsSmartPad(!isSmartPad)} 
                            title="Toggle Technical Pad"
                            className={`p-2 rounded-xl transition-all border ${isSmartPad ? 'bg-signal-600 border-signal-400 text-white shadow-lg' : 'bg-zinc-800 border-white/5 text-zinc-500'}`}
                        >
                            <CpuChipIcon className="w-4 h-4" />
                        </button>
                        <div className="w-px h-8 bg-zinc-800 mx-1" />
                        <div className="flex items-center gap-1">
                            <HeartIcon filled={mistakes < 1} animated={mistakes === 0} />
                            <HeartIcon filled={mistakes < 2} animated={mistakes === 1} />
                            <HeartIcon filled={mistakes < 3} animated={mistakes === 2} />
                        </div>
                        <div className="w-px h-8 bg-zinc-800 mx-1" />
                        <div>
                            <span className="text-[8px] font-black uppercase text-zinc-500 block leading-none mb-1 italic">Time</span>
                            <span className="text-sm font-black font-mono leading-none">{formatTime(time)}</span>
                        </div>
                    </div>
                    <button onClick={() => setView('IDLE')} className="p-2 bg-zinc-800 rounded-xl text-zinc-400 hover:text-pulse-500 transition-colors">
                        <ArrowPathIcon className="w-6 h-6" />
                    </button>
                </header>

                <div className="flex-grow flex items-center justify-center min-h-0">
                    {gameState === 'LOADING' ? (
                        <div className="text-pulse-500 font-black animate-pulse uppercase tracking-[0.3em] italic">Hacking Host...</div>
                    ) : (
                        <div className="aspect-square w-full max-w-[340px] grid grid-cols-9 bg-zinc-950 rounded-2xl border-2 border-zinc-900 shadow-2xl relative overflow-hidden">
                            {grid?.map((row, r) => row.map((cell, c) => {
                                const isSelected = selectedCell?.row === r && selectedCell?.col === c;
                                const selectedCellValue = selectedCell ? grid[selectedCell.row][selectedCell.col].value : null;
                                const isSameValue = cell.value !== null && selectedCellValue !== null && cell.value === selectedCellValue;
                                
                                const isSameRow = selectedCell?.row === r;
                                const isSameCol = selectedCell?.col === c;
                                const blockIndex = Math.floor(r / 3) * 3 + Math.floor(c / 3);
                                const selectedBlockIndex = selectedCell ? Math.floor(selectedCell.row / 3) * 3 + Math.floor(selectedCell.col / 3) : -1;
                                const isSameBlock = blockIndex === selectedBlockIndex;

                                // Check for recent completion to trigger animation
                                let isAnimatingCompletion = false;
                                if (lastCompleted) {
                                    if (lastCompleted.type === 'row' && lastCompleted.index === r) isAnimatingCompletion = true;
                                    else if (lastCompleted.type === 'col' && lastCompleted.index === c) isAnimatingCompletion = true;
                                    else if (lastCompleted.type === 'block' && lastCompleted.index === blockIndex) isAnimatingCompletion = true;
                                }

                                let baseStyle = "aspect-square flex items-center justify-center text-xl font-normal cursor-pointer transition-all duration-150 relative ";
                                
                                if (isSelected) {
                                    baseStyle += "bg-pulse-500 z-20 text-white animate-selection ";
                                } else if (isAnimatingCompletion) {
                                    baseStyle += "animate-completion ";
                                } else if (isSameValue) {
                                    baseStyle += "bg-yellow-400/30 text-yellow-100 ";
                                } else if (isSameRow || isSameCol || isSameBlock) {
                                    baseStyle += "animate-cross-highlight z-10 "; 
                                } else {
                                    baseStyle += "bg-zinc-900/40 ";
                                }

                                if (cell.isError) {
                                    baseStyle += "text-pulse-500 font-black ";
                                } else if (!isSelected && !cell.isPrefilled && cell.value) {
                                    baseStyle += "text-signal-400 ";
                                }
                                
                                const borderR = (c + 1) % 3 === 0 && c < 8 ? 'border-r-2 border-r-white/10' : 'border-r border-r-white/5';
                                const borderB = (r + 1) % 3 === 0 && r < 8 ? 'border-b-2 border-b-white/10' : 'border-b border-b-white/5';

                                return (
                                    <div key={`${r}-${c}`} onClick={() => handleCellClick(r, c)} className={`${baseStyle} ${borderR} ${borderB}`}>
                                        {cell.value !== null ? (
                                            <span className="drop-shadow-md">{cell.value}</span>
                                        ) : (cell.notes.size > 0 && (
                                            <div className="grid grid-cols-3 gap-[1px] p-1 w-full h-full opacity-40">
                                                {[1,2,3,4,5,6,7,8,9].map(n => <div key={n} className="flex items-center justify-center text-[8px] leading-none font-black">{cell.notes.has(n) ? n : ''}</div>)}
                                            </div>
                                        ))}
                                    </div>
                                );
                            }))}
                        </div>
                    )}
                </div>

                <div className="flex-shrink-0 grid grid-cols-6 gap-2 pb-10">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
                        const isPhysicallyValid = !cellContext.invalid.has(num);
                        const isPadDisabled = isSmartPad && !isPhysicallyValid;
                        return (
                            <button key={num} onClick={() => handleNumberInput(num)} 
                                disabled={isPadDisabled}
                                className={`aspect-square bg-zinc-900 hover:bg-pulse-600 hover:text-white border border-white/5 rounded-xl text-xl font-black italic transition-all active:scale-90 shadow-md ${isPadDisabled ? 'opacity-10 grayscale' : ''}`}>
                                {num}
                            </button>
                        );
                    })}
                    <button onClick={() => setIsNotesMode(!isNotesMode)} className={`aspect-square rounded-xl flex items-center justify-center transition-all border ${isNotesMode ? 'bg-pulse-600 border-pulse-400 text-white shadow-lg' : 'bg-zinc-800 border-white/5 text-zinc-500'}`}>
                        <PencilIcon className="w-6 h-6" />
                    </button>
                    <button onClick={() => { if (!selectedCell || !grid || !solution) return; handleNumberInput(solution[selectedCell.row][selectedCell.col]); }} className="aspect-square bg-zinc-800 border border-white/5 rounded-xl flex items-center justify-center text-yellow-500 hover:text-yellow-400 active:scale-90 transition-all">
                        <LightBulbIcon className="w-6 h-6" />
                    </button>
                    <button onClick={() => { if (!selectedCell || !grid) return; const {row, col} = selectedCell; if (grid[row][col].isPrefilled) return; const ng = grid.map(r=>r.map(c=>({...c}))); ng[row][col].value = null; ng[row][col].notes = new Set(); ng[row][col].isError = false; setGrid(ng); checkCompletions(ng); }} className="aspect-square bg-zinc-800 border border-white/5 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white active:scale-90 transition-all">
                        <EraserIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {(gameState === 'WON' || gameState === 'LOST') && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-6">
                    <div className="max-w-sm w-full bg-zinc-900 p-10 rounded-[3rem] border-4 border-pulse-500 text-center shadow-[0_0_100px_rgba(225,29,72,0.3)]">
                        <h2 className={`text-4xl font-black italic uppercase tracking-tighter mb-4 ${gameState === 'WON' ? 'text-signal-500' : 'text-pulse-500'}`}>
                            {gameState === 'WON' ? 'CODE CLEAR' : 'TERMINATED'}
                        </h2>
                        {gameState === 'WON' ? (
                            <div className="mb-8">
                                <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] mb-4 italic">Post Segment Initials</p>
                                <input autoFocus maxLength={3} value={initials} onChange={e => setInitials(e.target.value.toUpperCase())}
                                    className="bg-black/50 border-2 border-pulse-500 text-white rounded-xl px-4 py-3 text-center text-2xl font-black w-32 outline-none uppercase italic" placeholder="???" />
                            </div>
                        ) : (
                            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-8 italic">Signal lost. Recalibration failed.</p>
                        )}
                        <div className="flex flex-col gap-3">
                            {gameState === 'WON' ? (
                                <button onClick={handleSaveScore} className="w-full py-4 bg-pulse-600 text-white font-black text-lg italic uppercase rounded-full hover:scale-105 transition-transform shadow-xl">Transmit Frequency</button>
                            ) : (
                                <button onClick={() => setView('IDLE')} className="w-full py-4 bg-pulse-600 text-white font-black text-lg italic uppercase rounded-full hover:scale-105 transition-transform shadow-xl">Re-Sync Node</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default SudokuPage;
