
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Feed, Selection, WidgetSettings, Article, ArticleView, Theme } from '../src/App';
import type { SourceType } from './AddSource';
import { MenuIcon, SearchIcon, SunIcon, MoonIcon, BookOpenIcon, SparklesIcon } from './icons';
import ReaderViewModal from './ReaderViewModal';
import { resilientFetch } from '../services/fetch';
import { parseRssXml } from '../services/rssParser';
import { fetchAllSportsData, getCachedSportsData, needsFreshSportsData } from '../services/sportsService';
import FeaturedStory from './articles/FeaturedStory';
import ArticleListItem from './articles/ArticleListItem';
import MagazineArticleListItem from './articles/MagazineArticleListItem';
import ImageWithProxy from './ImageWithProxy';
import { teamLogos } from '../services/teamLogos';

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

            const promises = feeds.filter(f => f && f.url).map(feed => 
                resilientFetch(feed.url, { timeout: 10000 })
                    .then(response => response.text())
                    .then(xmlText => parseRssXml(xmlText, feed.title, feed.url))
                    .catch(err => {
                        console.warn(`Failed to fetch or parse feed ${feed.title}:`, err.message);
                        return [];
                    })
            );

            try {
                const results = await Promise.all(promises);
                const allArticles = results.flat();
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
        if (cachedData) setSportsResults(cachedData);
        if (isInitialMount.current) {
            isInitialMount.current = false;
            if (needsFreshSportsData() || !cachedData) fetchSports();
        } else {
            fetchSports();
        }
    }, [widgetSettings.showSports, widgetSettings.sportsTeams, refreshKey]);

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

    const feedInfoMap = useMemo(() => new Map(allFeeds.map(feed => [feed.title, { iconUrl: feed.iconUrl, sourceType: feed.sourceType }])), [allFeeds]);

    const latestArticle = articleView !== 'featured' && filteredArticles.length > 0 ? filteredArticles[0] : null;
    const articlesToDisplay = articleView !== 'featured' ? filteredArticles.slice(1) : filteredArticles;
    const visibleArticlesToDisplay = articlesToDisplay.slice(0, visibleCount);

    return (
        <main className={`flex-grow overflow-y-auto ${animationClass} bg-zinc-950 pb-40 scroll-smooth`}>
            <Header onSearchSubmit={handleSearchSubmit} searchQuery={searchQuery} setSearchQuery={setSearchQuery} widgetSettings={widgetSettings} refreshKey={refreshKey} onOpenSidebar={onOpenSidebar} theme={theme} onToggleTheme={onToggleTheme} />
            <div className="px-4 md:px-8 pt-28 md:pt-24">
                 <h1 className="text-2xl md:text-3xl font-black text-white pb-6 tracking-tighter uppercase italic drop-shadow-lg">{pageTitle}</h1>
                
                {latestArticle && (
                    <div className="mb-8">
                        <FeaturedStory article={latestArticle} onReadHere={() => setReaderArticle(latestArticle)} onMarkAsRead={() => onMarkAsRead(latestArticle.id)} isRead={readArticleIds.has(latestArticle.id)} />
                    </div>
                )}
                
                <div className="mt-8">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                        <div className="flex items-center gap-4">
                            <h2 className="font-black text-lg text-white uppercase italic tracking-tighter">Recent Snacks</h2>
                            <UnreadFilterToggle checked={showOnlyUnread} onChange={setShowOnlyUnread} />
                        </div>
                        {sportsResults.size > 0 && <SportsCarousel results={sportsResults} isLoading={isSportsLoading} onTeamSelect={onSearch} />}
                    </div>

                    {loading && filteredArticles.length === 0 && <div className="text-center py-20 animate-pulse text-plant-500 font-black uppercase tracking-[0.3em] italic">Scanning Spores...</div>}
                    {error && <p className="text-center py-10 text-red-500 font-black uppercase italic tracking-widest">{error}</p>}
                    
                    <div className={articleView === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
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
                            if (articleView === 'grid') return <MagazineArticleListItem {...commonProps} sourceType={feedInfo?.sourceType} iconUrl={feedInfo?.iconUrl} />;
                            return <ArticleListItem {...commonProps} iconUrl={feedInfo?.iconUrl} sourceType={feedInfo?.sourceType} />;
                        })}
                    </div>

                    {articlesToDisplay.length > visibleCount && (
                        <div className="mt-12 text-center pb-20">
                            <button
                                onClick={() => setVisibleCount(c => c + ARTICLES_PER_PAGE)}
                                className="bg-plant-600 hover:bg-plant-500 text-black hover:scale-105 active:scale-95 font-black uppercase tracking-[0.2em] italic py-3 px-10 rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(34,197,94,0.3)] border-b-4 border-black/20"
                            >
                                Digest More
                            </button>
                        </div>
                    )}
                </div>
            </div>
             {readerArticle && <ReaderViewModal article={readerArticle} onClose={() => setReaderArticle(null)} onMarkAsRead={onMarkAsRead} />}
        </main>
    );
};

const Header: React.FC<any> = ({ onSearchSubmit, searchQuery, setSearchQuery, widgetSettings, refreshKey, onOpenSidebar, theme, onToggleTheme }) => (
    <header className="fixed top-0 left-0 md:left-72 right-0 z-30 p-4 md:p-6 pointer-events-none">
        <div className="w-full h-16 md:h-20 bg-zinc-900/80 backdrop-blur-3xl border border-white/5 rounded-[1.5rem] md:rounded-[2.5rem] shadow-[0_0_40px_rgba(0,0,0,0.5)] flex items-center justify-between px-6 pointer-events-auto ring-1 ring-white/5">
            <button onClick={onOpenSidebar} className="p-2 md:p-3 rounded-xl md:rounded-2xl text-zinc-400 hover:text-plant-500 hover:bg-zinc-800 transition-all"><MenuIcon className="w-6 h-6 md:w-7 md:h-7" /></button>
            <form onSubmit={onSearchSubmit} className="relative flex-grow mx-2 md:mx-10 max-w-xl">
                <SearchIcon className="w-4 h-4 md:w-5 md:h-5 text-zinc-500 absolute top-1/2 left-4 md:left-6 -translate-y-1/2" />
                <input 
                    type="search" 
                    placeholder="Hunting..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-black/40 border-2 border-transparent focus:border-plant-500/30 placeholder-zinc-600 text-white rounded-xl md:rounded-2xl py-2 md:py-3.5 pl-10 md:pl-14 pr-4 text-xs md:text-sm transition-all font-black uppercase italic tracking-widest outline-none"
                />
            </form>
            <div className="hidden lg:flex items-center gap-4">
                <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/5 group relative cursor-help">
                    <div className="w-2 h-2 rounded-full bg-plant-500 animate-pulse shadow-[0_0_8px_#22c55e]"></div>
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Auto-Save</span>
                    <div className="absolute top-full mt-2 right-0 w-48 p-2 bg-zinc-900 border border-white/10 rounded-xl text-[8px] font-bold text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
                        ALL CHANGES ROOTED AUTOMATICALLY TO LOCAL STORAGE.
                    </div>
                </div>
                {widgetSettings.showWeather && <WeatherDisplay location={widgetSettings.weatherLocation} refreshKey={refreshKey} />}
                <div className="w-px h-10 bg-zinc-800" />
                <button onClick={onToggleTheme} className="p-3 rounded-2xl text-zinc-400 hover:text-flesh-500 hover:bg-zinc-800 transition-all">
                    {theme === 'dark' ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
                </button>
            </div>
        </div>
    </header>
);

const WeatherDisplay: React.FC<any> = ({ location, refreshKey }) => {
    const [weather, setWeather] = useState<any>(null);
    useEffect(() => {
        const fetchWeather = async () => {
            if (!location) return;
            try {
                const response = await resilientFetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1`, { timeout: 10000 });
                const data = await response.json();
                if (data?.current_condition?.[0]) setWeather({ temp: data.current_condition[0].temp_C });
            } catch (e) {}
        };
        fetchWeather();
    }, [location, refreshKey]);
    if (!weather) return null;
    return (
        <div className="flex items-center gap-3 bg-black/40 px-5 py-2.5 rounded-2xl border border-white/5">
            <SunIcon className="w-6 h-6 text-flesh-500 animate-pulse" />
            <span className="font-black text-lg text-white italic">{weather.temp}°C</span>
        </div>
    );
};

const UnreadFilterToggle: React.FC<any> = ({ checked, onChange }) => (
    <label className="flex items-center cursor-pointer group bg-black/40 px-4 py-2 rounded-xl border border-white/5 transition-all hover:bg-zinc-900">
        <div className="relative">
            <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <div className={`block w-10 h-6 rounded-full transition-colors ${checked ? 'bg-plant-500' : 'bg-zinc-800'}`}></div>
            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-4' : ''} shadow-lg`}></div>
        </div>
        <span className="ml-3 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 group-hover:text-white transition-colors">Fresh</span>
    </label>
);

const SportsCarousel: React.FC<any> = ({ results, isLoading, onTeamSelect }) => (
    <div className="flex gap-4 overflow-x-auto scrollbar-hide -mr-4 pr-4">
        {Array.from(results.keys()).map((teamCode: any) => (
            <SportsCard key={teamCode} data={results.get(teamCode)} isLoading={isLoading} onSelect={onTeamSelect} />
        ))}
    </div>
);

const SportsCard: React.FC<any> = ({ data, isLoading, onSelect }) => {
    if (isLoading) return <div className="w-32 h-12 bg-zinc-900 rounded-xl animate-pulse flex-shrink-0" />;
    if (!data || !data.success) return null;
    return (
        <button onClick={() => onSelect(data.teamFullName)} className="px-4 py-2 bg-zinc-900 border border-white/5 rounded-xl flex items-center gap-3 hover:border-plant-500/50 transition-all shadow-xl">
            <div className="flex items-center gap-2">
                <TeamLogo name={data.homeTeam} badgeUrl={data.homeTeamBadge} />
                <span className="font-black text-lg text-white italic">{data.homeScore}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-zinc-800" />
            <div className="flex items-center gap-2">
                <span className="font-black text-lg text-white italic">{data.awayScore}</span>
                <TeamLogo name={data.awayTeam} badgeUrl={data.awayTeamBadge} />
            </div>
        </button>
    );
};

const TeamLogo = ({ name, badgeUrl }: any) => (
    <ImageWithProxy src={badgeUrl || teamLogos[name]} alt={name} className="w-6 h-6 object-contain" wrapperClassName="w-6 h-6" fallback={<div className="w-6 h-6 rounded-full bg-zinc-800" />} />
);

export default MainContent;
