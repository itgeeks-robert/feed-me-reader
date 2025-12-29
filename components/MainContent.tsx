import React, { useState, useEffect, useMemo } from 'react';
import type { Feed, Folder, Selection, WidgetSettings, Article, ArticleView, Theme } from '../src/App';
import type { SourceType } from './AddSource';
import { MenuIcon, SearchIcon, SunIcon, MoonIcon, GlobeAltIcon, CpuChipIcon, BeakerIcon, ChartBarIcon, FlagIcon, FireIcon, ControllerIcon, XIcon, ExclamationTriangleIcon } from './icons';
import { resilientFetch } from '../services/fetch';
import { parseRssXml } from '../services/rssParser';
import FeaturedStory from './articles/FeaturedStory';
import MagazineArticleListItem from './articles/MagazineArticleListItem';
import { getCacheCount } from '../services/cacheService';
import FeedOnboarding, { PRESETS, Category } from './FeedOnboarding';
import { useLocalStorage } from '../hooks/useLocalStorage';

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

const EnergyScope: React.FC<{ value: number }> = ({ value }) => (
    <div className="w-full flex flex-col gap-1">
        <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-pulse-500 uppercase tracking-tighter italic">System Integrity</span>
            <span className="text-[10px] font-black text-pulse-500 uppercase tracking-tighter italic">{value}%</span>
        </div>
        <div className="w-full h-1.5 bg-void-950 border border-pulse-500/20 rounded-full overflow-hidden relative">
            <div className="h-full bg-pulse-500 shadow-[0_0_10px_#e11d48] transition-all duration-1000" style={{ width: `${value}%` }} />
        </div>
    </div>
);

const MainContent: React.FC<MainContentProps> = (props) => {
    const { selection, onSelectCategory, readArticleIds, bookmarkedArticleIds, onMarkAsRead, onPurgeBuffer, onSearch, onOpenReader, refreshKey, onOpenSidebar, theme, onToggleTheme, animationClass, pageTitle, uptime, allFeeds, onSetFeeds, onSetFolders } = props;
    
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [visibleCount, setVisibleCount] = useState(ARTICLES_PER_PAGE);
    const [showOnlyUnread, setShowOnlyUnread] = useState(false);
    const [cacheCount, setCacheCount] = useState(0);
    const [pendingCategory, setPendingCategory] = useState<string | null>(null);
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
    }, [activeFeeds, refreshKey]);

    const filteredArticles = useMemo(() => {
        let result = articles;
        if (selection.type === 'bookmarks') {
            result = result.filter(a => bookmarkedArticleIds.has(a.id));
        } else if (selection.type === 'search' && selection.query) {
             const filter = selection.query.toLowerCase();
             result = result.filter(a => a.title.toLowerCase().includes(filter) || a.snippet.toLowerCase().includes(filter));
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

    if (allFeeds.length === 0 && selection.type === 'all' && onSetFeeds && onSetFolders) {
        return (
            <main className={`flex-grow overflow-y-auto scrollbar-hide ${animationClass} bg-void-950 pb-40 pt-32`}>
                <Header onSearchSubmit={() => onSearch(searchQuery)} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onOpenSidebar={onOpenSidebar} theme={theme} onToggleTheme={onToggleTheme} uptime={uptime} cacheCount={cacheCount} />
                <FeedOnboarding onComplete={(f, fld) => { onSetFolders(fld); onSetFeeds(f); }} />
            </main>
        );
    }

    const latestArticle = filteredArticles.length > 0 ? filteredArticles[0] : null;
    const articlesToDisplay = filteredArticles.slice(1);
    const visibleArticlesToDisplay = articlesToDisplay.slice(0, visibleCount - 1);

    return (
        <main className={`flex-grow overflow-y-auto scrollbar-hide ${animationClass} bg-void-950 pb-40 scroll-smooth`}>
            <Header onSearchSubmit={(e: any) => { e.preventDefault(); onSearch(searchQuery); }} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onOpenSidebar={onOpenSidebar} theme={theme} onToggleTheme={onToggleTheme} uptime={uptime} cacheCount={cacheCount} />
            
            <nav className="fixed top-[calc(4rem+env(safe-area-inset-top))] md:top-[calc(6rem+env(safe-area-inset-top))] left-0 right-0 z-20 bg-void-900/80 backdrop-blur-md border-b border-pulse-500/10 flex items-center h-12 md:h-14 overflow-x-auto scrollbar-hide px-4 md:px-12 gap-2">
                <button onClick={() => onSelectCategory(null)} className={`shrink-0 px-4 py-1.5 rounded-full text-[9px] font-black uppercase italic transition-all border ${!selection.category ? 'bg-pulse-500 border-pulse-400 text-white shadow-lg' : 'bg-void-950 border-zinc-800 text-zinc-500 hover:text-terminal'}`}>YOUR_SIGS</button>
                {CATEGORY_MAP.map(cat => (
                    <button key={cat.id} onClick={() => handleCategoryClick(cat.id)} className={`shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase italic transition-all border ${selection.category === cat.id ? 'bg-pulse-500 border-pulse-400 text-white shadow-lg' : 'bg-void-950 border-zinc-800 text-zinc-500 hover:text-terminal'}`}>{cat.icon}<span>{cat.id}</span></button>
                ))}
            </nav>

            <div className="px-4 md:px-8 pt-44 md:pt-60 max-w-[1800px] mx-auto">
                 <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b-2 border-pulse-500/10 mb-8">
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-terminal italic glitch-text uppercase tracking-widest">{pageTitle}</h1>
                        <p className="text-[10px] md:text-xs font-black text-zinc-600 uppercase tracking-[0.4em] mt-2 font-mono">{unreadCount} SIGS DETECTED</p>
                    </div>
                    {unreadCount > 5 && (
                        <button onClick={() => onPurgeBuffer(filteredArticles.map(a => a.id))} className="px-6 py-2.5 bg-void-900 border border-pulse-500 text-pulse-500 hover:bg-pulse-500 hover:text-white font-black uppercase italic text-xs transition-all shadow-[4px_4px_0px_#e11d48]">Clear Frequency</button>
                    )}
                </div>
                
                {latestArticle && !selection.category && (
                    <div className="mb-12">
                        <FeaturedStory article={latestArticle} onReadHere={() => onOpenReader(latestArticle)} onMarkAsRead={() => onMarkAsRead(latestArticle.id)} isRead={readArticleIds.has(latestArticle.id)} />
                    </div>
                )}
                
                <div className="mt-8">
                    <div className="flex items-center gap-6 mb-10 border-l-4 border-pulse-500 pl-6">
                        <h2 className="font-black text-xl md:text-2xl text-terminal italic uppercase tracking-tighter">Live Transmissions</h2>
                        <UnreadFilterToggle checked={showOnlyUnread} onChange={setShowOnlyUnread} />
                    </div>

                    {loading && filteredArticles.length === 0 ? (
                        <div className="text-center py-20 flex flex-col items-center gap-4"><div className="w-10 h-10 border-t-2 border-pulse-500 rounded-full animate-spin"></div><span className="text-pulse-500 font-mono text-xs uppercase tracking-widest animate-pulse">Decrypting Signal...</span></div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
                            {visibleArticlesToDisplay.map(article => (
                                <MagazineArticleListItem key={article.id} article={article} onMarkAsRead={() => onMarkAsRead(article.id)} onReadHere={() => onOpenReader(article)} isRead={readArticleIds.has(article.id)} />
                            ))}
                        </div>
                    )}

                    {articlesToDisplay.length > visibleArticlesToDisplay.length && (
                        <div className="mt-16 text-center pb-24">
                            <button onClick={() => setVisibleCount(c => c + LOAD_MORE_BATCH)} className="bg-void-950 border-2 border-pulse-500 text-pulse-500 hover:bg-pulse-500 hover:text-white font-black uppercase italic py-4 px-12 transition-all shadow-[6px_6px_0px_#e11d48] text-sm md:text-base">Decode {LOAD_MORE_BATCH} More</button>
                        </div>
                    )}
                </div>
            </div>

            {pendingCategory && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 font-mono">
                    <div className="bg-zinc-900 border-4 border-zinc-800 shadow-2xl w-full max-w-md relative overflow-hidden flex flex-col">
                        <div className="absolute inset-0 border-t-2 border-l-2 border-zinc-700 pointer-events-none z-10" />
                        <div className="absolute inset-0 border-b-2 border-r-2 border-black pointer-events-none z-10" />
                        
                        <header className="h-10 bg-zinc-800 flex items-center justify-between px-1 relative z-20 border-b-2 border-black">
                            <div className="flex items-center gap-2 h-full">
                                <div className="w-8 h-7 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center">
                                   <div className="w-4 h-1 bg-black shadow-[0_4px_0_black]" />
                                </div>
                                <h2 className="text-white text-[11px] font-black uppercase tracking-[0.2em] italic px-2">SYST_WARNING.EXE</h2>
                            </div>
                            <button onClick={() => setPendingCategory(null)} className="w-8 h-7 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center active:bg-zinc-400">
                                <XIcon className="w-4 h-4 text-black" />
                            </button>
                        </header>

                        <div className="p-8 bg-void-950 text-center space-y-6">
                            <div className="mx-auto w-16 h-16 bg-pulse-500/10 rounded-full flex items-center justify-center border-2 border-pulse-500 animate-pulse">
                                <ExclamationTriangleIcon className="w-8 h-8 text-pulse-500" />
                            </div>
                            <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Mass Signal Establishment</h3>
                            <p className="text-[10px] text-zinc-500 leading-relaxed uppercase tracking-widest">establishing a link to <span className="text-pulse-500 font-black">ALL GLOBAL {pendingCategory} NODES</span> concurrently may result in system lag, packet loss, or high bandwidth consumption. establish link?</p>
                            
                            <label className="flex items-center justify-center gap-3 cursor-pointer group pt-4">
                                <input 
                                    type="checkbox" 
                                    className="sr-only" 
                                    checked={rememberGlobalWarning}
                                    onChange={(e) => setRememberGlobalWarning(e.target.checked)}
                                />
                                <div className={`w-4 h-4 border-2 flex-shrink-0 transition-colors ${rememberGlobalWarning ? 'bg-pulse-500 border-pulse-400 shadow-[0_0_8px_#e11d48]' : 'bg-transparent border-zinc-700'}`} />
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

const Header: React.FC<any> = ({ onSearchSubmit, searchQuery, setSearchQuery, onOpenSidebar, theme, onToggleTheme, uptime, cacheCount }) => (
    <header className="fixed top-[env(safe-area-inset-top)] left-0 right-0 z-30 h-16 md:h-24 transition-colors">
        <div className="w-full h-full bg-void-950/90 backdrop-blur-xl border-b border-pulse-500/30 flex items-center justify-between px-4 md:px-10 shadow-2xl">
            <button onClick={onOpenSidebar} className="p-2 text-pulse-500 transition-all flex-shrink-0"><MenuIcon className="w-7 h-7 md:w-9 md:h-9" /></button>
            <div className="flex-grow flex flex-col items-center mx-3 md:mx-12 max-w-2xl">
                <form onSubmit={onSearchSubmit} className="relative w-full mb-2 md:mb-3">
                    <SearchIcon className="w-5 h-5 text-zinc-700 absolute top-1/2 left-4 md:left-6 -translate-y-1/2" />
                    <input type="search" placeholder="Scan Frequencies..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-void-900 border border-zinc-800 focus:border-pulse-500 placeholder-zinc-700 text-terminal rounded-none py-2 md:py-3 pl-10 md:pl-14 pr-4 text-xs md:text-sm font-mono uppercase tracking-widest outline-none" />
                </form>
                <div className="w-full px-1 md:px-6"><EnergyScope value={uptime} /></div>
            </div>
            <div className="flex items-center gap-4 md:gap-10 flex-shrink-0">
                <div className="hidden lg:flex flex-col items-end"><span className="text-[10px] font-black text-zinc-600 uppercase tracking-tighter italic">Data Cache</span><span className="text-xs font-black text-pulse-500 uppercase tracking-tighter italic">{cacheCount} SIGS</span></div>
                <button onClick={onToggleTheme} className="p-2 text-pulse-500 hover:text-terminal transition-all">{theme === 'dark' ? <SunIcon className="w-6 h-6 md:w-8 md:h-8" /> : <MoonIcon className="w-6 h-6 md:w-8 md:h-8" />}</button>
            </div>
        </div>
    </header>
);

const UnreadFilterToggle: React.FC<any> = ({ checked, onChange }) => (
    <label className="flex items-center cursor-pointer group bg-void-900 px-4 py-2 border border-zinc-800 transition-all hover:border-pulse-500">
        <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className={`w-4 h-4 border-2 flex-shrink-0 mr-3 transition-colors ${checked ? 'bg-pulse-500 border-pulse-400 shadow-[0_0_8px_#e11d48]' : 'bg-transparent border-zinc-700'}`} />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 group-hover:text-terminal font-mono italic">Unread</span>
    </label>
);

export default MainContent;