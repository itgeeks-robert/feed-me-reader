
import React, { useState, useEffect, useRef } from 'react';
import type { Settings, Theme, ArticleView, WidgetSettings, Feed, Folder, Selection } from '../src/App';
import { XIcon, SunIcon, MoonIcon, CloudArrowUpIcon, CloudArrowDownIcon, TrashIcon, BookmarkIcon, ListIcon, PlusIcon, FolderIcon, ShieldCheckIcon, SparklesIcon, CpuChipIcon, ExclamationTriangleIcon, RadioIcon, GlobeAltIcon } from './icons';
import AddSource, { SourceType } from './AddSource';
import { exportToOpml, parseOpml } from '../services/opmlService';
import ContextualIntel from './ContextualIntel';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: Settings;
    onUpdateSettings: (newSettings: Partial<Omit<Settings, 'feeds' | 'folders'>>) => void;
    onSelect: (sel: Selection) => void;
    onAddFolder: (name: string) => void;
    onRenameFolder: (id: number, newName: string) => void;
    onDeleteFolder: (id: number) => void;
    onRemoveFeed: (id: number) => void;
    onImportOpml: (feeds: Omit<Feed, 'id'>[], folders: Folder[]) => void;
    onExportOpml: () => void;
    onImportSettings: (file: File) => void;
    onExportSettings: () => void;
    onAddSource: (url: string, type: SourceType) => Promise<void>;
    onEnterUtils: () => void;
}

type Tab = 'CORE' | 'NODES' | 'DISPLAY' | 'MEMORY';

const THEME_PREVIEWS: { id: Theme; name: string; desc: string; colors: string }[] = [
    { id: 'noir', name: 'NOIR', desc: 'Default technical neon.', colors: 'bg-black border-pulse-500' },
    { id: 'liquid-glass', name: 'GLASS', desc: 'Modern frost & blurs.', colors: 'bg-slate-900 border-sky-400' },
    { id: 'bento-grid', name: 'BENTO', desc: 'Clean iOS light mode.', colors: 'bg-slate-100 border-blue-600' },
    { id: 'brutalist', name: 'BRUTAL', desc: 'Stark B&W Newspaper.', colors: 'bg-white border-black' },
    { id: 'claymorphism', name: 'CLAY', desc: 'Squishy 3D tactile.', colors: 'bg-indigo-200 border-pink-500' },
    { id: 'monochrome-zen', name: 'ZEN', desc: 'Low-stimulus focus.', colors: 'bg-teal-950 border-teal-500' },
    { id: 'y2k', name: 'Y2K', desc: 'Glossy retro-future.', colors: 'bg-cyan-500 border-yellow-300' },
    { id: 'terminal', name: 'TERMINAL', desc: 'DOS green phosphor.', colors: 'bg-black border-green-500' },
];

const hiddenInputStyle: React.CSSProperties = { display: 'none' };

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, settings, onUpdateSettings, onSelect, 
    onAddFolder, onRenameFolder, onDeleteFolder, onRemoveFeed,
    onImportOpml, onExportOpml, onImportSettings, onExportSettings,
    onAddSource, onEnterUtils
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('CORE');
    const [localSettings, setLocalSettings] = useState({ ...settings });
    const opmlInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { if (isOpen) setLocalSettings({ ...settings }); }, [isOpen, settings]);

    if (!isOpen) return null;

    const handleSave = () => {
        onUpdateSettings(localSettings);
        onClose();
    };
    
    const TabButton: React.FC<{ name: Tab, label: string }> = ({ name, label }) => (
        <button
            onClick={() => setActiveTab(name)}
            className={`flex-1 py-3 text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all border-b-2
                ${activeTab === name 
                    ? 'bg-void-950 text-terminal border-pulse-500' 
                    : 'text-muted hover:text-terminal border-void-border'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-2 md:p-4 font-mono" onClick={onClose} role="dialog" aria-modal="true">
            <ContextualIntel 
                tipId="settings_intel" 
                title="System Calibration" 
                content="Environmental presets modify the 'physics' of the OS—changing border-radius, shadows, and backdrop blurs to match your current operational mood." 
            />
            <div className="void-card w-full max-w-xl max-h-[85vh] flex flex-col relative overflow-hidden" onClick={e => e.stopPropagation()}>
                
                <header className="h-12 border-b border-void-border flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-3">
                        <CpuChipIcon className="w-5 h-5 text-pulse-500" />
                        <h2 className="text-terminal text-[10px] font-black uppercase tracking-[0.2em] italic">SYSTEM_DIAGNOSTICS v1.8.4</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-muted hover:text-terminal transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>
                
                <nav className="flex border-b border-void-border shrink-0">
                    <TabButton name="CORE" label="0x00_CORE" />
                    <TabButton name="NODES" label="0x01_NODES" />
                    <TabButton name="DISPLAY" label="0x02_VISUAL" />
                    <TabButton name="MEMORY" label="0x03_DATA" />
                </nav>

                <div className="p-6 md:p-8 overflow-y-auto flex-grow space-y-8 bg-void-bg/50 relative scrollbar-hide pb-24 md:pb-8">
                    {activeTab === 'CORE' && (<div className="space-y-6 animate-fade-in">
                        <div className="p-6 void-card bg-void-bg">
                            <span className="text-[8px] font-black text-muted uppercase block mb-4 italic tracking-widest border-b border-void-border pb-2">Terminal Metrics</span>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-[7px] text-muted uppercase block mb-1">Node Status</span>
                                    <span className="text-xl font-black text-pulse-500 italic">ENCRYPTED</span>
                                </div>
                                <div>
                                    <span className="text-[7px] text-muted uppercase block mb-1">Packet Integrity</span>
                                    <span className="text-xl font-black text-emerald-500 italic">NOMINAL</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-void flex items-start gap-4">
                            <ShieldCheckIcon className="w-6 h-6 text-zinc-600 shrink-0" />
                            <div>
                                <h4 className="text-[10px] font-black uppercase text-white mb-1">Kernel Integrity Active</h4>
                                <p className="text-[8px] text-zinc-500 leading-relaxed uppercase">Your operational environment is isolated from external telemetry tracking. Signal Acquisition nodes are currently stable.</p>
                            </div>
                        </div>
                    </div>)}

                    {activeTab === 'DISPLAY' && (<div className="space-y-8 animate-fade-in">
                        <div>
                            <h3 className="text-[10px] font-black text-muted uppercase tracking-widest mb-6 italic border-b border-void-border pb-2">Environmental Presets</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {THEME_PREVIEWS.map(t => (
                                    <button 
                                        key={t.id}
                                        onClick={() => setLocalSettings(p => ({...p, theme: t.id}))}
                                        className={`p-4 rounded-void border-2 transition-all flex flex-col gap-3 group text-left
                                            ${localSettings.theme === t.id ? 'border-pulse-500 bg-void-bg shadow-lg' : 'border-void-border bg-void-surface opacity-60 hover:opacity-100 hover:border-terminal/20'}`}
                                    >
                                        <div className={`w-full h-12 rounded-xl border-2 ${t.colors} relative overflow-hidden`}>
                                            <div className="absolute inset-0 opacity-10 bg-black/20" />
                                            <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-white/40" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-terminal leading-none mb-1">{t.name}</p>
                                            <p className="text-[7px] font-bold text-muted uppercase italic line-clamp-1">{t.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>)}

                    {activeTab === 'NODES' && (<div className="space-y-6 animate-fade-in">
                        <div className="flex items-center justify-between border-b border-void-border pb-2">
                            <h3 className="text-[10px] font-black text-muted uppercase tracking-widest italic">Established Zones</h3>
                            <button onClick={() => onAddFolder("NEW_ZONE")} className="p-2 hover:bg-void-surface rounded-lg text-pulse-500 transition-colors">
                                <PlusIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-hide">
                            {settings.folders.map(f => (
                                <div key={f.id} className="flex items-center justify-between p-4 void-card bg-void-bg group">
                                    <div className="flex items-center gap-3 flex-1">
                                        <FolderIcon className="w-4 h-4 text-muted" />
                                        <input value={f.name} onChange={e => onRenameFolder(f.id, e.target.value)} className="bg-transparent text-terminal font-black uppercase italic text-xs outline-none focus:text-pulse-500 w-full" />
                                    </div>
                                    <button onClick={() => onDeleteFolder(f.id)} className="text-muted hover:text-pulse-500 ml-4 opacity-0 group-hover:opacity-100 transition-opacity"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    </div>)}

                    {activeTab === 'MEMORY' && (<div className="space-y-8 animate-fade-in">
                        <div>
                            <h3 className="text-[10px] font-black text-muted uppercase tracking-widest mb-6 italic border-b border-void-border pb-2">Packet Backup (OPML)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="file" ref={opmlInputRef} onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (ev) => {
                                            try {
                                                const { feeds, folders } = parseOpml(ev.target?.result as string);
                                                onImportOpml(feeds, folders);
                                            } catch (err) { alert("Parse Error."); }
                                        };
                                        reader.readAsText(file);
                                    }
                                }} style={hiddenInputStyle} accept=".opml,.xml" />
                                <button onClick={() => opmlInputRef.current?.click()} className="flex items-center justify-center gap-3 py-4 bg-void-bg border border-void-border rounded-void text-[9px] font-black uppercase italic hover:bg-void-surface transition-all"><CloudArrowUpIcon className="w-4 h-4" /> Import_Data</button>
                                <button onClick={onExportOpml} className="flex items-center justify-center gap-3 py-4 bg-void-bg border border-void-border rounded-void text-[9px] font-black uppercase italic hover:bg-void-surface transition-all"><CloudArrowDownIcon className="w-4 h-4" /> Export_Data</button>
                            </div>
                        </div>
                    </div>)}
                </div>

                <footer className="p-6 border-t border-void-border bg-void-bg flex gap-3 shrink-0 z-20">
                    <button onClick={onClose} className="flex-1 py-4 bg-void-surface text-terminal text-[10px] font-black uppercase italic rounded-void active:scale-95 transition-all">ABORT</button>
                    <button onClick={handleSave} className="flex-1 py-4 bg-terminal text-void-bg text-[10px] font-black uppercase italic rounded-void active:scale-95 transition-all shadow-xl">COMMIT_CHANGES</button>
                </footer>
            </div>
        </div>
    );
};

export default SettingsModal;
