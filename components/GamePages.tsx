import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
    WalkieTalkieIcon, ControllerIcon, RadioIcon, EntityIcon, 
    KeypadIcon, SparklesIcon, ListIcon, CpuChipIcon, 
    BoltIcon, StarIcon, XIcon, SearchIcon, TrophyIcon,
    ArrowPathIcon, FlagIcon, BookOpenIcon,
    ExclamationTriangleIcon
} from './icons';
import { ScoreCategory, saveHighScore, getHighScores } from '../services/highScoresService';
import ContextualIntel from './ContextualIntel';
import { soundService } from '../services/soundService';
import { startGame, PieceType } from '../services/tetrisGame';
import HighScoreTable from './HighScoreTable';

/* ─────────────────────────────────────────────────
   GAME HUB PAGE
   ───────────────────────────────────────────────── */
interface GameInfo {
    id: string;
    title: string;
    protocol: string; 
    inspiredBy: string;
    description: string;
    icon: React.ReactElement<{ className?: string }>;
    cameraId: string;
    gameType: 'sudoku' | 'tetris' | 'minesweeper' | 'pacman' | 'wordle' | 'connections' | 'cards' | 'gyro' | 'hangman' | 'grid' | 'pool';
    scoreKey?: ScoreCategory;
    isDaily?: boolean;
    artStyle: string; 
    accentColor: string;
    glowColor: string;
}

export const GameHubPage: React.FC<any> = (props) => {
    const { onSelect, favoriteGameIds, onBack } = props;
    const [filter, setFilter] = useState<'all' | 'logic' | 'arcade'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const safeFavIds = useMemo(() => {
        if (favoriteGameIds instanceof Set) return favoriteGameIds;
        if (Array.isArray(favoriteGameIds)) return new Set(favoriteGameIds);
        return new Set<string>();
    }, [favoriteGameIds]);

    const games: GameInfo[] = [
        { 
            id: 'neon_signal', title: 'NEON SIGNAL', protocol: 'GYRO_SYNC', inspiredBy: 'Heads Up!',
            description: 'Physical modulation simulation. Tilt to transmit.',
            icon: <RadioIcon />, cameraId: 'FEED_01', gameType: 'gyro', scoreKey: 'neon_signal',
            accentColor: '#38bdf8', glowColor: '#0ea5e9', artStyle: 'bg-sky-950'
        },
        { 
            id: 'synapse_link', title: 'SYNAPSE LINK', protocol: 'LOGIC_CLUSTER', inspiredBy: 'Connections',
            description: 'Synaptic cluster analysis. Group related data nodes.',
            icon: <ListIcon />, cameraId: 'FEED_02', gameType: 'connections', scoreKey: 'synapse_link',
            accentColor: '#fbbf24', glowColor: '#f59e0b', artStyle: 'bg-amber-950'
        },
        { 
            id: 'cipher_core', title: 'CIPHER CORE', protocol: 'BIT_SEQUENCE', inspiredBy: 'Wordle',
            description: 'Daily signal decryption. Identify the 5-bit code.',
            icon: <WalkieTalkieIcon />, cameraId: 'FEED_03', gameType: 'wordle', isDaily: true,
            accentColor: '#10b981', glowColor: '#059669', artStyle: 'bg-emerald-950'
        },
        { 
            id: 'hangman', title: 'SIGNAL BREACH', protocol: 'CORE_SHIELD', inspiredBy: 'Hangman',
            description: 'Contain the core leak. Identify the breach sequence.',
            icon: <BoltIcon />, cameraId: 'FEED_04', gameType: 'hangman', scoreKey: 'hangman' as any,
            accentColor: '#f43f5e', glowColor: '#e11d48', artStyle: 'bg-rose-950'
        },
        { 
            id: 'pool', title: 'SIGNAL ALIGN', protocol: 'KINETIC_SYNC', inspiredBy: '8-Ball Pool',
            description: 'Orchestrate kinetic collisions to align data spheres.',
            icon: <SparklesIcon />, cameraId: 'FEED_11', gameType: 'pool', scoreKey: 'pool' as any,
            accentColor: '#06b6d4', glowColor: '#0891b2', artStyle: 'bg-cyan-950'
        },
        { 
            id: 'grid_reset', title: 'GRID RESET', protocol: 'MODULE_FLIP', inspiredBy: 'Lights Out',
            description: 'Manual node blackout. Toggle all nodes to zero.',
            icon: <CpuChipIcon />, cameraId: 'FEED_05', gameType: 'grid', scoreKey: 'grid_reset',
            accentColor: '#a78bfa', glowColor: '#8b5cf6', artStyle: 'bg-violet-950'
        },
        { 
            id: 'sudoku', title: 'PATTERN ZERO', protocol: 'GRID_LOGIC', inspiredBy: 'Sudoku',
            description: 'Mathematical grid stability. No duplicate signals.',
            icon: <KeypadIcon />, cameraId: 'FEED_06', gameType: 'sudoku', scoreKey: 'sudoku_medium',
            accentColor: '#22d3ee', glowColor: '#06b6d4', artStyle: 'bg-cyan-950'
        },
        { 
            id: 'void_runner', title: 'VOID RUNNER', protocol: 'PATH_RECON', inspiredBy: 'Pac-Man',
            description: 'Navigate sector architectures. Avoid the sentinels.',
            icon: <SparklesIcon />, cameraId: 'FEED_07', gameType: 'pacman', scoreKey: 'void_runner',
            accentColor: '#fcd34d', glowColor: '#fbbf24', artStyle: 'bg-yellow-950'
        },
        { 
            id: 'minesweeper', title: 'ANOMALY DETECTOR', protocol: 'HAZARD_ID', inspiredBy: 'Minesweeper',
            description: 'Isolate signal fractures. Avoid the traps.',
            icon: <EntityIcon />, cameraId: 'FEED_08', gameType: 'minesweeper', scoreKey: 'minesweeper_medium',
            accentColor: '#fb7185', glowColor: '#f43f5e', artStyle: 'bg-rose-950'
        },
        { 
            id: 'solitaire', title: 'SIGNAL ALIGN', protocol: 'DATA_STACK', inspiredBy: 'Solitaire',
            description: 'Sorting frequency packets. Stack in sequence.',
            icon: <RadioIcon />, cameraId: 'FEED_09', gameType: 'cards', scoreKey: 'solitaire',
            accentColor: '#e4e4e4', glowColor: '#71717a', artStyle: 'bg-zinc-900'
        },
        { 
            id: 'tetris', title: 'STACK TRACE', protocol: 'BUFFER_FILL', inspiredBy: 'Tetris',
            description: 'Consolidate data line buffers. Clear the lines.',
            icon: <ControllerIcon />, cameraId: 'FEED_10', gameType: 'tetris', scoreKey: 'tetris',
            accentColor: '#60a5fa', glowColor: '#3b82f6', artStyle: 'bg-blue-950'
        }
    ];

    const filteredGames = useMemo(() => {
        return games.filter(game => {
            const isLogic = ['synapse_link', 'cipher_core', 'sudoku', 'grid_reset'].includes(game.id);
            const matchesFilter = filter === 'all' || (filter === 'logic' && isLogic) || (filter === 'arcade' && !isLogic);
            const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 game.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                 game.inspiredBy.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesFilter && matchesSearch;
        });
    }, [games, filter, searchQuery]);

    const featuredGames = games.filter(g => ['neon_signal', 'pool', 'cipher_core'].includes(g.id));

    return (
        <div className="flex flex-col h-full bg-void-bg text-app-text overflow-hidden font-mono">
            <header className="px-6 pt-8 pb-4 flex flex-col gap-4 shrink-0 border-b border-white/5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase leading-none italic">ARCADE</h1>
                        <p className="text-[8px] font-bold opacity-40 uppercase tracking-[0.3em] mt-1">Void OS Store v3.1</p>
                    </div>
                    <button 
                        onClick={onBack}
                        className="w-10 h-10 rounded-full bg-app-card border border-white/10 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="relative group">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity w-4 h-4" />
                    <input 
                        type="text"
                        placeholder="Search simulations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-app-card border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold focus:border-app-accent/50 outline-none transition-all placeholder:opacity-30"
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {['all', 'logic', 'arcade'].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat as any)}
                            className={`px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
                                filter === cat 
                                ? 'bg-app-accent text-app-on-accent border-app-accent' 
                                : 'bg-transparent border-white/10 opacity-50 hover:opacity-100'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-32 pt-6 space-y-8">
                {searchQuery === '' && filter === 'all' && (
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-[10px] font-black uppercase tracking-widest italic opacity-60">Featured Signals</h2>
                        </div>
                        <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6 snap-x">
                            {featuredGames.map(game => (
                                <button 
                                    key={game.id}
                                    onClick={() => onSelect(game.id)}
                                    className="relative shrink-0 w-[80vw] max-w-[320px] aspect-[16/9] rounded-3xl overflow-hidden group cursor-pointer border border-white/5 snap-start shadow-2xl outline-none focus-visible:ring-2 focus-visible:ring-app-accent"
                                    aria-label={`Play ${game.title}`}
                                >
                                    <div className={`absolute inset-0 ${game.artStyle} opacity-90 group-hover:opacity-100 transition-opacity flex items-center justify-center`}>
                                        {React.cloneElement(game.icon, { className: "w-16 h-16 text-white/5 absolute -right-4 -bottom-4 rotate-12" })}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-5 flex flex-col justify-end text-left">
                                            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-app-accent mb-1">{game.protocol}</p>
                                            <h3 className="text-xl font-black text-white leading-none tracking-tighter uppercase italic">{game.title}</h3>
                                        </div>
                                    </div>
                                    <div className="absolute top-4 right-4">
                                        <div className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[8px] font-black uppercase italic rounded-full">GET</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-[10px] font-black uppercase tracking-widest italic opacity-60">
                            {searchQuery ? 'Search Results' : 'Discovery'}
                        </h2>
                    </div>
                    <div className="space-y-3">
                        {filteredGames.map(game => (
                            <button 
                                key={game.id}
                                onClick={() => onSelect(game.id)}
                                className="w-full flex items-center gap-4 p-3 rounded-2xl bg-app-card border border-white/5 hover:border-app-accent/30 transition-all cursor-pointer group shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-app-accent text-left"
                                aria-label={`Play ${game.title}`}
                            >
                                <div className={`w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-white/10 flex items-center justify-center ${game.artStyle}`}>
                                    {React.cloneElement(game.icon, { className: "w-6 h-6 text-white/40 group-hover:scale-110 transition-transform" })}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h3 className="font-black text-xs uppercase tracking-tight truncate">{game.title}</h3>
                                        <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${
                                            ['synapse_link', 'cipher_core', 'sudoku', 'grid_reset'].includes(game.id)
                                            ? 'bg-amber-500/20 text-amber-500'
                                            : 'bg-blue-500/20 text-blue-500'
                                        }`}>
                                            {['synapse_link', 'cipher_core', 'sudoku', 'grid_reset'].includes(game.id) ? 'Logic' : 'Arcade'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-[8px] font-bold opacity-40 uppercase tracking-widest">Protocol: {game.protocol}</p>
                                        <span className="w-1 h-1 rounded-full bg-white/10" />
                                        <p className="text-[8px] font-bold text-app-accent uppercase tracking-widest">Inspired by {game.inspiredBy}</p>
                                    </div>
                                    <p className="text-[10px] opacity-70 line-clamp-2 leading-tight">{game.description}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <div className="px-4 py-1.5 rounded-full bg-app-accent/10 text-app-accent text-[9px] font-black uppercase tracking-widest group-hover:bg-app-accent group-hover:text-app-on-accent transition-colors">
                                        GET
                                    </div>
                                    {safeFavIds.has(game.id) && <StarIcon className="w-2.5 h-2.5 text-yellow-500" filled />}
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                {filteredGames.length === 0 && (
                    <div className="py-20 text-center opacity-20">
                        <p className="text-xs font-black uppercase tracking-widest">No signals found in this sector</p>
                    </div>
                )}

                <ContextualIntel 
                    tipId="arcade_intel_v3" 
                    title="Neural Sync" 
                    content="Simulations are optimized for your current synaptic frequency. Signal integrity is monitored." 
                />
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────
   SUDOKU PAGE
   ───────────────────────────────────────────────── */
export const SudokuPage: React.FC<any> = ({ onBack }) => {
    const [grid, setGrid] = useState<number[][]>([]);
    const [initialGrid, setInitialGrid] = useState<number[][]>([]);
    const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
    const [isComplete, setIsComplete] = useState(false);
    const [timer, setTimer] = useState(0);
    const [isActive, setIsActive] = useState(false);

    const generateSudoku = useCallback((diff: string) => {
        const newGrid = Array(9).fill(0).map(() => Array(9).fill(0));
        const fillGrid = (g: number[][]) => {
            for (let i = 0; i < 81; i++) {
                const row = Math.floor(i / 9);
                const col = i % 9;
                if (g[row][col] === 0) {
                    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
                    for (const num of nums) {
                        if (isValid(g, row, col, num)) {
                            g[row][col] = num;
                            if (fillGrid(g)) return true;
                            g[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
            return true;
        };

        const isValid = (g: number[][], r: number, c: number, n: number) => {
            for (let i = 0; i < 9; i++) if (g[r][i] === n || g[i][c] === n) return false;
            const startRow = Math.floor(r / 3) * 3;
            const startCol = Math.floor(c / 3) * 3;
            for (let i = 0; i < 3; i++)
                for (let j = 0; j < 3; j++)
                    if (g[startRow + i][startCol + j] === n) return false;
            return true;
        };

        fillGrid(newGrid);
        const puzzle = newGrid.map(row => [...row]);
        const attempts = diff === 'easy' ? 30 : diff === 'medium' ? 45 : 55;
        for (let i = 0; i < attempts; i++) {
            const r = Math.floor(Math.random() * 9);
            const c = Math.floor(Math.random() * 9);
            puzzle[r][c] = 0;
        }
        return { puzzle, solution: newGrid };
    }, []);

    const startNewGame = (diff: 'easy' | 'medium' | 'hard') => {
        const { puzzle } = generateSudoku(diff);
        setGrid(puzzle);
        setInitialGrid(puzzle.map(r => [...r]));
        setDifficulty(diff);
        setIsComplete(false);
        setTimer(0);
        setIsActive(true);
        setSelectedCell(null);
        soundService.playAction();
    };

    useEffect(() => {
        startNewGame('medium');
    }, []);

    useEffect(() => {
        let interval: any;
        if (isActive && !isComplete) {
            interval = setInterval(() => setTimer(t => t + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isActive, isComplete]);

    const handleCellClick = (r: number, c: number) => {
        if (initialGrid[r][c] === 0) {
            setSelectedCell([r, c]);
            soundService.playTick();
        }
    };

    const handleNumberInput = (num: number) => {
        if (selectedCell && !isComplete) {
            const [r, c] = selectedCell;
            const newGrid = grid.map(row => [...row]);
            newGrid[r][c] = num === newGrid[r][c] ? 0 : num;
            setGrid(newGrid);
            soundService.playTick();
            
            if (checkCompletion(newGrid)) {
                setIsComplete(true);
                setIsActive(false);
                saveHighScore(`sudoku_${difficulty}` as any, {
                    name: "???",
                    score: timer,
                    displayValue: `${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}`,
                    date: new Date().toISOString()
                });
                soundService.playSuccess();
            }
        }
    };

    const checkCompletion = (g: number[][]) => {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (g[r][c] === 0) return false;
                const val = g[r][c];
                g[r][c] = 0;
                const valid = isValidForCheck(g, r, c, val);
                g[r][c] = val;
                if (!valid) return false;
            }
        }
        return true;
    };

    const isValidForCheck = (g: number[][], r: number, c: number, n: number) => {
        for (let i = 0; i < 9; i++) if (g[r][i] === n || g[i][c] === n) return false;
        const startRow = Math.floor(r / 3) * 3;
        const startCol = Math.floor(c / 3) * 3;
        for (let i = 0; i < 3; i++)
            for (let j = 0; j < 3; j++)
                if (g[startRow + i][startCol + j] === n) return false;
        return true;
    };

    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="h-full flex flex-col bg-zinc-950 text-white font-mono p-4 md:p-8 overflow-y-auto no-scrollbar">
            <header className="flex justify-between items-center mb-8 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-all"><XIcon className="w-6 h-6" /></button>
                    <div>
                        <h2 className="text-xl font-black italic uppercase tracking-tighter leading-none">PATTERN ZERO</h2>
                        <p className="text-[8px] font-bold text-cyan-500 uppercase tracking-widest mt-1">Difficulty: {difficulty}</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Elapsed_Time</p>
                        <p className="text-xl font-black italic text-cyan-400 leading-none">{formatTime(timer)}</p>
                    </div>
                    <button onClick={() => startNewGame(difficulty)} className="p-3 bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-all"><ArrowPathIcon className="w-6 h-6" /></button>
                </div>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center gap-8 min-h-0 py-4">
                <div className="grid grid-cols-9 border-4 border-zinc-800 bg-zinc-900 shadow-2xl rounded-xl overflow-hidden max-w-md w-full aspect-square">
                    {grid.map((row, r) => row.map((val, c) => (
                        <button
                            key={`${r}-${c}`}
                            onClick={() => handleCellClick(r, c)}
                            className={`
                                aspect-square flex items-center justify-center text-sm md:text-lg font-black transition-all
                                ${c % 3 === 2 && c !== 8 ? 'border-r-2 border-zinc-700' : 'border-r border-zinc-800'}
                                ${r % 3 === 2 && r !== 8 ? 'border-b-2 border-zinc-700' : 'border-b border-zinc-800'}
                                ${initialGrid[r][c] !== 0 ? 'bg-zinc-800/50 text-zinc-500' : 'bg-transparent text-cyan-400'}
                                ${selectedCell?.[0] === r && selectedCell?.[1] === c ? 'bg-cyan-500/20 ring-2 ring-inset ring-cyan-500 z-10' : ''}
                                hover:bg-zinc-800
                            `}
                        >
                            {val !== 0 ? val : ''}
                        </button>
                    )))}
                </div>

                <div className="grid grid-cols-5 md:grid-cols-9 gap-2 w-full max-w-md">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button
                            key={num}
                            onClick={() => handleNumberInput(num)}
                            className="aspect-square bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-lg font-black hover:bg-cyan-500 hover:text-black transition-all active:scale-90"
                        >
                            {num}
                        </button>
                    ))}
                </div>
            </div>

            {isComplete && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                    <div className="w-24 h-24 bg-cyan-500 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(34,211,238,0.5)]">
                        <TrophyIcon className="w-12 h-12 text-black" />
                    </div>
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">GRID_STABILIZED</h2>
                    <p className="text-zinc-400 uppercase tracking-widest text-xs mb-8">Pattern recognition complete in {formatTime(timer)}</p>
                    <div className="flex gap-4">
                        <button onClick={() => startNewGame(difficulty)} className="px-8 py-4 bg-cyan-500 text-black font-black uppercase italic text-xs tracking-widest rounded-xl">New Simulation</button>
                        <button onClick={onBack} className="px-8 py-4 bg-zinc-800 text-white font-black uppercase italic text-xs tracking-widest rounded-xl">Exit Arcade</button>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ─────────────────────────────────────────────────
   MINESWEEPER PAGE
   ───────────────────────────────────────────────── */
export const MinesweeperPage: React.FC<any> = ({ onBack }) => {
    const ROWS = 10;
    const COLS = 10;
    const MINES = 15;

    const [grid, setGrid] = useState<any[][]>([]);
    const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
    const [timer, setTimer] = useState(0);
    const [flagsUsed, setFlagsUsed] = useState(0);

    const initGrid = useCallback(() => {
        const newGrid = Array(ROWS).fill(0).map(() => Array(COLS).fill(0).map(() => ({
            isMine: false,
            isRevealed: false,
            isFlagged: false,
            neighborMines: 0
        })));

        let minesPlaced = 0;
        while (minesPlaced < MINES) {
            const r = Math.floor(Math.random() * ROWS);
            const c = Math.floor(Math.random() * COLS);
            if (!newGrid[r][c].isMine) {
                newGrid[r][c].isMine = true;
                minesPlaced++;
            }
        }

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (!newGrid[r][c].isMine) {
                    let count = 0;
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            const nr = r + dr, nc = c + dc;
                            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && newGrid[nr][nc].isMine) count++;
                        }
                    }
                    newGrid[r][c].neighborMines = count;
                }
            }
        }
        return newGrid;
    }, []);

    const startNewGame = () => {
        setGrid(initGrid());
        setGameState('playing');
        setTimer(0);
        setFlagsUsed(0);
        soundService.playAction();
    };

    useEffect(() => {
        startNewGame();
    }, []);

    useEffect(() => {
        let interval: any;
        if (gameState === 'playing') {
            interval = setInterval(() => setTimer(t => t + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [gameState]);

    const revealCell = (r: number, c: number) => {
        if (gameState !== 'playing' || grid[r][c].isRevealed || grid[r][c].isFlagged) return;

        const newGrid = [...grid.map(row => [...row])];
        if (newGrid[r][c].isMine) {
            setGameState('lost');
            revealAllMines(newGrid);
            soundService.playError();
        } else {
            floodFill(newGrid, r, c);
            setGrid(newGrid);
            soundService.playTick();
            if (checkWin(newGrid)) {
                setGameState('won');
                saveHighScore('minesweeper_medium', {
                    name: "???",
                    score: timer,
                    displayValue: `${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}`,
                    date: new Date().toISOString()
                });
                soundService.playSuccess();
            }
        }
    };

    const floodFill = (g: any[][], r: number, c: number) => {
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS || g[r][c].isRevealed || g[r][c].isMine) return;
        g[r][c].isRevealed = true;
        if (g[r][c].neighborMines === 0) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    floodFill(g, r + dr, c + dc);
                }
            }
        }
    };

    const toggleFlag = (e: React.MouseEvent, r: number, c: number) => {
        e.preventDefault();
        if (gameState !== 'playing' || grid[r][c].isRevealed) return;
        const newGrid = [...grid.map(row => [...row])];
        newGrid[r][c].isFlagged = !newGrid[r][c].isFlagged;
        setFlagsUsed(prev => newGrid[r][c].isFlagged ? prev + 1 : prev - 1);
        setGrid(newGrid);
        soundService.playTick();
    };

    const revealAllMines = (g: any[][]) => {
        g.forEach(row => row.forEach(cell => {
            if (cell.isMine) cell.isRevealed = true;
        }));
        setGrid(g);
    };

    const checkWin = (g: any[][]) => {
        return g.every(row => row.every(cell => cell.isMine || cell.isRevealed));
    };

    return (
        <div className="h-full flex flex-col bg-zinc-950 text-white font-mono p-4 md:p-8 overflow-y-auto no-scrollbar">
            <header className="flex justify-between items-center mb-8 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-all"><XIcon className="w-6 h-6" /></button>
                    <div>
                        <h2 className="text-xl font-black italic uppercase tracking-tighter leading-none">ANOMALY DETECTOR</h2>
                        <p className="text-[8px] font-bold text-rose-500 uppercase tracking-widest mt-1">Hazards: {MINES - flagsUsed}</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Time</p>
                        <p className="text-xl font-black italic text-rose-400 leading-none">{timer}s</p>
                    </div>
                    <button onClick={startNewGame} className="p-3 bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-all"><ArrowPathIcon className="w-6 h-6" /></button>
                </div>
            </header>

            <div className="flex-1 flex items-center justify-center min-h-0 py-4">
                <div className="grid grid-cols-10 gap-1 p-2 bg-zinc-900 rounded-2xl border-4 border-zinc-800 shadow-2xl max-w-md w-full aspect-square">
                    {grid.map((row, r) => row.map((cell, c) => (
                        <button
                            key={`${r}-${c}`}
                            onClick={() => revealCell(r, c)}
                            onContextMenu={(e) => toggleFlag(e, r, c)}
                            className={`
                                aspect-square rounded-lg flex items-center justify-center text-xs font-black transition-all
                                ${cell.isRevealed 
                                    ? cell.isMine ? 'bg-rose-600' : 'bg-zinc-800 text-zinc-400'
                                    : 'bg-zinc-700 hover:bg-zinc-600 shadow-[0_4px_0_rgba(0,0,0,0.3)] active:translate-y-1 active:shadow-none'}
                                ${cell.isFlagged ? 'text-rose-500' : ''}
                            `}
                        >
                            {cell.isRevealed 
                                ? cell.isMine ? <BoltIcon className="w-4 h-4" /> : cell.neighborMines || ''
                                : cell.isFlagged ? <FlagIcon className="w-4 h-4" /> : ''}
                        </button>
                    )))}
                </div>
            </div>

            {gameState !== 'playing' && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 shadow-2xl ${gameState === 'won' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-rose-500 shadow-rose-500/50'}`}>
                        {gameState === 'won' ? <TrophyIcon className="w-12 h-12 text-black" /> : <ExclamationTriangleIcon className="w-12 h-12 text-black" />}
                    </div>
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">{gameState === 'won' ? 'SECTOR_CLEARED' : 'BREACH_DETECTED'}</h2>
                    <p className="text-zinc-400 uppercase tracking-widest text-xs mb-8">{gameState === 'won' ? `Anomalies neutralized in ${timer}s` : 'System integrity compromised'}</p>
                    <div className="flex gap-4">
                        <button onClick={startNewGame} className="px-8 py-4 bg-zinc-100 text-black font-black uppercase italic text-xs tracking-widest rounded-xl">Retry Scan</button>
                        <button onClick={onBack} className="px-8 py-4 bg-zinc-800 text-white font-black uppercase italic text-xs tracking-widest rounded-xl">Exit Arcade</button>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ─────────────────────────────────────────────────
   SOLITAIRE PAGE
   ───────────────────────────────────────────────── */
export const SolitairePage: React.FC<any> = ({ onBack }) => {
    return (
        <div className="h-full flex flex-col bg-zinc-950 text-white font-mono p-4 md:p-8">
            <header className="flex justify-between items-center mb-8 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-all"><XIcon className="w-6 h-6" /></button>
                    <div>
                        <h2 className="text-xl font-black italic uppercase tracking-tighter leading-none">SIGNAL ALIGN</h2>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Protocol: DATA_STACK</p>
                    </div>
                </div>
            </header>
            <div className="flex-1 flex flex-col items-center justify-center opacity-20 text-center">
                <RadioIcon className="w-24 h-24 mb-6 animate-pulse" />
                <h3 className="text-xl font-black uppercase italic tracking-widest">Simulation_Loading</h3>
                <p className="text-[10px] uppercase mt-2">Calibrating frequency stacks...</p>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────
   TETRIS PAGE (STACK TRACE)
   ───────────────────────────────────────────────── */
const CircuitBackground: React.FC = () => (
    <div className="absolute inset-0 pointer-events-none opacity-10 overflow-hidden">
        <svg width="100%" height="100%" className="absolute inset-0">
            <defs>
                <pattern id="circuit-grid-tetris" width="80" height="80" patternUnits="userSpaceOnUse">
                    <path d="M 10 10 L 70 10 M 10 10 L 10 70" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-pulse-500/30" />
                    <circle cx="10" cy="10" r="1.5" fill="currentColor" className="text-pulse-500/50" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#circuit-grid-tetris)" />
        </svg>
    </div>
);

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

const ManualPoint: React.FC<{ title: string; desc: string; color: string }> = ({ title, desc, color }) => (
    <div className="space-y-2 group">
        <h4 className={`text-[9px] font-black ${color} uppercase tracking-[0.3em] italic flex items-center gap-2`}>
            <span className={`w-1.5 h-1.5 rounded-full ${color.replace('text-', 'bg-')} group-hover:scale-150 transition-transform`}></span>
            {title}
        </h4>
        <p className="text-[10px] md:text-xs text-zinc-300 font-bold uppercase tracking-wide leading-relaxed pl-3 border-l border-zinc-800">{desc}</p>
    </div>
);

const TacticalManual: React.FC<{ onClose: () => void; title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ onClose, title, icon, children }) => (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-10 font-mono" onClick={onClose}>
        <div className="max-w-xl w-full bg-zinc-900 border-4 border-pulse-500 rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <header className="h-12 bg-pulse-600 flex items-center justify-between px-4 border-b-2 border-black shrink-0">
                <div className="flex items-center gap-2 h-full">{icon}<h2 className="text-white text-[10px] font-black uppercase tracking-[0.2em] italic">{title}</h2></div>
                <button onClick={onClose} className="hover:scale-110 transition-transform"><XIcon className="w-5 h-5 text-black"/></button>
            </header>
            <div className="p-8 md:p-12 overflow-y-auto bg-black relative flex-grow scrollbar-hide">
                <div className="absolute inset-0 pointer-events-none opacity-5 cctv-overlay" />
                <section className="space-y-8 relative z-10">
                    {children}
                </section>
            </div>
            <footer className="p-4 bg-zinc-300 border-t-2 border-black shrink-0"><button onClick={onClose} className="w-full py-4 bg-pulse-600 text-white text-[10px] font-black uppercase italic shadow-lg active:scale-95">Confirm Protocols</button></footer>
        </div>
    </div>
);

export const TetrisPage: React.FC<any> = ({ onBackToHub }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const previewRef = useRef<HTMLCanvasElement>(null);
    const holdRef = useRef<HTMLCanvasElement>(null);
    const gameInstance = useRef<ReturnType<typeof startGame> | null>(null);

    const [view, setView] = useState<'IDLE' | 'BOOTING' | 'PLAYING'>('IDLE');
    const [bootLog, setBootLog] = useState<string[]>([]);
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

    const handleInitReboot = async () => {
        soundService.playAction();
        setView('BOOTING');
        setBootLog([]);
        const logs = [
            "> initializing stack_trace.bin",
            "> allocating buffer_memory[10][20]",
            "> mounting geometry_shaper v1.4",
            "> checking_thermal_limits... NOMINAL",
            "> clearing old_cache_residue...",
            "> SYSTEM_READY: AWAITING_STREAM"
        ];
        for(let i=0; i<logs.length; i++) {
            setBootLog(prev => [...prev, logs[i]]);
            soundService.playPop();
            await new Promise(r => setTimeout(r, 350));
        }
        handleRestart();
    };

    const handleRestart = useCallback(() => {
        gameInstance.current?.stop();
        setIsGameOver(false);
        setInitials("");
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
            case 'hold': controls.hold(); break;
            case 'start': handleRestart(); break;
            case 'quit': onBackToHub(); break;
        }
    };

    if (view === 'IDLE') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-6 overflow-y-auto scrollbar-hide font-mono relative">
                <CircuitBackground />
                <style>{`
                    @keyframes glitch-in {
                        0% { opacity: 0; transform: scale(0.9) skew(0deg); }
                        10% { opacity: 0.8; transform: scale(1.05) skew(5deg); filter: hue-rotate(90deg); }
                        20% { opacity: 1; transform: scale(1) skew(0deg); filter: hue-rotate(0deg); }
                    }
                    .animate-glitch-in { animation: glitch-in 0.4s ease-out forwards; }
                `}</style>
                
                <div className="w-full max-w-sm text-center bg-zinc-900 p-10 rounded-[3rem] border-4 border-pulse-500 shadow-[0_0_50px_rgba(225,29,72,0.1)] mb-6 z-10">
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
                        <button onClick={handleInitReboot} className="w-full py-5 bg-white text-black font-black uppercase italic rounded-2xl hover:scale-[1.02] transition-all shadow-xl active:scale-95 text-lg">REBOOT COMPILE_CORE</button>
                        <button onClick={() => setShowHelp(true)} className="w-full py-3 bg-zinc-800 text-zinc-400 font-black uppercase italic rounded-xl border border-white/5 hover:text-white transition-all active:scale-95 text-[10px] tracking-widest flex items-center justify-center gap-2">
                            <BookOpenIcon className="w-4 h-4" /> Tactical Manual
                        </button>
                        <button onClick={onBackToHub} className="text-zinc-500 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors pt-2 block w-full italic tracking-[0.2em]">Abort Sync</button>
                    </div>
                </div>
                {showHelp && (
                    <TacticalManual onClose={() => setShowHelp(false)} title="STACK_TRACE_PROTOCOLS.PDF" icon={<BookOpenIcon className="w-4 h-4 text-black" />}>
                        <div><h3 className="text-lg font-black text-white italic uppercase tracking-tighter mb-4 flex items-center gap-3"><SparklesIcon className="w-5 h-5 text-pulse-500"/> Buffer Consolidation</h3><p className="text-[10px] text-zinc-400 uppercase font-black leading-relaxed tracking-wider border-l-2 border-pulse-500 pl-4">The input stream is flooded with geometric data. You must clear line buffers by completing full horizontal sequences.</p></div>
                        <div className="space-y-6">
                            <ManualPoint title="0x01_Matrix_Rotation" desc="Use Spin_B to rotate current packet orientation. Essential for fitting complex data into the stack." color="text-pulse-500" />
                            <ManualPoint title="0x02_Forced_Commit" desc="Use Drop_A to hard-commit the packet to the stack immediately. Increases signal stability (Score)." color="text-pulse-500" />
                            <ManualPoint title="0x03_Buffer_Swap" desc="Store difficult packets in BUF_01 using Swap_Buffer. Retrieve them when a logical fit is detected." color="text-pulse-500" />
                        </div>
                    </TacticalManual>
                )}
            </div>
        );
    }

    if (view === 'BOOTING') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-black/90 p-8 text-left font-mono relative z-20">
                <div className="max-w-md w-full">
                    <div className="mb-8 flex items-center gap-4">
                        <CpuChipIcon className="w-10 h-10 text-pulse-500 animate-pulse" />
                        <span className="text-xl font-black text-white italic">REBOOT_CORE...</span>
                    </div>
                    <div className="space-y-2 border-l-2 border-pulse-500/30 pl-4 py-2 bg-zinc-950/50">
                        {bootLog.map((log, i) => (
                            <p key={i} className="text-[10px] md:text-xs text-pulse-500 font-black uppercase tracking-widest animate-fade-in">{log}</p>
                        ))}
                    </div>
                    <div className="mt-12 h-1 w-full bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-white/5">
                        <div className="h-full bg-pulse-500 animate-pulse" style={{ width: `${(bootLog.length / 6) * 100}%` }} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <main className="w-full h-full flex flex-col bg-zinc-950 text-white font-mono overflow-hidden relative pt-[calc(4rem+var(--safe-top))]">
            <CircuitBackground />
            <header className="flex justify-between items-center px-4 py-4 z-10 flex-shrink-0 bg-zinc-900 border-b-2 border-zinc-800">
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

            <div className="flex-grow flex items-center justify-center p-4 min-h-0 relative z-10">
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
            
            <div className="bg-zinc-900 border-t-4 border-black p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex-shrink-0 relative overflow-hidden z-20">
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

            {showHelp && (
                <TacticalManual onClose={() => setShowHelp(false)} title="STACK_TRACE_PROTOCOLS.PDF" icon={<BookOpenIcon className="w-4 h-4 text-black" />}>
                    <div><h3 className="text-lg font-black text-white italic uppercase tracking-tighter mb-4 flex items-center gap-3"><SparklesIcon className="w-5 h-5 text-pulse-500"/> Buffer Consolidation</h3><p className="text-[10px] text-zinc-400 uppercase font-black leading-relaxed tracking-wider border-l-2 border-pulse-500 pl-4">The input stream is flooded with geometric data. You must clear line buffers by completing full horizontal sequences.</p></div>
                    <div className="space-y-6">
                        <ManualPoint title="0x01_Matrix_Rotation" desc="Use Spin_B to rotate current packet orientation. Essential for fitting complex data into the stack." color="text-pulse-500" />
                        <ManualPoint title="0x02_Forced_Commit" desc="Use Drop_A to hard-commit the packet to the stack immediately. Increases signal stability (Score)." color="text-pulse-500" />
                        <ManualPoint title="0x03_Buffer_Swap" desc="Store difficult packets in BUF_01 using Swap_Buffer. Retrieve them when a logical fit is detected." color="text-pulse-500" />
                    </div>
                </TacticalManual>
            )}

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

/* ─────────────────────────────────────────────────
   CIPHER CORE PAGE (WORDLE)
   ───────────────────────────────────────────────── */
const MAX_ATTEMPTS = 6;
const FALLBACK_WORD = "FABLE";

const CipherGraphic: React.FC<{ isSynced: boolean }> = ({ isSynced }) => (
    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
        <div className={`absolute inset-0 ${isSynced ? 'bg-emerald-500/10' : 'bg-pulse-500/10'} rounded-full animate-ping`} />
        <div className={`absolute inset-4 ${isSynced ? 'bg-emerald-500/20' : 'bg-pulse-500/20'} rounded-full animate-pulse`} />
        <div className="relative z-10 p-8 bg-zinc-900 rounded-[2rem] border-4 border-pulse-500 shadow-[0_0_30px_rgba(225,29,72,0.4)]">
            <WalkieTalkieIcon className={`w-16 h-16 ${isSynced ? 'text-emerald-500' : 'text-pulse-500'}`} />
        </div>
        <div className="absolute -top-4 -left-4 text-[8px] font-mono text-pulse-500 uppercase tracking-widest animate-pulse font-black italic">
            {isSynced ? "GLOBAL_SYNC_LOCKED" : "ARCHIVE_MODE_ACTIVE"}
        </div>
    </div>
);

const GridResetManual: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-10 font-mono" onClick={onClose}>
        <div className="max-w-xl w-full bg-zinc-900 border-4 border-pulse-500 rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh] pt-[var(--safe-top)] pb-[var(--safe-bottom)]" onClick={e => e.stopPropagation()}>
            <header className="h-12 bg-pulse-600 flex items-center justify-between px-4 border-b-2 border-black shrink-0">
                <div className="flex items-center gap-2 h-full">
                    <BookOpenIcon className="w-4 h-4 text-black" />
                    <h2 className="text-white text-[10px] font-black uppercase tracking-[0.2em] italic">DECRYPTION_MANUAL.PDF</h2>
                </div>
                <button onClick={onClose} className="hover:scale-110 transition-transform"><XIcon className="w-5 h-5 text-black"/></button>
            </header>
            <div className="p-8 md:p-12 overflow-y-auto bg-void-950/40 relative flex-grow scrollbar-hide">
                <div className="absolute inset-0 pointer-events-none opacity-5 cctv-overlay" />
                <section className="space-y-8 relative z-10">
                    <div>
                        <h3 className="text-lg font-black text-white italic uppercase tracking-tighter mb-4 flex items-center gap-3"><SparklesIcon className="w-5 h-5 text-emerald-500"/> Frequency Intercept</h3>
                        <p className="text-[10px] text-zinc-400 uppercase font-black leading-relaxed tracking-wider border-l-2 border-pulse-500 pl-4">To stabilize the core, you must identify the 5-bit sequence. The system interrogates ScreenRant archive nodes to verify global consistency.</p>
                    </div>
                    <div className="space-y-6">
                        <GridResetManualPoint title="0x01_Logic_Protocol" desc="Only valid English 5-letter words will be processed. Binary noise or fragmented strings will result in a bit mismatch error." />
                        <GridResetManualPoint title="0x02_Color_Heuristics" desc="GREEN: Bit confirmed in correct node. PINK: Bit present but displaced. DARK: Frequency is absent from current transmission packet." />
                        <GridResetManualPoint title="0x03_The_Log_Transmission" desc="Successfully decoded sequences can be transmitted as a color-grid log (emoji) to your social network buffers." />
                    </div>
                    <div className="p-5 bg-pulse-500/10 border-2 border-pulse-500/30 rounded-2xl flex items-start gap-4 animate-pulse">
                        <ExclamationTriangleIcon className="w-6 h-6 text-pulse-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[9px] font-black text-pulse-500 uppercase italic mb-1">Warning: System Isolation</p>
                            <p className="text-[8px] text-zinc-500 uppercase font-bold leading-tight italic">Exceeding 6 logic faults will trigger a buffer lock. Verify your input before committing the frequency string.</p>
                        </div>
                    </div>
                </section>
            </div>
            <footer className="p-4 bg-zinc-300 border-t-2 border-black shrink-0">
                <button onClick={onClose} className="w-full py-4 bg-pulse-600 text-white text-[10px] font-black uppercase italic shadow-lg hover:bg-pulse-500 transition-colors active:scale-95">Acknowledge Protocols</button>
            </footer>
        </div>
    </div>
);

const GridResetManualPoint: React.FC<{ title: string; desc: string }> = ({ title, desc }) => (
    <div className="space-y-1">
        <h4 className="text-[9px] font-black text-emerald-500 uppercase tracking-widest italic">{title}</h4>
        <p className="text-[10px] text-zinc-300 font-bold uppercase leading-relaxed pl-3 border-l border-zinc-800">{desc}</p>
    </div>
);

export const CipherCorePage: React.FC<{
    onBackToHub: () => void;
    onWin?: () => void; 
    preloadedData?: { archiveMap: { date: string; word: string; label: string }[]; isSynced: boolean; loading: boolean };
}> = ({ onBackToHub, onWin, preloadedData }) => {
    // Sector Selection
    const [activeSector, setActiveSector] = useState(0); // 0 = Today
    
    // Game State
    const [gameState, setGameState] = useState<'syncing' | 'idle' | 'playing' | 'won' | 'lost'>('syncing');
    const [guesses, setGuesses] = useState<string[]>([]);
    const [currentGuess, setCurrentGuess] = useState("");
    const [shakeRow, setShakeRow] = useState<number | null>(null);
    const [isPosted, setIsPosted] = useState(false);
    const [initials, setInitials] = useState("");
    const [showCopySuccess, setShowCopySuccess] = useState(false);
    
    // UI State
    const [showHelp, setShowHelp] = useState(false);
    const [showScores, setShowScores] = useState(false);
    const [isGlobalSync, setIsGlobalSync] = useState(false);
    const [archiveMap, setArchiveMap] = useState<{ date: string; word: string; label: string }[]>([]);

    // Sync from props
    useEffect(() => {
        if (preloadedData && !preloadedData.loading) {
            setArchiveMap(preloadedData.archiveMap);
            setIsGlobalSync(preloadedData.isSynced);
            if (gameState === 'syncing') setGameState('idle');
        }
    }, [preloadedData, gameState]);

    const storageKey = useMemo(() => {
        const sectorDate = archiveMap[activeSector]?.date || new Date().toISOString().split('T')[0];
        return `void_cipher_v5_${sectorDate}`;
    }, [activeSector, archiveMap]);

    // Session Management
    useEffect(() => {
        if (gameState === 'playing' || gameState === 'won' || gameState === 'lost' || gameState === 'syncing') return;
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                setGuesses(data.guesses || []);
                setGameState(data.state || 'playing');
                setIsPosted(!!data.posted);
            } catch { setGuesses([]); setIsPosted(false); }
        } else {
            setGuesses([]);
            setIsPosted(false);
        }
    }, [storageKey, gameState]);

    const saveSession = useCallback((g: string[], s: string, p: boolean = false) => {
        localStorage.setItem(storageKey, JSON.stringify({ guesses: g, state: s, posted: p }));
    }, [storageKey]);

    const getStatus = (guess: string, i: number, sol: string) => {
        if (sol[i] === guess[i]) return 2; // Correct (Green)
        if (sol.includes(guess[i])) return 1; // Displaced (Pink)
        return 0; // Absent (Dark)
    };

    const handleKey = useCallback((key: string) => {
        if (gameState !== 'playing') return;
        const solution = archiveMap[activeSector]?.word;
        if (!solution) return;

        if (key === 'ENTER') {
            if (currentGuess.length !== 5) {
                setShakeRow(guesses.length);
                setTimeout(() => setShakeRow(null), 500);
                return;
            }
            
            const nextGuesses = [...guesses, currentGuess];
            let nextState: any = 'playing';
            if (currentGuess === solution) {
                nextState = 'won';
                if (onWin) onWin();
            } else if (nextGuesses.length >= MAX_ATTEMPTS) {
                nextState = 'lost';
            }
            setGuesses(nextGuesses);
            setCurrentGuess("");
            setGameState(nextState);
            saveSession(nextGuesses, nextState);
        } else if (key === 'BACKSPACE' || key === 'DEL') {
            setCurrentGuess(prev => prev.slice(0, -1));
        } else if (/^[A-Z]$/.test(key) && currentGuess.length < 5) {
            setCurrentGuess(prev => prev + key);
        }
    }, [currentGuess, guesses, gameState, activeSector, archiveMap, saveSession, onWin]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            handleKey(e.key.toUpperCase());
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [handleKey]);

    useEffect(() => {
        if (gameState === 'idle') {
            const interval = setInterval(() => {
                setShowScores(prev => !prev);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [gameState]);

    const handleTransmitLog = () => {
        const sol = archiveMap[activeSector].word;
        const grid = guesses.map(g => 
            Array.from({length: 5}, (_, i) => {
                const s = getStatus(g, i, sol);
                return s === 2 ? '🟩' : s === 1 ? '🟪' : '⬛';
            }).join('')
        ).join('\n');
        
        const text = `CIPHER CORE: SECTOR ${archiveMap[activeSector].label}\n${guesses.length}/${MAX_ATTEMPTS}\n\n${grid}\n\n[TRANSMISSION SEALED]`;
        navigator.clipboard.writeText(text);
        setShowCopySuccess(true);
        setTimeout(() => setShowCopySuccess(false), 2000);
    };

    const handleSaveScore = () => {
        if (isPosted) return;
        const sol = archiveMap[activeSector].word;
        const grid = guesses.map(g => Array.from({length: 5}, (_, i) => getStatus(g, i, sol)));
        saveHighScore('spore_crypt', {
            name: initials.toUpperCase() || "???",
            score: guesses.length,
            displayValue: `${guesses.length}/${MAX_ATTEMPTS} TRIES`,
            date: new Date().toISOString(),
            metadata: { sporeGrid: grid }
        }, true);
        setIsPosted(true);
        saveSession(guesses, gameState, true);
    };

    if (gameState === 'syncing') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-6 font-mono text-center">
                <div className="w-20 h-20 border-4 border-pulse-500 border-t-transparent rounded-full animate-spin mb-8 shadow-[0_0_40px_#e11d48]" />
                <p className="text-pulse-500 font-black uppercase italic tracking-widest animate-pulse text-lg">Finalizing Signal Intercept...</p>
                <p className="text-zinc-700 text-[10px] uppercase mt-4 tracking-[0.4em]">SYNC_MODE: CORE_PREFETCH</p>
            </div>
        );
    }

    if (gameState === 'idle') {
        return (
            <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-6 font-mono overflow-y-auto scrollbar-hide">
                <div className="w-full max-w-sm text-center bg-zinc-900 p-8 md:p-12 rounded-[3.5rem] border-4 border-pulse-500 shadow-2xl">
                    <header className="mb-10">
                        <div className={`inline-block px-3 py-1 rounded-sm border ${isGlobalSync ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-red-500/10 border-red-500/30 text-red-500'} text-[8px] font-black uppercase tracking-widest italic mb-4`}>
                            {isGlobalSync ? "UPLINK_STABLE: GLOBAL" : "UPLINK_FAIL: ARCHIVE_MODE"}
                        </div>
                        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none glitch-text">CIPHER CORE</h2>
                    </header>

                    <div className="h-[240px] flex items-center justify-center mb-10 overflow-hidden relative">
                        <div key={showScores ? 'scores' : 'graphic'} className="w-full animate-fade-in">
                            {showScores ? (
                                <HighScoreTable entries={getHighScores('spore_crypt')} title="CIPHER" />
                            ) : (
                                <CipherGraphic isSynced={isGlobalSync} />
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <button onClick={() => { setActiveSector(0); setGameState('playing'); }} className="w-full py-6 bg-white text-black font-black uppercase italic rounded-2xl shadow-xl hover:bg-pulse-500 hover:text-white transition-all text-xl">Establish Link</button>
                        
                        <div className="pt-6 border-t border-white/5">
                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-4 block italic">T-Minus Sectors (Archive)</span>
                            <div className="grid grid-cols-4 gap-2">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <button 
                                        key={i} 
                                        onClick={() => { setActiveSector(i); setGameState('playing'); }} 
                                        className="py-2.5 bg-zinc-800 border border-white/5 rounded-lg text-[10px] font-black text-zinc-500 hover:text-white hover:border-pulse-500 transition-all"
                                    >
                                        T-{i}
                                    </button>
                                ))}
                                <button onClick={() => setShowHelp(true)} className="py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-400 flex items-center justify-center hover:text-white transition-all"><BookOpenIcon className="w-4 h-4"/></button>
                            </div>
                        </div>

                        <button onClick={onBackToHub} className="text-zinc-600 font-bold uppercase tracking-[0.4em] text-[9px] pt-4 block w-full italic hover:text-terminal transition-colors">Abort Intercept</button>
                    </div>
                </div>
                {showHelp && <GridResetManual onClose={() => setShowHelp(false)} />}
            </div>
        );
    }

    const activeWord = archiveMap[activeSector]?.word || FALLBACK_WORD;

    return (
        <main className="w-full h-full bg-zinc-950 flex flex-col items-center p-4 overflow-y-auto scrollbar-hide font-mono">
            <style>{`
                @keyframes flip { 0% { transform: rotateX(0); } 45% { transform: rotateX(90deg); } 55% { transform: rotateX(90deg); } 100% { transform: rotateX(0); } }
                @keyframes shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-5px); } 40%, 80% { transform: translateX(5px); } }
                .bit-2 { background-color: #10b981; border-color: #10b981; color: black; }
                .bit-1 { background-color: #ec4899; border-color: #ec4899; color: white; }
                .bit-0 { background-color: #18181b; border-color: #27272a; color: #52525b; }
                .animate-flip { animation: flip 0.6s ease-in-out forwards; }
                .animate-shake { animation: shake 0.4s ease-in-out; }
            `}</style>

            <header className="w-full max-w-lg flex justify-between items-center mb-8 bg-zinc-900/50 p-4 rounded-3xl border border-white/5 shrink-0 mt-[var(--safe-top)]">
                <button onClick={() => setGameState('idle')} className="p-2 bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all"><XIcon className="w-6 h-6"/></button>
                <div className="text-center">
                    <span className="text-[10px] font-black uppercase text-pulse-500 tracking-[0.3em] italic">Sector: {archiveMap[activeSector]?.label || 'TODAY'}</span>
                    <h1 className="text-2xl font-black italic uppercase text-white tracking-tighter leading-none">CIPHER CORE</h1>
                </div>
                <button onClick={() => setShowHelp(true)} className="p-2 bg-zinc-800 rounded-xl text-zinc-400 hover:text-pulse-500 transition-all"><BookOpenIcon className="w-6 h-6"/></button>
            </header>

            <div className="flex flex-col items-center w-full max-w-lg pb-32">
                <div className="grid grid-rows-6 gap-2 mb-10">
                    {[...Array(MAX_ATTEMPTS)].map((_, r) => {
                        const guess = guesses[r] || (r === guesses.length ? currentGuess : "");
                        const isDone = r < guesses.length;
                        return (
                            <div key={r} className={`flex gap-2 ${shakeRow === r ? 'animate-shake' : ''}`}>
                                {[...Array(5)].map((_, c) => {
                                    const char = guess[c] || "";
                                    let cls = "border-zinc-800 bg-zinc-900/40 text-white";
                                    if (isDone) cls = `bit-${getStatus(guess, c, activeWord)} animate-flip`;
                                    else if (char) cls = "border-zinc-500 text-white scale-105 shadow-[0_0_15px_rgba(255,255,255,0.1)]";
                                    return <div key={c} className={`w-14 h-14 md:w-16 md:h-16 border-2 flex items-center justify-center text-2xl md:text-3xl font-black rounded-xl transition-all duration-300 ${cls}`} style={{ animationDelay: `${c * 100}ms` }}>{char}</div>;
                                })}
                            </div>
                        );
                    })}
                </div>

                {gameState === 'playing' ? (
                    <div className="w-full space-y-2 max-w-md">
                        {[
                            ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
                            ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
                            ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL']
                        ].map((row, i) => (
                            <div key={i} className="flex justify-center gap-1.5">
                                {row.map(k => (
                                    <button key={k} onClick={() => handleKey(k === 'DEL' ? 'BACKSPACE' : k)} className={`${k.length > 1 ? 'px-4 text-[10px]' : 'w-9 text-sm'} h-12 rounded-lg bg-zinc-800 text-zinc-300 font-black active:scale-90 transition-all border border-white/5 active:bg-zinc-700`}>{k}</button>
                                ))}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="w-full max-w-sm bg-zinc-900 p-8 rounded-[3rem] border-4 border-pulse-500 text-center animate-fade-in shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 pointer-events-none opacity-5 cctv-overlay" />
                        <div className="relative z-10">
                            <h2 className={`text-4xl font-black italic uppercase mb-6 ${gameState === 'won' ? 'text-emerald-500' : 'text-red-500'}`}>{gameState === 'won' ? 'DECODED' : 'SIG_LOSS'}</h2>
                            
                            {(gameState === 'lost' || gameState === 'won') && (
                                <div className="mb-8 p-6 bg-black/60 border border-white/5 rounded-2xl text-left">
                                    <p className="text-[10px] text-zinc-500 font-black uppercase mb-1">Final Result String</p>
                                    <p className="text-3xl font-black text-white italic tracking-widest uppercase mb-4">{activeWord}</p>
                                    <button 
                                        onClick={handleTransmitLog}
                                        className="w-full py-3 bg-white text-black font-black uppercase italic text-[10px] tracking-widest rounded-lg transition-all hover:bg-emerald-500 hover:text-white"
                                    >
                                        {showCopySuccess ? "PACKET_CLONED" : "TRANSMIT_GRID_LOG"}
                                    </button>
                                </div>
                            )}
                            
                            {gameState === 'won' && !isPosted && (
                                <div className="space-y-4 mb-4">
                                    <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest italic">Set Signal Identity</p>
                                    <input autoFocus maxLength={3} value={initials} onChange={e => setInitials(e.target.value.toUpperCase())} className="bg-black/50 border-2 border-emerald-500 text-white rounded-xl px-4 py-3 text-center text-2xl font-black w-32 outline-none uppercase italic" placeholder="???" />
                                    <button onClick={handleSaveScore} className="w-full py-5 bg-emerald-600 text-white font-black text-lg italic uppercase rounded-full shadow-xl hover:bg-emerald-500 transition-colors">Post Records</button>
                                </div>
                            )}
                            <button onClick={() => setGameState('idle')} className="w-full py-4 bg-zinc-800 text-zinc-400 font-black uppercase text-[10px] tracking-widest rounded-full hover:text-white border border-white/5 transition-colors">Return_to_Core</button>
                        </div>
                    </div>
                )}
            </div>
            {showHelp && <GridResetManual onClose={() => setShowHelp(false)} />}
        </main>
    );
};

/* ─────────────────────────────────────────────────
   VOID RUNNER PAGE (PAC-MAN)
   ───────────────────────────────────────────────── */
export const VoidRunnerPage: React.FC<any> = ({ onBackToHub }) => {
    const [gameState] = useState<'INTRO' | 'PLAYING' | 'DYING' | 'WON' | 'LOST'>('INTRO');
    const [score] = useState(0);
    const [sector] = useState(1);

    useEffect(() => {
        if (gameState === 'PLAYING') {
            // Game logic would go here
        }
    }, [gameState]);

    return (
        <div className="h-full flex flex-col bg-zinc-950 text-white font-mono p-4 md:p-8 overflow-hidden">
            <header className="flex justify-between items-center mb-8 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBackToHub} className="p-2 bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-all"><XIcon className="w-6 h-6" /></button>
                    <div>
                        <h2 className="text-xl font-black italic uppercase tracking-tighter leading-none">VOID RUNNER</h2>
                        <p className="text-[8px] font-bold text-yellow-500 uppercase tracking-widest mt-1">Sector: {sector}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Score</p>
                    <p className="text-xl font-black italic text-yellow-400 leading-none">{score}</p>
                </div>
            </header>
            <div className="flex-1 flex items-center justify-center bg-black rounded-3xl border-4 border-zinc-800 shadow-2xl relative overflow-hidden">
                <div className="text-center opacity-20">
                    <SparklesIcon className="w-24 h-24 mx-auto mb-4 animate-pulse" />
                    <p className="text-xs uppercase tracking-widest">Initializing Sector {sector}...</p>
                </div>
                <div className="absolute inset-0 pointer-events-none opacity-10 cctv-overlay" />
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────
   SYNAPSE LINK PAGE (CONNECTIONS)
   ───────────────────────────────────────────────── */
export const SynapseLinkPage: React.FC<any> = ({ onBackToHub }) => {
    return (
        <div className="h-full flex flex-col bg-zinc-950 text-white font-mono p-4 md:p-8 overflow-hidden">
            <header className="flex justify-between items-center mb-8 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBackToHub} className="p-2 bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-all"><XIcon className="w-6 h-6" /></button>
                    <div>
                        <h2 className="text-xl font-black italic uppercase tracking-tighter leading-none">SYNAPSE LINK</h2>
                        <p className="text-[8px] font-bold text-amber-500 uppercase tracking-widest mt-1">Protocol: LOGIC_CLUSTER</p>
                    </div>
                </div>
            </header>
            <div className="flex-1 flex flex-col items-center justify-center opacity-20 text-center">
                <ListIcon className="w-24 h-24 mb-6 animate-pulse" />
                <h3 className="text-xl font-black uppercase italic tracking-widest">Syncing_Synapses</h3>
                <p className="text-[10px] uppercase mt-2">Analyzing cluster patterns...</p>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────
   GRID RESET PAGE (LIGHTS OUT)
   ───────────────────────────────────────────────── */
export const GridResetPage: React.FC<any> = ({ onBackToHub }) => {
    return (
        <div className="h-full flex flex-col bg-zinc-950 text-white font-mono p-4 md:p-8 overflow-hidden">
            <header className="flex justify-between items-center mb-8 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBackToHub} className="p-2 bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-all"><XIcon className="w-6 h-6" /></button>
                    <div>
                        <h2 className="text-xl font-black italic uppercase tracking-tighter leading-none">GRID RESET</h2>
                        <p className="text-[8px] font-bold text-violet-500 uppercase tracking-widest mt-1">Protocol: MODULE_FLIP</p>
                    </div>
                </div>
            </header>
            <div className="flex-1 flex flex-col items-center justify-center opacity-20 text-center">
                <CpuChipIcon className="w-24 h-24 mb-6 animate-pulse" />
                <h3 className="text-xl font-black uppercase italic tracking-widest">Resetting_Grid</h3>
                <p className="text-[10px] uppercase mt-2">Calibrating node states...</p>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────
   HANGMAN PAGE (SIGNAL BREACH)
   ───────────────────────────────────────────────── */
export const HangmanPage: React.FC<any> = ({ onBackToHub }) => {
    return (
        <div className="h-full flex flex-col bg-zinc-950 text-white font-mono p-4 md:p-8 overflow-hidden">
            <header className="flex justify-between items-center mb-8 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBackToHub} className="p-2 bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-all"><XIcon className="w-6 h-6" /></button>
                    <div>
                        <h2 className="text-xl font-black italic uppercase tracking-tighter leading-none">SIGNAL BREACH</h2>
                        <p className="text-[8px] font-bold text-rose-500 uppercase tracking-widest mt-1">Protocol: CORE_SHIELD</p>
                    </div>
                </div>
            </header>
            <div className="flex-1 flex flex-col items-center justify-center opacity-20 text-center">
                <BoltIcon className="w-24 h-24 mb-6 animate-pulse" />
                <h3 className="text-xl font-black uppercase italic tracking-widest">Containing_Breach</h3>
                <p className="text-[10px] uppercase mt-2">Analyzing security layers...</p>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────
   NEON SIGNAL PAGE (GYRO)
   ───────────────────────────────────────────────── */
export const NeonSignalPage: React.FC<any> = ({ onBackToHub }) => {
    return (
        <div className="h-full flex flex-col bg-zinc-950 text-white font-mono p-4 md:p-8 overflow-hidden">
            <header className="flex justify-between items-center mb-8 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBackToHub} className="p-2 bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-all"><XIcon className="w-6 h-6" /></button>
                    <div>
                        <h2 className="text-xl font-black italic uppercase tracking-tighter leading-none">NEON SIGNAL</h2>
                        <p className="text-[8px] font-bold text-sky-500 uppercase tracking-widest mt-1">Protocol: GYRO_SYNC</p>
                    </div>
                </div>
            </header>
            <div className="flex-1 flex flex-col items-center justify-center opacity-20 text-center">
                <RadioIcon className="w-24 h-24 mb-6 animate-pulse" />
                <h3 className="text-xl font-black uppercase italic tracking-widest">Syncing_Signal</h3>
                <p className="text-[10px] uppercase mt-2">Calibrating gyro sensors...</p>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────
   POOL GAME PAGE
   ───────────────────────────────────────────────── */
export const PoolGamePage: React.FC<any> = ({ onBack }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score] = useState(0);

    // Simplified Pool Logic
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Basic render loop placeholder
        let frame = 0;
        const render = () => {
            frame = requestAnimationFrame(render);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Table
            ctx.fillStyle = '#064e3b';
            ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 10;
            ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

            // Pockets
            ctx.fillStyle = '#000';
            [ [20, 20], [canvas.width/2, 20], [canvas.width-20, 20],
              [20, canvas.height-20], [canvas.width/2, canvas.height-20], [canvas.width-20, canvas.height-20]
            ].forEach(([x, y]) => {
                ctx.beginPath();
                ctx.arc(x, y, 15, 0, Math.PI * 2);
                ctx.fill();
            });

            // Cue Ball
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(100, canvas.height/2, 8, 0, Math.PI * 2);
            ctx.fill();
        };

        render();
        return () => cancelAnimationFrame(frame);
    }, []);

    return (
        <div className="h-full flex flex-col bg-zinc-950 text-white font-mono p-4 md:p-8 overflow-hidden">
            <header className="flex justify-between items-center mb-8 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-all"><XIcon className="w-6 h-6" /></button>
                    <div>
                        <h2 className="text-xl font-black italic uppercase tracking-tighter leading-none">SIGNAL ALIGN</h2>
                        <p className="text-[8px] font-bold text-cyan-500 uppercase tracking-widest mt-1">Protocol: KINETIC_SYNC</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Score</p>
                        <p className="text-xl font-black italic text-cyan-400 leading-none">{score}</p>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex items-center justify-center bg-zinc-900 rounded-3xl border-4 border-zinc-800 shadow-2xl relative overflow-hidden">
                <canvas ref={canvasRef} width={800} height={400} className="w-full h-auto max-w-4xl cursor-crosshair" />
                <div className="absolute inset-0 pointer-events-none opacity-10 cctv-overlay" />
            </div>

            <footer className="mt-8 flex justify-between items-center bg-zinc-900/50 p-6 rounded-3xl border border-white/5 backdrop-blur-xl">
                <div className="flex gap-4">
                    <div className="px-4 py-2 bg-zinc-800 rounded-xl border border-white/5">
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Power</span>
                        <div className="w-32 h-2 bg-zinc-700 rounded-full overflow-hidden">
                            <div className="h-full bg-cyan-500 w-1/2" />
                        </div>
                    </div>
                </div>
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] italic">Drag to aim • Release to strike</p>
            </footer>
        </div>
    );
};
