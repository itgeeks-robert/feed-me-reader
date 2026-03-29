import React, { useMemo, useState } from 'react';
import { WalkieTalkieIcon, ControllerIcon, RadioIcon, EntityIcon, KeypadIcon, SparklesIcon, ListIcon, CpuChipIcon, BoltIcon, StarIcon, XIcon, SearchIcon } from './icons';
import { ScoreCategory } from '../services/highScoresService';
import ContextualIntel from './ContextualIntel';

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

const GameHubPage: React.FC<any> = (props) => {
    const { onSelect, favoriteGameIds, onBack } = props;
    const [filter, setFilter] = useState<'all' | 'logic' | 'arcade'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Defensive check for favoriteGameIds to ensure it's always a Set
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
            {/* App Store Style Header */}
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

                {/* Search Bar */}
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

                {/* Categories */}
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
                {/* Featured Section - Horizontal Scroll */}
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

                {/* Discovery List - Compact Rows */}
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

export default GameHubPage;