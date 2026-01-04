import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Feed, Folder, Selection, WidgetSettings, Article, ArticleView, Theme } from '../src/App';
import type { SourceType } from './AddSource';
import { SearchIcon, GlobeAltIcon, CpuChipIcon, BeakerIcon, ChartBarIcon, FlagIcon, FireIcon, ControllerIcon, ArrowPathIcon, PaletteIcon, XIcon, RadioIcon } from './icons';
import { resilientFetch } from '../services/fetch';
import { parseRssXml } from '../services/rssParser';
import FeaturedStory from './articles/FeaturedStory';
import MagazineArticleListItem from './articles/MagazineArticleListItem';
import { getCacheCount } from '../services/cacheService';
import FeedOnboarding, { PRESETS } from './FeedOnboarding';

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
    const { selection, onSelectCategory, readArticleIds, bookmarkedArticleIds, onMarkAsRead, onSearch, onOpenReader, onOpenExternal, refreshKey, onRefresh, theme, onToggleTheme, animationClass, allFeeds, onSetFeeds, onSetFolders, initialArticles } = props;
    
    const [articles, setArticles] = useState<Article[]>(initialArticles || []);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchActive, setIsSearchActive] = useState(false);
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
            <main className={`flex-grow overflow-y-auto scrollbar-hide ${animationClass} bg-void-bg pb-40`}>
                <LocalHeader onSearchSubmit={(e: any) => { e.preventDefault(); onSearch(searchQuery); setIsSearchActive(false); }} isSearchActive={isSearchActive} setIsSearchActive={setIsSearchActive} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onToggleTheme={onToggleTheme} onRefresh={onRefresh} selection={selection} handleCategoryClick={handleCategoryClick} theme={theme} />
                <div className="pt-[calc(10rem+var(--safe-top))] md:pt-[calc(11rem+var(--safe-top))]">
                    <FeedOnboarding onComplete={(f, fld) => { onSetFolders(fld); onSetFeeds(f); }} />
                </div>
            </main>
        );
    }

    const latestArticle = filteredArticles.length > 0 ? filteredArticles[0] : null;
    const trendingArticles = filteredArticles.slice(1, 4);
    const rollingNews = filteredArticles.slice(4, visibleCount);

    return (
        <main className={`flex-grow overflow-y-auto scrollbar-hide ${animationClass} bg-void-bg pb-40 scroll-smooth main-content-area`}>
            <LocalHeader 
                onSearchSubmit={(e: any) => { e.preventDefault(); onSearch(searchQuery); setIsSearchActive(false); }} 
                isSearchActive={isSearchActive}
                setIsSearchActive={setIsSearchActive}
                searchQuery={searchQuery} 
                setSearchQuery={setSearchQuery} 
                onToggleTheme={onToggleTheme}
                onRefresh={onRefresh}
                selection={selection} 
                handleCategoryClick={handleCategoryClick} 
                theme={theme}
            />
            
            <div className="pt-[calc(13.5rem+var(--safe-top))] md:pt-[calc(14.5rem+var(--safe-top))] max-w-[1400px] mx-auto transition-all relative">
                
                {latestArticle && (
                    <div className="px-4 md:px-6 mb-12">
                        <FeaturedStory 
                            article={latestArticle} 
                            onReadHere={() => onOpenReader(latestArticle)} 
                            onReadExternal={() => onOpenExternal(latestArticle.link, latestArticle.id)} 
                            isRead={readArticleIds.has(latestArticle.id)} 
                        />
                    </div>
                )}

                <div className="px-4 md:px-6 mb-16 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 article-list-grid">
                    {trendingArticles.map(article => (
                        <div key={article.id} className="void-card p-1">
                            <MagazineArticleListItem 
                                article={article} 
                                onMarkAsRead={() => onMarkAsRead(article.id)} 
                                onReadHere={() => onOpenReader(article)} 
                                onReadExternal={() => onOpenExternal(article.link, article.id)} 
                                isRead={readArticleIds.has(article.id)} 
                            />
                        </div>
                    ))}
                </div>

                <div className="px-4 md:px-6 border-t-8 border-app-border pt-16">
                    <div className="flex flex-wrap items-center justify-between mb-12 gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-app-accent border-4 border-app-border shadow-[4px_4px_0_black]">
                                <RadioIcon className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="font-black text-2xl md:text-5xl text-app-text italic uppercase tracking-tighter leading-none">Rolling_Signals</h2>
                        </div>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={onRefresh}
                                className="flex items-center gap-2 px-6 py-3 bg-app-card border-4 border-app-border text-[10px] font-black uppercase italic text-muted hover:text-app-text transition-all shadow-[6px_6px_0_black] active:translate-x-1 active:translate-y-1 outline-none"
                                title="Refresh Signals"
                            >
                                <ArrowPathIcon className="w-4 h-4" />
                                <span>Re-Sync</span>
                            </button>
                            <UnreadFilterToggle checked={showOnlyUnread} onChange={setShowOnlyUnread} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 article-list-grid">
                        {rollingNews.map(article => (
                            <div key={article.id} className="void-card p-1">
                                <MagazineArticleListItem 
                                    article={article} 
                                    onMarkAsRead={() => onMarkAsRead(article.id)} 
                                    onReadHere={() => onOpenReader(article)} 
                                    onReadExternal={() => onOpenExternal(article.link, article.id)} 
                                    isRead={readArticleIds.has(article.id)} 
                            />
                        </div>
                        ))}
                    </div>

                    {filteredArticles.length > visibleCount && (
                        <div className="mt-20 text-center pb-24">
                            <button 
                                onClick={() => setVisibleCount(c => c + LOAD_MORE_BATCH)} 
                                className="bg-app-text text-app-bg font-black uppercase italic py-6 px-16 text-sm tracking-[0.2em] active:translate-y-1 border-4 border-app-border shadow-[8px_8px_0_black] focus:ring-8 focus:ring-pulse-500 outline-none"
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

const LocalHeader: React.FC<any> = ({ onSearchSubmit, searchQuery, setSearchQuery, isSearchActive, setIsSearchActive, onToggleTheme, onRefresh, selection, handleCategoryClick, theme }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isSearchActive) inputRef.current?.focus();
    }, [isSearchActive]);

    return (
        <div className="fixed top-11 md:top-12 left-0 right-0 z-40 bg-app-bg border-b-4 border-app-border px-4 md:px-8 py-4 flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center h-12 gap-1.5 overflow-x-auto scrollbar-hide flex-grow w-full md:w-auto sub-header-nav">
                {CATEGORY_MAP.map(cat => (
                    <button 
                        key={cat.id} 
                        onClick={() => handleCategoryClick(cat.id)} 
                        className={`shrink-0 px-2 md:px-2.5 h-11 border-2 transition-all relative group outline-none uppercase font-black italic text-[10px] tracking-widest shadow-[4px_4px_0_black]
                            ${selection.category === cat.id 
                                ? 'bg-app-accent border-app-border text-white translate-y-1 shadow-none' 
                                : 'bg-app-card border-app-border text-muted hover:text-app-text'}`}
                    >
                        <span className="relative z-10">{cat.id}</span>
                        <div className={`nav-underline ${selection.category === cat.id ? 'w-[70%]' : 'w-0'}`} />
                    </button>
                ))}
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
                <div className="relative shrink-0">
                    {!isSearchActive ? (
                        <button 
                            onClick={() => setIsSearchActive(true)}
                            className="search-trigger flex items-center gap-2 px-3 h-11 bg-app-card border-4 border-app-border text-[10px] font-black uppercase italic text-muted hover:text-app-text transition-all shadow-[6px_6px_0_black] active:translate-x-1 active:translate-y-1 outline-none shrink-0"
                        >
                            <SearchIcon className="w-4 h-4" />
                            <span>Find</span>
                        </button>
                    ) : (
                        <form onSubmit={onSearchSubmit} className="relative flex items-center gap-3 animate-fade-in">
                            <div className="relative">
                                <SearchIcon className="absolute top-1/2 left-4 -translate-y-1/2 w-4 h-4 text-muted" />
                                <input 
                                    ref={inputRef}
                                    type="text" 
                                    placeholder="SCANNING..." 
                                    value={searchQuery} 
                                    onChange={e => setSearchQuery(e.target.value)} 
                                    onBlur={() => !searchQuery && setIsSearchActive(false)}
                                    className="w-48 md:w-72 bg-app-card border-4 border-app-border py-3 pl-12 pr-6 text-sm uppercase font-black tracking-widest outline-none text-app-text transition-all shadow-[6px_6px_0_black]" 
                                />
                            </div>
                            <button type="button" onClick={() => { setIsSearchActive(false); setSearchQuery(''); }} className="p-3 text-muted hover:text-app-text"><XIcon className="w-5 h-5"/></button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

const UnreadFilterToggle: React.FC<any> = ({ checked, onChange }) => (
    <label className="flex items-center cursor-pointer group bg-app-card px-6 py-3 border-4 border-app-border shadow-[6px_6px_0_black] hover:shadow-[2px_2px_0_black] transition-all active:translate-x-1 active:translate-y-1 outline-none relative">
        <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className={`w-4 h-4 border-4 rounded-sm flex-shrink-0 mr-4 transition-all ${checked ? 'bg-app-accent border-app-border' : 'bg-transparent border-app-border'}`} />
        <span className="text-xs font-black uppercase tracking-widest text-muted group-hover:text-app-text italic">Unread_Only</span>
    </label>
);

export default MainContent;