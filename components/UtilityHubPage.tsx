
import React from 'react';
import { ShieldCheckIcon, MusicIcon, CodeBracketIcon, ClockIcon, XIcon, RadioIcon, SparklesIcon, CpuChipIcon, BookmarkIcon } from './icons';

interface UtilityInfo {
    id: string;
    title: string;
    protocol: string;
    description: string;
    icon: React.ReactElement<{ className?: string }>;
    accent: string;
    nodeId: string;
}

const UtilityHubPage: React.FC<{ onSelect: (id: string) => void; onBackToHub: () => void }> = ({ onSelect, onBackToHub }) => {
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
        <main className="h-full min-h-0 flex-grow overflow-y-auto bg-zinc-950 p-6 md:p-16 pt-[calc(2rem+env(safe-area-inset-top))] pb-[calc(10rem+env(safe-area-inset-bottom))] animate-fade-in relative scrollbar-hide font-mono">
            <style>{`
                .module-glow { box-shadow: 0 0 40px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.05); }
                @keyframes hardware-pulse { 0% { opacity: 0.3; } 50% { opacity: 0.8; } 100% { opacity: 0.3; } }
                .led-active { animation: hardware-pulse 1.5s infinite ease-in-out; }
            `}</style>

            <div className="fixed inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

            <div className="max-w-7xl mx-auto relative z-10">
                <header className="mb-16 flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b-4 border-zinc-900 pb-12">
                    <div className="flex items-center gap-8">
                        <div className="p-4 bg-zinc-100 border-4 border-black shadow-[8px_8px_0px_#e11d48]">
                            <CpuChipIcon className="w-12 h-12 text-black" />
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-none glitch-text">SECTOR_UTILITIES</h1>
                            <div className="flex items-center gap-3 mt-5">
                                <span className="text-pulse-500 font-black uppercase text-[10px] md:text-sm tracking-[0.4em] italic">Infrastructure_Link_Active</span>
                                <div className="h-px w-8 bg-zinc-800" />
                                <span className="text-zinc-600 font-black uppercase text-[8px] md:text-[10px] italic">Build_1.8.4_STABLE</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onBackToHub} className="group p-4 bg-zinc-900 border-2 border-zinc-800 rounded-2xl text-zinc-500 hover:text-white hover:border-pulse-500 transition-all active:scale-90 shadow-2xl flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Close_Console</span>
                        <XIcon className="w-7 h-7" />
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {utils.map(util => (
                        <div 
                            key={util.id}
                            className="group relative bg-zinc-900 border-[3px] border-zinc-800 hover:border-white/20 transition-all duration-500 p-8 shadow-[12px_12px_0px_#000] flex flex-col overflow-hidden module-glow"
                        >
                            {/* Decorative Rack Mount Holes */}
                            <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-black rounded-full border border-white/5" />
                            <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-black rounded-full border border-white/5" />
                            <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-black rounded-full border border-white/5" />
                            <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-black rounded-full border border-white/5" />

                            <div className="flex justify-between items-start mb-8">
                                <div className="p-4 bg-black border-2 border-zinc-800 rounded-xl transition-all duration-500 group-hover:scale-110 group-hover:border-white/20">
                                    {React.cloneElement(util.icon, { className: "w-10 h-10 text-zinc-500 group-hover:text-white transition-colors" })}
                                </div>
                                <div className="text-right flex flex-col items-end gap-1">
                                    <span className="text-[7px] font-black text-zinc-700 uppercase tracking-[0.4em]">{util.nodeId}</span>
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/20 group-hover:bg-emerald-500/80 transition-colors led-active" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-pulse-500/10 group-hover:bg-pulse-500/40 transition-colors" />
                                    </div>
                                </div>
                            </div>
                            
                            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-2 group-hover:text-white transition-colors leading-none">{util.title}</h3>
                            <p className="text-[9px] font-black uppercase tracking-widest font-mono mb-6 italic" style={{ color: util.accent }}>{util.protocol}</p>
                            <p className="text-[10px] text-zinc-500 uppercase font-black leading-relaxed mb-10 flex-grow border-l-2 border-zinc-800 pl-4 group-hover:text-zinc-300 transition-colors">{util.description}</p>
                            
                            <div className="mt-auto">
                                <button 
                                    onClick={() => onSelect(util.id)}
                                    className="w-full py-4 bg-zinc-800 border-t-2 border-l-2 border-white/5 border-b-2 border-r-2 border-black text-white font-black uppercase italic text-xs tracking-widest transition-all hover:bg-white hover:text-black active:translate-y-0.5 active:shadow-none shadow-xl flex items-center justify-center gap-3"
                                >
                                    <SparklesIcon className="w-4 h-4" />
                                    <span>Mount_Module</span>
                                </button>
                            </div>

                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none opacity-20" />
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="mt-32 text-center opacity-10 pointer-events-none">
                 <span className="text-[10px] font-black text-white uppercase tracking-[1.5em] italic">UTILITY_CORE_SYNCHRONIZED // RECRUIT_OS</span>
            </div>
        </main>
    );
};

export default UtilityHubPage;
