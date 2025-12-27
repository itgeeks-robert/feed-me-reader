
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { generateSudoku } from '../services/sudoku';
import { PencilIcon, LightBulbIcon, EraserIcon, SeymourIcon, XIcon, ArrowPathIcon, TrophyIcon, CpuChipIcon, SparklesIcon } from './icons';
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

    const formatTime = (seconds: number | null) => {
        if (seconds === null) return "--:--";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const validNumbersForSelected = useMemo(() => {
        if (!selectedCell || !grid || !isSmartPad) return new Set([1,2,3,4,5,6,7,8,9]);
        const { row, col } = selectedCell;
        const invalid = new Set<number>();
        
        for (let i = 0; i < 9; i++) {
            if (grid[row][i].value) invalid.add(grid[row][i].value!);
            if (grid[i][col].value) invalid.add(grid[i][col].value!);
        }
        
        const boxRowStart = Math.floor(row / 3) * 3;
        const boxColStart = Math.floor(col / 3) * 3;
        for (let r = boxRowStart; r < boxRowStart + 3; r++) {
            for (let c = boxColStart; c < boxColStart + 3; c++) {
                if (grid[r][c].value) invalid.add(grid[r][c].value!);
            }
        }
        
        const valid = new Set<number>();
        for (let i = 1; i <= 9; i++) if (!invalid.has(i)) valid.add(i);
        return valid;
    }, [selectedCell, grid, isSmartPad]);

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
            // Use local date as seed for daily challenge
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
        newGrid.forEach(r => r.forEach(c => { c.isError = false; }));
        
        if (isNotesMode) {
            const notes = newGrid[row][col].notes;
            if (notes.has(num)) notes.delete(num); else notes.add(num);
        } else {
            if (solution[row][col] === num) {
                newGrid[row][col].value = num;
                newGrid[row][col].notes = new Set();
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
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-6 overflow-y-auto">
                <div className="w-full max-w-sm text-center bg-zinc-900 p-8 md:p-10 rounded-[3rem] border-4 border-plant-500 shadow-[0_0_50px_rgba(34,197,94,0.2)] mb-6">
                    <SeymourIcon className="w-16 h-16 mx-auto mb-4 text-plant-500" />
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Brain Spores</h2>
                    
                    <div className="flex gap-2 mb-6">
                        {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
                            <button key={d} onClick={() => setDifficulty(d)} className={`flex-1 py-2.5 rounded-xl font-black uppercase italic text-[10px] transition-all border ${difficulty === d ? 'bg-plant-600 border-plant-400 text-black shadow-lg' : 'bg-zinc-800 border-white/5 text-zinc-500'}`}>{d}</button>
                        ))}
                    </div>

                    <HighScoreTable entries={topScores} title={difficulty} />

                    <div className="mt-8 space-y-3">
                        <button 
                            onClick={() => startNewGame('Hard', true)} 
                            disabled={hasDoneDaily}
                            className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black uppercase italic transition-all shadow-xl border-2 ${hasDoneDaily ? 'bg-zinc-800 border-zinc-700 text-zinc-600 grayscale' : 'bg-flesh-600 border-flesh-400 text-white hover:scale-[1.02]'}`}
                        >
                            <SparklesIcon className="w-5 h-5" />
                            <span>{hasDoneDaily ? 'Daily Digested' : 'Daily Spore'}</span>
                        </button>
                        <button onClick={() => startNewGame(difficulty)} className="w-full py-4 bg-white text-black font-black uppercase italic rounded-2xl hover:scale-[1.02] transition-all shadow-xl">New Culture</button>
                        <button onClick={onBackToHub} className="text-zinc-500 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors pt-2 block w-full">Back to Pit</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <main className="w-full h-full bg-zinc-950 text-white flex flex-col items-center justify-center font-sans overflow-hidden">
            <div className="max-w-md w-full h-full flex flex-col p-4 gap-4">
                <header className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-3xl border border-white/5 flex-shrink-0">
                    <button onClick={onBackToHub} className="p-2 bg-zinc-800 rounded-xl text-zinc-400 hover:text-flesh-500 transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                    <div className="flex gap-4 text-center">
                        <button 
                            onClick={() => setIsSmartPad(!isSmartPad)} 
                            title="Toggle Smart Pad"
                            className={`p-2 rounded-xl transition-all border ${isSmartPad ? 'bg-plant-600 border-plant-400 text-black shadow-lg' : 'bg-zinc-800 border-white/5 text-zinc-500'}`}
                        >
                            <CpuChipIcon className="w-4 h-4" />
                        </button>
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
                    {gameState === 'LOADING' ? (
                        <div className="text-plant-500 font-black animate-pulse uppercase tracking-[0.3em]">Mutating...</div>
                    ) : (
                        <div className="aspect-square w-full max-h-full grid grid-cols-9 bg-zinc-950 rounded-2xl border-2 border-zinc-800 shadow-2xl relative overflow-hidden ring-1 ring-plant-500/10">
                            {grid?.map((row, r) => row.map((cell, c) => {
                                const isSelected = selectedCell?.row === r && selectedCell?.col === c;
                                const isSameValue = selectedCell && grid[selectedCell.row][selectedCell.col].value !== null && grid[selectedCell.row][selectedCell.col].value === cell.value;
                                const isRelated = selectedCell && (selectedCell.row === r || selectedCell.col === c || (Math.floor(selectedCell.row/3) === Math.floor(r/3) && Math.floor(selectedCell.col/3) === Math.floor(c/3)));
                                
                                let baseStyle = "aspect-square flex items-center justify-center text-lg sm:text-xl font-black cursor-pointer transition-all duration-200 ";
                                if (isSelected) baseStyle += "bg-plant-500/40 ring-2 ring-plant-400 z-20 shadow-[0_0_15px_rgba(34,197,94,0.4)] ";
                                else if (isSameValue) baseStyle += "bg-yellow-400/20 ";
                                else if (isRelated) baseStyle += "bg-plant-500/10 ";
                                else baseStyle += "bg-zinc-900/40 ";
                                
                                if (cell.isError) baseStyle += "bg-flesh-600/40 text-flesh-200 animate-shake ";
                                const borderR = (c + 1) % 3 === 0 && c < 8 ? 'border-r-2 border-r-plant-500/30' : 'border-r border-r-zinc-800/40';
                                const borderB = (r + 1) % 3 === 0 && r < 8 ? 'border-b-2 border-b-plant-500/30' : 'border-b border-b-zinc-800/40';

                                return (
                                    <div key={`${r}-${c}`} onClick={() => handleCellClick(r, c)} className={`${baseStyle} ${borderR} ${borderB} ${!cell.isPrefilled && cell.value ? 'text-plant-400' : 'text-white'}`}>
                                        {cell.value || (cell.notes.size > 0 && (
                                            <div className="grid grid-cols-3 gap-[1px] p-0.5 w-full h-full opacity-30">
                                                {[1,2,3,4,5,6,7,8,9].map(n => <div key={n} className="flex items-center justify-center text-[7px] leading-none">{cell.notes.has(n) ? n : ''}</div>)}
                                            </div>
                                        ))}
                                    </div>
                                );
                            }))}
                        </div>
                    )}
                </div>

                <div className="flex-shrink-0 grid grid-cols-6 gap-2 mb-20 md:mb-0">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
                        const isValid = validNumbersForSelected.has(num);
                        return (
                            <button key={num} onClick={() => handleNumberInput(num)} 
                                disabled={isSmartPad && !isValid}
                                className={`aspect-square bg-zinc-900/80 hover:bg-plant-600 hover:text-black border border-white/5 rounded-xl text-xl font-black italic transition-all active:scale-90 shadow-md ${isSmartPad && !isValid ? 'opacity-20 grayscale cursor-not-allowed' : ''}`}>
                                {num}
                            </button>
                        );
                    })}
                    <button onClick={() => setIsNotesMode(!isNotesMode)} className={`aspect-square rounded-xl flex items-center justify-center transition-all border ${isNotesMode ? 'bg-flesh-600 border-flesh-400 text-white shadow-[0_0_100px_rgba(236,72,153,0.3)]' : 'bg-zinc-800 border-white/5 text-zinc-500'}`}>
                        <PencilIcon className="w-6 h-6" />
                    </button>
                    <button onClick={() => { if (!selectedCell || !grid || !solution) return; handleNumberInput(solution[selectedCell.row][selectedCell.col]); }} className="aspect-square bg-zinc-800 border border-white/5 rounded-xl flex items-center justify-center text-yellow-500 hover:text-yellow-400 active:scale-90 transition-all">
                        <LightBulbIcon className="w-6 h-6" />
                    </button>
                    <button onClick={() => { if (!selectedCell || !grid) return; const {row, col} = selectedCell; if (grid[row][col].isPrefilled) return; const ng = grid.map(r=>r.map(c=>({...c}))); ng[row][col].value = null; ng[row][col].notes = new Set(); ng[row][col].isError = false; setGrid(ng); }} className="aspect-square bg-zinc-800 border border-white/5 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white active:scale-90 transition-all">
                        <EraserIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {(gameState === 'WON' || gameState === 'LOST') && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-6">
                    <div className="max-w-sm w-full bg-zinc-900 p-10 rounded-[3rem] border-4 border-plant-500 text-center shadow-[0_0_100px_rgba(34,197,94,0.3)]">
                        <h2 className={`text-5xl font-black italic uppercase tracking-tighter mb-4 ${gameState === 'WON' ? 'text-plant-500' : 'text-flesh-500'}`}>
                            {gameState === 'WON' ? 'HI-SCORE!' : 'ROTTEN'}
                        </h2>
                        {gameState === 'WON' ? (
                            <div className="mb-8">
                                <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-4">Enter Arcade Initials</p>
                                <input 
                                    autoFocus
                                    maxLength={3} 
                                    value={initials} 
                                    onChange={e => setInitials(e.target.value.toUpperCase())}
                                    className="bg-black/50 border-2 border-plant-500 text-plant-500 rounded-xl px-4 py-3 text-center text-2xl font-black w-32 outline-none uppercase italic"
                                    placeholder="???"
                                />
                            </div>
                        ) : (
                            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-8">You were digested.</p>
                        )}
                        <div className="flex flex-col gap-3">
                            {gameState === 'WON' ? (
                                <button onClick={handleSaveScore} className="w-full py-4 bg-plant-600 text-black font-black text-lg italic uppercase rounded-full hover:scale-105 transition-transform shadow-xl">Post Records</button>
                            ) : (
                                <>
                                    <button onClick={() => setView('IDLE')} className="w-full py-4 bg-plant-600 text-black font-black text-lg italic uppercase rounded-full hover:scale-105 transition-transform shadow-xl">Replay</button>
                                    <button onClick={onBackToHub} className="w-full py-4 bg-zinc-800 text-zinc-400 font-black text-xs uppercase rounded-full hover:text-white transition-colors">Exit Pit</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default SudokuPage;
