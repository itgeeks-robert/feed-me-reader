
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { XIcon, SparklesIcon } from './icons';
import { GameboyControls, GameboyButton } from './GameboyControls';
import { saveHighScore } from '../services/highScoresService';

// --- Types & Constants ---
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'NONE';
type GhostMode = 'CHASE' | 'SCATTER' | 'FRIGHTENED' | 'EATEN';
type GameState = 'INTRO' | 'STORY' | 'PLAYING' | 'WON' | 'LOST' | 'FINAL';

const TILE_SIZE = 16; 
const PLAYER_SPEED = 2; 

// Mode Durations (Frames at ~60fps)
const SCATTER_DUR = 7 * 60;
const CHASE_DUR = 20 * 60;
const TRAIL_LENGTH = 5;

interface TrailPos { x: number; y: number; opacity: number; }

interface Ghost {
    x: number;
    y: number;
    color: string;
    dir: Direction;
    mode: GhostMode;
    personality: 'BLINKY' | 'PINKY' | 'INKY' | 'CLYDE';
    startX: number;
    startY: number;
    trail: TrailPos[];
}

const LEVELS = [
    {
        story: "The Signal first appeared in the maintenance levels. Our drones were consumed. Collect the data spores before interference becomes permanent.",
        art: <div className="w-full h-full flex items-center justify-center text-4xl">📡</div>
    },
    {
        story: "The Spores have reached residential sectors. Walls pulse with frequency hums. Ghosts of the old network wander the corridors.",
        art: <div className="w-full h-full flex items-center justify-center text-4xl">🏙️</div>
    },
    {
        story: "The Core is failing. The Void is physical. This is the last transmission. Collect the packets and get out.",
        art: <div className="w-full h-full flex items-center justify-center text-4xl">🧠</div>
    },
    {
        story: "Phase 4: Data Compression. The bandwidth is narrowing. Speed is critical.",
        art: <div className="w-full h-full flex items-center justify-center text-4xl">💾</div>
    },
    {
        story: "Phase 5: Sub-Routine Breach. The sentinels are aggressive.",
        art: <div className="w-full h-full flex items-center justify-center text-4xl">📼</div>
    },
    {
        story: "Phase 6: Logic Inversion. Gravity is failing. Hold the signal.",
        art: <div className="w-full h-full flex items-center justify-center text-4xl">💠</div>
    },
    {
        story: "Final Phase: The Core Eye is open. Blind it with the data stream.",
        art: <div className="w-full h-full flex items-center justify-center text-4xl">👁️</div>
    },
    {
        story: "Signal Terminated. Hawkins is restored. Exit simulation.",
        art: <div className="w-full h-full flex items-center justify-center text-4xl">☀️</div>
    }
];

const MAZE = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,2,1],
    [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
    [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
    [1,1,1,1,0,1,1,1,3,1,3,1,1,1,0,1,1,1,1],
    [3,3,3,1,0,1,3,3,3,3,3,3,3,1,0,1,3,3,3],
    [1,1,1,1,0,1,3,1,1,5,1,1,3,1,0,1,1,1,1],
    [3,3,3,3,0,3,3,1,3,3,3,1,3,3,0,3,3,3,3], // Tunnel row
    [1,1,1,1,0,1,3,1,1,1,1,1,3,1,0,1,1,1,1],
    [3,3,3,1,0,1,3,3,3,3,3,3,3,1,0,1,3,3,3],
    [1,1,1,1,0,1,3,1,1,1,1,1,3,1,0,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
    [1,2,0,1,0,0,0,0,0,3,0,0,0,0,0,1,0,2,1],
    [1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1],
    [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];
const ROWS = MAZE.length;
const COLS = MAZE[0].length;

const VoidRunnerPage: React.FC<{ onBackToHub: () => void; onReturnToFeeds: () => void }> = ({ onBackToHub }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<GameState>('INTRO');
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(0);
    const [lives, setLives] = useState(3);
    const [initials, setInitials] = useState("");

    const player = useRef({ x: 9 * TILE_SIZE, y: 15 * TILE_SIZE, dir: 'NONE' as Direction, nextDir: 'NONE' as Direction, ping: 0 });
    const ghosts = useRef<Ghost[]>([
        { x: 9 * TILE_SIZE, y: 7 * TILE_SIZE, color: '#ff0000', dir: 'LEFT', mode: 'SCATTER', personality: 'BLINKY', startX: 9, startY: 7, trail: [] },
        { x: 9 * TILE_SIZE, y: 9 * TILE_SIZE, color: '#ffb8ff', dir: 'UP', mode: 'SCATTER', personality: 'PINKY', startX: 9, startY: 9, trail: [] },
        { x: 8 * TILE_SIZE, y: 9 * TILE_SIZE, color: '#00ffff', dir: 'UP', mode: 'SCATTER', personality: 'INKY', startX: 8, startY: 9, trail: [] },
        { x: 10 * TILE_SIZE, y: 9 * TILE_SIZE, color: '#ffb852', dir: 'UP', mode: 'SCATTER', personality: 'CLYDE', startX: 10, startY: 9, trail: [] },
    ]);
    const dotsRef = useRef<boolean[][]>([]);
    const pelletsRef = useRef<boolean[][]>([]);
    const globalMode = useRef<GhostMode>('SCATTER');
    const modeTimer = useRef(0);
    const frightTimer = useRef(0);

    const isWall = useCallback((tx: number, ty: number, forPlayer = true) => {
        if (ty === 9 && (tx < 0 || tx >= COLS)) return false; 
        if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) return true;
        const cell = MAZE[ty][tx];
        // 5 is the ghost door. Player can never enter. Ghosts can only enter/exit if NOT Frightened or if Eaten.
        if (cell === 5) return forPlayer;
        return cell === 1;
    }, []);

    const resetPositions = useCallback(() => {
        player.current = { x: 9 * TILE_SIZE, y: 15 * TILE_SIZE, dir: 'NONE', nextDir: 'NONE', ping: 0 };
        ghosts.current.forEach(g => {
            g.x = g.startX * TILE_SIZE;
            g.y = g.startY * TILE_SIZE;
            g.dir = 'UP';
            g.mode = 'SCATTER';
            g.trail = [];
        });
        globalMode.current = 'SCATTER';
        modeTimer.current = 0;
        frightTimer.current = 0;
    }, []);

    const initBoard = useCallback(() => {
        dotsRef.current = MAZE.map(row => row.map(cell => cell === 0));
        pelletsRef.current = MAZE.map(row => row.map(cell => cell === 2));
        resetPositions();
    }, [resetPositions]);

    const startLevel = useCallback((idx: number) => {
        if (idx >= LEVELS.length) { setGameState('FINAL'); return; }
        setLevel(idx);
        initBoard();
        setGameState('PLAYING');
    }, [initBoard]);

    const getGhostTarget = (g: Ghost) => {
        const gtx = Math.round(g.x / TILE_SIZE);
        const gty = Math.round(g.y / TILE_SIZE);

        // Ghost House Exit Logic (Uniform for all starting in house)
        if (gty === 9 && gtx >= 8 && gtx <= 10) return { tx: 9, ty: 7 };
        if (gty === 8 && gtx === 9) return { tx: 9, ty: 7 };

        if (g.mode === 'EATEN') return { tx: 9, ty: 8 };
        if (g.mode === 'FRIGHTENED') return { tx: Math.floor(Math.random() * COLS), ty: Math.floor(Math.random() * ROWS) };
        
        const ptx = Math.floor(player.current.x / TILE_SIZE);
        const pty = Math.floor(player.current.y / TILE_SIZE);

        if (g.mode === 'SCATTER') {
            if (g.personality === 'BLINKY') return { tx: COLS - 2, ty: -2 };
            if (g.personality === 'PINKY') return { tx: 2, ty: -2 };
            if (g.personality === 'INKY') return { tx: COLS - 2, ty: ROWS + 2 };
            return { tx: 2, ty: ROWS + 2 };
        }

        if (g.personality === 'BLINKY') return { tx: ptx, ty: pty };
        if (g.personality === 'PINKY') {
            let tx = ptx, ty = pty;
            if (player.current.dir === 'UP') { tx -= 4; ty -= 4; }
            else if (player.current.dir === 'DOWN') ty += 4;
            else if (player.current.dir === 'LEFT') tx -= 4;
            else if (player.current.dir === 'RIGHT') tx += 4;
            return { tx, ty };
        }
        if (g.personality === 'CLYDE') {
            const dist = Math.sqrt((ptx - gtx)**2 + (pty - gty)**2);
            return dist > 8 ? { tx: ptx, ty: pty } : { tx: 2, ty: ROWS + 2 };
        }
        // INKY
        const blinky = ghosts.current[0];
        const btx = Math.round(blinky.x / TILE_SIZE);
        const bty = Math.round(blinky.y / TILE_SIZE);
        let vtx = ptx, vty = pty;
        if (player.current.dir === 'UP') { vtx -= 2; vty -= 2; }
        else if (player.current.dir === 'DOWN') vty += 2;
        else if (player.current.dir === 'LEFT') vtx -= 2;
        else if (player.current.dir === 'RIGHT') vtx += 2;
        return { tx: vtx + (vtx - btx), ty: vty + (vty - bty) };
    };

    useEffect(() => {
        if (gameState !== 'PLAYING') return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        let frameId: number;
        const loop = () => {
            if (frightTimer.current > 0) {
                frightTimer.current--;
                if (frightTimer.current === 0) ghosts.current.forEach(g => { if (g.mode === 'FRIGHTENED') g.mode = globalMode.current; });
            } else {
                modeTimer.current++;
                const limit = globalMode.current === 'SCATTER' ? SCATTER_DUR : CHASE_DUR;
                if (modeTimer.current > limit) {
                    globalMode.current = globalMode.current === 'SCATTER' ? 'CHASE' : 'SCATTER';
                    modeTimer.current = 0;
                    ghosts.current.forEach(g => { 
                        if (g.mode !== 'EATEN' && g.mode !== 'FRIGHTENED') g.mode = globalMode.current;
                        const opp: Record<Direction, Direction> = { UP:'DOWN', DOWN:'UP', LEFT:'RIGHT', RIGHT:'LEFT', NONE:'NONE'};
                        g.dir = opp[g.dir] || 'UP';
                    });
                }
            }

            // --- Player ---
            const p = player.current;
            p.ping = (p.ping + 0.05) % 1;
            
            // Check if player is near center for grid snapping and direction changes
            const ptx = Math.round(p.x / TILE_SIZE);
            const pty = Math.round(p.y / TILE_SIZE);
            const pAtCenter = Math.abs(p.x - ptx * TILE_SIZE) < PLAYER_SPEED && Math.abs(p.y - pty * TILE_SIZE) < PLAYER_SPEED;

            if (pAtCenter) {
                if (p.nextDir !== 'NONE') {
                    let ntx = ptx, nty = pty;
                    if (p.nextDir === 'UP') nty--; else if (p.nextDir === 'DOWN') nty++; else if (p.nextDir === 'LEFT') ntx--; else if (p.nextDir === 'RIGHT') ntx++;
                    if (!isWall(ntx, nty, true)) {
                        p.x = ptx * TILE_SIZE; p.y = pty * TILE_SIZE; // Snap
                        p.dir = p.nextDir;
                        p.nextDir = 'NONE';
                    }
                }
                
                let ftx = ptx, fty = pty;
                if (p.dir === 'UP') fty--; else if (p.dir === 'DOWN') fty++; else if (p.dir === 'LEFT') ftx--; else if (p.dir === 'RIGHT') ftx++;
                if (isWall(ftx, fty, true)) {
                    p.x = ptx * TILE_SIZE; p.y = pty * TILE_SIZE; // Snap
                    p.dir = 'NONE';
                }

                if (dotsRef.current[pty]?.[ptx]) {
                    dotsRef.current[pty][ptx] = false;
                    setScore(s => s + 10);
                }
                if (pelletsRef.current[pty]?.[ptx]) {
                    pelletsRef.current[pty][ptx] = false;
                    setScore(s => s + 50);
                    frightTimer.current = 480; 
                    ghosts.current.forEach(g => { if (g.mode !== 'EATEN') g.mode = 'FRIGHTENED'; });
                }
            }

            if (p.dir === 'UP') p.y -= PLAYER_SPEED;
            else if (p.dir === 'DOWN') p.y += PLAYER_SPEED;
            else if (p.dir === 'LEFT') p.x -= PLAYER_SPEED;
            else if (p.dir === 'RIGHT') p.x += PLAYER_SPEED;

            if (p.x < -TILE_SIZE/2) p.x = (COLS - 0.5) * TILE_SIZE;
            else if (p.x > (COLS - 0.5) * TILE_SIZE) p.x = -TILE_SIZE/2;

            // --- Ghosts ---
            const ghostBaseSpeed = 1.0 + (level * 0.15);
            
            ghosts.current.forEach(g => {
                let gs = ghostBaseSpeed;
                if (g.mode === 'FRIGHTENED') gs = ghostBaseSpeed * 0.6;
                if (g.mode === 'EATEN') gs = 4.0;

                const gtx = Math.round(g.x / TILE_SIZE);
                const gty = Math.round(g.y / TILE_SIZE);
                const gAtCenter = Math.abs(g.x - gtx * TILE_SIZE) < gs && Math.abs(g.y - gty * TILE_SIZE) < gs;

                if (gAtCenter) {
                    if (g.mode === 'EATEN' && gtx === 9 && gty === 8) g.mode = globalMode.current;

                    const target = getGhostTarget(g);
                    const dirs: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
                    const opp: Record<Direction, Direction> = { UP:'DOWN', DOWN:'UP', LEFT:'RIGHT', RIGHT:'LEFT', NONE:'NONE'};
                    
                    const valid = dirs.filter(d => {
                        if (d === opp[g.dir]) return false;
                        let nx = gtx, ny = gty;
                        if (d === 'UP') ny--; else if (d === 'DOWN') ny++; else if (d === 'LEFT') nx--; else if (d === 'RIGHT') nx++;
                        return !isWall(nx, ny, false);
                    });

                    if (valid.length > 0) {
                        valid.sort((a, b) => {
                            const dist = (dir: Direction) => {
                                let nx = gtx, ny = gty;
                                if (dir === 'UP') ny--; else if (dir === 'DOWN') ny++; else if (dir === 'LEFT') nx--; else if (dir === 'RIGHT') nx++;
                                return Math.sqrt((nx - target.tx)**2 + (ny - target.ty)**2);
                            };
                            return dist(a) - dist(b);
                        });
                        g.x = gtx * TILE_SIZE; g.y = gty * TILE_SIZE; // Snap to grid
                        g.dir = valid[0];
                    } else if (valid.length === 0) {
                        g.dir = opp[g.dir] || 'UP'; // Backtrack if stuck
                    }
                }

                if (g.dir === 'UP') g.y -= gs;
                else if (g.dir === 'DOWN') g.y += gs;
                else if (g.dir === 'LEFT') g.x -= gs;
                else if (g.dir === 'RIGHT') g.x += gs;

                if (g.x < -TILE_SIZE/2) g.x = (COLS - 0.5) * TILE_SIZE;
                else if (g.x > (COLS - 0.5) * TILE_SIZE) g.x = -TILE_SIZE/2;

                g.trail.unshift({ x: g.x, y: g.y, opacity: 0.5 });
                if (g.trail.length > TRAIL_LENGTH) g.trail.pop();
                g.trail = g.trail.map((t, i) => ({ ...t, opacity: 0.5 * (1 - i / TRAIL_LENGTH) }));

                // Collision
                const dx = Math.abs(g.x - p.x);
                const dy = Math.abs(g.y - p.y);
                if (dx < TILE_SIZE * 0.7 && dy < TILE_SIZE * 0.7) {
                    if (g.mode === 'FRIGHTENED') { 
                        g.mode = 'EATEN'; 
                        setScore(s => s + 200); 
                    } else if (g.mode !== 'EATEN') {
                        setLives(l => {
                            if (l <= 1) setGameState('LOST');
                            else resetPositions();
                            return l - 1;
                        });
                    }
                }
            });

            if (!dotsRef.current.flat().some(d => d)) {
                setGameState('STORY');
                setLevel(prev => prev + 1);
            }

            // --- Draw ---
            ctx.fillStyle = '#050101'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            MAZE.forEach((row, y) => row.forEach((cell, x) => {
                if (cell === 1) { 
                    ctx.strokeStyle = '#064e3b'; ctx.lineWidth = 1; 
                    ctx.strokeRect(x * TILE_SIZE + 2, y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                } else if (cell === 5) {
                    ctx.strokeStyle = '#222'; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.moveTo(x * TILE_SIZE, y * TILE_SIZE + TILE_SIZE/2); ctx.lineTo((x+1)*TILE_SIZE, y * TILE_SIZE + TILE_SIZE/2); ctx.stroke();
                }
                if (dotsRef.current[y][x]) { 
                    ctx.fillStyle = '#14532d'; 
                    ctx.fillRect(x * TILE_SIZE + TILE_SIZE/2 - 1, y * TILE_SIZE + TILE_SIZE/2 - 1, 2, 2);
                }
                if (pelletsRef.current[y][x]) {
                    ctx.fillStyle = (frightTimer.current % 30 < 15) ? '#fff' : '#22c55e';
                    ctx.beginPath(); ctx.arc(x * TILE_SIZE + TILE_SIZE/2, y * TILE_SIZE + TILE_SIZE/2, 3.5, 0, Math.PI*2); ctx.fill();
                }
            }));

            ghosts.current.forEach(g => {
                const drawAnomaly = (x: number, y: number, op: number, isTrail = false) => {
                    ctx.save();
                    ctx.translate(x + TILE_SIZE/2, y + TILE_SIZE/2);
                    ctx.globalAlpha = op;
                    
                    if (g.mode === 'EATEN') {
                        ctx.strokeStyle = '#00ff41'; ctx.strokeRect(-3, -3, 6, 6);
                    } else {
                        ctx.fillStyle = g.mode === 'FRIGHTENED' ? (frightTimer.current < 120 && frightTimer.current % 20 < 10 ? '#fff' : '#0000ff') : g.color;
                        if (!isTrail) {
                            ctx.shadowBlur = 10; ctx.shadowColor = ctx.fillStyle as string;
                        }
                        
                        const jitter = isTrail ? 0 : (Math.random() - 0.5) * 2;
                        ctx.beginPath();
                        for(let i=0; i<6; i++) {
                            const ang = (i/6)*Math.PI*2;
                            const r = 7 + (isTrail ? 0 : Math.random() * 2);
                            ctx.lineTo(Math.cos(ang)*r + jitter, Math.sin(ang)*r + jitter);
                        }
                        ctx.closePath(); ctx.fill();
                        
                        if (!isTrail) {
                            ctx.fillStyle = 'white'; ctx.beginPath(); 
                            const eyeX = g.dir === 'LEFT' ? -3 : g.dir === 'RIGHT' ? 3 : 0;
                            const eyeY = g.dir === 'UP' ? -3 : g.dir === 'DOWN' ? 3 : 0;
                            ctx.arc(eyeX, eyeY, 1.5, 0, Math.PI*2); ctx.fill();
                        }
                    }
                    ctx.restore();
                };
                g.trail.forEach(t => drawAnomaly(t.x, t.y, t.opacity, true));
                drawAnomaly(g.x, g.y, 1.0);
            });

            ctx.save(); ctx.translate(p.x + TILE_SIZE/2, p.y + TILE_SIZE/2);
            ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.stroke();
            ctx.beginPath(); ctx.arc(0, 0, 8 + p.ping * 8, 0, Math.PI*2);
            ctx.strokeStyle = `rgba(239, 68, 68, ${1 - p.ping})`; ctx.stroke();
            ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI*2); ctx.fill();
            ctx.restore();

            frameId = requestAnimationFrame(loop);
        };
        loop(); return () => cancelAnimationFrame(frameId);
    }, [gameState, level, isWall, initBoard, resetPositions]);

    const handleInput = useCallback((btn: GameboyButton, isPress: boolean) => {
        if (!isPress) return;
        if (btn === 'start') {
            if (gameState === 'INTRO') setGameState('STORY');
            else if (gameState === 'STORY') startLevel(level);
            else if (gameState === 'FINAL') onBackToHub();
        }
        if (btn === 'up') player.current.nextDir = 'UP';
        if (btn === 'down') player.current.nextDir = 'DOWN';
        if (btn === 'left') player.current.nextDir = 'LEFT';
        if (btn === 'right') player.current.nextDir = 'RIGHT';
    }, [gameState, level, onBackToHub, startLevel]);

    useEffect(() => {
        const keyMap: Record<string, GameboyButton> = {
            ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', Enter: 'start', z: 'a', x: 'b', ' ': 'a',
        };
        const onKeyDown = (e: KeyboardEvent) => {
            const btn = keyMap[e.key];
            if (btn) { e.preventDefault(); handleInput(btn, true); }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [handleInput]);

    const handleSaveScore = () => {
        saveHighScore('void_runner', {
            name: initials.toUpperCase() || "???",
            score: score,
            displayValue: score.toLocaleString(),
            date: new Date().toISOString()
        });
        onBackToHub();
    };

    return (
        <main className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-4 overflow-hidden font-mono pb-24 md:pb-4 relative">
            <style>{`
                .game-canvas { image-rendering: pixelated; box-shadow: 0 0 30px rgba(0, 255, 65, 0.1); border: 1px solid rgba(0, 255, 65, 0.1); }
                .crt::after { content: " "; display: block; position: absolute; top: 0; left: 0; bottom: 0; right: 0; background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.02), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.02)); z-index: 2; pointer-events: none; background-size: 100% 2px, 3px 100%; }
            `}</style>

            <div className="max-w-xl w-full flex flex-col gap-4">
                <header className="flex justify-between items-center bg-zinc-900/50 p-3 rounded-2xl border border-white/5 flex-shrink-0">
                    <button onClick={onBackToHub} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors">
                        <XIcon className="w-4 h-4" />
                        <span className="text-[7px] font-black uppercase tracking-widest hidden sm:inline">Abort</span>
                    </button>
                    <div className="text-center">
                        <span className="text-[8px] font-black uppercase text-plant-500 tracking-[0.2em] block">Signals</span>
                        <div className="flex items-center gap-1 justify-center mt-0.5">
                            {[1, 2, 3].map(i => <div key={i} className={`w-3 h-3 rounded-full ${lives >= i ? 'bg-pulse-500 shadow-[0_0_5px_#e11d48]' : 'bg-zinc-800'}`} />)}
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-[7px] font-black uppercase text-zinc-500 block">Sector</span>
                        <span className="text-sm font-black text-yellow-400 font-mono">{level + 1}</span>
                    </div>
                </header>

                <div className="relative flex justify-center bg-black p-2 rounded-2xl border-4 border-zinc-800 crt overflow-hidden min-h-[380px]">
                    {gameState === 'INTRO' && (
                        <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 gap-5 animate-fade-in bg-zinc-900/40 overflow-y-auto">
                            <div className="w-14 h-14 bg-zinc-800 border-2 border-plant-500 flex items-center justify-center rounded-full animate-pulse shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                                <SparklesIcon className="w-6 h-6 text-plant-500" />
                            </div>
                            <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">VOID RUNNER</h2>
                            <div className="w-full space-y-4">
                                <button onClick={() => setGameState('STORY')} className="w-full max-w-xs py-3 bg-plant-600 text-black font-black uppercase italic rounded-full shadow-lg border-b-2 border-plant-800">Establish Link</button>
                                <div className="space-y-2 mt-4">
                                    <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Select Sector</p>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {LEVELS.map((_, i) => (
                                            <button 
                                                key={i} 
                                                onClick={() => { setLevel(i); setGameState('STORY'); }}
                                                className={`aspect-square bg-zinc-900 border rounded-lg flex items-center justify-center text-[8px] font-black transition-all ${level === i ? 'border-plant-500 text-white' : 'border-white/5 text-zinc-600'}`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {gameState === 'STORY' && (
                        <div className="h-full w-full flex flex-col p-4 gap-4 text-center justify-center animate-fade-in bg-zinc-900/40">
                             <div className="w-full h-32 flex-shrink-0 opacity-80">{LEVELS[level % LEVELS.length].art}</div>
                             <div className="space-y-4">
                                <h3 className="text-[9px] font-black text-plant-500 uppercase tracking-widest italic">Intelligence Log: Sector {level + 1}</h3>
                                <p className="text-[9px] text-zinc-300 leading-relaxed font-mono uppercase tracking-wide px-4 italic">{LEVELS[level % LEVELS.length].story}</p>
                                <button onClick={() => startLevel(level)} className="px-6 py-2.5 bg-white text-black font-black uppercase italic text-[9px] rounded-full shadow-md">Begin Navigation</button>
                            </div>
                        </div>
                    )}

                    {gameState === 'PLAYING' && (
                        <div className="relative">
                            <canvas ref={canvasRef} width={COLS * TILE_SIZE} height={ROWS * TILE_SIZE} className="game-canvas max-w-full" />
                            <div className="absolute top-2 left-2 text-[6px] font-mono text-plant-500/50 uppercase tracking-widest pointer-events-none">
                                AZIMUTH: {Math.floor(player.current.x)} RANGE: {Math.floor(player.current.y)}
                            </div>
                        </div>
                    )}

                    {gameState === 'LOST' && (
                        <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 bg-zinc-900/90 animate-fade-in">
                            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-flesh-500 mb-2">SIGNAL LOST</h2>
                            <p className="text-zinc-500 font-bold uppercase tracking-widest text-[8px] mb-6">Simulation corrupted.</p>
                            <input autoFocus maxLength={3} value={initials} onChange={e => setInitials(e.target.value.toUpperCase())} className="bg-black/50 border-2 border-flesh-500 text-flesh-500 rounded-xl px-4 py-2 text-center text-2xl font-black w-24 outline-none uppercase italic mb-6 shadow-inner" placeholder="???" />
                            <button onClick={handleSaveScore} className="w-full max-w-xs py-3 bg-flesh-600 text-white font-black text-sm italic uppercase rounded-full shadow-lg">Post Records</button>
                        </div>
                    )}
                </div>

                <div className="md:hidden">
                    <GameboyControls onButtonPress={(btn) => handleInput(btn, true)} onButtonRelease={(btn) => handleInput(btn, false)} />
                </div>
            </div>
        </main>
    );
};

export default VoidRunnerPage;
