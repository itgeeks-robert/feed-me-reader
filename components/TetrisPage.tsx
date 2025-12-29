import React, { useRef, useEffect, useState, useCallback } from 'react';
import { startGame, PieceType } from '../services/tetrisGame';
import { saveHighScore, getHighScores } from '../services/highScoresService';
import HighScoreTable from './HighScoreTable';
import { XIcon, ArrowPathIcon, ControllerIcon, VoidIcon } from './icons';

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

    const [view, setView] = useState<'IDLE' | 'PLAYING'>('IDLE');
    const [stats, setStats] = useState({ score: 0, rows: 0, level: 0 });
    const [isGameOver, setIsGameOver] = useState(false);
    const [initials, setInitials] = useState("");
    const [holdPiece, setHoldPiece] = useState<PieceType | null>(null);
    const [nextQueue, setNextQueue] = useState<PieceType[]>([]);
    const [showScores, setShowScores] = useState(false);

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
        setView('PLAYING');
        // Small delay to ensure refs are available after view switch
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
    }, []);

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
                        <button onClick={onBackToHub} className="text-zinc-500 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors pt-2 block w-full italic tracking-[0.2em]">Abort Sync</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <main className="w-full h-full flex flex-col bg-zinc-950 text-white font-mono overflow-hidden relative">
            <header className="flex justify-between items-center px-4 py-3 z-10 flex-shrink-0 bg-void-900 border-b border-white/5">
                <div>
                    <h1 className="text-xl font-black italic uppercase tracking-tighter text-pulse-500 leading-none">STACK TRACE</h1>
                    <p className="text-[7px] font-black uppercase tracking-[0.2em] text-zinc-600 mt-1 italic">Protocol: Block Compilation</p>
                </div>
                <div className="text-right">
                    <span className="text-[7px] font-black uppercase text-zinc-500 block mb-0.5 tracking-widest">Score</span>
                    <span className="text-sm font-black italic text-yellow-400 font-mono">{stats.score.toLocaleString()}</span>
                </div>
            </header>

            <div className="flex-grow flex items-center justify-center p-2 min-h-0">
                <div className="grid grid-cols-[60px,1fr,60px] gap-2 h-full max-h-[70vh] w-full max-w-lg">
                    <div className="flex flex-col gap-2 justify-center">
                        <div className="bg-zinc-900/80 p-2 rounded-xl border border-white/5 text-center">
                            <p className="text-[7px] font-black uppercase text-zinc-500 mb-1 italic">Buf</p>
                            <canvas ref={holdRef} className="mx-auto w-10 h-10 opacity-80" />
                        </div>
                        <div className="bg-zinc-900/80 p-2 rounded-xl border border-white/5 text-center">
                            <p className="text-[7px] font-black uppercase text-zinc-500 mb-1 italic">Lvl</p>
                            <span className="text-xs font-black text-white">{stats.level}</span>
                        </div>
                    </div>
                    <div className="relative h-full border-2 border-zinc-800 bg-black rounded-lg overflow-hidden shadow-[0_0_40px_rgba(225,29,72,0.1)]">
                        <canvas ref={canvasRef} className="w-full h-full" />
                    </div>
                    <div className="flex flex-col gap-2 justify-center">
                        <div className="bg-zinc-900/80 p-2 rounded-xl border border-white/5 text-center">
                            <p className="text-[7px] font-black uppercase text-zinc-500 mb-1 italic">Next</p>
                            <canvas ref={previewRef} className="mx-auto w-10 h-24 opacity-80" />
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="bg-zinc-900 border-t-2 border-zinc-800 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] flex-shrink-0">
                <div className="max-w-md mx-auto grid grid-cols-4 gap-3">
                    <div className="col-span-2 flex gap-3">
                        <button onPointerDown={() => handleAction('left')} className="flex-1 h-16 bg-zinc-800 border-b-4 border-black rounded-2xl flex items-center justify-center active:translate-y-1 active:border-b-0 transition-all"><span className="text-2xl">←</span></button>
                        <button onPointerDown={() => handleAction('right')} className="flex-1 h-16 bg-zinc-800 border-b-4 border-black rounded-2xl flex items-center justify-center active:translate-y-1 active:border-b-0 transition-all"><span className="text-2xl">→</span></button>
                    </div>
                    <button onPointerDown={() => handleAction('rotate')} className="h-16 bg-pulse-600 border-b-4 border-pulse-950 rounded-2xl flex flex-col items-center justify-center active:translate-y-1 active:border-b-0 transition-all group">
                        <span className="text-[8px] font-black uppercase leading-none mb-1 opacity-50 group-active:opacity-100">Spin</span>
                        <span className="text-xl font-black italic">B</span>
                    </button>
                    <button onPointerDown={() => handleAction('drop')} className="h-16 bg-pulse-600 border-b-4 border-pulse-950 rounded-2xl flex flex-col items-center justify-center active:translate-y-1 active:border-b-0 transition-all group">
                        <span className="text-[8px] font-black uppercase leading-none mb-1 opacity-50 group-active:opacity-100">Drop</span>
                        <span className="text-xl font-black italic">A</span>
                    </button>
                    <div className="col-span-4 flex gap-4 pt-2">
                        <button onClick={() => handleAction('start')} className="flex-1 py-3 bg-zinc-800 border border-white/5 rounded-xl text-[9px] font-black uppercase italic text-zinc-400 hover:text-white transition-all active:scale-95">RESTART_SYNC</button>
                        <button onClick={() => setView('IDLE')} className="flex-1 py-3 bg-zinc-800 border border-pulse-500/30 rounded-xl text-[9px] font-black uppercase italic text-pulse-500 hover:bg-pulse-500 hover:text-white transition-all active:scale-95">ABORT_MISSION</button>
                    </div>
                </div>
            </div>

            {isGameOver && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-6 text-center">
                    <div className="max-w-sm w-full bg-zinc-900 p-12 rounded-[3rem] border-4 border-pulse-600 shadow-[0_0_100px_rgba(225,29,72,0.3)]">
                        <h2 className="text-4xl font-black italic uppercase tracking-tighter text-pulse-500 mb-4 leading-none">BUFFER OVERFLOW</h2>
                        <div className="mb-8">
                            <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-4 italic">Post Trace Initials</p>
                            <input autoFocus maxLength={3} value={initials} onChange={e => setInitials(e.target.value.toUpperCase())} className="bg-black/50 border-2 border-pulse-500 text-white rounded-xl px-4 py-3 text-center text-2xl font-black w-32 outline-none uppercase italic" placeholder="???" />
                        </div>
                        <button onClick={handleSaveScore} className="w-full py-5 bg-pulse-600 text-white font-black text-xl italic uppercase rounded-full hover:scale-105 transition-transform shadow-xl active:scale-95">Transmit Log</button>
                    </div>
                </div>
            )}
        </main>
    );
};

export default TetrisPage;