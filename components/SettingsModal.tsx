
import React, { useState, useEffect, useRef } from 'react';
import type { Settings, Theme, ArticleView, WidgetSettings } from '../App';
import { XIcon, SunIcon, MoonIcon, CloudSyncIcon, CloudArrowDownIcon } from './icons';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: Settings;
    onUpdateSettings: (newSettings: Partial<Omit<Settings, 'feeds' | 'folders'>>) => void;
    onImportOpml: (file: File) => void;
    onExportOpml: () => void;
}

type Tab = 'General' | 'Feeds' | 'Widgets';

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onUpdateSettings, onImportOpml, onExportOpml }) => {
    const [activeTab, setActiveTab] = useState<Tab>('General');
    const [localSettings, setLocalSettings] = useState({
        theme: settings.theme,
        articleView: settings.articleView,
        widgets: { ...settings.widgets }
    });
    const [sportsTeamsInput, setSportsTeamsInput] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Reset local state when modal is opened
        if (isOpen) {
            setLocalSettings({
                theme: settings.theme,
                articleView: settings.articleView,
                widgets: { ...settings.widgets }
            });
            setSportsTeamsInput(settings.widgets.sportsTeams.join(', '));
        }
    }, [isOpen, settings]);

    if (!isOpen) return null;

    const handleSave = () => {
        const teams = sportsTeamsInput.split(',').map(t => t.trim()).filter(Boolean);
        const finalSettings = {
            ...localSettings,
            widgets: {
                ...localSettings.widgets,
                sportsTeams: teams,
            },
        };
        onUpdateSettings(finalSettings);
        onClose();
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onImportOpml(file);
        }
        if (event.target) {
            event.target.value = '';
        }
    };

    const handleWidgetChange = (key: keyof WidgetSettings, value: any) => {
        setLocalSettings(prev => ({
            ...prev,
            widgets: { ...prev.widgets, [key]: value }
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
                        <TabButton name="Feeds" />
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
                                <input type="checkbox" checked={localSettings.widgets.showWeather} onChange={e => handleWidgetChange('showWeather', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-lime-600 focus:ring-lime-500" />
                            </div>
                             <div>
                                <label htmlFor="weatherLocation" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Weather Location</label>
                                <input id="weatherLocation" type="text" value={localSettings.widgets.weatherLocation} onChange={e => handleWidgetChange('weatherLocation', e.target.value)} className="w-full bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500" />
                            </div>
                            <hr className="border-gray-200 dark:border-zinc-800" />
                             <div className="flex items-center justify-between">
                                <span className="text-zinc-700 dark:text-zinc-300">Show Sports Widget</span>
                                <input type="checkbox" checked={localSettings.widgets.showSports} onChange={e => handleWidgetChange('showSports', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-lime-600 focus:ring-lime-500" />
                            </div>
                             <div>
                                <label htmlFor="sportsTeams" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Sports Team Codes (comma-separated)</label>
                                <input id="sportsTeams" type="text" value={sportsTeamsInput} onChange={(e) => setSportsTeamsInput(e.target.value)} className="w-full bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500" placeholder="e.g. MUN, LFC, ARS" />
                                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">Enter team codes to see live scores in the mobile Discover view.</p>
                            </div>
                             <hr className="border-gray-200 dark:border-zinc-800" />
                             <div className="flex items-center justify-between">
                                <span className="text-zinc-700 dark:text-zinc-300">Show Finance Widget (coming soon)</span>
                                <input type="checkbox" disabled checked={localSettings.widgets.showFinance} onChange={e => handleWidgetChange('showFinance', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-lime-600 focus:ring-lime-500 disabled:opacity-50" />
                            </div>
                        </div>
                    )}
                    {activeTab === 'Feeds' && (
                         <div className="space-y-4">
                            <p className="text-sm text-gray-500 dark:text-zinc-400">Manage your feeds by importing or exporting an OPML file.</p>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".opml,.xml" aria-hidden="true" />
                            <button onClick={handleImportClick} className="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-md text-zinc-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700">
                                <CloudSyncIcon className="w-5 h-5" />
                                <span>Import from OPML</span>
                            </button>
                            <button onClick={onExportOpml} className="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-md text-zinc-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700">
                                <CloudArrowDownIcon className="w-5 h-5" />
                                <span>Export to OPML</span>
                            </button>
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
