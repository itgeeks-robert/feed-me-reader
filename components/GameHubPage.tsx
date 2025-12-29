import React from 'react';
import { WalkieTalkieIcon, ControllerIcon, RadioIcon, EntityIcon, KeypadIcon, SparklesIcon, XIcon, ListIcon, CpuChipIcon } from './icons';

interface GameInfo {
    id: string;
    title: string;
    protocol: string; 
    description: string;
    icon: React.ReactElement<{ className?: string }>;
    bannerColor: string;
    stats?: string;
}

const ShopItem: React.FC<{ name: string, cost: number, icon: React.ReactNode, description: string, onBuy: () => void, disabled: boolean }> = ({ name, cost, icon, description, onBuy, disabled }) => (
    <div className={`p-4 border-2 rounded-2xl transition-all ${disabled ? 'border-zinc-800 bg-zinc-900/50 opacity-40 grayscale' : 'border-pulse-500/30 bg-zinc-900 hover:border-pulse-500 shadow-lg'}`}>
        <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-pulse-500/10 rounded-lg text-pulse-500">{icon}</div>
            <div className="text-right">
                <span className="text-[10px] font-black text-white italic block leading-none">{name}</span>
                <span className="text-[9px] font-black text-pulse-500 uppercase tracking-widest">{cost} SC</span>
            </div>
        </div>
        <p className="text-[9px] text-zinc-500 uppercase font-mono mb-4 leading-tight">{description}</p>
        <button 
            onClick={onBuy}
            disabled={disabled}
            className="w-full py-2 bg-pulse-600 text-white font-black text-[10px] uppercase italic rounded-lg hover:bg-pulse-500 disabled:bg-zinc-800 transition-colors"
        >
            Deploy Augment
        </button>
    </div>
);

const VHSCard: React.FC<{ game: GameInfo; onPlay: () => void }> = ({ game, onPlay }) => {
    return (
        <div onClick={onPlay} className="group relative bg-void-900 border-2 border-zinc-800 hover:border-pulse-500 transition-all duration-300 cursor-pointer h-[380px] shadow-[10px_10px_0px_black] hover:translate-x-[-4px] hover:translate-y-[-4px]">
            <div className="h-40 w-full bg-void-950 flex items-center justify-center relative overflow-hidden border-b-2 border-zinc-800">
                <div className="absolute top-0 left-0 bg-pulse-500 text-white px-3 py-1 text-[8px] font-black uppercase font-mono tracking-widest">VOID-SIM</div>
                <div className="opacity-20 group-hover:opacity-100 group-hover:scale-125 transition-all duration-700 text-pulse-500">
                    {React.cloneElement(game.icon, { className: "w-24 h-24" })}
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-pulse-500 via-neon-400 to-pulse-500 animate-pulse"></div>
            </div>

            <div className="p-6 flex flex-col justify-between h-[calc(380px-10rem)]">
                <div>
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-1 group-hover:text-pulse-500 transition-colors">{game.title}</h3>
                    
                    <div className="inline-block px-2 py-0.5 bg-neon-500/10 border border-neon-500/30 mb-3">
                        <span className="text-[8px] font-black text-neon-400 uppercase tracking-widest font-mono">Protocol: {game.protocol}</span>
                    </div>

                    <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest font-mono leading-relaxed">{game.description}</p>
                </div>
                <div className="flex justify-between items-center mt-4">
                     <div className="px-4 py-1 border border-pulse-500/40 text-pulse-500 text-[9px] font-black uppercase tracking-tighter group-hover:bg-pulse-500 group-hover:text-white transition-all">Enter Simulation</div>
                     {game.stats && <span className="text-[9px] font-bold text-zinc-700 uppercase font-mono">{game.stats}</span>}
                </div>
            </div>
        </div>
    );
};

const GameHubPage: React.FC<any> = (props) => {
    const { credits, setCredits, showShop, setShowShop, onSelect } = props;

    const games: GameInfo[] = [
        { 
            id: 'synapse_link', 
            title: 'SYNAPSE LINK', 
            protocol: 'Logical Association',
            description: 'Determine logical connections between fragmented nodes. Avoid synaptic overload.', 
            icon: <ListIcon />, 
            bannerColor: 'from-pulse-950 to-void-900',
            stats: 'CONNECTION'
        },
        { 
            id: 'grid_reset', 
            title: 'GRID RESET', 
            protocol: 'Module Recalibration',
            description: 'A hardware-level logic panel. Manually toggle nodes to reset the sector grid.', 
            icon: <CpuChipIcon />, 
            bannerColor: 'from-zinc-950 to-void-900',
            stats: 'MAINTENANCE'
        },
        { 
            id: 'cipher_core', 
            title: 'CIPHER CORE', 
            protocol: 'Word Decryption',
            description: 'Daily decryption ritual. Intercept the 5-bit sequence before the system locks.', 
            icon: <WalkieTalkieIcon />, 
            bannerColor: 'from-pulse-950 to-void-900',
            stats: 'PRIORITY'
        },
        { 
            id: 'sudoku', 
            title: 'PATTERN ZERO', 
            protocol: 'Logic Grid Analysis',
            description: 'A numeric logical cryptogram extracted from the mainframe core.', 
            icon: <KeypadIcon />, 
            bannerColor: 'from-zinc-950 to-void-900',
            stats: props.sudokuStats.totalWins > 0 ? `${props.sudokuStats.totalWins} RECORDS` : undefined
        },
        { 
            id: 'void_runner', 
            title: 'VOID RUNNER', 
            protocol: 'Pathfinding & Evasion',
            description: 'Navigate the multidimensional maze. Evade terminal sentinels.', 
            icon: <SparklesIcon />, 
            bannerColor: 'from-void-950 to-black',
            stats: 'SIMULATION'
        },
        { 
            id: 'minesweeper', 
            title: 'ANOMALY DETECTOR', 
            protocol: 'Hazard Identification',
            description: 'Identify and defuse signal fractures within the grid using spatial logic.', 
            icon: <EntityIcon />, 
            bannerColor: 'from-void-950 to-black' 
        },
        { 
            id: 'solitaire', 
            title: 'SIGNAL ALIGNMENT', 
            protocol: 'Sequential Sorting',
            description: 'Order the data frequency stacks or face total system blackout.', 
            icon: <RadioIcon />, 
            bannerColor: 'from-void-950 to-black',
            stats: props.solitaireStats.gamesWon > 0 ? `${props.solitaireStats.gamesWon} SYNCED` : undefined
        },
        { 
            id: 'tetris', 
            title: 'STACK TRACE', 
            protocol: 'Block Compilation',
            description: 'Compile descending data blocks. Avoid buffer overflow.', 
            icon: <ControllerIcon />, 
            bannerColor: 'from-void-950 to-black' 
        }
    ];

    return (
        <main className="h-full min-h-0 flex-grow overflow-y-auto bg-void-950 p-8 md:p-16 pt-[calc(2rem+env(safe-area-inset-top))] pb-[calc(10rem+env(safe-area-inset-bottom))] animate-fade-in relative scrollbar-hide">
            <div className="max-w-7xl mx-auto">
                <header className="mb-20 flex flex-col lg:flex-row lg:items-center justify-between gap-12 border-b-2 border-pulse-500/20 pb-12">
                    <div className="flex items-center gap-8">
                        <div className="p-4 bg-pulse-500 shadow-[8px_8px_0px_white]">
                            <ControllerIcon className="w-14 h-14 text-white" />
                        </div>
                        <div>
                            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-none glitch-text">VOID ARCADE</h1>
                            <p className="text-pulse-500 font-bold tracking-[0.8em] uppercase text-[10px] md:text-xs mt-4 font-mono">Terminal v1.8.4 - Decryption Suite</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div 
                            onClick={() => setShowShop(true)}
                            className="group flex items-center gap-4 bg-void-900 px-6 py-4 border-2 border-pulse-500/30 hover:border-pulse-500 transition-all cursor-pointer shadow-[10px_10px_0px_black] active:scale-95"
                        >
                            <div className="p-2 bg-pulse-500/10 rounded-lg group-hover:scale-110 transition-transform">
                                <SparklesIcon className="w-6 h-6 text-pulse-500 animate-pulse" />
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block leading-none mb-1">Signal Assets</span>
                                <span className="text-2xl font-black italic text-white leading-none">{credits.toLocaleString()} <span className="text-xs text-pulse-500">SC</span></span>
                            </div>
                        </div>
                        <button onClick={props.onReturnToFeeds} className="px-8 py-3 bg-white text-black text-xs font-black uppercase italic tracking-widest hover:bg-pulse-500 hover:text-white transition-all shadow-[4px_4px_0px_#e11d48]">Abort Session</button>
                    </div>
                </header>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
                    {games.map(game => <VHSCard key={game.id} game={game} onPlay={() => onSelect(game.id)} />)}
                </div>
            </div>

            {showShop && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-fade-in" onClick={() => setShowShop(false)}>
                    <div className="max-w-2xl w-full bg-void-900 border-4 border-pulse-500 rounded-[3rem] p-8 md:p-12 shadow-[0_0_120px_rgba(225,29,72,0.4)] overflow-hidden relative" onClick={e => e.stopPropagation()}>
                         <div className="absolute top-6 right-6">
                            <button onClick={() => setShowShop(false)} className="group p-5 bg-void-950 border-2 border-pulse-500/40 rounded-full text-pulse-500 hover:bg-pulse-500 hover:text-white transition-all shadow-lg active:scale-90">
                                <XIcon className="w-8 h-8 group-hover:rotate-90 transition-transform" />
                            </button>
                         </div>

                         <div className="mb-12 pr-16">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="w-2 h-2 rounded-full bg-pulse-500 animate-ping"></span>
                                <span className="text-[10px] font-black text-pulse-500 uppercase tracking-[0.5em] italic">Encrypted Exchange</span>
                            </div>
                            <h2 className="text-5xl md:text-6xl font-black italic text-white uppercase tracking-tighter leading-none glitch-text">THE BLACK MARKET</h2>
                            <p className="text-zinc-600 text-xs font-mono uppercase mt-6 tracking-widest leading-relaxed max-w-lg">Unauthorized signal augmentations. Use of Signal Credits (SC) implies consent to terminal synchronization protocols.</p>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12 overflow-y-auto max-h-[45vh] pr-2 scrollbar-hide">
                            <ShopItem 
                                name="Sequence Restore" cost={50} icon={<WalkieTalkieIcon />} 
                                description="Reset Cipher Core attempts without losing progress."
                                disabled={credits < 50} onBuy={() => { setCredits(credits - 50); alert("Augment Purchased: Sequence Restore Available."); }}
                            />
                            <ShopItem 
                                name="Logic Probe" cost={25} icon={<KeypadIcon />} 
                                description="Reveal a correct cell in any active Sudoku grid."
                                disabled={credits < 25} onBuy={() => { setCredits(credits - 25); alert("Augment Purchased: Sudoku Hint Ready."); }}
                            />
                            <ShopItem 
                                name="Frequency Shield" cost={150} icon={<EntityIcon />} 
                                description="Grants one extra life in Void Runner or Minesweeper."
                                disabled={credits < 150} onBuy={() => { setCredits(credits - 150); alert("Augment Purchased: Protective Shield Online."); }}
                            />
                            <ShopItem 
                                name="Uptime Siphon" cost={200} icon={<RadioIcon />} 
                                description="Instantly restore 50% System Integrity."
                                disabled={credits < 200} onBuy={() => { setCredits(credits - 200); props.setUptime(Math.min(100, props.uptime + 50)); }}
                            />
                         </div>

                         <div className="p-8 bg-black/60 rounded-[2.5rem] border-2 border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6 shadow-inner">
                            <div className="flex flex-col text-center sm:text-left">
                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-1">Operator Balance</span>
                                <span className="text-4xl font-black italic text-pulse-500 drop-shadow-[0_0_15px_rgba(225,29,72,0.6)]">{credits.toLocaleString()} <span className="text-sm">SC</span></span>
                            </div>
                            <button onClick={() => setShowShop(false)} className="w-full sm:w-auto px-12 py-5 bg-pulse-600 border-2 border-pulse-400 text-white font-black uppercase italic tracking-widest text-sm hover:bg-white hover:text-black transition-all shadow-[8px_8px_0px_#111]">Confirm Assets</button>
                         </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default GameHubPage;