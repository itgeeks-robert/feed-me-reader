import React, { useState, useEffect, useRef } from 'react';
import type { Settings, Theme, ArticleView, WidgetSettings, Feed, Folder, Selection } from '../src/App';
import { XIcon, SunIcon, MoonIcon, CloudArrowUpIcon, CloudArrowDownIcon, TrashIcon, BookmarkIcon, ListIcon, PlusIcon, FolderIcon, ShieldCheckIcon, SparklesIcon, CpuChipIcon } from './icons';
import AddSource, { SourceType } from './AddSource';

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
    onImportOpml: (file: File) => void;
    onExportOpml: () => void;
    onImportSettings: (file: File) => void;
    onExportSettings: () => void;
    credits: number;
    onOpenShop: () => void;
    onAddSource: (url: string, type: SourceType) => Promise<void>;
    onEnterUtils: () => void;
}

type Tab = 'CORE' | 'NODES' | 'DISPLAY' | 'MEMORY';

const hiddenInputStyle: React.CSSProperties = { display: 'none' };

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, settings, onUpdateSettings, onSelect, 
    onAddFolder, onRenameFolder, onDeleteFolder, onRemoveFeed,
    onImportOpml, onExportOpml, onImportSettings, onExportSettings,
    credits, onOpenShop, onAddSource, onEnterUtils
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
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, importHandler: (file: File) => void) => {
        const file = event.target.files?.[0];
        if (file) importHandler(file);
        event.target.value = '';
    };

    const handleWidgetChange = (key: keyof WidgetSettings, value: any) => {
        setLocalSettings(prev => ({ ...prev, widgets: { ...prev.widgets, [key]: value } }));
    };

    const handleCutTheFeed = () => {
        if (confirm("CRITICAL WARNING: This will sever all established uplinks and purge your local signal cache. All folders and feeds will be lost. Re-calibrate system?")) {
            localStorage.removeItem('void_feeds_survivor');
            localStorage.removeItem('void_folders_survivor');
            window.location.reload();
        }
    };

    const TabButton: React.FC<{ name: Tab, label: string }> = ({ name, label }) => (
        <button
            onClick={() => setActiveTab(name)}
            className={`flex-1 py-3 text-[8px] md:text-[9px] font-black uppercase tracking-tighter transition-all border-b-2
                ${activeTab === name 
                    ? 'bg-void-950 text-white border-pulse-500' 
                    : 'text-zinc-600 hover:text-zinc-400 border-zinc-800'}`}
        >
            {label}
        </button>
    );
    
    const ActionButton: React.FC<{icon: React.ReactNode, children: React.ReactNode, onClick: () => void, variant?: 'default' | 'danger'}> = ({ icon, children, onClick, variant = 'default' }) => (
        <button 
            onClick={onClick} 
            className={`w-full flex items-center justify-center gap-3 py-3 px-4 text-[9px] font-black uppercase tracking-widest transition-all border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 active:bg-zinc-400
                ${variant === 'danger' 
                    ? 'bg-pulse-600 text-white border-white/50' 
                    : 'bg-zinc-300 text-black'}`}
        >
            {icon}
            <span>{children}</span>
        </button>
    );

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-2 md:p-4 font-mono" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-zinc-900 border-4 border-zinc-800 shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col relative overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* 3D Frame Highlighting */}
                <div className="absolute inset-0 border-t-2 border-l-2 border-zinc-700 pointer-events-none z-10" />
                <div className="absolute inset-0 border-b-2 border-r-2 border-black pointer-events-none z-10" />

                {/* Title Bar */}
                <header className="h-10 bg-zinc-800 flex items-center justify-between px-1 relative z-20 border-b-2 border-black shrink-0">
                    <div className="flex items-center gap-2 h-full">
                        <div className="w-8 h-7 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center">
                           <CpuChipIcon className="w-4 h-4 text-black" />
                        </div>
                        <h2 className="text-white text-[10px] font-black uppercase tracking-[0.2em] italic px-2 truncate max-w-[200px] md:max-w-none">SYSTEM_DIAGNOSTICS v1.8.4</h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-7 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center active:bg-zinc-400">
                        <XIcon className="w-4 h-4 text-black" />
                    </button>
                </header>
                
                {/* Tabs Container */}
                <div className="bg-zinc-900 border-b-2 border-black z-20 shrink-0">
                    <nav className="flex">
                        <TabButton name="CORE" label="0x00_CORE" />
                        <TabButton name="NODES" label="0x01_NODES" />
                        <TabButton name="DISPLAY" label="0x02_VISUAL" />
                        <TabButton name="MEMORY" label="0x03_DATA" />
                    </nav>
                </div>

                <div className="p-4 md:p-8 overflow-y-auto flex-grow space-y-6 bg-void-950 relative scrollbar-hide pb-24 md:pb-8">
                    {/* Subtle Scanlines */}
                    <div className="absolute inset-0 pointer-events-none opacity-5 cctv-overlay" />

                    {activeTab === 'CORE' && (<div className="space-y-6 animate-fade-in">
                        <div className="p-6 bg-zinc-900 border-t-2 border-l-2 border-white/10 border-b-2 border-r-2 border-black">
                            <span className="text-[8px] font-black text-zinc-500 uppercase block mb-4 italic tracking-widest border-b border-zinc-800 pb-2">Terminal Metrics</span>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-[7px] text-zinc-600 uppercase block mb-1">Signal Assets</span>
                                    <span className="text-xl font-black text-pulse-500 italic">{credits.toLocaleString()} SC</span>
                                </div>
                                <div>
                                    <span className="text-[7px] text-zinc-600 uppercase block mb-1">Packet Integrity</span>
                                    <span className="text-xl font-black text-emerald-500 italic">NOMINAL</span>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={onOpenShop}
                            className="w-full p-5 bg-pulse-600 border-t-2 border-l-2 border-white/30 border-b-2 border-r-2 border-pulse-900 flex items-center justify-between group hover:bg-pulse-500 transition-all shadow-lg active:scale-95"
                        >
                            <div className="flex items-center gap-4">
                                <SparklesIcon className="w-6 h-6 text-white animate-pulse" />
                                <div className="text-left">
                                    <span className="text-lg font-black text-white italic uppercase tracking-tighter block leading-none">Access Black Market</span>
                                    <span className="text-[8px] text-white/60 font-black uppercase tracking-widest">Exchange SC for Augments</span>
                                </div>
                            </div>
                            <div className="w-8 h-8 bg-black/20 rounded-full flex items-center justify-center">&rarr;</div>
                        </button>

                        <div className="p-4 bg-zinc-800/20 border border-zinc-800 rounded-xl">
                            <p className="text-[9px] text-zinc-500 uppercase leading-relaxed italic">
                                Operator Note: The core menu facilitates high-level system configuration. For operational tasks (Media, Games, Intel), utilize the persistent bottom synchronization bar.
                            </p>
                        </div>
                    </div>)}

                    {activeTab === 'NODES' && (<div className="space-y-8 animate-fade-in">
                        <div>
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-4">
                                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Established Zones</h3>
                                <button onClick={() => onAddFolder("NEW_ZONE")} className="w-8 h-8 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center text-black active:bg-zinc-400">
                                    <PlusIcon className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-hide">
                                {settings.folders.map(f => (
                                    <div key={f.id} className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 group">
                                        <div className="flex items-center gap-3 flex-1">
                                            <FolderIcon className="w-4 h-4 text-zinc-600" />
                                            <input 
                                                value={f.name} 
                                                onChange={e => onRenameFolder(f.id, e.target.value)}
                                                className="bg-transparent text-white font-black uppercase italic text-xs outline-none focus:text-pulse-500 w-full"
                                            />
                                        </div>
                                        <button onClick={() => onDeleteFolder(f.id)} className="text-zinc-600 hover:text-pulse-500 ml-4 opacity-0 group-hover:opacity-100 transition-opacity"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-4">
                                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Signal Transmissions</h3>
                            </div>
                            <div className="bg-zinc-900 p-4 border-2 border-zinc-800 mb-4">
                                <AddSource onAddSource={onAddSource} />
                            </div>
                            <div className="space-y-2 max-h-[250px] overflow-y-auto scrollbar-hide">
                                {settings.feeds.map(f => (
                                    <div key={f.id} className="flex items-center justify-between p-2 bg-zinc-900 border border-zinc-800">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <img src={f.iconUrl} className="w-3 h-3 grayscale" alt="" />
                                            <span className="text-[9px] font-black text-zinc-400 uppercase italic truncate">{f.title}</span>
                                        </div>
                                        <button onClick={() => onRemoveFeed(f.id)} className="text-zinc-600 hover:text-pulse-500"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>)}

                    {activeTab === 'DISPLAY' && (<div className="space-y-6 animate-fade-in">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Luminance Protocol</label>
                                <div className="flex bg-zinc-900 p-1 border border-zinc-800">
                                    <button onClick={() => setLocalSettings(s => ({...s, theme: 'light'}))} className={`p-2 transition-all ${localSettings.theme === 'light' ? 'bg-pulse-600 text-white shadow-lg' : 'text-zinc-600'}`} title="Light Mode"><SunIcon className="w-4 h-4"/></button>
                                    <button onClick={() => setLocalSettings(s => ({...s, theme: 'dark'}))} className={`p-2 transition-all ${localSettings.theme === 'dark' ? 'bg-pulse-600 text-white shadow-lg' : 'text-zinc-600'}`} title="Dark Mode"><MoonIcon className="w-4 h-4"/></button>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="articleView" className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 italic">Rasterization Mode</label>
                                <select id="articleView" value={localSettings.articleView} onChange={e => setLocalSettings(s => ({...s, articleView: e.target.value as ArticleView}))} className="w-full bg-zinc-900 border-2 border-zinc-800 text-white py-3 px-4 text-[10px] font-black uppercase italic outline-none focus:border-pulse-500 appearance-none">
                                    <option value="list">LOG_LIST_V2</option>
                                    <option value="grid">COMPRESSED_CELLS</option>
                                    <option value="featured">PRIME_INTEL_FOCUS</option>
                                </select>
                            </div>
                            <div className="bg-zinc-900 p-6 border-2 border-zinc-800">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest italic">Atmospheric Probe</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={localSettings.widgets.showWeather} onChange={e => handleWidgetChange('showWeather', e.target.checked)} className="sr-only peer" />
                                        <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pulse-600"></div>
                                    </label>
                                </div>
                                <input type="text" value={localSettings.widgets.weatherLocation} onChange={e => handleWidgetChange('weatherLocation', e.target.value)} className="w-full bg-void-950 border border-zinc-800 text-white p-3 text-[10px] font-black italic outline-none focus:border-pulse-500" placeholder="Sector Coordinates (Location)..." />
                            </div>
                        </div>
                    </div>)}

                    {activeTab === 'MEMORY' && (<div className="space-y-8 animate-fade-in">
                        <div>
                            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 italic border-b border-zinc-800 pb-2">Packet Backup (OPML)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="file" ref={opmlInputRef} onChange={(e) => handleFileChange(e, onImportOpml)} style={hiddenInputStyle} accept=".opml,.xml" />
                                <ActionButton icon={<CloudArrowUpIcon className="w-4 h-4" />} onClick={() => opmlInputRef.current?.click()}>Import_Dat</ActionButton>
                                <ActionButton icon={<CloudArrowDownIcon className="w-4 h-4" />} onClick={onExportOpml}>Export_Dat</ActionButton>
                            </div>
                        </div>
                        
                        <div className="p-6 bg-red-950/10 border-2 border-pulse-600/30 rounded-3xl">
                            <h3 className="text-[10px] font-black text-pulse-500 uppercase tracking-widest mb-4 italic">Emergency Protocol</h3>
                            <p className="text-[8px] text-zinc-600 uppercase mb-6 leading-relaxed">Warning: Severing all established uplinks will purge local signal cache. This action is irreversible.</p>
                            <ActionButton variant="danger" icon={<TrashIcon className="w-4 h-4" />} onClick={handleCutTheFeed}>Purge_Memory_Dump</ActionButton>
                        </div>
                    </div>)}
                </div>

                <footer className="p-4 bg-zinc-300 border-t-2 border-black flex gap-2 shrink-0 z-20">
                    <button onClick={onClose} className="flex-1 py-3 bg-zinc-100 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-400 text-[10px] font-black uppercase italic text-zinc-600 active:bg-zinc-200">ABORT</button>
                    <button onClick={handleSave} className="flex-1 py-3 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 text-[10px] font-black uppercase italic text-black hover:bg-white active:bg-zinc-400">COMMIT_CHANGES</button>
                </footer>
            </div>
        </div>
    );
};

export default SettingsModal;