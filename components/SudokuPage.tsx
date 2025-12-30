
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { generateSudoku } from '../services/sudoku';
import { PencilIcon, LightBulbIcon, EraserIcon, VoidIcon, XIcon, ArrowPathIcon, CpuChipIcon, SparklesIcon } from './icons';
import type { SudokuStats, SudokuDifficulty as Difficulty } from '../src/App';
import { saveHighScore, getHighScores, ScoreCategory } from '../services/highScoresService';
import { useLocalStorage } from '../hooks/useLocalStorage';
import HighScoreTable from './HighScoreTable';

type GameState = 'LOADING' | 'IDLE' | 'PLAYING' | 'ERROR' | 'WON' | 'LOST';

interface Cell {
  value: number | null;
  isPrefilled: boolean;
  notes: number[]; // Set doesn't serialize well to JSON, so use array
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
    
    // Transient UI states
    const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
    const [isNotesMode, setIsNotesMode] = useState(false);
    const [isSmartPad, setIsSmartPad] = useState(false);
    const [initials, setInitials] = useState("");
    const [showScores, setShowScores] = useState(false);
    const [isDailyChallenge, setIsDailyChallenge] = useState(false);
    const timerRef = useRef<number | null>(null);

    const [completedRows, setCompletedRows] = useState<Set<number>>(new Set());
    const [completedCols, setCompletedCols] = useState<Set<number>>(new Set());
    const [completedBlocks, setCompletedBlocks] = useState<Set<number>>(new Set());
    const [lastCompleted, setLastCompleted] = useState<{type: 'row' | 'col' | 'block', index: number} | null>(null);

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
                        <button onClick={onBackToHub} className="text-zinc-500 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors pt-2 block w-full italic tracking-[0.2em]">Abort Link</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <main className="w-full h-full bg-zinc-950 text-white flex flex-col items-center justify-center font-sans overflow-y-auto scrollbar-hide relative">
            <div className="max-w-md w-full h-full flex flex-col p-4 gap-4 z-10">
                <header className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-3xl border border-white/5 flex-shrink-0">
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
                    <button onClick={() => { setGameState('IDLE'); setView('IDLE'); }} className="p-2 bg-zinc-800 rounded-xl text-zinc-400 hover:text-pulse-500"><ArrowPathIcon className="w-6 h-6" /></button>
                </header>

                <div className="flex-grow flex items-center justify-center min-h-0">
                    {gameState === 'LOADING' ? <div className="text-neon-400 font-black animate-pulse uppercase tracking-[0.4em] italic">Synthesizing...</div> : (
                        <div className="aspect-square w-full max-w-[350px] grid grid-cols-9 bg-black rounded-xl border-4 border-zinc-900 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
                            {grid?.map((row, r) => row.map((cell, c) => {
                                const isSelected = selectedCell?.row === r && selectedCell?.col === c;
                                const selectedCellValue = selectedCell ? grid[selectedCell.row][selectedCell.col].value : null;
                                const isSameValue = cell.value !== null && selectedCellValue !== null && cell.value === selectedCellValue;
                                const isSameRow = selectedCell?.row === r;
                                const isSameCol = selectedCell?.col === c;
                                const blockIndex = Math.floor(r / 3) * 3 + Math.floor(c / 3);
                                const selectedBlockIndex = selectedCell ? Math.floor(selectedCell.row / 3) * 3 + Math.floor(selectedCell.col / 3) : -1;
                                const isSameBlock = blockIndex === selectedBlockIndex;

                                const borderR = (c + 1) % 3 === 0 && c < 8 ? 'border-r-4 border-neon-400' : 'border-r border-white/5';
                                const borderB = (r + 1) % 3 === 0 && r < 8 ? 'border-b-4 border-neon-400' : 'border-b border-white/5';

                                let cellBg = isSelected ? "bg-pulse-600" : isSameValue ? "bg-neon-400/20" : (isSameRow || isSameCol || isSameBlock) ? "bg-zinc-800/40" : "bg-transparent";

                                return (
                                    <div key={`${r}-${c}`} onClick={() => handleCellClick(r, c)} className={`aspect-square flex items-center justify-center text-xl font-bold cursor-pointer transition-colors duration-150 ${cellBg} ${borderR} ${borderB}`}>
                                        {cell.value !== null ? <span className={cell.isError ? 'text-pulse-500' : cell.isPrefilled ? 'text-white' : 'text-signal-400'}>{cell.value}</span> : (
                                            <div className="grid grid-cols-3 gap-[1px] p-1 w-full h-full opacity-30">
                                                {[1,2,3,4,5,6,7,8,9].map(n => <div key={n} className="flex items-center justify-center text-[7px] leading-none font-black text-neon-400">{cell.notes.includes(n) ? n : ''}</div>)}
                                            </div>
                                        )}
                                    </div>
                                );
                            }))}
                        </div>
                    )}
                </div>

                <div className="flex-shrink-0 grid grid-cols-6 gap-2 pb-8">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button key={num} onClick={() => handleNumberInput(num)} className="aspect-square bg-zinc-900 border border-white/10 rounded-xl text-xl font-black italic hover:bg-neon-500 hover:text-black active:scale-90 shadow-lg">{num}</button>
                    ))}
                    <button onClick={() => setIsNotesMode(!isNotesMode)} className={`aspect-square rounded-xl flex items-center justify-center transition-all border-2 ${isNotesMode ? 'bg-neon-400 border-white text-black' : 'bg-zinc-800 border-white/5 text-zinc-500'}`}><PencilIcon className="w-6 h-6" /></button>
                    <button onClick={() => { if (!selectedCell || !grid || !solution) return; handleNumberInput(solution[selectedCell.row][selectedCell.col]); }} className="aspect-square bg-zinc-800 border border-white/5 rounded-xl flex items-center justify-center text-yellow-500 active:scale-90"><LightBulbIcon className="w-6 h-6" /></button>
                    <button onClick={() => { if (!selectedCell || !grid) return; const {row, col} = selectedCell; if (grid[row][col].isPrefilled) return; const ng = grid.map(r=>r.map(c=>({...c, notes:[...c.notes]}))); ng[row][col].value = null; ng[row][col].notes = []; ng[row][col].isError = false; setGrid(ng); }} className="aspect-square bg-zinc-800 border border-white/5 rounded-xl flex items-center justify-center text-zinc-400 active:scale-90"><EraserIcon className="w-6 h-6" /></button>
                </div>
            </div>

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

export default SudokuPage;
