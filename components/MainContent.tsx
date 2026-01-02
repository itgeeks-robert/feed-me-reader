import React, { useState, useEffect, useMemo } from 'react';
import type { Feed, Folder, Selection, WidgetSettings, Article, ArticleView, Theme } from '../src/App';
import type { SourceType } from './AddSource';
import { MenuIcon, SearchIcon, SunIcon, MoonIcon, GlobeAltIcon, CpuChipIcon, BeakerIcon, ChartBarIcon, FlagIcon, FireIcon, ControllerIcon, XIcon, ExclamationTriangleIcon, ArrowPathIcon, RadioIcon, VoidIcon, ShieldCheckIcon } from './icons';
import { resilientFetch } from '../services/fetch';
import { parseRssXml } from '../services/rssParser';
import FeaturedStory from './articles/FeaturedStory';
import MagazineArticleListItem from './articles/MagazineArticleListItem';
import { getCacheCount } from '../services/cacheService';
import FeedOnboarding, { PRESETS, Category } from './FeedOnboarding';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { discoverFeedSignals } from '../services/feedDiscoveryService';
import Tooltip from './Tooltip';

interface MainContentProps {
    feedsToDisplay: Feed[];
    selection: Selection;
    onSelectCategory: (cat: string | null) => void;
    readArticleIds: Set<string>;
    bookmarkedArticleIds: Set<string>;
    articleTags: Map<string, Set<string>>;
    onMarkAsRead: (articleId: string) => void;
    onPurgeBuffer: (articleIds: string[]) => void;
    onMarkAsUnread: (articleId: string) => void;
    onMarkMultipleAsRead: (articleIds: string[]) => void;
    onToggleBookmark: (articleId: string) => void;
    onSetArticleTags: (articleId: string, tags: Set<string>) => void;
    onSearch: (query: string) => void;
    onOpenReader: (article: Article) => void;
    onOpenExternal: (url: string, id: string) => void;
    allFeeds: Feed[];
    onSetFeeds?: (feeds: Feed[]) => void;
    onSetFolders?: (folders: Folder[]) => void;
    refreshKey: number;
    onRefresh: () => void;
    widgetSettings: WidgetSettings;
    articleView: ArticleView;
    theme: Theme;
    onToggleTheme: () => void;
    onOpenSettings: () => void;
    onOpenAddSource: () => void;
    onAddSource: (url: string, type: SourceType) => Promise<void>;
    onOpenSidebar: () => void;
    animationClass: string;
    pageTitle: string;
    uptime: number;
    initialArticles?: Article[];
    onSetSniffErrorModal: (show: boolean) => void;
    onOpenSearchExplainer?: () => void;
    onOpenIntegrityBriefing?: () => void;
}

const ARTICLES_PER_PAGE = 25;
const LOAD_MORE_BATCH = 15;

const CATEGORY_MAP = [
    { id: 'NEWS', icon: <GlobeAltIcon className="w-3 h-3" /> },
    { id: 'TECH', icon: <CpuChipIcon className="w-3 h-3" /> },
    { id: 'SCIENCE', icon: <BeakerIcon className="w-3 h-3" /> },
    { id: 'FINANCE', icon: <ChartBarIcon className="w-3 h-3" /> },
    { id: 'SPORTS', icon: <FlagIcon className="w-3 h-3" /> },
    { id: 'CULTURE', icon: <FireIcon className="w-3 h-3" /> },
    { id: 'GAMING', icon: <ControllerIcon className="w-3 h-3" /> }
];

const EnergyScope: React.FC<{ value: number, onClick?: () => void }> = ({ value, onClick }) => (
    <Tooltip text="Terminal stability. Depleted integrity requires core reboot.">
        <div className="w-full flex flex-col gap-1 cursor-help group" onClick={onClick}>
            <div className="flex justify-between items-baseline">
                <span className="text-[9px] font-black text-pulse-600 dark:text-pulse-500 uppercase tracking-[0.2em] italic group-hover:text-white transition-colors">System_Integrity</span>
                <span className="text-[9px] font-mono font-black text-pulse-500">{value}%</span>
            </div>
            <div className="w-full h-1 bg-black border border-white/5 rounded-none overflow-hidden relative">
                <div className="h-full bg-pulse-500 shadow-[0_0_10px_#e11d48] transition-all duration-1000" style={{ width: `${value}%` }} />
            </div>
        </div>
    </Tooltip>
);

const MainContent: React.FC<MainContentProps> = (props) => {
    const { selection, onSelectCategory, readArticleIds, bookmarkedArticleIds, onMarkAsRead, onPurgeBuffer, onSearch, onOpenReader, onOpenExternal, refreshKey, onOpenSidebar, theme, onToggleTheme, animationClass, pageTitle, uptime, allFeeds, onSetFeeds, onSetFolders, initialArticles, onAddSource, onRefresh, onSetSniffErrorModal, onOpenSearchExplainer, onOpenIntegrityBriefing } = props;
    
    const [articles, setArticles] = useState<Article[]>(initialArticles || []);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [visibleCount, setVisibleCount] = useState(ARTICLES_PER_PAGE);
    const [showOnlyUnread, setShowOnlyUnread] = useState(false);
    const [cacheCount, setCacheCount] = useState(0);
    const [pendingCategory, setPendingCategory] = useState<string | null>(null);
    const [isSniffing, setIsSniffing] = useState(false);
    const [rememberGlobalWarning, setRememberGlobalWarning] = useLocalStorage<boolean>('void_remember_global_warning', false);
    
    useEffect(() => { getCacheCount().then(setCacheCount); }, [refreshKey]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                onRefresh();
            }
        }, 60000);
        return () => clearInterval(interval);
    }, [onRefresh]);

    const activeFeeds = useMemo(() => {
        if (!selection.category) return allFeeds;
        if (selection.category === 'GLOBAL_SYNC') {
            const presetsAsFeeds = PRESETS.map(p => ({
                id: Math.random(),
                url: p.url,
                title: p.title,
                iconUrl: '',
                folderId: null,
                category: p.category
            }));
            return [...allFeeds, ...presetsAsFeeds];
        }
        const presets = PRESETS.filter(p => p.category === selection.category);
        return presets.map(p => ({
            id: Math.random(),
            url: p.url,
            title: p.title,
            iconUrl: '',
            folderId: null,
            category: p.category
        }));
    }, [selection.category, allFeeds]);

    useEffect(() => {
        if (initialArticles && initialArticles.length > 0 && !selection.category && articles.length === initialArticles.length && refreshKey === 0) {
            return;
        }

        const fetchRssFeeds = async (targetFeeds: Feed[]) => {
            if (targetFeeds.length === 0) { setArticles([]); return; };
            setLoading(true);
            const promises = targetFeeds.map(feed => 
                resilientFetch(feed.url, { timeout: 10000 })
                    .then(response => response.text())
                    .then(xmlText => {
                        const parsed = parseRssXml(xmlText, feed.title, feed.url);
                        return parsed.map(a => ({ ...a, feedCategory: feed.category || 'GENERAL' }));
                    })
                    .catch(() => [])
            );
            try {
                const results = await Promise.all(promises);
                const allArticles = results.flat();
                allArticles.sort((a, b) => (b.publishedDate?.getTime() || 0) - (a.publishedDate?.getTime() || 0));
                setArticles(Array.from(new Map(allArticles.map(a => [a.id, a])).values()));
            } finally { setLoading(false); }
        };
        fetchRssFeeds(activeFeeds);
    }, [activeFeeds, refreshKey, initialArticles]);

    const filteredArticles = useMemo(() => {
        let result = articles;
        if (selection.type === 'bookmarks') {
            result = result.filter(a => bookmarkedArticleIds.has(a.id));
        } else if (selection.type === 'search' && selection.query) {
             const filter = selection.query.toLowerCase();
             result = result.filter(a => a.title.toLowerCase().includes(filter) || a.snippet.toLowerCase().includes(filter) || a.source.toLowerCase().includes(filter));
        }
        
        if (selection.category && selection.category !== 'GLOBAL_SYNC') {
            const catLower = selection.category.toLowerCase();
            result = result.filter(a => 
                a.feedCategory === selection.category || 
                a.source.toLowerCase().includes(catLower)
            );
        }

        if (showOnlyUnread) {
            result = result.filter(a => !readArticleIds.has(a.id));
        }
        return result;
    }, [articles, selection, bookmarkedArticleIds, showOnlyUnread, readArticleIds]);

    const unreadCount = useMemo(() => filteredArticles.filter(a => !readArticleIds.has(a.id)).length, [filteredArticles, readArticleIds]);

    const handleCategoryClick = (catId: string | null) => {
        if (!catId) {
            onSelectCategory(null);
            return;
        }
        if (rememberGlobalWarning) {
            onSelectCategory(catId);
        } else {
            setPendingCategory(catId);
        }
    };

    const handleSniffSignal = async (targetUrl?: string) => {
        const query = targetUrl || searchQuery;
        if (!query || isSniffing) return;
        setIsSniffing(true);
        try {
            let normalized = query.trim();
            if (!normalized.includes('.') && !normalized.includes('://')) {
                throw new Error("Target is not a valid node address.");
            }
            if (!normalized.includes('://')) normalized = `https://${normalized}`;
            const discovered = await discoverFeedSignals(normalized);
            if (discovered && discovered.length > 0) {
                await onAddSource(discovered[0].url, 'rss');
                setSearchQuery('');
                onRefresh();
                return true;
            } else {
                throw new Error("Frequency is silent.");
            }
        } catch (err) {
            onSetSniffErrorModal(true);
            return false;
        } finally {
            setIsSniffing(false);
        }
    };

    const isUrl = (str: string) => {
        return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/.test(str);
    };

    const handleSearchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const query = searchQuery.trim();
        if (!query) return;
        if (isUrl(query)) {
            await handleSniffSignal(query);
        } else {
            onSearch(query);
            const filter = query.toLowerCase();
            const localHits = articles.filter(a => 
                a.title.toLowerCase().includes(filter) || 
                a.snippet.toLowerCase().includes(filter) || 
                a.source.toLowerCase().includes(filter)
            );
            if (localHits.length === 0) {
                await handleSniffSignal(query);
            }
        }
    };

    if (allFeeds.length === 0 && selection.type === 'all' && onSetFeeds && onSetFolders) {
        return (
            <main className={`flex-grow overflow-y-auto scrollbar-hide ${animationClass} bg-void-950 pb-40 pt-2`}>
                <Header 
                    onSearchSubmit={handleSearchSubmit} 
                    searchQuery={searchQuery} 
                    setSearchQuery={setSearchQuery} 
                    onOpenSidebar={onOpenSidebar} 
                    theme={theme} 
                    onToggleTheme={onToggleTheme} 
                    uptime={uptime} 
                    cacheCount={cacheCount}
                    isSniffing={isSniffing}
                    onSniff={() => handleSniffSignal()}
                    onOpenSearchExplainer={onOpenSearchExplainer}
                    onOpenIntegrityBriefing={onOpenIntegrityBriefing}
                    onRefresh={onRefresh}
                />
                <div className="pt-24 md:pt-32">
                    <FeedOnboarding onComplete={(f, fld) => { onSetFolders(fld); onSetFeeds(f); }} />
                </div>
            </main>
        );
    }

    const latestArticle = filteredArticles.length > 0 ? filteredArticles[0] : null;
    const articlesToDisplay = filteredArticles.slice(1);
    const visibleArticlesToDisplay = articlesToDisplay.slice(0, visibleCount - 1);

    return (
        <main className={`flex-grow overflow-y-auto scrollbar-hide ${animationClass} bg-void-950 pb-[calc(10rem+var(--safe-bottom))] md:pb-32 scroll-smooth pt-2`}>
            <Header 
                onSearchSubmit={handleSearchSubmit} 
                searchQuery={searchQuery} 
                setSearchQuery={setSearchQuery} 
                onOpenSidebar={onOpenSidebar} 
                theme={theme} 
                onToggleTheme={onToggleTheme} 
                uptime={uptime} 
                cacheCount={cacheCount} 
                isSniffing={isSniffing}
                onSniff={() => handleSniffSignal()}
                onOpenSearchExplainer={onOpenSearchExplainer}
                onOpenIntegrityBriefing={onOpenIntegrityBriefing}
                onRefresh={onRefresh}
            />
            
            <nav className="fixed top-[calc(4.5rem+var(--safe-top))] md:top-[calc(6rem+var(--safe-top))] landscape:top-[calc(4rem+var(--safe-top))] left-0 right-0 z-20 bg-black/80 backdrop-blur-xl border-b border-white/5 flex items-center h-14 landscape:h-12 overflow-x-auto scrollbar-hide px-4 md:px-12 gap-3 shadow-2xl transition-all">
                <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border-2 border-zinc-800 rounded-lg">
                    <button 
                        onClick={() => handleCategoryClick(null)} 
                        className={`shrink-0 flex items-center gap-2 px-4 py-1.5 landscape:py-1 rounded-sm text-[8px] font-black uppercase italic transition-all ${!selection.category ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-transparent text-zinc-500 hover:text-white'}`}
                    >
                        <ShieldCheckIcon className="w-3 h-3" />
                        <span>Core_Net</span>
                    </button>
                </div>

                <div className="h-4 w-px bg-zinc-800 mx-1 shrink-0" />

                <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border-2 border-zinc-800 rounded-lg overflow-hidden shrink-0">
                    <button 
                        onClick={() => handleCategoryClick('GLOBAL_SYNC')} 
                        className={`shrink-0 flex items-center gap-2 px-4 py-1.5 landscape:py-1 rounded-sm text-[8px] font-black uppercase italic transition-all ${selection.category === 'GLOBAL_SYNC' ? 'bg-pulse-500 text-white shadow-lg shadow-pulse-500/20' : 'bg-transparent text-zinc-500 hover:text-white'}`}
                    >
                        <RadioIcon className="w-3 h-3" />
                        <span>Global_Sync</span>
                    </button>
                    {CATEGORY_MAP.map(cat => (
                        <button 
                            key={cat.id} 
                            onClick={() => handleCategoryClick(cat.id)} 
                            className={`shrink-0 flex items-center gap-2 px-4 py-1.5 landscape:py-1 rounded-sm text-[8px] font-black uppercase italic transition-all ${selection.category === cat.id ? 'bg-pulse-500 text-white shadow-lg' : 'bg-transparent text-zinc-500 hover:text-white'}`}
                        >
                            {cat.icon}
                            <span>{cat.id}</span>
                        </button>
                    ))}
                </div>
            </nav>

            <div className="px-4 md:px-8 pt-[calc(10rem+var(--safe-top))] md:pt-[calc(12rem+var(--safe-top))] landscape:pt-[calc(9rem+var(--safe-top))] max-w-[1800px] mx-auto transition-all">
                 <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b-2 border-zinc-900 mb-10">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black text-white italic glitch-text uppercase tracking-tighter leading-none">
                            {selection.category === 'GLOBAL_SYNC' ? 'Mass Signal Sync' : pageTitle}
                        </h1>
                        <div className="flex items-center gap-3 mt-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em] font-mono italic">
                                {loading ? 'Acquiring_Data...' : `${unreadCount} Active_Packets_Detected`}
                            </p>
                        </div>
                    </div>
                    {unreadCount > 5 && (
                        <Tooltip text="Purge read transmissions from node memory.">
                            <button onClick={() => onPurgeBuffer(filteredArticles.map(a => a.id))} className="px-6 py-2.5 bg-zinc-900 border-2 border-pulse-600 text-pulse-500 hover:bg-pulse-600 hover:text-white font-black uppercase italic text-[9px] tracking-widest transition-all shadow-[4px_4px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">Clear_Buffer</button>
                        </Tooltip>
                    )}
                </div>
                
                {latestArticle && !selection.category && (
                    <div className="mb-12 landscape:mb-8">
                        <FeaturedStory article={latestArticle} onReadHere={() => onOpenReader(latestArticle)} onReadExternal={() => onOpenExternal(latestArticle.link, latestArticle.id)} isRead={readArticleIds.has(latestArticle.id)} />
                    </div>
                )}
                
                <div className="mt-12 landscape:mt-8">
                    <div className="flex items-center gap-6 mb-10 border-l-[4px] border-emerald-500 pl-6">
                        <h2 className="font-black text-xl md:text-3xl text-white italic uppercase tracking-tighter">Decoded Frequency</h2>
                        <UnreadFilterToggle checked={showOnlyUnread} onChange={setShowOnlyUnread} />
                    </div>

                    {loading && filteredArticles.length === 0 ? (
                        <div className="text-center py-32 flex flex-col items-center gap-8">
                            <div className="w-14 h-14 border-4 border-pulse-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_#e11d48]" />
                            <span className="text-pulse-500 font-black font-mono text-[10px] uppercase tracking-[0.6em] animate-pulse italic">Interrogating_Network...</span>
                        </div>
                    ) : filteredArticles.length === 0 ? (
                        <div className="text-center py-24 border-4 border-dashed border-zinc-900 rounded-[3rem] bg-black/20">
                            <ExclamationTriangleIcon className="w-14 h-14 text-zinc-800 mx-auto mb-6" />
                            <h3 className="text-2xl font-black text-zinc-600 uppercase italic mb-3 tracking-tighter">Frequency Silent</h3>
                            <p className="text-[9px] text-zinc-700 uppercase tracking-[0.3em] mb-8 font-mono italic leading-loose">No logical matches detected for packet request:<br/>"{selection.query || 'current_selection'}"</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
                            {visibleArticlesToDisplay.map(article => (
                                <MagazineArticleListItem key={article.id} article={article} onMarkAsRead={() => onMarkAsRead(article.id)} onReadHere={() => onOpenReader(article)} onReadExternal={() => onOpenExternal(article.link, article.id)} isRead={readArticleIds.has(article.id)} />
                            ))}
                        </div>
                    )}

                    {articlesToDisplay.length > visibleArticlesToDisplay.length && (
                        <div className="mt-20 text-center">
                            <button onClick={() => setVisibleCount(c => c + LOAD_MORE_BATCH)} className="bg-zinc-100 border-4 border-black text-black font-black uppercase italic py-5 px-16 transition-all shadow-[8px_8px_0px_#e11d48] text-[10px] tracking-widest active:translate-x-1 active:translate-y-1 active:shadow-none">Fetch {LOAD_MORE_BATCH} Additional Nodes</button>
                        </div>
                    )}
                </div>
            </div>

            {pendingCategory && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-6 font-mono animate-fade-in">
                    <div className="bg-zinc-900 border-4 border-zinc-800 shadow-2xl w-full max-w-md relative overflow-hidden flex flex-col rounded-3xl">
                        <header className="h-10 bg-zinc-800 flex items-center justify-between px-1 border-b-2 border-black">
                            <div className="flex items-center gap-2 h-full">
                                <div className="w-8 h-7 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center"><div className="w-4 h-1 bg-black shadow-[0_4px_0_black]" /></div>
                                <h2 className="text-white text-[9px] font-black uppercase tracking-[0.2em] italic px-2">SYST_UPLINK.EXE</h2>
                            </div>
                        </header>
                        <div className="p-10 bg-void-950 text-center space-y-8">
                            <div className="mx-auto w-16 h-16 bg-pulse-500/10 rounded-full flex items-center justify-center border-2 border-pulse-500 animate-pulse">
                                <RadioIcon className="w-8 h-8 text-pulse-500" />
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Establish Mass Uplink?</h3>
                                <p className="text-[10px] text-zinc-500 leading-relaxed uppercase tracking-widest italic px-4">Operator, syncing with <span className="text-pulse-500 font-black">ALL {pendingCategory === 'GLOBAL_SYNC' ? 'GLOBAL' : pendingCategory} NODES</span> will saturate the buffer. Performance degradation possible.</p>
                            </div>
                            <label className="flex items-center justify-center gap-3 cursor-pointer group">
                                <input type="checkbox" className="sr-only" checked={rememberGlobalWarning} onChange={(e) => setRememberGlobalWarning(e.target.checked)} />
                                <div className={`w-4 h-4 border-2 flex-shrink-0 transition-colors ${rememberGlobalWarning ? 'bg-pulse-500 border-pulse-400' : 'bg-transparent border-zinc-700'}`} />
                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 group-hover:text-white italic">Acknowledge_Risk</span>
                            </label>
                        </div>
                        <footer className="p-4 bg-zinc-300 border-t-2 border-black flex gap-3">
                            <button onClick={() => setPendingCategory(null)} className="flex-1 py-3 bg-zinc-100 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-400 text-[10px] font-black uppercase italic text-zinc-600 active:bg-zinc-200">Abort</button>
                            <button onClick={() => { onSelectCategory(pendingCategory); setPendingCategory(null); }} className="flex-1 py-3 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 text-[10px] font-black uppercase italic text-black hover:bg-white active:bg-zinc-400">Establish</button>
                        </footer>
                    </div>
                </div>
            )}
        </main>
    );
};

const Header: React.FC<any> = ({ onSearchSubmit, searchQuery, setSearchQuery, onOpenSidebar, theme, onToggleTheme, uptime, cacheCount, isSniffing, onSniff, onOpenSearchExplainer, onOpenIntegrityBriefing, onRefresh }) => {
    const isUrl = useMemo(() => /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/.test(searchQuery), [searchQuery]);

    return (
        <header className="fixed top-0 left-0 right-0 z-30 h-[calc(4.5rem+var(--safe-top))] md:h-[calc(6rem+var(--safe-top))] landscape:h-[calc(4rem+var(--safe-top))] transition-all">
            <div className="w-full h-full bg-void-950/80 backdrop-blur-2xl border-b-2 border-white/5 flex items-center justify-between px-4 md:px-12 shadow-2xl pt-[var(--safe-top)]">
                <button onClick={onOpenSidebar} className="p-3 bg-zinc-900 border-2 border-zinc-800 rounded-xl text-pulse-500 hover:text-white hover:border-pulse-500 transition-all flex-shrink-0 active:scale-95"><MenuIcon className="w-7 h-7" /></button>
                <div className="flex-grow flex flex-col items-center mx-4 md:mx-20 max-w-2xl relative">
                    <form onSubmit={onSearchSubmit} className="relative w-full mb-3 md:mb-5 group">
                        <div className={`absolute top-1/2 left-4 -translate-y-1/2 transition-colors duration-300 ${isSniffing ? 'text-emerald-500' : 'text-zinc-700'}`}>
                            {isSniffing ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <SearchIcon className="w-5 h-5" />}
                        </div>
                        <Tooltip text="Scan for keywords or probe node URL." position="bottom">
                            <input 
                                type="search" 
                                placeholder="Probe Frequency..." 
                                value={searchQuery} 
                                onFocus={onOpenSearchExplainer}
                                onChange={e => setSearchQuery(e.target.value)} 
                                className={`w-full bg-black border-2 rounded-lg py-3.5 md:py-4.5 pl-14 pr-16 text-[11px] md:text-sm font-mono uppercase tracking-[0.2em] outline-none shadow-inner transition-all ${isUrl ? 'border-emerald-500/40 text-emerald-400' : 'border-zinc-800 focus:border-pulse-500 text-white'}`} 
                            />
                        </Tooltip>
                        {isUrl && !isSniffing && (
                            <button type="button" onClick={onSniff} className="absolute top-1/2 right-2 -translate-y-1/2 bg-emerald-600 text-white font-black uppercase italic text-[8px] px-3 py-1.5 shadow-lg border border-white/20 active:scale-95">Probe</button>
                        )}
                    </form>
                    <div className="w-full px-2">
                        <EnergyScope value={uptime} onClick={() => onOpenIntegrityBriefing()} />
                    </div>
                </div>
                <div className="flex items-center gap-4 md:gap-6 flex-shrink-0">
                    <button onClick={onRefresh} className="p-2 text-zinc-600 hover:text-white transition-all active:rotate-180 duration-500"><ArrowPathIcon className="w-6 h-6" /></button>
                    <button onClick={onToggleTheme} className="p-2 text-zinc-600 hover:text-white transition-all active:scale-90">{theme === 'dark' ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}</button>
                </div>
            </div>
        </header>
    );
};

const UnreadFilterToggle: React.FC<any> = ({ checked, onChange }) => (
    <label className="flex items-center cursor-pointer group bg-zinc-900 px-4 py-2 border-2 border-zinc-800 hover:border-emerald-500 transition-all shadow-lg rounded-sm active:scale-95">
        <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className={`w-3.5 h-3.5 border-2 flex-shrink-0 mr-3 transition-all ${checked ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_10px_#10b981]' : 'bg-transparent border-zinc-700'}`} />
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 group-hover:text-white font-mono italic leading-none">Filter_Unread</span>
    </label>
);

export default MainContent;