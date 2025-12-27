
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import MainContent from '../components/MainContent';
import type { SourceType } from '../components/AddSource';
import SettingsModal from '../components/SettingsModal';
import AddSourceModal from '../components/AddSourceModal';
import Sidebar from '../components/Sidebar';
import BottomNavBar from '../components/BottomNavBar';
import GameHubPage from '../components/GameHubPage';
import DailyRationPage from '../components/DailyRationPage';
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
  type: 'all' | 'folder' | 'bookmarks' | 'search' | 'feed' | 'reddit' | 'game_hub' | 'daily_ration';
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
const FERTILIZER_KEY = `feedme_fertilizer_${GUEST_USER_ID}`;
const LAST_RATION_KEY = `feedme_last_ration_date_${GUEST_USER_ID}`;

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
    const [fertilizer, setFertilizer] = useLocalStorage<number>(FERTILIZER_KEY, 0);
    const [lastRationDate, setLastRationDate] = useLocalStorage<string | null>(LAST_RATION_KEY, null);

    // Landing Logic: If it's a new day, show Daily Ration
    const [selection, setSelection] = useLocalStorage<Selection>(SELECTION_KEY, () => {
        const today = new Date().toISOString().split('T')[0];
        const savedRation = localStorage.getItem(LAST_RATION_KEY);
        if (savedRation !== JSON.stringify(today)) {
            return { type: 'daily_ration', id: null };
        }
        return { type: 'all', id: null };
    });

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(() => Date.now());

    // Global Hotkeys
    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            
            const key = e.key.toLowerCase();
            if (key === 'g') setSelection({ type: 'game_hub', id: null });
            if (key === 'n') setSelection({ type: 'all', id: null });
            if (key === 'b') setSelection({ type: 'bookmarks', id: null });
            if (key === 'r') setSelection({ type: 'daily_ration', id: null });
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [setSelection]);

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
            setFertilizer(f => Math.min(100, f + 5)); 
        }
    };

    const handleSatiateSeymour = (articleIds: string[]) => {
        setReadArticleIds(prev => new Set([...Array.from(prev), ...articleIds]));
        setFertilizer(100);
    };

    const handleSelectFromSidebar = (sel: Selection) => {
        setSelection(sel);
        setIsSidebarOpen(false);
    };

    const handleReturnToFeeds = useCallback(() => {
        setSelection({ type: 'all', id: null });
        setLastRationDate(new Date().toISOString().split('T')[0]);
    }, [setSelection, setLastRationDate]);

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
                // If it exists, just select it and close any modals/sidebars
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
      setFertilizer(f => Math.min(100, f + 15));
    }, [setSudokuStats, setFertilizer]);

    const handleSolitaireWin = useCallback((time: number, moves: number) => {
      setSolitaireStats(prev => {
        if (prev.lastGameWasWin) return prev;
        const newStats = { ...prev, gamesWon: prev.gamesWon + 1, currentStreak: prev.currentStreak + 1, lastGameWasWin: true };
        if (newStats.currentStreak > newStats.maxStreak) newStats.maxStreak = newStats.currentStreak;
        if (newStats.fastestTime === null || time < newStats.fastestTime) newStats.fastestTime = time;
        if (newStats.lowestMoves === null || moves < newStats.lowestMoves) newStats.lowestMoves = moves;
        return newStats;
      });
      setFertilizer(f => Math.min(100, f + 25));
    }, [setSolitaireStats, setFertilizer]);

    const pageTitle = useMemo(() => {
        if (selection.type === 'search') return `Hunting: "${selection.query}"`;
        if (selection.type === 'bookmarks') return 'Saved Snacks';
        if (selection.type === 'game_hub') return 'The Feeding Pit';
        if (selection.type === 'daily_ration') return 'SURVEILLANCE LOG';
        if (selection.type === 'feed') return feeds.find(f => f.id === selection.id)?.title || 'Feed';
        if (selection.type === 'folder') return folders.find(f => f.id === selection.id)?.name || 'Folder';
        return 'SURVEILLANCE LOG';
    }, [selection, feeds, folders]);

    const isGameActive = selection.type === 'game_hub' || selection.type === 'daily_ration';

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
                {selection.type === 'daily_ration' ? (
                   <DailyRationPage 
                      feeds={feeds} 
                      onComplete={handleReturnToFeeds} 
                      onSelectGame={(id) => setSelection({type: 'game_hub', id: null})} 
                      fertilizer={fertilizer}
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
                            fertilizer={fertilizer}
                            setFertilizer={setFertilizer}
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
                        onSatiateSeymour={handleSatiateSeymour}
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
                        fertilizer={fertilizer}
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
