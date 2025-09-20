import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowPathIcon, FireIcon, FlagIcon, TrophyIcon } from './icons';

type Difficulty = 'Easy' | 'Medium' | 'Hard';
type GameState = 'IDLE' | 'PLAYING' | 'WON' | 'LOST';

interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

type Grid = Cell[][];

const a11yKeyboardSupport = (e: React.KeyboardEvent, action: () => void) => {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    action();
  }
};

interface MinesweeperPageProps {
  onBackToHub: () => void;
}

const MinesweeperPage: React.FC<MinesweeperPageProps> = ({ onBackToHub }) => {
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [grid, setGrid] = useState<Grid | null>(null);
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [time, setTime] = useState(0);
  const [flagsLeft, setFlagsLeft] = useState(0);
  const timerRef = useRef<number | null>(null);

  const settings: Record<Difficulty, { rows: number; cols: number; mines: number }> = {
    Easy: { rows: 9, cols: 9, mines: 10 },
    Medium: { rows: 16, cols: 16, mines: 40 },
    Hard: { rows: 16, cols: 30, mines: 99 },
  };

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => setTime(t => t + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const generateGrid = useCallback((startRow: number, startCol: number) => {
    const { rows, cols, mines } = settings[difficulty];
    let newGrid: Grid = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        adjacentMines: 0,
      }))
    );

    let minesPlaced = 0;
    while (minesPlaced < mines) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      const isStartCell = Math.abs(r - startRow) <= 1 && Math.abs(c - startCol) <= 1;

      if (!newGrid[r][c].isMine && !isStartCell) {
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
              if (dr === 0 && dc === 0) continue;
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newGrid[nr][nc].isMine) {
                count++;
              }
            }
          }
          newGrid[r][c].adjacentMines = count;
        }
      }
    }
    return newGrid;
  }, [difficulty, settings]);

  const startGame = (diff: Difficulty) => {
    setDifficulty(diff);
    setGameState('IDLE');
    setGrid(null);
    setTime(0);
    setFlagsLeft(settings[diff].mines);
    stopTimer();
  };
  
  const resetGame = () => {
      startGame(difficulty);
  }

  const revealCell = useCallback((row: number, col: number, currentGrid: Grid): Grid => {
    const { rows, cols } = settings[difficulty];
    let newGrid = JSON.parse(JSON.stringify(currentGrid));

    const reveal = (r: number, c: number) => {
      if (r < 0 || r >= rows || c < 0 || c >= cols || newGrid[r][c].isRevealed || newGrid[r][c].isFlagged) {
        return;
      }
      newGrid[r][c].isRevealed = true;
      if (newGrid[r][c].adjacentMines === 0 && !newGrid[r][c].isMine) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr !== 0 || dc !== 0) {
              reveal(r + dr, c + dc);
            }
          }
        }
      }
    };
    reveal(row, col);
    return newGrid;
  }, [difficulty, settings]);

  const checkWinCondition = (currentGrid: Grid): boolean => {
    const { rows, cols } = settings[difficulty];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = currentGrid[r][c];
        if (!cell.isMine && !cell.isRevealed) {
          return false;
        }
      }
    }
    return true;
  };
  
  const handleCellClick = (row: number, col: number) => {
    if (gameState === 'WON' || gameState === 'LOST') return;

    let currentGrid = grid;
    if (gameState === 'IDLE') {
      currentGrid = generateGrid(row, col);
      setGameState('PLAYING');
      startTimer();
    }
    
    if(!currentGrid) return;
    const cell = currentGrid[row][col];
    if (cell.isRevealed || cell.isFlagged) return;

    if (cell.isMine) {
      stopTimer();
      setGameState('LOST');
      const finalGrid = JSON.parse(JSON.stringify(currentGrid));
      finalGrid.forEach((r: Cell[]) => r.forEach((c: Cell) => { if(c.isMine) c.isRevealed = true; }));
      setGrid(finalGrid);
      return;
    }

    const newGrid = revealCell(row, col, currentGrid);
    setGrid(newGrid);

    if (checkWinCondition(newGrid)) {
      stopTimer();
      setGameState('WON');
      const finalGrid = JSON.parse(JSON.stringify(newGrid));
      finalGrid.forEach((r: Cell[]) => r.forEach((c: Cell) => { if(c.isMine) c.isFlagged = true; }));
      setGrid(finalGrid);
    }
  };
  
  const handleRightClick = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    if (gameState !== 'PLAYING' || !grid) return;
    
    const cell = grid[row][col];
    if (cell.isRevealed) return;
    
    const newGrid = JSON.parse(JSON.stringify(grid));
    const newCell = newGrid[row][col];
    
    if (newCell.isFlagged) {
      newCell.isFlagged = false;
      setFlagsLeft(f => f + 1);
    } else if (flagsLeft > 0) {
      newCell.isFlagged = true;
      setFlagsLeft(f => f - 1);
    }
    setGrid(newGrid);
  };
  
  const chord = (e: React.MouseEvent, row: number, col: number) => {
      if (e.buttons !== 3 || !grid) return; // 3 means both left and right are pressed
      const cell = grid[row][col];
      if (!cell.isRevealed || cell.adjacentMines === 0) return;

      const { rows, cols } = settings[difficulty];
      let flagsAround = 0;
      let nonMineNeighbors: {r: number, c: number}[] = [];

      for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = row + dr;
              const nc = col + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                  if (grid[nr][nc].isFlagged) flagsAround++;
                  if (!grid[nr][nc].isFlagged && !grid[nr][nc].isRevealed) nonMineNeighbors.push({r: nr, c: nc});
              }
          }
      }

      if (flagsAround === cell.adjacentMines) {
          let newGrid = grid;
          let gameLost = false;
          for(const {r, c} of nonMineNeighbors) {
              if(newGrid[r][c].isMine) {
                  gameLost = true;
                  break;
              }
              newGrid = revealCell(r, c, newGrid);
          }
          
          if(gameLost) {
            stopTimer();
            setGameState('LOST');
            const finalGrid = JSON.parse(JSON.stringify(grid));
            finalGrid.forEach((r: Cell[]) => r.forEach((c: Cell) => { if(c.isMine) c.isRevealed = true; }));
            setGrid(finalGrid);
          } else {
              setGrid(newGrid);
              if (checkWinCondition(newGrid)) {
                  stopTimer();
                  setGameState('WON');
                  const finalGrid = JSON.parse(JSON.stringify(newGrid));
                  finalGrid.forEach((r: Cell[]) => r.forEach((c: Cell) => { if(c.isMine) c.isFlagged = true; }));
                  setGrid(finalGrid);
              }
          }
      }
  }


  const formatTime = (seconds: number) => String(seconds).padStart(3, '0');
  const getCellContent = (cell: Cell) => {
      if (cell.isFlagged) return <FlagIcon className="w-1/2 h-1/2 text-red-600"/>;
      if (cell.isRevealed) {
          if (cell.isMine) return <FireIcon className="w-3/4 h-3/4 text-zinc-800"/>;
          if (cell.adjacentMines > 0) {
              const colors = ['text-blue-600', 'text-green-600', 'text-red-600', 'text-purple-700', 'text-maroon-700', 'text-cyan-600', 'text-black', 'text-gray-500'];
              return <span className={`font-bold ${colors[cell.adjacentMines - 1]}`}>{cell.adjacentMines}</span>;
          }
      }
      return null;
  };

  const { rows, cols } = settings[difficulty];

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-2 bg-zinc-100 dark:bg-zinc-900 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-800 p-2 sm:p-3 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 w-full max-w-max">
          <header className="flex justify-between items-center mb-4 bg-zinc-200 dark:bg-zinc-900 p-2 rounded-lg">
              <div className="font-mono text-2xl bg-zinc-800 text-red-500 px-2 rounded">{formatTime(flagsLeft)}</div>
              <button onClick={resetGame} className="w-10 h-10 flex items-center justify-center bg-zinc-300 dark:bg-zinc-700 rounded-full text-2xl hover:bg-yellow-400">
                  {gameState === 'PLAYING' ? '🙂' : gameState === 'WON' ? '😎' : gameState === 'LOST' ? '😵' : '🙂'}
              </button>
              <div className="font-mono text-2xl bg-zinc-800 text-red-500 px-2 rounded">{formatTime(time)}</div>
          </header>
            <div className="overflow-x-auto scrollbar-hide">
              <div 
                  className="grid gap-px bg-zinc-400 dark:bg-zinc-600 border border-zinc-500 dark:border-zinc-700" 
                  style={{ 
                    gridTemplateColumns: `repeat(${cols}, 1fr)`, 
                    minWidth: `${cols * 1.75}rem`,
                    touchAction: 'none' 
                  }}
                  onContextMenu={(e) => e.preventDefault()}
              >
                  {Array.from({length: rows}).map((_, r) => (
                      Array.from({length: cols}).map((_, c) => {
                          const cell = grid?.[r]?.[c];
                          const isRevealed = cell?.isRevealed ?? false;
                          const cellClasses = [
                              'aspect-square flex items-center justify-center text-sm sm:text-base font-bold select-none',
                              isRevealed ? 'bg-zinc-300 dark:bg-zinc-700' : 'bg-zinc-400 dark:bg-zinc-800 hover:bg-zinc-500 dark:hover:bg-zinc-600 shadow-inner-light dark:shadow-inner-dark',
                              !isRevealed && 'border-t-zinc-200 border-l-zinc-200 border-b-zinc-500 border-r-zinc-500 dark:border-t-zinc-600 dark:border-l-zinc-600 dark:border-b-zinc-900 dark:border-r-zinc-900 border-2'
                          ].join(' ');

                          return (
                            <div key={`${r}-${c}`}
                                className={cellClasses}
                                onClick={() => handleCellClick(r,c)}
                                onContextMenu={(e) => handleRightClick(e, r, c)}
                                onMouseDown={(e) => chord(e,r,c)}
                            >
                                {cell ? getCellContent(cell) : null}
                            </div>
                          )
                      })
                  ))}
              </div>
          </div>
           <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
                {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
                    <button key={d} onClick={() => startGame(d)} 
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${difficulty === d ? 'bg-orange-500 text-white' : 'bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600'}`}
                    >
                        {d}
                    </button>
                ))}
            </div>
      </div>
      <button onClick={onBackToHub} className="mt-4 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-orange-500 dark:hover:text-orange-400">
        Back to Game Hub
      </button>

      {(gameState === 'WON' || gameState === 'LOST') && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-xl w-full max-w-sm p-8 text-center">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">
              {gameState === 'WON' ? 'You Win!' : 'Game Over'}
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">Difficulty: {difficulty}</p>
            <p className="text-zinc-600 dark:text-zinc-400">Time: {time} seconds</p>
            <button onClick={resetGame} className="mt-6 w-full bg-orange-500 text-white font-semibold py-3 rounded-lg hover:bg-orange-600 transition-colors">
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MinesweeperPage;