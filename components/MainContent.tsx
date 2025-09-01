import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Feed, Selection, WidgetSettings, Article } from '../App';
import { CORS_PROXY, FALLBACK_PROXY } from '../App';
import { SeymourIcon, SearchIcon, SunIcon, SunriseIcon, SunsetIcon, PlusIcon, ArrowsRightLeftIcon, SettingsIcon, DotsHorizontalIcon, ArrowPathIcon, NewspaperIcon, RedditIcon, YoutubeIcon, BookOpenIcon } from './icons';
import { teamLogos } from '../services/teamLogos';
import { allTeamsMap } from '../services/sportsData';
import type { SourceType } from './AddSource';
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
                } catch (e) {
                    console.warn("Error parsing HTML content for image", e);
                }
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

const fetchWithTimeout = (resource: RequestInfo, options: RequestInit & { timeout?: number } = {}) => {
  const { timeout = 8000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const promise = fetch(resource, { ...options, signal: controller.signal });
  promise.finally(() => clearTimeout(id));
  return promise;
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
    onOpenSettings: () => void;
    onOpenAddSource: () => void;
    onAddSource: (url: string, type: SourceType) => Promise<void>;
    onOpenSidebar: () => void;
}

const MainContent: React.FC<MainContentProps> = (props) => {
    const { feedsToDisplay, selection, readArticleIds, bookmarkedArticleIds, onMarkAsRead, onSearch, allFeeds, refreshKey, onRefresh, widgetSettings, onOpenSettings, onOpenAddSource, onAddSource, onOpenSidebar } = props;
    
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [sportsResults, setSportsResults] = useState<Map<string, any>>(new Map());
    const [isSportsLoading, setIsSportsLoading] = useState(false);
    
    const [readerArticle, setReaderArticle] = useState<Article | null>(null);

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

            const fetchFeedWithFallback = async (feed: Feed) => {
                const options = { timeout: 10000 };
                try {
                    const response = await fetchWithTimeout(`${CORS_PROXY}${feed.url}`, options);
                    if (response.ok) return response;
                    console.warn(`Primary proxy failed for ${feed.title} with status: ${response.status}`);
                } catch(e) {
                    console.warn(`Primary proxy fetch failed for ${feed.title}:`, e);
                }
                console.log(`Trying fallback proxy for ${feed.title}`);
                return fetchWithTimeout(`${FALLBACK_PROXY}${encodeURIComponent(feed.url)}`, options);
            };

            const feedErrors: string[] = [];
            const promises = feeds.map(feed => 
                fetchFeedWithFallback(feed)
                    .then(response => {
                        if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for ${feed.title}`);
                        return response.text();
                    })
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
                    if (allArticles.length === 0) {
                        setError(`Failed to load all feeds. This could be a network issue or a problem with the CORS proxy. Please check your connection and try again.`);
                    } else {
                         setError(`Could not load some feeds: ${feedErrors.join(', ')}.`);
                    }
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
            if (!lastFetch) return true;
            return (Date.now() - parseInt(lastFetch, 10)) > 2 * 60 * 60 * 1000; // 2 hours
        };

        const fetchAllSportsData = async () => {
            setIsSportsLoading(true);
            const fetchTeamData = async (teamCode: string): Promise<{ team: string; result: any; }> => {
                const teamFullName = allTeamsMap.get(teamCode.toUpperCase()) || teamCode;
                try {
                    const teamSearchRes = await fetchWithTimeout(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(teamFullName)}`);
                    const teamSearchData = await teamSearchRes.json();
                    const teamInfo = teamSearchData.teams?.[0];
                    if (!teamInfo) throw new Error(`Team not found.`);

                    const lastEventsRes = await fetchWithTimeout(`https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${teamInfo.idTeam}`);
                    const lastEventsData = await lastEventsRes.json();
                    const lastMatch = lastEventsData.results?.[0];
                    if (!lastMatch) throw new Error('No last match data found.');

                    return { team: teamCode, result: { ...lastMatch, teamFullName: teamInfo.strTeam }};
                } catch (error) {
                    return { team: teamCode, result: { error: (error as Error).message } };
                }
            };
            
            const promises = widgetSettings.sportsTeams.map(team => fetchTeamData(team));
            const allResults = await Promise.all(promises);
            const newResults = new Map<string, any>();
            allResults.forEach(res => newResults.set(res.team, res.result));
            setSportsResults(newResults);
            localStorage.setItem(SPORTS_CACHE_KEY, JSON.stringify(Array.from(newResults.entries())));
            localStorage.setItem(LAST_SPORTS_FETCH_KEY, String(Date.now()));
            setIsSportsLoading(false);
        };

        const cachedData = localStorage.getItem(SPORTS_CACHE_KEY);
        if (cachedData) setSportsResults(new Map(JSON.parse(cachedData)));
        if (needsFreshData()) fetchAllSportsData();

    }, [widgetSettings.showSports, widgetSettings.sportsTeams, refreshKey]);

    const filteredArticles = useMemo(() => {
        let result = articles;
        if (selection.type === 'bookmarks') result = result.filter(a => bookmarkedArticleIds.has(a.id));
        else if (selection.type === 'search' && selection.query) {
             const filter = selection.query.toLowerCase();
             result = result.filter(a => a.title.toLowerCase().includes(filter) || a.snippet.toLowerCase().includes(filter));
        }
        return result;
    }, [articles, selection, bookmarkedArticleIds]);
    
    useEffect(() => {
        if (filteredArticles.length === 0) {
            return;
        }

        const preCache = (articlesToCache: Article[]) => {
            articlesToCache.forEach(article => {
                // Fire and forget, with silent error handling
                fetchAndCacheArticleContent(article).catch(error => {
                    console.warn(`Pre-caching silently failed for "${article.title}":`, error);
                });
            });
        };

        // Cache top 5 immediately
        const top5 = filteredArticles.slice(0, 5);
        preCache(top5);

        // Cache next 10 after a delay
        const timerId = setTimeout(() => {
            const next10 = filteredArticles.slice(5, 15);
            preCache(next10);
        }, 60000); // 60 seconds

        // Cleanup timeout on component unmount or when articles change
        return () => {
            clearTimeout(timerId);
        };
    }, [filteredArticles]);


    const feedInfoMap = useMemo(() => {
        return new Map(allFeeds.map(feed => [feed.title, { iconUrl: feed.iconUrl, sourceType: feed.sourceType }]));
    }, [allFeeds]);

    const latestArticle = filteredArticles.length > 0 ? filteredArticles[0] : null;

    return (
        <main className="flex-grow overflow-y-auto pb-24">
            <Header onSearchSubmit={handleSearchSubmit} searchQuery={searchQuery} setSearchQuery={setSearchQuery} widgetSettings={widgetSettings} refreshKey={refreshKey} onOpenSidebar={onOpenSidebar}/>
            <div className="px-4">
                {latestArticle && <FeaturedStory article={latestArticle} onReadHere={() => setReaderArticle(latestArticle)} onMarkAsRead={() => onMarkAsRead(latestArticle.id)} />}
                <ActionButtons onAdd={onOpenAddSource} onRefresh={onRefresh} onSettings={onOpenSettings} onManage={onOpenSidebar} />
                <div className="my-4">
                    <QuickAddSource onAddSource={onAddSource} />
                </div>
                <div className="mt-2">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-lg text-white">Recent</h2>
                        {sportsResults.size > 0 && <SportsCarousel results={sportsResults} isLoading={isSportsLoading} onTeamSelect={onSearch} />}
                    </div>
                    {loading && filteredArticles.length === 0 && <p>Loading articles...</p>}
                    {error && <p className="text-red-400">{error}</p>}
                    <div className="space-y-3">
                        {filteredArticles.slice(1).map(article => {
                            const feedInfo = feedInfoMap.get(article.source);
                            return (
                                <ArticleListItem 
                                    key={article.id} 
                                    article={article} 
                                    onMarkAsRead={() => onMarkAsRead(article.id)}
                                    onReadHere={() => setReaderArticle(article)}
                                    isRead={readArticleIds.has(article.id)}
                                    iconUrl={feedInfo?.iconUrl}
                                    sourceType={feedInfo?.sourceType}
                                />
                            );
                        })}
                    </div>
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

const Header: React.FC<{onSearchSubmit: (e: React.FormEvent) => void; searchQuery: string; setSearchQuery: (q: string) => void; widgetSettings: WidgetSettings; refreshKey: number; onOpenSidebar: () => void}> = ({ onSearchSubmit, searchQuery, setSearchQuery, widgetSettings, refreshKey, onOpenSidebar }) => (
    <header className="p-4 flex items-center justify-between">
        <button onClick={onOpenSidebar} className="p-1 bg-zinc-800 rounded-lg md:hidden"><SeymourIcon className="w-7 h-7" /></button>
        <form onSubmit={onSearchSubmit} className="relative flex-grow mx-4">
            <SearchIcon className="w-5 h-5 text-zinc-500 absolute top-1/2 left-3 -translate-y-1/2" />
            <input 
                type="search" 
                placeholder="Search" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-800/80 placeholder-zinc-500 text-white rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
        </form>
        {widgetSettings.showWeather && <WeatherDisplay location={widgetSettings.weatherLocation} refreshKey={refreshKey} />}
    </header>
);

const WeatherDisplay: React.FC<{ location: string, refreshKey: number }> = ({ location, refreshKey }) => {
    const [weather, setWeather] = useState<{temp: number; sunrise: string; sunset: string} | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        const fetchWeather = async () => {
            if (!location) return;
            try {
                const timeoutId = setTimeout(() => controller.abort(), 10000);
                const response = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1`, { signal: controller.signal });
                clearTimeout(timeoutId);
                if (!response.ok) throw new Error(`Data not found.`);
                const data = await response.json();
                const current = data.current_condition[0];
                const astronomy = data.weather[0].astronomy[0];
                setWeather({ temp: parseInt(current.temp_C, 10), sunrise: astronomy.sunrise, sunset: astronomy.sunset });
            } catch (e) {
                if ((e as Error).name !== 'AbortError') {
                    console.error("Failed to fetch weather:", e);
                }
            }
        };

        fetchWeather();
        return () => controller.abort();
    }, [location, refreshKey]);

    const formatTime = (timeStr?: string) => {
        if (!timeStr) return '';
        return timeStr.replace(/(\d{1,2}:\d{2}) [AP]M/, '$1').trim();
    }

    if (!weather) return <div className="flex items-center gap-2 text-sm w-28 h-8 justify-end" />;
    
    return (
        <div className="flex items-center gap-2 text-sm text-zinc-400">
            <div className="flex flex-col items-center">
                <SunIcon className="w-5 h-5 text-yellow-400" />
                <span className="text-xs">{weather.temp}°C</span>
            </div>
            <div className="flex flex-col items-center text-xs">
                <SunriseIcon className="w-4 h-4" />
                <span>{formatTime(weather.sunrise)}</span>
            </div>
            <div className="flex flex-col items-center text-xs">
                <SunsetIcon className="w-4 h-4" />
                <span>{formatTime(weather.sunset)}</span>
            </div>
        </div>
    );
};

const ModernVectorFallback: React.FC = () => (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900">
        <svg className="absolute inset-0 w-full h-full text-white/5" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M-200 300 C-100 100, 100 500, 500 200 S 800 -100, 1200 200" stroke="currentColor" strokeWidth="2"/>
            <path d="M-150 400 C-50 200, 150 600, 550 300 S 850 0, 1250 300" stroke="currentColor" strokeWidth="2"/>
            <path d="M-100 500 C0 300, 200 700, 600 400 S 900 100, 1300 400" stroke="currentColor" strokeWidth="2"/>
        </svg>
    </div>
);

const FeaturedStory: React.FC<{article: Article; onReadHere: () => void; onMarkAsRead: () => void;}> = ({ article, onReadHere, onMarkAsRead }) => {
    const [imageError, setImageError] = useState(false);
    const hasImage = article.imageUrl && !imageError;

    useEffect(() => {
        setImageError(false);
    }, [article.imageUrl]);
    
    return (
        <div className="p-6 rounded-3xl text-white shadow-lg relative overflow-hidden h-48 flex flex-col justify-end bg-zinc-800">
            {hasImage ? (
                <>
                    <img 
                        src={`${CORS_PROXY}${encodeURIComponent(article.imageUrl)}`}
                        alt={article.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={() => setImageError(true)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </>
            ) : (
                <ModernVectorFallback />
            )}
            
            <div className="relative z-10">
                <p className="text-sm font-semibold opacity-80">{article.source}</p>
                <h1 className="text-2xl font-bold my-1 line-clamp-2 leading-tight">{article.title}</h1>
                 <div className="flex items-center gap-2 mt-2">
                    <a href={article.link} target="_blank" rel="noopener noreferrer" onClick={onMarkAsRead} className="inline-block bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold py-2 px-4 rounded-full text-sm transition-colors">
                        Read Original
                    </a>
                    <button onClick={onReadHere} className="inline-flex items-center gap-2 bg-orange-600/80 hover:bg-orange-600/100 backdrop-blur-sm text-white font-semibold py-2 px-4 rounded-full text-sm transition-colors">
                        <BookOpenIcon className="w-4 h-4" />
                        <span>Read Here</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const ActionButtons: React.FC<{ onAdd: () => void; onRefresh: () => void; onSettings: () => void; onManage: () => void; }> = ({ onAdd, onRefresh, onSettings, onManage }) => {
    const Button: React.FC<{icon: React.ReactNode; label: string; onClick?: () => void;}> = ({ icon, label, onClick }) => (
        <button onClick={onClick} className="flex flex-col items-center gap-2 text-zinc-300 hover:text-white transition-colors">
            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center">{icon}</div>
            <span className="text-xs font-semibold">{label}</span>
        </button>
    );
    return (
        <div className="flex justify-around items-center py-4">
            <Button icon={<PlusIcon className="w-6 h-6" />} label="Add" onClick={onAdd} />
            <Button icon={<ArrowPathIcon className="w-6 h-6" />} label="Refresh" onClick={onRefresh} />
            <Button icon={<SettingsIcon className="w-6 h-6" />} label="Settings" onClick={onSettings} />
            <Button icon={<ArrowsRightLeftIcon className="w-6 h-6" />} label="Manage" onClick={onManage} />
        </div>
    );
};

const QuickAddSource: React.FC<{ onAddSource: (url: string, type: SourceType) => Promise<void> }> = ({ onAddSource }) => {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedUrl = url.trim();
        if (!trimmedUrl) return;

        let sourceType: SourceType | null = null;
        if (trimmedUrl.includes('youtube.com') || trimmedUrl.includes('youtu.be')) {
            sourceType = 'youtube';
        } else if (trimmedUrl.includes('reddit.com')) {
            sourceType = 'reddit';
        }

        if (!sourceType) {
            setError('Please enter a valid YouTube or Reddit URL.');
            setTimeout(() => setError(null), 5000);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            await onAddSource(trimmedUrl, sourceType);
            setUrl('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            setTimeout(() => setError(null), 5000);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <form onSubmit={handleSubmit} className="relative">
                <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Paste YouTube or Reddit URL"
                    disabled={isLoading}
                    className="w-full bg-zinc-800 border border-zinc-700 placeholder-zinc-500 text-white rounded-lg py-2.5 pl-4 pr-28 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-70"
                />
                <button
                    type="submit"
                    disabled={isLoading}
                    className="absolute inset-y-0 right-0 flex items-center pr-2"
                >
                    <span className="bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-md px-4 py-1.5 text-xs disabled:opacity-50 disabled:cursor-wait transition-colors">
                        {isLoading ? 'Adding...' : 'Add Feed'}
                    </span>
                </button>
            </form>
            {error && <p className="text-red-400 text-xs mt-2 ml-1">{error}</p>}
        </div>
    );
};


const ArticleListItem: React.FC<{
    article: Article;
    onMarkAsRead: () => void;
    onReadHere: () => void;
    isRead: boolean;
    iconUrl?: string;
    sourceType?: SourceType;
}> = ({ article, onMarkAsRead, onReadHere, isRead, iconUrl, sourceType }) => {
    const [imageError, setImageError] = useState(!article.imageUrl);
    const [iconError, setIconError] = useState(!iconUrl);

    useEffect(() => {
        setImageError(!article.imageUrl);
    }, [article.imageUrl]);

    useEffect(() => {
        setIconError(!iconUrl);
    }, [iconUrl]);

    const FallbackDisplay = () => {
        if (!iconError && iconUrl) {
            return <img src={iconUrl} alt={`${article.source} logo`} className="w-8 h-8 rounded-md object-contain" onError={() => setIconError(true)} />;
        }
        if (sourceType === 'reddit') return <RedditIcon className="w-8 h-8 text-orange-500" />;
        if (sourceType === 'youtube') return <YoutubeIcon className="w-8 h-8 text-red-500" />;
        return <NewspaperIcon className="w-8 h-8 text-zinc-600" />;
    };

    const handleReadHereClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onReadHere();
    };

    return (
        <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onMarkAsRead}
            className={`flex items-stretch gap-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-700/50 transition-colors overflow-hidden h-32 ${isRead ? 'opacity-50' : ''}`}
        >
            <div className="flex-grow flex flex-col p-4 justify-between overflow-hidden">
                <div>
                    <p className="font-semibold text-white line-clamp-3 leading-tight">{article.title}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <div className="flex items-center gap-1.5 min-w-0">
                        {!iconError ? (
                            <img src={iconUrl} alt="" className="w-4 h-4 rounded-sm flex-shrink-0" onError={() => setIconError(true)} />
                        ) : (
                            <NewspaperIcon className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                        )}
                        <span className="truncate">{article.source}</span>
                    </div>
                    <span className="text-zinc-600 flex-shrink-0">&middot;</span>
                    <span className="text-zinc-500 flex-shrink-0">{timeAgo(article.publishedDate)}</span>
                    <span className="text-zinc-600 flex-shrink-0">&middot;</span>
                    <button onClick={handleReadHereClick} className="flex items-center gap-1 text-zinc-400 hover:text-orange-400 transition-colors">
                        <BookOpenIcon className="w-4 h-4" />
                        <span>Read</span>
                    </button>
                </div>
            </div>
            {article.imageUrl && !imageError ? (
                <div className="w-32 flex-shrink-0">
                    <img
                        src={`${CORS_PROXY}${encodeURIComponent(article.imageUrl)}`}
                        alt=""
                        aria-hidden="true"
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                    />
                </div>
            ) : (
                <div className="w-32 flex-shrink-0 bg-zinc-800/25 flex items-center justify-center">
                    <FallbackDisplay />
                </div>
            )}
        </a>
    );
};


const SportsCarousel: React.FC<{ results: Map<string, any>; isLoading: boolean; onTeamSelect: (teamName: string) => void; }> = ({ results, isLoading, onTeamSelect }) => (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {Array.from(results.keys()).map(teamCode => (
            <SportsCard key={teamCode} teamCode={teamCode} data={results.get(teamCode)} isLoading={isLoading} onSelect={onTeamSelect} />
        ))}
    </div>
);

const SportsCard: React.FC<{ teamCode: string; data: any; isLoading: boolean; onSelect: (teamName: string) => void; }> = ({ teamCode, data, isLoading, onSelect }) => {
    if (isLoading) return <div className="w-28 h-12 bg-zinc-800 rounded-lg animate-pulse flex-shrink-0" />;
    if (!data || data.error) return null;
    
    const TeamLogo = ({ name }: { name: string }) => {
        const logoUrl = getTeamLogo(name);
        if (!logoUrl) return <div className="w-4 h-4 rounded-full bg-zinc-600" />;
        return <img src={logoUrl} alt={`${name} logo`} className="w-4 h-4 object-contain" />;
    };

    const handleSelect = () => {
        if (data.teamFullName) {
            onSelect(data.teamFullName);
        }
    };
    
    return (
        <button
            onClick={handleSelect}
            className="p-2 bg-zinc-800 rounded-lg w-auto flex-shrink-0 flex items-center gap-2 text-xs hover:bg-zinc-700 transition-colors"
        >
            <TeamLogo name={data.strHomeTeam} />
            <span className="font-bold text-white">{data.intHomeScore}</span>
            <span>-</span>
            <span className="font-bold text-white">{data.intAwayScore}</span>
            <TeamLogo name={data.strAwayTeam} />
        </button>
    );
};


export default MainContent;
