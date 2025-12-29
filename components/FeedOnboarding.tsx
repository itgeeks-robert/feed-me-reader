import React, { useState, useMemo, useEffect } from 'react';
import type { Feed, Folder } from '../src/App';
import { 
    RadioIcon, GlobeAltIcon, RssIcon, ShieldCheckIcon, 
    CpuChipIcon, FireIcon, BeakerIcon, ChartBarIcon,
    ControllerIcon, FlagIcon, SparklesIcon, ArrowPathIcon,
    ExclamationTriangleIcon
} from './icons';

export type Category = 'NEWS' | 'TECH' | 'SCIENCE' | 'CULTURE' | 'SPORTS' | 'FINANCE' | 'GAMING';
type Region = 'GLOBAL' | 'UK' | 'US' | 'EU';

export interface Preset {
    id: string;
    title: string;
    url: string;
    category: Category;
    region: Region;
    description: string;
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
    { id: 'CULTURE', icon: <FireIcon className="w-4 h-4" /> }
] as const;

interface FeedOnboardingProps {
    onComplete: (feeds: Feed[], folders: Folder[]) => void;
}

const FeedOnboarding: React.FC<FeedOnboardingProps> = ({ onComplete }) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [activeCategory, setActiveCategory] = useState<Category>('NEWS');
    const [region, setRegion] = useState<Region>('GLOBAL');
    const [isDetecting, setIsDetecting] = useState(true);

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
        const targetPresets = manualFeeds || PRESETS.filter(p => selectedIds.has(p.id));
        const selectedFeeds: Feed[] = targetPresets.map(p => {
            let folderId = 1;
            if (p.category === 'TECH' || p.category === 'GAMING') folderId = 2;
            if (p.category === 'SCIENCE' || p.category === 'FINANCE') folderId = 3;
            if (p.category === 'CULTURE' || p.category === 'SPORTS') folderId = 4;
            return {
                id: Math.random(),
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

    const filteredPresets = useMemo(() => 
        PRESETS.filter(p => p.category === activeCategory && (p.region === region || p.region === 'GLOBAL' || activeCategory !== 'NEWS')), 
    [activeCategory, region]);

    return (
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 animate-fade-in font-mono flex flex-col min-h-screen">
            <header className="mb-6 text-center shrink-0">
                <div className="p-4 bg-pulse-500 w-14 h-14 mx-auto mb-6 flex items-center justify-center shadow-[0_0_30px_rgba(225,29,72,0.4)] border-2 border-white/20">
                    <RadioIcon className="w-8 h-8 text-white animate-pulse" />
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter mb-4 glitch-text">Initial Calibration</h2>
                
                <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                    <div className="bg-void-900 border border-zinc-800 px-3 py-1.5 rounded-xl flex items-center gap-3">
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest italic">Region:</span>
                        {isDetecting ? (
                            <ArrowPathIcon className="w-3 h-3 text-pulse-500 animate-spin" />
                        ) : (
                            <select 
                                value={region} 
                                onChange={(e) => setRegion(e.target.value as Region)}
                                className="bg-transparent text-white text-[10px] font-black uppercase outline-none cursor-pointer hover:text-pulse-500"
                            >
                                <option value="GLOBAL">Global Node</option>
                                <option value="UK">UK Node</option>
                                <option value="US">US Node</option>
                                <option value="EU">EU Node</option>
                            </select>
                        )}
                    </div>
                    
                    <button 
                        onClick={handleQuickStart}
                        className="group flex items-center gap-2 px-4 py-1.5 bg-pulse-600 hover:bg-white text-white hover:text-black border border-pulse-400 rounded-xl transition-all active:scale-95 shadow-lg"
                    >
                        <SparklesIcon className="w-4 h-4 animate-pulse" />
                        <span className="text-[9px] font-black uppercase italic tracking-widest">Tactical Auto-Sync</span>
                    </button>
                </div>
            </header>

            <div className="mb-10 bg-void-900 border-l-4 border-amber-500/50 p-4 rounded-r-xl max-w-4xl mx-auto flex items-start gap-4">
                <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                <div>
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1 italic">Protocol Advisory: External Encryption</p>
                    <p className="text-[9px] text-zinc-500 uppercase font-black leading-relaxed tracking-wide">Certain signal streams (e.g., NYT, Bloomberg, FT) utilize high-level external encryption (paywalls). Access to full decoded transmissions may require independent operator credentials on provider nodes.</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 flex-grow pb-48">
                <div className="w-full md:w-56 flex flex-row md:flex-col gap-2 shrink-0 overflow-x-auto md:overflow-x-visible scrollbar-hide pb-2 md:pb-0">
                    {CATEGORIES.map(cat => {
                        const countInSelected = PRESETS.filter(p => p.category === cat.id && selectedIds.has(p.id)).length;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id as Category)}
                                className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all shrink-0 md:shrink
                                    ${activeCategory === cat.id 
                                        ? 'bg-pulse-600 border-pulse-400 text-white shadow-lg' 
                                        : 'bg-void-900 border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}
                            >
                                <div className="flex items-center gap-2">
                                    {cat.icon}
                                    <span className="text-[10px] font-black italic uppercase tracking-widest">{cat.id}</span>
                                </div>
                                {countInSelected > 0 && (
                                    <span className="bg-white text-black text-[9px] font-black px-1.5 rounded-full ml-2">{countInSelected}</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredPresets.length === 0 ? (
                        <div className="col-span-full py-16 text-center border-2 border-dashed border-zinc-900 rounded-[2rem]">
                            <p className="text-[10px] text-zinc-700 font-black uppercase tracking-[0.4em] italic">No sector packets found</p>
                            <button onClick={() => setRegion('GLOBAL')} className="mt-4 text-pulse-500 text-[10px] font-black uppercase underline">Access Global Nodes</button>
                        </div>
                    ) : (
                        filteredPresets.map(preset => {
                            const isSelected = selectedIds.has(preset.id);
                            return (
                                <div 
                                    key={preset.id}
                                    onClick={() => togglePreset(preset.id)}
                                    className={`group relative bg-void-900 border-2 transition-all duration-300 cursor-pointer p-5 flex flex-col h-44 shadow-[6px_6px_0px_black] hover:translate-x-[-2px] hover:translate-y-[-2px]
                                        ${isSelected ? 'border-pulse-500 shadow-[0_0_20px_rgba(225,29,72,0.2)]' : 'border-zinc-800 opacity-60 grayscale hover:opacity-100 hover:grayscale-0'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest italic">{preset.region} NODE</span>
                                        <div className={`w-2 h-2 rounded-full border ${isSelected ? 'bg-pulse-500 border-pulse-400 animate-pulse' : 'bg-zinc-800 border-zinc-700'}`} />
                                    </div>
                                    
                                    <h3 className="text-base font-black text-white italic uppercase tracking-tighter mb-1 leading-tight">{preset.title}</h3>
                                    <p className="text-[9px] text-zinc-500 uppercase leading-tight font-bold line-clamp-3 mb-2">{preset.description}</p>
                                    
                                    <div className="mt-auto flex justify-between items-end">
                                        <span className="text-[6px] font-black text-zinc-700 uppercase">PKG_{preset.id}</span>
                                        {isSelected && <span className="text-[7px] font-black text-pulse-500 uppercase animate-pulse">Synced</span>}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="fixed bottom-6 left-0 right-0 md:left-72 z-[60] px-4 pointer-events-none">
                <div className="max-w-xl mx-auto pointer-events-auto">
                    <button 
                        onClick={() => handleConfirm()}
                        disabled={selectedIds.size === 0}
                        className="w-full py-5 bg-white text-black font-black uppercase italic text-xl rounded-2xl shadow-[8px_8px_0px_#e11d48] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none flex items-center justify-center gap-4"
                    >
                        <RssIcon className="w-7 h-7" />
                        <span>Establish Uplink ({selectedIds.size})</span>
                    </button>
                    <p className="text-center text-[8px] text-zinc-600 uppercase tracking-widest mt-4 font-black italic drop-shadow-md">Initial calibration will initialize core frequency cache.</p>
                </div>
            </div>
        </div>
    );
};

export default FeedOnboarding;