import React, { useState, useRef, useEffect } from 'react';
import { XIcon, MusicIcon, FolderIcon, ArrowPathIcon } from './icons';

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

    const triggerUpload = () => fileInputRef.current?.click();

    return (
        <main className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-6 font-mono text-white relative overflow-hidden pt-[env(safe-area-inset-top)]">
            <div className="absolute inset-0 pointer-events-none opacity-5 cctv-overlay" />
            
            <div className="max-w-4xl w-full relative z-10 flex flex-col h-full">
                <header className="mb-8 flex justify-between items-center bg-zinc-900/50 p-6 rounded-[2rem] border border-white/5 backdrop-blur-xl shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={onBackToHub} className="p-3 bg-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all"><XIcon className="w-6 h-6" /></button>
                        <div>
                             <span className="text-[9px] font-black text-neon-400 uppercase tracking-[0.4em] block mb-1 italic">
                                {isAndroid ? "MOBILE_FILESYSTEM_LINK" : "DESKTOP_FILESYSTEM_LINK"}
                             </span>
                             <h2 className="text-xl font-black italic uppercase text-white tracking-tighter leading-none">SIGNAL STREAMER</h2>
                        </div>
                    </div>
                    {mediaUrl && (
                        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-pulse-500/10 border border-pulse-500/20 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-pulse-500 animate-ping" />
                            <span className="text-[9px] font-black text-pulse-500 uppercase italic">UPLINK_ACTIVE</span>
                        </div>
                    )}
                </header>

                <div className="flex-grow flex items-center justify-center min-h-0 mb-8">
                    {!mediaUrl ? (
                        <div 
                            onClick={triggerUpload}
                            className="w-full h-80 max-w-2xl border-4 border-dashed border-zinc-800 rounded-[3rem] flex flex-col items-center justify-center cursor-pointer hover:border-pulse-500 hover:bg-pulse-500/5 transition-all group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-void-900 opacity-40 group-hover:opacity-60 transition-opacity" />
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="p-6 bg-zinc-900 rounded-full border-2 border-zinc-800 mb-6 group-hover:border-pulse-500 group-hover:scale-110 transition-all shadow-xl">
                                    <FolderIcon className="w-16 h-16 text-zinc-700 group-hover:text-pulse-500" />
                                </div>
                                <p className="text-xs font-black uppercase italic tracking-[0.3em] text-zinc-500 group-hover:text-white mb-2">Access {isAndroid ? "Device" : "Local"} Storage</p>
                                <p className="text-[8px] font-bold uppercase text-zinc-700 tracking-widest font-mono italic">MIME_TYPE: VIDEO/* | AUDIO/*</p>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center relative bg-black rounded-[3rem] border-4 border-zinc-900 overflow-hidden shadow-2xl">
                            {mediaType === 'VIDEO' ? (
                                <div className="w-full h-full relative group">
                                    <video 
                                        src={mediaUrl} 
                                        controls 
                                        className="w-full h-full object-contain saturate-[0.5] contrast-125 brightness-90"
                                    />
                                    <div className="absolute inset-0 cctv-overlay pointer-events-none opacity-40" />
                                    <div className="absolute top-6 left-6 flex items-center gap-2 pointer-events-none bg-black/40 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                                        <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest drop-shadow-lg">SURVEILLANCE_MOD</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-20 flex flex-col items-center">
                                    <div className="relative mb-12">
                                        <div className="absolute inset-0 bg-pulse-500/20 rounded-full blur-3xl animate-pulse" />
                                        <div className="p-10 bg-zinc-900 rounded-full border-4 border-pulse-500/50 shadow-[0_0_50px_rgba(225,29,72,0.3)]">
                                            <MusicIcon className="w-24 h-24 text-pulse-500 animate-bounce" />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-black italic text-white mb-8 tracking-tighter text-center max-w-md break-all uppercase drop-shadow-lg">{fileName}</h3>
                                    <audio src={mediaUrl} controls className="w-full max-w-sm invert hue-rotate-180 saturate-0 opacity-80 hover:opacity-100 transition-opacity" />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-zinc-900/50 p-6 rounded-[2rem] border border-white/5 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-6 backdrop-blur-md">
                    <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1 italic">Active Data Packet</span>
                        <span className="text-xs font-black text-white italic truncate pr-4">{fileName || "NO_SOURCE_DETECTED"}</span>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button 
                            onClick={triggerUpload}
                            className="flex-1 sm:flex-none px-8 py-4 bg-zinc-300 text-black font-black uppercase italic text-[10px] tracking-widest rounded-xl shadow-lg hover:bg-white active:scale-95 transition-all"
                        >
                            Sync New Packet
                        </button>
                        <button 
                            onClick={() => {
                                if (mediaUrl) URL.revokeObjectURL(mediaUrl);
                                setMediaUrl(null);
                            }}
                            className="px-6 py-4 bg-zinc-800 text-pulse-500 font-black uppercase italic text-[10px] tracking-widest rounded-xl hover:bg-pulse-500 hover:text-white transition-all border border-pulse-500/20"
                        >
                            Eject
                        </button>
                    </div>
                </div>

                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="audio/*,video/*" 
                    onChange={handleFileChange} 
                />
            </div>
        </div>
    );
};

export default SignalStreamerPage;