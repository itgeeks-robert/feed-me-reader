import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowPathIcon, FireIcon, FlagIcon } from './icons';

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
    Medium: { rows: 16, cols: 16, mines: 40 },
    Hard: { rows: 16, cols: 30, mines: 99 },
};

const MinesweeperPage: React.FC<MinesweeperPageProps> = ({ onBackToHub, onReturnToFeeds }) => {
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [grid, setGrid] = useState<Grid | null>(null);
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [time, setTime] = useState(0);
  const [flagsLeft, setFlagsLeft] = useState(0);
  const [isFlagMode, setIsFlagMode] = useState(false);
  const [detonatedMine, setDetonatedMine] = useState<{ row: number; col: number } | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
      setFlagsLeft(settings[difficulty].mines);
  }, [difficulty]);


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
      const isStartCell = r === startRow && c === startCol;

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
  }, [difficulty]);

  const changeDifficulty = (diff: Difficulty) => {
    setDifficulty(diff);
    setGameState('IDLE');
    setGrid(null);
    setTime(0);
    setFlagsLeft(settings[diff].mines);
    setIsFlagMode(false);
    setDetonatedMine(null);
    stopTimer();
  };
  
  const resetGame = () => {
      changeDifficulty(difficulty);
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
  }, [difficulty]);

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

  const loseGame = (grid: Grid, detonated: {row: number, col: number} | null) => {
    stopTimer();
    setGameState('LOST');
    if(detonated) setDetonatedMine(detonated);
    
    const finalGrid = JSON.parse(JSON.stringify(grid));
    finalGrid.forEach((gridRow: Cell[]) => gridRow.forEach((gridCell: Cell) => {
      if (gridCell.isMine) gridCell.isRevealed = true;
    }));
    setGrid(finalGrid);
  }

  const toggleFlag = (row: number, col: number) => {
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

    if (isFlagMode) {
      toggleFlag(row, col);
      return;
    }

    if (!grid) return;
    const cell = grid[row][col];
    if (cell.isRevealed || cell.isFlagged) return;

    if (cell.isMine) {
      loseGame(grid, { row, col });
      return;
    }

    const newGrid = revealCell(row, col, grid);
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
    toggleFlag(row, col);
  };
  
  const chord = (e: React.MouseEvent, row: number, col: number) => {
      if ((e.buttons !== 3 && e.button !== 1) || !grid || gameState !== 'PLAYING') return;
      const cell = grid[row][col];
      if (!cell.isRevealed || cell.adjacentMines === 0) return;

      const { rows, cols } = settings[difficulty];
      let flagsAround = 0;
      const neighbors: {r: number, c: number}[] = [];

      for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = row + dr;
              const nc = col + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                  neighbors.push({r: nr, c: nc});
                  if (grid[nr][nc].isFlagged) flagsAround++;
              }
          }
      }

      if (flagsAround === cell.adjacentMines) {
          let newGrid = grid;
          let detonatedCoords: {row: number, col: number} | null = null;

          for(const {r, c} of neighbors) {
              if(!newGrid[r][c].isFlagged && !newGrid[r][c].isRevealed) {
                if(newGrid[r][c].isMine) {
                    detonatedCoords = {row: r, col: c};
                    break;
                }
                newGrid = revealCell(r, c, newGrid);
              }
          }
          
          if(detonatedCoords) {
            loseGame(grid, detonatedCoords);
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
      if (gameState === 'LOST' && cell.isFlagged && !cell.isMine) {
        return <div className="relative w-full h-full flex items-center justify-center">
            <FlagIcon className="w-1/2 h-1/2 text-zinc-400 opacity-50"/>
            <span className="absolute text-red-500 text-3xl font-black">×</span>
        </div>
      }
      if (cell.isFlagged) return <FlagIcon className="w-1/2 h-1/2 text-yellow-400"/>;
      if (cell.isRevealed) {
          if (cell.isMine) return <FireIcon className="w-3/4 h-3/4 text-white"/>;
          if (cell.adjacentMines > 0) {
              const colors = ['text-cyan-400', 'text-green-400', 'text-red-400', 'text-purple-400', 'text-orange-400', 'text-teal-400', 'text-white', 'text-zinc-400'];
              return <span className={`font-bold font-mono ${colors[cell.adjacentMines - 1]}`}>{cell.adjacentMines}</span>;
          }
      }
      return null;
  };

  const { rows, cols } = settings[difficulty];

  const faceEmoji = gameState === 'PLAYING' ? '🤔' : gameState === 'WON' ? '😎' : gameState === 'LOST' ? '😵' : '🙂';

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-2 sm:p-4 bg-[#0a0f18] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(56,189,248,0.3),rgba(255,255,255,0))] overflow-y-auto">
      <div className="bg-black/30 backdrop-blur-md p-3 sm:p-4 rounded-xl shadow-2xl border border-cyan-300/20 w-full max-w-max animate-fade-in">
          <header className="flex justify-between items-center mb-4 bg-black/50 p-2 rounded-lg border border-cyan-300/10">
              <div className="font-mono text-2xl sm:text-3xl bg-black text-red-500 px-3 py-1 rounded-md shadow-inner-dark" style={{textShadow: '0 0 5px #f00'}}>{formatTime(flagsLeft)}</div>
              <button onClick={resetGame} className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-zinc-700 rounded-full text-3xl hover:bg-yellow-400/80 transition-colors border-2 border-zinc-600 shadow-md">
                  {faceEmoji}
              </button>
              <div className="font-mono text-2xl sm:text-3xl bg-black text-red-500 px-3 py-1 rounded-md shadow-inner-dark" style={{textShadow: '0 0 5px #f00'}}>{formatTime(time)}</div>
          </header>
            <div className="overflow-x-auto scrollbar-hide">
              <div 
                  className="grid gap-px bg-cyan-500/10 p-1 border border-cyan-400/20" 
                  style={{ 
                    gridTemplateColumns: `repeat(${cols}, 1fr)`, 
                    minWidth: `${cols * 2}rem`,
                    touchAction: 'none' 
                  }}
                  onContextMenu={(e) => e.preventDefault()}
              >
                  {Array.from({length: rows}).map((_, r) => (
                      Array.from({length: cols}).map((_, c) => {
                          const cell = grid?.[r]?.[c];
                          const isRevealed = cell?.isRevealed ?? false;
                          const isDetonated = detonatedMine?.row === r && detonatedMine?.col === c;

                          let bgClass = 'bg-black/20 hover:bg-cyan-400/20';
                          if (isDetonated) {
                            bgClass = 'bg-red-600';
                          } else if (isRevealed) {
                            if (cell?.isMine) bgClass = 'bg-red-500/50';
                            else bgClass = 'bg-black/40';
                          }
                          
                          const cellClasses = [
                              'aspect-square flex items-center justify-center text-lg sm:text-xl select-none transition-colors duration-100 shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),_inset_0_-1px_2px_rgba(0,0,0,0.5)]',
                              bgClass,
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
           <div className="mt-4 flex flex-wrap gap-2 justify-center items-center">
                <button 
                    onClick={() => setIsFlagMode(!isFlagMode)} 
                    className={`px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200 border-2 flex items-center gap-2 ${isFlagMode ? 'bg-cyan-400 text-black border-cyan-300 shadow-[0_0_10px_rgba(56,189,248,0.5)]' : 'bg-black/30 text-cyan-300 border-cyan-400/20 hover:bg-cyan-400/20 hover:text-cyan-200'}`}
                >
                    <FlagIcon className="w-5 h-5"/>
                    <span className="hidden sm:inline">Flag Mode</span>
                </button>
                {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
                    <button key={d} onClick={() => changeDifficulty(d)} 
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 border-2 ${difficulty === d ? 'bg-cyan-400 text-black border-cyan-300 shadow-[0_0_10px_rgba(56,189,248,0.5)]' : 'bg-black/30 text-cyan-300 border-cyan-400/20 hover:bg-cyan-400/20 hover:text-cyan-200'}`}
                    >
                        {d}
                    </button>
                ))}
            </div>
      </div>
      <div className="flex items-center justify-center gap-4 mt-4 z-10">
        <button onClick={onBackToHub} className="px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 border-2 bg-black/30 text-cyan-300 border-cyan-400/20 hover:bg-cyan-400/20 hover:text-cyan-200">
            Back to Game Hub
        </button>
        <button onClick={onReturnToFeeds} className="px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 border-2 bg-black/30 text-cyan-300 border-cyan-400/20 hover:bg-cyan-400/20 hover:text-cyan-200">
            Back to All Feeds
        </button>
      </div>

      {(gameState === 'WON' || gameState === 'LOST') && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-black/70 backdrop-blur-lg border border-cyan-300/30 rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center text-white">
            <h2 className={`text-4xl font-bold mb-2 ${gameState === 'WON' ? 'text-cyan-300' : 'text-red-400'}`} style={{textShadow: gameState === 'WON' ? '0 0 10px #22d3ee' : '0 0 10px #f87171' }}>
              {gameState === 'WON' ? 'MISSION COMPLETE' : 'MISSION FAILED'}
            </h2>
            <p className="text-zinc-400 mt-2">Difficulty: {difficulty}</p>
            <p className="text-zinc-400">Time: {time} seconds</p>
            <button onClick={resetGame} className="mt-6 w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity shadow-lg">
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MinesweeperPage;