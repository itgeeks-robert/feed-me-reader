import React, { useState, useEffect, useRef } from 'react';
import type { Settings, Theme, ArticleView, WidgetSettings } from '../src/App';
import { XIcon, SunIcon, MoonIcon, CloudArrowUpIcon, CloudArrowDownIcon, ChevronDownIcon } from './icons';
import { leagues } from '../services/sportsData';
import { teamLogos } from '../services/teamLogos';

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

const TeamLogo: React.FC<{ name: string }> = ({ name }) => {
    const logoUrl = teamLogos[name];
    const [hasError, setHasError] = useState(!logoUrl);

    useEffect(() => { setHasError(!logoUrl); }, [logoUrl]);

    if (hasError) {
        const displayName = (name || '').trim().substring(0, 3).toUpperCase() || '???';
        return <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-bold text-xs text-zinc-500 dark:text-gray-400 flex-shrink-0">{displayName}</div>;
    }
    return <img src={logoUrl} onError={() => setHasError(true)} alt={`${name} logo`} className="w-5 h-5 object-contain flex-shrink-0" />;
};

const hiddenInputStyle: React.CSSProperties = { display: 'none' };

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onUpdateSettings, onImportOpml, onExportOpml, onImportSettings, onExportSettings }) => {
    const [activeTab, setActiveTab] = useState<Tab>('General');
    const [localSettings, setLocalSettings] = useState({ ...settings });
    const [openLeague, setOpenLeague] = useState<string | null>(leagues[0]?.name || null);

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
    
    const handleTeamSelectionChange = (teamCodes: string[]) => {
        handleWidgetChange('sportsTeams', teamCodes);
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
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">Show Sports Widget</span>
                            <input type="checkbox" checked={localSettings.widgets.showSports} onChange={e => handleWidgetChange('showSports', e.target.checked)} className="h-4 w-4 rounded border-zinc-400 dark:border-zinc-600 text-orange-600 focus:ring-orange-500 bg-transparent" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-300 mb-2">Select Teams</label>
                            <div className="border border-black/10 dark:border-white/10 rounded-lg max-h-64 overflow-y-auto bg-black/5 dark:bg-white/5">
                                {leagues.map(league => {
                                    const teamsInLeague = league.teams.map(t => t.code);
                                    const selectedCount = teamsInLeague.filter(code => localSettings.widgets.sportsTeams.includes(code)).length;
                                    const isAllSelected = selectedCount === teamsInLeague.length;
                                    const isSomeSelected = selectedCount > 0 && !isAllSelected;
                                    return (
                                        <div key={league.name} className="border-b border-black/10 dark:border-white/10 last:border-b-0">
                                            <div className="flex items-center p-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" onClick={() => setOpenLeague(openLeague === league.name ? null : league.name)}>
                                                <input type="checkbox" checked={isAllSelected} ref={el => { if (el) el.indeterminate = isSomeSelected; }} onChange={() => { const current = new Set(localSettings.widgets.sportsTeams); if (isAllSelected) teamsInLeague.forEach(code => current.delete(code)); else teamsInLeague.forEach(code => current.add(code)); handleTeamSelectionChange(Array.from(current)); }} onClick={e => e.stopPropagation()} className="h-4 w-4 rounded border-zinc-400 dark:border-zinc-600 text-orange-600 focus:ring-orange-500 bg-transparent" />
                                                <span className="ml-3 font-medium text-zinc-900 dark:text-zinc-200 flex-grow">{league.name}</span>
                                                <ChevronDownIcon className={`w-5 h-5 text-zinc-400 dark:text-zinc-500 transition-transform ${openLeague === league.name ? 'rotate-180' : ''}`} />
                                            </div>
                                            {openLeague === league.name && (
                                                <div className="pl-6 pr-3 pb-3 space-y-1">
                                                    {league.teams.map(team => {
                                                        const isSelected = localSettings.widgets.sportsTeams.includes(team.code);
                                                        return (
                                                            <label key={team.code} className="flex items-center p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
                                                                <input type="checkbox" checked={isSelected} onChange={() => { const current = new Set(localSettings.widgets.sportsTeams); if (isSelected) current.delete(team.code); else current.add(team.code); handleTeamSelectionChange(Array.from(current)); }} className="h-4 w-4 rounded border-zinc-400 dark:border-zinc-600 text-orange-600 focus:ring-orange-500 bg-transparent" />
                                                                <div className="ml-3 flex items-center gap-2"><TeamLogo name={team.name} /><span className="text-sm text-zinc-800 dark:text-zinc-300">{team.name}</span></div>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
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