import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Feed, Selection, WidgetSettings, Article, ArticleView, Theme } from '../src/App';
import type { SourceType } from './AddSource';
import { MenuIcon, SearchIcon, SunIcon, SunriseIcon, SunsetIcon, MoonIcon, BookOpenIcon } from './icons';
import { teamLogos } from '../services/teamLogos';
import ReaderViewModal from './ReaderViewModal';
import { fetchAndCacheArticleContent } from '../services/readerService';
import { resilientFetch } from '../services/fetch';
import { parseRssXml } from '../services/rssParser';
import { fetchAllSportsData, getCachedSportsData, needsFreshSportsData } from '../services/sportsService';
import FeaturedStory from './articles/FeaturedStory';
import ArticleListItem from './articles/ArticleListItem';
import MagazineArticleListItem from './articles/MagazineArticleListItem';

const getTeamLogo = (teamName: string): string | null => {
    if (!teamName) return null;
    if (teamLogos[teamName]) return teamLogos[teamName];
    const simplifiedName = teamName.replace(/ F\.?C\.?$/, '').trim();
    if (teamLogos[simplifiedName]) return teamLogos[simplifiedName];
    return null;
};

interface MainContentProps {
    feedsToDisplay: Feed[];
    selection: Selection;
    readArticleIds: Set<string>;
    bookmarkedArticleIds: Set<string>;
    articleTags: Map<string, Set<string>>;
    onMarkAsRead: (articleId: string) => void;
    onMarkAsUnread: (articleId: string) => void;
    onMarkMultipleAsRead: (articleIds: string[]) => void;
    onToggleBookmark: (articleId: string) => void;
    onSetArticleTags: (articleId: string, tags: Set<string>) => void;
    onSearch: (query: string) => void;
    allFeeds: Feed[];
    isApiKeyMissing: boolean;
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
}

const ARTICLES_PER_PAGE = 10;

const MainContent: React.FC<MainContentProps> = (props) => {
    const { feedsToDisplay, selection, readArticleIds, bookmarkedArticleIds, onMarkAsRead, onSearch, allFeeds, refreshKey, widgetSettings, onOpenSidebar, articleView, theme, onToggleTheme, animationClass, pageTitle } = props;
    
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [visibleCount, setVisibleCount] = useState(ARTICLES_PER_PAGE);
    const [showOnlyUnread, setShowOnlyUnread] = useState(false);
    
    const [sportsResults, setSportsResults] = useState<Map<string, any>>(new Map());
    const [isSportsLoading, setIsSportsLoading] = useState(false);
    
    const [readerArticle, setReaderArticle] = useState<Article | null>(null);
    const isInitialMount = useRef(true);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) onSearch(searchQuery.trim());
    };
    
    useEffect(() => {
        const fetchRssFeeds = async (feeds: Feed[]) => {
            if (feeds.length === 0) {
                setArticles([]);
                return;
            };

            setLoading(true);
            setError(null);

            const feedErrors: string[] = [];
            const promises = feeds.map(feed => 
                resilientFetch(feed.url, { timeout: 10000 })
                    .then(response => response.text())
                    .then(xmlText => parseRssXml(xmlText, feed.title, feed.url))
                    .catch(err => {
                        console.warn(`Failed to fetch or parse feed ${feed.title}:`, err.message);
                        feedErrors.push(feed.title);
                        return [];
                    })
            );

            try {
                const results = await Promise.all(promises);
                const allArticles = results.flat();
                
                if (feedErrors.length > 0) {
                    setError(allArticles.length === 0 ? `Failed to load all feeds. Check your network and try again.` : `Could not load: ${feedErrors.join(', ')}.`);
                }

                allArticles.sort((a, b) => (b.publishedDate?.getTime() || 0) - (a.publishedDate?.getTime() || 0));
                const uniqueArticles = Array.from(new Map(allArticles.map(a => [a.id, a])).values());
                setArticles(uniqueArticles);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'An unknown error occurred.');
            } finally {
                setLoading(false);
            }
        };

        fetchRssFeeds(feedsToDisplay);
    }, [feedsToDisplay, refreshKey]);

    useEffect(() => {
        if (!widgetSettings.showSports || widgetSettings.sportsTeams.length === 0) return;

        const fetchSports = async () => {
            setIsSportsLoading(true);
            const results = await fetchAllSportsData(widgetSettings.sportsTeams);
            setSportsResults(results);
            setIsSportsLoading(false);
        };

        const cachedData = getCachedSportsData();
        if (cachedData) {
            setSportsResults(cachedData);
        }

        if (isInitialMount.current) {
            isInitialMount.current = false;
            if (needsFreshSportsData() || !cachedData) {
                fetchSports();
            }
        } else {
            fetchSports();
        }
    }, [widgetSettings.showSports, widgetSettings.sportsTeams, refreshKey]);

    const filteredArticles = useMemo(() => {
        let result = articles;
        if (selection.type === 'bookmarks') {
            result = result.filter(a => bookmarkedArticleIds.has(a.id));
        } else if (selection.type === 'search' && selection.query) {
             const filter = selection.query.toLowerCase();
             result = result.filter(a => a.title.toLowerCase().includes(filter) || a.snippet.toLowerCase().includes(filter));
        }
        
        if (showOnlyUnread) {
            result = result.filter(a => !readArticleIds.has(a.id));
        }

        return result;
    }, [articles, selection, bookmarkedArticleIds, showOnlyUnread, readArticleIds]);

    useEffect(() => {
        setVisibleCount(ARTICLES_PER_PAGE);
    }, [filteredArticles]);
    
    useEffect(() => {
        if (filteredArticles.length === 0) return;
        const preCache = (articlesToCache: Article[]) => {
            articlesToCache.forEach(article => fetchAndCacheArticleContent(article).catch(error => {
                console.warn(`Pre-caching failed for "${article.title}":`, error);
            }));
        };
        preCache(filteredArticles.slice(0, 5));
        const timerId = setTimeout(() => preCache(filteredArticles.slice(5, 15)), 60000);
        return () => clearTimeout(timerId);
    }, [filteredArticles]);


    const feedInfoMap = useMemo(() => new Map(allFeeds.map(feed => [feed.title, { iconUrl: feed.iconUrl, sourceType: feed.sourceType }])), [allFeeds]);

    const latestArticle = articleView !== 'featured' && filteredArticles.length > 0 ? filteredArticles[0] : null;
    const articlesToDisplay = articleView !== 'featured' ? filteredArticles.slice(1) : filteredArticles;
    const visibleArticlesToDisplay = articlesToDisplay.slice(0, visibleCount);

    return (
        <main className={`flex-grow overflow-y-auto ${animationClass}`}>
            <Header onSearchSubmit={handleSearchSubmit} searchQuery={searchQuery} setSearchQuery={setSearchQuery} widgetSettings={widgetSettings} refreshKey={refreshKey} onOpenSidebar={onOpenSidebar} theme={theme} onToggleTheme={onToggleTheme} />
            <div className="px-4 md:px-6 lg:px-8 pt-24 pb-40">
                 <h1 className="text-4xl font-bold text-zinc-900 dark:text-white px-2 pb-6 truncate">{pageTitle}</h1>
                {latestArticle && <FeaturedStory article={latestArticle} onReadHere={() => setReaderArticle(latestArticle)} onMarkAsRead={() => onMarkAsRead(latestArticle.id)} isRead={readArticleIds.has(latestArticle.id)} />}
                
                <div className="mt-8">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <div className="flex items-center gap-4">
                            <h2 className="font-bold text-xl text-zinc-900 dark:text-white">Recent</h2>
                            <UnreadFilterToggle checked={showOnlyUnread} onChange={setShowOnlyUnread} />
                        </div>
                        {sportsResults.size > 0 && <SportsCarousel results={sportsResults} isLoading={isSportsLoading} onTeamSelect={onSearch} />}
                    </div>
                    {loading && filteredArticles.length === 0 && <p className="text-center py-10">Loading articles...</p>}
                    {error && <p className="text-center py-10 text-red-600 dark:text-red-400">{error}</p>}
                    
                    <div className={
                        articleView === 'grid' 
                            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                            : "space-y-4"
                    }>
                        {visibleArticlesToDisplay.map(article => {
                            const feedInfo = feedInfoMap.get(article.source);
                            const commonProps = {
                                key: article.id,
                                article: article,
                                onMarkAsRead: () => onMarkAsRead(article.id),
                                onReadHere: () => setReaderArticle(article),
                                isRead: readArticleIds.has(article.id),
                            };

                            if (articleView === 'featured') return <FeaturedStory {...commonProps} />;
                            if (articleView === 'grid') return <MagazineArticleListItem {...commonProps} />;
                            return <ArticleListItem {...commonProps} iconUrl={feedInfo?.iconUrl} sourceType={feedInfo?.sourceType} />;
                        })}
                    </div>
                    {articlesToDisplay.length > visibleCount && (
                        <div className="mt-8 text-center">
                            <button
                                onClick={() => setVisibleCount(c => c + ARTICLES_PER_PAGE)}
                                className="bg-white/50 dark:bg-black/20 backdrop-blur-md hover:bg-white/80 dark:hover:bg-black/30 border border-white/20 dark:border-white/10 text-zinc-800 dark:text-zinc-200 font-semibold py-2 px-6 rounded-full transition-all duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-orange-500"
                            >
                                Load More
                            </button>
                        </div>
                    )}
                </div>
            </div>
             {readerArticle && (
                <ReaderViewModal 
                    article={readerArticle}
                    onClose={() => setReaderArticle(null)}
                    onMarkAsRead={onMarkAsRead}
                />
            )}
        </main>
    );
};

const ThemeToggleButton: React.FC<{ theme: Theme, onToggle: () => void }> = ({ theme, onToggle }) => (
    <button 
        onClick={onToggle} 
        className="p-2.5 rounded-full text-zinc-600 dark:text-zinc-300 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
        {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
    </button>
);

const Header: React.FC<{onSearchSubmit: (e: React.FormEvent) => void; searchQuery: string; setSearchQuery: (q: string) => void; widgetSettings: WidgetSettings; refreshKey: number; onOpenSidebar: () => void; theme: Theme; onToggleTheme: () => void;}> = ({ onSearchSubmit, searchQuery, setSearchQuery, widgetSettings, refreshKey, onOpenSidebar, theme, onToggleTheme }) => (
    <header className="fixed top-0 left-0 md:left-72 right-0 z-30 p-4">
        <div className="w-full h-16 bg-white/30 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl shadow-lg flex items-center justify-between px-4">
            <button onClick={onOpenSidebar} className="p-2.5 rounded-full text-zinc-600 dark:text-zinc-300 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"><MenuIcon className="w-5 h-5" /></button>
            <form onSubmit={onSearchSubmit} className="relative flex-grow mx-4 max-w-md">
                <SearchIcon className="w-5 h-5 text-zinc-500 dark:text-zinc-400 absolute top-1/2 left-4 -translate-y-1/2" />
                <input 
                    type="search" 
                    placeholder="Search articles..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-black/5 dark:bg-white/5 placeholder-zinc-500 dark:placeholder-zinc-400 text-zinc-900 dark:text-white rounded-full py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 border border-transparent focus:border-orange-500/50"
                />
            </form>
            <div className="hidden md:flex items-center gap-2">
                {widgetSettings.showWeather && <WeatherDisplay location={widgetSettings.weatherLocation} refreshKey={refreshKey} />}
                <ThemeToggleButton theme={theme} onToggle={onToggleTheme} />
            </div>
        </div>
    </header>
);

const WeatherDisplay: React.FC<{ location: string, refreshKey: number }> = ({ location, refreshKey }) => {
    const [weather, setWeather] = useState<{temp: number; sunrise: string; sunset: string} | null>(null);

    useEffect(() => {
        const fetchWeather = async () => {
            if (!location) { setWeather(null); return; }
            try {
                const response = await resilientFetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1`, { timeout: 10000 });
                if (!response.ok) throw new Error("Weather service failed");
                const data = await response.json();
                if (data?.current_condition?.[0] && data.weather?.[0]?.astronomy?.[0]) {
                    setWeather({ temp: parseInt(data.current_condition[0].temp_C, 10), sunrise: data.weather[0].astronomy[0].sunrise, sunset: data.weather[0].astronomy[0].sunset });
                } else setWeather(null);
            } catch (e) { setWeather(null); }
        };
        fetchWeather();
    }, [location, refreshKey]);

    const formatTime = (timeStr?: string) => {
        if (!timeStr) return '';
        const parts = timeStr.match(/(\d{1,2}):(\d{2}) (AM|PM)/);
        if (!parts) return timeStr;
        let [, hour, minute, ampm] = parts;
        let hourNum = parseInt(hour, 10);
        if (ampm === 'PM' && hourNum < 12) hourNum += 12;
        if (ampm === 'AM' && hourNum === 12) hourNum = 0;
        return `${String(hourNum).padStart(2, '0')}:${minute}`;
    };

    if (!weather) return <div className="flex items-center gap-2 text-sm w-32 h-8 justify-end" />;
    
    return (
        <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <div className="flex items-center gap-1">
                <SunIcon className="w-5 h-5 text-yellow-500" />
                <span className="font-medium">{weather.temp}°C</span>
            </div>
            <div className="text-xs flex items-center gap-1 opacity-80">
                <SunriseIcon className="w-4 h-4" />
                <span>{formatTime(weather.sunrise)}</span>
            </div>
            <div className="text-xs flex items-center gap-1 opacity-80">
                <SunsetIcon className="w-4 h-4" />
                <span>{formatTime(weather.sunset)}</span>
            </div>
        </div>
    );
};

const UnreadFilterToggle: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; }> = ({ checked, onChange }) => (
    <label htmlFor="unread-toggle" className="flex items-center cursor-pointer group">
        <div className="relative">
            <input id="unread-toggle" type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <div className={`block w-10 h-6 rounded-full transition-colors ${checked ? 'bg-orange-500' : 'bg-black/10 dark:bg-white/10'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'transform translate-x-4' : ''}`}></div>
        </div>
        <div className="ml-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
            Unread Only
        </div>
    </label>
);

const SportsCarousel: React.FC<{ results: Map<string, any>; isLoading: boolean; onTeamSelect: (teamName: string) => void; }> = ({ results, isLoading, onTeamSelect }) => (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide -mr-4 pr-4">
        {Array.from(results.keys()).map(teamCode => (
            <SportsCard key={teamCode} teamCode={teamCode} data={results.get(teamCode)} isLoading={isLoading} onSelect={onTeamSelect} />
        ))}
    </div>
);

const SportsCard: React.FC<{ teamCode: string; data: any; isLoading: boolean; onSelect: (teamName: string) => void; }> = ({ teamCode, data, isLoading, onSelect }) => {
    if (isLoading) return <div className="w-32 h-10 bg-black/5 dark:bg-white/5 rounded-full animate-pulse flex-shrink-0" />;
    if (!data || data.error) return null;
    
    const TeamLogo = ({ name }: { name: string }) => {
        const logoUrl = getTeamLogo(name);
        return logoUrl ? <img src={logoUrl} alt={`${name} logo`} className="w-5 h-5 object-contain" /> : <div className="w-5 h-5 rounded-full bg-zinc-300 dark:bg-zinc-600" />;
    };
    
    return (
        <button onClick={() => onSelect(data.teamFullName)}
            className="p-2 pl-3 bg-white/30 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-full w-auto flex-shrink-0 flex items-center gap-2 text-xs hover:border-white/40 dark:hover:border-white/20 transition-colors shadow-md"
        >
            <TeamLogo name={data.strHomeTeam} />
            <span className="font-bold text-lg text-zinc-900 dark:text-white">{data.intHomeScore}</span>
            <span className="opacity-50">-</span>
            <span className="font-bold text-lg text-zinc-900 dark:text-white">{data.intAwayScore}</span>
            <TeamLogo name={data.strAwayTeam} />
        </button>
    );
};

export default MainContent;