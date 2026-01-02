import React, { useRef, useEffect, useState, useCallback } from 'react';
import { startGame, PieceType } from '../services/tetrisGame';
import { saveHighScore, getHighScores } from '../services/highScoresService';
import HighScoreTable from './HighScoreTable';
import { XIcon, ArrowPathIcon, ControllerIcon, VoidIcon, BookOpenIcon, SparklesIcon, ExclamationTriangleIcon } from './icons';

interface TetrisPageProps {
  onBackToHub: () => void;
  onReturnToFeeds: () => void;
}

const TetrisGraphic: React.FC = () => (
    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 bg-pulse-500/10 rounded-full animate-ping" />
        <div className="absolute inset-4 bg-pulse-500/20 rounded-full animate-pulse" />
        <div className="relative z-10 p-8 bg-zinc-900 rounded-[2rem] border-4 border-pulse-500 shadow-[0_0_30px_rgba(225,29,72,0.4)]">
            <ControllerIcon className="w-16 h-16 text-pulse-500" />
        </div>
        <div className="absolute -top-4 -left-4 text-[8px] font-mono text-pulse-500 uppercase tracking-widest animate-pulse font-black italic">COMPILING_BLOCKS...</div>
    </div>
);

const TetrisPage: React.FC<TetrisPageProps> = ({ onBackToHub, onReturnToFeeds }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const previewRef = useRef<HTMLCanvasElement>(null);
    const holdRef = useRef<HTMLCanvasElement>(null);
    const gameInstance = useRef<ReturnType<typeof startGame> | null>(null);

    const [view, setView] = useState<'IDLE' | 'COUNTDOWN' | 'PLAYING'>('IDLE');
    const [countdown, setCountdown] = useState(3);
    const [stats, setStats] = useState({ score: 0, rows: 0, level: 0 });
    const [isGameOver, setIsGameOver] = useState(false);
    const [initials, setInitials] = useState("");
    const [holdPiece, setHoldPiece] = useState<PieceType | null>(null);
    const [nextQueue, setNextQueue] = useState<PieceType[]>([]);
    const [showScores, setShowScores] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    useEffect(() => {
        if (view === 'IDLE') {
            const interval = setInterval(() => {
                setShowScores(prev => !prev);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [view]);

    const drawPieces = useCallback((canvas: HTMLCanvasElement, pieces: PieceType[] | (PieceType | null)[]) => {
        if (!gameInstance.current) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pieces.forEach((piece, i) => { if (piece) gameInstance.current?.drawPieceOn(ctx, piece, 0, i * 4); });
    }, []);

    useEffect(() => {
        if (holdRef.current) drawPieces(holdRef.current, [holdPiece]);
    }, [holdPiece, drawPieces]);

    useEffect(() => {
        if (previewRef.current && nextQueue.length > 0) drawPieces(previewRef.current, nextQueue);
    }, [nextQueue, drawPieces]);

    const handleRestart = useCallback(() => {
        gameInstance.current?.stop();
        setIsGameOver(false);
        setInitials("");
        setView('COUNTDOWN');
        setCountdown(3);
    }, []);

    useEffect(() => {
        if (view === 'COUNTDOWN' && countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (view === 'COUNTDOWN' && countdown === 0) {
            setView('PLAYING');
            setTimeout(() => {
                if (canvasRef.current && previewRef.current && holdRef.current) {
                    gameInstance.current = startGame({
                        canvas: canvasRef.current, previewCanvas: previewRef.current, holdCanvas: holdRef.current,
                        onScoreUpdate: (score) => setStats(s => ({ ...s, score })),
                        onRowsUpdate: (rows) => setStats(s => ({ ...s, rows })),
                        onLevelUpdate: (level) => setStats(s => ({ ...s, level: Math.floor(level) })),
                        onGameOver: () => setIsGameOver(true),
                        onHoldUpdate: (piece) => setHoldPiece(piece),
                        onNextUpdate: (queue) => setNextQueue(queue),
                    });
                }
            }, 50);
        }
    }, [view, countdown]);

    const handleSaveScore = () => {
        saveHighScore('tetris', {
            name: initials.toUpperCase() || "???",
            score: stats.score,
            displayValue: stats.score.toLocaleString(),
            date: new Date().toISOString()
        });
        setView('IDLE');
    };

    useEffect(() => {
        return () => gameInstance.current?.stop();
    }, []);

    const handleAction = (action: string) => {
        const controls = gameInstance.current;
        if (!controls || isGameOver) return;
        
        switch(action) {
            case 'left': controls.moveLeft(); break;
            case 'right': controls.moveRight(); break;
            case 'rotate': controls.rotate(); break;
            case 'drop': controls.hardDrop(); break;
            case 'hold': controls.hold(); break;
            case 'start': handleRestart(); break;
            case 'quit': onBackToHub(); break;
        }
    };

    if (view === 'IDLE') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-6 overflow-y-auto scrollbar-hide font-mono">
                <style>{`
                    @keyframes glitch-in {
                        0% { opacity: 0; transform: scale(0.9) skew(0deg); }
                        10% { opacity: 0.8; transform: scale(1.05) skew(5deg); filter: hue-rotate(90deg); }
                        20% { opacity: 1; transform: scale(1) skew(0deg); filter: hue-rotate(0deg); }
                    }
                    .animate-glitch-in { animation: glitch-in 0.4s ease-out forwards; }
                `}</style>
                
                <div className="w-full max-w-sm text-center bg-zinc-900 p-10 rounded-[3rem] border-4 border-pulse-500 shadow-[0_0_50px_rgba(225,29,72,0.1)] mb-6">
                    <header className="mb-8">
                        <span className="text-[10px] font-black uppercase text-pulse-500 tracking-[0.3em] italic block mb-1">Packet Compilation</span>
                        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">STACK TRACE</h2>
                    </header>

                    <div className="h-[240px] flex items-center justify-center mb-8 overflow-hidden relative">
                        <div key={showScores ? 'scores' : 'graphic'} className="w-full animate-glitch-in">
                            {showScores ? (
                                <HighScoreTable entries={getHighScores('tetris')} title="TRACE" />
                            ) : (
                                <TetrisGraphic />
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <button onClick={handleRestart} className="w-full py-5 bg-white text-black font-black uppercase italic rounded-2xl hover:scale-[1.02] transition-all shadow-xl active:scale-95 text-lg">Compile Nodes</button>
                        <button onClick={() => setShowHelp(true)} className="w-full py-3 bg-zinc-800 text-zinc-400 font-black uppercase italic rounded-xl border border-white/5 hover:text-white transition-all active:scale-95 text-[10px] tracking-widest flex items-center justify-center gap-2">
                            <BookOpenIcon className="w-4 h-4" /> Tactical Manual
                        </button>
                        <button onClick={onBackToHub} className="text-zinc-500 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors pt-2 block w-full italic tracking-[0.2em]">Abort Sync</button>
                    </div>
                </div>
                {showHelp && <TacticalManual onClose={() => setShowHelp(false)} />}
            </div>
        );
    }

    if (view === 'COUNTDOWN') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 font-mono">
                <div className="p-8 bg-pulse-500/10 border-4 border-pulse-500 rounded-[3rem] mb-12 shadow-[0_0_80px_rgba(225,29,72,0.3)] animate-pulse">
                    <VoidIcon className="w-20 h-20 text-white" />
                </div>
                <h2 className="text-3xl font-black text-white italic uppercase tracking-[0.4em] mb-4">BUFFERING_NODES</h2>
                <div className="text-[clamp(8rem,30vw,15rem)] font-black text-white italic animate-ping">
                    {countdown}
                </div>
            </div>
        );
    }

    return (
        <main className="w-full h-full flex flex-col bg-zinc-950 text-white font-mono overflow-hidden relative">
            <header className="flex justify-between items-center px-4 py-4 z-10 flex-shrink-0 bg-zinc-900 border-b-2 border-zinc-800 mt-[var(--safe-top)]">
                <div>
                    <h1 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-pulse-500 leading-none">STACK TRACE</h1>
                    <div className="flex items-center gap-2 mt-1.5">
                         <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_5px_red]" />
                         <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500 italic">LIVE_DECODE</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setShowHelp(true)} className="p-2.5 bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors border border-white/5"><BookOpenIcon className="w-5 h-5" /></button>
                    <div className="bg-black/60 px-5 py-2 rounded-xl border-2 border-zinc-800 shadow-inner min-w-[120px] text-right">
                        <span className="text-[7px] font-black uppercase text-zinc-600 block mb-0.5 tracking-widest">SIG_VAL</span>
                        <span className="text-base md:text-lg font-black italic text-yellow-400 font-mono leading-none">{stats.score.toLocaleString()}</span>
                    </div>
                </div>
            </header>

            <div className="flex-grow flex items-center justify-center p-4 min-h-0">
                <div className="grid grid-cols-[80px,1fr,80px] gap-4 h-full max-h-[75vh] w-full max-w-xl">
                    {/* HOLD COLUMN */}
                    <div className="flex flex-col gap-4 justify-start pt-8">
                        <div className="bg-zinc-900/90 p-2 rounded-[1.5rem] border-2 border-zinc-800 shadow-2xl relative">
                            <p className="text-[8px] font-black uppercase text-zinc-500 mb-2 text-center italic tracking-widest">BUF_01</p>
                            <div className="aspect-square bg-black rounded-xl border border-white/5 flex items-center justify-center overflow-hidden">
                                <canvas ref={holdRef} className="w-12 h-12 opacity-90" />
                            </div>
                        </div>
                        <div className="bg-zinc-900/90 p-3 rounded-[1.5rem] border-2 border-zinc-800 shadow-2xl text-center">
                            <p className="text-[8px] font-black uppercase text-zinc-500 mb-1 italic">SECTOR</p>
                            <span className="text-xl font-black text-emerald-500 italic">0{stats.level}</span>
                        </div>
                    </div>

                    {/* MAIN FIELD */}
                    <div className="relative h-full border-4 border-zinc-800 bg-black rounded-[2rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)] flex-grow">
                        <div className="absolute inset-0 pointer-events-none opacity-[0.05] cctv-overlay z-20" />
                        <canvas ref={canvasRef} className="w-full h-full relative z-10" />
                    </div>

                    {/* NEXT COLUMN */}
                    <div className="flex flex-col gap-4 justify-start pt-8">
                        <div className="bg-zinc-900/90 p-2 rounded-[1.5rem] border-2 border-zinc-800 shadow-2xl relative">
                            <p className="text-[8px] font-black uppercase text-zinc-500 mb-2 text-center italic tracking-widest">DATA_IN</p>
                            <div className="bg-black rounded-xl border border-white/5 flex items-center justify-center py-4 overflow-hidden">
                                <canvas ref={previewRef} className="w-12 h-32 opacity-90" />
                            </div>
                        </div>
                        <div className="bg-zinc-900/90 p-3 rounded-[1.5rem] border-2 border-zinc-800 shadow-2xl text-center">
                            <p className="text-[8px] font-black uppercase text-zinc-500 mb-1 italic">ROWS</p>
                            <span className="text-xl font-black text-white italic">{stats.rows}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="bg-zinc-900 border-t-4 border-black p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex-shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                <div className="max-w-md mx-auto grid grid-cols-4 gap-4 relative z-10">
                    <div className="col-span-2 flex gap-4">
                        <button onPointerDown={() => handleAction('left')} className="flex-1 h-20 bg-zinc-800 border-t-2 border-l-2 border-white/10 border-b-4 border-r-4 border-black rounded-2xl flex items-center justify-center active:translate-y-1 active:border-b-0 transition-all text-zinc-400 hover:text-white">
                            <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M14 7l-5 5 5 5V7z"/></svg>
                        </button>
                        <button onPointerDown={() => handleAction('right')} className="flex-1 h-20 bg-zinc-800 border-t-2 border-l-2 border-white/10 border-b-4 border-r-4 border-black rounded-2xl flex items-center justify-center active:translate-y-1 active:border-b-0 transition-all text-zinc-400 hover:text-white">
                            <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M10 17l5-5-5-5v10z"/></svg>
                        </button>
                    </div>
                    <button onPointerDown={() => handleAction('rotate')} className="h-20 bg-pulse-600 border-t-2 border-l-2 border-white/20 border-b-4 border-r-4 border-pulse-950 rounded-2xl flex flex-col items-center justify-center active:translate-y-1 active:border-b-0 transition-all group">
                        <span className="text-[7px] font-black uppercase leading-none mb-1 text-white/50 group-active:text-white">Spin_B</span>
                        <span className="text-2xl font-black italic text-white">⟳</span>
                    </button>
                    <button onPointerDown={() => handleAction('drop')} className="h-20 bg-pulse-600 border-t-2 border-l-2 border-white/20 border-b-4 border-r-4 border-pulse-950 rounded-2xl flex flex-col items-center justify-center active:translate-y-1 active:border-b-0 transition-all group">
                        <span className="text-[7px] font-black uppercase leading-none mb-1 text-white/50 group-active:text-white">Drop_A</span>
                        <span className="text-2xl font-black italic text-white">▼</span>
                    </button>
                    <div className="col-span-4 flex gap-4 pt-4">
                        <button onClick={() => handleAction('hold')} className="flex-1 py-4 bg-zinc-800 border-2 border-zinc-700 rounded-xl text-[9px] font-black uppercase italic text-zinc-400 hover:text-white transition-all active:scale-95 shadow-xl">SWAP_BUFFER</button>
                        <button onClick={() => setView('IDLE')} className="flex-1 py-4 bg-red-950/20 border-2 border-red-900/30 rounded-xl text-[9px] font-black uppercase italic text-pulse-500 hover:bg-pulse-600 hover:text-white transition-all active:scale-95 shadow-xl">TERMINATE</button>
                    </div>
                </div>
            </div>

            {showHelp && <TacticalManual onClose={() => setShowHelp(false)} />}

            {isGameOver && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-6 text-center animate-fade-in">
                    <div className="max-w-sm w-full bg-zinc-900 p-12 rounded-[3rem] border-4 border-pulse-600 shadow-[0_0_100px_rgba(225,29,72,0.3)]">
                        <h2 className="text-4xl font-black italic uppercase tracking-tighter text-pulse-500 mb-4 leading-none">BUFFER OVERFLOW</h2>
                        <div className="mb-8">
                            <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-4 italic">Post Trace Initials</p>
                            <input autoFocus maxLength={3} value={initials} onChange={e => setInitials(e.target.value.toUpperCase())} className="bg-black/50 border-2 border-pulse-500 text-white rounded-xl px-4 py-4 text-center text-3xl font-black w-32 outline-none uppercase italic" placeholder="???" />
                        </div>
                        <button onClick={handleSaveScore} className="w-full py-5 bg-pulse-600 text-white font-black text-xl italic uppercase rounded-full hover:scale-105 transition-transform shadow-xl active:scale-95">Transmit Log</button>
                    </div>
                </div>
            )}
        </main>
    );
};

const TacticalManual: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-10 font-mono" onClick={onClose}>
            <div className="max-w-xl w-full bg-zinc-900 border-4 border-pulse-500 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh] pt-[var(--safe-top)] pb-[var(--safe-bottom)]" onClick={e => e.stopPropagation()}>
                
                <header className="h-12 bg-pulse-600 flex items-center justify-between px-1 relative z-20 border-b-2 border-black shrink-0">
                    <div className="flex items-center gap-2 h-full">
                        <div className="w-10 h-8 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center">
                           <BookOpenIcon className="w-5 h-5 text-black" />
                        </div>
                        <h2 className="text-white text-[10px] font-black uppercase tracking-[0.2em] italic px-2">COMPILATION_STRATEGIES.PDF</h2>
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
                                <SparklesIcon className="w-5 h-5 text-pulse-500" />
                                <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Node Consolidation</h3>
                            </div>
                            <p className="text-[10px] md:text-xs text-zinc-400 uppercase font-black leading-relaxed tracking-wider mb-4 border-l-2 border-pulse-500/30 pl-4">
                                Stack descending data blocks to clear buffer lines. High-density consolidation maximizes credit gain.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <ManualPoint title="0x01_Flat_Architecture" desc="Maintain a level node stack. High peaks create fragmented gaps that are difficult to seal during rapid compilation." color="text-pulse-500" />
                            <ManualPoint title="0x02_The_Void_Gap" desc="Reserve a single-column channel (The Void) for the 'I-Type' packet. This allows for a 4-line simultaneous purge." color="text-pulse-500" />
                            <ManualPoint title="0x03_Buffer_Holding" desc="Use the Holding Buffer (Top Left) to store critical packets for emergency deployment or optimal line clears." color="text-pulse-500" />
                            <ManualPoint title="0x04_Velocity_Scaling" desc="System sectors increase velocity over time. Lower your stack height before reaching Sector 10." color="text-pulse-500" />
                        </div>

                        <div className="p-5 bg-pulse-500/10 border-2 border-pulse-500/30 rounded-2xl flex items-start gap-4">
                            <ExclamationTriangleIcon className="w-6 h-6 text-pulse-500 shrink-0 mt-0.5 animate-pulse" />
                            <div>
                                <p className="text-[9px] font-black text-pulse-500 uppercase tracking-widest mb-1 italic">Pro Tip: Tetris Purge</p>
                                <p className="text-[8px] text-zinc-500 uppercase font-black leading-tight italic">
                                    Clearing 4 lines simultaneously (The Trace) grants the highest system integrity reward. Plan your void columns carefully.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>

                <footer className="p-4 bg-zinc-300 border-t-2 border-black shrink-0">
                    <button onClick={onClose} className="w-full py-4 bg-pulse-600 border-t-2 border-l-2 border-white/50 border-b-2 border-r-2 border-pulse-950 text-[10px] font-black uppercase italic text-white hover:bg-pulse-500 active:bg-pulse-700 transition-all shadow-lg">
                        CONFIRM_PROTOCOLS
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

export default TetrisPage;