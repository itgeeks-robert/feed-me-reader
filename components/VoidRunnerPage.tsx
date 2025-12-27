
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { XIcon, ArrowPathIcon, SparklesIcon } from './icons';
import { GameboyControls, GameboyButton } from './GameboyControls';
import { saveHighScore, getHighScores } from '../services/highScoresService';
import HighScoreTable from './HighScoreTable';

// --- Types & Constants ---
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'NONE';
type GameState = 'INTRO' | 'PLAYING' | 'WON' | 'LOST' | 'DYING';

const TILE_SIZE = 20;
const SPEED = 2; 
const GHOST_FRIGHT_TIME = 8000;

const LEVELS = [
  { name: 'Normal Town', wallColor: '#3b82f6', dotColor: '#ffffff', bonus: '🍔' },
  { name: 'The Suburbs', wallColor: '#22c55e', dotColor: '#ffffff', bonus: '🥤' },
  { name: 'Inverted Realm', wallColor: '#e11d48', dotColor: '#fecaca', bonus: '📟' },
  { name: 'The Overgrowth', wallColor: '#4c1d95', dotColor: '#ddd6fe', bonus: '🍔' },
  { name: 'Firebase Zero', wallColor: '#3f6212', dotColor: '#d9f99d', bonus: '🥤' },
  { name: 'Ethereal Plane', wallColor: '#d946ef', dotColor: '#fdf4ff', bonus: '📟' },
  { name: 'Shattered Core', wallColor: '#000000', dotColor: '#ef4444', bonus: '🍔' },
  { name: 'The Final Pit', wallColor: '#ffffff', dotColor: '#000000', bonus: '🔥' }
];

const HeartIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
    <svg className={`w-6 h-6 ${filled ? 'text-pulse-500 drop-shadow-[0_0_8px_#e11d48]' : 'text-zinc-800'}`} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
);

const MAZE_LAYOUT = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,2,1],
    [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
    [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
    [1,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,1],
    [1,1,1,1,0,1,0,0,0,0,0,0,0,1,0,1,1,1,1],
    [1,1,1,1,0,1,0,1,1,3,1,1,0,1,0,1,1,1,1],
    [0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0], 
    [1,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,1],
    [1,1,1,1,0,1,0,0,0,4,0,0,0,1,0,1,1,1,1],
    [1,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
    [1,2,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,2,1],
    [1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1],
    [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const VoidRunnerPage: React.FC<{ onBackToHub: () => void; onReturnToFeeds: () => void }> = ({ onBackToHub, onReturnToFeeds }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<GameState>('INTRO');
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(0);
    const [lives, setLives] = useState(3);
    const [initials, setInitials] = useState("");
    const [activeLevel, setActiveLevel] = useState(LEVELS[0]);
    const [showBonus, setShowBonus] = useState(false);

    const player = useRef({ x: 9.5 * TILE_SIZE, y: 15 * TILE_SIZE, dir: 'LEFT' as Direction, nextDir: 'LEFT' as Direction });
    const ghosts = useRef([
        { x: 9 * TILE_SIZE, y: 9 * TILE_SIZE, color: '#ef4444', dir: 'UP' as Direction, state: 'NORMAL' as 'NORMAL' | 'FRIGHTENED' | 'EATEN' },
        { x: 9 * TILE_SIZE, y: 9 * TILE_SIZE, color: '#ec4899', dir: 'RIGHT' as Direction, state: 'NORMAL' },
        { x: 9 * TILE_SIZE, y: 9 * TILE_SIZE, color: '#06b6d4', dir: 'LEFT' as Direction, state: 'NORMAL' },
        { x: 9 * TILE_SIZE, y: 9 * TILE_SIZE, color: '#f59e0b', dir: 'DOWN' as Direction, state: 'NORMAL' },
    ]);
    const dots = useRef<boolean[][]>([]);
    const powerPellets = useRef<boolean[][]>([]);
    const frightTimer = useRef<number | null>(null);

    const resetBoard = useCallback(() => {
        dots.current = MAZE_LAYOUT.map(row => row.map(tile => tile === 0));
        powerPellets.current = MAZE_LAYOUT.map(row => row.map(tile => tile === 2));
        player.current = { x: 9 * TILE_SIZE + TILE_SIZE/2, y: 15 * TILE_SIZE + TILE_SIZE/2, dir: 'LEFT', nextDir: 'LEFT' };
        ghosts.current.forEach((g) => {
            g.x = 9 * TILE_SIZE + TILE_SIZE/2;
            g.y = 9 * TILE_SIZE + TILE_SIZE/2;
            g.state = 'NORMAL';
        });
        setShowBonus(false);
        // Show bonus Provision after 10 seconds
        setTimeout(() => setShowBonus(true), 10000);
    }, []);

    const startLevel = useCallback((lvlIdx: number) => {
        setLevel(lvlIdx);
        setActiveLevel(LEVELS[lvlIdx % LEVELS.length]);
        resetBoard();
        setGameState('PLAYING');
    }, [resetBoard]);

    const handleGameOver = () => {
        setGameState('LOST');
    };

    const handleSaveScore = () => {
        saveHighScore('void_runner', {
            name: initials.toUpperCase() || "???",
            score: score,
            displayValue: score.toLocaleString(),
            date: new Date().toISOString()
        });
        onBackToHub();
    };

    useEffect(() => {
        if (gameState !== 'PLAYING') return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        let frameId: number;

        const update = () => {
            const p = player.current;
            const targetX = Math.round(p.x / TILE_SIZE);
            const targetY = Math.round(p.y / TILE_SIZE);

            const canMove = (dir: Direction) => {
                let nx = targetX, ny = targetY;
                if (dir === 'UP') ny--; else if (dir === 'DOWN') ny++; else if (dir === 'LEFT') nx--; else if (dir === 'RIGHT') nx++;
                if (ny < 0 || ny >= MAZE_LAYOUT.length) return true; // Tunnel vertical
                if (nx < 0 || nx >= MAZE_LAYOUT[0].length) return true; // Tunnel horizontal
                return MAZE_LAYOUT[ny][nx] !== 1 && MAZE_LAYOUT[ny][nx] !== 3;
            };

            const atCenter = Math.abs(p.x % TILE_SIZE - TILE_SIZE/2) < 3 && Math.abs(p.y % TILE_SIZE - TILE_SIZE/2) < 3;
            if (atCenter) {
                if (p.nextDir !== 'NONE' && canMove(p.nextDir)) {
                    p.dir = p.nextDir;
                }
                if (!canMove(p.dir)) p.dir = 'NONE';
            }

            if (p.dir === 'UP') p.y -= SPEED;
            else if (p.dir === 'DOWN') p.y += SPEED;
            else if (p.dir === 'LEFT') p.x -= SPEED;
            else if (p.dir === 'RIGHT') p.x += SPEED;

            // Tunnel Wrap
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;

            const gridX = Math.floor(p.x / TILE_SIZE);
            const gridY = Math.floor(p.y / TILE_SIZE);
            
            if (dots.current[gridY]?.[gridX]) {
                dots.current[gridY][gridX] = false;
                setScore(s => s + 10);
            }
            if (powerPellets.current[gridY]?.[gridX]) {
                powerPellets.current[gridY][gridX] = false;
                setScore(s => s + 50);
                ghosts.current.forEach(g => { if (g.state !== 'EATEN') g.state = 'FRIGHTENED'; });
                if (frightTimer.current) clearTimeout(frightTimer.current);
                frightTimer.current = window.setTimeout(() => {
                    ghosts.current.forEach(g => { if (g.state === 'FRIGHTENED') g.state = 'NORMAL'; });
                }, GHOST_FRIGHT_TIME);
            }

            // Provision pickup
            if (showBonus && gridY === 11 && gridX === 9) {
                setShowBonus(false);
                setScore(s => s + 500);
            }

            // Check Level Win
            if (dots.current.every(row => row.every(d => !d)) && powerPellets.current.every(row => row.every(p => !p))) {
                setGameState('WON');
                setTimeout(() => startLevel(level + 1), 2000);
            }

            ghosts.current.forEach(g => {
                if (g.state === 'EATEN') {
                    const homeX = 9 * TILE_SIZE + TILE_SIZE/2;
                    const homeY = 9 * TILE_SIZE + TILE_SIZE/2;
                    if (Math.abs(g.x - homeX) < 5 && Math.abs(g.y - homeY) < 5) g.state = 'NORMAL';
                    g.x += (homeX - g.x) * 0.1;
                    g.y += (homeY - g.y) * 0.1;
                } else {
                    const gAtCenter = Math.abs(g.x % TILE_SIZE - TILE_SIZE/2) < 3 && Math.abs(g.y % TILE_SIZE - TILE_SIZE/2) < 3;
                    if (gAtCenter) {
                        const possible = (['UP', 'DOWN', 'LEFT', 'RIGHT'] as Direction[]).filter(d => {
                            let nx = Math.round(g.x/TILE_SIZE), ny = Math.round(g.y/TILE_SIZE);
                            if (d === 'UP') ny--; else if (d === 'DOWN') ny++; else if (d === 'LEFT') nx--; else if (d === 'RIGHT') nx++;
                            return MAZE_LAYOUT[ny]?.[nx] !== 1;
                        });
                        if (possible.length > 0) g.dir = possible[Math.floor(Math.random() * possible.length)];
                    }
                    const gSpeed = g.state === 'FRIGHTENED' ? SPEED * 0.5 : SPEED * (0.8 + (level * 0.05));
                    if (g.dir === 'UP') g.y -= gSpeed;
                    else if (g.dir === 'DOWN') g.y += gSpeed;
                    else if (g.dir === 'LEFT') g.x -= gSpeed;
                    else if (g.dir === 'RIGHT') g.x += gSpeed;
                    
                    if (g.x < 0) g.x = canvas.width;
                    if (g.x > canvas.width) g.x = 0;
                }

                const dist = Math.sqrt((p.x - g.x)**2 + (p.y - g.y)**2);
                if (dist < TILE_SIZE * 0.8) {
                    if (g.state === 'FRIGHTENED') {
                        g.state = 'EATEN';
                        setScore(s => s + 200);
                    } else if (g.state === 'NORMAL') {
                        setLives(l => {
                            if (l <= 1) handleGameOver();
                            else {
                                p.x = 9 * TILE_SIZE + TILE_SIZE/2;
                                p.y = 15 * TILE_SIZE + TILE_SIZE/2;
                            }
                            return l - 1;
                        });
                    }
                }
            });
        };

        const draw = () => {
            ctx.fillStyle = '#050101';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            MAZE_LAYOUT.forEach((row, y) => {
                row.forEach((tile, x) => {
                    if (tile === 1) {
                        ctx.strokeStyle = activeLevel.wallColor;
                        ctx.lineWidth = 2;
                        ctx.strokeRect(x * TILE_SIZE + 2, y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                    } else if (tile === 3) {
                        ctx.strokeStyle = '#444';
                        ctx.beginPath(); ctx.moveTo(x * TILE_SIZE, y * TILE_SIZE + TILE_SIZE/2); ctx.lineTo((x+1)*TILE_SIZE, y * TILE_SIZE + TILE_SIZE/2); ctx.stroke();
                    }
                    
                    if (dots.current[y]?.[x]) {
                        ctx.fillStyle = activeLevel.dotColor;
                        ctx.beginPath(); ctx.arc(x * TILE_SIZE + TILE_SIZE/2, y * TILE_SIZE + TILE_SIZE/2, 2, 0, Math.PI*2); ctx.fill();
                    }
                    if (powerPellets.current[y]?.[x]) {
                        ctx.fillStyle = '#ffffff';
                        ctx.shadowBlur = 10; ctx.shadowColor = 'white';
                        ctx.beginPath(); ctx.arc(x * TILE_SIZE + TILE_SIZE/2, y * TILE_SIZE + TILE_SIZE/2, 5, 0, Math.PI*2); ctx.fill();
                        ctx.shadowBlur = 0;
                    }
                });
            });

            if (showBonus) {
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(activeLevel.bonus, 9 * TILE_SIZE + TILE_SIZE/2, 11 * TILE_SIZE + TILE_SIZE/2);
            }

            ghosts.current.forEach(g => {
                if (g.state === 'FRIGHTENED') {
                    ctx.fillStyle = Math.floor(Date.now() / 200) % 2 === 0 ? '#ffffff' : '#3b82f6';
                } else if (g.state === 'EATEN') {
                    ctx.fillStyle = 'rgba(255,255,255,0.1)';
                } else {
                    ctx.fillStyle = g.color;
                }
                
                // Sentinel Shape (Diamond with teeth)
                ctx.beginPath();
                ctx.moveTo(g.x, g.y - 8);
                ctx.lineTo(g.x + 8, g.y);
                ctx.lineTo(g.x, g.y + 8);
                ctx.lineTo(g.x - 8, g.y);
                ctx.closePath();
                ctx.fill();

                if (g.state !== 'EATEN') {
                    ctx.fillStyle = 'black';
                    ctx.fillRect(g.x - 4, g.y - 2, 2, 2);
                    ctx.fillRect(g.x + 2, g.y - 2, 2, 2);
                }
            });

            // Player (The Interceptor)
            ctx.fillStyle = '#e11d48';
            ctx.shadowBlur = 15; ctx.shadowColor = '#e11d48';
            // Glitch effect
            const offset = (Math.random() - 0.5) * 2;
            ctx.fillRect(player.current.x - 7 + offset, player.current.y - 7, 14, 14);
            ctx.shadowBlur = 0;
        };

        const loop = () => {
            update();
            draw();
            frameId = requestAnimationFrame(loop);
        };

        loop();
        return () => cancelAnimationFrame(frameId);
    }, [gameState, level, activeLevel, startLevel, showBonus]);

    const handleInput = (btn: GameboyButton) => {
        if (btn === 'start' && gameState === 'INTRO') {
            startLevel(0);
            return;
        }

        const p = player.current;
        if (btn === 'up') p.nextDir = 'UP';
        else if (btn === 'down') p.nextDir = 'DOWN';
        else if (btn === 'left') p.nextDir = 'LEFT';
        else if (btn === 'right') p.nextDir = 'RIGHT';
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowUp') handleInput('up');
            if (e.key === 'ArrowDown') handleInput('down');
            if (e.key === 'ArrowLeft') handleInput('left');
            if (e.key === 'ArrowRight') handleInput('right');
            if (e.key === 'Enter') handleInput('start');
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState]);

    return (
        <main className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-4 overflow-hidden font-mono">
            <style>{`
                .game-canvas { image-rendering: pixelated; box-shadow: 0 0 20px rgba(225, 29, 72, 0.2); }
                .crt::after { content: " "; display: block; position: absolute; top: 0; left: 0; bottom: 0; right: 0; background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03)); z-index: 2; pointer-events: none; background-size: 100% 2px, 3px 100%; }
            `}</style>

            <div className="max-w-xl w-full flex flex-col gap-4">
                <header className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-3xl border border-white/5">
                    <button onClick={onBackToHub} className="p-2 bg-zinc-800 rounded-xl text-zinc-400 hover:text-flesh-500 transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                    <div className="text-center">
                        <span className="text-[10px] font-black uppercase text-pulse-500 tracking-[0.3em] block">{gameState === 'INTRO' ? 'SYSTEM IDLE' : activeLevel.name}</span>
                        <div className="flex items-center gap-1 justify-center mt-1">
                            <HeartIcon filled={lives >= 1} />
                            <HeartIcon filled={lives >= 2} />
                            <HeartIcon filled={lives >= 3} />
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-[8px] font-black uppercase text-zinc-500 block">Score</span>
                        <span className="text-lg font-black text-yellow-400">{score.toLocaleString()}</span>
                    </div>
                </header>

                <div className="relative flex justify-center bg-black p-2 rounded-2xl border-4 border-zinc-800 crt overflow-hidden min-h-[420px]">
                    {gameState === 'INTRO' ? (
                        <div className="h-[420px] w-full flex flex-col items-center justify-center text-center p-8 gap-6 z-10">
                            <div className="w-20 h-20 bg-pulse-500 animate-pulse shadow-[0_0_30px_#e11d48] flex items-center justify-center rounded-xl">
                                <SparklesIcon className="w-12 h-12 text-white" />
                            </div>
                            <div>
                                <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2 font-horror">VOID RUNNER</h2>
                                <p className="text-zinc-500 text-[10px] uppercase tracking-widest leading-loose">
                                    Capture Signal Packets.<br/>
                                    Evade Void Sentinels.<br/>
                                    Harvest Provisions.
                                </p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <button onClick={() => startLevel(0)} className="px-10 py-4 bg-plant-600 text-black font-black uppercase italic rounded-full hover:scale-105 transition-transform shadow-xl">Initiate Link</button>
                                <span className="text-[8px] text-zinc-700 uppercase font-bold animate-pulse">Or Press START on Gamepad</span>
                            </div>
                        </div>
                    ) : (
                        <canvas 
                            ref={canvasRef} 
                            width={19 * TILE_SIZE} 
                            height={21 * TILE_SIZE} 
                            className="game-canvas max-w-full"
                        />
                    )}
                </div>

                <div className="pt-4 flex flex-col gap-4">
                    <div className="md:hidden">
                        <GameboyControls 
                            onButtonPress={(btn) => handleInput(btn)} 
                            onButtonRelease={() => {}} 
                        />
                    </div>
                    <div className="hidden md:flex justify-center text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
                        Use Arrow Keys to Navigate // Enter to Start
                    </div>
                </div>
            </div>

            {gameState === 'LOST' && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-6 text-center">
                    <div className="max-w-sm w-full bg-zinc-900 p-12 rounded-[3rem] border-4 border-flesh-600 shadow-[0_0_100px_rgba(236,72,153,0.3)]">
                        <h2 className="text-5xl font-black italic uppercase tracking-tighter text-flesh-500 mb-4">LOST SIGNAL</h2>
                        <div className="mb-8">
                            <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-4">Enter Arcade Initials</p>
                            <input 
                                autoFocus
                                maxLength={3} 
                                value={initials} 
                                onChange={e => setInitials(e.target.value.toUpperCase())}
                                className="bg-black/50 border-2 border-flesh-500 text-flesh-500 rounded-xl px-4 py-3 text-center text-2xl font-black w-32 outline-none uppercase italic"
                                placeholder="???"
                            />
                        </div>
                        <button onClick={handleSaveScore} className="w-full py-5 bg-flesh-600 text-white font-black text-xl italic uppercase rounded-full hover:scale-105 transition-transform">Post Score</button>
                    </div>
                </div>
            )}
        </main>
    );
};

export default VoidRunnerPage;
