import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateSudoku } from '../services/sudoku';
import { BrainIcon, PencilIcon, ArrowPathIcon, LightBulbIcon, TrophyIcon, EraserIcon } from './icons';
import type { SudokuStats, SudokuDifficulty as Difficulty, SudokuDifficultyStats } from '../src/App';

type GameState = 'LOADING' | 'IDLE' | 'PLAYING' | 'ERROR' | 'WON' | 'LOST';

interface Cell {
  value: number | null;
  isPrefilled: boolean;
  notes: Set<number>;
  isError: boolean;
}

type Grid = Cell[][];

const SUDOKU_SAVE_KEY = 'sudoku_game_save';
const MISTAKE_LIMIT = 3;

interface SudokuPageProps {
  stats: SudokuStats;
  onGameWin: (difficulty: Difficulty, time: number, isDaily: boolean) => void;
}

const SudokuPage: React.FC<SudokuPageProps> = ({ stats, onGameWin }) => {
    const [view, setView] = useState<'IDLE' | 'PLAYING' | 'STATS'>('IDLE');
    const [gameState, setGameState] = useState<GameState>('IDLE');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
    const [isDailyChallenge, setIsDailyChallenge] = useState(false);
    const [grid, setGrid] = useState<Grid | null>(null);
    const [solution, setSolution] = useState<number[][] | null>(null);
    const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
    const [isNotesMode, setIsNotesMode] = useState(false);
    const [history, setHistory] = useState<Grid[]>([]);
    const [mistakes, setMistakes] = useState(0);
    const [time, setTime] = useState(0);
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

    const saveGame = useCallback(() => {
        if (!grid || gameState !== 'PLAYING') return;
        const gameStateToSave = {
            difficulty,
            isDailyChallenge,
            grid,
            solution,
            history,
            mistakes,
            time
        };
        localStorage.setItem(SUDOKU_SAVE_KEY, JSON.stringify(gameStateToSave, (k, v) => k === 'notes' ? Array.from(v) : v));
    }, [difficulty, isDailyChallenge, grid, solution, history, mistakes, time, gameState]);

    const startNewGame = useCallback(async (newDifficulty: Difficulty, isDaily: boolean = false) => {
        setView('PLAYING');
        setGameState('LOADING');
        setSelectedCell(null);
        setDifficulty(newDifficulty);
        setIsDailyChallenge(isDaily);
        try {
            const seed = isDaily ? new Date().setHours(0, 0, 0, 0) : undefined;
            const { puzzle, solution: sol } = await generateSudoku(newDifficulty, seed);
            const newGrid = stringToGrid(puzzle);
            
            setGrid(newGrid);
            setSolution(sol);
            setIsNotesMode(false);
            setHistory([]);
            setMistakes(0);
            setTime(0);
            setGameState('PLAYING');
            startTimer();
        } catch (error) {
            console.error("Failed to start new game:", error);
            setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred.');
            setGameState('ERROR');
        }
    }, [startTimer]);
    
    const loadGame = useCallback(() => {
        const savedGame = localStorage.getItem(SUDOKU_SAVE_KEY);
        if (savedGame) {
            try {
                const savedState = JSON.parse(savedGame);
                savedState.grid = savedState.grid.map((row: Cell[]) => row.map((cell: any) => ({...cell, notes: new Set(cell.notes)})));
                savedState.history = savedState.history.map((hGrid: Grid) => hGrid.map(row => row.map(cell => ({...cell, notes: new Set(cell.notes)}))));

                setDifficulty(savedState.difficulty);
                setIsDailyChallenge(savedState.isDailyChallenge || false);
                setGrid(savedState.grid);
                setSolution(savedState.solution);
                setHistory(savedState.history);
                setMistakes(savedState.mistakes);
                setTime(savedState.time);
                setGameState('PLAYING');
                startTimer();
                return true;
            } catch (e) {
                console.error("Failed to load saved Sudoku game", e);
                localStorage.removeItem(SUDOKU_SAVE_KEY);
                return false;
            }
        }
        return false;
    }, [startTimer]);

    useEffect(() => {
        if (loadGame()) {
            setView('PLAYING');
        } else {
            setView('IDLE');
        }
        return () => stopTimer();
    }, [loadGame, stopTimer]);
    
    useEffect(() => {
        if (view === 'PLAYING' && gameState === 'PLAYING') {
            saveGame();
        }
        if(gameState === 'WON' || gameState === 'LOST' || view !== 'PLAYING') {
             localStorage.removeItem(SUDOKU_SAVE_KEY);
        }
    }, [view, gameState, saveGame]);
    
    useEffect(() => {
        if (mistakes >= MISTAKE_LIMIT && gameState === 'PLAYING') {
            stopTimer();
            setGameState('LOST');
        }
    }, [mistakes, stopTimer, gameState]);

    const handleCellClick = (row: number, col: number) => {
        if (gameState !== 'PLAYING') return;
        setSelectedCell({ row, col });
    };

    const handleNumberInput = (num: number) => {
        if (!selectedCell || !grid || !solution || grid[selectedCell.row][selectedCell.col].isPrefilled || gameState !== 'PLAYING') return;
        
        const { row, col } = selectedCell;
        let newGrid = JSON.parse(JSON.stringify(grid, (k, v) => k === 'notes' ? Array.from(v) : v));
        newGrid = newGrid.map((r: any) => r.map((c: any) => ({...c, notes: new Set(c.notes)})));

        newGrid.forEach((r: Cell[]) => r.forEach((c: Cell) => { c.isError = false; }));
        setHistory([...history, grid]);
        
        if (isNotesMode) {
            const notes = newGrid[row][col].notes;
            if (notes.has(num)) notes.delete(num); else notes.add(num);
        } else {
            if (solution[row][col] === num) {
                newGrid[row][col].value = num;
                newGrid[row][col].notes = new Set();
            } else {
                setMistakes(m => m + 1);
                newGrid[row][col].isError = true;
            }
        }
        setGrid(newGrid);

        if (!isNotesMode && solution[row][col] === num) {
             const isSolved = newGrid.every((r: Cell[]) => r.every((c: Cell) => c.value !== null));
             if (isSolved) {
                 stopTimer();
                 setGameState('WON');
                 onGameWin(difficulty, time, isDailyChallenge);
             }
        }
    };
    
    const handleErase = () => {
        if (!selectedCell || !grid || grid[selectedCell.row][selectedCell.col].isPrefilled || gameState !== 'PLAYING') return;
        const { row, col } = selectedCell;
        const newGrid = JSON.parse(JSON.stringify(grid, (k, v) => k === 'notes' ? Array.from(v) : v));
        setHistory([...history, grid]);
        newGrid[row][col].value = null;
        newGrid[row][col].notes = [];
        setGrid(newGrid.map((r: any) => r.map((c: any) => ({...c, notes: new Set(c.notes)}))));
    };

    const handleUndo = () => {
        if (history.length === 0 || gameState !== 'PLAYING') return;
        const lastGrid = history[history.length - 1];
        setGrid(lastGrid);
        setHistory(history.slice(0, -1));
    };
    
    const handleHint = () => {
        if (!selectedCell || !grid || !solution || gameState !== 'PLAYING') return;
        const { row, col } = selectedCell;
        const cell = grid[row][col];
        if (cell.isPrefilled || cell.value !== null) return;
        const newGrid = JSON.parse(JSON.stringify(grid, (k, v) => k === 'notes' ? Array.from(v) : v));
        setHistory([...history, grid]);
        newGrid[row][col].value = solution[row][col];
        newGrid[row][col].notes = [];
        const finalGrid = newGrid.map((r: any) => r.map((c: any) => ({...c, notes: new Set(c.notes)})));
        setGrid(finalGrid);
        const isSolved = finalGrid.every((r: any) => r.every((c: any) => c.value !== null));
        if (isSolved) {
            stopTimer();
            setGameState('WON');
            onGameWin(difficulty, time, isDailyChallenge);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const renderLoadingView = () => (
        <div className="text-center">
            <ArrowPathIcon className="w-10 h-10 mx-auto text-slate-400 animate-spin" />
            <p className="mt-2 text-slate-500">Generating puzzle...</p>
        </div>
    );

    const IdleView = () => (
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 text-center animate-fade-in">
          <BrainIcon className="w-16 h-16 mx-auto text-blue-500 mb-4" />
          <h2 className="text-3xl font-bold text-slate-800">Sudoku</h2>
          <p className="text-slate-500 mt-2 mb-6">A game of logic and concentration.</p>
          <div className="space-y-3">
            <button onClick={() => startNewGame('Medium', true)} className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors text-lg">
              Daily Challenge
            </button>
            <div className="flex items-center text-xs text-slate-400">
              <div className="flex-grow border-t border-slate-300"></div>
              <span className="flex-shrink px-2">Or Practice</span>
              <div className="flex-grow border-t border-slate-300"></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(['Easy', 'Medium', 'Hard', 'Expert'] as Difficulty[]).map(d => (
                <button key={d} onClick={() => startNewGame(d)} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-lg transition-colors">
                  {d}
                </button>
              ))}
            </div>
            <button onClick={() => setView('STATS')} className="mt-4 text-sm font-medium text-slate-500 hover:text-blue-500 inline-flex items-center gap-2">
                <TrophyIcon className="w-4 h-4" /> View Statistics
            </button>
          </div>
        </div>
    );

    const StatsView = () => {
        const StatCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children }) => (
          <div className={`bg-white rounded-xl p-4 shadow-sm`}>
            <h3 className="text-sm font-medium text-slate-500 mb-2">{title}</h3>
            <div className="text-slate-800">{children}</div>
          </div>
        );
      
        const formatStatTime = (seconds: number | null) => {
          if (seconds === null) return '–';
          return formatTime(seconds);
        };
      
        return (
          <div className="w-full max-w-2xl mx-auto p-4 animate-fade-in">
            <header className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-slate-800">Statistics</h2>
              <button onClick={() => setView(grid ? 'PLAYING' : 'IDLE')} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200">
                Back to Game
              </button>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <StatCard title="Daily Streak"><p className="text-4xl font-bold">{stats.dailyStreak} <span className="text-lg">days</span></p></StatCard>
              <StatCard title="Total Wins"><p className="text-4xl font-bold">{stats.totalWins}</p></StatCard>
              <StatCard title="Games Played"><p className="text-4xl font-bold">{stats.easy.gamesPlayed + stats.medium.gamesPlayed + stats.hard.gamesPlayed + stats.expert.gamesPlayed}</p></StatCard>
            </div>
      
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="text-lg font-semibold mb-3 text-slate-800">Performance by Difficulty</h3>
              <div className="space-y-2">
                {Object.entries(stats).filter(([key]) => ['easy', 'medium', 'hard', 'expert'].includes(key)).map(([key, value]) => {
                  const diffStats = value as SudokuDifficultyStats;
                  const avgTime = diffStats.gamesPlayed > 0 ? diffStats.totalTimePlayed / diffStats.gamesPlayed : null;
                  return (
                    <div key={key} className="grid grid-cols-4 items-center gap-4 text-sm p-2 rounded-md hover:bg-slate-50">
                      <p className="font-semibold capitalize text-slate-700">{key}</p>
                      <div><span className="text-slate-500">Best:</span> {formatStatTime(diffStats.fastestTime)}</div>
                      <div><span className="text-slate-500">Avg:</span> {avgTime !== null ? formatStatTime(Math.round(avgTime)) : '–'}</div>
                      <div><span className="text-slate-500">Played:</span> {diffStats.gamesPlayed}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
    };

    const renderErrorView = () => (
         <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 text-center">
            <h2 className="text-2xl font-bold text-red-600">Error</h2>
            <p className="text-slate-500 mt-2 mb-6">{errorMessage || 'Could not load puzzle.'}</p>
            <button onClick={() => startNewGame(difficulty)} className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors">
                Try Again
            </button>
        </div>
    );

    const renderGameBoard = () => {
        if (!grid) return null;

        const cellClasses = (r: number, c: number, cell: Cell) => {
            const isSelected = selectedCell?.row === r && selectedCell?.col === c;
            const isRelated = selectedCell && !isSelected && (selectedCell.row === r || selectedCell.col === c || (Math.floor(selectedCell.row / 3) === Math.floor(r / 3) && Math.floor(selectedCell.col / 3) === Math.floor(c / 3)));
            const selectedValue = (selectedCell && grid && grid[selectedCell.row][selectedCell.col].value) ? grid[selectedCell.row][selectedCell.col].value : null;
            const isSameValue = cell.value !== null && selectedValue !== null && cell.value === selectedValue;

            return [
                'bg-white flex items-center justify-center aspect-square text-2xl md:text-3xl font-sans cursor-pointer transition-colors duration-100',
                cell.isPrefilled ? 'font-medium text-slate-800' : 'font-medium text-blue-700',
                isSelected ? '!bg-blue-300' : '',
                isRelated ? 'bg-blue-100' : '',
                isSameValue && !isSelected ? 'bg-blue-200' : '',
                cell.isError ? '!bg-red-200 !text-red-700 font-bold' : ''
            ].join(' ');
        };
        
        const renderCellContent = (cell: Cell) => {
            if (cell.value) return cell.value;
            if (cell.notes.size > 0) {
                return (
                    <div className="grid grid-cols-3 text-[9px] md:text-[11px] font-normal text-slate-600 w-full h-full p-px leading-none">
                        {Array.from({length: 9}, (_, i) => i + 1).map(note => (
                            <div key={note} className="flex items-center justify-center">
                                {cell.notes.has(note) ? note : ''}
                            </div>
                        ))}
                    </div>
                );
            }
            return null;
        };

        return (
            <div className="w-full max-w-7xl mx-auto animate-fade-in p-2 sm:p-4 h-full flex flex-col">
                 <header className="flex-shrink-0 flex justify-between items-center mb-2 sm:mb-4 px-2">
                    <div className="text-base sm:text-lg font-bold text-slate-700">
                        Difficulty: <span className="text-blue-600">{isDailyChallenge ? "Daily" : difficulty}</span>
                    </div>
                    <button onClick={() => setView('STATS')} className="px-3 py-1.5 text-xs font-semibold rounded-full bg-slate-200 border border-slate-300 text-slate-600 hover:bg-slate-300 transition-colors">
                        Stats
                    </button>
                </header>
    
                <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 items-center">
                    <div className="w-full max-w-xl mx-auto aspect-square">
                        <div className="grid grid-cols-9 grid-rows-9 gap-px bg-slate-400 p-1 rounded-md border-2 border-slate-500 shadow-md">
                            {grid.map((row, r) =>
                                row.map((cell, c) => (
                                    <div
                                        key={`${r}-${c}`}
                                        onClick={() => handleCellClick(r, c)}
                                        className={`
                                            ${cellClasses(r, c, cell)}
                                            ${(c === 2 || c === 5) ? 'border-r-2 border-slate-500' : ''}
                                            ${(r === 2 || r === 5) ? 'border-b-2 border-slate-500' : ''}
                                        `}
                                    >
                                        {renderCellContent(cell)}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
    
                    <div className="w-full max-w-sm mx-auto flex flex-col gap-4">
                         <div className="flex justify-around p-2 rounded-xl bg-slate-50 border border-slate-200">
                             <div className="text-center">
                                 <div className="text-sm text-slate-500">Mistakes</div>
                                 <div className="text-2xl font-bold text-slate-700">{mistakes}/{MISTAKE_LIMIT}</div>
                             </div>
                             <div className="text-center">
                                 <div className="text-sm text-slate-500">Time</div>
                                 <div className="text-2xl font-bold text-slate-700">{formatTime(time)}</div>
                             </div>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-3">
                            <button onClick={handleUndo} className="h-14 bg-white rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors shadow-sm border border-slate-200" aria-label="Undo"><ArrowPathIcon className="w-7 h-7 -scale-x-100" /></button>
                            <button onClick={handleErase} className="h-14 bg-white rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors shadow-sm border border-slate-200" aria-label="Erase"><EraserIcon className="w-7 h-7" /></button>
                            <button onClick={() => setIsNotesMode(!isNotesMode)} className={`h-14 rounded-full flex items-center justify-center relative transition-colors shadow-sm border ${isNotesMode ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'}`} aria-label="Toggle Notes">
                                 <PencilIcon className="w-7 h-7" />
                            </button>
                            <button onClick={handleHint} className="h-14 bg-white rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors shadow-sm border border-slate-200" aria-label="Hint"><LightBulbIcon className="w-7 h-7" /></button>
                        </div>
    
                        <div className="grid grid-cols-9 gap-1">
                            {Array.from({length: 9}, (_, i) => i + 1).map(num => (
                                <button key={num} onClick={() => handleNumberInput(num)} className="aspect-square bg-blue-50 text-blue-800 rounded-lg text-2xl font-semibold hover:bg-blue-100 active:bg-blue-200 transition-colors">
                                    {num}
                                </button>
                            ))}
                        </div>
                        
                        <button onClick={() => setView('IDLE')} className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-lg shadow-md">
                            New Game
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    
    const renderContent = () => {
        switch(view) {
            case 'IDLE': return <IdleView />;
            case 'STATS': return <StatsView />;
            case 'PLAYING':
                switch(gameState) {
                    case 'LOADING': return renderLoadingView();
                    case 'PLAYING':
                    case 'WON':
                    case 'LOST':
                        return renderGameBoard();
                    case 'ERROR': return renderErrorView();
                    default: return <IdleView />;
                }
        }
    }

    return (
        <main className="flex-grow overflow-y-auto bg-slate-100 p-2 sm:p-4 md:p-6 flex flex-col items-center justify-center">
            {renderContent()}
            {(gameState === 'WON' || gameState === 'LOST') && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl w-full max-w-sm p-8 text-center" onClick={e => e.stopPropagation()}>
                        <h2 className="text-3xl font-bold text-slate-800">
                            {gameState === 'WON' ? 'Puzzle Solved!' : 'Game Over'}
                        </h2>
                        <p className="text-slate-500 mt-2">Difficulty: {isDailyChallenge ? "Daily" : difficulty}</p>
                        <p className="text-slate-500">Time: {formatTime(time)}</p>
                        <button onClick={() => {
                            if (gameState === 'WON' && isDailyChallenge) {
                                setView('STATS');
                                setGameState('IDLE');
                            } else {
                                startNewGame(isDailyChallenge ? 'Medium' : difficulty, isDailyChallenge);
                            }
                        }} className="mt-6 w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors">
                            {gameState === 'WON' ? (isDailyChallenge ? 'View Stats' : 'Play Again') : 'Try Again'}
                        </button>
                        <button onClick={() => { setGameState('IDLE'); setView('IDLE'); }} className="mt-3 w-full text-sm text-slate-500 font-medium hover:text-blue-500">
                            Back to Menu
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
};

export default SudokuPage;
