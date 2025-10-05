import React, { useRef, useEffect, useState, useCallback } from 'react';
import { startGame, PieceType } from '../services/tetrisGame';
import { GameboyControls, GameboyButton } from './GameboyControls';

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
    const [holdPiece, setHoldPiece] = useState<PieceType | null>(null);
    const [nextQueue, setNextQueue] = useState<PieceType[]>([]);

    const drawPieces = useCallback((canvas: HTMLCanvasElement, pieces: PieceType[] | (PieceType | null)[]) => {
        if (!gameInstance.current) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pieces.forEach((piece, i) => {
            if (piece) {
                gameInstance.current?.drawPieceOn(ctx, piece, 0, i * 4);
            }
        });
    }, []);

    useEffect(() => {
        if (holdRef.current && holdPiece) {
            drawPieces(holdRef.current, [holdPiece]);
        } else if (holdRef.current) {
            const ctx = holdRef.current.getContext('2d');
            ctx?.clearRect(0, 0, holdRef.current.width, holdRef.current.height);
        }
    }, [holdPiece, drawPieces]);

    useEffect(() => {
        if (previewRef.current && nextQueue.length > 0) {
            drawPieces(previewRef.current, nextQueue);
        }
    }, [nextQueue, drawPieces]);

    const handleRestart = useCallback(() => {
        gameInstance.current?.stop();
        setIsGameOver(false);
        if (canvasRef.current && previewRef.current && holdRef.current) {
            const game = startGame({
                canvas: canvasRef.current,
                previewCanvas: previewRef.current,
                holdCanvas: holdRef.current,
                onScoreUpdate: (score) => setStats(s => ({ ...s, score })),
                onRowsUpdate: (rows) => setStats(s => ({ ...s, rows })),
                onLevelUpdate: (level) => setStats(s => ({ ...s, level: Math.floor(level) })),
                onGameOver: () => setIsGameOver(true),
                onHoldUpdate: (piece) => setHoldPiece(piece),
                onNextUpdate: (queue) => setNextQueue(queue),
            });
            gameInstance.current = game;
        }
    }, []);

    useEffect(() => {
        handleRestart();
        
        const keydownHandler = (ev: KeyboardEvent) => {
            const controls = gameInstance.current;
            if (!controls) return;
            switch (ev.code) {
                case 'ArrowLeft': controls.moveLeft(); break;
                case 'ArrowRight': controls.moveRight(); break;
                case 'ArrowUp': controls.rotate(); break;
                case 'ArrowDown': controls.softDrop(); break;
                case 'Space': ev.preventDefault(); controls.hardDrop(); break;
                case 'KeyC': controls.hold(); break;
            }
        };
        document.addEventListener('keydown', keydownHandler);

        return () => {
            gameInstance.current?.stop();
            document.removeEventListener('keydown', keydownHandler);
        };
    }, [handleRestart]);
    
    const handleButtonPress = (button: GameboyButton) => {
        const controls = gameInstance.current;
        if (!controls || isGameOver) return;
        
        const startContinuous = (action: () => void) => {
            if (continuousPressRef.current) clearInterval(continuousPressRef.current);
            action();
            continuousPressRef.current = setInterval(action, 100);
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
        if (['left', 'right', 'down'].includes(button)) {
            if (continuousPressRef.current) {
                clearInterval(continuousPressRef.current);
                continuousPressRef.current = null;
            }
        }
    };


    return (
        <main className="w-full h-full flex flex-col items-center justify-center p-2 bg-zinc-950 text-white font-mono overflow-hidden relative" style={{'--glow-color': '#a855f7'} as React.CSSProperties}>
             <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_10%,rgba(168,85,247,0.2),rgba(255,255,255,0))]"></div>
            
            <div className="absolute top-2 right-2 z-20 flex items-center gap-2">
                <button onClick={onBackToHub} className="px-3 py-1.5 text-xs font-semibold rounded-full bg-black/30 border border-white/10 text-zinc-300 hover:bg-black/50 transition-colors">Hub</button>
                <button onClick={onReturnToFeeds} className="px-3 py-1.5 text-xs font-semibold rounded-full bg-black/30 border border-white/10 text-zinc-300 hover:bg-black/50 transition-colors">Feeds</button>
            </div>

            <div className="w-full flex-grow flex flex-col items-center justify-center gap-2 md:gap-4 p-2 relative z-10 overflow-hidden">
                {/* Left Panel (Landscape) */}
                <div className="hidden flex-col gap-2 md:gap-4 w-20 md:w-32">
                    <div className="bg-black/40 border border-zinc-700 p-2 rounded-lg text-center">
                        <p className="text-xs text-zinc-400 uppercase tracking-widest">Hold</p>
                        <canvas ref={holdRef} className="mx-auto mt-1"></canvas>
                    </div>
                    <div className="bg-black/40 border border-zinc-700 p-2 md:p-4 rounded-lg text-center">
                        <p className="text-xs text-zinc-400 uppercase tracking-widest">Level</p>
                        <p className="text-xl md:text-3xl font-bold">{stats.level}</p>
                    </div>
                </div>

                {/* Game Canvas */}
                <div className="relative w-full h-full max-w-[50vh] aspect-[1/2]">
                    <div className="absolute -inset-1 rounded-lg bg-[var(--glow-color)] blur opacity-40"></div>
                    <canvas ref={canvasRef} className="relative bg-black rounded-lg border-2 border-zinc-700 shadow-2xl w-full h-full" style={{boxShadow: '0 0 20px var(--glow-color)'}}></canvas>
                </div>

                {/* Right Panel */}
                <div className="flex flex-row justify-between w-full max-w-[50vh] gap-2 md:gap-4 mt-2">
                     <div className="bg-black/40 border border-zinc-700 p-2 rounded-lg text-center flex-1">
                        <p className="text-xs text-zinc-400 uppercase tracking-widest">Next</p>
                        <canvas ref={previewRef} className="mx-auto mt-1 w-full"></canvas>
                    </div>
                     <div className="bg-black/40 border border-zinc-700 p-2 md:p-4 rounded-lg text-center flex-1">
                        <p className="text-xs text-zinc-400 uppercase tracking-widest">Lines</p>
                        <p className="text-xl md:text-3xl font-bold">{stats.rows}</p>
                    </div>
                    <div className="bg-black/40 border border-zinc-700 p-2 md:p-4 rounded-lg text-center flex-1">
                        <p className="text-xs text-zinc-400 uppercase tracking-widest">Score</p>
                        <p className="text-xl md:text-3xl font-bold text-yellow-300">{stats.score}</p>
                    </div>
                </div>
            </div>
            
            <GameboyControls onButtonPress={handleButtonPress} onButtonRelease={handleButtonRelease} />

            {isGameOver && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border-2 border-[var(--glow-color)]/50 rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center text-white animate-fade-in" style={{boxShadow: '0 0 30px var(--glow-color)'}}>
                        <h2 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Game Over</h2>
                        <p className="text-lg text-zinc-400">Final Score: <span className="font-bold text-yellow-300">{stats.score}</span></p>
                        <button 
                            onClick={handleRestart} 
                            className="mt-6 w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity shadow-lg"
                        >
                            Play Again
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
};

export default TetrisPage;