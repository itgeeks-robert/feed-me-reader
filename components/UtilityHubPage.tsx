import React from 'react';
import { ShieldCheckIcon, MusicIcon, CodeBracketIcon, ClockIcon, XIcon, RadioIcon } from './icons';

interface UtilityInfo {
    id: string;
    title: string;
    protocol: string;
    description: string;
    icon: React.ReactElement<{ className?: string }>;
}

const UtilityHubPage: React.FC<{ onSelect: (id: string) => void; onBackToHub: () => void }> = ({ onSelect, onBackToHub }) => {
    const utils: UtilityInfo[] = [
        {
            id: 'signal_streamer',
            title: 'SIGNAL STREAMER',
            protocol: 'Media Playback',
            description: 'Access and monitor local media packets. Supports audio and desaturated surveillance video.',
            icon: <MusicIcon />
        },
        {
            id: 'transcoder',
            title: 'DATA TRANSCODER',
            protocol: 'Signal Formatting',
            description: 'Convert raw strings into Hex, Binary, or Base64 protocols for archival storage.',
            icon: <CodeBracketIcon />
        },
        {
            id: 'deep_sync',
            title: 'DEEP SYNC',
            protocol: 'Cognitive Focus',
            description: 'Industrial static modulation for high-intensity sector analysis.',
            icon: <RadioIcon />
        }
    ];

    return (
        <main className="h-full min-h-0 flex-grow overflow-y-auto bg-void-950 p-8 md:p-16 pt-[calc(2rem+env(safe-area-inset-top))] pb-[calc(10rem+env(safe-area-inset-bottom))] animate-fade-in relative scrollbar-hide">
            <div className="max-w-7xl mx-auto">
                <header className="mb-20 flex flex-col lg:flex-row lg:items-center justify-between gap-12 border-b-2 border-pulse-500/20 pb-12">
                    <div className="flex items-center gap-8">
                        <div className="p-4 bg-pulse-500 shadow-[8px_8px_0px_white]">
                            <ShieldCheckIcon className="w-14 h-14 text-white" />
                        </div>
                        <div>
                            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-none glitch-text">SECTOR UTILITIES</h1>
                            <p className="text-pulse-500 font-bold tracking-[0.8em] uppercase text-[10px] md:text-xs mt-4 font-mono">Infrastructure Tools v1.0.0</p>
                        </div>
                    </div>
                    <button onClick={onBackToHub} className="p-3 bg-zinc-800 rounded-2xl text-zinc-400 hover:text-white active:scale-95 border border-white/5 shadow-md"><XIcon className="w-8 h-8" /></button>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
                    {utils.map(util => (
                        <div 
                            key={util.id}
                            onClick={() => onSelect(util.id)}
                            className="group relative bg-void-900 border-2 border-zinc-800 hover:border-pulse-500 transition-all duration-300 cursor-pointer p-10 shadow-[10px_10px_0px_black] hover:translate-x-[-4px] hover:translate-y-[-4px]"
                        >
                            <div className="p-4 bg-pulse-500/10 rounded-2xl text-pulse-500 w-fit mb-8 group-hover:scale-110 transition-transform">
                                {React.cloneElement(util.icon, { className: "w-12 h-12" })}
                            </div>
                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2 group-hover:text-pulse-500 transition-colors">{util.title}</h3>
                            <p className="text-[8px] font-black text-neon-400 uppercase tracking-widest font-mono mb-6 italic">Protocol: {util.protocol}</p>
                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest leading-relaxed">{util.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
};

export default UtilityHubPage;
