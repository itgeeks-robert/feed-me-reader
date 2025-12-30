
import React, { useState, useEffect, useMemo } from 'react';
import type { Feed, Folder, Selection, WidgetSettings, Article, ArticleView, Theme } from '../src/App';
import type { SourceType } from './AddSource';
import { MenuIcon, SearchIcon, SunIcon, MoonIcon, GlobeAltIcon, CpuChipIcon, BeakerIcon, ChartBarIcon, FlagIcon, FireIcon, ControllerIcon, XIcon, ExclamationTriangleIcon, ArrowPathIcon, RadioIcon, VoidIcon } from './icons';
import { resilientFetch } from '../services/fetch';
import { parseRssXml } from '../services/rssParser';
import FeaturedStory from './articles/FeaturedStory';
import MagazineArticleListItem from './articles/MagazineArticleListItem';
import { getCacheCount } from '../services/cacheService';
import FeedOnboarding, { PRESETS, Category } from './FeedOnboarding';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { discoverFeedSignals } from '../services/feedDiscoveryService';

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
    { id: 'NEWS', icon: <GlobeAltIcon className="w-3.5 h-3.5" /> },
    { id: 'TECH', icon: <CpuChipIcon className="w-3.5 h-3.5" /> },
    { id: 'SCIENCE', icon: <BeakerIcon className="w-3.5 h-3.5" /> },
    { id: 'FINANCE', icon: <ChartBarIcon className="w-3.5 h-3.5" /> },
    { id: 'SPORTS', icon: <FlagIcon className="w-3.5 h-3.5" /> },
    { id: 'CULTURE', icon: <FireIcon className="w-3.5 h-3.5" /> },
    { id: 'GAMING', icon: <ControllerIcon className="w-3.5 h-3.5" /> }
];

const EnergyScope: React.FC<{ value: number, onClick?: () => void }> = ({ value, onClick }) => (
    <div className="w-full flex flex-col gap-1.5 cursor-help group" onClick={onClick}>
        <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-pulse-600 dark:text-pulse-500 uppercase tracking-tighter italic leading-none group-hover:text-terminal transition-colors">System Integrity</span>
            <span className="text-[10px] font-black text-pulse-600 dark:text-pulse-500 uppercase tracking-tighter italic leading-none">{value}%</span>
        </div>
        <div className="w-full h-1.5 bg-void-950 border border-pulse-500/20 rounded-full overflow-hidden relative">
            <div className="h-full bg-pulse-500 shadow-[0_0_10px_#e11d48] transition-all duration-1000" style={{ width: `${value}%` }} />
        </div>
    </div>
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

    const activeFeeds = useMemo(() => {
        if (!selection.category) return allFeeds;
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
        if (initialArticles && initialArticles.length > 0 && !selection.category && articles.length === initialArticles.length) {
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
        
        if (selection.category) {
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

    const handleCategoryClick = (catId: string) => {
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
            />
            
            <nav className="fixed top-[calc(4.5rem+var(--safe-top))] md:top-[calc(6rem+var(--safe-top))] landscape:top-[calc(4rem+var(--safe-top))] left-0 right-0 z-20 bg-void-900/90 backdrop-blur-md border-b border-zinc-300 dark:border-white/5 flex items-center h-12 landscape:h-10 overflow-x-auto scrollbar-hide px-4 md:px-12 gap-2.5 shadow-xl transition-all">
                <button onClick={() => onSelectCategory(null)} className={`shrink-0 px-4 py-1.5 landscape:py-1 rounded-full text-[9px] landscape:text-[8px] font-black uppercase italic transition-all border ${!selection.category ? 'bg-pulse-500 border-pulse-400 text-white shadow-lg shadow-pulse-500/20' : 'bg-void-950 border-zinc-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400 hover:text-terminal'}`}>ALL_INTEL</button>
                {CATEGORY_MAP.map(cat => (
                    <button key={cat.id} onClick={() => handleCategoryClick(cat.id)} className={`shrink-0 flex items-center gap-2 px-4 py-1.5 landscape:py-1 rounded-full text-[9px] landscape:text-[8px] font-black uppercase italic transition-all border ${selection.category === cat.id ? 'bg-pulse-500 border-pulse-400 text-white shadow-lg shadow-pulse-500/20' : 'bg-void-950 border-zinc-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400 hover:text-terminal'}`}>{cat.icon}<span>{cat.id}</span></button>
                ))}
            </nav>

            <div className="px-4 md:px-8 pt-[calc(9rem+var(--safe-top))] md:pt-[calc(11rem+var(--safe-top))] landscape:pt-[calc(8rem+var(--safe-top))] max-w-[1800px] mx-auto transition-all">
                 <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-5 border-b border-pulse-500/20 mb-8">
                    <div>
                        <h1 className="text-2xl md:text-4xl font-black text-terminal italic glitch-text uppercase tracking-widest leading-none">{pageTitle}</h1>
                        <p className="text-[10px] md:text-[11px] font-black text-zinc-600 dark:text-zinc-500 uppercase tracking-[0.4em] mt-3 font-mono">{unreadCount} SIGS DETECTED</p>
                    </div>
                    {unreadCount > 5 && (
                        <button onClick={() => onPurgeBuffer(filteredArticles.map(a => a.id))} className="px-5 py-2 bg-void-900 border border-pulse-500 text-pulse-600 dark:text-pulse-500 hover:bg-pulse-500 hover:text-white font-black uppercase italic text-[10px] transition-all shadow-[4px_4px_0_#e11d48] active:translate-x-1 active:translate-y-1 active:shadow-none">Clear Node</button>
                    )}
                </div>
                
                {latestArticle && !selection.category && (
                    <div className="mb-12 landscape:mb-8">
                        <FeaturedStory article={latestArticle} onReadHere={() => onOpenReader(latestArticle)} onReadExternal={() => onOpenExternal(latestArticle.link, latestArticle.id)} isRead={readArticleIds.has(latestArticle.id)} />
                    </div>
                )}
                
                <div className="mt-8 landscape:mt-6">
                    <div className="flex items-center gap-5 mb-8 landscape:mb-6 border-l-[6px] border-pulse-500 pl-5">
                        <h2 className="font-black text-xl md:text-3xl text-terminal italic uppercase tracking-tighter">Live Transmissions</h2>
                        <UnreadFilterToggle checked={showOnlyUnread} onChange={setShowOnlyUnread} />
                    </div>

                    {loading && filteredArticles.length === 0 ? (
                        <div className="text-center py-24 flex flex-col items-center gap-6"><div className="w-12 h-12 border-t-4 border-pulse-500 rounded-full animate-spin"></div><span className="text-pulse-600 dark:text-pulse-500 font-mono text-xs uppercase tracking-widest animate-pulse italic">Decrypting Frequency...</span></div>
                    ) : filteredArticles.length === 0 ? (
                        <div className="text-center py-24 border-4 border-dashed border-zinc-300 dark:border-zinc-800 rounded-[3rem] bg-void-900/20">
                            <ExclamationTriangleIcon className="w-14 h-14 text-zinc-500 dark:text-zinc-700 mx-auto mb-6" />
                            <h3 className="text-2xl font-black text-zinc-600 dark:text-zinc-700 uppercase italic mb-3 tracking-tighter">Frequency Silent</h3>
                            <p className="text-[11px] text-zinc-600 dark:text-zinc-700 uppercase tracking-widest mb-8 font-mono italic">No matches detected for "{selection.query}".</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
                            {visibleArticlesToDisplay.map(article => (
                                <MagazineArticleListItem key={article.id} article={article} onMarkAsRead={() => onMarkAsRead(article.id)} onReadHere={() => onOpenReader(article)} onReadExternal={() => onOpenExternal(article.link, article.id)} isRead={readArticleIds.has(article.id)} />
                            ))}
                        </div>
                    )}

                    {articlesToDisplay.length > visibleArticlesToDisplay.length && (
                        <div className="mt-16 text-center">
                            <button onClick={() => setVisibleCount(c => c + LOAD_MORE_BATCH)} className="bg-void-950 border-4 border-pulse-500 text-pulse-600 dark:text-pulse-500 hover:bg-pulse-500 hover:text-white font-black uppercase italic py-4 px-12 transition-all shadow-[6px_6px_0_#e11d48] text-xs active:translate-x-1 active:translate-y-1 active:shadow-none">Decode {LOAD_MORE_BATCH} More</button>
                        </div>
                    )}
                </div>
            </div>

            {pendingCategory && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6 font-mono">
                    <div className="bg-zinc-900 border-4 border-zinc-800 shadow-2xl w-full max-w-md relative overflow-hidden flex flex-col">
                        <header className="h-10 bg-zinc-800 flex items-center justify-between px-2 relative z-20 border-b-2 border-black">
                            <div className="flex items-center gap-2 h-full">
                                <div className="w-8 h-7 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center">
                                   <div className="w-4 h-1 bg-black shadow-[0_4px_0_black]" />
                                </div>
                                <h2 className="text-white text-[10px] font-black uppercase tracking-[0.2em] italic px-2">SYST_WARNING.EXE</h2>
                            </div>
                            <button onClick={() => setPendingCategory(null)} className="w-8 h-7 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center active:bg-zinc-400">
                                <XIcon className="w-4 h-4 text-black" />
                            </button>
                        </header>

                        <div className="p-8 bg-void-950 text-center space-y-6">
                            <div className="mx-auto w-16 h-16 bg-pulse-500/10 rounded-full flex items-center justify-center border-2 border-pulse-500 animate-pulse">
                                <ExclamationTriangleIcon className="w-8 h-8 text-pulse-500" />
                            </div>
                            <h3 className="text-lg font-black text-white italic uppercase tracking-tighter leading-none">Mass Signal Establishment</h3>
                            <p className="text-[10px] text-zinc-500 leading-relaxed uppercase tracking-widest">establishing a link to <span className="text-pulse-500 font-black">ALL GLOBAL {pendingCategory} NODES</span> concurrently may result in system lag. establish link?</p>
                            
                            <label className="flex items-center justify-center gap-3 cursor-pointer group pt-2">
                                <input 
                                    type="checkbox" 
                                    className="sr-only" 
                                    checked={rememberGlobalWarning}
                                    onChange={(e) => setRememberGlobalWarning(e.target.checked)}
                                />
                                <div className={`w-4 h-4 border-2 flex-shrink-0 transition-colors ${rememberGlobalWarning ? 'bg-pulse-500 border-pulse-400 shadow-[0_0_10px_#e11d48]' : 'bg-transparent border-zinc-700'}`} />
                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-terminal italic">Do not warn again</span>
                            </label>
                        </div>

                        <footer className="p-4 bg-zinc-300 border-t-2 border-black flex gap-2">
                            <button onClick={() => setPendingCategory(null)} className="flex-1 py-3 bg-zinc-100 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-400 text-[10px] font-black uppercase italic text-zinc-600 active:bg-zinc-200">ABORT</button>
                            <button onClick={() => { onSelectCategory(pendingCategory); setPendingCategory(null); }} className="flex-1 py-3 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 text-[10px] font-black uppercase italic text-black hover:bg-white active:bg-zinc-400">ESTABLISH</button>
                        </footer>
                    </div>
                </div>
            )}
        </main>
    );
};

const Header: React.FC<any> = ({ onSearchSubmit, searchQuery, setSearchQuery, onOpenSidebar, theme, onToggleTheme, uptime, cacheCount, isSniffing, onSniff, onOpenSearchExplainer, onOpenIntegrityBriefing }) => {
    const isUrl = useMemo(() => {
        return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/.test(searchQuery);
    }, [searchQuery]);

    return (
        <header className="fixed top-0 left-0 right-0 z-30 h-[calc(4.5rem+var(--safe-top))] md:h-[calc(6rem+var(--safe-top))] landscape:h-[calc(4rem+var(--safe-top))] transition-all">
            <div className="w-full h-full bg-void-950/90 backdrop-blur-xl border-b border-pulse-500/30 flex items-center justify-between px-4 md:px-12 shadow-2xl pt-[var(--safe-top)]">
                <button onClick={onOpenSidebar} className="p-2 text-pulse-600 dark:text-pulse-500 transition-all flex-shrink-0 active:scale-90"><MenuIcon className="w-7 h-7 md:w-9 md:h-9 landscape:w-7 landscape:h-7" /></button>
                <div className="flex-grow flex flex-col items-center mx-3 md:mx-16 max-w-2xl relative">
                    <form onSubmit={onSearchSubmit} className="relative w-full mb-2 md:mb-4 group">
                        <div className={`absolute top-1/2 left-3 md:left-6 -translate-y-1/2 transition-colors duration-300 ${isSniffing ? 'text-emerald-600 dark:text-emerald-500' : 'text-zinc-500 dark:text-zinc-700'}`}>
                            {isSniffing ? <ArrowPathIcon className="w-4 h-4 md:w-6 md:h-6 landscape:w-4 landscape:h-4 animate-spin" /> : <SearchIcon className="w-4 h-4 md:w-6 md:h-6 landscape:w-4 landscape:h-4" />}
                        </div>
                        
                        <input 
                            type="search" 
                            placeholder="Scan Frequencies..." 
                            value={searchQuery} 
                            onFocus={onOpenSearchExplainer}
                            onChange={e => setSearchQuery(e.target.value)} 
                            className={`w-full bg-void-900 border-2 focus:border-pulse-500 placeholder-zinc-500 dark:placeholder-zinc-700 text-terminal rounded-none py-2.5 md:py-4 landscape:py-2 pl-10 md:pl-16 landscape:pl-12 pr-16 md:pr-24 text-[10px] md:text-base landscape:text-[9px] font-mono uppercase tracking-widest outline-none shadow-inner transition-all
                                ${isUrl ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-zinc-300 dark:border-zinc-800'}`} 
                        />

                        {isUrl && !isSniffing && (
                            <button 
                                type="button"
                                onClick={onSniff}
                                className="absolute top-1/2 right-1.5 -translate-y-1/2 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase italic text-[7px] md:text-[10px] px-3 py-1.5 shadow-lg animate-fade-in border border-emerald-400/50"
                            >
                                [SNIFF]
                            </button>
                        )}
                    </form>
                    
                    <div className="w-full px-2 md:px-8 landscape:px-0">
                        <EnergyScope value={uptime} onClick={() => onOpenIntegrityBriefing()} />
                    </div>
                </div>
                <div className="flex items-center gap-3 md:gap-8 flex-shrink-0">
                    <button onClick={onToggleTheme} className="p-2 text-pulse-600 dark:text-pulse-500 hover:text-terminal transition-all active:scale-90">{theme === 'dark' ? <SunIcon className="w-6 h-6 md:w-8 md:h-8 landscape:w-6 landscape:h-6" /> : <MoonIcon className="w-6 h-6 md:w-8 md:h-8 landscape:w-6 landscape:h-6" />}</button>
                </div>
            </div>
        </header>
    );
};

const UnreadFilterToggle: React.FC<any> = ({ checked, onChange }) => (
    <label className="flex items-center cursor-pointer group bg-void-900 px-3 py-1.5 landscape:py-1 border border-zinc-300 dark:border-zinc-800 transition-all hover:border-pulse-500 shadow-sm active:scale-95">
        <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className={`w-4 h-4 landscape:w-3 landscape:h-3 border-2 flex-shrink-0 mr-3 transition-colors ${checked ? 'bg-pulse-500 border-pulse-400 shadow-[0_0_10px_#e11d48]' : 'bg-transparent border-zinc-400 dark:border-zinc-700'}`} />
        <span className="text-[10px] landscape:text-[9px] font-black uppercase tracking-[0.2em] text-zinc-700 dark:text-zinc-500 group-hover:text-terminal font-mono italic leading-none">Unread</span>
    </label>
);

export default MainContent;
