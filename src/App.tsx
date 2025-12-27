import React, { useState, useEffect, useCallback, useMemo } from 'react';
import MainContent from '../components/MainContent';
import type { SourceType } from '../components/AddSource';
import SettingsModal from '../components/SettingsModal';
import AddSourceModal from '../components/AddSourceModal';
import Sidebar from '../components/Sidebar';
import BottomNavBar from '../components/BottomNavBar';
import GameHubPage from '../components/GameHubPage';
import DailyUplinkPage from '../components/DailyUplinkPage';
import { resilientFetch } from '../services/fetch';
import { useLocalStorage } from '../hooks/useLocalStorage';

export interface Folder {
  id: number;
  name: string;
}

export interface Feed {
  id: number;
  url: string;
  title: string;
  iconUrl: string;
  folderId: number | null;
  sourceType?: SourceType;
}

export interface Article {
    id: string;
    title: string;
    link: string;
    source: string;
    publishedDate: Date | null;
    snippet: string;
    imageUrl: string | null;
}

export type Selection = {
  type: 'all' | 'folder' | 'bookmarks' | 'search' | 'feed' | 'reddit' | 'game_hub' | 'daily_uplink';
  id: string | number | null;
  query?: string;
};

export type Theme = 'light' | 'dark';
export type ArticleView = 'list' | 'grid' | 'featured';

export interface WidgetSettings {
    showWeather: boolean;
    showSports: boolean;
    showFinance: boolean;
    weatherLocation: string;
    sportsTeams: string[];
}

export interface Settings {
    feeds: Feed[];
    folders: Folder[];
    theme: Theme;
    articleView: ArticleView;
    widgets: WidgetSettings;
}

export type SudokuDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert';

export type SudokuDifficultyStats = {
  fastestTime: number | null;
  gamesPlayed: number;
  totalTimePlayed: number;
};

export interface SudokuStats {
  dailyStreak: number;
  lastDailyCompletionDate: string | null;
  totalWins: number;
  easy: SudokuDifficultyStats;
  medium: SudokuDifficultyStats;
  hard: SudokuDifficultyStats;
  expert: SudokuDifficultyStats;
}

export interface SolitaireStats {
  gamesPlayed: number;
  gamesWon: number;
  fastestTime: number | null;
  lowestMoves: number | null;
  currentStreak: number;
  maxStreak: number;
  lastGameWasWin: boolean;
}

export interface SolitaireSettings {
  drawCount: 1 | 3;
  theme: {
    cardBack: string;
    background: string;
  } | null;
}

const GUEST_USER_ID = 'survivor';
const READ_ARTICLES_KEY = `void_read_articles_${GUEST_USER_ID}`;
const BOOKMARKED_ARTICLES_KEY = `void_bookmarked_articles_${GUEST_USER_ID}`;
const ARTICLE_TAGS_KEY = `void_article_tags_${GUEST_USER_ID}`;
const FEEDS_KEY = `void_feeds_${GUEST_USER_ID}`;
const FOLDERS_KEY = `void_folders_${GUEST_USER_ID}`;
const THEME_KEY = `void_theme_${GUEST_USER_ID}`;
const ARTICLE_VIEW_KEY = `void_article_view_${GUEST_USER_ID}`;
const WIDGET_SETTINGS_KEY = `void_widget_settings_${GUEST_USER_ID}`;
const SUDOKU_STATS_KEY = `void_sudoku_stats_${GUEST_USER_ID}`;
const SOLITAIRE_STATS_KEY = `void_solitaire_stats_${GUEST_USER_ID}`;
const SOLITAIRE_SETTINGS_KEY = `void_solitaire_settings_${GUEST_USER_ID}`;
const SELECTION_KEY = `void_selection_${GUEST_USER_ID}`;
const UPTIME_KEY = `void_uptime_${GUEST_USER_ID}`;
const LAST_UPLINK_KEY = `void_last_uplink_date_${GUEST_USER_ID}`;

const defaultFolders: Folder[] = [
    { id: 1, name: 'Primary Channels' },
    { id: 2, name: 'Tech Uplinks' },
    { id: 3, name: 'Arena Intel' },
];

const defaultFeeds: Feed[] = [
    { id: 1, url: 'https://feeds.bbci.co.uk/news/world/rss.xml', title: 'BBC World News', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=bbc.co.uk', folderId: 1, sourceType: 'rss' },
    { id: 2, url: 'https://www.theguardian.com/world/rss', title: 'The Guardian', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=theguardian.com', folderId: 1, sourceType: 'rss' },
    { id: 4, url: 'https://www.wired.com/feed/rss', title: 'Wired', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=wired.com', folderId: 2, sourceType: 'rss' },
    { id: 34, url: 'https://feeds.bbci.co.uk/sport/rss.xml', title: 'BBC Sport', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=bbc.co.uk', folderId: 3, sourceType: 'rss' },
    { id: 22, url: 'https://www.reddit.com/r/TheCivilService/.rss', title: 'r/TheCivilService', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=reddit.com', folderId: null, sourceType: 'reddit' },
];

const defaultWidgetSettings: WidgetSettings = {
    showWeather: true,
    showSports: true,
    showFinance: false,
    weatherLocation: 'London',
    sportsTeams: ['MUN', 'LIV', 'MCI', 'ARS'],
};

const defaultSudokuStats: SudokuStats = {
  dailyStreak: 0,
  lastDailyCompletionDate: null,
  totalWins: 0,
  easy: { fastestTime: null, gamesPlayed: 0, totalTimePlayed: 0 },
  medium: { fastestTime: null, gamesPlayed: 0, totalTimePlayed: 0 },
  hard: { fastestTime: null, gamesPlayed: 0, totalTimePlayed: 0 },
  expert: { fastestTime: null, gamesPlayed: 0, totalTimePlayed: 0 },
};

const defaultSolitaireStats: SolitaireStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  fastestTime: null,
  lowestMoves: null,
  currentStreak: 0,
  maxStreak: 0,
  lastGameWasWin: false,
};

const defaultSolitaireSettings: SolitaireSettings = {
  drawCount: 1,
  theme: null,
};

const App: React.FC = () => {
    const [theme, setTheme] = useLocalStorage<Theme>(THEME_KEY, 'dark');
    const [articleView, setArticleView] = useLocalStorage<ArticleView>(ARTICLE_VIEW_KEY, 'list');
    const [widgetSettings, setWidgetSettings] = useLocalStorage<WidgetSettings>(WIDGET_SETTINGS_KEY, defaultWidgetSettings);
    const [folders, setFolders] = useLocalStorage<Folder[]>(FOLDERS_KEY, defaultFolders);
    const [feeds, setFeeds] = useLocalStorage<Feed[]>(FEEDS_KEY, defaultFeeds);
    const [readArticleIds, setReadArticleIds] = useLocalStorage<Set<string>>(READ_ARTICLES_KEY, () => new Set());
    const [bookmarkedArticleIds, setBookmarkedArticleIds] = useLocalStorage<Set<string>>(BOOKMARKED_ARTICLES_KEY, () => new Set());
    const [articleTags, setArticleTags] = useLocalStorage<Map<string, Set<string>>>(ARTICLE_TAGS_KEY, () => new Map());
    const [sudokuStats, setSudokuStats] = useLocalStorage<SudokuStats>(SUDOKU_STATS_KEY, defaultSudokuStats);
    const [solitaireStats, setSolitaireStats] = useLocalStorage<SolitaireStats>(SOLITAIRE_STATS_KEY, defaultSolitaireStats);
    const [solitaireSettings, setSolitaireSettings] = useLocalStorage<SolitaireSettings>(SOLITAIRE_SETTINGS_KEY, defaultSolitaireSettings);
    const [uptime, setUptime] = useLocalStorage<number>(UPTIME_KEY, 0);
    const [lastUplinkDate, setLastUplinkDate] = useLocalStorage<string | null>(LAST_UPLINK_KEY, null);

    const [selection, setSelection] = useLocalStorage<Selection>(SELECTION_KEY, () => {
        const today = new Date().toISOString().split('T')[0];
        const savedUplink = localStorage.getItem(LAST_UPLINK_KEY);
        if (savedUplink !== JSON.stringify(today)) {
            return { type: 'daily_uplink', id: null };
        }
        return { type: 'all', id: null };
    });

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(() => Date.now());

    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'light') {
            root.classList.remove('dark');
            root.classList.add('light');
        } else {
            root.classList.remove('light');
            root.classList.add('dark');
        }
    }, [theme]);

    const handleToggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const handleMarkAsRead = (id: string) => {
        if (!readArticleIds.has(id)) {
            setReadArticleIds(prev => new Set(prev).add(id));
            setUptime(f => Math.min(100, f + 5)); 
        }
    };

    const handlePurgeBuffer = (articleIds: string[]) => {
        setReadArticleIds(prev => new Set([...Array.from(prev), ...articleIds]));
        setUptime(100);
    };

    const handleSelectFromSidebar = (sel: Selection) => {
        setSelection(sel);
        setIsSidebarOpen(false);
    };

    const handleReturnToFeeds = useCallback(() => {
        setSelection({ type: 'all', id: null });
        setLastUplinkDate(new Date().toISOString().split('T')[0]);
    }, [setSelection, setLastUplinkDate]);

    const handleEnterArcade = useCallback(() => {
        setSelection({ type: 'game_hub', id: null });
        setLastUplinkDate(new Date().toISOString().split('T')[0]);
    }, [setSelection, setLastUplinkDate]);

    const handleAddSource = async (url: string, type: SourceType) => {
        let feedUrl = url.trim();
        const normalizeUrl = (u: string) => u.toLowerCase().replace(/\/$/, "");
        
        try {
            if (type === 'reddit') {
                const match = url.trim().match(/reddit\.com\/(r\/[a-zA-Z0-9_]+|user\/[a-zA-Z0-9_-]+)/);
                feedUrl = match ? `https://www.reddit.com/${match[1]}/.rss` : `${url.trim().replace(/\/$/, '')}/.rss`;
            }

            const existingFeed = feeds.find(f => normalizeUrl(f.url) === normalizeUrl(feedUrl));
            if (existingFeed) {
                setSelection({ type: 'feed', id: existingFeed.id });
                setIsSidebarOpen(false);
                setIsAddSourceModalOpen(false);
                return;
            }

            const response = await resilientFetch(feedUrl);
            const text = await response.text();
            const xml = new DOMParser().parseFromString(text, "application/xml");
            const feedTitle = xml.querySelector('channel > title, feed > title')?.textContent || new URL(url).hostname;
            const siteLink = xml.querySelector('channel > link')?.textContent || url;
            const iconUrl = `https://www.google.com/s2/favicons?sz=32&domain_url=${new URL(siteLink).hostname}`;
            
            setFeeds(prev => [...prev, { id: Date.now(), title: feedTitle, url: feedUrl, iconUrl, folderId: null, sourceType: type }]);
        } catch (error) {
            console.error("Failed to add source:", error);
            throw error;
        }
    };

    const handleSudokuWin = useCallback((difficulty: SudokuDifficulty, time: number, isDaily: boolean) => {
      setSudokuStats(prev => {
        const newStats = { ...prev };
        newStats.totalWins += 1;
        const diffKey = difficulty.toLowerCase() as keyof Omit<SudokuStats, 'dailyStreak' | 'lastDailyCompletionDate' | 'totalWins'>;
        const diffStats = newStats[diffKey];
        diffStats.gamesPlayed += 1;
        diffStats.totalTimePlayed += time;
        if (diffStats.fastestTime === null || time < diffStats.fastestTime) diffStats.fastestTime = time;
        if (isDaily) {
          const today = new Date().toISOString().split('T')[0];
          if (prev.lastDailyCompletionDate !== today) {
            const yesterday = new Date(Date.now() - 864e5).toISOString().split('T')[0];
            newStats.dailyStreak = (prev.lastDailyCompletionDate === yesterday) ? prev.dailyStreak + 1 : 1;
            newStats.lastDailyCompletionDate = today;
          }
        }
        return newStats;
      });
      setUptime(f => Math.min(100, f + 15));
    }, [setSudokuStats, setUptime]);

    const handleSolitaireWin = useCallback((time: number, moves: number) => {
      setSolitaireStats(prev => {
        if (prev.lastGameWasWin) return prev;
        const newStats = { ...prev, gamesWon: prev.gamesWon + 1, currentStreak: prev.currentStreak + 1, lastGameWasWin: true };
        if (newStats.currentStreak > newStats.maxStreak) newStats.maxStreak = newStats.currentStreak;
        if (newStats.fastestTime === null || time < newStats.fastestTime) newStats.fastestTime = time;
        if (newStats.lowestMoves === null || moves < newStats.lowestMoves) newStats.lowestMoves = moves;
        return newStats;
      });
      setUptime(f => Math.min(100, f + 25));
    }, [setSolitaireStats, setUptime]);

    const pageTitle = useMemo(() => {
        if (selection.type === 'search') return `SEARCHING: "${selection.query}"`;
        if (selection.type === 'bookmarks') return 'SAVED PACKETS';
        if (selection.type === 'game_hub') return 'DARK ARCADE';
        if (selection.type === 'daily_uplink') return 'UPLINK SEQUENCE';
        if (selection.type === 'feed') return feeds.find(f => f.id === selection.id)?.title || 'Feed';
        if (selection.type === 'folder') return folders.find(f => f.id === selection.id)?.name || 'Folder';
        return 'SURVEILLANCE LOG';
    }, [selection, feeds, folders]);

    const isGameActive = selection.type === 'game_hub' || selection.type === 'daily_uplink';

    return (
        <div className="h-screen font-sans text-sm relative flex flex-col md:flex-row overflow-hidden bg-void-950">
            <Sidebar
                feeds={feeds}
                folders={folders}
                selection={selection}
                onAddSource={handleAddSource}
                onRemoveFeed={(id) => setFeeds(f => f.filter(x => x.id !== id))}
                onSelect={handleSelectFromSidebar}
                onAddFolder={(n) => setFolders(f => [...f, {id: Date.now(), name: n}])}
                onRenameFolder={(id, n) => setFolders(f => f.map(x => x.id === id ? {...x, name: n} : x))}
                onDeleteFolder={(id) => { setFolders(f => f.filter(x => x.id !== id)); setFeeds(fe => fe.map(x => x.folderId === id ? {...x, folderId: null} : x)); }}
                onMoveFeedToFolder={(fid, fldid) => setFeeds(fe => fe.map(x => x.id === fid ? {...x, folderId: fldid} : x))}
                isSidebarOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
            />
            
            <div className="flex-1 flex flex-col min-w-0 md:pl-72 relative pb-20 md:pb-0 h-full overflow-hidden">
                {selection.type === 'daily_uplink' ? (
                   <DailyUplinkPage 
                      feeds={feeds} 
                      onComplete={handleReturnToFeeds} 
                      onEnterArcade={handleEnterArcade}
                      onSelectGame={(id) => setSelection({type: 'game_hub', id: null})} 
                      uptime={uptime}
                   />
                ) : selection.type === 'game_hub' ? (
                    <div className="flex-1 min-h-0 h-full overflow-hidden">
                        <GameHubPage
                            sudokuStats={sudokuStats}
                            onSudokuWin={handleSudokuWin}
                            onSudokuLoss={() => setSudokuStats(defaultSudokuStats)}
                            solitaireStats={solitaireStats}
                            onSolitaireWin={handleSolitaireWin}
                            onSolitaireStart={() => setSolitaireStats(s => ({...s, gamesPlayed: s.gamesPlayed + 1, lastGameWasWin: false}))}
                            solitaireSettings={solitaireSettings}
                            onUpdateSolitaireSettings={setSolitaireSettings}
                            onReturnToFeeds={handleReturnToFeeds}
                            uptime={uptime}
                            setUptime={setUptime}
                        />
                    </div>
                ) : (
                    <MainContent
                        key={selection.type + String(selection.id)}
                        animationClass="animate-fade-in"
                        pageTitle={pageTitle}
                        onSearch={(query: string) => setSelection({ type: 'search', id: null, query })}
                        feedsToDisplay={selection.type === 'folder' ? feeds.filter(f => f.folderId === selection.id) : (selection.type === 'feed' ? feeds.filter(f => f.id === selection.id) : feeds)}
                        selection={selection}
                        readArticleIds={readArticleIds}
                        bookmarkedArticleIds={bookmarkedArticleIds}
                        articleTags={articleTags}
                        onMarkAsRead={handleMarkAsRead}
                        onPurgeBuffer={handlePurgeBuffer}
                        onMarkAsUnread={(id) => setReadArticleIds(prev => { const n = new Set(prev); n.delete(id); return n; })}
                        onMarkMultipleAsRead={(ids) => setReadArticleIds(prev => new Set([...prev, ...ids]))}
                        onToggleBookmark={(id) => setBookmarkedArticleIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; })}
                        onSetArticleTags={(id, t) => setArticleTags(prev => { const n = new Map(prev); if (t.size === 0) n.delete(id); else n.set(id, t); return n; })}
                        allFeeds={feeds}
                        refreshKey={lastRefresh}
                        onRefresh={() => setLastRefresh(Date.now())}
                        widgetSettings={widgetSettings}
                        articleView={articleView}
                        theme={theme}
                        onToggleTheme={handleToggleTheme}
                        onOpenSettings={() => setIsSettingsModalOpen(true)}
                        onOpenAddSource={() => setIsAddSourceModalOpen(true)}
                        onAddSource={handleAddSource}
                        onOpenSidebar={() => setIsSidebarOpen(true)}
                        uptime={uptime}
                    />
                )}
            </div>

            {!isGameActive && <BottomNavBar selection={selection} onSelect={handleSelectFromSidebar} />}

            <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                settings={{ feeds, folders, theme, articleView, widgets: widgetSettings }}
                onUpdateSettings={(s) => {
                    if (s.theme) setTheme(s.theme);
                    if (s.articleView) setArticleView(s.articleView);
                    if (s.widgets) setWidgetSettings(s.widgets);
                }}
                onImportOpml={() => {}}
                onExportOpml={() => {}}
                onImportSettings={() => {}}
                onExportSettings={() => {}}
            />
            <AddSourceModal
                isOpen={isAddSourceModalOpen}
                onClose={() => setIsAddSourceModalOpen(false)}
                onAddSource={handleAddSource}
            />
        </div>
    );
};

export default App;