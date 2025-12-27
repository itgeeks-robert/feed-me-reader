
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowPathIcon, FlagIcon, XIcon, VoidIcon } from './icons';
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

const MinesweeperPage: React.FC<MinesweeperPageProps> = ({ onBackToHub }) => {
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [grid, setGrid] = useState<Grid | null>(null);
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [time, setTime] = useState(0);
  const [flagsLeft, setFlagsLeft] = useState(0);
  const [isFlagMode, setIsFlagMode] = useState(false);
  const [initials, setInitials] = useState("");
  const timerRef = useRef<number | null>(null);

  useEffect(() => { 
    setFlagsLeft(settings[difficulty].mines); 
  }, [difficulty]);

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
        name: initials.toUpperCase() || "???",
        score: time,
        displayValue: `${time}s`,
        date: new Date().toISOString()
    }, true);
    reset();
  };

  const generateGrid = useCallback((startRow: number, startCol: number) => {
    const { rows, cols, mines } = settings[difficulty];
    let newGrid: Grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ 
      isMine: false, 
      isRevealed: false, 
      isFlagged: false, 
      adjacentMines: 0 
    })));

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

    if (!grid) return;

    if (isFlagMode) {
      toggleFlag(row, col);
      return;
    }

    if (grid[row][col].isRevealed || grid[row][col].isFlagged) return;

    if (grid[row][col].isMine) {
      loseGame();
      return;
    }

    const newGrid = revealCell(row, col, grid);
    setGrid(newGrid);

    if (checkWinCondition(newGrid)) {
      stopTimer();
      setGameState('WON');
    }
  };

  const toggleFlag = (row: number, col: number) => {
    if (!grid || grid[row][col].isRevealed) return;
    const newGrid = grid.map((r, ri) => r.map((c, ci) => {
      if (ri === row && ci === col) {
        const nextFlagged = !c.isFlagged;
        setFlagsLeft(f => nextFlagged ? f - 1 : f + 1);
        return { ...c, isFlagged: nextFlagged };
      }
      return c;
    }));
    setGrid(newGrid);
  };

  const revealCell = (row: number, col: number, currentGrid: Grid): Grid => {
    const newGrid = JSON.parse(JSON.stringify(currentGrid));
    const { rows, cols } = settings[difficulty];

    const reveal = (r: number, c: number) => {
      if (r < 0 || r >= rows || c < 0 || c >= cols || newGrid[r][c].isRevealed || newGrid[r][c].isFlagged) return;
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

  const reset = () => { 
    setGameState('IDLE'); 
    setGrid(null); 
    setTime(0); 
    setInitials(""); 
    stopTimer(); 
    setFlagsLeft(settings[difficulty].mines);
  };

  return (
    <div className="w-full h-full bg-void-950 flex flex-col items-center p-4 overflow-y-auto scrollbar-hide">
        <style>{`
            .grid-crt::before {
                content: " ";
                display: block;
                position: absolute;
                top: 0; left: 0; bottom: 0; right: 0;
                background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%), 
                            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34, 197, 94, 0.05) 2px, rgba(34, 197, 94, 0.05) 4px);
                z-index: 10;
                pointer-events: none;
            }
            .digit-1 { color: #3b82f6; font-weight: 900; }
            .digit-2 { color: #10b981; font-weight: 900; }
            .digit-3 { color: #ef4444; font-weight: 900; }
            .digit-4 { color: #8b5cf6; font-weight: 900; }
            .digit-5 { color: #f59e0b; font-weight: 900; }
            .digit-6 { color: #06b6d4; font-weight: 900; }
            .digit-7 { color: #ec4899; font-weight: 900; }
            .digit-8 { color: #ffffff; font-weight: 900; }
        `}</style>

        <div className="max-w-4xl w-full flex flex-col gap-6">
            <header className="flex flex-col md:flex-row justify-between items-center bg-void-900/50 p-6 rounded-[2rem] border-2 border-white/5 backdrop-blur-xl gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={onBackToHub} className="p-3 bg-zinc-900 rounded-2xl text-zinc-400 hover:text-white transition-all active:scale-95 shadow-lg border border-white/5">
                        <XIcon className="w-6 h-6" />
                    </button>
                    <div>
                        <span className="text-[9px] font-black uppercase text-signal-500 tracking-[0.4em] block mb-1">Surveillance Log</span>
                        <h2 className="text-xl md:text-2xl font-black italic uppercase text-white tracking-tighter leading-none">ANOMALY DETECTOR</h2>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                   <div className="bg-black/60 px-5 py-2.5 rounded-2xl border border-signal-500/20 shadow-inner flex flex-col items-center min-w-[80px]">
                        <span className="text-[8px] font-black text-signal-500 uppercase block mb-0.5 tracking-widest">Time</span>
                        <span className="text-xl font-black italic font-mono text-white leading-none">{String(time).padStart(3, '0')}</span>
                  </div>
                  <div className="bg-black/60 px-5 py-2.5 rounded-2xl border border-pulse-500/20 shadow-inner flex flex-col items-center min-w-[80px]">
                        <span className="text-[8px] font-black text-pulse-500 uppercase block mb-0.5 tracking-widest">Leaks</span>
                        <span className="text-xl font-black italic font-mono text-white leading-none">{String(Math.max(0, flagsLeft)).padStart(2, '0')}</span>
                  </div>
                  <button onClick={reset} className="p-3 bg-signal-900/20 text-signal-500 rounded-2xl border border-signal-500/30 hover:bg-signal-500 hover:text-black transition-all">
                      <ArrowPathIcon className="w-6 h-6" />
                  </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-8">
                <div className="bg-void-900/40 p-4 rounded-[2.5rem] border-4 border-zinc-900 shadow-2xl relative overflow-hidden grid-crt">
                    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${settings[difficulty].cols}, 1fr)` }}>
                      {grid?.map((row, r) => row.map((cell, c) => (
                        <div 
                            key={`${r}-${c}`} 
                            onClick={() => handleCellClick(r, c)} 
                            onContextMenu={(e) => { e.preventDefault(); toggleFlag(r, c); }}
                            className={`aspect-square flex items-center justify-center text-sm md:text-xl font-black rounded-lg transition-all cursor-pointer relative
                                ${cell.isRevealed 
                                    ? (cell.isMine ? 'bg-pulse-600 shadow-[0_0_15px_#e11d48]' : 'bg-black/40 ring-1 ring-white/5') 
                                    : 'bg-zinc-900 hover:bg-zinc-800 shadow-lg border border-white/5 hover:scale-105 active:scale-95'
                                } 
                                ${cell.isFlagged ? 'bg-signal-500/10' : ''}`}
                        >
                            {cell.isRevealed ? (
                                cell.isMine ? (
                                    <div className="text-white animate-pulse">☢️</div>
                                ) : (
                                    cell.adjacentMines > 0 && (
                                        <span className={`digit-${cell.adjacentMines} drop-shadow-md`}>
                                            {cell.adjacentMines}
                                        </span>
                                    )
                                )
                            ) : (
                                cell.isFlagged && <div className="text-pulse-500 drop-shadow-[0_0_8px_rgba(225,29,72,0.5)]">⚑</div>
                            )}
                        </div>
                      ))) || Array.from({length: settings[difficulty].rows * settings[difficulty].cols}).map((_, i) => (
                        <div key={i} onClick={() => handleCellClick(Math.floor(i/settings[difficulty].cols), i%settings[difficulty].cols)} className="aspect-square bg-zinc-900 rounded-lg shadow-inner hover:bg-zinc-800 transition-colors border border-white/5"></div>
                      ))}
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="bg-void-900/50 p-6 rounded-3xl border border-white/5 shadow-xl">
                        <div className="flex justify-between gap-2 mb-6">
                            {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
                                <button key={d} onClick={() => { setDifficulty(d); reset(); }} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase italic transition-all border-2 ${difficulty === d ? 'bg-signal-600 border-signal-400 text-white shadow-lg' : 'bg-zinc-900 border-transparent text-zinc-500 hover:text-zinc-300'}`}>{d}</button>
                            ))}
                        </div>
                        <HighScoreTable entries={getHighScores(`minesweeper_${difficulty.toLowerCase()}` as ScoreCategory)} title={difficulty} />
                    </div>

                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={() => setIsFlagMode(!isFlagMode)} 
                            className={`w-full py-5 rounded-2xl font-black uppercase text-xs italic tracking-widest border-2 transition-all shadow-xl group
                                ${isFlagMode 
                                    ? 'bg-pulse-600 border-pulse-400 text-white shadow-[0_0_30px_rgba(225,29,72,0.3)]' 
                                    : 'bg-void-900 border-white/10 text-zinc-500 hover:text-white'
                                }`}
                        >
                            <span className="flex items-center justify-center gap-3">
                                <FlagIcon className={`w-5 h-5 ${isFlagMode ? 'animate-bounce' : ''}`} />
                                {isFlagMode ? 'PLACING BEACONS' : 'ANALYSIS MODE'}
                            </span>
                        </button>
                        <p className="text-[9px] text-zinc-600 uppercase font-bold text-center tracking-widest font-mono">
                            {isFlagMode ? 'Tap to mark anomalies' : 'Tap to reveal grid data'}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {gameState === 'WON' && (
            <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-6 text-center">
                <div className="max-w-sm w-full bg-void-900 p-10 rounded-[3rem] border-4 border-signal-500 shadow-[0_0_100px_rgba(34,197,94,0.3)]">
                    <div className="mb-6 mx-auto w-20 h-20 bg-signal-500/10 rounded-full flex items-center justify-center border border-signal-500/30">
                        <VoidIcon className="w-12 h-12 text-signal-500 animate-pulse" />
                    </div>
                    <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-4 text-signal-500">THREAT NEUTRALIZED</h2>
                    <div className="mb-8">
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-4">Enter Operator ID</p>
                        <input autoFocus maxLength={3} value={initials} onChange={e => setInitials(e.target.value.toUpperCase())}
                            className="bg-black/50 border-2 border-signal-500 text-signal-500 rounded-xl px-4 py-3 text-center text-2xl font-black w-32 outline-none uppercase italic" placeholder="???" />
                    </div>
                    <button onClick={handleSaveScore} className="w-full py-5 bg-signal-600 text-black font-black text-xl italic uppercase rounded-full hover:scale-105 transition-all shadow-xl">LOG RECORD</button>
                </div>
            </div>
        )}

        {gameState === 'LOST' && (
            <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-6 text-center">
                <div className="max-w-sm w-full bg-void-900 p-10 rounded-[3rem] border-4 border-pulse-500 shadow-[0_0_100px_rgba(225,29,72,0.3)]">
                    <div className="mb-6 mx-auto w-20 h-20 bg-pulse-500/10 rounded-full flex items-center justify-center border border-pulse-500/30">
                        <div className="text-4xl">☢️</div>
                    </div>
                    <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-4 text-pulse-500">DETONATION</h2>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-10 leading-relaxed">Mainframe compromised.<br/>Anomaly detected.</p>
                    <button onClick={reset} className="w-full py-5 bg-pulse-600 text-white font-black text-xl italic uppercase rounded-full hover:scale-105 transition-all shadow-xl">REBOOT SCANNER</button>
                </div>
            </div>
        )}
    </div>
  );
};

export default MinesweeperPage;
