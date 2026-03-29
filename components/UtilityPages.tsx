import React, { useState, useRef, useEffect } from 'react';
import { 
    XIcon, MusicIcon, FolderIcon, ArrowPathIcon, 
    RadioIcon, GlobeAltIcon, BookmarkIcon, CloudArrowUpIcon, 
    CloudArrowDownIcon, SparklesIcon, ExclamationTriangleIcon,
    CodeBracketIcon, CpuChipIcon, PaletteIcon
} from './icons';
import { soundService } from '../services/soundService';
import { Tooltip } from './SharedUI';
import ContextualIntel from './ContextualIntel';

/* ─────────────────────────────────────────────────
   UTILITY HUB PAGE
   ───────────────────────────────────────────────── */
interface UtilityInfo {
    id: string;
    title: string;
    protocol: string;
    description: string;
    icon: React.ReactElement<{ className?: string }>;
    accent: string;
    nodeId: string;
}

export const UtilityHubPage: React.FC<{ onSelect: (id: string) => void; onBackToHub: () => void; onToggleTheme: () => void }> = ({ onSelect, onBackToHub, onToggleTheme }) => {
    
    const themeLabel = 'SYSTEM';

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
            id: 'surveillance_radar',
            title: 'SURVEILLANCE RADAR',
            protocol: 'ACOUSTIC_MONITOR',
            description: 'Real-time frequency visualization of the immediate physical sector. Calibrated for ambient noise detection.',
            icon: <GlobeAltIcon />,
            accent: '#e11d48',
            nodeId: 'MOD_02'
        },
        {
            id: 'base64_converter',
            title: 'BASE64 INTERCEPT',
            protocol: 'ENCODING_DECODE_v2',
            description: 'Convert media files to strings for transmission, or paste encoded packets to reconstruct signals.',
            icon: <BookmarkIcon />,
            accent: '#f59e0b',
            nodeId: 'MOD_03'
        },
        {
            id: 'transcoder',
            title: 'DATA TRANSCODER',
            protocol: 'PROTOCOL_CONVERSION',
            description: 'Transform plaintext arrays into Hex, Binary, or Base64 sequences for archival node storage.',
            icon: <CodeBracketIcon />,
            accent: '#10b981',
            nodeId: 'MOD_04'
        },
        {
            id: 'deep_sync',
            title: 'DEEP SYNC',
            protocol: 'COGNITIVE_FOCUS',
            description: 'Establish a neural-acoustic link using calibrated noise frequencies. Optimized for deep focus and signal isolation.',
            icon: <RadioIcon />,
            accent: '#e11d48',
            nodeId: 'MOD_05'
        },
        {
            id: 'signal_scrambler',
            title: 'SIGNAL SCRAMBLER',
            protocol: 'SIGNAL_MASKING',
            description: 'Apply high-intensity interference to plaintext sequences. Essential for masking sensitive data during transmission.',
            icon: <ExclamationTriangleIcon />,
            accent: '#22d3ee',
            nodeId: 'MOD_06'
        }
    ];

    return (
        <div className="h-full min-h-0 flex-grow overflow-y-auto bg-void-bg p-4 md:p-16 pt-[calc(4rem+var(--safe-top))] pb-[calc(10rem+env(safe-area-inset-bottom))] animate-fade-in relative scrollbar-hide font-mono">
            <ContextualIntel 
                tipId="utility_intel" 
                title="Tactical Hub" 
                content="Sector Utilities allow you to manipulate raw signals. Use the Streamer for media reconnaissance and the Radar for acoustic surveillance." 
            />
            
            <div className="fixed inset-0 pointer-events-none opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(var(--void-text-main) 1px, transparent 1px), linear-gradient(90deg, var(--void-text-main) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

            <div className="max-w-7xl mx-auto relative z-10">
                <header className="mb-10 md:mb-16 flex flex-col lg:flex-row lg:items-end justify-between gap-6 md:gap-8 border-b-4 border-void-border pb-8 md:pb-12 px-4 md:px-0">
                    <div className="flex items-center gap-4 md:gap-8 max-w-full">
                        <div className="p-3 md:p-4 bg-terminal border-2 md:border-4 border-void-bg shadow-[4px_4px_0px_var(--void-accent)] md:shadow-[8px_8px_0px_var(--void-accent)] rounded-void shrink-0">
                            <CpuChipIcon className="w-8 h-8 md:w-12 md:h-12 text-void-bg" />
                        </div>
                        <div className="min-w-0 pr-6 overflow-visible">
                            <h1 className="text-xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-terminal tracking-tighter uppercase italic leading-none whitespace-nowrap">SECTOR_UTILITIES</h1>
                            <div className="flex items-center gap-2 md:gap-3 mt-2 md:mt-5">
                                <span className="text-pulse-500 font-black uppercase text-[8px] md:text-xs tracking-[0.2em] md:tracking-[0.4em] italic whitespace-nowrap">Link_Active</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 md:gap-4 shrink-0">
                        <button onClick={onToggleTheme} className="flex items-center gap-3 p-3 md:p-4 bg-void-surface rounded-2xl text-muted border border-void-border active:scale-90 transition-transform hover:text-pulse-500 shadow-xl focus:ring-4 focus:ring-pulse-500 outline-none">
                            <PaletteIcon className="w-5 h-5 md:w-7 md:h-7" />
                            <span className="text-xs font-black uppercase italic tracking-widest hidden sm:inline">{themeLabel}</span>
                        </button>
                        <button onClick={onBackToHub} className="group p-3 md:p-4 bg-void-surface border-2 border-void-border rounded-void text-muted hover:text-terminal hover:border-pulse-500 transition-all active:scale-90 shadow-xl flex items-center justify-center gap-3 outline-none focus:ring-4 focus:ring-terminal">
                            <span className="text-[9px] font-black uppercase tracking-widest hidden sm:block">Close_Console</span>
                            <XIcon className="w-5 h-5 md:w-7 md:h-7" />
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    {utils.map(util => (
                        <div 
                            key={util.id}
                            className="group relative bg-zinc-900 border-[3px] border-void-border hover:border-pulse-500 transition-all duration-500 p-6 md:p-8 shadow-2xl flex flex-col overflow-hidden rounded-void"
                        >
                            <div className="flex justify-between items-start mb-6 md:mb-8">
                                <div className="p-3 md:p-4 bg-black border-2 border-white/5 rounded-xl transition-all duration-500 group-hover:scale-110">
                                    {React.cloneElement(util.icon, { className: "w-8 h-8 md:w-10 md:h-10 text-zinc-400 group-hover:text-white transition-colors" })}
                                </div>
                                <div className="text-right flex flex-col items-end gap-1">
                                    <span className="text-[7px] font-black text-zinc-500 uppercase tracking-[0.4em]">{util.nodeId}</span>
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 shadow-[0_0_5px_#10b981] animate-pulse" />
                                    </div>
                                </div>
                            </div>
                            
                            <h3 className="text-lg md:text-xl font-black text-white italic uppercase tracking-tighter mb-2 leading-none">{util.title}</h3>
                            <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest font-mono mb-4 md:mb-6 italic" style={{ color: util.accent }}>{util.protocol}</p>
                            <p className="text-[9px] text-zinc-300 uppercase font-black leading-relaxed mb-8 md:mb-10 flex-grow border-l-2 border-white/10 pl-4 transition-colors group-hover:text-white">{util.description}</p>
                            
                            <div className="mt-auto">
                                <button 
                                    onClick={() => onSelect(util.id)}
                                    className="w-full py-3 md:py-4 bg-terminal text-inverse font-black uppercase italic text-[9px] md:text-xs tracking-widest transition-all hover:bg-pulse-500 hover:text-white active:translate-y-0.5 shadow-xl flex items-center justify-center gap-3 rounded-void border border-void-border"
                                >
                                    <SparklesIcon className="w-4 h-4" />
                                    <span>Mount_Module</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────
   SIGNAL STREAMER PAGE
   ───────────────────────────────────────────────── */
export const SignalStreamerPage: React.FC<{ onBackToHub: () => void }> = ({ onBackToHub }) => {
    const [mediaUrl, setMediaUrl] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'AUDIO' | 'VIDEO' | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const [isAndroid, setIsAndroid] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            const type = file.type.startsWith('video') ? 'VIDEO' : 'AUDIO';
            setMediaType(type);
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
            
            <input 
                id="void-signal-input"
                ref={fileInputRef}
                type="file" 
                className="absolute w-0 h-0 opacity-0 pointer-events-none" 
                accept="audio/*,video/*" 
                onChange={handleFileChange} 
            />
            
            <div className="max-w-4xl w-full flex flex-col h-full relative z-10 pb-[calc(1.5rem+var(--safe-bottom))]">
                
                <header className="mb-4 flex justify-between items-center bg-zinc-900/50 p-4 md:p-6 rounded-[1.5rem] border border-white/5 backdrop-blur-xl shrink-0 mt-[var(--safe-top)] landscape:mt-0 landscape:py-2">
                    <div className="flex items-center gap-3 md:gap-4">
                        <button onClick={onBackToHub} className="p-2 md:p-3 bg-zinc-800 rounded-xl md:rounded-2xl text-zinc-400 hover:text-white transition-all active:scale-95">
                            <XIcon className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                        <div>
                             <span className="text-[7px] md:text-[9px] font-black text-neon-400 uppercase tracking-[0.4em] block mb-0.5 md:mb-1 italic">
                                {isAndroid ? "ANDROID_FILESYSTEM_LINK" : "STATION_FILESYSTEM_LINK"}
                             </span>
                             <h2 className="text-xs md:text-xl font-black italic uppercase text-white tracking-tighter leading-none">SIGNAL STREAMER</h2>
                        </div>
                    </div>
                    {mediaUrl && (
                        <Tooltip text="Replace current packet with new data stream.">
                            <label htmlFor="void-signal-input" className="p-2 bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all active:scale-95 cursor-pointer">
                                <ArrowPathIcon className="w-5 h-5" />
                            </label>
                        </Tooltip>
                    )}
                </header>

                <div className="flex-1 flex flex-col items-center justify-center min-h-0 py-2 relative overflow-hidden">
                    {!mediaUrl ? (
                        <label 
                            htmlFor="void-signal-input"
                            className="w-full aspect-square max-w-[320px] md:max-w-[400px] border-4 border-dashed border-zinc-800 rounded-[2.5rem] md:rounded-[3rem] flex flex-col items-center justify-center relative overflow-hidden active:scale-95 active:bg-zinc-900/50 transition-all shadow-2xl bg-void-950/50 group cursor-pointer hover:border-pulse-500/50"
                        >
                            <div className="relative z-10 flex flex-col items-center p-8 pointer-events-none">
                                <div className="p-4 md:p-6 bg-zinc-900 rounded-full border-2 border-zinc-800 mb-4 md:mb-6 group-hover:border-pulse-500 transition-all shadow-xl text-zinc-700 group-hover:text-pulse-500">
                                    <FolderIcon className="w-12 h-12 md:w-16 md:h-16" />
                                </div>
                                <p className="text-[10px] md:text-xs font-black uppercase italic tracking-[0.3em] text-zinc-500 group-hover:text-white mb-2 text-center transition-colors">ESTABLISH_STORAGE_LINK</p>
                                <p className="text-[7px] md:text-[8px] font-bold uppercase text-zinc-700 tracking-widest font-mono italic">TAP_TO_PROBE_MEMORY</p>
                            </div>
                            <div className="absolute bottom-4 left-0 right-0 text-center">
                                <span className="text-[6px] text-zinc-800 font-black uppercase tracking-widest">0x99_ACCESS_GRANTED</span>
                            </div>
                        </label>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center relative bg-black rounded-[2rem] border-4 border-zinc-900 overflow-hidden shadow-2xl min-h-0">
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

                <div className="mt-4 bg-zinc-900/95 p-4 md:p-6 rounded-[1.5rem] border border-white/5 shrink-0 flex flex-col items-center justify-between gap-4 backdrop-blur-md shadow-2xl relative">
                    <div className="flex flex-col min-w-0 w-full text-center">
                        <span className="text-[7px] md:text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-0.5 italic">ACTIVE SIGNAL PACKET</span>
                        <span className="text-[10px] md:text-xs font-black text-white italic truncate block px-4">{fileName || "AWAITING_RECEPTION"}</span>
                    </div>
                    <div className="flex gap-3 w-full">
                        <Tooltip text="Access device memory to load audio or surveillance video.">
                            <label 
                                htmlFor="void-signal-input"
                                className="flex-1 px-4 py-4 bg-zinc-100 text-black font-black uppercase italic text-[10px] tracking-widest rounded-xl shadow-[0_4px_0_#a1a1aa] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center cursor-pointer w-full"
                            >
                                {mediaUrl ? "RE-SYNC_NODE" : "LINK_MEMORY"}
                            </label>
                        </Tooltip>
                        {mediaUrl && (
                            <Tooltip text="Purge current stream and reset buffer.">
                                <button 
                                    onClick={handleEject}
                                    className="px-8 py-4 bg-zinc-800 text-pulse-500 font-black uppercase italic text-[10px] tracking-widest rounded-xl hover:bg-pulse-500 hover:text-white transition-all border border-pulse-500/20 active:scale-95"
                                >
                                    EJECT
                                </button>
                            </Tooltip>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
};

/* ─────────────────────────────────────────────────
   SURVEILLANCE RADAR PAGE
   ───────────────────────────────────────────────── */
export const SurveillanceRadarPage: React.FC<{ onBackToHub: () => void }> = ({ onBackToHub }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isMonitoring, setIsMonitoring] = useState(false);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyzerRef = useRef<AnalyserNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationRef = useRef<number>(0);

    const startMonitoring = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioCtx.createMediaStreamSource(stream);
            const analyzer = audioCtx.createAnalyser();
            analyzer.fftSize = 256;
            
            source.connect(analyzer);
            audioCtxRef.current = audioCtx;
            analyzerRef.current = analyzer;
            
            setIsMonitoring(true);
            soundService.playAction();
            draw();
        } catch (err) {
            alert("Microphone Access Denied. Cannot establish intercept.");
        }
    };

    const stopMonitoring = () => {
        setIsMonitoring(false);
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        if (audioCtxRef.current) audioCtxRef.current.close();
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };

    const draw = () => {
        const canvas = canvasRef.current;
        const analyzer = analyzerRef.current;
        if (!canvas || !analyzer) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = analyzer.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const render = () => {
            animationRef.current = requestAnimationFrame(render);
            analyzer.getByteFrequencyData(dataArray);

            const { width, height } = canvas;
            ctx.clearRect(0, 0, width, height);
            
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = Math.min(centerX, centerY) * 0.8;

            // Draw Background Radar Rings
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            [0.3, 0.6, 0.9].forEach(r => {
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius * r, 0, Math.PI * 2);
                ctx.stroke();
            });

            // Draw Frequency Points
            ctx.beginPath();
            ctx.strokeStyle = 'var(--void-accent)';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'var(--void-accent)';

            for (let i = 0; i < bufferLength; i++) {
                const value = dataArray[i] / 255;
                const angle = (i / bufferLength) * Math.PI * 2;
                const dist = radius * 0.3 + (value * radius * 0.6);
                
                const x = centerX + Math.cos(angle) * dist;
                const y = centerY + Math.sin(angle) * dist;

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Sweeping Radar Line
            const sweepAngle = (Date.now() / 1000) % (Math.PI * 2);
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX + Math.cos(sweepAngle) * radius, centerY + Math.sin(sweepAngle) * radius);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.stroke();
        };

        render();
    };

    useEffect(() => {
        return () => stopMonitoring();
    }, []);

    return (
        <main className="w-full h-full bg-zinc-950 flex flex-col items-center p-6 font-mono text-white relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-5 cctv-overlay" />
            <div className="max-w-xl w-full flex flex-col h-full relative z-10">
                <header className="mb-8 flex justify-between items-center bg-zinc-900/50 p-6 rounded-3xl border border-white/5 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <button onClick={onBackToHub} className="p-3 bg-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all"><XIcon className="w-6 h-6" /></button>
                        <div>
                             <span className="text-[9px] font-black text-pulse-500 uppercase tracking-[0.4em] block mb-1 italic">Protocol: ACOUSTIC_MONITOR</span>
                             <h2 className="text-xl font-black italic uppercase text-white tracking-tighter leading-none">SURVEILLANCE RADAR</h2>
                        </div>
                    </div>
                </header>

                <div className="flex-grow flex items-center justify-center relative">
                    <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                        <GlobeAltIcon className="w-64 h-64 text-zinc-800 animate-pulse" />
                    </div>
                    <canvas ref={canvasRef} width={400} height={400} className="w-full max-w-[400px] aspect-square" />
                    
                    {!isMonitoring && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-full m-8">
                            <button onClick={startMonitoring} className="p-8 bg-pulse-500 rounded-full shadow-[0_0_50px_rgba(225,29,72,0.5)] border-4 border-white/20 active:scale-90 transition-transform">
                                <RadioIcon className="w-12 h-12 text-white animate-pulse" />
                            </button>
                            <p className="mt-8 text-[10px] font-black uppercase tracking-[0.5em] text-pulse-500 italic">Initiate_Acoustic_Link</p>
                        </div>
                    )}
                </div>

                <div className="mt-8 bg-zinc-900/80 p-6 rounded-3xl border border-white/5 backdrop-blur-md">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Signal_Status</span>
                        <span className={`text-[8px] font-black uppercase italic ${isMonitoring ? 'text-emerald-500' : 'text-red-500'}`}>{isMonitoring ? 'STABLE' : 'OFFLINE'}</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-relaxed uppercase italic">Monitoring for ultrasonic triggers and unauthorized vocal telemetry within the immediate sector.</p>
                    {isMonitoring && (
                        <button onClick={stopMonitoring} className="w-full mt-6 py-4 bg-zinc-800 border border-pulse-500/30 text-pulse-500 font-black uppercase italic text-xs rounded-xl active:scale-95 transition-all">Sever_Intercept</button>
                    )}
                </div>
            </div>
        </main>
    );
};

/* ─────────────────────────────────────────────────
   BASE64 CONVERTER PAGE
   ───────────────────────────────────────────────── */
export const Base64ConverterPage: React.FC<{ onBackToHub: () => void }> = ({ onBackToHub }) => {
    const [inputString, setInputString] = useState("");
    const [outputString, setOutputString] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsProcessing(true);
            const reader = new FileReader();
            reader.onload = (event) => {
                const b64 = event.target?.result as string;
                setOutputString(b64);
                setIsProcessing(false);
            };
            reader.onerror = () => {
                alert("Intercept failed: Corruption in source packet.");
                setIsProcessing(false);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDownload = () => {
        if (!inputString) return;
        try {
            const link = document.createElement('a');
            link.href = inputString;
            link.download = `VOID_RECON_${Date.now()}`;
            link.click();
        } catch (e) {
            alert("Export error: Packet sequence invalid.");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Encoded string synchronized to clipboard buffer.");
    };

    const clearBuffers = () => {
        setInputString("");
        setOutputString("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const detectedMime = inputString.match(/^data:([^;]+);base64,/)?.[1];

    return (
        <main className="w-full h-full bg-zinc-950 flex flex-col items-center p-4 md:p-8 font-mono text-white overflow-y-auto scrollbar-hide">
            <div className="absolute inset-0 pointer-events-none opacity-5 cctv-overlay" />
            
            <div className="max-w-4xl w-full space-y-6 md:space-y-10 relative z-10 pb-[calc(4rem+var(--safe-bottom))]">
                
                <header className="flex justify-between items-center bg-zinc-900/60 p-6 rounded-[2rem] border border-white/5 backdrop-blur-xl shrink-0 mt-[var(--safe-top)]">
                    <div className="flex items-center gap-4">
                        <button onClick={onBackToHub} className="p-3 bg-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all active:scale-95 border border-white/5 shadow-md">
                            <XIcon className="w-6 h-6" />
                        </button>
                        <div>
                             <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.4em] block mb-1 italic">ENCODING_STATION_v2</span>
                             <h2 className="text-xl font-black italic uppercase text-white tracking-tighter leading-none">BASE64 INTERCEPT</h2>
                        </div>
                    </div>
                    <button onClick={clearBuffers} className="p-3 bg-zinc-800 rounded-2xl text-zinc-500 hover:text-white transition-all active:rotate-180 duration-500">
                        <ArrowPathIcon className="w-6 h-6" />
                    </button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-zinc-900/40 p-8 rounded-[2.5rem] border-2 border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest italic">Signal to String</h3>
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        </div>

                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                        
                        <div className="flex-grow flex flex-col gap-6">
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full aspect-[16/6] border-2 border-dashed border-zinc-700 rounded-2xl flex flex-col items-center justify-center gap-3 group hover:border-amber-500 hover:bg-amber-500/5 transition-all active:scale-95"
                            >
                                <CloudArrowUpIcon className="w-8 h-8 text-zinc-600 group-hover:text-amber-500 transition-colors" />
                                <span className="text-[10px] font-black uppercase text-zinc-500 group-hover:text-white">INTERCEPT_LOCAL_FILE</span>
                            </button>

                            <div className="relative">
                                <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest block mb-2 px-1 italic">Output Data URI</label>
                                <div className="w-full h-40 bg-black border-2 border-zinc-800 rounded-2xl p-4 overflow-y-auto scrollbar-hide text-[10px] font-black text-amber-600/80 break-all leading-relaxed relative">
                                    {isProcessing ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                                            <span className="animate-pulse">ENCODING_BITS...</span>
                                        </div>
                                    ) : outputString || "AWAITING_INPUT_PACKET..."}
                                </div>
                                {outputString && (
                                    <button 
                                        onClick={() => copyToClipboard(outputString)}
                                        className="absolute bottom-4 right-4 bg-zinc-800/80 p-2 rounded-lg text-white hover:bg-amber-500 transition-colors border border-white/5"
                                    >
                                        <SparklesIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-zinc-900/40 p-8 rounded-[2.5rem] border-2 border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest italic">String to Signal</h3>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>

                        <div className="flex-grow flex flex-col gap-6">
                            <div className="relative">
                                <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest block mb-2 px-1 italic">Input Data Stream</label>
                                <textarea 
                                    value={inputString}
                                    onChange={(e) => setInputString(e.target.value)}
                                    placeholder="Paste Base64 data string here (data:image/png;base64,...)"
                                    className="w-full h-32 bg-black border-2 border-zinc-800 rounded-2xl p-4 text-[10px] font-black text-emerald-600/80 outline-none focus:border-emerald-500 transition-all resize-none scrollbar-hide"
                                />
                            </div>

                            <div className="flex-grow">
                                <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest block mb-2 px-1 italic">Reconstructed Preview</label>
                                <div className="w-full aspect-video bg-black border-2 border-zinc-800 rounded-2xl overflow-hidden flex items-center justify-center relative">
                                    {inputString ? (
                                        <>
                                            <div className="absolute inset-0 cctv-overlay pointer-events-none opacity-40 z-10" />
                                            {detectedMime?.startsWith('image') ? (
                                                <img src={inputString} className="max-w-full max-h-full object-contain saturate-50" />
                                            ) : detectedMime?.startsWith('video') ? (
                                                <video src={inputString} controls className="max-w-full max-h-full" />
                                            ) : detectedMime?.startsWith('audio') ? (
                                                <audio src={inputString} controls className="w-[80%] invert" />
                                            ) : (
                                                <div className="text-center p-4">
                                                    <ExclamationTriangleIcon className="w-8 h-8 text-zinc-800 mx-auto mb-2" />
                                                    <p className="text-[8px] text-zinc-600 uppercase font-black">Unknown_Mime_Type</p>
                                                    <p className="text-[6px] text-zinc-700 mt-1">{detectedMime || 'NULL'}</p>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center opacity-10">
                                            <BookmarkIcon className="w-12 h-12 mb-2" />
                                            <span className="text-[8px] font-black uppercase">RECON_IDLE</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button 
                                onClick={handleDownload}
                                disabled={!inputString}
                                className="w-full py-4 bg-zinc-100 text-black font-black uppercase italic text-xs tracking-[0.2em] rounded-xl hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-30 flex items-center justify-center gap-3 active:scale-95 shadow-lg"
                            >
                                <CloudArrowDownIcon className="w-5 h-5" />
                                <span>Export Signal</span>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="p-6 bg-zinc-900 border border-white/5 rounded-3xl text-center opacity-40">
                     <span className="text-[8px] font-black text-zinc-500 uppercase tracking-[1em] italic">PACKET_TRANSMISSION_STATION // NOIR_ENCRYPT</span>
                </div>
            </div>
        </main>
    );
};

/* ─────────────────────────────────────────────────
   TRANSCODER PAGE
   ───────────────────────────────────────────────── */
export const TranscoderPage: React.FC<{ onBackToHub: () => void }> = ({ onBackToHub }) => {
    const [input, setInput] = useState("");
    const [hex, setHex] = useState("");
    const [binary, setBinary] = useState("");
    const [base64, setBase64] = useState("");

    useEffect(() => {
        if (!input) {
            setHex(""); setBinary(""); setBase64("");
            return;
        }

        try {
            // Hex
            const hexResult = input.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ').toUpperCase();
            setHex(hexResult);

            // Binary
            const binResult = input.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
            setBinary(binResult);

            // Base64
            setBase64(btoa(input));
        } catch (e) {
            console.warn("Transcoding error", e);
        }
    }, [input]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Packet Cloned to Buffer.");
    };

    return (
        <main className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-6 font-mono text-white overflow-y-auto scrollbar-hide">
            <div className="max-w-4xl w-full space-y-8 pb-20">
                <header className="flex justify-between items-center bg-zinc-900/50 p-6 rounded-[2rem] border border-white/5 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <button onClick={onBackToHub} className="p-3 bg-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all"><XIcon className="w-6 h-6" /></button>
                        <div>
                             <span className="text-[9px] font-black text-signal-500 uppercase tracking-[0.4em] block mb-1 italic">Protocol: TRANSCODE_V1</span>
                             <h2 className="text-xl font-black italic uppercase text-white tracking-tighter leading-none">DATA TRANSCODER</h2>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-2 italic block">Input Buffer (ASCII)</label>
                        <textarea 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Enter plaintext to transcode..."
                            className="w-full h-80 bg-void-900 border-4 border-zinc-800 rounded-[2.5rem] p-8 text-white font-black italic placeholder-zinc-700 outline-none focus:border-pulse-500 transition-all shadow-inner resize-none"
                        />
                    </div>

                    <div className="space-y-6">
                        <OutputBlock label="Hexadecimal Protocol" value={hex} onCopy={() => copyToClipboard(hex)} />
                        <OutputBlock label="Binary Stream" value={binary} onCopy={() => copyToClipboard(binary)} />
                        <OutputBlock label="Base64 Encoding" value={base64} onCopy={() => copyToClipboard(base64)} />
                    </div>
                </div>
            </div>
        </main>
    );
};

const OutputBlock: React.FC<{ label: string, value: string, onCopy: () => void }> = ({ label, value, onCopy }) => (
    <div className="bg-void-900 border-2 border-zinc-800 rounded-3xl p-6 relative group hover:border-pulse-500/50 transition-all">
        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-2 block italic">{label}</span>
        <div className="min-h-[60px] max-h-[120px] overflow-y-auto scrollbar-hide mb-4">
            <p className="text-xs font-black text-signal-500 break-all leading-relaxed">{value || "AWAITING_INPUT..."}</p>
        </div>
        <button 
            onClick={onCopy}
            disabled={!value}
            className="w-full py-3 bg-zinc-800/50 text-[9px] font-black uppercase italic tracking-widest text-zinc-400 hover:bg-pulse-500 hover:text-white disabled:opacity-30 transition-all rounded-xl border border-white/5"
        >
            Extract Packet
        </button>
    </div>
);

/* ─────────────────────────────────────────────────
   DEEP SYNC PAGE (WHITE NOISE)
   ───────────────────────────────────────────────── */
export const DeepSyncPage: React.FC<{ onBackToHub: () => void }> = ({ onBackToHub }) => {
    const [isActive, setIsActive] = useState(false);
    const [noiseType, setNoiseType] = useState<'WHITE' | 'PINK' | 'BROWN'>('BROWN');
    const [timeLeft, setTimeLeft] = useState(1500); // 25 mins
    const audioCtx = useRef<AudioContext | null>(null);
    const noiseNode = useRef<AudioNode | null>(null);
    const gainNode = useRef<GainNode | null>(null);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    useEffect(() => {
        let timer: number;
        if (isActive && timeLeft > 0) {
            timer = window.setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            stopNoise();
        }
        return () => clearInterval(timer);
    }, [isActive, timeLeft]);

    const createNoise = () => {
        if (!audioCtx.current) audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const ctx = audioCtx.current;
        const bufferSize = 2 * ctx.sampleRate;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);

        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            if (noiseType === 'WHITE') {
                output[i] = Math.random() * 2 - 1;
            } else if (noiseType === 'BROWN') {
                const white = Math.random() * 2 - 1;
                output[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = output[i];
                output[i] *= 3.5; // amplification
            } else { // PINK
                const white = Math.random() * 2 - 1;
                // Simple pink noise approximation
                output[i] = (lastOut + (0.1 * white)) / 1.1;
                lastOut = output[i];
                output[i] *= 2;
            }
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        return source;
    };

    const startNoise = () => {
        if (!audioCtx.current) audioCtx.current = new AudioContext();
        gainNode.current = audioCtx.current.createGain();
        gainNode.current.gain.setValueAtTime(0, audioCtx.current.currentTime);
        gainNode.current.gain.linearRampToValueAtTime(0.15, audioCtx.current.currentTime + 2);
        
        noiseNode.current = createNoise();
        noiseNode.current.connect(gainNode.current);
        gainNode.current.connect(audioCtx.current.destination);
        (noiseNode.current as AudioBufferSourceNode).start();
    };

    const stopNoise = () => {
        if (gainNode.current && audioCtx.current) {
            gainNode.current.gain.linearRampToValueAtTime(0, audioCtx.current.currentTime + 1);
            setTimeout(() => {
                if (noiseNode.current) (noiseNode.current as AudioBufferSourceNode).stop();
            }, 1000);
        }
    };

    const toggleSync = () => {
        if (!isActive) {
            startNoise();
            setIsActive(true);
        } else {
            stopNoise();
            setIsActive(false);
        }
    };

    return (
        <main className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-6 font-mono text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            
            <div className="max-w-md w-full relative z-10 space-y-8">
                <header className="flex justify-between items-center bg-zinc-900/50 p-6 rounded-[2rem] border border-white/5 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <button onClick={() => { stopNoise(); onBackToHub(); }} className="p-3 bg-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all"><XIcon className="w-6 h-6" /></button>
                        <div>
                             <span className="text-[9px] font-black text-pulse-500 uppercase tracking-[0.4em] block mb-1 italic">Protocol: COGNITIVE_FOCUS</span>
                             <h2 className="text-xl font-black italic uppercase text-white tracking-tighter leading-none">DEEP SYNC</h2>
                        </div>
                    </div>
                </header>

                <div className="bg-void-900/40 p-10 rounded-[3rem] border-4 border-zinc-800 shadow-2xl text-center relative overflow-hidden">
                    <div className="mb-10 relative">
                        <div className={`w-32 h-32 rounded-full border-4 mx-auto flex items-center justify-center transition-all duration-1000 ${isActive ? 'border-pulse-500 shadow-[0_0_50px_rgba(225,29,72,0.4)] animate-pulse' : 'border-zinc-800'}`}>
                            <RadioIcon className={`w-16 h-16 ${isActive ? 'text-pulse-500' : 'text-zinc-700'}`} />
                        </div>
                    </div>

                    <div className="mb-8">
                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-2">Sync Timer</span>
                        <div className="text-6xl font-black italic text-white tracking-tighter font-mono drop-shadow-lg">
                            {formatTime(timeLeft)}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-10">
                        {(['WHITE', 'PINK', 'BROWN'] as const).map(t => (
                            <button 
                                key={t}
                                onClick={() => { setNoiseType(t); if(isActive) { stopNoise(); startNoise(); } }}
                                className={`py-3 rounded-xl text-[9px] font-black uppercase italic border-2 transition-all ${noiseType === t ? 'bg-pulse-600 border-pulse-400 text-white shadow-lg' : 'bg-zinc-900 border-transparent text-zinc-500 hover:text-zinc-300'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    <button 
                        onClick={toggleSync}
                        className={`w-full py-5 rounded-2xl font-black text-xl uppercase italic tracking-widest transition-all shadow-xl border-2 ${isActive ? 'bg-zinc-800 border-zinc-700 text-pulse-500' : 'bg-white border-white text-black hover:scale-[1.02]'}`}
                    >
                        {isActive ? 'TERMINATE_LINK' : 'ESTABLISH_SYNC'}
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setTimeLeft(1500)} className="py-4 bg-zinc-900 border border-white/5 rounded-2xl text-[10px] font-black uppercase italic text-zinc-500 hover:text-white transition-all">Reset Buffer</button>
                    <button onClick={() => setTimeLeft(prev => prev + 300)} className="py-4 bg-zinc-900 border border-white/5 rounded-2xl text-[10px] font-black uppercase italic text-zinc-500 hover:text-white transition-all">+5 Minutes</button>
                </div>
            </div>
        </main>
    );
};

/* ─────────────────────────────────────────────────
   SIGNAL SCRAMBLER PAGE
   ───────────────────────────────────────────────── */
export const SignalScramblerPage: React.FC<{ onBackToHub: () => void }> = ({ onBackToHub }) => {
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [intensity, setIntensity] = useState(0.5);

    const scramble = (str: string) => {
        const chars = "!@#$%^&*()_+-=[]{}|;:,.<>?/0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        return str.split('').map(char => {
            if (char === ' ' || char === '\n') return char;
            if (Math.random() < intensity) {
                return chars[Math.floor(Math.random() * chars.length)];
            }
            return char.toUpperCase();
        }).join('');
    };

    useEffect(() => {
        const timer = setInterval(() => {
            if (input) setOutput(scramble(input));
        }, 100);
        return () => clearInterval(timer);
    }, [input, intensity]);

    const copyToBuffer = () => {
        navigator.clipboard.writeText(output);
        // Using toast instead of alert
        // toast.info("Encrypted Segment Cloned to Buffer.");
    };

    return (
        <main className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-6 font-mono text-white overflow-y-auto scrollbar-hide">
            <div className="max-w-2xl w-full space-y-8">
                <header className="flex justify-between items-center bg-zinc-900/50 p-6 rounded-[2rem] border border-white/5 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <button onClick={onBackToHub} className="p-3 bg-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all"><XIcon className="w-6 h-6" /></button>
                        <div>
                             <span className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.4em] block mb-1 italic">Protocol: SIGNAL_MASKING</span>
                             <h2 className="text-xl font-black italic uppercase text-white tracking-tighter leading-none">SIGNAL SCRAMBLER</h2>
                        </div>
                    </div>
                </header>

                <div className="bg-void-900/40 p-8 rounded-[3rem] border-4 border-zinc-800 shadow-2xl space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 block italic">Input Sequence</label>
                        <textarea 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Enter data to mask..."
                            className="w-full h-32 bg-black/40 border-2 border-zinc-800 rounded-2xl p-4 text-white font-black italic focus:border-cyan-400 outline-none transition-all resize-none"
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-black text-zinc-500 uppercase italic">
                            <span>Interference Level</span>
                            <span className="text-cyan-400">{Math.round(intensity * 100)}%</span>
                        </div>
                        <input 
                            type="range" min="0" max="1" step="0.01" 
                            value={intensity} onChange={(e) => setIntensity(parseFloat(e.target.value))}
                            className="w-full accent-cyan-400"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 block italic">Masked Output</label>
                        <div className="w-full h-48 bg-black border-2 border-cyan-400/30 rounded-2xl p-6 overflow-y-auto scrollbar-hide relative group">
                            <div className="absolute inset-0 cctv-overlay opacity-20 pointer-events-none" />
                            <p className="text-sm font-black text-cyan-400 break-all leading-relaxed whitespace-pre-wrap">{output || "AWAITING_INPUT..."}</p>
                        </div>
                    </div>

                    <button 
                        onClick={copyToBuffer}
                        disabled={!output}
                        className="w-full py-5 bg-cyan-500 text-black font-black text-sm uppercase italic tracking-widest rounded-2xl hover:bg-white transition-all disabled:opacity-30 shadow-lg"
                    >
                        EXTRACT_MASKED_PACKET
                    </button>
                </div>
            </div>
        </main>
    );
};
