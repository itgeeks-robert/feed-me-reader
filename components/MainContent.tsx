
import React, { useState, useEffect, useMemo } from 'react';
import type { Feed, Folder, Selection, WidgetSettings, Article, ArticleView, Theme } from '../src/App';
import type { SourceType } from './AddSource';
import { MenuIcon, SearchIcon, SunIcon, MoonIcon, GlobeAltIcon, CpuChipIcon, BeakerIcon, ChartBarIcon, FlagIcon, FireIcon, ControllerIcon, XIcon, ExclamationTriangleIcon, ArrowPathIcon, RadioIcon, VoidIcon, ShieldCheckIcon, ContrastIcon, WandIcon, PaletteIcon, SkinsIcon, StyleIcon, MusicIcon, BoltIcon, ListIcon } from './icons';
import { resilientFetch } from '../services/fetch';
import { parseRssXml } from '../services/rssParser';
import FeaturedStory from './articles/FeaturedStory';
import MagazineArticleListItem from './articles/MagazineArticleListItem';
import { getCacheCount } from '../services/cacheService';
import FeedOnboarding, { PRESETS, Category } from './FeedOnboarding';
import { useLocalStorage } from '../hooks/useLocalStorage';
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
    onOpenSidebar: () => void;
    onAddSource: (url: string, type: SourceType) => Promise<void>;
    animationClass: string;
    pageTitle: string;
    initialArticles?: Article[];
    onSetSniffErrorModal: (show: boolean) => void;
    onOpenSearchExplainer?: () => void;
    onOpenIntegrityBriefing?: () => void;
    ambientEnabled: boolean;
    onToggleAmbient: () => void;
}

const ARTICLES_PER_PAGE = 25;
const LOAD_MORE_BATCH = 15;

const CATEGORY_MAP = [
    { id: 'NEWS', icon: <GlobeAltIcon className="w-4 h-4" /> },
    { id: 'TECH', icon: <CpuChipIcon className="w-4 h-4" /> },
    { id: 'SCIENCE', icon: <BeakerIcon className="w-4 h-4" /> },
    { id: 'FINANCE', icon: <ChartBarIcon className="w-4 h-4" /> },
    { id: 'SPORTS', icon: <FlagIcon className="w-4 h-4" /> },
    { id: 'CULTURE', icon: <FireIcon className="w-4 h-4" /> },
    { id: 'GAMING', icon: <ControllerIcon className="w-4 h-4" /> }
];

const MainContent: React.FC<MainContentProps> = (props) => {
    const { selection, onSelectCategory, readArticleIds, bookmarkedArticleIds, onMarkAsRead, onSearch, onOpenReader, onOpenExternal, refreshKey, onRefresh, onOpenSidebar, theme, onToggleTheme, animationClass, pageTitle, allFeeds, onSetFeeds, onSetFolders, initialArticles, onOpenSettings } = props;
    
    const [articles, setArticles] = useState<Article[]>(initialArticles || []);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [visibleCount, setVisibleCount] = useState(ARTICLES_PER_PAGE);
    const [showOnlyUnread, setShowOnlyUnread] = useState(false);

    useEffect(() => { getCacheCount(); }, [refreshKey]);

    const activeFeeds = useMemo(() => {
        if (!selection.category) return allFeeds;
        const presets = PRESETS.filter(p => p.category === selection.category);
        return presets.map(p => ({
            id: Math.random(), url: p.url, title: p.title, iconUrl: '', folderId: null, category: p.category
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
        if (selection.type === 'bookmarks') result = result.filter(a => bookmarkedArticleIds.has(a.id));
        else if (selection.type === 'search' && selection.query) {
             const filter = selection.query.toLowerCase();
             result = result.filter(a => a.title.toLowerCase().includes(filter) || a.snippet.toLowerCase().includes(filter) || a.source.toLowerCase().includes(filter));
        }
        if (selection.category) {
            const catLower = selection.category.toLowerCase();
            result = result.filter(a => a.feedCategory === selection.category || a.source.toLowerCase().includes(catLower));
        }
        if (showOnlyUnread) result = result.filter(a => !readArticleIds.has(a.id));
        return result;
    }, [articles, selection, bookmarkedArticleIds, showOnlyUnread, readArticleIds]);

    const handleCategoryClick = (catId: string | null) => {
        onSelectCategory(catId);
    };

    if (allFeeds.length === 0 && selection.type === 'all' && onSetFeeds && onSetFolders) {
        return (
            <main className={`flex-grow overflow-y-auto scrollbar-hide ${animationClass} bg-void-bg pb-40 pt-2`}>
                <Header onSearchSubmit={(e) => { e.preventDefault(); onSearch(searchQuery); }} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onOpenSidebar={onOpenSidebar} onOpenSettings={onOpenSettings} onToggleTheme={onToggleTheme} onRefresh={onRefresh} selection={selection} handleCategoryClick={handleCategoryClick} />
                <div className="pt-[calc(10rem+var(--safe-top))]">
                    <FeedOnboarding onComplete={(f, fld) => { onSetFolders(fld); onSetFeeds(f); }} />
                </div>
            </main>
        );
    }

    const latestArticle = filteredArticles.length > 0 ? filteredArticles[0] : null;
    const trendingArticles = filteredArticles.slice(1, 4);
    const rollingNews = filteredArticles.slice(4, visibleCount);

    return (
        <main className={`flex-grow overflow-y-auto scrollbar-hide ${animationClass} bg-void-bg pb-40 scroll-smooth`}>
            <Header 
                onSearchSubmit={(e) => { e.preventDefault(); onSearch(searchQuery); }} 
                searchQuery={searchQuery} 
                setSearchQuery={setSearchQuery} 
                onOpenSidebar={onOpenSidebar} 
                onOpenSettings={onOpenSettings}
                onToggleTheme={onToggleTheme}
                onRefresh={onRefresh}
                selection={selection} 
                handleCategoryClick={handleCategoryClick} 
            />
            
            <div className="pt-[calc(11rem+var(--safe-top))] md:pt-[calc(11.5rem+var(--safe-top))] max-w-[1400px] mx-auto transition-all relative">
                
                {latestArticle && (
                    <div className="px-4 md:px-6 mb-8">
                        <FeaturedStory 
                            article={latestArticle} 
                            onReadHere={() => onOpenReader(latestArticle)} 
                            onReadExternal={() => onOpenExternal(latestArticle.link, latestArticle.id)} 
                            isRead={readArticleIds.has(latestArticle.id)} 
                        />
                    </div>
                )}

                <div className="px-4 md:px-6 mb-12 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {trendingArticles.map(article => (
                        <MagazineArticleListItem 
                            key={article.id} 
                            article={article} 
                            onMarkAsRead={() => onMarkAsRead(article.id)} 
                            onReadHere={() => onOpenReader(article)} 
                            onReadExternal={() => onOpenExternal(article.link, article.id)} 
                            isRead={readArticleIds.has(article.id)} 
                        />
                    ))}
                </div>

                <div className="px-4 md:px-6 border-t border-void-border pt-10">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-pulse-500" />
                            <h2 className="font-black text-xl md:text-3xl text-terminal italic uppercase tracking-tighter">Rolling_Signals</h2>
                        </div>
                        <UnreadFilterToggle checked={showOnlyUnread} onChange={setShowOnlyUnread} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {rollingNews.map(article => (
                            <MagazineArticleListItem 
                                key={article.id} 
                                article={article} 
                                onMarkAsRead={() => onMarkAsRead(article.id)} 
                                onReadHere={() => onOpenReader(article)} 
                                onReadExternal={() => onOpenExternal(article.link, article.id)} 
                                isRead={readArticleIds.has(article.id)} 
                            />
                        ))}
                    </div>

                    {filteredArticles.length > visibleCount && (
                        <div className="mt-16 text-center">
                            <button 
                                onClick={() => setVisibleCount(c => c + LOAD_MORE_BATCH)} 
                                className="bg-terminal text-inverse void-button font-black uppercase italic py-4 px-10 text-[10px] tracking-[0.2em] active:scale-95 border border-void-border shadow-xl rounded-void"
                            >
                                Load_Additional_Clusters
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};

const Header: React.FC<any> = ({ onSearchSubmit, searchQuery, setSearchQuery, onOpenSidebar, onOpenSettings, onToggleTheme, onRefresh, selection, handleCategoryClick }) => {
    return (
        <header className="fixed top-0 left-0 right-0 z-40 bg-void-bg/95 backdrop-blur-xl border-b border-void-border transition-all">
            {/* Top Bar - High Density Squeezed Navigation with Safe Area Padding */}
            <div className="bg-black pt-[var(--safe-top)]">
                <div className="h-11 md:h-12 flex items-center px-4 md:px-8 justify-between border-b border-white/5">
                    <div className="flex items-center h-full gap-2 md:gap-4 overflow-x-auto scrollbar-hide">
                        <div className="flex items-center gap-2 shrink-0 pr-3 border-r border-white/10">
                            <VoidIcon className="w-5 h-5 text-pulse-500" />
                            <span className="text-[10px] font-black italic text-white tracking-tighter hidden sm:inline">THE VOID</span>
                        </div>
                        <nav className="flex h-full items-center gap-2 md:gap-4">
                            <HeaderNavLink active={!selection.category && selection.type === 'all'} onClick={() => handleCategoryClick(null)} label="ARCADE" icon={<RadioIcon className="w-3.5 h-3.5"/>} />
                            <HeaderNavLink active={selection.category === 'NEWS'} onClick={() => handleCategoryClick('NEWS')} label="INTEL" icon={<GlobeAltIcon className="w-3.5 h-3.5"/>} />
                            <HeaderNavLink active={selection.category === 'GAMING'} onClick={() => handleCategoryClick('GAMING')} label="PLAY" icon={<ControllerIcon className="w-3.5 h-3.5"/>} />
                            <HeaderNavLink active={false} onClick={onOpenSettings} label="TERMINAL" icon={<CpuChipIcon className="w-3.5 h-3.5"/>} />
                        </nav>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 pl-4">
                        <button onClick={onOpenSidebar} className="text-zinc-500 hover:text-white transition-colors"><MenuIcon className="w-6 h-6" /></button>
                    </div>
                </div>
            </div>

            {/* Sub-Header - Filter Chips and Condensed Actions Cluster */}
            <div className="px-4 md:px-8 py-3 flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center h-10 gap-2 overflow-x-auto scrollbar-hide flex-grow w-full md:w-auto">
                    {CATEGORY_MAP.map(cat => (
                        <button 
                            key={cat.id} 
                            onClick={() => handleCategoryClick(cat.id)} 
                            className={`shrink-0 px-4 py-1.5 rounded-full text-[9px] font-black uppercase italic transition-all border
                                ${selection.category === cat.id 
                                    ? 'bg-pulse-500 border-pulse-400 text-white' 
                                    : 'bg-void-surface border-void-border text-zinc-500 hover:text-white'}`}
                        >
                            {cat.id}
                        </button>
                    ))}
                </div>
                
                {/* Condensed Action Cluster */}
                <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
                    <form onSubmit={onSearchSubmit} className="relative flex-grow md:w-32 lg:w-44 transition-all focus-within:md:w-48 lg:focus-within:w-60">
                        <SearchIcon className="absolute top-1/2 left-3.5 -translate-y-1/2 w-3 h-3 text-zinc-500" />
                        <input 
                            type="search" 
                            placeholder="Find..." 
                            value={searchQuery} 
                            onChange={e => setSearchQuery(e.target.value)} 
                            className="w-full bg-void-surface/50 border border-void-border rounded-full py-1.5 pl-9 pr-4 text-[9px] uppercase tracking-widest outline-none text-terminal placeholder-zinc-700 focus:border-pulse-500/50 transition-all" 
                        />
                    </form>

                    <div className="flex items-center gap-1.5 bg-void-surface/30 p-1 rounded-full border border-void-border">
                        <button 
                            onClick={onRefresh}
                            className="p-2 bg-void-surface border border-void-border rounded-full text-zinc-500 hover:text-terminal hover:border-terminal/30 transition-all active:rotate-180 duration-500"
                            title="Refresh Signals"
                        >
                            <ArrowPathIcon className="w-3.5 h-3.5" />
                        </button>

                        <button 
                            onClick={onToggleTheme}
                            className="p-2 bg-void-surface border border-void-border rounded-full text-zinc-500 hover:text-pulse-500 hover:border-pulse-500/30 transition-all"
                            title="Phase Shift"
                        >
                            <PaletteIcon className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

const HeaderNavLink: React.FC<{ active: boolean; onClick: () => void; label: string; icon: React.ReactNode }> = ({ active, onClick, label, icon }) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-1.5 h-full px-2 border-b-2 transition-all relative group
            ${active ? 'border-pulse-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
    >
        <span className="scale-90">{icon}</span>
        <span className="text-[8.5px] font-black tracking-widest uppercase">{label}</span>
    </button>
);

const UnreadFilterToggle: React.FC<any> = ({ checked, onChange }) => (
    <label className="flex items-center cursor-pointer group bg-void-surface/50 px-4 py-2 border border-void-border rounded-full hover:border-terminal/20 transition-all">
        <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className={`w-3 h-3 border rounded-sm flex-shrink-0 mr-3 transition-all ${checked ? 'bg-pulse-500 border-pulse-400' : 'bg-transparent border-zinc-700'}`} />
        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-terminal italic">Unread_Only</span>
    </label>
);

export default MainContent;
