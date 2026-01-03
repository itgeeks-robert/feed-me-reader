
import React from 'react';
import { ShieldCheckIcon, MusicIcon, CodeBracketIcon, ClockIcon, XIcon, RadioIcon, SparklesIcon, CpuChipIcon, BookmarkIcon, ContrastIcon, WandIcon, PaletteIcon, SkinsIcon, StyleIcon } from './icons';
import ContextualIntel from './ContextualIntel';
import { Theme } from '../src/App';

interface UtilityInfo {
    id: string;
    title: string;
    protocol: string;
    description: string;
    icon: React.ReactElement<{ className?: string }>;
    accent: string;
    nodeId: string;
}

const ThemeIcon: React.FC<{ className?: string }> = ({ className }) => {
    return <PaletteIcon className={className} />;
};

const UtilityHubPage: React.FC<{ onSelect: (id: string) => void; onBackToHub: () => void; theme: Theme; onToggleTheme: () => void }> = ({ onSelect, onBackToHub, theme, onToggleTheme }) => {
    const utils: UtilityInfo[] = [
        {
            id: 'signal_streamer',
            title: 'SIGNAL STREAMER',
            protocol: 'MEDIA_PLAYBACK_v4',
            description: 'Monitor localized media buffers. Full support for raw audio and desaturated surveillance video streams.',
            icon: <MusicIcon />,
            accent: '#3b82f6',
            nodeId: 'MOD_01'
        },
        {
            id: 'base64_converter',
            title: 'BASE64 INTERCEPT',
            protocol: 'ENCODING_DECODE_v2',
            description: 'Convert media files to strings for transmission, or paste encoded packets to reconstruct and preview signals.',
            icon: <BookmarkIcon />,
            accent: '#f59e0b',
            nodeId: 'MOD_02'
        },
        {
            id: 'transcoder',
            title: 'DATA TRANSCODER',
            protocol: 'PROTOCOL_CONVERSION',
            description: 'Transform plaintext arrays into Hex, Binary, or Base64 sequences for archival node storage.',
            icon: <CodeBracketIcon />,
            accent: '#10b981',
            nodeId: 'MOD_03'
        },
        {
            id: 'deep_sync',
            title: 'DEEP SYNC',
            protocol: 'COGNITIVE_MODULATION',
            description: 'Industrial static oscillation designed for high-intensity sector decryption and neural focus.',
            icon: <RadioIcon />,
            accent: '#f43f5e',
            nodeId: 'MOD_04'
        }
    ];

    return (
        <main className="h-full min-h-0 flex-grow overflow-y-auto bg-void-bg p-6 md:p-16 pt-[calc(2rem+env(safe-area-inset-top))] pb-[calc(10rem+env(safe-area-inset-bottom))] animate-fade-in relative scrollbar-hide font-mono">
            <ContextualIntel 
                tipId="utility_intel" 
                title="Tactical Hub" 
                content="Sector Utilities allow you to manipulate raw signals. Use the Streamer for media reconnaissance and the Scrambler to mask your outgoing data strings." 
            />
            
            <div className="fixed inset-0 pointer-events-none opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(var(--void-text-main) 1px, transparent 1px), linear-gradient(90deg, var(--void-text-main) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

            <div className="max-w-7xl mx-auto relative z-10">
                <header className="mb-16 flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b-4 border-void-border pb-12">
                    <div className="flex items-center gap-8">
                        <div className="p-4 bg-terminal border-4 border-void-bg shadow-[8px_8px_0px_var(--void-accent)] rounded-void">
                            <CpuChipIcon className="w-12 h-12 text-void-bg" />
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-7xl font-black text-terminal tracking-tighter uppercase italic leading-none">SECTOR_UTILITIES</h1>
                            <div className="flex items-center gap-3 mt-5">
                                <span className="text-pulse-500 font-black uppercase text-[10px] md:text-sm tracking-[0.4em] italic">Infrastructure_Link_Active</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={onToggleTheme} className="p-4 bg-void-surface rounded-2xl text-muted border border-void-border active:scale-90 transition-transform hover:text-pulse-500 shadow-2xl">
                            <ThemeIcon className="w-7 h-7" />
                        </button>
                        <button onClick={onBackToHub} className="group p-4 bg-void-surface border-2 border-void-border rounded-void text-muted hover:text-terminal hover:border-pulse-500 transition-all active:scale-90 shadow-2xl flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Close_Console</span>
                            <XIcon className="w-7 h-7" />
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {utils.map(util => (
                        <div 
                            key={util.id}
                            className="group relative bg-zinc-900 border-[3px] border-void-border hover:border-pulse-500 transition-all duration-500 p-8 shadow-2xl flex flex-col overflow-hidden rounded-void"
                        >
                            <div className="flex justify-between items-start mb-8">
                                <div className="p-4 bg-black border-2 border-white/5 rounded-xl transition-all duration-500 group-hover:scale-110">
                                    {React.cloneElement(util.icon, { className: "w-10 h-10 text-zinc-500 group-hover:text-white transition-colors" })}
                                </div>
                                <div className="text-right flex flex-col items-end gap-1">
                                    <span className="text-[7px] font-black text-zinc-600 uppercase tracking-[0.4em]">{util.nodeId}</span>
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 shadow-[0_0_5px_#10b981] animate-pulse" />
                                    </div>
                                </div>
                            </div>
                            
                            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-2 leading-none">{util.title}</h3>
                            <p className="text-[9px] font-black uppercase tracking-widest font-mono mb-6 italic" style={{ color: util.accent }}>{util.protocol}</p>
                            <p className="text-[10px] text-zinc-400 uppercase font-black leading-relaxed mb-10 flex-grow border-l-2 border-white/10 pl-4 transition-colors group-hover:text-white">{util.description}</p>
                            
                            <div className="mt-auto">
                                <button 
                                    onClick={() => onSelect(util.id)}
                                    className="w-full py-4 bg-terminal text-void-bg font-black uppercase italic text-xs tracking-widest transition-all hover:bg-pulse-500 hover:text-white active:translate-y-0.5 shadow-xl flex items-center justify-center gap-3 rounded-void border border-void-border"
                                >
                                    <SparklesIcon className="w-4 h-4" />
                                    <span>Mount_Module</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
};

export default UtilityHubPage;
