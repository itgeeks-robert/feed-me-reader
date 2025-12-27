
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowPathIcon, FireIcon, FlagIcon, SeymourIcon, XIcon } from './icons';
import { saveHighScore, getHighScores, ScoreCategory } from '../services/highScoresService';
import HighScoreTable from './HighScoreTable';

type Difficulty = 'Easy' | 'Medium' | 'Hard';
type GameState = 'IDLE' | 'PLAYING' | 'WON' | 'LOST';

interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

type Grid = Cell[][];

interface MinesweeperPageProps {
  onBackToHub: () => void;
  onReturnToFeeds: () => void;
}

const settings: Record<Difficulty, { rows: number; cols: number; mines: number }> = {
    Easy: { rows: 9, cols: 9, mines: 10 },
    Medium: { rows: 14, cols: 14, mines: 30 },
    Hard: { rows: 16, cols: 20, mines: 60 },
};

const MinesweeperPage: React.FC<MinesweeperPageProps> = ({ onBackToHub, onReturnToFeeds }) => {
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [grid, setGrid] = useState<Grid | null>(null);
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [time, setTime] = useState(0);
  const [flagsLeft, setFlagsLeft] = useState(0);
  const [isFlagMode, setIsFlagMode] = useState(false);
  const [initials, setInitials] = useState("");
  const timerRef = useRef<number | null>(null);

  useEffect(() => { setFlagsLeft(settings[difficulty].mines); }, [difficulty]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => setTime(t => t + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const handleSaveScore = () => {
    const cat = `minesweeper_${difficulty.toLowerCase()}` as ScoreCategory;
    saveHighScore(cat, {
        name: initials || "???",
        score: time,
        displayValue: `${time}s`,
        date: new Date().toISOString()
    }, true);
    reset();
  };

  const generateGrid = useCallback((startRow: number, startCol: number) => {
    const { rows, cols, mines } = settings[difficulty];
    let newGrid: Grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ isMine: false, isRevealed: false, isFlagged: false, adjacentMines: 0 })));
    let minesPlaced = 0;
    while (minesPlaced < mines) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      if (!newGrid[r][c].isMine && (Math.abs(r - startRow) > 1 || Math.abs(c - startCol) > 1)) {
        newGrid[r][c].isMine = true;
        minesPlaced++;
      }
    }
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!newGrid[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr, nc = c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newGrid[nr][nc].isMine) count++;
            }
          }
          newGrid[r][c].adjacentMines = count;
        }
      }
    }
    return newGrid;
  }, [difficulty]);

  const handleCellClick = (row: number, col: number) => {
    if (gameState === 'WON' || gameState === 'LOST') return;
    if (gameState === 'IDLE') {
      const initialGrid = generateGrid(row, col);
      setGameState('PLAYING');
      startTimer();
      const newGrid = revealCell(row, col, initialGrid);
      setGrid(newGrid);
      return;
    }
    if (isFlagMode) { toggleFlag(row, col); return; }
    if (!grid || grid[row][col].isRevealed || grid[row][col].isFlagged) return;
    if (grid[row][col].isMine) { loseGame(); return; }
    const newGrid = revealCell(row, col, grid);
    setGrid(newGrid);
    if (checkWinCondition(newGrid)) { stopTimer(); setGameState('WON'); }
  };

  const toggleFlag = (row: number, col: number) => {
    if (!grid || grid[row][col].isRevealed) return;
    const newGrid = [...grid];
    newGrid[row][col].isFlagged = !newGrid[row][col].isFlagged;
    setFlagsLeft(f => newGrid[row][col].isFlagged ? f - 1 : f + 1);
    setGrid(newGrid);
  };

  const revealCell = (row: number, col: number, currentGrid: Grid): Grid => {
    const newGrid = JSON.parse(JSON.stringify(currentGrid));
    const reveal = (r: number, c: number) => {
      if (r < 0 || r >= settings[difficulty].rows || c < 0 || c >= settings[difficulty].cols || newGrid[r][c].isRevealed || newGrid[r][c].isFlagged) return;
      newGrid[r][c].isRevealed = true;
      if (newGrid[r][c].adjacentMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) reveal(r + dr, c + dc);
        }
      }
    };
    reveal(row, col);
    return newGrid;
  };

  const checkWinCondition = (currentGrid: Grid): boolean => {
    return currentGrid.every(row => row.every(cell => cell.isMine || cell.isRevealed));
  };

  const loseGame = () => {
    stopTimer();
    setGameState('LOST');
    const finalGrid = grid?.map(row => row.map(cell => cell.isMine ? { ...cell, isRevealed: true } : cell)) || null;
    setGrid(finalGrid);
  };

  const reset = () => { setGameState('IDLE'); setGrid(null); setTime(0); setInitials(""); stopTimer(); };

  return (
    <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-4 overflow-y-auto">
        <div className="max-w-2xl w-full flex flex-col gap-6">
            <header className="flex justify-between items-center bg-zinc-900/50 p-6 rounded-[2rem] border-2 border-white/5 backdrop-blur-xl">
                <button onClick={onBackToHub} className="p-2 bg-zinc-800 rounded-xl text-zinc-400 hover:text-flesh-500 transition-colors"><XIcon className="w-6 h-6" /></button>
                <div className="text-center">
                    <span className="text-[10px] font-black uppercase text-plant-500 tracking-[0.3em]">Spore Pods</span>
                    <h2 className="text-2xl font-black italic uppercase text-white">Toxic Pods</h2>
                </div>
                <div className="flex gap-4">
                   <div className="bg-black/40 px-4 py-2 rounded-xl text-center">
                    <span className="text-[8px] font-black text-plant-500 uppercase block">Uptime</span>
                    <span className="text-xl font-black italic font-mono text-plant-400">{time}</span>
                  </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-[1fr,250px] gap-6">
                <div className="bg-zinc-900 p-2 rounded-[2.5rem] border-4 border-zinc-800 shadow-2xl overflow-hidden">
                    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${settings[difficulty].cols}, 1fr)` }}>
                      {grid?.map((row, r) => row.map((cell, c) => {
                        const colors = ['', 'text-plant-400', 'text-flesh-400', 'text-yellow-400', 'text-purple-400', 'text-red-400', 'text-orange-400', 'text-white', 'text-zinc-400'];
                        return (
                            <div key={`${r}-${c}`} onClick={() => handleCellClick(r, c)} onContextMenu={(e) => { e.preventDefault(); toggleFlag(r, c); }}
                                className={`aspect-square flex items-center justify-center text-xs sm:text-sm font-black rounded-lg transition-all cursor-pointer ${cell.isRevealed ? (cell.isMine ? 'bg-flesh-600 scale-90' : 'bg-black/30') : 'bg-zinc-800 hover:bg-zinc-700 shadow-inner'} ${cell.isFlagged ? 'bg-yellow-500/20' : ''}`}>
                                {cell.isRevealed ? (cell.isMine ? '☣️' : cell.adjacentMines || '') : (cell.isFlagged ? '🚩' : '')}
                                {cell.isRevealed && !cell.isMine && cell.adjacentMines > 0 && <span className={colors[cell.adjacentMines]}>{cell.adjacentMines}</span>}
                            </div>
                        )
                      })) || Array.from({length: settings[difficulty].rows * settings[difficulty].cols}).map((_, i) => (
                        <div key={i} onClick={() => handleCellClick(Math.floor(i/settings[difficulty].cols), i%settings[difficulty].cols)} className="aspect-square bg-zinc-800 rounded-lg shadow-inner hover:bg-zinc-700 transition-colors"></div>
                      ))}
                    </div>
                </div>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col bg-zinc-900 p-4 rounded-3xl border-2 border-white/5">
                        <div className="flex justify-between mb-4">
                            {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
                                <button key={d} onClick={() => { setDifficulty(d); reset(); }} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase italic transition-all ${difficulty === d ? 'bg-plant-600 text-black' : 'text-zinc-500 hover:text-white'}`}>{d}</button>
                            ))}
                        </div>
                        <HighScoreTable entries={getHighScores(`minesweeper_${difficulty.toLowerCase()}` as ScoreCategory)} title={difficulty} />
                    </div>
                    <button onClick={() => setIsFlagMode(!isFlagMode)} className={`w-full py-4 rounded-2xl font-black uppercase text-xs italic tracking-widest border-2 transition-all ${isFlagMode ? 'bg-flesh-600 border-flesh-400 text-white' : 'bg-zinc-900 border-white/5 text-zinc-500'}`}>
                        Flag Mode: {isFlagMode ? 'ON' : 'OFF'}
                    </button>
                </div>
            </div>
        </div>

        {(gameState === 'WON' || gameState === 'LOST') && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6 text-center">
                <div className="max-w-sm w-full bg-zinc-900 p-12 rounded-[3rem] border-4 border-plant-500 shadow-[0_0_100px_rgba(34,197,94,0.3)]">
                    <h2 className={`text-6xl font-black italic uppercase tracking-tighter mb-4 ${gameState === 'WON' ? 'text-plant-500' : 'text-flesh-500'}`}>
                        {gameState === 'WON' ? 'HI-SCORE!' : 'BURST!'}
                    </h2>
                    {gameState === 'WON' ? (
                        <div className="mb-8">
                            <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-4">Enter Arcade Initials</p>
                            <input autoFocus maxLength={3} value={initials} onChange={e => setInitials(e.target.value.toUpperCase())}
                                className="bg-black/50 border-2 border-plant-500 text-plant-500 rounded-xl px-4 py-3 text-center text-2xl font-black w-32 outline-none uppercase italic" placeholder="???" />
                        </div>
                    ) : <p className="text-zinc-500 font-bold uppercase tracking-widest mb-10">Spores released.</p>}
                    <button onClick={gameState === 'WON' ? handleSaveScore : reset} className="w-full py-5 bg-plant-600 text-black font-black text-xl italic uppercase rounded-full hover:scale-105 transition-transform">
                        {gameState === 'WON' ? 'Post Record' : 'Try Again'}
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};

export default MinesweeperPage;
