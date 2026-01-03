
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ArrowPathIcon, FlagIcon, XIcon, VoidIcon, EntityIcon, BookOpenIcon, SparklesIcon, ExclamationTriangleIcon, CpuChipIcon } from './icons';
import { saveHighScore, getHighScores, ScoreCategory } from '../services/highScoresService';
import { soundService } from '../services/soundService';
import HighScoreTable from './HighScoreTable';
import Tooltip from './Tooltip';

type Difficulty = 'Easy' | 'Medium' | 'Hard';
type GameState = 'IDLE' | 'BOOTING' | 'PLAYING' | 'WON' | 'LOST';

interface Cell {
  id: number;
  r: number;
  c: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

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

const CircuitBackground: React.FC = () => (
    <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
        <svg width="100%" height="100%" className="absolute inset-0">
            <defs>
                <pattern id="circuit-grid" width="100" height="100" patternUnits="userSpaceOnUse">
                    <path d="M 10 10 L 90 10 M 10 10 L 10 90" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-signal-500/20" />
                    <circle cx="10" cy="10" r="2" fill="currentColor" className="text-signal-500/40" />
                    <path d="M 10 10 L 30 30 L 70 30 L 90 50" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-signal-500/10" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#circuit-grid)" />
        </svg>
    </div>
);

const AnomalyGraphic: React.FC = () => (
    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 bg-signal-500/10 rounded-full animate-ping" />
        <div className="absolute inset-4 bg-signal-500/20 rounded-full animate-pulse" />
        <div className="relative z-10 p-8 bg-zinc-900 rounded-[2rem] border-4 border-signal-500 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
            <EntityIcon className="w-16 h-16 text-signal-500" />
        </div>
        <div className="absolute -top-4 -left-4 text-[8px] font-mono text-signal-500 uppercase tracking-widest animate-pulse font-black italic">ANOMALY_PROBE_v4.2</div>
    </div>
);

const MinesweeperPage: React.FC<MinesweeperPageProps> = ({ onBackToHub, onReturnToFeeds, onDefuse }) => {
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [grid, setGrid] = useState<Cell[]>([]);
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [time, setTime] = useState(0);
  const [flagsLeft, setFlagsLeft] = useState(0);
  const [isFlagMode, setIsFlagMode] = useState(false);
  const [initials, setInitials] = useState("");
  const [showScores, setShowScores] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [bootLog, setBootLog] = useState<string[]>([]);
  const timerRef = useRef<number | null>(null);

  const currentSettings = useMemo(() => settings[difficulty], [difficulty]);
  const getIdx = useCallback((r: number, c: number, cols: number) => r * cols + c, []);

  const createBaseGrid = useCallback(() => {
    const { rows, cols } = currentSettings;
    return Array.from({ length: rows * cols }, (_, i) => ({
      id: i,
      r: Math.floor(i / cols),
      c: i % cols,
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacentMines: 0
    }));
  }, [currentSettings]);

  const reset = useCallback(() => {
    setGameState('IDLE');
    setGrid([]); 
    setTime(0);
    setInitials("");
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setFlagsLeft(settings[difficulty].mines);
    setIsFlagMode(false);
  }, [difficulty]);

  useEffect(() => { reset(); }, [difficulty, reset]);

  useEffect(() => {
    if (gameState === 'IDLE') {
        const interval = setInterval(() => setShowScores(prev => !prev), 5000);
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

  const handleInitReboot = async () => {
    soundService.playAction();
    setGameState('BOOTING');
    const codes = [
        "> chmod +x ./anomaly_purge.sh",
        "> export LOGIC_RAILS=0x4F2A",
        "> for i in grid: map_nodes(i)",
        "> set_voltage --sector=ALL --v=3.3",
        "> init_mine_array(count=" + settings[difficulty].mines + ")",
        "> SYSTEM_READY: AWAITING_PROBE"
    ];
    for(let i=0; i<codes.length; i++) {
        setBootLog(prev => [...prev, codes[i]]);
        soundService.playPop();
        await new Promise(r => setTimeout(r, 350));
    }
    setGrid(createBaseGrid());
    setGameState('PLAYING');
  };

  const plantMines = (startR: number, startC: number, freshGrid: Cell[]) => {
    const { rows, cols, mines } = currentSettings;
    const newGrid = freshGrid.map(c => ({ ...c }));
    let minesPlaced = 0;
    while (minesPlaced < mines) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      const idx = getIdx(r, c, cols);
      const isSafeZone = Math.abs(r - startR) <= 1 && Math.abs(c - startC) <= 1;
      if (!newGrid[idx].isMine && !isSafeZone) {
        newGrid[idx].isMine = true;
        minesPlaced++;
      }
    }
    for (let i = 0; i < newGrid.length; i++) {
      if (newGrid[i].isMine) continue;
      let count = 0;
      const { r, c } = newGrid[i];
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            if (newGrid[getIdx(nr, nc, cols)].isMine) count++;
          }
        }
      }
      newGrid[i].adjacentMines = count;
    }
    return newGrid;
  };

  const revealCells = (startIdx: number, currentGrid: Cell[]) => {
    const { rows, cols } = currentSettings;
    const nextGrid = currentGrid.map(cell => ({ ...cell }));
    const stack = [startIdx];
    const visited = new Set<number>();
    while (stack.length > 0) {
      const idx = stack.pop()!;
      if (visited.has(idx)) continue;
      visited.add(idx);
      const cell = nextGrid[idx];
      if (cell.isFlagged) continue;
      cell.isRevealed = true;
      if (cell.isMine) continue;
      if (cell.adjacentMines === 0) {
        const { r, c } = cell;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
              const nIdx = getIdx(nr, nc, cols);
              if (!nextGrid[nIdx].isRevealed && !nextGrid[nIdx].isFlagged) stack.push(nIdx);
            }
          }
        }
      }
    }
    return nextGrid;
  };

  const checkWin = (currentGrid: Cell[]) => {
    if (currentGrid.length === 0) return false;
    return currentGrid.every(c => c.isMine || c.isRevealed);
  };

  const handleCellClick = (r: number, c: number) => {
    if (gameState !== 'PLAYING') return;
    const idx = getIdx(r, c, currentSettings.cols);
    const isFirstReveal = !grid.some(c => c.isMine);

    if (isFirstReveal && !isFlagMode) {
      soundService.playAction();
      const mined = plantMines(r, c, grid);
      const revealed = revealCells(idx, mined);
      setGrid(revealed);
      startTimer();
      if (checkWin(revealed)) { soundService.playWin(); stopTimer(); setGameState('WON'); onDefuse?.(); }
      return;
    }

    if (isFlagMode) { toggleFlag(idx); return; }
    const cell = grid[idx];
    if (cell.isRevealed || cell.isFlagged) return;

    if (cell.isMine) {
      soundService.playLoss();
      stopTimer();
      setGameState('LOST');
      setGrid(prev => prev.map(b => b.isMine ? { ...b, isRevealed: true } : b));
      return;
    }

    soundService.playPop();
    const next = revealCells(idx, grid);
    setGrid(next);
    if (checkWin(next)) { soundService.playWin(); stopTimer(); setGameState('WON'); onDefuse?.(); }
  };

  const toggleFlag = (idx: number) => {
    if (gameState !== 'PLAYING') return;
    soundService.playPop();
    setGrid(prev => {
        const next = [...prev];
        const cell = next[idx];
        if (cell.isRevealed) return prev;
        const newState = !cell.isFlagged;
        next[idx] = { ...cell, isFlagged: newState };
        setFlagsLeft(f => newState ? f - 1 : f + 1);
        return next;
    });
  };

  const handleSaveScore = () => {
    soundService.playClick();
    const cat = `minesweeper_${difficulty.toLowerCase()}` as ScoreCategory;
    saveHighScore(cat, { name: initials.toUpperCase() || "???", score: time, displayValue: `${time}s`, date: new Date().toISOString() }, true);
    reset();
  };

  const integrityProgress = useMemo(() => {
    if (gameState !== 'PLAYING' || grid.length === 0) return 0;
    const totalSafe = currentSettings.rows * currentSettings.cols - currentSettings.mines;
    const revealedSafe = grid.filter(c => c.isRevealed && !c.isMine).length;
    return Math.floor((revealedSafe / totalSafe) * 100);
  }, [grid, gameState, currentSettings]);

  return (
    <div className="w-full h-full bg-void-950 flex flex-col items-center p-4 overflow-y-auto scrollbar-hide relative">
        <CircuitBackground />
        
        <style>{`
            .grid-crt::before {
                content: " "; display: block; position: absolute; top: 0; left: 0; bottom: 0; right: 0;
                background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%), 
                            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34, 197, 94, 0.05) 2px, rgba(34, 197, 94, 0.05) 4px);
                z-index: 10; pointer-events: none;
            }
            .digit-1 { color: #3b82f6; } .digit-2 { color: #10b981; } .digit-3 { color: #ef4444; }
            .digit-4 { color: #818cf8; } .digit-5 { color: #f59e0b; } .digit-6 { color: #06b6d4; }
            .digit-7 { color: #ec4899; } .digit-8 { color: #ffffff; }
            
            @keyframes circuit-glitch {
                0% { opacity: 1; transform: scale(1); filter: hue-rotate(0deg); }
                10% { opacity: 0.8; transform: scale(1.02) translate(1px, -1px); filter: hue-rotate(90deg); }
                20% { opacity: 1; transform: scale(1); }
                100% { opacity: 1; transform: scale(1); }
            }
            .mine-detonated { animation: circuit-glitch 0.2s infinite; background: #e11d48 !important; box-shadow: 0 0 20px #ef4444; z-index: 20; }
            
            @keyframes current-flow {
                0% { border-color: #22c55e; box-shadow: 0 0 0px #22c55e; }
                50% { border-color: #4ade80; box-shadow: 0 0 15px #22c55e; }
                100% { border-color: #22c55e; box-shadow: 0 0 0px #22c55e; }
            }
            .animate-reveal { animation: current-flow 0.5s ease-out; }
            
            .node-standby::after {
                content: ""; position: absolute; top: 4px; right: 4px; width: 3px; height: 3px;
                border-radius: 50%; background: #22c55e; box-shadow: 0 0 5px #22c55e; opacity: 0.6;
            }
        `}</style>

        {gameState === 'IDLE' ? (
            <div className="w-full h-full flex flex-col items-center justify-center animate-fade-in relative z-10">
                <div className="w-full max-sm text-center bg-zinc-900 p-8 md:p-10 rounded-[3rem] border-4 border-signal-500 shadow-[0_0_50px_rgba(34,197,94,0.1)] mb-6">
                    <header className="mb-8">
                        <span className="text-[10px] font-black uppercase text-signal-500 tracking-[0.3em] italic block mb-1">Sector Diagnostic</span>
                        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">ANOMALY DETECTOR</h2>
                    </header>
                    <div className="flex gap-1.5 mb-8">
                        {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
                            <button key={d} onClick={() => { soundService.playClick(); setDifficulty(d); }} className={`flex-1 py-2 rounded-xl font-black uppercase italic text-[9px] transition-all border ${difficulty === d ? 'bg-signal-600 border-signal-400 text-white shadow-lg' : 'bg-zinc-800 border-white/5 text-zinc-500'}`}>{d}</button>
                        ))}
                    </div>
                    <div className="h-[240px] flex items-center justify-center mb-8 overflow-hidden relative">
                        <div key={showScores ? 'scores' : 'graphic'} className="w-full animate-fade-in">
                            {showScores ? <HighScoreTable entries={getHighScores(`minesweeper_${difficulty.toLowerCase()}` as ScoreCategory)} title={difficulty} /> : <AnomalyGraphic />}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <button onClick={handleInitReboot} className="w-full py-5 bg-white text-black font-black uppercase italic rounded-2xl hover:scale-[1.02] transition-all shadow-xl active:scale-95 text-lg">MOUNT PURGE_TOOL</button>
                        <button onClick={() => { soundService.playClick(); setShowHelp(true); }} className="w-full py-3 bg-zinc-800 text-zinc-400 font-black uppercase italic rounded-xl border border-white/5 hover:text-white transition-all text-[10px] tracking-widest flex items-center justify-center gap-2"><BookOpenIcon className="w-4 h-4" /> Operational Lore</button>
                        <button onClick={onBackToHub} className="text-zinc-500 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors pt-2 block w-full italic tracking-[0.2em]">Abort Session</button>
                    </div>
                </div>
            </div>
        ) : gameState === 'BOOTING' ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-black/90 p-8 text-left font-mono relative z-20">
                <div className="max-w-md w-full">
                    <div className="mb-8 flex items-center gap-4">
                        <CpuChipIcon className="w-10 h-10 text-signal-500 animate-pulse" />
                        <span className="text-xl font-black text-white italic">REBOOT_CORE...</span>
                    </div>
                    <div className="space-y-2 border-l-2 border-signal-500/30 pl-4 py-2 bg-zinc-950/50">
                        {bootLog.map((log, i) => (
                            <p key={i} className="text-[10px] md:text-xs text-signal-500 font-black uppercase tracking-widest animate-fade-in">{log}</p>
                        ))}
                    </div>
                    <div className="mt-12 h-1 w-full bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-white/5">
                        <div className="h-full bg-signal-500 animate-pulse" style={{ width: `${(bootLog.length / 6) * 100}%` }} />
                    </div>
                </div>
            </div>
        ) : (
            <div className="max-w-4xl w-full flex flex-col gap-6 animate-fade-in pb-20 relative z-10">
                <header className="flex flex-col md:flex-row justify-between items-center bg-void-900/80 p-6 rounded-[2rem] border-2 border-white/5 backdrop-blur-xl gap-4 mt-[var(--safe-top)]">
                    <div className="flex items-center gap-4">
                        <button onClick={onBackToHub} className="p-3 bg-zinc-900 rounded-2xl text-zinc-400 hover:text-white transition-all active:scale-95 shadow-lg border border-white/5"><XIcon className="w-6 h-6" /></button>
                        <div><span className="text-[9px] font-black uppercase text-signal-500 tracking-[0.4em] block mb-1 italic">Mainframe Maintenance</span><h2 className="text-xl md:text-2xl font-black italic uppercase text-white tracking-tighter leading-none">ANOMALY PURGE</h2></div>
                    </div>
                    <div className="flex items-center gap-6">
                       <div className="bg-black/60 px-5 py-2.5 rounded-2xl border border-signal-500/20 shadow-inner flex flex-col items-center min-w-[80px]"><span className="text-[8px] font-black text-signal-500 uppercase block mb-0.5 tracking-widest">Uptime</span><span className="text-xl font-black italic font-mono text-white leading-none">{String(time).padStart(3, '0')}</span></div>
                       <div className="bg-black/60 px-5 py-2.5 rounded-2xl border border-pulse-500/20 shadow-inner flex flex-col items-center min-w-[80px]"><span className="text-[8px] font-black text-pulse-500 uppercase block mb-0.5 tracking-widest">Shorts</span><span className="text-xl font-black italic font-mono text-white leading-none">{String(Math.max(0, flagsLeft)).padStart(2, '0')}</span></div>
                       <button onClick={() => { soundService.playClick(); setShowHelp(true); }} className="p-3 bg-zinc-800 rounded-2xl text-zinc-400 hover:text-signal-400 transition-all border border-white/5"><BookOpenIcon className="w-6 h-6" /></button>
                    </div>
                </header>

                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="bg-void-900/60 p-5 rounded-[2.5rem] border-4 border-zinc-900 shadow-2xl relative overflow-hidden grid-crt flex-grow">
                        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${currentSettings.cols}, 1fr)` }}>
                          {grid.map((cell, idx) => (
                                <div 
                                    key={cell.id}
                                    onClick={() => handleCellClick(cell.r, cell.c)} 
                                    onContextMenu={(e) => { e.preventDefault(); toggleFlag(idx); }}
                                    className={`aspect-square flex items-center justify-center text-xs md:text-xl font-black rounded-lg transition-all cursor-pointer relative select-none
                                        ${cell.isRevealed 
                                            ? (cell.isMine ? 'mine-detonated' : 'bg-black/60 ring-1 ring-white/5 animate-reveal border border-white/10') 
                                            : 'bg-zinc-800 hover:bg-zinc-700 shadow-[inset_0_4px_4px_rgba(255,255,255,0.05),0_4px_8px_rgba(0,0,0,0.5)] border border-zinc-900 hover:scale-[1.03] active:scale-95 node-standby'
                                        } 
                                        ${cell.isFlagged && !cell.isRevealed ? 'bg-signal-500/20' : ''}`}
                                >
                                    {cell.isRevealed ? (
                                        cell.isMine ? <div className="text-white drop-shadow-[0_0_10px_white] scale-150">☢️</div> : (cell.adjacentMines > 0 && <span className={`digit-${cell.adjacentMines} drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] font-black italic`}>{cell.adjacentMines}</span>)
                                    ) : (cell.isFlagged && <div className="text-pulse-500 drop-shadow-[0_0_12px_#e11d48] animate-pulse scale-110">⚑</div>)}
                                    <div className="absolute -top-1 -left-1 w-1 h-1 bg-zinc-600 rounded-full opacity-30" />
                                    <div className="absolute -top-1 -right-1 w-1 h-1 bg-zinc-600 rounded-full opacity-30" />
                                    <div className="absolute -bottom-1 -left-1 w-1 h-1 bg-zinc-600 rounded-full opacity-30" />
                                    <div className="absolute -bottom-1 -right-1 w-1 h-1 bg-zinc-600 rounded-full opacity-30" />
                                </div>
                          ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-6 w-full lg:w-[300px] shrink-0">
                        <div className="bg-black/60 p-6 rounded-[2rem] border border-white/5 space-y-4 shadow-xl">
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest italic">Node Sync</span>
                                <span className="text-[10px] font-black text-signal-500 font-mono">{integrityProgress}%</span>
                            </div>
                            <div className="w-full h-2.5 bg-black border border-white/5 rounded-full overflow-hidden p-0.5">
                                <div className="h-full bg-signal-500 transition-all duration-700 shadow-[0_0_10px_#22c55e]" style={{ width: `${integrityProgress}%` }} />
                            </div>
                        </div>

                        <button 
                            onClick={() => { soundService.playAction(); setIsFlagMode(!isFlagMode); }} 
                            className={`w-full py-6 rounded-[2rem] font-black uppercase text-xs italic tracking-widest border-2 transition-all shadow-xl group ${isFlagMode ? 'bg-pulse-600 border-pulse-400 text-white shadow-[0_0_30px_rgba(225,29,72,0.4)]' : 'bg-void-900 border-white/10 text-zinc-500 hover:text-white'}`}
                        >
                            <span className="flex items-center justify-center gap-3"><FlagIcon className={`w-5 h-5 ${isFlagMode ? 'animate-bounce' : ''}`} /> {isFlagMode ? 'PLACING BEACONS' : 'ANALYSIS MODE'}</span>
                        </button>
                        
                        <p className="text-[9px] text-zinc-600 uppercase font-black text-center tracking-[0.2em] font-mono italic px-4">
                            {isFlagMode ? 'Deploy beacon to shorted node' : 'Probe logic gate for potential signal'}
                        </p>
                        
                        <button onClick={() => { soundService.playClick(); reset(); }} className="mt-auto w-full py-4 bg-zinc-900 border border-white/5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"><ArrowPathIcon className="w-4 h-4" /> Sys_Reboot</button>
                    </div>
                </div>
            </div>
        )}

        {showHelp && <TacticalManual onClose={() => { soundService.playClick(); setShowHelp(false); }} />}

        {gameState === 'WON' && (
            <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-center animate-fade-in">
                <div className="max-w-sm w-full bg-void-900 p-10 rounded-[3.5rem] border-4 border-signal-500 shadow-[0_0_100px_rgba(34,197,94,0.3)]">
                    <div className="mb-6 mx-auto w-24 h-24 bg-signal-500/10 rounded-full flex items-center justify-center border border-signal-500/30"><VoidIcon className="w-14 h-14 text-signal-500 animate-pulse" /></div>
                    <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-4 text-signal-500 leading-none">SECTOR CLEAN</h2>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-[9px] mb-8 italic px-4 leading-relaxed">Hardware anomalies purged.<br/>Mainframe voltage normalized.</p>
                    <div className="mb-10">
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-4 italic">Operator Token</p>
                        <input autoFocus maxLength={3} value={initials} onChange={e => setInitials(e.target.value.toUpperCase())} className="bg-black/50 border-2 border-signal-500 text-white rounded-xl px-4 py-4 text-center text-3xl font-black w-36 outline-none uppercase italic shadow-2xl" placeholder="???" />
                    </div>
                    <button onClick={handleSaveScore} className="w-full py-6 bg-signal-600 text-black font-black text-xl italic uppercase rounded-full hover:scale-105 transition-all shadow-xl">LOG_MAINTENANCE</button>
                </div>
            </div>
        )}

        {gameState === 'LOST' && (
            <div className="fixed inset-0 bg-black/98 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-center animate-fade-in">
                <div className="max-w-sm w-full bg-void-900 p-12 rounded-[3.5rem] border-4 border-pulse-500 shadow-[0_0_120px_rgba(225,29,72,0.23)] relative overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none opacity-10 static-noise" />
                    <div className="mb-6 mx-auto w-24 h-24 bg-pulse-500/10 rounded-full flex items-center justify-center border border-pulse-500/30"><div className="text-5xl animate-ping">☢️</div></div>
                    <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-6 text-pulse-500 leading-none">TRACE BURNOUT</h2>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-12 leading-relaxed italic px-2">Anomalies triggered terminal short.<br/>Mainframe logic sequence fragmented.</p>
                    <button onClick={() => { soundService.playClick(); reset(); }} className="w-full py-6 bg-pulse-600 text-white font-black text-xl italic uppercase rounded-full hover:scale-105 transition-all shadow-xl active:scale-95">FORCED_REBOOT</button>
                </div>
            </div>
        )}
    </div>
  );
};

const TacticalManual: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-10 font-mono" onClick={onClose}>
        <div className="max-w-xl w-full bg-zinc-900 border-4 border-signal-500 rounded-[2.5rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <header className="h-12 bg-signal-600 flex items-center justify-between px-1 relative z-20 border-b-2 border-black shrink-0">
                <div className="flex items-center gap-2 h-full"><div className="w-10 h-8 bg-zinc-300 border-2 border-white flex items-center justify-center"><BookOpenIcon className="w-5 h-5 text-black" /></div><h2 className="text-white text-[10px] font-black uppercase tracking-[0.2em] italic px-2">MAINTENANCE_LOG_0xVOID.PDF</h2></div>
                <button onClick={onClose} className="w-10 h-8 bg-zinc-300 border-2 border-white flex items-center justify-center active:bg-zinc-400 transition-colors"><XIcon className="w-5 h-5 text-black" /></button>
            </header>
            <div className="p-6 md:p-10 overflow-y-auto flex-grow bg-void-950/40 relative">
                <div className="absolute inset-0 pointer-events-none opacity-5 cctv-overlay" />
                <section className="space-y-8 relative z-10">
                    <div>
                        <h3 className="text-lg font-black text-white italic uppercase tracking-tighter mb-4 flex items-center gap-3"><SparklesIcon className="w-5 h-5 text-signal-500" /> Maintenance Protocol</h3>
                        <p className="text-[10px] md:text-xs text-zinc-400 uppercase font-black leading-relaxed tracking-wider mb-4 border-l-2 border-signal-500/30 pl-4">The VOID core is infested with silicon anomalies. As an Operator, you must isolate hardware shorts (mines) before they cascade.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                        <ManualPoint title="0x01_Proximity_Telemetry" desc="Digits indicate the number of active anomalies in the surrounding 8-node logic gates. Use them to triangulate shorts." color="text-signal-500" />
                        <ManualPoint title="0x02_Beacon_Uplink" desc="Deploy Beacons (flags) to lock hazardous nodes. This prevents accidental circuit discharge and signals the antiviral purge." color="text-signal-500" />
                        <ManualPoint title="0x03_The_Zero_Trap" desc="Anomalies often cluster. Revealing a safe node with 0 proximity data indicates a massive logic clearance—use this momentum." color="text-signal-500" />
                    </div>
                    <div className="p-5 bg-signal-500/10 border-2 border-signal-500/30 rounded-2xl flex items-start gap-4">
                        <ExclamationTriangleIcon className="w-6 h-6 text-signal-500 shrink-0 mt-0.5 animate-pulse" />
                        <div><p className="text-[9px] font-black text-signal-500 uppercase tracking-widest mb-1 italic">Pro Tip: Hardware Fatigue</p><p className="text-[8px] text-zinc-500 uppercase font-black leading-tight italic">Do not guess. A single logic fault triggers a trace burnout. Trust the numerical heuristics or deploy a Logic Probe from the Black Market.</p></div>
                    </div>
                </section>
            </div>
            <footer className="p-4 bg-zinc-300 border-t-2 border-black shrink-0"><button onClick={onClose} className="w-full py-4 bg-signal-600 text-white text-[10px] font-black uppercase italic shadow-lg active:bg-signal-700">ACKNOWLEDGE_PROTOCOLS</button></footer>
        </div>
    </div>
);

const ManualPoint: React.FC<{ title: string; desc: string; color: string }> = ({ title, desc, color }) => (
    <div className="space-y-2 group">
        <h4 className={`text-[9px] font-black ${color} uppercase tracking-[0.3em] italic flex items-center gap-2`}><span className={`w-1.5 h-1.5 rounded-full ${color.replace('text-', 'bg-')} group-hover:scale-150 transition-transform`}></span>{title}</h4>
        <p className="text-[10px] md:text-xs text-zinc-300 font-bold uppercase tracking-wide leading-relaxed pl-3 border-l border-zinc-800">{desc}</p>
    </div>
);

export default MinesweeperPage;
