import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowPathIcon, FlagIcon, XIcon, VoidIcon, EntityIcon, BookOpenIcon, SparklesIcon, ExclamationTriangleIcon } from './icons';
import { saveHighScore, getHighScores, ScoreCategory } from '../services/highScoresService';
import HighScoreTable from './HighScoreTable';
import Tooltip from './Tooltip';

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
  onDefuse?: () => void;
}

const settings: Record<Difficulty, { rows: number; cols: number; mines: number }> = {
    Easy: { rows: 9, cols: 9, mines: 10 },
    Medium: { rows: 14, cols: 14, mines: 30 },
    Hard: { rows: 16, cols: 20, mines: 60 },
};

const AnomalyGraphic: React.FC = () => (
    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 bg-signal-500/10 rounded-full animate-ping" />
        <div className="absolute inset-4 bg-signal-500/20 rounded-full animate-pulse" />
        <div className="relative z-10 p-8 bg-zinc-900 rounded-[2rem] border-4 border-signal-500 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
            <EntityIcon className="w-16 h-16 text-signal-500" />
        </div>
        <div className="absolute -top-4 -left-4 text-[8px] font-mono text-signal-500 uppercase tracking-widest animate-pulse font-black italic">SCANNING_GRID...</div>
    </div>
);

const MinesweeperPage: React.FC<MinesweeperPageProps> = ({ onBackToHub, onReturnToFeeds, onDefuse }) => {
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [grid, setGrid] = useState<Grid | null>(null);
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [time, setTime] = useState(0);
  const [flagsLeft, setFlagsLeft] = useState(0);
  const [isFlagMode, setIsFlagMode] = useState(false);
  const [initials, setInitials] = useState("");
  const [showScores, setShowScores] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => { 
    setFlagsLeft(settings[difficulty].mines); 
  }, [difficulty]);

  useEffect(() => {
    if (gameState === 'IDLE') {
        const interval = setInterval(() => {
            setShowScores(prev => !prev);
        }, 5000);
        return () => clearInterval(interval);
    }
  }, [gameState]);

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
      onDefuse?.();
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

  if (gameState === 'IDLE') {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-6 overflow-y-auto scrollbar-hide">
            <style>{`
                @keyframes glitch-in {
                    0% { opacity: 0; transform: scale(0.9) skew(0deg); }
                    10% { opacity: 0.8; transform: scale(1.05) skew(5deg); filter: hue-rotate(90deg); }
                    20% { opacity: 1; transform: scale(1) skew(0deg); filter: hue-rotate(0deg); }
                }
                .animate-glitch-in { animation: glitch-in 0.4s ease-out forwards; }
            `}</style>
            
            <div className="w-full max-sm text-center bg-zinc-900 p-8 md:p-10 rounded-[3rem] border-4 border-signal-500 shadow-[0_0_50px_rgba(34,197,94,0.1)] mb-6">
                <header className="mb-8">
                    <span className="text-[10px] font-black uppercase text-signal-500 tracking-[0.3em] italic block mb-1">Hazard Intel</span>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">ANOMALY DETECTOR</h2>
                </header>
                
                <div className="flex gap-1.5 mb-8">
                    {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
                        <button key={d} onClick={() => setDifficulty(d)} className={`flex-1 py-2 rounded-xl font-black uppercase italic text-[9px] transition-all border ${difficulty === d ? 'bg-signal-600 border-signal-400 text-white shadow-lg' : 'bg-zinc-800 border-white/5 text-zinc-500'}`}>{d}</button>
                    ))}
                </div>

                <div className="h-[240px] flex items-center justify-center mb-8 overflow-hidden relative">
                    <div key={showScores ? 'scores' : 'graphic'} className="w-full animate-glitch-in">
                        {showScores ? (
                            <HighScoreTable entries={getHighScores(`minesweeper_${difficulty.toLowerCase()}` as ScoreCategory)} title={difficulty} />
                        ) : (
                            <AnomalyGraphic />
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    <button onClick={() => setGameState('PLAYING')} className="w-full py-5 bg-white text-black font-black uppercase italic rounded-2xl hover:scale-[1.02] transition-all shadow-xl active:scale-95 text-lg">Initialize Scan</button>
                    <button onClick={() => setShowHelp(true)} className="w-full py-3 bg-zinc-800 text-zinc-400 font-black uppercase italic rounded-xl border border-white/5 hover:text-white transition-all text-[10px] tracking-widest flex items-center justify-center gap-2">
                        <BookOpenIcon className="w-4 h-4" /> Tactical Manual
                    </button>
                    <button onClick={onBackToHub} className="text-zinc-500 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors pt-2 block w-full italic tracking-[0.2em]">Abort Mission</button>
                </div>
            </div>
            {showHelp && <TacticalManual onClose={() => setShowHelp(false)} />}
        </div>
    );
  }

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
            <header className="flex flex-col md:flex-row justify-between items-center bg-void-900/50 p-6 rounded-[2rem] border-2 border-white/5 backdrop-blur-xl gap-4 mt-[var(--safe-top)]">
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
                  <button onClick={() => setShowHelp(true)} className="p-3 bg-zinc-800 rounded-2xl text-zinc-400 hover:text-signal-400 transition-all border border-white/5">
                      <BookOpenIcon className="w-6 h-6" />
                  </button>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row gap-8">
                <div className="bg-void-900/40 p-4 rounded-[2.5rem] border-4 border-zinc-900 shadow-2xl relative overflow-hidden grid-crt flex-grow">
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

                <div className="flex flex-col gap-6 w-full lg:w-[300px] shrink-0">
                    <Tooltip text="Beacon Protocol: Deploy markers to suspected hazard nodes.">
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
                    </Tooltip>
                    <p className="text-[9px] text-zinc-600 uppercase font-bold text-center tracking-widest font-mono">
                        {isFlagMode ? 'Tap to mark anomalies' : 'Tap to reveal grid data'}
                    </p>
                </div>
            </div>
        </div>

        {showHelp && <TacticalManual onClose={() => setShowHelp(false)} />}

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

const TacticalManual: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-10 font-mono" onClick={onClose}>
            <div className="max-w-xl w-full bg-zinc-900 border-4 border-signal-500 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh] pt-[var(--safe-top)] pb-[var(--safe-bottom)]" onClick={e => e.stopPropagation()}>
                
                <header className="h-12 bg-signal-600 flex items-center justify-between px-1 relative z-20 border-b-2 border-black shrink-0">
                    <div className="flex items-center gap-2 h-full">
                        <div className="w-10 h-8 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center">
                           <BookOpenIcon className="w-5 h-5 text-black" />
                        </div>
                        <h2 className="text-white text-[10px] font-black uppercase tracking-[0.2em] italic px-2">HAZARD_NEUTRALIZATION.PDF</h2>
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
                                <SparklesIcon className="w-5 h-5 text-signal-500" />
                                <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Anomaly Detection</h3>
                            </div>
                            <p className="text-[10px] md:text-xs text-zinc-400 uppercase font-black leading-relaxed tracking-wider mb-4 border-l-2 border-signal-500/30 pl-4">
                                Identify and isolate signal fractures within the mainframe grid using spatial heuristics.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <ManualPoint title="0x01_Numerical_Heuristics" desc="Digits indicate the number of active mines in the surrounding 8-node proximity. Use them to triangulate threats." color="text-signal-500" />
                            <ManualPoint title="0x02_Flagging_Protocol" desc="Always deploy beacons (flags) to isolate confirmed hazards. This prevents accidental grid discharge." color="text-signal-500" />
                            <ManualPoint title="0x03_The_Choke_Point" desc="Corners and narrow corridors are high-probability mine clusters. Reveal the edges of open nodes first." color="text-signal-500" />
                            <ManualPoint title="0x04_Deterministic_Logic" desc="If a '1' is touching only one obscured node, that node is a confirmed hazard. Eliminate it from your path." color="text-signal-500" />
                        </div>

                        <div className="p-5 bg-signal-500/10 border-2 border-signal-500/30 rounded-2xl flex items-start gap-4">
                            <ExclamationTriangleIcon className="w-6 h-6 text-signal-500 shrink-0 mt-0.5 animate-pulse" />
                            <div>
                                <p className="text-[9px] font-black text-signal-500 uppercase tracking-widest mb-1 italic">Pro Tip: Logic Traps</p>
                                <p className="text-[8px] text-zinc-500 uppercase font-black leading-tight italic">
                                    Avoid guessing at all costs. 95% of grid malfunctions can be resolved with strict deductive logic.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>

                <footer className="p-4 bg-zinc-300 border-t-2 border-black shrink-0">
                    <button onClick={onClose} className="w-full py-4 bg-signal-600 border-t-2 border-l-2 border-white/50 border-b-2 border-r-2 border-signal-950 text-[10px] font-black uppercase italic text-white hover:bg-signal-500 active:bg-signal-700 transition-all shadow-lg">
                        ACKNOWLEDGE_PROTOCOLS
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

export default MinesweeperPage;