import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Feed, Folder } from '../src/App';
import { 
    RadioIcon, GlobeAltIcon, RssIcon, ShieldCheckIcon, 
    CpuChipIcon, FireIcon, BeakerIcon, ChartBarIcon,
    ControllerIcon, FlagIcon, SparklesIcon, ArrowPathIcon,
    ExclamationTriangleIcon, SearchIcon, PlusIcon, XIcon
} from './icons';
import { discoverFeedSignals } from '../services/feedDiscoveryService';
import { soundService } from '../services/soundService';

export type Category = 'NEWS' | 'TECH' | 'SCIENCE' | 'CULTURE' | 'SPORTS' | 'FINANCE' | 'GAMING' | 'CUSTOM';
type Region = 'GLOBAL' | 'UK' | 'US' | 'EU';

export interface Preset {
    id: string;
    title: string;
    url: string;
    category: Category;
    region?: Region;
    description: string;
    isCustom?: boolean;
}

export const PRESETS: Preset[] = [
    // NEWS
    { id: 'bbc', title: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', category: 'NEWS', region: 'UK', description: 'Global surveillance of current geopolitical events.' },
    { id: 'guardian', title: 'The Guardian', url: 'https://www.theguardian.com/world/rss', category: 'NEWS', region: 'UK', description: 'Comprehensive reporting from the UK node.' },
    { id: 'reuters', title: 'Reuters', url: 'https://www.reutersagency.com/feed/', category: 'NEWS', region: 'GLOBAL', description: 'Standardized global intelligence streams.' },
    { id: 'nyt', title: 'NY Times', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', category: 'NEWS', region: 'US', description: 'North American perspective on global shifts.' },
    { id: 'ap', title: 'Associated Press', url: 'https://newsatme.com/go/ap/rss', category: 'NEWS', region: 'US', description: 'Unfiltered wire service signal.' },
    { id: 'dw', title: 'Deutsche Welle', url: 'https://rss.dw.com/rdf/rss-en-all', category: 'NEWS', region: 'EU', description: 'Central European news frequencies.' },
    
    // TECH
    { id: 'wired', title: 'Wired', url: 'https://www.wired.com/feed/rss', category: 'TECH', region: 'GLOBAL', description: 'Data streams regarding the intersection of society and hardware.' },
    { id: 'ars', title: 'Ars Technica', url: 'https://arstechnica.com/feed/', category: 'TECH', region: 'US', description: 'In-depth analysis of evolving system architectures.' },
    { id: 'theverge', title: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'TECH', region: 'GLOBAL', description: 'Interfacing with mainstream tech cycles.' },
    { id: 'techcrunch', title: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'TECH', region: 'GLOBAL', description: 'Surveillance of emerging market technologies.' },
    { id: 'hacker', title: 'Hacker News', url: 'https://news.ycombinator.com/rss', category: 'TECH', region: 'GLOBAL', description: 'The unfiltered pulse of the developer core.' },
    { id: 'engadget', title: 'Engadget', url: 'https://www.engadget.com/rss.xml', category: 'TECH', region: 'US', description: 'Consumer electronic monitoring.' },

    // SCIENCE
    { id: 'nasa', title: 'NASA Breaking', url: 'https://www.nasa.gov/news-release/feed/', category: 'SCIENCE', region: 'US', description: 'Extraterrestrial telemetry and orbital data.' },
    { id: 'quanta', title: 'Quanta Magazine', url: 'https://www.quantamagazine.org/feed/', category: 'SCIENCE', region: 'GLOBAL', description: 'Quantum computing and theoretical logical frameworks.' },
    { id: 'scidaily', title: 'ScienceDaily', url: 'https://www.sciencedaily.com/rss/all.xml', category: 'SCIENCE', region: 'GLOBAL', description: 'Daily breakthroughs in biological and physical sciences.' },
    { id: 'nature', title: 'Nature', url: 'https://www.nature.com/nature.rss', category: 'SCIENCE', region: 'GLOBAL', description: 'Peer-reviewed signal analysis.' },

    // GAMING
    { id: 'kotaku', title: 'Kotaku', url: 'https://kotaku.com/rss', category: 'GAMING', region: 'GLOBAL', description: 'Simulation and interactive entertainment surveillance.' },
    { id: 'polygon', title: 'Polygon', url: 'https://www.polygon.com/rss/index.xml', category: 'GAMING', region: 'GLOBAL', description: 'Narrative and ludological signal processing.' },
    { id: 'ign', title: 'IGN', url: 'https://feeds.feedburner.com/ign/all', category: 'GAMING', region: 'GLOBAL', description: 'Mainstream interactive media feed.' },
    { id: 'eurogamer', title: 'Eurogamer', url: 'https://www.eurogamer.net/feed', category: 'GAMING', region: 'EU', description: 'European perspective on the interactive sector.' },

    // FINANCE
    { id: 'ft', title: 'Financial Times', url: 'https://www.ft.com/?format=rss', category: 'FINANCE', region: 'UK', description: 'Global capital flow and economic indicators.' },
    { id: 'economist', title: 'The Economist', url: 'https://www.economist.com/sections/international/rss.xml', category: 'FINANCE', region: 'GLOBAL', description: 'Macro-level economic surveillance.' },
    { id: 'bloomberg', title: 'Bloomberg', url: 'https://www.bloomberg.com/feeds/bview/mostread.xml', category: 'FINANCE', region: 'GLOBAL', description: 'High-frequency market data.' },
    { id: 'wsj', title: 'WSJ Markets', url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml', category: 'FINANCE', region: 'US', description: 'North American market telemetry.' },

    // SPORTS
    { id: 'espn', title: 'ESPN', url: 'https://www.espn.com/espn/rss/news', category: 'SPORTS', region: 'US', description: 'General athletic performance monitoring.' },
    { id: 'bbcsport', title: 'BBC Sport', url: 'https://feeds.bbci.co.uk/sport/rss.xml', category: 'SPORTS', region: 'UK', description: 'UK-centric competitive analysis.' },
    { id: 'skysports', title: 'Sky Sports', url: 'https://www.skysports.com/rss/12040', category: 'SPORTS', region: 'UK', description: 'Real-time competitive broadcasting intercept.' },

    // CULTURE
    { id: 'pitchfork', title: 'Pitchfork', url: 'https://pitchfork.com/feed/rss', category: 'CULTURE', region: 'GLOBAL', description: 'Analysis of acoustic frequencies and cultural noise.' },
    { id: 'avclub', title: 'The A.V. Club', url: 'https://www.avclub.com/rss', category: 'CULTURE', region: 'GLOBAL', description: 'Monitor of cinematic and televised outputs.' },
    { id: 'rollingstone', title: 'Rolling Stone', url: 'https://www.rollingstone.com/feed/', category: 'CULTURE', region: 'US', description: 'Mainstream cultural signal intercept.' }
];

const CATEGORIES = [
    { id: 'NEWS', icon: <GlobeAltIcon className="w-4 h-4" /> },
    { id: 'TECH', icon: <CpuChipIcon className="w-4 h-4" /> },
    { id: 'SCIENCE', icon: <BeakerIcon className="w-4 h-4" /> },
    { id: 'GAMING', icon: <ControllerIcon className="w-4 h-4" /> },
    { id: 'FINANCE', icon: <ChartBarIcon className="w-4 h-4" /> },
    { id: 'SPORTS', icon: <FlagIcon className="w-4 h-4" /> },
    { id: 'CULTURE', icon: <FireIcon className="w-4 h-4" /> },
    { id: 'CUSTOM', icon: <SearchIcon className="w-4 h-4" /> }
] as const;

interface FeedOnboardingProps {
    onComplete: (feeds: Feed[], folders: Folder[]) => void;
}

const FeedOnboarding: React.FC<FeedOnboardingProps> = ({ onComplete }) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [activeCategory, setActiveCategory] = useState<Category>('NEWS');
    const [region, setRegion] = useState<Region>('GLOBAL');
    const [isDetecting, setIsDetecting] = useState(true);
    const [showRegionOverlay, setShowRegionOverlay] = useState(false);
    
    const [customUrl, setCustomUrl] = useState('');
    const [isProbing, setIsProbing] = useState(false);
    const [discoveredSignals, setDiscoveredSignals] = useState<Preset[]>([]);
    const [probeError, setProbeError] = useState<string | null>(null);

    const firstRegionButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const detectRegion = async () => {
            setIsDetecting(true);
            try {
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                });
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                if (lat > 25 && lat < 50 && lon > -130 && lon < -65) setRegion('US');
                else if (lat > 35 && lat < 65 && lon > -15 && lon < 2) setRegion('UK');
                else if (lat > 35 && lat < 70 && lon > 2 && lon < 40) setRegion('EU');
                else setRegion('GLOBAL');
            } catch (err) {
                setRegion('GLOBAL');
            } finally {
                setIsDetecting(false);
            }
        };
        detectRegion();
    }, []);

    // Focus first option when region overlay opens
    useEffect(() => {
        if (showRegionOverlay) {
            setTimeout(() => firstRegionButtonRef.current?.focus(), 100);
        }
    }, [showRegionOverlay]);

    const togglePreset = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleConfirm = (manualFeeds?: Preset[]) => {
        const folders: Folder[] = [
            { id: 1, name: 'Core Signals' },
            { id: 2, name: 'Tech & Gaming' },
            { id: 3, name: 'Intel & Research' },
            { id: 4, name: 'Cultural Output' }
        ];

        const allAvailable = [...PRESETS, ...discoveredSignals];
        const targetPresets = manualFeeds || allAvailable.filter(p => selectedIds.has(p.id));
        
        const selectedFeeds: Feed[] = targetPresets.map(p => {
            let folderId = 1;
            if (p.category === 'TECH' || p.category === 'GAMING') folderId = 2;
            if (p.category === 'SCIENCE' || p.category === 'FINANCE') folderId = 3;
            if (p.category === 'CULTURE' || p.category === 'SPORTS') folderId = 4;
            return {
                id: Math.random() + Date.now(),
                url: p.url,
                title: p.title,
                iconUrl: `https://www.google.com/s2/favicons?sz=32&domain_url=${new URL(p.url).hostname}`,
                folderId,
                sourceType: 'rss',
                category: p.category
            };
        });
        onComplete(selectedFeeds, folders);
    };

    const handleQuickStart = () => {
        const quickSet = PRESETS.filter(p => 
            (p.region === region || p.region === 'GLOBAL') && 
            ['bbc', 'wired', 'hacker', 'nasa', 'economist'].includes(p.id)
        );
        handleConfirm(quickSet.length > 0 ? quickSet : PRESETS.filter(p => p.region === 'GLOBAL').slice(0, 5));
    };

    const handleProbe = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = customUrl.trim();
        if (!url || isProbing) return;

        setIsProbing(true);
        setProbeError(null);
        try {
            let normalized = url;
            if (!normalized.includes('.') && !normalized.includes('://')) throw new Error("Target node address invalid.");
            if (!normalized.includes('://')) normalized = `https://${normalized}`;
            
            const results = await discoverFeedSignals(normalized);
            if (results && results.length > 0) {
                const newSignals: Preset[] = results.map((res, i) => ({
                    id: `custom_${Date.now()}_${i}`,
                    title: res.title,
                    url: res.url,
                    category: 'CUSTOM',
                    description: `Operator discovered signal at ${normalized}.`,
                    isCustom: true
                }));
                setDiscoveredSignals(prev => [...newSignals, ...prev]);
                const nextSelected = new Set(selectedIds);
                newSignals.forEach(s => nextSelected.add(s.id));
                setSelectedIds(nextSelected);
                setCustomUrl('');
            } else {
                throw new Error("0x404: Frequency is silent. No RSS signals detected.");
            }
        } catch (err) {
            setProbeError(err instanceof Error ? err.message : "Interception failed.");
        } finally {
            setIsProbing(false);
        }
    };

    const filteredPresets = useMemo(() => {
        if (activeCategory === 'CUSTOM') return discoveredSignals;
        return PRESETS.filter(p => p.category === activeCategory && (p.region === region || p.region === 'GLOBAL' || activeCategory !== 'NEWS'));
    }, [activeCategory, region, discoveredSignals]);

    const regionLabels: Record<Region, string> = {
        GLOBAL: 'Global Node', UK: 'UK Node', US: 'US Node', EU: 'EU Node'
    };

    return (
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 animate-fade-in font-mono flex flex-col min-h-screen main-content-area">
            <header className="mb-6 text-center shrink-0 border-b border-white/5 pb-8">
                <div className="p-4 bg-pulse-500 w-14 h-14 mx-auto mb-6 flex items-center justify-center shadow-[0_0_30px_rgba(225,29,72,0.4)] border-2 border-white/20">
                    <RadioIcon className="w-8 h-8 text-white animate-pulse" />
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-terminal italic uppercase tracking-tighter mb-4 glitch-text">Initial Calibration</h2>
                
                <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
                    {/* Focusable Region Button (instead of Select) */}
                    <button 
                        onClick={() => { soundService.playClick(); setShowRegionOverlay(true); }}
                        className="bg-void-900 border-2 border-zinc-800 px-6 py-2.5 rounded-2xl flex items-center gap-3 transition-all hover:border-app-accent focus:ring-8 focus:ring-app-accent/40 outline-none"
                    >
                        <span className="text-[10px] font-black text-muted uppercase tracking-widest italic">Region:</span>
                        {isDetecting ? (
                            <ArrowPathIcon className="w-4 h-4 text-pulse-500 animate-spin" />
                        ) : (
                            <span className="text-terminal text-xs font-black uppercase">{regionLabels[region]}</span>
                        )}
                        <div className="w-2 h-2 rounded-full bg-pulse-500 animate-pulse" />
                    </button>
                    
                    <button 
                        onClick={handleQuickStart}
                        className="group flex items-center gap-3 px-6 py-2.5 bg-pulse-600 border-2 border-pulse-400 rounded-2xl transition-all shadow-xl text-white outline-none focus:ring-8 focus:ring-app-accent"
                    >
                        <SparklesIcon className="w-5 h-5 animate-pulse" />
                        <span className="text-[10px] font-black uppercase italic tracking-widest">Tactical Auto-Sync</span>
                    </button>
                </div>
            </header>

            <div className="flex flex-col md:flex-row gap-8 flex-grow pb-48">
                {/* Vertical Category Column */}
                <div className="w-full md:w-64 flex flex-row md:flex-col gap-3 shrink-0 overflow-x-auto md:overflow-x-visible scrollbar-hide pb-4 md:pb-0">
                    <h3 className="hidden md:block text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em] mb-4 px-2 italic">Select_Category</h3>
                    {CATEGORIES.map(cat => {
                        const allAvailable = [...PRESETS, ...discoveredSignals];
                        const countInSelected = allAvailable.filter(p => p.category === cat.id && selectedIds.has(p.id)).length;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => { soundService.playClick(); setActiveCategory(cat.id as Category); }}
                                className={`flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all shrink-0 md:shrink outline-none relative group
                                    ${activeCategory === cat.id 
                                        ? 'bg-void-surface border-app-accent text-white shadow-xl' 
                                        : 'bg-void-900 border-void-border text-muted'}`}
                            >
                                <div className="flex items-center gap-3">
                                    {cat.icon}
                                    <span className="text-[11px] font-black italic uppercase tracking-widest">{cat.id}</span>
                                </div>
                                {countInSelected > 0 && (
                                    <span className="bg-app-accent text-white text-[10px] font-black px-2 py-0.5 rounded-full ml-2 shadow-lg">{countInSelected}</span>
                                )}
                                <div className={`nav-underline ${activeCategory === cat.id ? 'w-[60%]' : 'w-0'}`} />
                            </button>
                        );
                    })}
                </div>

                {/* Right Side Body */}
                <div className="flex-grow flex flex-col gap-6">
                    {activeCategory === 'CUSTOM' && (
                        <div className="bg-void-900 p-8 border-2 border-emerald-500/30 rounded-[2rem] mb-4 animate-fade-in shadow-2xl relative overflow-hidden">
                            <div className="absolute inset-0 cctv-overlay opacity-10 pointer-events-none" />
                            <h3 className="text-xs font-black text-terminal italic uppercase tracking-widest mb-6 flex items-center gap-3">
                                <SearchIcon className="w-5 h-5 text-emerald-500" />
                                Custom Node Probing
                            </h3>
                            <form onSubmit={handleProbe} className="flex gap-3 relative z-10">
                                <div className="flex-grow relative">
                                    <input 
                                        type="text" 
                                        value={customUrl} 
                                        onChange={(e) => setCustomUrl(e.target.value)}
                                        placeholder="Enter website URL..."
                                        className="w-full bg-void-950 border-2 border-void-border rounded-xl py-4 px-6 text-sm text-terminal outline-none focus:border-emerald-500 transition-all font-mono"
                                    />
                                    {isProbing && <div className="absolute right-4 top-1/2 -translate-y-1/2"><ArrowPathIcon className="w-5 h-5 text-emerald-500 animate-spin" /></div>}
                                </div>
                                <button type="submit" disabled={!customUrl.trim() || isProbing} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-black uppercase italic text-xs transition-all disabled:opacity-30 flex items-center gap-3 active:scale-95 shadow-xl">
                                    <PlusIcon className="w-5 h-5" />
                                    <span>Probe</span>
                                </button>
                            </form>
                            {probeError && <p className="mt-4 text-[10px] font-black text-pulse-500 uppercase italic tracking-widest animate-shake leading-relaxed">{probeError}</p>}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                        {filteredPresets.length === 0 ? (
                            <div className="col-span-full py-24 text-center border-4 border-dashed border-void-border rounded-[3rem] bg-void-surface/30">
                                <p className="text-sm text-muted font-black uppercase tracking-[0.4em] italic">No sector packets found</p>
                                <button onClick={() => setRegion('GLOBAL')} className="mt-6 text-pulse-500 text-xs font-black uppercase underline hover:text-white transition-colors">Access Global Nodes</button>
                            </div>
                        ) : (
                            filteredPresets.map(preset => {
                                const isSelected = selectedIds.has(preset.id);
                                return (
                                    <button 
                                        key={preset.id}
                                        onClick={() => { soundService.playClick(); togglePreset(preset.id); }}
                                        className={`group text-left relative bg-zinc-900 border-[3px] transition-all duration-300 p-6 flex flex-col h-56 rounded-void shadow-2xl outline-none focus:ring-8 focus:ring-app-accent
                                            ${isSelected ? 'border-app-accent scale-105 z-10' : 'border-void-border opacity-70 grayscale hover:opacity-100 hover:grayscale-0'}`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-[8px] font-black text-muted uppercase tracking-widest italic">{preset.isCustom ? 'DISCOVERED NODE' : `${preset.region} NODE`}</span>
                                            <div className={`w-3 h-3 rounded-full border-2 ${isSelected ? 'bg-app-accent border-white animate-pulse' : 'bg-void-border border-zinc-700'}`} />
                                        </div>
                                        <h3 className="text-lg font-black text-terminal italic uppercase tracking-tighter mb-2 leading-tight line-clamp-2">{preset.title}</h3>
                                        <p className="text-[10px] text-zinc-500 uppercase leading-relaxed font-bold line-clamp-3 mb-4 group-hover:text-zinc-300 transition-colors italic">{preset.description}</p>
                                        <div className="mt-auto flex justify-between items-end">
                                            <span className="text-[7px] text-muted/40 uppercase font-mono tracking-tighter">NODE_{preset.id.substring(0, 8)}</span>
                                            {isSelected && <span className="text-[8px] font-black text-app-accent uppercase animate-pulse italic tracking-widest">Uplink_Confirmed</span>}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Region Selection Overlay */}
            {showRegionOverlay && (
                <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
                    <div className="bg-zinc-900 border-4 border-app-accent shadow-[0_0_80px_rgba(0,0,0,0.5)] w-full max-w-sm relative overflow-hidden flex flex-col rounded-[2.5rem]">
                        <header className="h-12 bg-app-accent flex items-center justify-between px-4 border-b-2 border-black">
                            <div className="flex items-center gap-2 h-full">
                                <GlobeAltIcon className="w-5 h-5 text-black" />
                                <h2 className="text-black text-[10px] font-black uppercase tracking-[0.2em] italic px-2">GEOGRAPHIC_SYNC.DAT</h2>
                            </div>
                            <button onClick={() => setShowRegionOverlay(false)} className="hover:scale-110 transition-transform"><XIcon className="w-5 h-5 text-black"/></button>
                        </header>
                        <div className="p-8 space-y-3">
                            <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-4 italic text-center">Select Local Intercept Point</p>
                            {(Object.keys(regionLabels) as Region[]).map((r, i) => (
                                <button 
                                    key={r}
                                    ref={i === 0 ? firstRegionButtonRef : null}
                                    onClick={() => { setRegion(r); setShowRegionOverlay(false); soundService.playCorrect(); }}
                                    className={`w-full py-4 px-6 rounded-xl font-black uppercase italic text-xs tracking-widest transition-all outline-none border-2
                                        ${region === r ? 'bg-app-accent text-black border-white shadow-xl' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'}`}
                                >
                                    {regionLabels[r]}
                                </button>
                            ))}
                        </div>
                        <footer className="p-4 bg-zinc-300 border-t-2 border-black">
                             <button onClick={() => setShowRegionOverlay(false)} className="w-full py-3 bg-zinc-400 text-zinc-800 font-black uppercase italic text-[10px] outline-none">Cancel Sync</button>
                        </footer>
                    </div>
                </div>
            )}

            <div className="fixed bottom-10 left-0 right-0 z-[60] px-8 pointer-events-none flex justify-center">
                <div className="max-w-2xl w-full pointer-events-auto">
                    <button 
                        onClick={() => handleConfirm()}
                        disabled={selectedIds.size === 0}
                        className="w-full py-6 bg-terminal text-inverse font-black uppercase italic text-2xl rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] border-4 border-void-border hover:bg-app-accent hover:text-white transition-all active:scale-95 disabled:opacity-30 outline-none focus:ring-12 focus:ring-app-accent/40"
                    >
                        <RssIcon className="w-8 h-8" />
                        <span>Establish Uplink ({selectedIds.size})</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FeedOnboarding;