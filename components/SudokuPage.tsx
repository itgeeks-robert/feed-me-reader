
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateSudoku } from '../services/sudoku';
import { PencilIcon, LightBulbIcon, EraserIcon, SeymourIcon, XIcon, ArrowPathIcon, TrophyIcon } from './icons';
import type { SudokuStats, SudokuDifficulty as Difficulty } from '../src/App';

type GameState = 'LOADING' | 'IDLE' | 'PLAYING' | 'ERROR' | 'WON' | 'LOST';

interface Cell {
  value: number | null;
  isPrefilled: boolean;
  notes: Set<number>;
  isError: boolean;
}

type Grid = Cell[][];

const MISTAKE_LIMIT = 3;

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
    const [mistakes, setMistakes] = useState(0);
    const [time, setTime] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    
    // Animation states for completed units
    const [animatingRows, setAnimatingRows] = useState<Set<number>>(new Set());
    const [animatingCols, setAnimatingCols] = useState<Set<number>>(new Set());
    const [animatingBoxes, setAnimatingBoxes] = useState<Set<number>>(new Set());

    const stringToGrid = (puzzleString: string): Grid =>
        Array.from({ length: 9 }, (_, r) =>
            Array.from({ length: 9 }, (_, c) => {
                const value = parseInt(puzzleString[r * 9 + c], 10) || null;
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
        setAnimatingRows(new Set());
        setAnimatingCols(new Set());
        setAnimatingBoxes(new Set());
        try {
            const now = new Date();
            const seed = isDaily ? parseInt(`${now.getFullYear()}${now.getMonth()}${now.getDate()}`, 10) : undefined;
            const { puzzle, solution: sol } = await generateSudoku(newDifficulty, seed);
            const newGrid = stringToGrid(puzzle);
            setGrid(newGrid);
            setSolution(sol);
            setIsNotesMode(false);
            setMistakes(0);
            setTime(0);
            setGameState('PLAYING');
            startTimer();
        } catch (error) {
            setGameState('ERROR');
        }
    }, [startTimer]);

    useEffect(() => {
        return () => stopTimer();
    }, [stopTimer]);

    const checkUnitCompletion = (currentGrid: Grid, row: number, col: number) => {
        if (currentGrid[row].every(c => c.value !== null)) {
            setAnimatingRows(prev => new Set(prev).add(row));
            setTimeout(() => setAnimatingRows(prev => { const n = new Set(prev); n.delete(row); return n; }), 800);
        }
        if (currentGrid.every(r => r[col].value !== null)) {
            setAnimatingCols(prev => new Set(prev).add(col));
            setTimeout(() => setAnimatingCols(prev => { const n = new Set(prev); n.delete(col); return n; }), 800);
        }
        const boxRowStart = Math.floor(row / 3) * 3;
        const boxColStart = Math.floor(col / 3) * 3;
        const boxIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);
        let boxComplete = true;
        for (let r = boxRowStart; r < boxRowStart + 3; r++) {
            for (let c = boxColStart; c < boxColStart + 3; c++) {
                if (currentGrid[r][c].value === null) boxComplete = false;
            }
        }
        if (boxComplete) {
            setAnimatingBoxes(prev => new Set(prev).add(boxIndex));
            setTimeout(() => setAnimatingBoxes(prev => { const n = new Set(prev); n.delete(boxIndex); return n; }), 800);
        }
    };

    const handleNumberInput = (num: number) => {
        if (!selectedCell || !grid || !solution || grid[selectedCell.row][selectedCell.col].isPrefilled || gameState !== 'PLAYING') return;
        
        const { row, col } = selectedCell;
        let newGrid: Grid = grid.map(r => r.map(c => ({...c, notes: new Set(c.notes)})));
        newGrid.forEach(r => r.forEach(c => { c.isError = false; }));
        
        if (isNotesMode) {
            const notes = newGrid[row][col].notes;
            if (notes.has(num)) notes.delete(num); else notes.add(num);
        } else {
            if (solution[row][col] === num) {
                newGrid[row][col].value = num;
                newGrid[row][col].notes = new Set();
                checkUnitCompletion(newGrid, row, col);
            } else {
                setMistakes(m => {
                    const next = m + 1;
                    if (next >= MISTAKE_LIMIT) {
                        setGameState('LOST');
                        onGameLoss();
                    }
                    return next;
                });
                newGrid[row][col].isError = true;
            }
        }
        setGrid(newGrid);
        if (newGrid.every(r => r.every(c => c.value !== null && !c.isError))) {
            setGameState('WON');
            onGameWin(difficulty, time, isDailyChallenge);
        }
    };

    const handleHint = () => {
        if (!selectedCell || !grid || !solution || gameState !== 'PLAYING') return;
        const { row, col } = selectedCell;
        if (grid[row][col].value !== null) return;
        handleNumberInput(solution[row][col]);
    };

    const handleEraser = () => {
        if (!selectedCell || !grid || gameState !== 'PLAYING') return;
        const { row, col } = selectedCell;
        if (grid[row][col].isPrefilled) return;
        const newGrid: Grid = grid.map(r => r.map(c => ({...c, notes: new Set(c.notes)})));
        newGrid[row][col].value = null;
        newGrid[row][col].notes = new Set();
        newGrid[row][col].isError = false;
        setGrid(newGrid);
    };

    const formatTime = (seconds: number | null) => {
        if (seconds === null) return "--:--";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const formatPlaytime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m`;
    };

    const getCellStyles = (r: number, c: number) => {
        if (!grid || !selectedCell) return "bg-zinc-900/40";
        const cell = grid[r][c];
        const isSelected = selectedCell.row === r && selectedCell.col === c;
        const isSameRow = selectedCell.row === r;
        const isSameCol = selectedCell.col === c;
        const isSameBox = Math.floor(selectedCell.row / 3) === Math.floor(r / 3) && Math.floor(selectedCell.col / 3) === Math.floor(c / 3);
        const selectedValue = grid[selectedCell.row][selectedCell.col].value;
        const isSameValue = selectedValue !== null && selectedValue === cell.value;
        const boxIndex = Math.floor(r / 3) * 3 + Math.floor(c / 3);
        
        const isAnimating = animatingRows.has(r) || animatingCols.has(c) || animatingBoxes.has(boxIndex);

        let style = "transition-all duration-200 ";
        if (isSelected) style += "bg-plant-500/40 ring-2 ring-plant-400 z-20 shadow-[0_0_15px_rgba(34,197,94,0.4)] ";
        else if (isSameValue) style += "bg-yellow-400/20 ";
        else if (isSameRow || isSameCol || isSameBox) style += "bg-plant-500/10 ";
        else style += "bg-zinc-900/40 ";
        
        if (cell.isError) style += "bg-flesh-600/40 text-flesh-200 animate-shake ";
        if (isAnimating) style += "bg-flesh-500/60 scale-105 z-10 shadow-[0_0_20px_#ec4899] ";

        const borderR = (c + 1) % 3 === 0 && c < 8 ? 'border-r-2 border-r-plant-500/30' : 'border-r border-r-zinc-800/40';
        const borderB = (r + 1) % 3 === 0 && r < 8 ? 'border-b-2 border-b-plant-500/30' : 'border-b border-b-zinc-800/40';

        return `${style} ${borderR} ${borderB}`;
    };

    if (view === 'IDLE') {
        const todayStr = new Date().toISOString().split('T')[0];
        const hasDoneDaily = stats.lastDailyCompletionDate === todayStr;
        const currentDiffStats = stats[difficulty.toLowerCase() as keyof Omit<SudokuStats, 'dailyStreak' | 'lastDailyCompletionDate' | 'totalWins'>];

        return (
            <div className="w-full h-full flex items-center justify-center bg-zinc-950 p-6">
                <div className="w-full max-w-sm text-center bg-zinc-900 p-8 md:p-10 rounded-[3rem] border-4 border-plant-500 shadow-[0_0_50px_rgba(34,197,94,0.2)]">
                    <SeymourIcon className="w-20 h-20 mx-auto mb-6 text-plant-500" />
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">Brain Spores</h2>
                    
                    <div className="bg-black/40 rounded-2xl p-4 mb-6 border border-white/5">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{difficulty} Stats</span>
                            <TrophyIcon className="w-4 h-4 text-yellow-500" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="text-center">
                                <p className="text-[8px] font-black text-plant-500 uppercase">Best</p>
                                <p className="text-xs font-black italic">{formatTime(currentDiffStats.fastestTime)}</p>
                            </div>
                            <div className="text-center border-x border-white/5">
                                <p className="text-[8px] font-black text-flesh-500 uppercase">Wins</p>
                                <p className="text-xs font-black italic">{currentDiffStats.gamesPlayed}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[8px] font-black text-zinc-500 uppercase">Played</p>
                                <p className="text-xs font-black italic">{formatPlaytime(currentDiffStats.totalTimePlayed)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <button onClick={() => setDifficulty('Easy')} className={`flex-1 py-3 rounded-xl font-black uppercase italic text-[10px] transition-all border ${difficulty === 'Easy' ? 'bg-plant-600 border-plant-400 text-black shadow-lg' : 'bg-zinc-800 border-white/5 text-zinc-500'}`}>Incubate</button>
                            <button onClick={() => setDifficulty('Medium')} className={`flex-1 py-3 rounded-xl font-black uppercase italic text-[10px] transition-all border ${difficulty === 'Medium' ? 'bg-plant-600 border-plant-400 text-black shadow-lg' : 'bg-zinc-800 border-white/5 text-zinc-500'}`}>Digest</button>
                            <button onClick={() => setDifficulty('Hard')} className={`flex-1 py-3 rounded-xl font-black uppercase italic text-[10px] transition-all border ${difficulty === 'Hard' ? 'bg-plant-600 border-plant-400 text-black shadow-lg' : 'bg-zinc-800 border-white/5 text-zinc-500'}`}>Mutate</button>
                        </div>
                        
                        <button onClick={() => startNewGame(difficulty)} className="w-full py-4 bg-white text-black font-black uppercase italic rounded-2xl hover:scale-[1.02] transition-all shadow-xl">New Culture</button>

                        <div className="pt-2">
                            <button 
                                onClick={() => !hasDoneDaily && startNewGame('Medium', true)} 
                                disabled={hasDoneDaily}
                                className={`w-full py-4 border-2 rounded-2xl font-black uppercase italic transition-all ${hasDoneDaily ? 'border-zinc-800 text-zinc-700 bg-zinc-900 cursor-not-allowed' : 'border-yellow-500 text-yellow-500 hover:bg-yellow-500/10 shadow-lg shadow-yellow-500/10'}`}
                            >
                                {hasDoneDaily ? 'Daily Digested' : 'Daily Challenge'}
                            </button>
                            {stats.dailyStreak > 0 && (
                                <p className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest mt-2">Streak: {stats.dailyStreak} Days</p>
                            )}
                        </div>

                        <button onClick={onBackToHub} className="text-zinc-500 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors pt-4 block w-full">Back to Pit</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <main className="w-full h-full bg-zinc-950 text-white flex flex-col items-center justify-center font-sans overflow-hidden">
            <style>{`
                @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
                .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
            `}</style>
            
            <div className="max-w-md w-full h-full flex flex-col p-4 gap-4">
                <header className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-3xl border border-white/5 flex-shrink-0">
                    <button onClick={onBackToHub} className="p-2 bg-zinc-800 rounded-xl text-zinc-400 hover:text-flesh-500 transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                    <div className="flex gap-4 text-center">
                        <div>
                            <span className="text-[8px] font-black uppercase text-plant-500 block">Phase</span>
                            <span className="text-sm font-black italic uppercase">{difficulty}</span>
                        </div>
                        <div className="w-px h-8 bg-zinc-800" />
                        <div>
                            <span className="text-[8px] font-black uppercase text-flesh-500 block">Alerts</span>
                            <span className="text-sm font-black italic">{mistakes}/3</span>
                        </div>
                        <div className="w-px h-8 bg-zinc-800" />
                        <div>
                            <span className="text-[8px] font-black uppercase text-zinc-500 block">Time</span>
                            <span className="text-sm font-black font-mono">{formatTime(time)}</span>
                        </div>
                    </div>
                    <button onClick={() => setView('IDLE')} className="p-2 bg-zinc-800 rounded-xl text-zinc-400 hover:text-plant-500 transition-colors">
                        <ArrowPathIcon className="w-6 h-6" />
                    </button>
                </header>

                <div className="flex-grow flex items-center justify-center min-h-0">
                    <div className="aspect-square w-full max-h-full grid grid-cols-9 bg-zinc-950 rounded-2xl border-2 border-zinc-800 shadow-2xl relative overflow-hidden ring-1 ring-plant-500/10">
                        {grid?.map((row, r) => row.map((cell, c) => (
                            <div key={`${r}-${c}`} onClick={() => handleCellClick(r, c)} 
                                 className={`aspect-square flex items-center justify-center text-lg sm:text-xl font-black cursor-pointer
                                    ${getCellStyles(r, c)}
                                    ${!cell.isPrefilled && cell.value ? 'text-plant-400' : 'text-white'}
                                 `}>
                                {cell.value || (cell.notes.size > 0 && (
                                    <div className="grid grid-cols-3 gap-[1px] p-0.5 w-full h-full opacity-30">
                                        {[1,2,3,4,5,6,7,8,9].map(n => (
                                            <div key={n} className="flex items-center justify-center text-[7px] leading-none">
                                                {cell.notes.has(n) ? n : ''}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )))}
                    </div>
                </div>

                <div className="flex-shrink-0 grid grid-cols-6 gap-2 mb-20 md:mb-0">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button key={num} onClick={() => handleNumberInput(num)} className="aspect-square bg-zinc-900/80 hover:bg-plant-600 hover:text-black border border-white/5 rounded-xl text-xl font-black italic transition-all active:scale-90 shadow-md">
                            {num}
                        </button>
                    ))}
                    <button onClick={() => setIsNotesMode(!isNotesMode)} className={`aspect-square rounded-xl flex items-center justify-center transition-all border ${isNotesMode ? 'bg-flesh-600 border-flesh-400 text-white shadow-[0_0_100px_rgba(236,72,153,0.3)]' : 'bg-zinc-800 border-white/5 text-zinc-500'}`}>
                        <PencilIcon className="w-6 h-6" />
                    </button>
                    <button onClick={handleHint} className="aspect-square bg-zinc-800 border border-white/5 rounded-xl flex items-center justify-center text-yellow-500 hover:text-yellow-400 active:scale-90 transition-all">
                        <LightBulbIcon className="w-6 h-6" />
                    </button>
                    <button onClick={handleEraser} className="aspect-square bg-zinc-800 border border-white/5 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white active:scale-90 transition-all">
                        <EraserIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {gameState !== 'PLAYING' && gameState !== 'LOADING' && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-6">
                    <div className="max-w-sm w-full bg-zinc-900 p-10 rounded-[3rem] border-4 border-plant-500 text-center shadow-[0_0_100px_rgba(34,197,94,0.3)]">
                        <h2 className={`text-5xl font-black italic uppercase tracking-tighter mb-4 ${gameState === 'WON' ? 'text-plant-500' : 'text-flesh-500'}`}>
                            {gameState === 'WON' ? 'FED!' : 'ROTTEN'}
                        </h2>
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-8">{gameState === 'WON' ? 'The plant is satisfied.' : 'You were digested.'}</p>
                        <div className="flex flex-col gap-3">
                            <button onClick={() => setView('IDLE')} className="w-full py-4 bg-plant-600 text-black font-black text-lg italic uppercase rounded-full hover:scale-105 transition-transform shadow-xl">Replay</button>
                            <button onClick={onBackToHub} className="w-full py-4 bg-zinc-800 text-zinc-400 font-black text-xs uppercase rounded-full hover:text-white transition-colors">Exit Pit</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default SudokuPage;
