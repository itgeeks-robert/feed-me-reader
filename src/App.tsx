
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import MainContent from '../components/MainContent';
import type { SourceType } from '../components/AddSource';
import SettingsModal from '../components/SettingsModal';
import AddSourceModal from '../components/AddSourceModal';
import Sidebar from '../components/Sidebar';
import BottomNavBar from '../components/BottomNavBar';
import GameHubPage from '../components/GameHubPage';
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
  type: 'all' | 'folder' | 'bookmarks' | 'search' | 'feed' | 'reddit' | 'youtube' | 'game_hub';
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

const GUEST_USER_ID = 'guest';
const READ_ARTICLES_KEY = `feedme_read_articles_${GUEST_USER_ID}`;
const BOOKMARKED_ARTICLES_KEY = `feedme_bookmarked_articles_${GUEST_USER_ID}`;
const ARTICLE_TAGS_KEY = `feedme_article_tags_${GUEST_USER_ID}`;
const FEEDS_KEY = `feedme_feeds_${GUEST_USER_ID}`;
const FOLDERS_KEY = `feedme_folders_${GUEST_USER_ID}`;
const THEME_KEY = `feedme_theme_${GUEST_USER_ID}`;
const ARTICLE_VIEW_KEY = `feedme_article_view_${GUEST_USER_ID}`;
const WIDGET_SETTINGS_KEY = `feedme_widget_settings_${GUEST_USER_ID}`;
const SUDOKU_STATS_KEY = `feedme_sudoku_stats_${GUEST_USER_ID}`;
const SOLITAIRE_STATS_KEY = `feedme_solitaire_stats_${GUEST_USER_ID}`;
const SOLITAIRE_SETTINGS_KEY = `feedme_solitaire_settings_${GUEST_USER_ID}`;
const SELECTION_KEY = `feedme_selection_${GUEST_USER_ID}`;

const defaultFolders: Folder[] = [
    { id: 1, name: 'Main Feeds' },
    { id: 2, name: 'Tech Spores' },
    { id: 3, name: 'Arena Scores' },
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
    const [selection, setSelection] = useLocalStorage<Selection>(SELECTION_KEY, { type: 'game_hub', id: null });

    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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

    const handleSelectFromSidebar = (sel: Selection) => {
        setSelection(sel);
        setIsSidebarOpen(false);
    };

    const handleReturnToFeeds = useCallback(() => {
        setSelection({ type: 'all', id: null });
    }, [setSelection]);

    const handleAddSource = async (url: string, type: SourceType) => {
        let feedUrl = url;
        let originalUrl = url;
        try {
            if (type === 'youtube') {
                const playlistIdMatch = url.match(/list=([a-zA-Z0-9_-]+)/);
                if (playlistIdMatch?.[1]) {
                    feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistIdMatch[1]}`;
                } else {
                    const response = await resilientFetch(url.split('?')[0]);
                    const text = await response.text();
                    const canonicalMatch = text.match(/<link rel="canonical" href="https:\/\/www.youtube.com\/channel\/([a-zA-Z0-9_-]+)"/);
                    const channelId = canonicalMatch?.[1] || text.match(/"channelId":"([a-zA-Z0-9_-]+)"/)?.[1] || null;
                    if (!channelId) throw new Error('Could not find a valid YouTube channel ID.');
                    feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${channelId.replace(/^UC/, 'UU')}`;
                }
            } else if (type === 'reddit') {
                const match = url.trim().match(/reddit\.com\/(r\/[a-zA-Z0-9_]+|user\/[a-zA-Z0-9_-]+)/);
                feedUrl = match ? `https://www.reddit.com/${match[1]}/.rss` : `${url.trim().replace(/\/$/, '')}/.rss`;
            }

            if (feeds.some(feed => feed.url === feedUrl)) throw new Error("Source already exists.");

            const response = await resilientFetch(feedUrl);
            const text = await response.text();
            const xml = new DOMParser().parseFromString(text, "application/xml");
            const feedTitle = xml.querySelector('channel > title, feed > title')?.textContent || new URL(originalUrl).hostname;
            const siteLink = xml.querySelector('channel > link')?.textContent || originalUrl;
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
    }, [setSudokuStats]);

    const handleSolitaireWin = useCallback((time: number, moves: number) => {
      setSolitaireStats(prev => {
        if (prev.lastGameWasWin) return prev;
        const newStats = { ...prev, gamesWon: prev.gamesWon + 1, currentStreak: prev.currentStreak + 1, lastGameWasWin: true };
        if (newStats.currentStreak > newStats.maxStreak) newStats.maxStreak = newStats.currentStreak;
        if (newStats.fastestTime === null || time < newStats.fastestTime) newStats.fastestTime = time;
        if (newStats.lowestMoves === null || moves < newStats.lowestMoves) newStats.lowestMoves = moves;
        return newStats;
      });
    }, [setSolitaireStats]);

    const pageTitle = useMemo(() => {
        if (selection.type === 'search') return `Hunting: "${selection.query}"`;
        if (selection.type === 'bookmarks') return 'Saved Snacks';
        if (selection.type === 'game_hub') return 'The Feeding Pit';
        if (selection.type === 'feed') return feeds.find(f => f.id === selection.id)?.title || 'Feed';
        if (selection.type === 'folder') return folders.find(f => f.id === selection.id)?.name || 'Folder';
        return 'FEED ME!';
    }, [selection, feeds, folders]);

    return (
        <div className="h-screen font-sans text-sm relative flex flex-col md:flex-row overflow-hidden bg-zinc-950">
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
                {selection.type === 'game_hub' ? (
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
                        onMarkAsRead={(id) => setReadArticleIds(prev => new Set(prev).add(id))}
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
                    />
                )}
            </div>

            <BottomNavBar selection={selection} onSelect={handleSelectFromSidebar} />

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
