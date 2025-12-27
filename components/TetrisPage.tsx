
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { startGame, PieceType } from '../services/tetrisGame';
import { GameboyControls, GameboyButton } from './GameboyControls';
import { saveHighScore, getHighScores } from '../services/highScoresService';
import HighScoreTable from './HighScoreTable';
import { XIcon } from './icons';

interface TetrisPageProps {
  onBackToHub: () => void;
  onReturnToFeeds: () => void;
}

const TetrisPage: React.FC<TetrisPageProps> = ({ onBackToHub, onReturnToFeeds }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const previewRef = useRef<HTMLCanvasElement>(null);
    const holdRef = useRef<HTMLCanvasElement>(null);
    const gameInstance = useRef<ReturnType<typeof startGame> | null>(null);
    const continuousPressRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [stats, setStats] = useState({ score: 0, rows: 0, level: 0 });
    const [isGameOver, setIsGameOver] = useState(false);
    const [initials, setInitials] = useState("");
    const [holdPiece, setHoldPiece] = useState<PieceType | null>(null);
    const [nextQueue, setNextQueue] = useState<PieceType[]>([]);

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
    }, []);

    const handleSaveScore = () => {
        saveHighScore('tetris', {
            name: initials.toUpperCase() || "???",
            score: stats.score,
            displayValue: stats.score.toLocaleString(),
            date: new Date().toISOString()
        });
        onBackToHub();
    };

    useEffect(() => {
        handleRestart();
        return () => gameInstance.current?.stop();
    }, [handleRestart]);
    
    const handleButtonPress = (button: GameboyButton) => {
        const controls = gameInstance.current;
        if (!controls || isGameOver) return;
        const startContinuous = (action: () => void) => {
            if (continuousPressRef.current) clearInterval(continuousPressRef.current);
            action(); continuousPressRef.current = setInterval(action, 100);
        };
        switch(button) {
            case 'left': startContinuous(controls.moveLeft); break;
            case 'right': startContinuous(controls.moveRight); break;
            case 'down': startContinuous(controls.softDrop); break;
            case 'up': controls.rotate(); break;
            case 'b': controls.rotate(); break;
            case 'a': controls.hardDrop(); break;
            case 'select': controls.hold(); break;
            case 'start': handleRestart(); break;
        }
    };

    const handleButtonRelease = (button: GameboyButton) => {
        if (['left', 'right', 'down'].includes(button) && continuousPressRef.current) {
            clearInterval(continuousPressRef.current); continuousPressRef.current = null;
        }
    };

    return (
        <main className="w-full h-full flex flex-col bg-zinc-950 text-white font-mono overflow-y-auto scrollbar-hide relative">
            <header className="flex justify-between items-center p-4 md:p-6 z-10 flex-shrink-0">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-pulse-500">STACK TRACE</h1>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-600 italic">Sector Terminal // v1.8.4</p>
                </div>
                <button onClick={onBackToHub} className="p-3 bg-zinc-900 border border-white/10 rounded-2xl text-zinc-400 hover:text-white transition-all active:scale-95 shadow-lg">
                    <XIcon className="w-6 h-6" />
                </button>
            </header>

            <div className="flex-grow flex flex-col lg:flex-row items-center justify-center gap-4 md:gap-8 p-4 z-10">
                <div className="flex lg:flex-col gap-4 w-full lg:w-48 order-2 lg:order-1">
                    <div className="flex-1 lg:flex-none bg-zinc-900/80 p-4 rounded-3xl border border-white/5 text-center shadow-2xl">
                        <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-2 italic">Buffer</p>
                        <canvas ref={holdRef} className="mx-auto w-16 h-16 opacity-80" />
                    </div>
                    <div className="hidden lg:block">
                        <HighScoreTable entries={getHighScores('tetris')} title="TRACE" />
                    </div>
                </div>

                <div className="relative aspect-[1/2] h-[55vh] md:h-[65vh] order-1 lg:order-2 shadow-[0_0_100px_rgba(225,29,72,0.1)]">
                    <div className="absolute -inset-2 bg-pulse-500/10 blur-2xl rounded-[2rem]"></div>
                    <canvas ref={canvasRef} className="relative w-full h-full bg-black border-4 border-zinc-900 rounded-[1.5rem] shadow-2xl" />
                </div>

                <div className="flex lg:flex-col gap-4 w-full lg:w-48 order-3">
                    <div className="flex-1 lg:flex-none bg-zinc-900/80 p-4 rounded-3xl border border-white/5 text-center shadow-2xl">
                        <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-2 italic">Queue</p>
                        <canvas ref={previewRef} className="mx-auto w-16 h-32 opacity-80" />
                    </div>
                    <div className="flex-1 lg:flex-none bg-zinc-900 p-4 rounded-3xl border border-white/5 text-center shadow-2xl">
                        <p className="text-[8px] font-black uppercase text-zinc-500 tracking-widest italic">Sync Value</p>
                        <p className="text-2xl font-black italic text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.3)]">{stats.score}</p>
                    </div>
                </div>
            </div>
            
            <div className="p-4 flex-shrink-0 md:hidden pb-10">
              <GameboyControls onButtonPress={handleButtonPress} onButtonRelease={handleButtonRelease} />
            </div>

            {isGameOver && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-6 text-center">
                    <div className="max-w-sm w-full bg-zinc-900 p-12 rounded-[3rem] border-4 border-pulse-600 shadow-[0_0_100px_rgba(225,29,72,0.3)]">
                        <h2 className="text-4xl font-black italic uppercase tracking-tighter text-pulse-500 mb-4 leading-none">BUFFER OVERFLOW</h2>
                        <div className="mb-8">
                            <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-4 italic">Post Trace Initials</p>
                            <input 
                                autoFocus
                                maxLength={3} 
                                value={initials} 
                                onChange={e => setInitials(e.target.value.toUpperCase())}
                                className="bg-black/50 border-2 border-pulse-500 text-white rounded-xl px-4 py-3 text-center text-2xl font-black w-32 outline-none uppercase italic"
                                placeholder="???"
                            />
                        </div>
                        <button onClick={handleSaveScore} className="w-full py-5 bg-pulse-600 text-white font-black text-xl italic uppercase rounded-full hover:scale-105 transition-transform shadow-xl">Transmit Log</button>
                    </div>
                </div>
            )}
        </main>
    );
};

export default TetrisPage;
