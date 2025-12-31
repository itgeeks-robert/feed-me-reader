import React, { useState, useEffect, useRef } from 'react';
import type { Settings, Theme, ArticleView, WidgetSettings, Feed, Folder, Selection } from '../src/App';
import { XIcon, SunIcon, MoonIcon, CloudArrowUpIcon, CloudArrowDownIcon, TrashIcon, BookmarkIcon, ListIcon, PlusIcon, FolderIcon, ShieldCheckIcon, SparklesIcon, CpuChipIcon, ExclamationTriangleIcon } from './icons';
import AddSource, { SourceType } from './AddSource';
import { exportToOpml, parseOpml } from '../services/opmlService';

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
    const [showWipeConfirm, setShowWipeConfirm] = useState(false);
    const opmlInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { if (isOpen) setLocalSettings({ ...settings }); }, [isOpen, settings]);

    if (!isOpen) return null;

    const handleSave = () => {
        onUpdateSettings(localSettings);
        onClose();
    };
    
    const handleOpmlImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                try {
                    const { feeds, folders } = parseOpml(text);
                    onImportOpml(feeds, folders);
                    alert(`Sync Complete: ${feeds.length} signals integrated.`);
                } catch (err) {
                    alert("Sync Error: Packet structure corrupted.");
                }
            };
            reader.readAsText(file);
        }
        event.target.value = '';
    };

    const handleOpmlExport = () => {
        const opml = exportToOpml(settings.feeds, settings.folders);
        const blob = new Blob([opml], { type: 'text/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `VOID_MEMORY_DUMP_${new Date().getTime()}.opml`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const performSystemWipe = () => {
        localStorage.clear();
        // Clear IndexedDB cache as well for a true wipe
        const req = indexedDB.deleteDatabase('SeeMoreCache');
        req.onsuccess = () => window.location.reload();
        req.onerror = () => window.location.reload();
        req.onblocked = () => window.location.reload();
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
                    ? 'bg-pulse-600 text-white border-white/50 shadow-[4px_4px_0_#450a0a]' 
                    : 'bg-zinc-300 text-black'}`}
        >
            {icon}
            <span>{children}</span>
        </button>
    );

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-2 md:p-4 font-mono" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-zinc-900 border-4 border-zinc-800 shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col relative overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="absolute inset-0 border-t-2 border-l-2 border-zinc-700 pointer-events-none z-10" />
                <div className="absolute inset-0 border-b-2 border-r-2 border-black pointer-events-none z-10" />

                <header className="h-10 bg-zinc-800 flex items-center justify-between px-1 relative z-20 border-b-2 border-black shrink-0">
                    <div className="flex items-center gap-2 h-full">
                        <div className="w-8 h-7 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center">
                           <CpuChipIcon className="w-4 h-4 text-black" />
                        </div>
                        <h2 className="text-white text-[10px] font-black uppercase tracking-[0.2em] italic px-2">SYSTEM_DIAGNOSTICS v1.8.4</h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-7 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center active:bg-zinc-400">
                        <XIcon className="w-4 h-4 text-black" />
                    </button>
                </header>
                
                <div className="bg-zinc-900 border-b-2 border-black z-20 shrink-0">
                    <nav className="flex">
                        <TabButton name="CORE" label="0x00_CORE" />
                        <TabButton name="NODES" label="0x01_NODES" />
                        <TabButton name="DISPLAY" label="0x02_VISUAL" />
                        <TabButton name="MEMORY" label="0x03_DATA" />
                    </nav>
                </div>

                <div className="p-4 md:p-8 overflow-y-auto flex-grow space-y-6 bg-void-950 relative scrollbar-hide pb-24 md:pb-8">
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
                        <button onClick={onOpenShop} className="w-full p-5 bg-pulse-600 border-t-2 border-l-2 border-white/30 border-b-2 border-r-2 border-pulse-900 flex items-center justify-between group hover:bg-pulse-500 transition-all shadow-lg active:scale-95">
                            <div className="flex items-center gap-4">
                                <SparklesIcon className="w-6 h-6 text-white animate-pulse" />
                                <div className="text-left">
                                    <span className="text-lg font-black text-white italic uppercase tracking-tighter block leading-none">Access Black Market</span>
                                    <span className="text-[8px] text-white/60 font-black uppercase tracking-widest">Exchange SC for Augments</span>
                                </div>
                            </div>
                            <div className="w-8 h-8 bg-black/20 rounded-full flex items-center justify-center">&rarr;</div>
                        </button>
                    </div>)}

                    {activeTab === 'NODES' && (<div className="space-y-8 animate-fade-in">
                        <div>
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-4">
                                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Established Zones</h3>
                                <button onClick={() => onAddFolder("NEW_ZONE")} className="w-8 h-7 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center text-black active:bg-zinc-400">
                                    <PlusIcon className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-hide">
                                {settings.folders.map(f => (
                                    <div key={f.id} className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 group">
                                        <div className="flex items-center gap-3 flex-1">
                                            <FolderIcon className="w-4 h-4 text-zinc-600" />
                                            <input value={f.name} onChange={e => onRenameFolder(f.id, e.target.value)} className="bg-transparent text-white font-black uppercase italic text-xs outline-none focus:text-pulse-500 w-full" />
                                        </div>
                                        <button onClick={() => onDeleteFolder(f.id)} className="text-zinc-600 hover:text-pulse-500 ml-4 opacity-0 group-hover:opacity-100 transition-opacity"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>)}

                    {activeTab === 'DISPLAY' && (<div className="space-y-8 animate-fade-in">
                        <div>
                            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 italic border-b border-zinc-800 pb-2">Visual Theme</h3>
                            <div className="flex gap-4">
                                <button onClick={() => setLocalSettings(p => ({...p, theme: 'dark'}))} className={`flex-1 py-4 flex flex-col items-center gap-2 border-2 rounded-2xl transition-all ${localSettings.theme === 'dark' ? 'bg-void-900 border-pulse-500 text-white shadow-lg' : 'bg-zinc-900 border-transparent text-zinc-600'}`}>
                                    <MoonIcon className="w-6 h-6" />
                                    <span className="text-[8px] font-black uppercase">0x00_NOIR</span>
                                </button>
                                <button onClick={() => setLocalSettings(p => ({...p, theme: 'light'}))} className={`flex-1 py-4 flex flex-col items-center gap-2 border-2 rounded-2xl transition-all ${localSettings.theme === 'light' ? 'bg-zinc-100 border-pulse-500 text-zinc-900 shadow-lg' : 'bg-zinc-900 border-transparent text-zinc-600'}`}>
                                    <SunIcon className="w-6 h-6" />
                                    <span className="text-[8px] font-black uppercase">0x01_LIGHT</span>
                                </button>
                            </div>
                        </div>
                    </div>)}

                    {activeTab === 'MEMORY' && (<div className="space-y-8 animate-fade-in">
                        <div>
                            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 italic border-b border-zinc-800 pb-2">Packet Backup (OPML)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="file" ref={opmlInputRef} onChange={handleOpmlImport} style={hiddenInputStyle} accept=".opml,.xml" />
                                <ActionButton icon={<CloudArrowUpIcon className="w-4 h-4" />} onClick={() => opmlInputRef.current?.click()}>Import_Dat</ActionButton>
                                <ActionButton icon={<CloudArrowDownIcon className="w-4 h-4" />} onClick={handleOpmlExport}>Export_Dat</ActionButton>
                            </div>
                        </div>
                        <div className="p-6 bg-red-950/10 border-2 border-pulse-600/30 rounded-3xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10">
                                <ExclamationTriangleIcon className="w-12 h-12 text-pulse-500" />
                            </div>
                            <h3 className="text-[10px] font-black text-pulse-500 uppercase tracking-widest mb-2 italic">Terminal Reset</h3>
                            <p className="text-[8px] text-zinc-600 uppercase mb-6 font-black leading-tight italic">Warning: Reverts system to original installation state. Irreversible.</p>
                            <ActionButton variant="danger" icon={<TrashIcon className="w-4 h-4" />} onClick={() => setShowWipeConfirm(true)}>PERFORM_SYSTEM_WIPE</ActionButton>
                        </div>
                    </div>)}
                </div>

                <footer className="p-4 bg-zinc-300 border-t-2 border-black flex gap-2 shrink-0 z-20">
                    <button onClick={onClose} className="flex-1 py-3 bg-zinc-100 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-400 text-[10px] font-black uppercase italic text-zinc-600 active:bg-zinc-200">ABORT</button>
                    <button onClick={handleSave} className="flex-1 py-3 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 text-[10px] font-black uppercase italic text-black hover:bg-white active:bg-zinc-400">COMMIT_CHANGES</button>
                </footer>
            </div>

            {/* CUSTOM CONFIRM OVERLAY */}
            {showWipeConfirm && (
                <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
                    <div className="bg-zinc-900 border-4 border-pulse-600 shadow-[0_0_120px_rgba(225,29,72,0.3)] w-full max-w-sm relative overflow-hidden flex flex-col rounded-[2.5rem]">
                        <header className="h-10 bg-pulse-600 flex items-center justify-between px-1 border-b-2 border-black">
                            <div className="flex items-center gap-2 h-full">
                                <div className="w-8 h-7 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center">
                                   <div className="w-4 h-1 bg-black shadow-[0_4px_0_black]" />
                                </div>
                                <h2 className="text-white text-[9px] font-black uppercase tracking-[0.2em] italic px-2 truncate">CRITICAL_PROTOCOL.EXE</h2>
                            </div>
                            <button onClick={() => setShowWipeConfirm(false)} className="w-8 h-7 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center active:bg-zinc-400">
                                <XIcon className="w-4 h-4 text-black" />
                            </button>
                        </header>
                        
                        <div className="p-8 bg-void-950 text-center space-y-6">
                            <div className="mx-auto w-12 h-12 bg-pulse-500/10 rounded-full flex items-center justify-center border-2 border-pulse-500 animate-pulse">
                                <ExclamationTriangleIcon className="w-6 h-6 text-pulse-500" />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">PERFORM SYSTEM WIPE?</h3>
                                <p className="text-[9px] text-zinc-500 leading-relaxed uppercase tracking-widest italic px-4">
                                    This will <span className="text-pulse-500 font-black">permanently delete</span> all feeds, folders, bookmarks, high scores, and credits. The terminal will revert to original installation settings.
                                </p>
                            </div>
                        </div>

                        <footer className="p-4 bg-zinc-300 border-t-2 border-black flex gap-3">
                            <button onClick={() => setShowWipeConfirm(false)} className="flex-1 py-3 bg-zinc-100 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-400 text-[10px] font-black uppercase italic text-zinc-600 active:bg-zinc-200">ABORT</button>
                            <button onClick={performSystemWipe} className="flex-1 py-3 bg-pulse-600 border-t-2 border-l-2 border-white/50 border-b-2 border-r-2 border-pulse-950 text-[10px] font-black uppercase italic text-white hover:bg-pulse-500 active:bg-pulse-700">OK</button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsModal;