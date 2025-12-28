import React, { useState, useEffect, useRef, useCallback } from 'react';
import { XIcon, SparklesIcon, VoidIcon } from './icons';
import { GameboyControls, GameboyButton } from './GameboyControls';
import { saveHighScore, getHighScores, HighScoreEntry } from '../services/highScoresService';
import HighScoreTable from './HighScoreTable';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'NONE';
type GameState = 'INTRO' | 'STORY_BEAT' | 'PLAYING' | 'DYING' | 'SECTOR_CLEAR' | 'WON' | 'LOST';

const TILE_SIZE = 20;
const BASE_SPEED = 2; // Must be a factor of TILE_SIZE (20)
const MAX_PLAYABLE_SECTORS = 7;

const MAZE_LAYOUT = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,3,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,3,1],
    [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
    [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
    [1,1,1,1,0,1,1,1,2,1,2,1,1,1,0,1,1,1,1],
    [2,2,2,1,0,1,2,2,2,2,2,2,2,1,0,1,2,2,2],
    [1,1,1,1,0,1,2,1,1,4,1,1,2,1,0,1,1,1,1],
    [2,2,2,2,0,2,2,1,4,4,4,1,2,2,0,2,2,2,2],
    [1,1,1,1,0,1,2,1,1,1,1,1,2,1,0,1,1,1,1],
    [2,2,2,1,0,1,2,2,2,2,2,2,2,1,0,1,2,2,2],
    [1,1,1,1,0,1,2,1,1,1,1,1,2,1,0,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
    [1,3,0,1,0,0,0,0,0,2,0,0,0,0,0,1,0,3,1],
    [1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1],
    [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

const SECTOR_INTEL = [
    { title: "Local Network", Intel: "Silhouette of an 80s arcade cabinet. Red static fills the screen. CRITICAL FAILURE detected.", color: "#ef4444" },
    { title: "Sub-station 02", Intel: "Three BMX bikes on a hill. Power station hums with sickly green glow under heavy mist.", color: "#22c55e" },
    { title: "Void Gateway", Intel: "Trees bend towards a central point—a vertical tear in reality pulsing with crimson light.", color: "#be123c" },
    { title: "Recon Dataset", Intel: "Van interior. CRT monitors stacked, displaying purple maps and scrolling data streams.", color: "#a855f7" },
    { title: "Firebase Zero", Intel: "Direct access to the 1984 supercomputer. The mainframe is processing at critical limit.", color: "#3b82f6" },
    { title: "The Wasteland", Intel: "Broken code, constant segment errors, and legacy systems. A digital graveyard.", color: "#71717a" },
    { title: "The Core", Intel: "Face the GEOMETRIC EYE. A pulsing octagon of red light. Digital artifacts appearing.", color: "#f43f5e" },
    { title: "Total System", Intel: "Heroic low-poly sunrise. The red static is gone. Warm gold horizon reached.", color: "#fbbf24" }
];

interface Ghost {
    id: number;
    x: number;
    y: number;
    dir: Direction;
    color: string;
    state: 'HOUSE' | 'EXITING' | 'CHASE' | 'SCATTER' | 'FRIGHTENED';
    exitDelay: number;
}

interface Entity {
    x: number;
    y: number;
    dir: Direction;
    nextDir: Direction;
}

const VoidRunnerPage: React.FC<{ onBackToHub: () => void; onReturnToFeeds: () => void; onCollectPacket?: () => void }> = ({ onBackToHub, onCollectPacket }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<GameState>('INTRO');
    const [score, setScore] = useState(0);
    const [sector, setSector] = useState(1);
    const [highScores, setHighScores] = useState<HighScoreEntry[]>([]);
    const [initials, setInitials] = useState("");
    const [isFrightened, setIsFrightened] = useState(false);
    
    const requestRef = useRef<number | undefined>(undefined);
    const gameData = useRef({
        player: { x: 9 * TILE_SIZE, y: 15 * TILE_SIZE, dir: 'NONE', nextDir: 'NONE' } as Entity,
        ghosts: [] as Ghost[],
        maze: [] as number[][],
        frightenedTimer: 0,
        packetsRemaining: 0,
        packetsCollected: 0,
        deathTimer: 0,
        bonus: null as { x: number, y: number, type: 'BURGER' | 'SHAKE', timer: number } | null,
        modeTimer: 0,
        currentMode: 'SCATTER' as 'SCATTER' | 'CHASE'
    });

    useEffect(() => { setHighScores(getHighScores('void_runner')); }, [gameState]);

    // Robust Keyboard Input
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const { player } = gameData.current;
            let captured = true;
            switch (e.key) {
                case 'ArrowUp': case 'w': case 'W': player.nextDir = 'UP'; break;
                case 'ArrowDown': case 's': case 'S': player.nextDir = 'DOWN'; break;
                case 'ArrowLeft': case 'a': case 'A': player.nextDir = 'LEFT'; break;
                case 'ArrowRight': case 'd': case 'D': player.nextDir = 'RIGHT'; break;
                default: captured = false;
            }
            if (captured) {
                e.preventDefault();
                e.stopPropagation();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const isWall = (tx: number, ty: number) => {
        const row = gameData.current.maze[ty];
        if (!row) return true;
        const cell = row[tx];
        return cell === 1 || cell === 4; // Walls and House borders
    };

    const getValidDirs = (x: number, y: number, currentDir: Direction): Direction[] => {
        const tx = Math.round(x / TILE_SIZE);
        const ty = Math.round(y / TILE_SIZE);
        const res: Direction[] = [];
        const opp: Record<Direction, Direction> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT', NONE: 'NONE' };
        
        const check = (dtx: number, dty: number, dir: Direction) => {
            if (dir === opp[currentDir]) return;
            const row = gameData.current.maze[ty + dty];
            if (!row) return;
            const cell = row[tx + dtx];
            // Ghosts can't enter the house through the gate usually, but they can exit. 
            // In the play area, they treats 1 and 4 as walls.
            if (cell !== 1 && cell !== 4) res.push(dir);
        };

        check(0, -1, 'UP');
        check(0, 1, 'DOWN');
        check(-1, 0, 'LEFT');
        check(1, 0, 'RIGHT');
        return res;
    };

    const initSector = useCallback((s: number) => {
        setSector(s);
        if (s === 8) { setGameState('WON'); return; }
        gameData.current.maze = JSON.parse(JSON.stringify(MAZE_LAYOUT));
        gameData.current.player = { x: 9 * TILE_SIZE, y: 15 * TILE_SIZE, dir: 'NONE', nextDir: 'NONE' };
        gameData.current.ghosts = [
            { id: 1, x: 9 * TILE_SIZE, y: 9 * TILE_SIZE, dir: 'UP', color: '#ef4444', state: 'HOUSE', exitDelay: 0 },
            { id: 2, x: 8 * TILE_SIZE, y: 9 * TILE_SIZE, dir: 'UP', color: '#ec4899', state: 'HOUSE', exitDelay: 180 },
            { id: 3, x: 10 * TILE_SIZE, y: 9 * TILE_SIZE, dir: 'UP', color: '#06b6d4', state: 'HOUSE', exitDelay: 360 }
        ];
        let count = 0;
        MAZE_LAYOUT.forEach(row => row.forEach(cell => { if (cell === 0 || cell === 3) count++; }));
        gameData.current.packetsRemaining = count;
        gameData.current.packetsCollected = 0;
        gameData.current.bonus = null;
        gameData.current.modeTimer = 0;
        gameData.current.currentMode = 'SCATTER';
        setIsFrightened(false);
        gameData.current.frightenedTimer = 0;
        setGameState('STORY_BEAT');
    }, []);

    const update = useCallback(() => {
        const { player, ghosts, maze, bonus } = gameData.current;

        // --- PLAYER LOGIC ---
        const pAligned = player.x % TILE_SIZE === 0 && player.y % TILE_SIZE === 0;
        if (player.nextDir !== 'NONE') {
            const opp: Record<Direction, Direction> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT', NONE: 'NONE' };
            if (player.nextDir === opp[player.dir] || pAligned) {
                const tx = Math.round(player.x / TILE_SIZE), ty = Math.round(player.y / TILE_SIZE);
                let can = false;
                if (player.nextDir === 'UP') can = !isWall(tx, ty - 1);
                else if (player.nextDir === 'DOWN') can = !isWall(tx, ty + 1);
                else if (player.nextDir === 'LEFT') can = !isWall(tx - 1, ty);
                else if (player.nextDir === 'RIGHT') can = !isWall(tx + 1, ty);
                if (can) { player.dir = player.nextDir; player.nextDir = 'NONE'; }
            }
        }
        if (player.dir !== 'NONE') {
            if (pAligned) {
                const tx = Math.round(player.x / TILE_SIZE), ty = Math.round(player.y / TILE_SIZE);
                let wall = false;
                if (player.dir === 'UP') wall = isWall(tx, ty - 1);
                else if (player.dir === 'DOWN') wall = isWall(tx, ty + 1);
                else if (player.dir === 'LEFT') wall = isWall(tx - 1, ty);
                else if (player.dir === 'RIGHT') wall = isWall(tx + 1, ty);
                if (wall) player.dir = 'NONE';
            }
            if (player.dir === 'UP') player.y -= BASE_SPEED;
            else if (player.dir === 'DOWN') player.y += BASE_SPEED;
            else if (player.dir === 'LEFT') player.x -= BASE_SPEED;
            else if (player.dir === 'RIGHT') player.x += BASE_SPEED;
        }

        // Screen Wrap
        if (player.x < -TILE_SIZE/2) player.x = (maze[0].length - 0.5) * TILE_SIZE;
        else if (player.x > (maze[0].length - 0.5) * TILE_SIZE) player.x = -TILE_SIZE/2;

        // Collision: Packets
        const tx = Math.round(player.x / TILE_SIZE), ty = Math.round(player.y / TILE_SIZE);
        if (maze[ty]?.[tx] === 0 || maze[ty]?.[tx] === 3) {
            const isPower = maze[ty][tx] === 3;
            maze[ty][tx] = 2;
            setScore(s => s + (isPower ? 50 : 10));
            gameData.current.packetsRemaining--;
            gameData.current.packetsCollected++;
            onCollectPacket?.();
            if (isPower) {
                setIsFrightened(true);
                gameData.current.frightenedTimer = 480 - (sector * 30);
                ghosts.forEach(g => { if(g.state !== 'HOUSE' && g.state !== 'EXITING') g.state = 'FRIGHTENED'; });
            }
            // Bonus spawns
            if (gameData.current.packetsCollected === 70 || gameData.current.packetsCollected === 150) {
                gameData.current.bonus = { x: 9 * TILE_SIZE, y: 11 * TILE_SIZE, type: Math.random() > 0.5 ? 'BURGER' : 'SHAKE', timer: 400 };
            }
        }
        if (bonus && Math.abs(player.x - bonus.x) < 10 && Math.abs(player.y - bonus.y) < 10) {
            setScore(s => s + 500);
            gameData.current.bonus = null;
        }
        if (bonus) { bonus.timer--; if (bonus.timer <= 0) gameData.current.bonus = null; }

        if (gameData.current.packetsRemaining <= 0) {
            if (sector < MAX_PLAYABLE_SECTORS) { setGameState('SECTOR_CLEAR'); setTimeout(() => initSector(sector + 1), 2000); }
            else initSector(8);
            return;
        }

        if (gameData.current.frightenedTimer > 0) {
            gameData.current.frightenedTimer--;
            if (gameData.current.frightenedTimer <= 0) {
                setIsFrightened(false);
                ghosts.forEach(g => { if(g.state === 'FRIGHTENED') g.state = gameData.current.currentMode; });
            }
        } else {
            // Mode Cycling (Scatter for 7s, Chase for 20s)
            gameData.current.modeTimer++;
            const cycle = 1600; // ~27 seconds at 60fps
            if (gameData.current.modeTimer % cycle === 0) {
                gameData.current.currentMode = 'SCATTER';
                ghosts.forEach(g => { if(g.state === 'CHASE') g.state = 'SCATTER'; });
            } else if (gameData.current.modeTimer % cycle === 420) { // 7 seconds
                gameData.current.currentMode = 'CHASE';
                ghosts.forEach(g => { if(g.state === 'SCATTER') g.state = 'CHASE'; });
            }
        }

        // --- GHOST LOGIC ---
        ghosts.forEach(ghost => {
            const speed = (isFrightened && ghost.state === 'FRIGHTENED') ? 1 : (BASE_SPEED + (sector * 0.1));
            const aligned = ghost.x % TILE_SIZE === 0 && ghost.y % TILE_SIZE === 0;

            if (ghost.state === 'HOUSE') {
                ghost.exitDelay--;
                // Bounce
                if (ghost.y <= 9 * TILE_SIZE - 4) ghost.dir = 'DOWN';
                if (ghost.y >= 9 * TILE_SIZE + 4) ghost.dir = 'UP';
                ghost.y += (ghost.dir === 'UP' ? -0.5 : 0.5);

                if (ghost.exitDelay <= 0) ghost.state = 'EXITING';
            } else if (ghost.state === 'EXITING') {
                const gateX = 9 * TILE_SIZE;
                const gateY = 7 * TILE_SIZE;
                if (Math.abs(ghost.x - gateX) > 1) ghost.x += (ghost.x < gateX ? 1 : -1);
                else if (ghost.y > gateY) ghost.y -= 1;
                else {
                    ghost.x = gateX; ghost.y = gateY;
                    ghost.state = isFrightened ? 'FRIGHTENED' : gameData.current.currentMode;
                    ghost.dir = 'LEFT';
                }
            } else {
                if (aligned) {
                    const gtx = Math.round(ghost.x / TILE_SIZE), gty = Math.round(ghost.y / TILE_SIZE);
                    const valid = getValidDirs(ghost.x, ghost.y, ghost.dir);

                    if (valid.length > 0) {
                        let targetX = 0, targetY = 0;
                        if (ghost.state === 'FRIGHTENED') {
                            ghost.dir = valid[Math.floor(Math.random() * valid.length)];
                        } else {
                            if (ghost.state === 'SCATTER') {
                                // Corner targets
                                if (ghost.id === 1) { targetX = 18; targetY = 0; }
                                else if (ghost.id === 2) { targetX = 0; targetY = 0; }
                                else { targetX = 0; targetY = 20; }
                            } else {
                                // CHASE AI
                                const ptx = Math.round(player.x / TILE_SIZE);
                                const pty = Math.round(player.y / TILE_SIZE);
                                if (ghost.id === 1) { // Blinky: Direct
                                    targetX = ptx; targetY = pty;
                                } else if (ghost.id === 2) { // Pinky: Intercept (4 tiles ahead)
                                    targetX = ptx; targetY = pty;
                                    if (player.dir === 'UP') targetY -= 4; else if (player.dir === 'DOWN') targetY += 4;
                                    else if (player.dir === 'LEFT') targetX -= 4; else targetX += 4;
                                } else { // Inky: Flank (Offset from Blinky)
                                    targetX = ptx; targetY = pty;
                                    if (player.dir === 'UP') targetY += 4; else if (player.dir === 'DOWN') targetY -= 4;
                                    else if (player.dir === 'LEFT') targetX += 4; else targetX -= 4;
                                }
                            }

                            valid.sort((a, b) => {
                                let ax = gtx, ay = gty, bx = gtx, by = gty;
                                if (a === 'UP') ay--; else if (a === 'DOWN') ay++; else if (a === 'LEFT') ax--; else ax++;
                                if (b === 'UP') by--; else if (b === 'DOWN') by++; else if (b === 'LEFT') bx--; else bx++;
                                return Math.sqrt((ax-targetX)**2 + (ay-targetY)**2) - Math.sqrt((bx-targetX)**2 + (by-targetY)**2);
                            });
                            ghost.dir = valid[0];
                        }
                    }
                }

                if (ghost.dir === 'UP') ghost.y -= speed;
                else if (ghost.dir === 'DOWN') ghost.y += speed;
                else if (ghost.dir === 'LEFT') ghost.x -= speed;
                else if (ghost.dir === 'RIGHT') ghost.x += speed;

                // Ghost Tunnels
                if (ghost.x < -TILE_SIZE/2) ghost.x = 18.5 * TILE_SIZE;
                else if (ghost.x > 18.5 * TILE_SIZE) ghost.x = -TILE_SIZE/2;
            }

            const dist = Math.sqrt((player.x - ghost.x)**2 + (player.y - ghost.y)**2);
            if (dist < TILE_SIZE * 0.8 && ghost.state !== 'HOUSE' && ghost.state !== 'EXITING') {
                if (isFrightened) {
                    setScore(s => s + 200);
                    ghost.state = 'EXITING'; ghost.x = 9 * TILE_SIZE; ghost.y = 9 * TILE_SIZE;
                } else {
                    setGameState('DYING');
                    gameData.current.deathTimer = 60;
                }
            }
        });
    }, [isFrightened, sector, initSector, onCollectPacket]);

    const draw = useCallback((ctx: CanvasRenderingContext2D) => {
        const { player, ghosts, maze, bonus, deathTimer } = gameData.current;
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        maze.forEach((row, ty) => {
            row.forEach((cell, tx) => {
                if (cell === 1) {
                    ctx.fillStyle = '#111'; ctx.fillRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    ctx.strokeStyle = SECTOR_INTEL[sector-1].color + '33'; ctx.strokeRect(tx * TILE_SIZE + 1, ty * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                } else if (cell === 0) {
                    ctx.fillStyle = SECTOR_INTEL[sector-1].color; ctx.beginPath(); ctx.arc(tx * TILE_SIZE + 10, ty * TILE_SIZE + 10, 2, 0, Math.PI*2); ctx.fill();
                } else if (cell === 3) {
                    ctx.fillStyle = '#e11d48'; ctx.beginPath(); ctx.arc(tx * TILE_SIZE + 10, ty * TILE_SIZE + 10, 5, 0, Math.PI*2); ctx.fill();
                }
            });
        });

        if (bonus) {
            ctx.font = '20px serif'; ctx.textAlign = 'center';
            ctx.fillText(bonus.type === 'BURGER' ? '🍔' : '🥤', bonus.x + 10, bonus.y + 15);
        }

        if (gameState === 'DYING') {
            const s = deathTimer/60; 
            ctx.fillStyle = '#e11d48'; ctx.beginPath(); ctx.arc(player.x + 10, player.y + 10, 10 * s, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#e11d48'; ctx.lineWidth = 2;
            [1, 2, 3].forEach(i => {
                ctx.beginPath(); ctx.arc(player.x + 10, player.y + 10, 10 * (1-s) * (i * 2.5), 0, Math.PI*2); ctx.stroke();
            });
        } else {
            ctx.fillStyle = SECTOR_INTEL[sector-1].color; ctx.shadowBlur = 15; ctx.shadowColor = SECTOR_INTEL[sector-1].color;
            ctx.beginPath(); ctx.arc(player.x + 10, player.y + 10, 8, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
        }

        ghosts.forEach(g => {
            const c = (isFrightened && g.state === 'FRIGHTENED') ? '#3b82f6' : g.color;
            ctx.fillStyle = c; ctx.shadowBlur = 15; ctx.shadowColor = c;
            ctx.fillRect(g.x + 2, g.y + 2, 16, 16);
            ctx.fillStyle = 'white'; 
            ctx.fillRect(g.x + 4, g.y + 6, 4, 4); ctx.fillRect(g.x + 12, g.y + 6, 4, 4);
            ctx.shadowBlur = 0;
        });

        // Scanlines
        ctx.fillStyle = 'rgba(0,0,0,0.1)'; for (let i = 0; i < ctx.canvas.height; i += 4) ctx.fillRect(0, i, ctx.canvas.width, 1);
    }, [isFrightened, sector, gameState]);

    useEffect(() => {
        const loop = () => {
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx) {
                if (gameState === 'PLAYING') update();
                else if (gameState === 'DYING') { 
                    gameData.current.deathTimer--; 
                    if (gameData.current.deathTimer <= 0) setGameState('LOST'); 
                }
                draw(ctx);
            }
            requestRef.current = requestAnimationFrame(loop);
        };
        requestRef.current = requestAnimationFrame(loop);
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [gameState, update, draw]);

    const handleInput = useCallback((btn: GameboyButton) => {
        const { player } = gameData.current;
        if (btn === 'up') player.nextDir = 'UP';
        if (btn === 'down') player.nextDir = 'DOWN';
        if (btn === 'left') player.nextDir = 'LEFT';
        if (btn === 'right') player.nextDir = 'RIGHT';
        if (btn === 'start') {
            if (gameState === 'INTRO') initSector(1);
            else if (gameState === 'STORY_BEAT') setGameState('PLAYING');
            else if (gameState === 'WON' || gameState === 'LOST') { setGameState('INTRO'); setScore(0); setSector(1); }
        }
    }, [gameState, initSector]);

    return (
        <main className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-4 font-mono overflow-y-auto scrollbar-hide">
            <style>{`
                .arcade-silhouette { width: 120px; height: 180px; background: #111; clip-path: polygon(0 20%, 10% 0, 90% 0, 100% 20%, 100% 100%, 0 100%); position: relative; border: 2px solid #333; }
                .arcade-screen { position: absolute; top: 25px; left: 10px; right: 10px; bottom: 80px; background: #000; overflow: hidden; }
                .octagon-eye { width: 100px; height: 100px; background: #f43f5e; clip-path: polygon(30% 0, 70% 0, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0 70%, 0 30%); display: flex; align-items: center; justify-content: center; animation: pulse-eye 2s infinite; }
                .octagon-pupil { width: 30px; height: 30px; background: black; clip-path: polygon(30% 0, 70% 0, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0 70%, 0 30%); }
                @keyframes pulse-eye { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.8; } }
                .lowpoly-sun { width: 100px; height: 100px; background: #fbbf24; border-radius: 50%; box-shadow: 0 0 50px #f59e0b; }
            `}</style>

            <div className="max-w-xl w-full flex flex-col gap-4">
                <header className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-3xl border border-white/5 shadow-lg">
                    <div className="flex items-center gap-4">
                        <button onClick={onBackToHub} className="p-2 bg-zinc-800 rounded-xl text-zinc-400 hover:text-white active:scale-95 border border-white/5 shadow-md"><XIcon className="w-6 h-6" /></button>
                        <div>
                             <span className="text-[10px] font-black text-pulse-500 uppercase tracking-[0.4em] italic block">Sector {sector}</span>
                             <h2 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">VOID RUNNER</h2>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Data Intercept</span>
                        <span className="text-xl font-black italic text-signal-500 font-mono">{score}</span>
                    </div>
                </header>

                <div className="relative bg-black rounded-[2rem] border-4 border-zinc-900 shadow-2xl overflow-hidden aspect-[19/21] flex items-center justify-center">
                    {gameState === 'INTRO' && (
                        <div className="animate-fade-in text-center p-8 z-10 bg-black/60 backdrop-blur-md rounded-3xl border border-white/5 w-full h-full flex flex-col justify-center">
                            <h2 className="text-3xl font-black text-white italic uppercase mb-2 tracking-tighter">SECURE LOG_IN</h2>
                            <div className="mb-6 max-h-[140px] overflow-y-auto scrollbar-hide"><HighScoreTable entries={highScores} title="RUNNER" /></div>
                            <div className="grid grid-cols-4 gap-2 mb-8 px-4">
                                {[1,2,3,4,5,6,7].map(s => <button key={s} onClick={() => initSector(s)} className="py-3 bg-zinc-900 border border-white/10 text-zinc-500 rounded-xl font-black italic text-xs hover:border-pulse-500 hover:text-white transition-all">S_{s}</button>)}
                            </div>
                            <button onClick={() => initSector(1)} className="mx-8 py-4 bg-pulse-600 text-white font-black uppercase italic rounded-2xl shadow-xl hover:scale-105 transition-all border-2 border-pulse-400">Establish Link</button>
                        </div>
                    )}

                    {gameState === 'STORY_BEAT' && (
                        <div className="animate-fade-in p-10 text-center z-10 w-full h-full flex flex-col items-center justify-center bg-black">
                            <div className="mb-10 relative">
                                {sector === 1 && <div className="arcade-silhouette"><div className="arcade-screen static-noise"><div className="absolute inset-0 flex items-center justify-center"><span className="text-[8px] text-red-500 font-black animate-pulse uppercase">CRITICAL_FAILURE</span></div></div></div>}
                                {sector === 2 && <div className="flex flex-col items-center gap-4"><div className="flex gap-4">{[1,2,3].map(i => <div key={i} className="w-8 h-4 border-2 border-zinc-700 rounded-full" />)}</div><div className="w-24 h-16 bg-signal-500/20 blur-xl rounded-full animate-pulse border border-signal-500" /></div>}
                                {sector === 3 && <div className="w-1 h-32 bg-red-600 shadow-[0_0_30px_red] animate-pulse" />}
                                {sector === 4 && <div className="grid grid-cols-2 gap-2 bg-zinc-900 p-3 rounded-lg border-2 border-zinc-800">{[1,2,3,4].map(i => <div key={i} className="w-10 h-8 bg-purple-950/40 border border-purple-500/30" />)}</div>}
                                {sector === 5 && <div className="w-24 h-32 bg-zinc-900 border-4 border-zinc-800 flex flex-col gap-2 p-2 shadow-[0_0_20px_rgba(59,130,246,0.2)]">{[1,2,3,4].map(i => <div key={i} className="w-full h-2 bg-blue-500/20" />)}</div>}
                                {sector === 6 && <div className="text-[10px] text-zinc-600 font-mono space-y-1"><div className="animate-pulse">0x00FF88 ERROR</div><div className="opacity-50">SEGMENT_FAULT</div><div className="text-zinc-500 italic">SYSTEM_RECOVERY_MODE</div></div>}
                                {sector === 7 && <div className="octagon-eye"><div className="octagon-pupil" /></div>}
                            </div>
                            <span className="text-[10px] font-black text-pulse-500 uppercase tracking-widest block mb-2 font-mono italic">Incoming Intel: {SECTOR_INTEL[sector-1].title}</span>
                            <p className="text-[11px] text-zinc-300 leading-relaxed font-mono uppercase italic mb-10 tracking-wider max-w-xs">{SECTOR_INTEL[sector-1].Intel}</p>
                            <button onClick={() => setGameState('PLAYING')} className="px-10 py-4 bg-white text-black rounded-full font-black uppercase italic tracking-widest shadow-xl hover:bg-signal-500 transition-colors">Begin Sector Sync</button>
                        </div>
                    )}

                    {(gameState === 'PLAYING' || gameState === 'DYING') && <canvas ref={canvasRef} width={380} height={420} className="w-full h-full outline-none" tabIndex={0} />}

                    {gameState === 'SECTOR_CLEAR' && (
                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in"><div className="text-center"><h2 className="text-5xl font-black text-signal-500 italic uppercase tracking-tighter mb-2">SECTOR SYNCED</h2><p className="text-white font-mono text-[10px] uppercase tracking-[0.5em] animate-pulse">Initializing Next Node...</p></div></div>
                    )}

                    {(gameState === 'WON' || gameState === 'LOST') && (
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6 text-center">
                            <div className={`max-w-sm w-full bg-zinc-900 p-12 rounded-[3rem] border-4 ${gameState === 'WON' ? 'border-signal-500 shadow-[0_0_100px_rgba(34,197,94,0.3)]' : 'border-pulse-500 shadow-[0_0_100px_rgba(225,29,72,0.23)]'}`}>
                                {gameState === 'WON' && <div className="mb-10 flex flex-col items-center"><div className="lowpoly-sun mb-6" /><h2 className="text-4xl font-black italic uppercase tracking-tighter mb-4 text-signal-500">SYNC SUCCESS</h2><p className="text-zinc-500 font-bold uppercase tracking-widest text-[9px] mb-8 italic leading-relaxed">{SECTOR_INTEL[7].Intel}</p></div>}
                                {gameState === 'LOST' && <><h2 className="text-4xl font-black italic uppercase tracking-tighter mb-4 text-pulse-500">LINK SEVERED</h2><p className="text-zinc-500 font-bold uppercase tracking-widest text-[9px] mb-8 italic leading-relaxed">Sentinels have isolated your node.</p></>}
                                <div className="mb-10"><p className="text-zinc-500 font-black uppercase tracking-[0.3em] text-[9px] mb-4">Post Signal Initials</p><input autoFocus maxLength={3} value={initials} onChange={e => setInitials(e.target.value.toUpperCase())} className="bg-black/50 border-2 border-pulse-500 text-white rounded-xl px-4 py-3 text-center text-3xl font-black w-36 outline-none uppercase italic" placeholder="???" /></div>
                                <button onClick={() => { saveHighScore('void_runner', { name: initials.toUpperCase() || "???", score, displayValue: `${score} DATA`, date: new Date().toISOString() }); setGameState('INTRO'); setScore(0); setSector(1); }} className="w-full py-5 bg-pulse-600 text-white font-black text-xl italic uppercase rounded-full hover:scale-105 transition-transform shadow-xl">Transmit Record</button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="md:hidden mt-2 pb-10">
                    <GameboyControls onButtonPress={handleInput} onButtonRelease={() => {}} />
                </div>
            </div>
        </main>
    );
};

export default VoidRunnerPage;
