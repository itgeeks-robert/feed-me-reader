import React, { useState, useEffect, useRef } from 'react';
import type { Settings, Theme, ArticleView, WidgetSettings } from '../src/App';
import { XIcon, SunIcon, MoonIcon, CloudArrowUpIcon, CloudArrowDownIcon, ChevronDownIcon } from './icons';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: Settings;
    onUpdateSettings: (newSettings: Partial<Omit<Settings, 'feeds' | 'folders'>>) => void;
    onImportOpml: (file: File) => void;
    onExportOpml: () => void;
    onImportSettings: (file: File) => void;
    onExportSettings: () => void;
}

type Tab = 'General' | 'Data' | 'Widgets';

const hiddenInputStyle: React.CSSProperties = { display: 'none' };

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onUpdateSettings, onImportOpml, onExportOpml, onImportSettings, onExportSettings }) => {
    const [activeTab, setActiveTab] = useState<Tab>('General');
    const [localSettings, setLocalSettings] = useState({ ...settings });

    const opmlInputRef = useRef<HTMLInputElement>(null);
    const settingsInputRef = useRef<HTMLInputElement>(null);

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

    const TabButton: React.FC<{ name: Tab }> = ({ name }) => (
        <button
            onClick={() => setActiveTab(name)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === name ? 'bg-black/10 dark:bg-white/10 text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5'}`}
        >
            {name}
        </button>
    );
    
    const ActionButton: React.FC<{icon: React.ReactNode, children: React.ReactNode, onClick: () => void}> = ({ icon, children, onClick }) => (
        <button onClick={onClick} className="w-full flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-medium rounded-lg text-zinc-700 dark:text-zinc-200 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
            {icon}
            <span>{children}</span>
        </button>
    );

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-white/50 dark:bg-zinc-900/60 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl shadow-xl w-full max-w-lg max-h-full flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10 flex-shrink-0">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Settings</h2>
                    <button onClick={onClose} className="p-2 rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-black/10 dark:hover:bg-white/10" aria-label="Close settings">
                        <XIcon className="w-5 h-5" />
                    </button>
                </header>
                
                <div className="p-4 border-b border-black/10 dark:border-white/10 flex-shrink-0">
                    <nav className="flex space-x-2 p-1 bg-black/5 dark:bg-white/5 rounded-xl">
                        <TabButton name="General" />
                        <TabButton name="Widgets" />
                        <TabButton name="Data" />
                    </nav>
                </div>

                <div className="p-6 overflow-y-auto flex-grow space-y-6">
                    {activeTab === 'General' && (<>
                        <div className="flex items-center justify-between">
                            <label className="font-medium text-zinc-800 dark:text-zinc-200">Theme</label>
                            <div className="flex items-center rounded-lg bg-black/5 dark:bg-white/5 p-1">
                                <button onClick={() => setLocalSettings(s => ({...s, theme: 'light'}))} className={`p-1.5 rounded-md transition-colors ${localSettings.theme === 'light' ? 'bg-white dark:bg-zinc-700 text-orange-500' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-white'}`}><SunIcon className="w-5 h-5"/></button>
                                <button onClick={() => setLocalSettings(s => ({...s, theme: 'dark'}))} className={`p-1.5 rounded-md transition-colors ${localSettings.theme === 'dark' ? 'bg-white dark:bg-zinc-700 text-orange-500' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-white'}`}><MoonIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="articleView" className="block text-sm font-medium text-zinc-800 dark:text-zinc-300 mb-2">Default Article View</label>
                            <select id="articleView" value={localSettings.articleView} onChange={e => setLocalSettings(s => ({...s, articleView: e.target.value as ArticleView}))} className="w-full bg-white/80 dark:bg-zinc-800/80 border border-black/10 dark:border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                                <option value="list">List View</option>
                                <option value="grid">Grid View</option>
                                <option value="featured">Featured View</option>
                            </select>
                        </div>
                    </>)}
                    {activeTab === 'Widgets' && (<>
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">Show Weather Widget</span>
                            <input type="checkbox" checked={localSettings.widgets.showWeather} onChange={e => handleWidgetChange('showWeather', e.target.checked)} className="h-4 w-4 rounded border-zinc-400 dark:border-zinc-600 text-orange-600 focus:ring-orange-500 bg-transparent" />
                        </div>
                        <div>
                            <label htmlFor="weatherLocation" className="block text-sm font-medium text-zinc-800 dark:text-zinc-300 mb-2">Weather Location</label>
                            <input id="weatherLocation" type="text" value={localSettings.widgets.weatherLocation} onChange={e => handleWidgetChange('weatherLocation', e.target.value)} className="w-full bg-white/80 dark:bg-zinc-800/80 border border-black/10 dark:border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                        </div>
                        <hr className="border-black/10 dark:border-white/10" />
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">Show Finance Widget</span>
                            <input type="checkbox" checked={localSettings.widgets.showFinance} onChange={e => handleWidgetChange('showFinance', e.target.checked)} className="h-4 w-4 rounded border-zinc-400 dark:border-zinc-600 text-orange-600 focus:ring-orange-500 bg-transparent" />
                        </div>
                    </>)}
                    {activeTab === 'Data' && (<>
                        <div>
                            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-200 mb-2">OPML</h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">Manage your feeds by importing or exporting an OPML file.</p>
                            <div className="flex space-x-3">
                                <input type="file" ref={opmlInputRef} onChange={(e) => handleFileChange(e, onImportOpml)} style={hiddenInputStyle} accept=".opml,.xml" />
                                <ActionButton icon={<CloudArrowUpIcon className="w-5 h-5" />} onClick={() => opmlInputRef.current?.click()}>Import OPML</ActionButton>
                                <ActionButton icon={<CloudArrowDownIcon className="w-5 h-5" />} onClick={onExportOpml}>Export OPML</ActionButton>
                            </div>
                        </div>
                        <hr className="border-black/10 dark:border-white/10" />
                        <div>
                            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-200 mb-2">Application Backup</h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">Save or load a complete backup of all feeds and preferences.</p>
                             <div className="flex space-x-3">
                                <input type="file" ref={settingsInputRef} onChange={(e) => handleFileChange(e, onImportSettings)} style={hiddenInputStyle} accept=".json" />
                                <ActionButton icon={<CloudArrowUpIcon className="w-5 h-5" />} onClick={() => settingsInputRef.current?.click()}>Import Settings</ActionButton>
                                <ActionButton icon={<CloudArrowDownIcon className="w-5 h-5" />} onClick={onExportSettings}>Export Settings</ActionButton>
                            </div>
                        </div>
                    </>)}
                </div>

                <footer className="flex justify-end items-center p-4 border-t border-black/10 dark:border-white/10 space-x-3 flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-zinc-800 dark:text-zinc-300 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg hover:bg-black/10 dark:hover:bg-white/10">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700">Save & Close</button>
                </footer>
            </div>
        </div>
    );
};

export default SettingsModal;