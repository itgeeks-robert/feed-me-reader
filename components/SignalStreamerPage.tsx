import React, { useState, useRef, useEffect } from 'react';
import { XIcon, MusicIcon, FolderIcon } from './icons';

const SignalStreamerPage: React.FC<{ onBackToHub: () => void }> = ({ onBackToHub }) => {
    const [mediaUrl, setMediaUrl] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'AUDIO' | 'VIDEO' | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isAndroid, setIsAndroid] = useState(false);

    useEffect(() => {
        setIsAndroid(/Android/i.test(navigator.userAgent));
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (mediaUrl) URL.revokeObjectURL(mediaUrl);
            const url = URL.createObjectURL(file);
            setMediaUrl(url);
            setFileName(file.name.toUpperCase());
            setMediaType(file.type.startsWith('video') ? 'VIDEO' : 'AUDIO');
        }
    };

    const handleEject = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (mediaUrl) URL.revokeObjectURL(mediaUrl);
        setMediaUrl(null);
        setFileName("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <main className="w-full h-full bg-zinc-950 flex flex-col items-center p-4 md:p-6 font-mono text-white relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-5 cctv-overlay" />
            
            {/* Main Container - Explicit bottom margin to push content away from Bottom Nav */}
            <div className="max-w-4xl w-full flex flex-col h-full relative z-10 pb-28 md:pb-8">
                
                {/* Header */}
                <header className="mb-4 flex justify-between items-center bg-zinc-900/50 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 backdrop-blur-xl shrink-0">
                    <div className="flex items-center gap-3 md:gap-4">
                        <button onClick={onBackToHub} className="p-2 md:p-3 bg-zinc-800 rounded-xl md:rounded-2xl text-zinc-400 hover:text-white transition-all active:scale-95">
                            <XIcon className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                        <div>
                             <span className="text-[7px] md:text-[9px] font-black text-neon-400 uppercase tracking-[0.4em] block mb-0.5 md:mb-1 italic">
                                {isAndroid ? "ANDROID_FILESYSTEM_LINK" : "STATION_FILESYSTEM_LINK"}
                             </span>
                             <h2 className="text-sm md:text-xl font-black italic uppercase text-white tracking-tighter leading-none">SIGNAL STREAMER</h2>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 flex flex-col items-center justify-center min-h-0 py-4 relative">
                    {!mediaUrl ? (
                        /* Android Compatibility: Using a 'label' as a wrapper is the standard way to trigger file inputs on mobile reliably */
                        <label className="w-full aspect-square max-w-[320px] md:max-w-[400px] border-4 border-dashed border-zinc-800 rounded-[2.5rem] md:rounded-[3rem] flex flex-col items-center justify-center relative overflow-hidden active:scale-95 transition-transform shadow-2xl bg-void-950/50 group cursor-pointer">
                            <input 
                                type="file" 
                                className="sr-only" 
                                accept="audio/*,video/*" 
                                onChange={handleFileChange} 
                            />
                            
                            <div className="relative z-10 flex flex-col items-center p-8 pointer-events-none">
                                <div className="p-4 md:p-6 bg-zinc-900 rounded-full border-2 border-zinc-800 mb-4 md:mb-6 group-hover:border-pulse-500 transition-all shadow-xl text-zinc-700 group-hover:text-pulse-500">
                                    <FolderIcon className="w-12 h-12 md:w-16 md:h-16" />
                                </div>
                                <p className="text-[10px] md:text-xs font-black uppercase italic tracking-[0.3em] text-zinc-500 group-hover:text-white mb-2 text-center transition-colors">ACCESS DEVICE STORAGE</p>
                                <p className="text-[7px] md:text-[8px] font-bold uppercase text-zinc-700 tracking-widest font-mono italic">MIME: VIDEO/* | AUDIO/*</p>
                            </div>
                        </label>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center relative bg-black rounded-[2rem] md:rounded-[3rem] border-4 border-zinc-900 overflow-hidden shadow-2xl min-h-0">
                            {mediaType === 'VIDEO' ? (
                                <div className="w-full h-full relative group">
                                    <video 
                                        src={mediaUrl} 
                                        controls 
                                        playsInline
                                        className="w-full h-full object-contain saturate-[0.5] contrast-125 brightness-90"
                                    />
                                    <div className="absolute inset-0 cctv-overlay pointer-events-none opacity-40" />
                                </div>
                            ) : (
                                <div className="p-8 md:p-12 flex flex-col items-center text-center w-full">
                                    <div className="p-6 md:p-10 bg-zinc-900 rounded-full border-4 border-pulse-500/50 shadow-[0_0_50px_rgba(225,29,72,0.3)] mb-6 md:mb-10">
                                        <MusicIcon className="w-16 h-16 md:w-24 md:h-24 text-pulse-500 animate-pulse" />
                                    </div>
                                    <h3 className="text-[10px] md:text-sm font-black italic text-white mb-6 tracking-tighter max-w-xs uppercase leading-tight truncate w-full">{fileName}</h3>
                                    <audio src={mediaUrl} controls className="w-full max-w-[280px] invert hue-rotate-180 saturate-0 opacity-80" />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Controls - Positioned clearly above the bottom nav with added margin */}
                <div className="mt-6 bg-zinc-900/95 p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 shrink-0 flex flex-col items-center justify-between gap-5 backdrop-blur-md shadow-2xl relative mb-4">
                    <div className="flex flex-col min-w-0 w-full text-center">
                        <span className="text-[7px] md:text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1 italic">ACTIVE SIGNAL PACKET</span>
                        <span className="text-[10px] md:text-xs font-black text-white italic truncate block px-4">{fileName || "NO_SOURCE_DETECTED"}</span>
                    </div>
                    <div className="flex gap-3 w-full">
                        <label className="flex-1 relative group cursor-pointer">
                            <input 
                                type="file" 
                                className="sr-only" 
                                accept="audio/*,video/*" 
                                onChange={handleFileChange} 
                            />
                            <div className="w-full px-4 py-4 bg-zinc-100 text-black font-black uppercase italic text-[10px] tracking-widest rounded-xl shadow-[0_4px_0_#a1a1aa] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center">
                                SYNC NEW
                            </div>
                        </label>
                        <button 
                            onClick={handleEject}
                            className="px-8 py-4 bg-zinc-800 text-pulse-500 font-black uppercase italic text-[10px] tracking-widest rounded-xl hover:bg-pulse-500 hover:text-white transition-all border border-pulse-500/20 active:scale-95"
                        >
                            EJECT
                        </button>
                    </div>
                </div>

            </div>
        </main>
    );
};

export default SignalStreamerPage;
