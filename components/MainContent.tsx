import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Feed, Selection, WidgetSettings, Article, ArticleView, Theme } from '../src/App';
import { resilientFetch, PROXIES } from '../services/fetch';
import type { SourceType } from './AddSource';
import { MenuIcon, SearchIcon, SunIcon, SunriseIcon, SunsetIcon, PlusIcon, ArrowsRightLeftIcon, SettingsIcon, ArrowPathIcon, NewspaperIcon, RedditIcon, YoutubeIcon, BookOpenIcon, MoonIcon } from './icons';
import { teamLogos } from '../services/teamLogos';
import { allTeamsMap } from '../services/sportsData';
import ReaderViewModal from './ReaderViewModal';
import { fetchAndCacheArticleContent } from '../services/readerService';

const SPORTS_CACHE_KEY = 'sports_data_cache';
const LAST_SPORTS_FETCH_KEY = 'last_sports_fetch_timestamp';


function timeAgo(date: Date | null): string {
    if (!date) return '';
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const parseRssXml = (xmlText: string, sourceTitle: string, feedUrl: string): Article[] => {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, "application/xml");
    const errorNode = xml.querySelector('parsererror');
    if (errorNode) throw new Error(`Failed to parse RSS feed for ${sourceTitle}.`);

    const channelLink = xml.querySelector('channel > link');
    const feedLink = xml.querySelector('feed > link[rel="alternate"], feed > link:not([rel])');
    const siteLink = channelLink?.textContent?.trim() || (feedLink ? feedLink.getAttribute('href') : null) || feedUrl;

    const items = Array.from(xml.querySelectorAll('item, entry'));
    return items.map(item => {
        const title = item.querySelector('title')?.textContent || 'No title';
        const linkElem = item.querySelector('link');
        const link = linkElem?.getAttribute('href') || linkElem?.textContent || '';
        const description = item.querySelector('description')?.textContent || item.querySelector('summary')?.textContent || '';
        const snippet = description.replace(/<[^>]*>?/gm, '').substring(0, 100) + (description.length > 100 ? '...' : '');
        const pubDateStr = item.querySelector('pubDate')?.textContent || item.querySelector('published')?.textContent || item.querySelector('updated')?.textContent;
        const publishedDate = pubDateStr ? new Date(pubDateStr) : null;
        const guid = item.querySelector('guid')?.textContent || item.querySelector('id')?.textContent;
        
        let imageUrl: string | null = null;
        const mediaContent = item.querySelector('media\\:content, content');
        if (mediaContent && mediaContent.getAttribute('medium') === 'image') imageUrl = mediaContent.getAttribute('url');
        if (!imageUrl) {
            const enclosure = item.querySelector('enclosure');
            if (enclosure && enclosure.getAttribute('type')?.startsWith('image')) imageUrl = enclosure.getAttribute('url');
        }
        if (!imageUrl) {
            const mediaThumbnail = item.querySelector('media\\:thumbnail, thumbnail');
            if (mediaThumbnail) imageUrl = mediaThumbnail.getAttribute('url');
        }
        if (!imageUrl) {
            const contentEncoded = item.querySelector('content\\:encoded, encoded')?.textContent;
            const contentToParse = contentEncoded || description;
            if (contentToParse) {
                try {
                    const doc = new DOMParser().parseFromString(contentToParse, 'text/html');
                    const img = doc.querySelector('img');
                    if (img) imageUrl = img.getAttribute('src');
                } catch (e) { console.warn("Error parsing HTML content for image", e); }
            }
        }

        if (imageUrl) {
            try {
                imageUrl = new URL(imageUrl, siteLink).href;
            } catch (e) {
                console.warn(`Could not construct valid URL for image: "${imageUrl}" with base "${siteLink}"`);
                imageUrl = null;
            }
        }
        
        const id = guid || link || `${title}-${pubDateStr}`;

        return { id, title, link, snippet, publishedDate, source: sourceTitle, imageUrl };
    });
};

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

const ARTICLES_PER_PAGE = 15;

const MainContent: React.FC<MainContentProps> = (props) => {
    const { feedsToDisplay, selection, readArticleIds, bookmarkedArticleIds, onMarkAsRead, onSearch, allFeeds, refreshKey, onRefresh, widgetSettings, onOpenSettings, onOpenAddSource, onAddSource, onOpenSidebar, articleView, theme, onToggleTheme, animationClass, pageTitle } = props;
    
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

        const needsFreshData = () => {
            const lastFetch = localStorage.getItem(LAST_SPORTS_FETCH_KEY);
            return !lastFetch || (Date.now() - parseInt(lastFetch, 10)) > 2 * 60 * 60 * 1000;
        };

        const fetchAllSportsData = async () => {
            setIsSportsLoading(true);
            const fetchTeamData = async (teamCode: string): Promise<{ team: string; result: any; }> => {
                const teamFullName = allTeamsMap.get(teamCode.toUpperCase()) || teamCode;
                try {
                    const teamSearchRes = await resilientFetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(teamFullName)}`);
                    const teamSearchData = await teamSearchRes.json();
                    const teamInfo = teamSearchData.teams?.[0];
                    if (!teamInfo) throw new Error(`Team not found.`);

                    const lastEventsRes = await resilientFetch(`https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${teamInfo.idTeam}`);
                    const lastEventsData = await lastEventsRes.json();
                    
                    const completedEvents = (lastEventsData.results || []).filter((event: any) =>
                        event.strStatus === "Match Finished" || (event.intHomeScore !== null && event.intAwayScore !== null)
                    );

                    completedEvents.sort((a: any, b: any) => new Date(`${b.dateEvent}T${b.strTime || '00:00'}`).getTime() - new Date(`${a.dateEvent}T${a.strTime || '00:00'}`).getTime());
                    const lastMatch = completedEvents[0];
                    
                    if (!lastMatch) throw new Error('No last match data found.');

                    return { team: teamCode, result: { ...lastMatch, teamFullName: teamInfo.strTeam }};
                } catch (error) {
                    return { team: teamCode, result: { error: (error as Error).message } };
                }
            };
            
            const promises = widgetSettings.sportsTeams.map(fetchTeamData);
            const allResults = await Promise.all(promises);
            const newResults = new Map<string, any>(allResults.map(res => [res.team, res.result]));
            setSportsResults(newResults);
            localStorage.setItem(SPORTS_CACHE_KEY, JSON.stringify(Array.from(newResults.entries())));
            localStorage.setItem(LAST_SPORTS_FETCH_KEY, String(Date.now()));
            setIsSportsLoading(false);
        };

        const cachedData = localStorage.getItem(SPORTS_CACHE_KEY);
        if (cachedData) {
            setSportsResults(new Map(JSON.parse(cachedData)));
        }
        if (isInitialMount.current) {
            isInitialMount.current = false;
            if (needsFreshData() || !cachedData) fetchAllSportsData();
        } else {
            fetchAllSportsData();
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

const ModernVectorFallback: React.FC = () => (
    <div className="absolute inset-0 overflow-hidden opacity-50">
         <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-br from-indigo-500/30 via-purple-500/30 to-pink-500/30 animate-[spin_20s_linear_infinite]" />
    </div>
);

const FeaturedStory: React.FC<{article: Article; onReadHere: () => void; onMarkAsRead: () => void; isRead: boolean;}> = ({ article, onReadHere, onMarkAsRead, isRead }) => {
    const [imageSrc, setImageSrc] = useState(article.imageUrl ? `${PROXIES[0].url}${PROXIES[0].encode ? encodeURIComponent(article.imageUrl) : article.imageUrl}` : '');
    const [imageError, setImageError] = useState(!article.imageUrl);

    const hasImage = article.imageUrl && !imageError;
    
    return (
        <div className={`p-6 rounded-3xl text-white shadow-lg relative overflow-hidden h-56 flex flex-col justify-end transition-opacity duration-300 ${isRead ? 'opacity-60 saturate-50' : ''}`}>
            {hasImage ? (
                <>
                    <img src={imageSrc} alt="" className="absolute inset-0 w-full h-full object-cover" onError={() => setImageError(true)} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </>
            ) : ( <ModernVectorFallback /> )}
            
            <div className="relative z-10">
                <p className="text-sm font-semibold opacity-80">{article.source}</p>
                <h1 className="text-2xl font-bold my-1 line-clamp-2 leading-tight">{article.title}</h1>
                 <div className="flex items-center gap-2 mt-3">
                    <a href={article.link} target="_blank" rel="noopener noreferrer" onClick={onMarkAsRead} className="inline-block bg-white/20 hover:bg-white/30 backdrop-blur-sm font-semibold py-2 px-4 rounded-full text-sm transition-colors">
                        Read Original
                    </a>
                    <button onClick={onReadHere} className="inline-flex items-center gap-2 bg-orange-600/80 hover:bg-orange-600 backdrop-blur-sm font-semibold py-2 px-4 rounded-full text-sm transition-colors">
                        <BookOpenIcon className="w-4 h-4" />
                        <span>Read Here</span>
                    </button>
                </div>
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

const ArticleListItem: React.FC<{ article: Article; onMarkAsRead: () => void; onReadHere: () => void; isRead: boolean; iconUrl?: string; sourceType?: SourceType; }> = ({ article, onMarkAsRead, onReadHere, isRead, iconUrl, sourceType }) => {
    const [imageSrc, setImageSrc] = useState(article.imageUrl ? `${PROXIES[0].url}${article.imageUrl}` : '');
    const [imageError, setImageError] = useState(!article.imageUrl);

    const FallbackDisplay = () => {
        if (sourceType === 'reddit') return <RedditIcon className="w-8 h-8 text-orange-500" />;
        if (sourceType === 'youtube') return <YoutubeIcon className="w-8 h-8 text-red-500" />;
        return <NewspaperIcon className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />;
    };

    return (
        <a href={article.link} target="_blank" rel="noopener noreferrer" onClick={onMarkAsRead}
            className={`flex items-stretch gap-4 bg-white/30 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl hover:border-white/50 dark:hover:border-white/20 hover:shadow-xl transition-all duration-200 overflow-hidden h-32 ${isRead ? 'opacity-50 saturate-50' : ''}`}
        >
            <div className="flex-grow flex flex-col p-4 justify-between overflow-hidden">
                <div>
                    <p className="font-semibold text-zinc-900 dark:text-white line-clamp-3 leading-tight">{article.title}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <div className="flex items-center gap-1.5 min-w-0">
                        {iconUrl && <img src={iconUrl} alt="" className="w-4 h-4 rounded-sm flex-shrink-0" />}
                        <span className="truncate">{article.source}</span>
                    </div>
                    <span className="opacity-50 flex-shrink-0">&middot;</span>
                    <span className="flex-shrink-0">{timeAgo(article.publishedDate)}</span>
                    <span className="opacity-50 flex-shrink-0">&middot;</span>
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReadHere(); }} className="flex items-center gap-1 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">
                        <BookOpenIcon className="w-4 h-4" />
                        <span>Read</span>
                    </button>
                </div>
            </div>
            {article.imageUrl && !imageError ? (
                <div className="w-32 flex-shrink-0"><img src={imageSrc} alt="" className="w-full h-full object-cover" onError={() => setImageError(true)} /></div>
            ) : (
                <div className="w-32 flex-shrink-0 bg-black/5 dark:bg-white/5 flex items-center justify-center"><FallbackDisplay /></div>
            )}
        </a>
    );
};

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

const MagazineArticleListItem: React.FC<{ article: Article; onMarkAsRead: () => void; onReadHere: () => void; isRead: boolean; }> = ({ article, onMarkAsRead, onReadHere, isRead }) => {
    const [imageSrc, setImageSrc] = useState(article.imageUrl ? `${PROXIES[0].url}${article.imageUrl}` : '');
    const [imageError, setImageError] = useState(!article.imageUrl);

    return (
        <a href={article.link} target="_blank" rel="noopener noreferrer" onClick={onMarkAsRead}
            className={`flex flex-col bg-white/30 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl hover:border-white/50 dark:hover:border-white/20 hover:shadow-xl transition-all duration-200 overflow-hidden group ${isRead ? 'opacity-50 saturate-50' : ''}`}
        >
            <div className="aspect-video w-full overflow-hidden">
                {article.imageUrl && !imageError ? (
                    <img src={imageSrc} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={() => setImageError(true)} />
                ) : (
                     <div className="w-full h-full bg-black/5 dark:bg-white/5 flex items-center justify-center"><NewspaperIcon className="w-10 h-10 text-zinc-400 dark:text-zinc-500" /></div>
                )}
            </div>
            <div className="p-4 flex flex-col flex-grow justify-between">
                <div>
                    <p className="font-semibold text-zinc-900 dark:text-white line-clamp-3 leading-tight mb-2">{article.title}</p>
                </div>
                 <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 mt-auto">
                     <span className="truncate pr-2">{article.source}</span>
                     <span className="flex-shrink-0">{timeAgo(article.publishedDate)}</span>
                </div>
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReadHere(); }} className="mt-3 w-full flex items-center justify-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg py-2 transition-colors">
                    <BookOpenIcon className="w-4 h-4" />
                    <span>Read Here</span>
                </button>
            </div>
        </a>
    );
};

export default MainContent;