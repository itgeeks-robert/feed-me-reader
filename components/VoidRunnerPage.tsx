import React, { useState, useEffect, useRef, useCallback } from 'react';
import { XIcon, SparklesIcon, VoidIcon, BookOpenIcon, ExclamationTriangleIcon } from './icons';
import { GameboyControls, GameboyButton } from './GameboyControls';
import { saveHighScore, getHighScores, HighScoreEntry } from '../services/highScoresService';
import { soundService } from '../services/soundService';
import HighScoreTable from './HighScoreTable';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'NONE';
type GameState = 'INTRO' | 'STORY_BEAT' | 'PLAYING' | 'DYING' | 'SECTOR_CLEAR' | 'WON' | 'LOST';

interface Entity {
    x: number;
    y: number;
    dir: Direction;
    nextDir: Direction;
    isMoving: boolean;
}

interface Ghost {
    id: number;
    x: number;
    y: number;
    dir: Direction;
    color: string;
    state: 'HOUSE' | 'EXITING' | 'FRIGHTENED' | 'SCATTER' | 'CHASE';
    exitDelay: number;
    scatterTarget: { x: number, y: number };
}

const TILE_SIZE = 20;
const BASE_SPEED = 1.25; 
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
    { title: "Local Network", Intel: "Silhouette of an 80s arcade cabinet. Red static fills the screen.", color: "#ef4444" },
    { title: "Sub-station 02", Intel: "BMX bikes on a hill. Sickly green glow under heavy digital mist.", color: "#22c55e" },
    { title: "Void Gateway", Intel: "A vertical tear in reality pulsing with crimson light.", color: "#be123c" },
    { title: "Recon Dataset", Intel: "CRT monitors stacked, displaying purple maps and scrolling data.", color: "#a855f7" },
    { title: "Firebase Zero", Intel: "Direct access to the 1 Supercomputer. Mainframe at critical limit.", color: "#3b82f6" },
    { title: "The Wasteland", Intel: "Broken code, segment errors, and legacy graveyard systems.", color: "#71717a" },
    { title: "The Core", Intel: "Face the GEOMETRIC EYE. A pulsing octagon of red light.", color: "#f43f5e" },
    { title: "Total System", Intel: "Heroic low-poly sunrise. The red static is gone.", color: "#fbbf24" }
];

const RunnerGraphic: React.FC = () => (
    <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 bg-pulse-500/10 rounded-full animate-ping" />
        <div className="absolute inset-4 bg-pulse-500/20 rounded-full animate-pulse" />
        <div className="relative z-10 p-6 bg-zinc-900 rounded-[2rem] border-4 border-pulse-500 shadow-[0_0_30px_rgba(225,29,72,0.4)]">
            <VoidIcon className="w-14 h-14 text-white" />
        </div>
        <div className="absolute -bottom-2 -right-2 text-[6px] font-mono text-pulse-500 uppercase tracking-widest animate-pulse font-black italic">PATHFINDER_v2</div>
    </div>
);

const ManualPoint: React.FC<{ title: string; desc: string; color: string }> = ({ title, desc, color }) => (
    <div className="space-y-2 group">
        <h4 className={`text-[9px] font-black ${color} uppercase tracking-[0.3em] italic flex items-center gap-2`}>
            <span className={`w-1.5 h-1.5 rounded-full ${color.replace('text-', 'bg-')} group-hover:scale-150 transition-transform`}></span>
            {title}
        </h4>
        <p className="text-[10px] md:text-xs text-zinc-300 font-bold uppercase tracking-wide leading-relaxed pl-3 border-l border-zinc-800">{desc}</p>
    </div>
);

const TacticalManual: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-10 font-mono" onClick={onClose}>
        <div className="max-w-xl w-full bg-zinc-900 border-4 border-pulse-500 rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <header className="h-12 bg-pulse-600 flex items-center justify-between px-4 border-b-2 border-black shrink-0">
                <div className="flex items-center gap-2 h-full"><BookOpenIcon className="w-4 h-4 text-black" /><h2 className="text-white text-[10px] font-black uppercase tracking-[0.2em] italic">PATH_RECON_PROTOCOLS.PDF</h2></div>
                <button onClick={onClose} className="hover:scale-110 transition-transform"><XIcon className="w-5 h-5 text-black"/></button>
            </header>
            <div className="p-8 md:p-12 overflow-y-auto bg-black relative flex-grow scrollbar-hide">
                <div className="absolute inset-0 pointer-events-none opacity-5 cctv-overlay" />
                <section className="space-y-8 relative z-10">
                    <div><h3 className="text-lg font-black text-white italic uppercase tracking-tighter mb-4 flex items-center gap-3"><SparklesIcon className="w-5 h-5 text-pulse-500"/> Sector Navigation</h3><p className="text-[10px] text-zinc-400 uppercase font-black leading-relaxed tracking-wider border-l-2 border-pulse-500 pl-4">Navigate the network architecture to collect all data packets while avoiding sentinel interceptors.</p></div>
                    <div className="space-y-6">
                        <ManualPoint title="0x01_Packet_Sync" desc="Collect all small data bits in a sector to stabilize the node and advance to the next frequency." color="text-pulse-500" />
                        <ManualPoint title="0x02_Core_Breach" desc="Large red nodes grant temporary sentinel vulnerability. Use this window to purge interceptors from the local rail." color="text-pulse-500" />
                        <ManualPoint title="0x03_Thermal_Drift" desc="Sentinels follow predictable logic loops until triggered. Use the tunnel junctions for rapid cross-sector repositioning." color="text-pulse-500" />
                    </div>
                </section>
            </div>
            <footer className="p-4 bg-zinc-300 border-t-2 border-black shrink-0"><button onClick={onClose} className="w-full py-4 bg-pulse-600 text-white text-[10px] font-black uppercase italic shadow-lg active:scale-95">Confirm Protocols</button></footer>
        </div>
    </div>
);

const VoidRunnerPage: React.FC<{ onBackToHub: () => void; onReturnToFeeds: () => void; onCollectPacket?: () => void }> = ({ onBackToHub, onCollectPacket }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<GameState>('INTRO');
    const [score, setScore] = useState(0);
    const [sector, setSector] = useState(1);
    const [highScores, setHighScores] = useState<HighScoreEntry[]>([]);
    const [initials, setInitials] = useState("");
    const [isFrightened, setIsFrightened] = useState(false);
    const [showScores, setShowScores] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    
    const requestRef = useRef<number | undefined>(undefined);
    const gameData = useRef({
        player: { x: 9 * TILE_SIZE, y: 15 * TILE_SIZE, dir: 'NONE', nextDir: 'NONE', isMoving: false } as Entity,
        ghosts: [] as Ghost[],
        maze: [] as number[][],
        frightenedTimer: 0,
        packetsRemaining: 0,
        packetsCollected: 0,
        deathTimer: 0,
        bonus: null as { x: number, y: number, type: 'BURGER' | 'SHAKE', timer: number } | null,
        modeTimer: 0,
        currentMode: 'SCATTER' as 'SCATTER' | 'CHASE',
        activeInputKeys: new Set<string>()
    });

    useEffect(() => { setHighScores(getHighScores('void_runner')); }, [gameState]);

    useEffect(() => {
        if (gameState === 'INTRO') {
            const interval = setInterval(() => {
                setShowScores(prev => !prev);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [gameState]);

    const isWall = (tx: number, ty: number) => {
        const row = gameData.current.maze[ty];
        if (!row) return true;
        const cell = row[tx];
        return cell === 1 || cell === 4; 
    };

    const getValidDirs = (x: number, y: number, currentDir: Direction): Direction[] => {
        const tx = Math.round(x / TILE_SIZE);
        const ty = Math.round(y / TILE_SIZE);
        const res: Direction[] = [];
        const opp: Record<Direction, Direction> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT', NONE: 'NONE' };
        
        const directions: {dir: Direction, dx: number, dy: number}[] = [
            {dir: 'UP', dx: 0, dy: -1},
            {dir: 'DOWN', dx: 0, dy: 1},
            {dir: 'LEFT', dx: -1, dy: 0},
            {dir: 'RIGHT', dx: 1, dy: 0}
        ];

        directions.forEach(({dir, dx, dy}) => {
            if (dir === opp[currentDir]) return;
            if (!isWall(tx + dx, ty + dy)) res.push(dir);
        });
        
        return res;
    };

    const initSector = useCallback((s: number) => {
        setSector(s);
        if (s === 8) { setGameState('WON'); return; }
        gameData.current.maze = JSON.parse(JSON.stringify(MAZE_LAYOUT));
        gameData.current.player = { x: 9 * TILE_SIZE, y: 15 * TILE_SIZE, dir: 'NONE', nextDir: 'NONE', isMoving: false };
        
        gameData.current.ghosts = [
            { id: 1, x: 9 * TILE_SIZE, y: 7 * TILE_SIZE, dir: 'LEFT', color: '#ef4444', state: 'CHASE', exitDelay: 0, scatterTarget: { x: 18, y: 0 } }, 
            { id: 2, x: 9 * TILE_SIZE, y: 9 * TILE_SIZE, dir: 'UP', color: '#ec4899', state: 'HOUSE', exitDelay: 60, scatterTarget: { x: 0, y: 0 } },  
            { id: 3, x: 8 * TILE_SIZE, y: 9 * TILE_SIZE, dir: 'UP', color: '#06b6d4', state: 'HOUSE', exitDelay: 180, scatterTarget: { x: 18, y: 20 } }, 
            { id: 4, x: 10 * TILE_SIZE, y: 9 * TILE_SIZE, dir: 'UP', color: '#fbbf24', state: 'HOUSE', exitDelay: 300, scatterTarget: { x: 0, y: 20 } }  
        ];
        
        let count = 0; MAZE_LAYOUT.forEach(row => row.forEach(cell => { if (cell === 0 || cell === 3) count++; }));
        gameData.current.packetsRemaining = count; gameData.current.packetsCollected = 0; gameData.current.bonus = null;
        gameData.current.modeTimer = 0; gameData.current.currentMode = 'SCATTER' as any; gameData.current.activeInputKeys.clear();
        setIsFrightened(false); gameData.current.frightenedTimer = 0;
        setGameState('STORY_BEAT');
    }, []);

    const update = useCallback(() => {
        const { player, ghosts, maze, bonus } = gameData.current;
        const currentSpeed = BASE_SPEED + (sector * 0.08);
        const pAligned = Math.abs(player.x % TILE_SIZE) < currentSpeed && Math.abs(player.y % TILE_SIZE) < currentSpeed;
        const tx = Math.round(player.x / TILE_SIZE);
        const ty = Math.round(player.y / TILE_SIZE);

        if (player.nextDir !== 'NONE') {
            const opp: Record<Direction, Direction> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT', NONE: 'NONE' };
            if (player.nextDir === opp[player.dir]) { player.dir = player.nextDir; } 
            else if (pAligned) {
                let canTurn = false;
                if (player.nextDir === 'UP') canTurn = !isWall(tx, ty - 1);
                else if (player.nextDir === 'DOWN') canTurn = !isWall(tx, ty + 1);
                else if (player.nextDir === 'LEFT') canTurn = !isWall(tx - 1, ty);
                else if (player.nextDir === 'RIGHT') canTurn = !isWall(tx + 1, ty);
                
                if (canTurn) {
                    player.dir = player.nextDir;
                    player.x = tx * TILE_SIZE;
                    player.y = ty * TILE_SIZE;
                }
            }
        }

        if (player.isMoving && player.dir !== 'NONE') {
            let blocked = false;
            if (pAligned) {
                const nextTx = player.dir === 'LEFT' ? tx - 1 : player.dir === 'RIGHT' ? tx + 1 : tx;
                const nextTy = player.dir === 'UP' ? ty - 1 : player.dir === 'DOWN' ? ty + 1 : ty;
                blocked = isWall(nextTx, nextTy);
                
                if (blocked) { 
                    player.dir = 'NONE'; 
                    player.x = tx * TILE_SIZE; 
                    player.y = ty * TILE_SIZE; 
                }
            }
            if (!blocked) {
                if (player.dir === 'UP') player.y -= currentSpeed;
                else if (player.dir === 'DOWN') player.y += currentSpeed;
                else if (player.dir === 'LEFT') player.x -= currentSpeed;
                else if (player.dir === 'RIGHT') player.x += currentSpeed;
            }
        }

        const curTx = Math.round(player.x / TILE_SIZE), curTy = Math.round(player.y / TILE_SIZE);
        if (maze[curTy]?.[curTx] === 0 || maze[curTy]?.[curTx] === 3) {
            const isPower = maze[curTy][curTx] === 3; maze[curTy][curTx] = 2;
            setScore(s => s + (isPower ? 50 : 10)); gameData.current.packetsRemaining--; gameData.current.packetsCollected++;
            onCollectPacket?.();
            soundService.playPop();

            if (isPower) { 
                soundService.playAction();
                setIsFrightened(true); 
                gameData.current.frightenedTimer = 480 - (sector * 30); 
                ghosts.forEach(g => { 
                    if(g.state !== 'HOUSE' && g.state !== 'EXITING') {
                        g.state = 'FRIGHTENED'; 
                        const opp: Record<Direction, Direction> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT', NONE: 'NONE' };
                        g.dir = opp[g.dir];
                    }
                }); 
            }
        }
        
        ghosts.forEach(ghost => {
            const speedMultiplier = 0.75 + (sector * 0.06); 
            const speed = (isFrightened && ghost.state === 'FRIGHTENED') ? (currentSpeed * 0.5) : (currentSpeed * speedMultiplier);
            const aligned = Math.abs(ghost.x % TILE_SIZE) < speed && Math.abs(ghost.y % TILE_SIZE) < speed;
            
            if ((ghost.state as string) === 'HOUSE') { 
                ghost.exitDelay--; 
                if (ghost.exitDelay <= 0) ghost.state = 'EXITING'; 
            } else if ((ghost.state as string) === 'EXITING') { 
                const gateX = 9 * TILE_SIZE; 
                const gateY = 7 * TILE_SIZE; 
                if (Math.abs(ghost.x - gateX) > 1) ghost.x += (ghost.x < gateX ? 1 : -1); 
                else if (ghost.y > gateY) ghost.y -= 1; 
                else { 
                    ghost.x = gateX; ghost.y = gateY; 
                    ghost.state = isFrightened ? 'FRIGHTENED' : gameData.current.currentMode as any; 
                    ghost.dir = 'LEFT'; 
                } 
            } else {
                if (aligned) {
                    ghost.x = Math.round(ghost.x / TILE_SIZE) * TILE_SIZE; 
                    ghost.y = Math.round(ghost.y / TILE_SIZE) * TILE_SIZE;
                    const valid = getValidDirs(ghost.x, ghost.y, ghost.dir);
                    if (valid.length > 0) ghost.dir = valid[Math.floor(Math.random() * valid.length)];
                }
                if (ghost.dir === 'UP') ghost.y -= speed; 
                else if (ghost.dir === 'DOWN') ghost.y += speed; 
                else if (ghost.dir === 'LEFT') ghost.x -= speed; 
                else if (ghost.dir === 'RIGHT') ghost.x += speed;
            }

            const dist = Math.sqrt((player.x - ghost.x)**2 + (player.y - ghost.y)**2);
            if (dist < TILE_SIZE * 0.7 && (ghost.state as string) !== 'HOUSE' && (ghost.state as string) !== 'EXITING') { 
                if (isFrightened && ghost.state === 'FRIGHTENED') { 
                    soundService.playCorrect();
                    setScore(s => s + 200); 
                    ghost.state = 'HOUSE'; 
                    ghost.x = 9 * TILE_SIZE; 
                    ghost.y = 9 * TILE_SIZE; 
                    ghost.exitDelay = 120;
                } else { 
                    soundService.playWrong();
                    setGameState('DYING'); 
                    gameData.current.deathTimer = 60; 
                } 
            }
        });
    }, [isFrightened, sector, onCollectPacket]);

    const draw = useCallback((ctx: CanvasRenderingContext2D) => {
        const { player, ghosts, maze, deathTimer } = gameData.current;
        ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        maze.forEach((row, ty) => { row.forEach((cell, tx) => { 
            if (cell === 1) { 
                ctx.fillStyle = '#111'; ctx.fillRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE); 
                ctx.strokeStyle = SECTOR_INTEL[sector-1].color + '33'; ctx.strokeRect(tx * TILE_SIZE + 1, ty * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2); 
            } else if (cell === 0) { 
                ctx.fillStyle = SECTOR_INTEL[sector-1].color; ctx.beginPath(); ctx.arc(tx * TILE_SIZE + 10, ty * TILE_SIZE + 10, 2, 0, Math.PI*2); ctx.fill(); 
            } else if (cell === 3) { 
                ctx.fillStyle = '#e11d48'; ctx.beginPath(); ctx.arc(tx * TILE_SIZE + 10, ty * TILE_SIZE + 10, 5, 0, Math.PI*2); ctx.fill(); 
            } 
        }); });

        if (gameState === 'DYING') { 
            const s = deathTimer/60; 
            ctx.fillStyle = '#e11d48'; ctx.beginPath(); ctx.arc(player.x + 10, player.y + 10, 10 * s, 0, Math.PI*2); ctx.fill(); 
        } else { 
            ctx.fillStyle = SECTOR_INTEL[sector-1].color; ctx.shadowBlur = 15; ctx.shadowColor = SECTOR_INTEL[sector-1].color; 
            ctx.beginPath(); ctx.arc(player.x + 10, player.y + 10, 8, 0, Math.PI*2); ctx.fill(); 
            ctx.shadowBlur = 0; 
        }

        ghosts.forEach(g => { 
            const c = (isFrightened && g.state === 'FRIGHTENED') ? '#3b82f6' : g.color; 
            ctx.fillStyle = c; ctx.shadowBlur = 15; ctx.shadowColor = c; ctx.fillRect(g.x + 2, g.y + 2, 16, 16); 
            ctx.shadowBlur = 0; 
        });
    }, [isFrightened, sector, gameState]);

    useEffect(() => {
        const loop = () => {
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx) { 
                if (gameState === 'PLAYING') update(); 
                else if (gameState === 'DYING') { 
                    gameData.current.deathTimer--; 
                    if (gameData.current.deathTimer <= 0) {
                        soundService.playLoss();
                        setGameState('LOST'); 
                    }
                } 
                draw(ctx); 
            }
            requestRef.current = requestAnimationFrame(loop);
        };
        requestRef.current = requestAnimationFrame(loop);
        return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
    }, [gameState, update, draw]);

    const handleInputPress = useCallback((btn: GameboyButton) => {
        const { player } = gameData.current;
        if (btn === 'quit') { soundService.playWrong(); onBackToHub(); return; }
        if (btn === 'up') player.nextDir = 'UP';
        if (btn === 'down') player.nextDir = 'DOWN';
        if (btn === 'left') player.nextDir = 'LEFT';
        if (btn === 'right') player.nextDir = 'RIGHT';
        if (['up', 'down', 'left', 'right'].includes(btn)) {
            soundService.playClick();
            player.isMoving = true;
        }
        if (btn === 'start') { 
            soundService.playClick();
            if (gameState === 'INTRO') initSector(1); 
            else if (gameState === 'STORY_BEAT') setGameState('PLAYING'); 
            else if (gameState === 'WON' || gameState === 'LOST') { setGameState('INTRO'); setScore(0); setSector(1); } 
        }
    }, [gameState, initSector, onBackToHub]);

    const handleInputRelease = useCallback((btn: GameboyButton) => { 
        const { player } = gameData.current; 
        if (['up', 'down', 'left', 'right'].includes(btn)) { 
            player.isMoving = false; 
            player.nextDir = 'NONE'; 
        } 
    }, []);

    return (
        <main className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-4 pt-[calc(4rem+var(--safe-top))] font-mono overflow-y-auto scrollbar-hide">
            <style>{`
                .arcade-silhouette { width: 120px; height: 180px; background: #111; clip-path: polygon(0 20%, 10% 0, 90% 0, 100% 20%, 100% 100%, 0 100%); position: relative; border: 2px solid #333; }
                .arcade-screen { position: absolute; top: 25px; left: 10px; right: 10px; bottom: 80px; background: #000; overflow: hidden; }
                .octagon-eye { width: 100px; height: 100px; background: #f43f5e; clip-path: polygon(30% 0, 70% 0, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0 70%, 0 30%); display: flex; align-items: center; justify-content: center; animation: pulse-eye 2s infinite; }
                .octagon-pupil { width: 30px; height: 30px; background: black; clip-path: polygon(30% 0, 70% 0, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0 70%, 0 30%); }
                @keyframes pulse-eye { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.8; } }
            `}</style>

            <div className="max-w-xl w-full flex flex-col gap-4">
                <header className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-3xl border border-white/5 shadow-lg">
                    <div className="flex items-center gap-4">
                        <button onClick={() => { soundService.playWrong(); onBackToHub(); }} className="p-2 bg-zinc-800 rounded-xl text-zinc-400 hover:text-white border border-white/5 shadow-md"><XIcon className="w-6 h-6" /></button>
                        <div>
                             <span className="text-[10px] font-black text-pulse-500 uppercase tracking-[0.4em] italic block">Sector {sector}</span>
                             <h2 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">VOID RUNNER</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => { soundService.playClick(); setShowHelp(true); }} className="p-2 bg-zinc-800 rounded-xl text-zinc-400 hover:text-white border border-white/5"><BookOpenIcon className="w-6 h-6" /></button>
                        <div className="text-right">
                            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Data Intercept</span>
                            <span className="text-xl font-black italic text-signal-500 font-mono">{score}</span>
                        </div>
                    </div>
                </header>

                <div className="relative bg-black rounded-[2rem] border-4 border-zinc-900 shadow-2xl overflow-hidden aspect-[19/21] flex items-center justify-center">
                    {gameState === 'INTRO' && (
                        <div className="text-center p-8 z-10 bg-black/60 backdrop-blur-md rounded-3xl border border-white/5 w-full h-full flex flex-col justify-center animate-fade-in">
                            <h2 className="text-3xl font-black text-white italic uppercase mb-2 tracking-tighter">SECURE LOG_IN</h2>
                            <div className="h-[240px] flex items-center justify-center mb-6 overflow-hidden">
                                {showScores ? <HighScoreTable entries={highScores} title="RUNNER" /> : <RunnerGraphic />}
                            </div>
                            <div className="grid grid-cols-4 gap-2 mb-8 px-4">
                                {[1,2,3,4,5,6,7].map(s => <button key={s} onClick={() => { soundService.playClick(); initSector(s); }} className="py-3 bg-zinc-900 border border-white/10 text-zinc-500 rounded-xl font-black italic text-xs hover:border-pulse-500 hover:text-white">S_{s}</button>)}
                            </div>
                            <button onClick={() => { soundService.playClick(); initSector(1); }} className="w-full py-4 bg-pulse-600 text-white font-black uppercase italic rounded-2xl shadow-xl border-2 border-pulse-400">Establish Link</button>
                        </div>
                    )}

                    {gameState === 'STORY_BEAT' && (
                        <div className="p-10 text-center z-10 w-full h-full flex flex-col items-center justify-center bg-black animate-fade-in">
                            <div className="mb-10">
                                {sector === 1 && <div className="arcade-silhouette"><div className="arcade-screen flex items-center justify-center"><span className="text-[8px] text-red-500 font-black animate-pulse">CRITICAL_FAILURE</span></div></div>}
                                {sector === 7 && <div className="octagon-eye"><div className="octagon-pupil" /></div>}
                            </div>
                            <span className="text-[10px] font-black text-pulse-500 uppercase block mb-2 font-mono italic">Incoming Intel: {SECTOR_INTEL[sector-1].title}</span>
                            <p className="text-[11px] text-zinc-300 leading-relaxed font-mono uppercase italic mb-10 tracking-wider max-w-xs">{SECTOR_INTEL[sector-1].Intel}</p>
                            <button onClick={() => { soundService.playClick(); setGameState('PLAYING'); }} className="px-10 py-4 bg-white text-black rounded-full font-black uppercase italic shadow-xl">Begin Sector Sync</button>
                        </div>
                    )}

                    {(gameState === 'PLAYING' || gameState === 'DYING') && <canvas ref={canvasRef} width={380} height={420} className="w-full h-full" />}

                    {gameState === 'SECTOR_CLEAR' && (
                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
                            <h2 className="text-5xl font-black text-signal-500 italic uppercase">SECTOR SYNCED</h2>
                        </div>
                    )}

                    {(gameState === 'WON' || gameState === 'LOST') && (
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6 text-center">
                            <div className={`max-w-sm w-full bg-zinc-900 p-12 rounded-[3rem] border-4 ${gameState === 'WON' ? 'border-signal-500' : 'border-pulse-500'}`}>
                                <h2 className="text-4xl font-black italic uppercase mb-4 text-white">{gameState === 'WON' ? 'SYNC SUCCESS' : 'LINK SEVERED'}</h2>
                                <input autoFocus maxLength={3} value={initials} onChange={e => setInitials(e.target.value.toUpperCase())} className="bg-black/50 border-2 border-pulse-500 text-white rounded-xl px-4 py-4 text-center text-3xl font-black w-36 outline-none mb-10" placeholder="???" />
                                <button onClick={() => { soundService.playClick(); saveHighScore('void_runner', { name: initials || "???", score, displayValue: `${score} DATA`, date: new Date().toISOString() }); setGameState('INTRO'); setScore(0); setSector(1); }} className="w-full py-5 bg-pulse-600 text-white font-black text-xl italic uppercase rounded-full">Transmit Record</button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="md:hidden mt-2 pb-10">
                    <GameboyControls onButtonPress={handleInputPress} onButtonRelease={handleInputRelease} />
                </div>
            </div>
            {showHelp && <TacticalManual onClose={() => { soundService.playClick(); setShowHelp(false); }} />}
        </main>
    );
};

export default VoidRunnerPage;