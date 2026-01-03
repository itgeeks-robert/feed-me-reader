
import React, { useState, useEffect, useMemo } from 'react';
import type { Feed, Folder, Selection, WidgetSettings, Article, ArticleView, Theme } from '../src/App';
import type { SourceType } from './AddSource';
import { MenuIcon, SearchIcon, SunIcon, MoonIcon, GlobeAltIcon, CpuChipIcon, BeakerIcon, ChartBarIcon, FlagIcon, FireIcon, ControllerIcon, XIcon, ExclamationTriangleIcon, ArrowPathIcon, RadioIcon, VoidIcon, ShieldCheckIcon, ContrastIcon, WandIcon, PaletteIcon, SkinsIcon, StyleIcon } from './icons';
import { resilientFetch } from '../services/fetch';
import { parseRssXml } from '../services/rssParser';
import FeaturedStory from './articles/FeaturedStory';
import MagazineArticleListItem from './articles/MagazineArticleListItem';
import { getCacheCount } from '../services/cacheService';
import FeedOnboarding, { PRESETS, Category } from './FeedOnboarding';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { discoverFeedSignals } from '../services/feedDiscoveryService';
import Tooltip from './Tooltip';
import ContextualIntel from './ContextualIntel';

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
    initialArticles?: Article[];
    onSetSniffErrorModal: (show: boolean) => void;
    onOpenSearchExplainer?: () => void;
    onOpenIntegrityBriefing?: () => void;
}

const ThemeIcon: React.FC<{ className?: string }> = ({ className }) => {
    return <PaletteIcon className={className} />;
};

const ARTICLES_PER_PAGE = 25;
const LOAD_MORE_BATCH = 15;

const CATEGORY_MAP = [
    { id: 'NEWS' },
    { id: 'TECH' },
    { id: 'SCIENCE' },
    { id: 'FINANCE' },
    { id: 'SPORTS' },
    { id: 'CULTURE' },
    { id: 'GAMING' }
];

const MainContent: React.FC<MainContentProps> = (props) => {
    const { selection, onSelectCategory, readArticleIds, bookmarkedArticleIds, onMarkAsRead, onPurgeBuffer, onSearch, onOpenReader, onOpenExternal, refreshKey, onOpenSidebar, theme, onToggleTheme, animationClass, pageTitle, allFeeds, onSetFeeds, onSetFolders, initialArticles, onAddSource, onRefresh, onSetSniffErrorModal, onOpenSearchExplainer, onOpenIntegrityBriefing } = props;
    
    const [articles, setArticles] = useState<Article[]>(initialArticles || []);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [visibleCount, setVisibleCount] = useState(ARTICLES_PER_PAGE);
    const [showOnlyUnread, setShowOnlyUnread] = useState(false);
    const [pendingCategory, setPendingCategory] = useState<string | null>(null);
    const [isSniffing, setIsSniffing] = useState(false);
    const [rememberGlobalWarning, setRememberGlobalWarning] = useLocalStorage<boolean>('void_remember_global_warning', false);
    
    useEffect(() => { getCacheCount(); }, [refreshKey]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') onRefresh();
        }, 60000);
        return () => clearInterval(interval);
    }, [onRefresh]);

    const activeFeeds = useMemo(() => {
        if (!selection.category) return allFeeds;
        if (selection.category === 'GLOBAL_SYNC') {
            const presetsAsFeeds = PRESETS.map(p => ({
                id: Math.random(), url: p.url, title: p.title, iconUrl: '', folderId: null, category: p.category
            }));
            return [...allFeeds, ...presetsAsFeeds];
        }
        const presets = PRESETS.filter(p => p.category === selection.category);
        return presets.map(p => ({
            id: Math.random(), url: p.url, title: p.title, iconUrl: '', folderId: null, category: p.category
        }));
    }, [selection.category, allFeeds]);

    useEffect(() => {
        if (initialArticles && initialArticles.length > 0 && !selection.category && articles.length === initialArticles.length && refreshKey === 0) return;
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
        if (selection.type === 'bookmarks') result = result.filter(a => bookmarkedArticleIds.has(a.id));
        else if (selection.type === 'search' && selection.query) {
             const filter = selection.query.toLowerCase();
             result = result.filter(a => a.title.toLowerCase().includes(filter) || a.snippet.toLowerCase().includes(filter) || a.source.toLowerCase().includes(filter));
        }
        if (selection.category && selection.category !== 'GLOBAL_SYNC') {
            const catLower = selection.category.toLowerCase();
            result = result.filter(a => a.feedCategory === selection.category || a.source.toLowerCase().includes(catLower));
        }
        if (showOnlyUnread) result = result.filter(a => !readArticleIds.has(a.id));
        return result;
    }, [articles, selection, bookmarkedArticleIds, showOnlyUnread, readArticleIds]);

    const unreadCount = useMemo(() => filteredArticles.filter(a => !readArticleIds.has(a.id)).length, [filteredArticles, readArticleIds]);

    const handleCategoryClick = (catId: string | null) => {
        if (!catId) { onSelectCategory(null); return; }
        if (rememberGlobalWarning) onSelectCategory(catId);
        else setPendingCategory(catId);
    };

    const handleSearchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const query = searchQuery.trim();
        if (!query) return;
        onSearch(query);
    };

    if (allFeeds.length === 0 && selection.type === 'all' && onSetFeeds && onSetFolders) {
        return (
            <main className={`flex-grow overflow-y-auto scrollbar-hide ${animationClass} bg-void-bg pb-40 pt-2`}>
                <Header onSearchSubmit={handleSearchSubmit} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onOpenSidebar={onOpenSidebar} theme={theme} onToggleTheme={onToggleTheme} isSniffing={isSniffing} onOpenSearchExplainer={onOpenSearchExplainer} onOpenIntegrityBriefing={onOpenIntegrityBriefing} onRefresh={onRefresh} selection={selection} handleCategoryClick={handleCategoryClick} />
                <div className="pt-[calc(9rem+var(--safe-top))] md:pt-[calc(11rem+var(--safe-top))]">
                    <FeedOnboarding onComplete={(f, fld) => { onSetFolders(fld); onSetFeeds(f); }} />
                </div>
            </main>
        );
    }

    const latestArticle = filteredArticles.length > 0 ? filteredArticles[0] : null;
    const articlesToDisplay = filteredArticles.slice(1);
    const visibleArticlesToDisplay = articlesToDisplay.slice(0, visibleCount - 1);

    return (
        <main className={`flex-grow overflow-y-auto scrollbar-hide ${animationClass} bg-void-bg pb-[calc(10rem+var(--safe-bottom))] md:pb-32 scroll-smooth pt-2`}>
            <ContextualIntel 
                tipId="main_intel" 
                title="Intel Acquisition" 
                content="Welcome to the core loop. Use the category tabs to filter by sector. The 'Signal Output' below shows live decrypted packets from your nodes." 
            />
            <Header onSearchSubmit={handleSearchSubmit} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onOpenSidebar={onOpenSidebar} theme={theme} onToggleTheme={onToggleTheme} isSniffing={isSniffing} onOpenSearchExplainer={onOpenSearchExplainer} onOpenIntegrityBriefing={onOpenIntegrityBriefing} onRefresh={onRefresh} selection={selection} handleCategoryClick={handleCategoryClick} />
            
            <div className="px-4 md:px-12 pt-[calc(9.5rem+var(--safe-top))] md:pt-[calc(11rem+var(--safe-top))] max-w-[1800px] mx-auto transition-all relative">
                 <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-void-border mb-10">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black text-terminal italic uppercase tracking-tighter leading-none">
                            {selection.category === 'GLOBAL_SYNC' ? 'Global Uplink' : pageTitle}
                        </h1>
                        <div className="flex items-center gap-3 mt-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[9px] font-black text-muted uppercase tracking-[0.4em] font-mono italic">
                                {loading ? 'Acquiring_Data...' : `${unreadCount} Active_Packets_Detected`}
                            </p>
                        </div>
                    </div>
                    {unreadCount > 5 && (
                        <button onClick={() => onPurgeBuffer(filteredArticles.map(a => a.id))} className="px-5 py-2 void-card bg-void-bg text-pulse-500 font-black uppercase italic text-[8px] tracking-[0.2em] transition-all active:scale-95">Purge_Log</button>
                    )}
                </div>
                
                {latestArticle && !selection.category && (
                    <div className="mb-12">
                        <FeaturedStory article={latestArticle} onReadHere={() => onOpenReader(latestArticle)} onReadExternal={() => onOpenExternal(latestArticle.link, latestArticle.id)} isRead={readArticleIds.has(latestArticle.id)} />
                    </div>
                )}
                
                <div className="mt-12">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-6 border-l-[3px] border-emerald-500 pl-6">
                            <h2 className="font-black text-xl md:text-3xl text-terminal italic uppercase tracking-tighter">Signal Output</h2>
                        </div>
                        <UnreadFilterToggle checked={showOnlyUnread} onChange={setShowOnlyUnread} />
                    </div>

                    {loading && filteredArticles.length === 0 ? (
                        <div className="text-center py-32 flex flex-col items-center gap-8">
                            <div className="w-12 h-12 border-2 border-pulse-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-pulse-500 font-black font-mono text-[9px] uppercase tracking-[0.6em] animate-pulse italic">Interrogating_Network...</span>
                        </div>
                    ) : filteredArticles.length === 0 ? (
                        <div className="text-center py-24 void-card border-dashed">
                            <ExclamationTriangleIcon className="w-12 h-12 text-muted mx-auto mb-6" />
                            <h3 className="text-2xl font-black text-muted uppercase italic mb-3 tracking-tighter">No Response</h3>
                            <p className="text-[9px] text-muted uppercase tracking-[0.3em] mb-8 font-mono italic leading-loose">Channel silent for requested node:<br/>"{selection.query || 'active_sector'}"</p>
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
                            <button 
                                onClick={() => setVisibleCount(c => c + LOAD_MORE_BATCH)} 
                                className="bg-terminal text-void-bg void-button font-black uppercase italic py-5 px-14 transition-all hover:scale-105 text-[11px] tracking-[0.2em] active:scale-95 border border-void-border shadow-2xl"
                            >
                                Load Additional Clusters
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {pendingCategory && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[100] flex items-center justify-center p-6 font-mono animate-fade-in">
                    <div className="void-card w-full max-w-md relative overflow-hidden flex flex-col">
                        <header className="h-10 bg-zinc-800 flex items-center justify-between px-4 border-b border-black">
                            <div className="flex items-center gap-2">
                                <RadioIcon className="w-4 h-4 text-white" />
                                <h2 className="text-white text-[9px] font-black uppercase tracking-[0.2em] italic">UPLINK_STATION.EXE</h2>
                            </div>
                        </header>
                        <div className="p-10 text-center space-y-8">
                            <h3 className="text-lg font-black text-terminal italic uppercase tracking-tighter">Authorize Mass Sync?</h3>
                            <p className="text-[10px] text-muted leading-relaxed uppercase tracking-widest italic px-4">Establishing a link with <span className="text-pulse-500 font-black">ALL {pendingCategory} NODES</span>.</p>
                        </div>
                        <footer className="p-4 bg-zinc-300 flex gap-3">
                            <button onClick={() => setPendingCategory(null)} className="flex-1 py-3 bg-zinc-100 rounded-xl text-[9px] font-black uppercase italic text-zinc-600">Cancel</button>
                            <button onClick={() => { onSelectCategory(pendingCategory); setPendingCategory(null); }} className="flex-1 py-3 bg-zinc-950 rounded-xl text-[9px] font-black uppercase italic text-white">Authorize</button>
                        </footer>
                    </div>
                </div>
            )}
        </main>
    );
};

const Header: React.FC<any> = ({ onSearchSubmit, searchQuery, setSearchQuery, onOpenSidebar, theme, onToggleTheme, isSniffing, onOpenSearchExplainer, onOpenIntegrityBriefing, onRefresh, selection, handleCategoryClick }) => {
    return (
        <header className="fixed top-0 left-0 right-0 z-40 px-4 md:px-12 pt-[var(--safe-top)] pb-2 transition-all">
            <div className="max-w-[1800px] mx-auto void-card mt-4 overflow-hidden relative">
                <div className="flex items-center justify-between px-4 md:px-8 py-3.5 gap-4">
                    <button onClick={onOpenSidebar} className="p-3 bg-void-bg/50 rounded-2xl text-pulse-500 border border-void-border active:scale-90 transition-transform"><MenuIcon className="w-6 h-6" /></button>
                    <div className="flex-grow flex flex-col items-center max-w-2xl relative">
                        <form onSubmit={onSearchSubmit} className="relative w-full group">
                            <SearchIcon className="absolute top-1/2 left-5 -translate-y-1/2 w-4 h-4 text-muted" />
                            <input 
                                type="search" 
                                placeholder="Probe Network..." 
                                value={searchQuery} 
                                onFocus={onOpenSearchExplainer}
                                onChange={e => setSearchQuery(e.target.value)} 
                                className="w-full bg-void-bg/60 border border-void-border rounded-full py-3.5 pl-14 pr-20 text-[10px] md:text-xs font-mono uppercase tracking-[0.2em] outline-none text-terminal placeholder-muted focus:border-pulse-500/50 transition-all" 
                            />
                            <button type="button" onClick={onRefresh} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-muted hover:text-terminal transition-all active:rotate-180 duration-500"><ArrowPathIcon className="w-5 h-5" /></button>
                        </form>
                    </div>
                    <button onClick={onToggleTheme} className="p-3 bg-void-bg/50 rounded-2xl text-muted border border-void-border active:scale-90 transition-transform hover:text-pulse-500">
                        <ThemeIcon className="w-6 h-6" />
                    </button>
                </div>
                <nav className="flex items-center h-12 md:h-14 border-t border-void-border px-6 md:px-12 gap-3 overflow-x-auto scrollbar-hide">
                    <button onClick={() => handleCategoryClick(null)} className={`shrink-0 flex items-center px-5 py-2 rounded-full text-[8px] font-black uppercase italic transition-all ${!selection.category ? 'bg-pulse-500 text-white shadow-lg' : 'text-muted hover:text-terminal'}`}>
                        <span>Core_Signal</span>
                    </button>
                    {CATEGORY_MAP.map(cat => (
                        <button key={cat.id} onClick={() => handleCategoryClick(cat.id)} className={`shrink-0 flex items-center px-5 py-2 rounded-full text-[8px] font-black uppercase italic transition-all ${selection.category === cat.id ? 'bg-pulse-500 text-white shadow-lg' : 'text-muted hover:text-terminal'}`}>
                            <span>{cat.id}</span>
                        </button>
                    ))}
                </nav>
            </div>
        </header>
    );
};

const UnreadFilterToggle: React.FC<any> = ({ checked, onChange }) => (
    <label className="flex items-center cursor-pointer group bg-void-bg/50 px-5 py-2 border border-void-border rounded-full hover:border-terminal/20 transition-all">
        <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className={`w-3 h-3 border rounded-sm flex-shrink-0 mr-3 transition-all ${checked ? 'bg-pulse-500 border-pulse-400' : 'bg-transparent border-muted'}`} />
        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted group-hover:text-terminal font-mono italic leading-none">Unread_Only</span>
    </label>
);

export default MainContent;
