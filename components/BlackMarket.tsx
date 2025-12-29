import React from 'react';
import { XIcon, WalkieTalkieIcon, KeypadIcon, EntityIcon, RadioIcon, SparklesIcon } from './icons';

interface ShopItemProps {
    name: string;
    cost: number;
    icon: React.ReactNode;
    description: string;
    onBuy: () => void;
    disabled: boolean;
}

const ShopItem: React.FC<ShopItemProps> = ({ name, cost, icon, description, onBuy, disabled }) => (
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
            className="w-full py-2 bg-pulse-600 text-white font-black text-[10px] uppercase italic rounded-lg hover:bg-pulse-500 disabled:bg-zinc-800 transition-colors active:scale-95"
        >
            Deploy Augment
        </button>
    </div>
);

interface BlackMarketProps {
    isOpen: boolean;
    onClose: () => void;
    credits: number;
    setCredits: (c: number) => void;
    uptime: number;
    setUptime: (v: number) => void;
}

const BlackMarket: React.FC<BlackMarketProps> = ({ isOpen, onClose, credits, setCredits, uptime, setUptime }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 md:p-10 animate-fade-in font-mono" onClick={onClose}>
            <div className="max-w-2xl w-full bg-void-900 border-4 border-pulse-500 rounded-[2.5rem] md:rounded-[3rem] shadow-[0_0_120px_rgba(225,29,72,0.4)] overflow-hidden relative flex flex-col max-h-[82vh]" onClick={e => e.stopPropagation()}>
                
                {/* Header Section */}
                <div className="p-8 md:p-14 pb-6 md:pb-10 shrink-0 relative border-b border-white/5">
                    <div className="absolute top-8 right-8">
                        <button onClick={onClose} className="group p-3 md:p-5 bg-void-950 border-2 border-pulse-500/40 rounded-full text-pulse-500 hover:bg-pulse-500 hover:text-white transition-all shadow-lg active:scale-90">
                            <XIcon className="w-6 h-6 md:w-8 md:h-8 group-hover:rotate-90 transition-transform" />
                        </button>
                    </div>

                    <div className="pr-14">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="w-2 h-2 rounded-full bg-pulse-500 animate-ping"></span>
                            <span className="text-[9px] md:text-[11px] font-black text-pulse-500 uppercase tracking-[0.5em] italic leading-none">Encrypted Exchange</span>
                        </div>
                        <h2 className="text-4xl md:text-7xl font-black italic text-white uppercase tracking-tighter leading-none glitch-text">THE BLACK MARKET</h2>
                        <p className="text-zinc-600 text-[9px] md:text-[11px] uppercase mt-5 md:mt-8 tracking-widest leading-relaxed max-w-lg italic">Unauthorized signal augmentations. Sync credits to unlock sector tools.</p>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="px-8 md:px-14 overflow-y-auto flex-grow scrollbar-hide py-6 bg-void-950/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-12">
                        <ShopItem 
                            name="Sequence Restore" cost={50} icon={<WalkieTalkieIcon className="w-6 h-6"/>} 
                            description="Reset Cipher Core attempts without losing progress."
                            disabled={credits < 50} onBuy={() => { setCredits(credits - 50); alert("Augment Purchased: Sequence Restore Available."); }}
                        />
                        <ShopItem 
                            name="Logic Probe" cost={25} icon={<KeypadIcon className="w-6 h-6"/>} 
                            description="Reveal a correct cell in any active Sudoku grid."
                            disabled={credits < 25} onBuy={() => { setCredits(credits - 25); alert("Augment Purchased: Sudoku Hint Ready."); }}
                        />
                        <ShopItem 
                            name="Frequency Shield" cost={150} icon={<EntityIcon className="w-6 h-6"/>} 
                            description="Grants one extra life in Void Runner or Minesweeper."
                            disabled={credits < 150} onBuy={() => { setCredits(credits - 150); alert("Augment Purchased: Protective Shield Online."); }}
                        />
                        <ShopItem 
                            name="Uptime Siphon" cost={200} icon={<RadioIcon className="w-6 h-6"/>} 
                            description="Instantly restore 50% System Integrity."
                            disabled={credits < 200} onBuy={() => { setCredits(credits - 200); setUptime(Math.min(100, uptime + 50)); }}
                        />
                    </div>
                </div>

                {/* Pinned Footer */}
                <div className="p-8 md:p-10 bg-black/80 border-t-2 border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6 md:gap-10 shrink-0">
                    <div className="flex flex-col text-center sm:text-left leading-none">
                        <span className="text-[9px] md:text-[11px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-2 italic">Operator Balance</span>
                        <span className="text-4xl md:text-5xl font-black italic text-pulse-500 drop-shadow-[0_0_20px_rgba(225,29,72,0.6)] leading-none">{credits.toLocaleString()} <span className="text-sm">SC</span></span>
                    </div>
                    <button onClick={onClose} className="w-full sm:w-auto px-12 py-4 bg-pulse-600 border-2 border-pulse-400 text-white font-black uppercase italic tracking-widest text-sm hover:bg-white hover:text-black transition-all shadow-[8px_8px_0px_#111] active:translate-x-1 active:translate-y-1 active:shadow-none leading-none">Confirm Assets</button>
                </div>
            </div>
        </div>
    );
};

export default BlackMarket;