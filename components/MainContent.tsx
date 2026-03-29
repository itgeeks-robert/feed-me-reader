import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Feed, Folder, Selection, WidgetSettings, Article, ArticleView, Mode } from '../src/App';
import type { SourceType } from './AddSource';
import { SearchIcon, ControllerIcon, ArrowPathIcon, XIcon, RadioIcon, NewspaperIcon, DoubleGearIcon, TestTubeIcon, CoinsIcon, SoccerBallIcon, BuildingIcon } from './icons';
import { resilientFetch } from '../services/fetch';
import { parseRssXml } from '../services/rssParser';
import FeaturedStory from './articles/FeaturedStory';
import MagazineArticleListItem from './articles/MagazineArticleListItem';
import { SkeletonFeedList } from './SkeletonFeed';
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
    theme: Mode;
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
    tvMode?: boolean;
}

const ARTICLES_PER_PAGE = 25;
const LOAD_MORE_BATCH = 15;

const CATEGORY_MAP = [
    { id: 'NEWS', icon: <NewspaperIcon className="w-4 h-4" /> },
    { id: 'TECH', icon: <DoubleGearIcon className="w-4 h-4" /> },
    { id: 'SCIENCE', icon: <TestTubeIcon className="w-4 h-4" /> },
    { id: 'FINANCE', icon: <CoinsIcon className="w-4 h-4" /> },
    { id: 'SPORTS', icon: <SoccerBallIcon className="w-4 h-4" /> },
    { id: 'CULTURE', icon: <BuildingIcon className="w-4 h-4" /> },
    { id: 'GAMING', icon: <ControllerIcon className="w-4 h-4" /> }
];

const MainContent: React.FC<MainContentProps> = (props) => {
    const { selection, onSelectCategory, readArticleIds, bookmarkedArticleIds, onMarkAsRead, onSearch, onOpenReader, onOpenExternal, refreshKey, onRefresh, theme, onToggleTheme, animationClass, allFeeds, onSetFeeds, onSetFolders, initialArticles, tvMode } = props;
    
    // Defensive checks for Set types
    const safeReadIds = useMemo(() => {
        if (readArticleIds instanceof Set) return readArticleIds;
        if (Array.isArray(readArticleIds)) return new Set(readArticleIds);
        return new Set();
    }, [readArticleIds]);

    const safeBookmarkIds = useMemo(() => {
        if (bookmarkedArticleIds instanceof Set) return bookmarkedArticleIds;
        if (Array.isArray(bookmarkedArticleIds)) return new Set(bookmarkedArticleIds);
        return new Set();
    }, [bookmarkedArticleIds]);

    const [articles, setArticles] = useState<Article[]>(initialArticles || []);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [visibleCount, setVisibleCount] = useState(ARTICLES_PER_PAGE);
    const [showOnlyUnread, setShowOnlyUnread] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => { getCacheCount(); }, [refreshKey]);

    const activeFeeds = useMemo(() => {
        if (!selection.category) return allFeeds;
        const presets = PRESETS.filter(p => p.category === selection.category);
        return presets.map(p => ({
            id: Math.random(), url: p.url, title: p.title, iconUrl: '', folderId: null, category: p.category
        }));
    }, [selection.category, allFeeds]);

    // Staggered RSS load: Part 1 immediately (6 feeds), Part 2 after 15s (remainder)
    useEffect(() => {
        if (activeFeeds.length === 0) { setArticles([]); return; };
        
        const fetchRssSubset = async (targetFeeds: Feed[], append: boolean = false) => {
            if (!append) setIsLoading(true);
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
                const fetched = results.flat();
                setArticles(prev => {
                    const combined = append ? [...prev, ...fetched] : fetched;
                    combined.sort((a, b) => (b.publishedDate?.getTime() || 0) - (a.publishedDate?.getTime() || 0));
                    return Array.from(new Map(combined.map(a => [a.id, a])).values());
                });
            } finally {
                setIsLoading(false);
            }
        };

        const firstBatch = activeFeeds.slice(0, 6);
        const secondBatch = activeFeeds.slice(6);
        
        fetchRssSubset(firstBatch);

        let timer: number | null = null;
        if (secondBatch.length > 0) {
            timer = window.setTimeout(() => {
                fetchRssSubset(secondBatch, true);
            }, 15000);
        }

        return () => { if (timer) clearTimeout(timer); };
    }, [activeFeeds, refreshKey]);

    const filteredArticles = useMemo(() => {
        let result = articles;
        if (selection.type === 'bookmarks') result = result.filter(a => safeBookmarkIds.has(a.id));
        else if (selection.type === 'search' && selection.query) {
             const filter = selection.query.toLowerCase();
             result = result.filter(a => a.title.toLowerCase().includes(filter) || a.snippet.toLowerCase().includes(filter) || a.source.toLowerCase().includes(filter));
        }
        if (selection.category) {
            const catLower = selection.category.toLowerCase();
            result = result.filter(a => a.feedCategory === selection.category || a.source.toLowerCase().includes(catLower));
        }
        if (showOnlyUnread) result = result.filter(a => !safeReadIds.has(a.id));
        return result;
    }, [articles, selection, safeBookmarkIds, showOnlyUnread, safeReadIds]);

    const handleCategoryClick = (catId: string | null) => {
        onSelectCategory(catId);
    };

    if (allFeeds.length === 0 && selection.type === 'all' && onSetFeeds && onSetFolders) {
        return (
            <main className={`flex-grow overflow-y-auto scrollbar-hide ${animationClass} bg-void-bg pb-40`}>
                <LocalHeader onSearchSubmit={(e: any) => { e.preventDefault(); onSearch(searchQuery); setIsSearchActive(false); }} isSearchActive={isSearchActive} setIsSearchActive={setIsSearchActive} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onToggleTheme={onToggleTheme} onRefresh={onRefresh} selection={selection} handleCategoryClick={handleCategoryClick} theme={theme} />
                <div className="pt-12 md:pt-16">
                    <FeedOnboarding onComplete={(f, fld) => { onSetFolders(fld); onSetFeeds(f); }} />
                </div>
            </main>
        );
    }

    const latestArticle = filteredArticles.length > 0 ? filteredArticles[0] : null;
    const trendingArticles = filteredArticles.slice(1, 4);
    const rollingNews = filteredArticles.slice(4, visibleCount);

    return (
        <div className={`flex-grow overflow-y-auto scrollbar-hide ${animationClass} bg-void-bg pb-40 scroll-smooth main-content-area pl-[max(1rem,var(--safe-left),var(--safe-right))] pr-[max(1rem,var(--safe-left),var(--safe-right))]`}>
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
            
            <div className="max-w-[1400px] mx-auto transition-all relative pt-8 md:pt-12">
                
                {isLoading ? (
                    <div className="px-4 md:px-6">
                        <SkeletonFeedList view={props.articleView} count={12} />
                    </div>
                ) : (
                    <>
                        {latestArticle && (
                            <div className="px-4 md:px-6 mb-12">
                                <FeaturedStory 
                                    article={latestArticle} 
                                    onReadHere={() => onOpenReader(latestArticle)} 
                                    onReadExternal={() => onOpenExternal(latestArticle.link, latestArticle.id)} 
                                    isRead={safeReadIds.has(latestArticle.id)} 
                                />
                            </div>
                        )}

                        <div className={`px-4 md:px-6 mb-16 grid gap-4 md:gap-10 article-list-grid ${tvMode ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 md:grid-cols-3'}`}>
                            {trendingArticles.map(article => (
                                <div key={article.id} className="void-card p-1">
                                    <MagazineArticleListItem 
                                        article={article} 
                                        onMarkAsRead={() => onMarkAsRead(article.id)} 
                                        onReadHere={() => onOpenReader(article)} 
                                        onReadExternal={() => onOpenExternal(article.link, article.id)} 
                                        isRead={safeReadIds.has(article.id)} 
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="px-4 md:px-6 border-t border-app-border/50 pt-16">
                            <div className="flex flex-wrap items-center justify-between mb-12 gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-app-accent/10 text-app-accent rounded-xl">
                                        <RadioIcon className="w-5 h-5" />
                                    </div>
                                    <h2 className="font-bold text-2xl md:text-3xl text-app-text tracking-tight leading-none">Latest Stories</h2>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={onRefresh}
                                        className="flex items-center gap-2 px-4 py-2 bg-app-card border border-app-border rounded-xl text-sm font-medium text-muted hover:text-app-text hover:border-app-accent/50 transition-all shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-app-accent"
                                        title="Refresh Stories"
                                    >
                                        <ArrowPathIcon className="w-4 h-4" />
                                        <span className="hidden sm:inline">Refresh</span>
                                    </button>
                                    <UnreadFilterToggle checked={showOnlyUnread} onChange={setShowOnlyUnread} />
                                </div>
                            </div>

                            <div className={`grid gap-4 md:gap-8 article-list-grid ${tvMode ? 'grid-cols-2 lg:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
                                {rollingNews.map(article => (
                                    <div key={article.id} className="group">
                                        <MagazineArticleListItem 
                                            article={article} 
                                            onMarkAsRead={() => onMarkAsRead(article.id)} 
                                            onReadHere={() => onOpenReader(article)} 
                                            onReadExternal={() => onOpenExternal(article.link, article.id)} 
                                            isRead={safeReadIds.has(article.id)} 
                                        />
                                    </div>
                                ))}
                            </div>

                            {filteredArticles.length > visibleCount && (
                                <div className="mt-16 text-center pb-24">
                                    <button 
                                        onClick={() => setVisibleCount(c => c + LOAD_MORE_BATCH)} 
                                        className="bg-app-card border border-app-border text-app-text font-medium py-3 px-8 rounded-xl text-sm hover:border-app-accent/50 hover:shadow-md transition-all outline-none focus-visible:ring-2 focus-visible:ring-app-accent"
                                    >
                                        Load More Stories
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const LocalHeader: React.FC<any> = ({ onSearchSubmit, searchQuery, setSearchQuery, isSearchActive, setIsSearchActive, selection, handleCategoryClick }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isSearchActive) inputRef.current?.focus();
    }, [isSearchActive]);

    return (
        <div className="sticky top-0 z-30 bg-app-bg/80 backdrop-blur-md border-b border-app-border px-4 md:px-8 py-0 flex flex-row items-center gap-2 md:gap-4 overflow-hidden" style={{ paddingTop: 'var(--safe-top)' }}>
            <div className="flex items-center gap-2 md:gap-4 flex-nowrap flex-grow overflow-x-auto scrollbar-hide py-6 px-4">
                {CATEGORY_MAP.map(cat => (
                    <button 
                        key={cat.id} 
                        onClick={() => handleCategoryClick(cat.id)} 
                        className={`shrink-0 px-3 md:px-4 py-2 transition-all relative group outline-none font-medium text-sm rounded-xl whitespace-nowrap flex items-center gap-2
                            ${selection.category === cat.id 
                                ? 'category-active-glow' 
                                : 'bg-transparent text-muted hover:text-app-text hover:bg-app-border/50'}`}
                        title={cat.id}
                    >
                        <span className="shrink-0">{cat.icon}</span>
                        <span className="relative z-10 hidden md:inline">{cat.id}</span>
                    </button>
                ))}
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
                <div className="relative shrink-0">
                    {!isSearchActive ? (
                        <button 
                            onClick={() => setIsSearchActive(true)}
                            className="flex items-center gap-2 p-2 md:px-4 md:py-2 bg-app-card border border-app-border rounded-xl text-sm font-medium text-muted hover:text-app-text hover:border-app-accent/50 transition-all shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-app-accent shrink-0"
                        >
                            <SearchIcon className="w-5 h-5 md:w-4 md:h-4" />
                            <span className="hidden md:inline">Search</span>
                        </button>
                    ) : (
                        <form onSubmit={onSearchSubmit} className="relative flex items-center gap-2 animate-fade-in">
                            <div className="relative">
                                <SearchIcon className="absolute top-1/2 left-3 -translate-y-1/2 w-4 h-4 text-muted" />
                                <input 
                                    ref={inputRef}
                                    type="text" 
                                    placeholder="Search..." 
                                    value={searchQuery} 
                                    onChange={e => setSearchQuery(e.target.value)} 
                                    onBlur={() => !searchQuery && setIsSearchActive(false)}
                                    className="w-32 sm:w-48 md:w-64 bg-app-card border border-app-border rounded-xl py-2 pl-9 pr-4 text-sm outline-none text-app-text transition-all shadow-sm focus:ring-2 focus:ring-app-accent focus:border-app-accent" 
                                />
                            </div>
                            <button type="button" onClick={() => { setIsSearchActive(false); setSearchQuery(''); }} className="p-2 text-muted hover:text-app-text hover:bg-app-border/50 rounded-lg transition-colors shrink-0"><XIcon className="w-5 h-5"/></button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

const UnreadFilterToggle: React.FC<any> = ({ checked, onChange }) => (
    <label className="flex items-center cursor-pointer group bg-app-card px-4 py-2 border border-app-border rounded-xl shadow-sm hover:border-app-accent/50 hover:shadow-md transition-all outline-none relative focus-within:ring-2 focus-within:ring-app-accent">
        <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className={`w-4 h-4 border rounded flex-shrink-0 mr-2 transition-all flex items-center justify-center ${checked ? 'bg-app-accent border-app-accent' : 'bg-transparent border-app-border group-hover:border-app-accent/50'}`}>
            {checked && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
        </div>
        <span className="text-sm font-medium text-muted group-hover:text-app-text">Unread Only</span>
    </label>
);

export default MainContent;