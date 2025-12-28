import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Feed, Selection, WidgetSettings, Article, ArticleView, Theme } from '../src/App';
import type { SourceType } from './AddSource';
import { MenuIcon, SearchIcon, SunIcon, MoonIcon, BookOpenIcon } from './icons';
import { resilientFetch } from '../services/fetch';
import { parseRssXml } from '../services/rssParser';
import FeaturedStory from './articles/FeaturedStory';
import ArticleListItem from './articles/ArticleListItem';
import MagazineArticleListItem from './articles/MagazineArticleListItem';
import { getCacheCount } from '../services/cacheService';

interface MainContentProps {
    feedsToDisplay: Feed[];
    selection: Selection;
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

const ARTICLES_PER_PAGE = 10; // Initial 1 featured + 9 grid items
const LOAD_MORE_BATCH = 9;   // Keep the 3x3 grid perfect

const EnergyScope: React.FC<{ value: number }> = ({ value }) => (
    <div className="w-full flex flex-col gap-1">
        <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-pulse-500 uppercase tracking-tighter italic">System Uptime</span>
            <span className="text-[10px] font-black text-pulse-500 uppercase tracking-tighter italic">{value}%</span>
        </div>
        <div className="w-full h-1.5 bg-void-950 border border-pulse-500/20 rounded-full overflow-hidden relative">
            <div 
                className="h-full bg-pulse-500 shadow-[0_0_10px_#e11d48] transition-all duration-1000" 
                style={{ width: `${value}%` }} 
            />
            <div className="absolute inset-0 opacity-30 pointer-events-none">
                 <div className="w-full h-full bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(225,29,72,0.3)_2px,rgba(225,29,72,0.3)_4px)] animate-pulse"></div>
            </div>
        </div>
    </div>
);

const MainContent: React.FC<MainContentProps> = (props) => {
    const { feedsToDisplay, selection, readArticleIds, bookmarkedArticleIds, onMarkAsRead, onPurgeBuffer, onSearch, onOpenReader, refreshKey, onOpenSidebar, articleView, theme, onToggleTheme, animationClass, pageTitle, uptime, widgetSettings } = props;
    
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [visibleCount, setVisibleCount] = useState(ARTICLES_PER_PAGE);
    const [showOnlyUnread, setShowOnlyUnread] = useState(false);
    const [cacheCount, setCacheCount] = useState(0);
    
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) onSearch(searchQuery.trim());
    };
    
    useEffect(() => {
        getCacheCount().then(setCacheCount);
    }, [refreshKey]);

    useEffect(() => {
        const fetchRssFeeds = async (feeds: Feed[]) => {
            if (feeds.length === 0) {
                setArticles([]);
                return;
            };
            setLoading(true);
            setError(null);
            const promises = feeds.filter(f => f && f.url).map(feed => 
                resilientFetch(feed.url, { timeout: 10000 })
                    .then(response => response.text())
                    .then(xmlText => parseRssXml(xmlText, feed.title, feed.url))
                    .catch(() => [])
            );
            try {
                const results = await Promise.all(promises);
                const allArticles = results.flat();
                allArticles.sort((a, b) => (b.publishedDate?.getTime() || 0) - (a.publishedDate?.getTime() || 0));
                const uniqueArticles = Array.from(new Map(allArticles.map(a => [a.id, a])).values());
                setArticles(uniqueArticles);
            } catch (e) {
                setError('Signal Lost. Check connection.');
            } finally {
                setLoading(false);
            }
        };
        fetchRssFeeds(feedsToDisplay);
    }, [feedsToDisplay, refreshKey]);

    const filteredArticles = useMemo(() => {
        let result = articles;
        if (selection.type === 'bookmarks') result = result.filter(a => bookmarkedArticleIds.has(a.id));
        else if (selection.type === 'search' && selection.query) {
             const filter = selection.query.toLowerCase();
             result = result.filter(a => a.title.toLowerCase().includes(filter) || a.snippet.toLowerCase().includes(filter));
        }
        if (showOnlyUnread) result = result.filter(a => !readArticleIds.has(a.id));
        return result;
    }, [articles, selection, bookmarkedArticleIds, showOnlyUnread, readArticleIds]);

    const unreadCount = useMemo(() => articles.filter(a => !readArticleIds.has(a.id)).length, [articles, readArticleIds]);

    // Force Lead Story + Grid layout as requested
    const latestArticle = filteredArticles.length > 0 ? filteredArticles[0] : null;
    const articlesToDisplay = filteredArticles.slice(1);
    const visibleArticlesToDisplay = articlesToDisplay.slice(0, visibleCount - 1);

    return (
        <main className={`flex-grow overflow-y-auto ${animationClass} bg-void-950 pb-[calc(10rem+env(safe-area-inset-bottom))] scroll-smooth scrollbar-hide`}>
            <Header 
                onSearchSubmit={handleSearchSubmit} 
                searchQuery={searchQuery} 
                setSearchQuery={setSearchQuery} 
                onOpenSidebar={onOpenSidebar} 
                theme={theme} 
                onToggleTheme={onToggleTheme} 
                uptime={uptime}
                cacheCount={cacheCount}
            />
            <div className="px-4 md:px-12 pt-32 md:pt-40 max-w-7xl mx-auto">
                 <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b-2 border-pulse-500/10 mb-8">
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-white italic drop-shadow-[0_0_10px_rgba(225,29,72,0.4)] glitch-text uppercase tracking-widest">{pageTitle}</h1>
                        <p className="text-[10px] md:text-xs font-black text-zinc-600 uppercase tracking-[0.4em] mt-2 font-mono">{unreadCount} SIGS DETECTED</p>
                    </div>
                    {unreadCount > 5 && (
                        <button 
                            onClick={() => onPurgeBuffer(articles.map(a => a.id))}
                            className="flex items-center gap-2 px-6 py-2.5 bg-void-900 border border-pulse-500 text-pulse-500 hover:bg-pulse-500 hover:text-white rounded-none font-black uppercase italic text-xs transition-all shadow-[4px_4px_0px_#e11d48]"
                        >
                            <span>Clear Frequency</span>
                        </button>
                    )}
                </div>
                
                {latestArticle && (
                    <div className="mb-12">
                        <FeaturedStory article={latestArticle} onReadHere={() => onOpenReader(latestArticle)} onMarkAsRead={() => onMarkAsRead(latestArticle.id)} isRead={readArticleIds.has(latestArticle.id)} />
                    </div>
                )}
                
                <div className="mt-16">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-10 gap-4 border-l-4 border-pulse-500 pl-6">
                        <div className="flex items-center gap-6">
                            <h2 className="font-black text-xl md:text-2xl text-white italic uppercase tracking-tighter">Live Transmissions</h2>
                            <UnreadFilterToggle checked={showOnlyUnread} onChange={setShowOnlyUnread} />
                        </div>
                    </div>

                    {loading && filteredArticles.length === 0 && (
                        <div className="text-center py-20 flex flex-col items-center gap-4">
                            <div className="w-10 h-10 border-t-2 border-pulse-500 rounded-full animate-spin"></div>
                            <span className="text-pulse-500 font-mono text-xs uppercase tracking-widest animate-pulse">Decrypting Signal...</span>
                        </div>
                    )}
                    
                    {/* Fixed 3x3 Grid Layout */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                        {visibleArticlesToDisplay.map(article => (
                            <MagazineArticleListItem 
                                key={article.id}
                                article={article}
                                onMarkAsRead={() => onMarkAsRead(article.id)}
                                onReadHere={() => onOpenReader(article)}
                                isRead={readArticleIds.has(article.id)}
                            />
                        ))}
                    </div>

                    {articlesToDisplay.length > visibleArticlesToDisplay.length && (
                        <div className="mt-16 text-center pb-24">
                            <button
                                onClick={() => setVisibleCount(c => c + LOAD_MORE_BATCH)}
                                className="bg-void-950 border-2 border-pulse-500 text-pulse-500 hover:bg-pulse-500 hover:text-white font-black uppercase italic py-4 px-12 rounded-none transition-all shadow-[6px_6px_0px_#e11d48] text-sm md:text-base active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                            >
                                Decode {LOAD_MORE_BATCH} More
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};

const Header: React.FC<any> = ({ onSearchSubmit, searchQuery, setSearchQuery, onOpenSidebar, theme, onToggleTheme, uptime, cacheCount }) => (
    <header className="fixed top-0 left-0 md:left-72 right-0 z-30 pt-[env(safe-area-inset-top)] pointer-events-none">
        <div className="w-full h-16 md:h-24 bg-void-950/90 backdrop-blur-xl border-b border-pulse-500/30 flex items-center justify-between px-4 md:px-10 pointer-events-auto shadow-2xl">
            <button onClick={onOpenSidebar} className="p-2 text-pulse-500 transition-all flex-shrink-0"><MenuIcon className="w-7 h-7 md:w-9 md:h-9" /></button>
            
            <div className="flex-grow flex flex-col items-center mx-3 md:mx-12 max-w-2xl">
                <form onSubmit={onSearchSubmit} className="relative w-full mb-2 md:mb-3">
                    <SearchIcon className="w-5 h-5 text-zinc-700 absolute top-1/2 left-4 md:left-6 -translate-y-1/2" />
                    <input 
                        type="search" 
                        placeholder="Scan Frequencies..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-void-900 border border-zinc-800 focus:border-pulse-500 placeholder-zinc-700 text-white rounded-none py-2 md:py-3 pl-10 md:pl-14 pr-4 text-xs md:text-sm transition-all font-mono uppercase tracking-widest outline-none"
                    />
                </form>
                <div className="w-full px-1 md:px-6">
                    <EnergyScope value={uptime} />
                </div>
            </div>

            <div className="flex items-center gap-4 md:gap-10 flex-shrink-0">
                <div className="hidden lg:flex flex-col items-end">
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-tighter italic">Data Cache</span>
                    <span className="text-xs font-black text-pulse-500 uppercase tracking-tighter italic">{cacheCount} SIGS</span>
                </div>
                <button onClick={onToggleTheme} className="p-2 text-pulse-500 hover:text-white transition-all">
                    {theme === 'dark' ? <SunIcon className="w-6 h-6 md:w-8 md:h-8" /> : <MoonIcon className="w-6 h-6 md:w-8 md:h-8" />}
                </button>
            </div>
        </div>
    </header>
);

const UnreadFilterToggle: React.FC<any> = ({ checked, onChange }) => (
    <label className="flex items-center cursor-pointer group bg-void-900 px-4 py-2 md:px-8 md:py-3 border border-zinc-800 transition-all hover:border-pulse-500">
        <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className={`w-4 h-4 md:w-5 md:h-5 border-2 flex-shrink-0 mr-3 md:mr-4 transition-colors ${checked ? 'bg-pulse-500 border-pulse-500 shadow-[0_0_8px_#e11d48]' : 'bg-transparent border-zinc-700'}`}></div>
        <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-zinc-500 group-hover:text-white transition-colors font-mono italic">Unread Signals</span>
    </label>
);

export default MainContent;