
import React, { useMemo } from 'react';
import { WalkieTalkieIcon, ControllerIcon, RadioIcon, EntityIcon, KeypadIcon, SparklesIcon, XIcon, ListIcon, CpuChipIcon, TrophyIcon, BoltIcon } from './icons';
import { getHighScores, ScoreCategory } from '../services/highScoresService';

interface GameInfo {
    id: string;
    title: string;
    protocol: string; 
    description: string;
    icon: React.ReactElement<{ className?: string }>;
    bannerColor: string;
    isDaily?: boolean;
    scoreKey?: ScoreCategory;
}

const VHSCard: React.FC<{ game: GameInfo; onPlay: () => void; isHighlighted?: boolean }> = ({ game, onPlay, isHighlighted }) => {
    const badgeData = useMemo(() => {
        if (game.isDaily) {
            const today = new Date().toISOString().split('T')[0];
            const isDone = localStorage.getItem(`${game.id}_cleared_${today}`) === 'true' || localStorage.getItem(`${game.id === 'cipher_core' ? 'cipher_core' : 'hangman'}_${Math.floor(Date.now() / 86400000)}`);
            return {
                label: isDone ? 'SYNC_COMPLETE' : 'AWAITING_SYNC',
                active: !isDone,
                color: isDone ? 'text-emerald-500' : 'text-pulse-500',
                bg: isDone ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-pulse-500/20 border-pulse-500/40'
            };
        }
        
        if (game.scoreKey) {
            const top = getHighScores(game.scoreKey)[0];
            if (top) {
                const label = game.scoreKey.includes('sudoku') || game.scoreKey.includes('minesweeper') || game.scoreKey === 'solitaire' || game.scoreKey === 'synapse_link' 
                    ? `RECORD: ${top.displayValue}` 
                    : game.id === 'hangman' ? `MAX: ${top.displayValue}` : `PEAK: ${top.displayValue}`;
                return {
                    label: label.toUpperCase(),
                    active: true,
                    color: 'text-yellow-600 dark:text-yellow-400',
                    bg: 'bg-yellow-500/10 border-yellow-500/40'
                };
            }
        }

        return null;
    }, [game]);

    return (
        <div className={`group relative bg-void-900 border-2 ${isHighlighted ? 'border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.2)]' : 'border-zinc-200 dark:border-zinc-800'} hover:border-cyan-500 transition-all duration-300 h-[480px] shadow-[10px_10px_0px_#000] dark:shadow-[10px_10px_0px_black] hover:translate-x-[-2px] hover:translate-y-[-2px] flex flex-col`}>
            {isHighlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-500 text-white px-4 py-1 rounded-full text-[7px] font-black uppercase tracking-[0.3em] z-20 shadow-[0_0_15px_rgba(6,182,212,0.5)] animate-bounce">
                    High_Voltage
                </div>
            )}
            
            <div className="h-40 w-full bg-void-950 flex items-center justify-center relative overflow-hidden border-b-2 border-zinc-200 dark:border-zinc-800">
                <div className="absolute top-0 left-0 bg-pulse-500 text-white px-3 py-1 text-[8px] font-black uppercase font-mono tracking-widest">VOID-SIM</div>
                <div className={`opacity-20 group-hover:opacity-60 transition-all duration-700 ${isHighlighted ? 'text-cyan-500 scale-125 opacity-40' : 'text-zinc-400 dark:text-zinc-600'} scale-110`}>
                    {React.cloneElement(game.icon, { className: "w-24 h-24" })}
                </div>
                <div className={`absolute bottom-0 left-0 right-0 h-1 ${isHighlighted ? 'bg-cyan-500' : 'bg-pulse-500/30'} animate-pulse`}></div>
            </div>

            <div className="p-6 flex flex-col flex-grow justify-between bg-zinc-500/5 dark:bg-void-950/20">
                <div className="text-center">
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white italic uppercase tracking-tighter mb-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{game.title}</h3>
                    
                    <div className="inline-block px-2 py-0.5 bg-neon-500/10 border border-neon-500/30 mb-4">
                        <span className="text-[8px] font-black text-neon-600 dark:text-neon-400 uppercase tracking-widest font-mono">Protocol: {game.protocol}</span>
                    </div>

                    <p className="text-[10px] text-zinc-600 dark:text-zinc-500 uppercase font-bold tracking-widest font-mono leading-relaxed line-clamp-3 mx-auto max-w-[200px]">{game.description}</p>
                </div>

                <div className="flex flex-col items-center gap-5 mt-6">
                     {badgeData && (
                        <div className={`px-4 py-2 border-2 rounded-xl flex items-center gap-2 animate-fade-in ${badgeData.bg}`}>
                            <TrophyIcon className={`w-3 h-3 ${badgeData.color}`} />
                            <span className={`text-[8px] font-black tracking-[0.2em] italic ${badgeData.color}`}>
                                {badgeData.label}
                            </span>
                        </div>
                     )}

                     <button 
                        onClick={(e) => { e.stopPropagation(); onPlay(); }}
                        className={`w-[85%] py-5 bg-zinc-900 dark:bg-white text-white dark:text-black font-black uppercase italic text-sm tracking-[0.2em] rounded-2xl shadow-[6px_6px_0px_#e11d48] transition-all hover:bg-cyan-500 dark:hover:bg-cyan-400 dark:hover:text-black active:scale-90 active:bg-cyan-600 flex items-center justify-center gap-3 group/btn relative overflow-hidden`}
                     >
                        <SparklesIcon className="w-5 h-5 group-active/btn:animate-ping transition-transform" />
                        <span>Enter Simulation</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[scan_1.5s_infinite]" />
                     </button>
                </div>
            </div>
            
            <div className="absolute inset-0 pointer-events-none opacity-5 bg-gradient-to-tr from-transparent via-zinc-400 dark:via-white to-transparent" />
        </div>
    );
};

const GameHubPage: React.FC<any> = (props) => {
    const { credits, setShowShop, onSelect } = props;

    const games: GameInfo[] = [
        { 
            id: 'hangman', 
            title: 'SIGNAL BREACH', 
            protocol: 'Core Destabilization',
            description: 'Arcade containment simulation. Decrypt high-risk packets before core meltdown. Supports Dual Link.', 
            icon: <BoltIcon />, 
            bannerColor: 'from-pulse-950 to-void-900',
            scoreKey: 'hangman' as any
        },
        { 
            id: 'synapse_link', 
            title: 'SYNAPSE LINK', 
            protocol: 'Logical Association',
            description: 'Determine logical connections between fragmented nodes. Avoid synaptic overload.', 
            icon: <ListIcon />, 
            bannerColor: 'from-pulse-950 to-void-900',
            scoreKey: 'synapse_link'
        },
        { 
            id: 'grid_reset', 
            title: 'GRID RESET', 
            protocol: 'Module Recalibration',
            description: 'A hardware-level logic panel. Manually toggle nodes to reset the sector grid.', 
            icon: <CpuChipIcon />, 
            bannerColor: 'from-zinc-950 to-void-900',
            scoreKey: 'grid_reset'
        },
        { 
            id: 'cipher_core', 
            title: 'CIPHER CORE', 
            protocol: 'Word Decryption',
            description: 'Daily decryption ritual. Intercept the 5-bit sequence before the system locks.', 
            icon: <WalkieTalkieIcon />, 
            bannerColor: 'from-pulse-950 to-void-900',
            isDaily: true
        },
        { 
            id: 'sudoku', 
            title: 'PATTERN ZERO', 
            protocol: 'Logic Grid Analysis',
            description: 'A numeric logical cryptogram extracted from the mainframe core.', 
            icon: <KeypadIcon />, 
            bannerColor: 'from-zinc-950 to-void-900',
            scoreKey: 'sudoku_medium'
        },
        { 
            id: 'void_runner', 
            title: 'VOID RUNNER', 
            protocol: 'Pathfinding & Evasion',
            description: 'Navigate the multidimensional maze. Evade terminal sentinels.', 
            icon: <SparklesIcon />, 
            bannerColor: 'from-void-950 to-black',
            scoreKey: 'void_runner'
        },
        { 
            id: 'minesweeper', 
            title: 'ANOMALY DETECTOR', 
            protocol: 'Hazard Identification',
            description: 'Identify and defuse signal fractures within the grid using spatial logic.', 
            icon: <EntityIcon />, 
            bannerColor: 'from-void-950 to-black',
            scoreKey: 'minesweeper_medium'
        },
        { 
            id: 'solitaire', 
            title: 'SIGNAL ALIGNMENT', 
            protocol: 'Sequential Sorting',
            description: 'Order the data frequency stacks or face total system blackout.', 
            icon: <RadioIcon />, 
            bannerColor: 'from-void-950 to-black',
            scoreKey: 'solitaire'
        },
        { 
            id: 'tetris', 
            title: 'STACK TRACE', 
            protocol: 'Block Compilation',
            description: 'Compile descending data blocks. Avoid buffer overflow.', 
            icon: <ControllerIcon />, 
            bannerColor: 'from-void-950 to-black',
            scoreKey: 'tetris'
        }
    ];

    return (
        <main className="h-full min-h-0 flex-grow overflow-y-auto bg-void-950 p-8 md:p-16 pt-[calc(2rem+env(safe-area-inset-top))] pb-[calc(10rem+env(safe-area-inset-bottom))] animate-fade-in relative scrollbar-hide">
            <style>{`
                @keyframes scan { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
            `}</style>
            
            <div className="max-w-7xl mx-auto">
                <header className="mb-20 flex flex-col lg:flex-row lg:items-center justify-between gap-12 border-b-2 border-pulse-500/20 pb-12">
                    <div className="flex items-center gap-8">
                        <div className="p-4 bg-pulse-500 shadow-[8px_8px_0px_#333] dark:shadow-[8px_8px_0px_white]">
                            <ControllerIcon className="w-14 h-14 text-white" />
                        </div>
                        <div>
                            <h1 className="text-5xl md:text-7xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase italic leading-none glitch-text">VOID ARCADE</h1>
                            <p className="text-pulse-600 dark:text-pulse-500 font-bold tracking-[0.8em] uppercase text-[10px] md:text-xs mt-4 font-mono">Terminal v1.8.4 - Simulation Hub</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div 
                            onClick={() => setShowShop(true)}
                            className="group flex items-center gap-4 bg-void-900 px-6 py-4 border-2 border-pulse-500/30 hover:border-pulse-500 transition-all cursor-pointer shadow-[10px_10px_0px_black] active:scale-95 active:shadow-pulse-500/20"
                        >
                            <div className="p-2 bg-pulse-500/10 rounded-lg group-hover:scale-110 transition-transform">
                                <SparklesIcon className="w-6 h-6 text-pulse-500 animate-pulse" />
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block leading-none mb-1">Signal Assets</span>
                                <span className="text-2xl font-black italic text-zinc-900 dark:text-white leading-none">{credits.toLocaleString()} <span className="text-xs text-pulse-500">SC</span></span>
                            </div>
                        </div>
                        <button onClick={props.onReturnToFeeds} className="px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black text-xs font-black uppercase italic tracking-widest hover:bg-pulse-500 dark:hover:bg-pulse-500 hover:text-white transition-all shadow-[4px_4px_0px_#e11d48] active:scale-95">Abort Session</button>
                    </div>
                </header>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12 pb-20">
                    {games.map(game => <VHSCard key={game.id} game={game} onPlay={() => onSelect(game.id)} isHighlighted={game.id === 'hangman'} />)}
                </div>
            </div>
        </main>
    );
};

export default GameHubPage;
