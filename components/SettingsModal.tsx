

import React, { useState, useEffect, useRef } from 'react';
import type { Settings, Theme, ArticleView, WidgetSettings, ViewMode } from '../App';
import { XIcon, SunIcon, MoonIcon, CloudSyncIcon, CloudArrowDownIcon, ChevronDownIcon } from './icons';
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

    useEffect(() => {
        setHasError(!logoUrl);
    }, [logoUrl]);

    if (hasError) {
        const displayName = (name || '').trim().substring(0, 3).toUpperCase() || '???';
        return <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center font-bold text-xs text-gray-400 flex-shrink-0">{displayName}</div>;
    }
    return <img src={logoUrl} onError={() => setHasError(true)} alt={`${name} logo`} className="w-5 h-5 object-contain flex-shrink-0" />;
};


const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onUpdateSettings, onImportOpml, onExportOpml, onImportSettings, onExportSettings }) => {
    const [activeTab, setActiveTab] = useState<Tab>('General');
    const [localSettings, setLocalSettings] = useState({
        theme: settings.theme,
        articleView: settings.articleView,
        viewMode: settings.viewMode,
        widgets: { ...settings.widgets }
    });
    const [openLeague, setOpenLeague] = useState<string | null>(leagues.length > 0 ? leagues[0].name : null);

    const opmlInputRef = useRef<HTMLInputElement>(null);
    const settingsInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Reset local state when modal is opened
        if (isOpen) {
            setLocalSettings({
                theme: settings.theme,
                articleView: settings.articleView,
                viewMode: settings.viewMode,
                widgets: { ...settings.widgets }
            });
        }
    }, [isOpen, settings]);

    if (!isOpen) return null;

    const handleSave = () => {
        onUpdateSettings(localSettings);
        onClose();
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, importHandler: (file: File) => void) => {
        const file = event.target.files?.[0];
        if (file) {
            importHandler(file);
        }
        if (event.target) {
            event.target.value = ''; // Reset file input
        }
    };

    const handleWidgetChange = (key: keyof WidgetSettings, value: any) => {
        setLocalSettings(prev => ({
            ...prev,
            widgets: { ...prev.widgets, [key]: value }
        }));
    };
    
    const handleTeamSelectionChange = (teamCodes: string[]) => {
        setLocalSettings(prev => ({
            ...prev,
            widgets: {
                ...prev.widgets,
                sportsTeams: teamCodes,
            }
        }));
    };

    const TabButton: React.FC<{ name: Tab }> = ({ name }) => (
        <button
            onClick={() => setActiveTab(name)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === name ? 'bg-gray-200 dark:bg-zinc-700 text-zinc-900 dark:text-white' : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
        >
            {name}
        </button>
    );

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-800 flex-shrink-0">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Settings</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700" aria-label="Close settings">
                        <XIcon className="w-5 h-5" />
                    </button>
                </header>
                
                <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex-shrink-0">
                    <nav className="flex space-x-2">
                        <TabButton name="General" />
                        <TabButton name="Widgets" />
                        <TabButton name="Data" />
                    </nav>
                </div>

                <div className="p-6 overflow-y-auto flex-grow">
                    {activeTab === 'General' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <label className="text-zinc-700 dark:text-zinc-300">Theme</label>
                                <div className="flex items-center rounded-md bg-gray-100 dark:bg-zinc-800 p-0.5">
                                    <button onClick={() => setLocalSettings(s => ({...s, theme: 'light'}))} className={`p-1.5 rounded-md transition-colors ${localSettings.theme === 'light' ? 'bg-white dark:bg-zinc-700 text-lime-600 dark:text-lime-400' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white'}`}><SunIcon className="w-5 h-5"/></button>
                                    <button onClick={() => setLocalSettings(s => ({...s, theme: 'dark'}))} className={`p-1.5 rounded-md transition-colors ${localSettings.theme === 'dark' ? 'bg-white dark:bg-zinc-700 text-lime-600 dark:text-lime-400' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white'}`}><MoonIcon className="w-5 h-5"/></button>
                                </div>
                            </div>
                             <div className="flex items-center justify-between">
                                <label className="text-zinc-700 dark:text-zinc-300">Default View Mode</label>
                                <div className="flex items-center rounded-md bg-gray-100 dark:bg-zinc-800 p-0.5">
                                    <button onClick={() => setLocalSettings(s => ({...s, viewMode: 'mobile'}))} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${localSettings.viewMode === 'mobile' ? 'bg-white dark:bg-zinc-700 text-lime-600 dark:text-lime-400' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white'}`}>Mobile</button>
                                    <button onClick={() => setLocalSettings(s => ({...s, viewMode: 'pc'}))} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${localSettings.viewMode === 'pc' ? 'bg-white dark:bg-zinc-700 text-lime-600 dark:text-lime-400' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white'}`}>PC</button>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="articleView" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Default Article View</label>
                                <select id="articleView" value={localSettings.articleView} onChange={e => setLocalSettings(s => ({...s, articleView: e.target.value as ArticleView}))} className="w-full bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500">
                                    <option value="card">Card View</option>
                                    <option value="compact">Compact View</option>
                                    <option value="magazine">Magazine View</option>
                                </select>
                            </div>
                        </div>
                    )}
                    {activeTab === 'Widgets' && (
                        <div className="space-y-6">
                             <div className="flex items-center justify-between">
                                <span className="text-zinc-700 dark:text-zinc-300">Show Weather Widget</span>
                                <input type="checkbox" checked={localSettings.widgets.showWeather} onChange={e => handleWidgetChange('showWeather', e.target.checked)} className="h-4 w-4 rounded border-gray-300 dark:border-zinc-600 text-lime-600 focus:ring-lime-500 bg-transparent dark:bg-zinc-800" />
                            </div>
                             <div>
                                <label htmlFor="weatherLocation" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Weather Location</label>
                                <input id="weatherLocation" type="text" value={localSettings.widgets.weatherLocation} onChange={e => handleWidgetChange('weatherLocation', e.target.value)} className="w-full bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500" />
                            </div>
                            <hr className="border-gray-200 dark:border-zinc-800" />
                             <div className="flex items-center justify-between">
                                <span className="text-zinc-700 dark:text-zinc-300">Show Sports Widget</span>
                                <input type="checkbox" checked={localSettings.widgets.showSports} onChange={e => handleWidgetChange('showSports', e.target.checked)} className="h-4 w-4 rounded border-gray-300 dark:border-zinc-600 text-lime-600 focus:ring-lime-500 bg-transparent dark:bg-zinc-800" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Select Teams</label>
                                <div className="border border-gray-300 dark:border-zinc-700 rounded-md max-h-64 overflow-y-auto">
                                    {leagues.map(league => {
                                        const isLeagueOpen = openLeague === league.name;
                                        const teamsInLeague = league.teams.map(t => t.code);
                                        const selectedTeamsInLeague = teamsInLeague.filter(code => localSettings.widgets.sportsTeams.includes(code));
                                        const isAllSelected = selectedTeamsInLeague.length === teamsInLeague.length;
                                        const isSomeSelected = selectedTeamsInLeague.length > 0 && !isAllSelected;

                                        const handleLeagueToggle = () => {
                                            const currentTeams = new Set(localSettings.widgets.sportsTeams);
                                            if (isAllSelected) {
                                                teamsInLeague.forEach(code => currentTeams.delete(code));
                                            } else {
                                                teamsInLeague.forEach(code => currentTeams.add(code));
                                            }
                                            handleTeamSelectionChange(Array.from(currentTeams));
                                        };

                                        return (
                                            <div key={league.name} className="border-b border-gray-200 dark:border-zinc-800 last:border-b-0">
                                                <div className="flex items-center p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50" onClick={() => setOpenLeague(isLeagueOpen ? null : league.name)}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isAllSelected}
                                                        ref={el => { if (el) el.indeterminate = isSomeSelected; }}
                                                        onChange={handleLeagueToggle}
                                                        onClick={e => e.stopPropagation()}
                                                        className="h-4 w-4 rounded border-gray-300 dark:border-zinc-600 text-lime-600 focus:ring-lime-500 bg-transparent dark:bg-zinc-800"
                                                        aria-label={`Select all teams in ${league.name}`}
                                                    />
                                                    <span className="ml-3 font-medium text-zinc-800 dark:text-zinc-200 flex-grow">{league.name}</span>
                                                    <ChevronDownIcon className={`w-5 h-5 text-gray-400 dark:text-zinc-500 transition-transform ${isLeagueOpen ? 'rotate-180' : ''}`} />
                                                </div>
                                                {isLeagueOpen && (
                                                    <div className="pl-6 pr-3 pb-3 space-y-2">
                                                        {league.teams.map(team => {
                                                            const isSelected = localSettings.widgets.sportsTeams.includes(team.code);
                                                            const handleTeamToggle = () => {
                                                                const currentTeams = new Set(localSettings.widgets.sportsTeams);
                                                                if (isSelected) {
                                                                    currentTeams.delete(team.code);
                                                                } else {
                                                                    currentTeams.add(team.code);
                                                                }
                                                                handleTeamSelectionChange(Array.from(currentTeams));
                                                            };
                                                            return (
                                                                <label key={team.code} className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isSelected}
                                                                        onChange={handleTeamToggle}
                                                                        className="h-4 w-4 rounded border-gray-300 dark:border-zinc-600 text-lime-600 focus:ring-lime-500 bg-transparent dark:bg-zinc-800"
                                                                    />
                                                                    <div className="ml-3 flex items-center gap-2">
                                                                        <TeamLogo name={team.name} />
                                                                        <span className="text-sm text-zinc-700 dark:text-zinc-300">{team.name}</span>
                                                                    </div>
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
                             <hr className="border-gray-200 dark:border-zinc-800" />
                             <div className="flex items-center justify-between">
                                <span className="text-zinc-700 dark:text-zinc-300">Show Finance Widget (coming soon)</span>
                                <input type="checkbox" disabled checked={localSettings.widgets.showFinance} onChange={e => handleWidgetChange('showFinance', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-lime-600 focus:ring-lime-500 disabled:opacity-50" />
                            </div>
                        </div>
                    )}
                    {activeTab === 'Data' && (
                         <div className="space-y-6">
                            <div>
                                <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200 mb-2">OPML</h3>
                                <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">Manage your feeds by importing or exporting an OPML file. This only affects your list of feeds and folders.</p>
                                <div className="flex space-x-3">
                                    <input type="file" ref={opmlInputRef} onChange={(e) => handleFileChange(e, onImportOpml)} className="hidden" accept=".opml,.xml" aria-hidden="true" />
                                    <button onClick={() => opmlInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-md text-zinc-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700">
                                        <CloudSyncIcon className="w-5 h-5" />
                                        <span>Import OPML</span>
                                    </button>
                                    <button onClick={onExportOpml} className="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-md text-zinc-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700">
                                        <CloudArrowDownIcon className="w-5 h-5" />
                                        <span>Export OPML</span>
                                    </button>
                                </div>
                            </div>

                            <hr className="border-gray-200 dark:border-zinc-800" />

                            <div>
                                <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200 mb-2">Application Backup</h3>
                                <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">Save or load all your feeds, folders, and preferences. This is a complete backup of your application settings.</p>
                                 <div className="flex space-x-3">
                                    <input type="file" ref={settingsInputRef} onChange={(e) => handleFileChange(e, onImportSettings)} className="hidden" accept=".json" aria-hidden="true" />
                                    <button onClick={() => settingsInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-md text-zinc-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700">
                                        <CloudSyncIcon className="w-5 h-5" />
                                        <span>Import Settings</span>
                                    </button>
                                    <button onClick={onExportSettings} className="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-md text-zinc-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700">
                                        <CloudArrowDownIcon className="w-5 h-5" />
                                        <span>Export Settings</span>
                                    </button>
                                </div>
                            </div>
                         </div>
                    )}
                </div>

                <footer className="flex justify-end items-center p-4 border-t border-gray-200 dark:border-zinc-800 space-x-3 flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-700">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-lime-600 rounded-md hover:bg-lime-700">Save & Close</button>
                </footer>
            </div>
        </div>
    );
};

export default SettingsModal;
