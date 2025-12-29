import React, { useState, useEffect, useRef } from 'react';
import type { Settings, Theme, ArticleView, WidgetSettings, Feed, Folder, Selection } from '../src/App';
import { XIcon, SunIcon, MoonIcon, CloudArrowUpIcon, CloudArrowDownIcon, TrashIcon, BookmarkIcon, ListIcon, PlusIcon, FolderIcon, ShieldCheckIcon, SparklesIcon } from './icons';
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

type Tab = 'Navigation' | 'Zones' | 'Feeds' | 'Config' | 'Data';

const hiddenInputStyle: React.CSSProperties = { display: 'none' };

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, settings, onUpdateSettings, onSelect, 
    onAddFolder, onRenameFolder, onDeleteFolder, onRemoveFeed,
    onImportOpml, onExportOpml, onImportSettings, onExportSettings,
    credits, onOpenShop, onAddSource, onEnterUtils
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('Navigation');
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

    const TabButton: React.FC<{ name: Tab }> = ({ name }) => (
        <button
            onClick={() => setActiveTab(name)}
            className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest transition-all
                ${activeTab === name 
                    ? 'bg-void-950 text-white border-t-2 border-l-2 border-black border-b-2 border-r-2 border-zinc-700' 
                    : 'text-zinc-600 hover:text-zinc-400 border-2 border-transparent'}`}
        >
            {name}
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-mono" onClick={onClose} role="dialog" aria-modal="true">
            {/* Windows 3.1 Terminal Frame */}
            <div className="bg-zinc-900 border-4 border-zinc-800 shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col relative overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* 3D Frame Highlighting */}
                <div className="absolute inset-0 border-t-2 border-l-2 border-zinc-700 pointer-events-none z-10" />
                <div className="absolute inset-0 border-b-2 border-r-2 border-black pointer-events-none z-10" />

                {/* Title Bar */}
                <header className="h-10 bg-zinc-800 flex items-center justify-between px-1 relative z-20 border-b-2 border-black">
                    <div className="flex items-center gap-2 h-full">
                        <button onClick={onClose} className="w-8 h-7 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center active:bg-zinc-400">
                           <div className="w-4 h-1 bg-black shadow-[0_4px_0_black]" />
                        </button>
                        <h2 className="text-white text-[11px] font-black uppercase tracking-[0.2em] italic px-2">TERMINAL_HUB v1.8.4</h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-7 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center active:bg-zinc-400">
                        <XIcon className="w-4 h-4 text-black" />
                    </button>
                </header>
                
                {/* Windows 3.1 Tabs Container */}
                <div className="px-2 pt-2 bg-zinc-900 border-b-2 border-black z-20">
                    <nav className="flex space-x-0.5">
                        <TabButton name="Navigation" />
                        <TabButton name="Zones" />
                        <TabButton name="Feeds" />
                        <TabButton name="Config" />
                        <TabButton name="Data" />
                    </nav>
                </div>

                <div className="p-6 md:p-8 overflow-y-auto flex-grow space-y-6 bg-void-950 relative scrollbar-hide">
                    {/* Subtle Scanlines */}
                    <div className="absolute inset-0 pointer-events-none opacity-5 cctv-overlay" />

                    {activeTab === 'Navigation' && (<>
                        <button 
                            onClick={onOpenShop}
                            className="w-full p-4 bg-zinc-900 border-t-2 border-l-2 border-white/10 border-b-2 border-r-2 border-black flex items-center gap-4 group transition-all"
                        >
                            <div className="p-2 bg-pulse-500/10 rounded-lg border border-pulse-500/30"><SparklesIcon className="w-6 h-6 text-pulse-500 animate-pulse" /></div>
                            <div className="text-left">
                                <span className="text-[8px] font-black text-zinc-500 uppercase block mb-0.5 italic">Frequency Assets</span>
                                <span className="text-xl font-black text-pulse-500 italic drop-shadow-sm">{credits.toLocaleString()} SC</span>
                            </div>
                        </button>
                        
                        <div className="grid grid-cols-1 gap-3">
                            <button onClick={() => onSelect({type: 'bookmarks', id: null})} className="flex items-center gap-4 p-4 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 text-black active:bg-zinc-400 transition-all">
                                <BookmarkIcon className="w-5 h-5" />
                                <span className="font-black uppercase italic tracking-widest text-[10px]">Access Saved Packets</span>
                            </button>
                            <button onClick={() => { onEnterUtils(); onClose(); }} className="flex items-center gap-4 p-4 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 text-black active:bg-zinc-400 transition-all">
                                <ShieldCheckIcon className="w-5 h-5" />
                                <span className="font-black uppercase italic tracking-widest text-[10px]">Tactical Infrastructure</span>
                            </button>
                        </div>
                    </>)}

                    {activeTab === 'Zones' && (<>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Node Clusters</h3>
                                <button onClick={() => onAddFolder("NEW_ZONE")} className="w-8 h-8 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center text-black active:bg-zinc-400">
                                    <PlusIcon className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-2">
                                {settings.folders.map(f => (
                                    <div key={f.id} className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800">
                                        <div className="flex items-center gap-3">
                                            <FolderIcon className="w-4 h-4 text-zinc-600" />
                                            <input 
                                                value={f.name} 
                                                onChange={e => onRenameFolder(f.id, e.target.value)}
                                                className="bg-transparent text-white font-black uppercase italic text-xs outline-none focus:text-pulse-500"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => onSelect({type: 'folder', id: f.id})} className="text-[8px] font-black uppercase text-zinc-400 px-2 py-1 bg-zinc-800 border border-zinc-700">Access</button>
                                            <button onClick={() => onDeleteFolder(f.id)} className="text-zinc-600 hover:text-pulse-500"><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>)}

                    {activeTab === 'Feeds' && (<>
                        <div className="bg-zinc-900 p-4 border-2 border-zinc-800 mb-6">
                            <AddSource onAddSource={onAddSource} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-[9px] font-black text-zinc-500 uppercase tracking-widest italic mb-2">Established Links</h3>
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
                    </>)}

                    {activeTab === 'Config' && (<>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Interface Theme</label>
                                <div className="flex bg-zinc-900 p-1 border border-zinc-800">
                                    <button onClick={() => setLocalSettings(s => ({...s, theme: 'light'}))} className={`p-2 transition-all ${localSettings.theme === 'light' ? 'bg-pulse-600 text-white' : 'text-zinc-600'}`}><SunIcon className="w-4 h-4"/></button>
                                    <button onClick={() => setLocalSettings(s => ({...s, theme: 'dark'}))} className={`p-2 transition-all ${localSettings.theme === 'dark' ? 'bg-pulse-600 text-white' : 'text-zinc-600'}`}><MoonIcon className="w-4 h-4"/></button>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="articleView" className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 italic">Display Protocol</label>
                                <select id="articleView" value={localSettings.articleView} onChange={e => setLocalSettings(s => ({...s, articleView: e.target.value as ArticleView}))} className="w-full bg-zinc-900 border-2 border-zinc-800 text-white py-3 px-4 text-[10px] font-black uppercase italic outline-none focus:border-pulse-500">
                                    <option value="list">Log_List</option>
                                    <option value="grid">Compressed_Packets</option>
                                    <option value="featured">Prime_Signals</option>
                                </select>
                            </div>
                            <div className="bg-zinc-900 p-4 border-2 border-zinc-800">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest italic">Atmospheric Probe</span>
                                    <input type="checkbox" checked={localSettings.widgets.showWeather} onChange={e => handleWidgetChange('showWeather', e.target.checked)} className="h-4 w-4 bg-black border-zinc-800 text-pulse-600" />
                                </div>
                                <input type="text" value={localSettings.widgets.weatherLocation} onChange={e => handleWidgetChange('weatherLocation', e.target.value)} className="w-full bg-void-950 border border-zinc-800 text-white p-2 text-[10px] font-black italic outline-none" placeholder="Sector Location..." />
                            </div>
                        </div>
                    </>)}

                    {activeTab === 'Data' && (<>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 italic">Packet Archives (OPML)</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="file" ref={opmlInputRef} onChange={(e) => handleFileChange(e, onImportOpml)} style={hiddenInputStyle} accept=".opml,.xml" />
                                    <ActionButton icon={<CloudArrowUpIcon className="w-4 h-4" />} onClick={() => opmlInputRef.current?.click()}>Import</ActionButton>
                                    <ActionButton icon={<CloudArrowDownIcon className="w-4 h-4" />} onClick={onExportOpml}>Export</ActionButton>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-zinc-800">
                                <h3 className="text-[10px] font-black text-pulse-500 uppercase tracking-widest mb-4 italic">Emergency Protocol</h3>
                                <ActionButton variant="danger" icon={<TrashIcon className="w-4 h-4" />} onClick={handleCutTheFeed}>Purge All Signals</ActionButton>
                            </div>
                        </div>
                    </>)}
                </div>

                <footer className="p-4 bg-zinc-300 border-t-2 border-black flex gap-2 shrink-0">
                    <button onClick={onClose} className="flex-1 py-3 bg-zinc-100 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-400 text-[10px] font-black uppercase italic text-zinc-600 active:bg-zinc-200">Cancel</button>
                    <button onClick={handleSave} className="flex-1 py-3 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 text-[10px] font-black uppercase italic text-black hover:bg-white active:bg-zinc-400">Save_Config</button>
                </footer>
            </div>
        </div>
    );
};

export default SettingsModal;