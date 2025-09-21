
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import MainContent from '../components/MainContent';
import type { SourceType } from '../components/AddSource';
import SettingsModal from '../components/SettingsModal';
import AddSourceModal from '../components/AddSourceModal';
import Sidebar from '../components/Sidebar';
import { useSwipe } from '../hooks/useSwipe';
import BottomNavBar from '../components/BottomNavBar';
import { ListIcon, TrophyIcon, RedditIcon, YoutubeIcon, NewspaperIcon, BookmarkIcon, CubeTransparentIcon } from '../components/icons';
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
  query?: string; // For search
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
  lastDailyCompletionDate: string | null; // YYYY-MM-DD
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
    cardBack: string; // base64
    background: string; // base64
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
    { id: 1, name: 'News' },
    { id: 2, name: 'Tech' },
    { id: 3, name: 'Sport' },
];

const defaultFeeds: Feed[] = [
    // News (folderId: 1)
    { id: 1, url: 'https://feeds.bbci.co.uk/news/world/rss.xml', title: 'BBC World News', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=bbc.co.uk', folderId: 1, sourceType: 'rss' },
    { id: 2, url: 'https://www.theguardian.com/world/rss', title: 'The Guardian', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=theguardian.com', folderId: 1, sourceType: 'rss' },
    { id: 3, url: 'https://feeds.skynews.com/feeds/rss/world.xml', title: 'Sky News', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=news.sky.com', folderId: 1, sourceType: 'rss' },
    { id: 20, url: 'https://www.manchestereveningnews.co.uk/rss.xml', title: 'Manchester Evening News', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=manchestereveningnews.co.uk', folderId: 1, sourceType: 'rss' },
    
    // Tech (folderId: 2)
    { id: 4, url: 'https://www.wired.com/feed/rss', title: 'Wired', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=wired.com', folderId: 2, sourceType: 'rss' },
    { id: 36, url: 'http://feeds.arstechnica.com/arstechnica/index', title: 'Ars Technica', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=arstechnica.com', folderId: 2, sourceType: 'rss' },
    
    // Sports (folderId: 3)
    { id: 34, url: 'https://feeds.bbci.co.uk/sport/rss.xml', title: 'BBC Sport', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=bbc.co.uk', folderId: 3, sourceType: 'rss' },
    { id: 15, url: 'http://feeds.feedburner.com/totalf1-recent', title: 'TotalF1', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=totalf1.com', folderId: 3, sourceType: 'rss' },
    { id: 17, url: 'https://www.skysports.com/rss/12040', title: 'Sky Sports', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=skysports.com', folderId: 3, sourceType: 'rss' },

    // Reddit (unfiled)
    { id: 22, url: 'https://www.reddit.com/r/TheCivilService/.rss', title: 'r/TheCivilService', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=reddit.com', folderId: null, sourceType: 'reddit' },
    { id: 23, url: 'https://www.reddit.com/r/news/.rss', title: 'r/news', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=reddit.com', folderId: null, sourceType: 'reddit' },
    { id: 24, url: 'https://www.reddit.com/r/technology/.rss', title: 'r/technology', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=reddit.com', folderId: null, sourceType: 'reddit' },
];

const defaultWidgetSettings: WidgetSettings = {
    showWeather: true,
    showSports: true,
    showFinance: false,
    weatherLocation: 'Kirkham',
    sportsTeams: ['MUN', 'FYL', 'BLA', 'MCI'],
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
    const [selection, setSelection] = useLocalStorage<Selection>(SELECTION_KEY, { type: 'all', id: null });

    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const [lastRefresh, setLastRefresh] = useState(() => Date.now());
    const [gameHubResetKey, setGameHubResetKey] = useState(0);
    
    const isApiKeyMissing = !process.env.API_KEY;

    // This effect runs once on mount to validate the persisted selection from localStorage.
    // If the selected folder or feed no longer exists, it resets to the 'all' view to prevent a crash.
    useEffect(() => {
        const validateSelection = () => {
            if (selection.type === 'folder' && !folders.some(f => f.id === selection.id)) {
                return false;
            }
            if (selection.type === 'feed' && !feeds.some(f => f.id === selection.id)) {
                return false;
            }
            return true;
        };

        if (!validateSelection()) {
            console.warn('Persisted selection from localStorage is invalid. Resetting to default.');
            setSelection({ type: 'all', id: null });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array ensures this runs only once on mount.

    const [animationClass, setAnimationClass] = useState('animate-fade-in');

    const mainPages = useMemo(() => {
        const sportFolder = folders.find(f => f.name.toLowerCase() === 'sport');
        const newsFolder = folders.find(f => f.name.toLowerCase() === 'news');
        return [
            { selection: { type: 'all' as const, id: null }, name: 'All Feeds', icon: <ListIcon className="w-6 h-6" /> },
            { selection: { type: 'bookmarks' as const, id: 'bookmarks' }, name: 'Saved', icon: <BookmarkIcon className="w-6 h-6" /> },
            { selection: { type: 'game_hub' as const, id: null }, name: 'Game Hub', icon: <CubeTransparentIcon className="w-6 h-6" /> },
            newsFolder ? { selection: { type: 'folder' as const, id: newsFolder.id }, name: 'News', icon: <NewspaperIcon className="w-6 h-6" /> } : null,
            sportFolder ? { selection: { type: 'folder' as const, id: sportFolder.id }, name: 'Sport', icon: <TrophyIcon className="w-6 h-6" /> } : null,
            { selection: { type: 'reddit' as const, id: null }, name: 'Reddit', icon: <RedditIcon className="w-6 h-6" /> },
            { selection: { type: 'youtube' as const, id: null }, name: 'YouTube', icon: <YoutubeIcon className="w-6 h-6" /> },
        ].filter((page): page is NonNullable<typeof page> => !!page);
    }, [folders]);
    
    const currentPageIndex = useMemo(() => mainPages.findIndex(p => 
        p.selection.type === selection.type && p.selection.id === selection.id
    ), [mainPages, selection]);

    const navigate = useCallback((newIndex: number) => {
        const oldIndex = currentPageIndex;
        if (newIndex === oldIndex || newIndex < 0 || newIndex >= mainPages.length) {
            return;
        }

        if (newIndex > oldIndex) {
            setAnimationClass('animate-slide-in-from-right');
        } else {
            setAnimationClass('animate-slide-in-from-left');
        }

        const newSelection = mainPages[newIndex].selection;
        if (newSelection.type === 'game_hub' && selection.type === 'game_hub') {
            setGameHubResetKey(k => k + 1);
        }
        setSelection(newSelection);
    }, [currentPageIndex, mainPages, setSelection, selection]);

    const swipeHandlers = useSwipe({
        onSwipeLeft: () => {
            if (currentPageIndex > -1 && currentPageIndex < mainPages.length - 1) {
                navigate(currentPageIndex + 1);
            }
        },
        onSwipeRight: () => {
            if (currentPageIndex > 0) {
                navigate(currentPageIndex - 1);
            }
        },
    });

    useEffect(() => {
        const feedInterval = setInterval(() => {
            setLastRefresh(Date.now());
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(feedInterval);
    }, []);

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
        if (sel.type === 'game_hub' && selection.type === 'game_hub') {
            setGameHubResetKey(k => k + 1);
        }
        if (JSON.stringify(sel) !== JSON.stringify(selection)) {
            setAnimationClass('animate-fade-in');
            setSelection(sel);
        }
        setIsSidebarOpen(false);
    };

    const handleAddSource = async (url: string, type: SourceType) => {
        let feedUrl = url;
        let originalUrl = url;

        try {
            if (type === 'youtube') {
                if (url.includes('/playlist?list=')) {
                    const playlistIdMatch = url.match(/list=([a-zA-Z0-9_-]+)/);
                    if (playlistIdMatch?.[1]) {
                        feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistIdMatch[1]}`;
                    } else {
                        throw new Error('Could not parse playlist ID from URL.');
                    }
                } else {
                    const channelIdMatch = url.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]{24})/);
                    let channelId = channelIdMatch?.[1];
                    if (!channelId) {
                       const response = await resilientFetch(url.split('?')[0]);
                       const text = await response.text();
                       const canonicalMatch = text.match(/<link rel="canonical" href="https:\/\/www.youtube.com\/channel\/([a-zA-Z0-9_-]+)"/);
                       channelId = canonicalMatch?.[1] || text.match(/"channelId":"([a-zA-Z0-9_-]+)"/)?.[1] || null;
                    }
                    if (!channelId) throw new Error('Could not find a valid YouTube channel ID.');
                    const uploadsPlaylistId = channelId.replace(/^UC/, 'UU');
                    feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${uploadsPlaylistId}`;
                }
            } else if (type === 'website') {
                feedUrl = `https://www.fivefilters.org/feed-creator/extract.php?url=${encodeURIComponent(url)}&format=xml`;
            } else if (type === 'reddit') {
                const redditUrl = url.trim().replace(/\/$/, '');
                const match = redditUrl.match(/reddit\.com\/(r\/[a-zA-Z0-9_]+|user\/[a-zA-Z0-9_-]+)/);
                feedUrl = match ? `https://www.reddit.com/${match[1]}/.rss` : `${redditUrl}/.rss`;
            }

            if (feeds.some(feed => feed.url === feedUrl)) throw new Error("This feed has already been added.");

            const response = await resilientFetch(feedUrl);
            const text = await response.text();
            const xml = new DOMParser().parseFromString(text, "application/xml");
            if (xml.querySelector('parsererror')) throw new Error('Failed to parse RSS feed.');
            const feedTitle = xml.querySelector('channel > title, feed > title')?.textContent || new URL(originalUrl).hostname;
            const siteLink = xml.querySelector('channel > link')?.textContent || originalUrl;
            const iconUrl = `https://www.google.com/s2/favicons?sz=32&domain_url=${new URL(siteLink).hostname}`;
            const newFeed: Feed = { id: Date.now(), title: feedTitle, url: feedUrl, iconUrl, folderId: null, sourceType: type };
            setFeeds(prevFeeds => [...prevFeeds, newFeed]);
            navigate(0);
        } catch (error) {
            console.error("Failed to add source:", error);
            throw error;
        }
    };

    const handleMarkAsRead = (articleId: string) => {
        setReadArticleIds(prev => new Set(prev).add(articleId));
    };
    
    const handleMarkAsUnread = (articleId: string) => {
        setReadArticleIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(articleId);
            return newSet;
        });
    };

    const handleMarkMultipleAsRead = (articleIds: string[]) => {
        setReadArticleIds(prev => new Set([...prev, ...articleIds]));
    };

    const handleToggleBookmark = (articleId: string) => {
        setBookmarkedArticleIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(articleId)) newSet.delete(articleId);
            else newSet.add(articleId);
            return newSet;
        });
    };
    
    const handleSetArticleTags = (articleId: string, tags: Set<string>) => {
        setArticleTags(prev => {
            const newMap = new Map(prev);
            if (tags.size === 0) newMap.delete(articleId);
            else newMap.set(articleId, tags);
            return newMap;
        });
    };

    const handleSudokuWin = useCallback((difficulty: SudokuDifficulty, time: number, isDaily: boolean) => {
      setSudokuStats(prevStats => {
        const newStats = JSON.parse(JSON.stringify(prevStats)) as SudokuStats;
        newStats.totalWins += 1;

        const difficultyKey = difficulty.toLowerCase() as keyof Omit<SudokuStats, 'dailyStreak' | 'lastDailyCompletionDate' | 'totalWins'>;
        const diffStats = newStats[difficultyKey];
        
        diffStats.gamesPlayed += 1;
        diffStats.totalTimePlayed += time;
        if (diffStats.fastestTime === null || time < diffStats.fastestTime) {
          diffStats.fastestTime = time;
        }

        if (isDaily) {
          const today = new Date().toISOString().split('T')[0];
          if (prevStats.lastDailyCompletionDate !== today) {
            const yesterday = new Date(Date.now() - 864e5).toISOString().split('T')[0];
            if (prevStats.lastDailyCompletionDate === yesterday) {
              newStats.dailyStreak += 1;
            } else {
              newStats.dailyStreak = 1;
            }
            newStats.lastDailyCompletionDate = today;
          }
        }
        
        return newStats;
      });
    }, [setSudokuStats]);

    const handleSolitaireWin = useCallback((time: number, moves: number) => {
      setSolitaireStats(prev => {
        if (prev.lastGameWasWin) return prev; 
        
        const newStats: SolitaireStats = { ...prev };
        newStats.gamesWon += 1;
        newStats.currentStreak += 1;
        if (newStats.currentStreak > newStats.maxStreak) {
          newStats.maxStreak = newStats.currentStreak;
        }
        if (newStats.fastestTime === null || time < newStats.fastestTime) {
          newStats.fastestTime = time;
        }
        if (newStats.lowestMoves === null || moves < newStats.lowestMoves) {
          newStats.lowestMoves = moves;
        }
        newStats.lastGameWasWin = true;
        return newStats;
      });
    }, [setSolitaireStats]);

    const handleSolitaireStart = useCallback(() => {
        setSolitaireStats(prev => {
            const newStats = {...prev};
            if (!prev.lastGameWasWin) {
                newStats.currentStreak = 0;
            }
            newStats.gamesPlayed += 1;
            newStats.lastGameWasWin = false;
            return newStats;
        });
    }, [setSolitaireStats]);


    const handleExportOpml = () => {
        let opml = `<?xml version="1.0" encoding="UTF-8"?><opml version="2.0"><body>`;
        folders.forEach(folder => {
            opml += `<outline text="${folder.name}" title="${folder.name}">`;
            feeds.filter(f => f.folderId === folder.id).forEach(feed => {
                opml += `<outline type="rss" text="${feed.title}" title="${feed.title}" xmlUrl="${feed.url}" />`;
            });
            opml += `</outline>`;
        });
        feeds.filter(f => f.folderId === null).forEach(feed => {
            opml += `<outline type="rss" text="${feed.title}" title="${feed.title}" xmlUrl="${feed.url}" />`;
        });
        opml += `</body></opml>`;
        const blob = new Blob([opml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'seemore_feeds.opml';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportOpml = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const xmlText = e.target?.result as string;
                const xml = new DOMParser().parseFromString(xmlText, "application/xml");
                if (xml.querySelector('parsererror')) throw new Error('Failed to parse OPML file.');
                
                let importedFolders: Folder[] = [...folders];
                let importedFeeds: Feed[] = [...feeds];
                const existingFeedUrls = new Set(feeds.map(f => f.url));

                xml.querySelectorAll('body > outline').forEach(outline => {
                    const isFolder = !outline.getAttribute('xmlUrl');
                    if (isFolder) {
                        const folderName = outline.getAttribute('text') || '';
                        let folder = importedFolders.find(f => f.name === folderName);
                        if (!folder) {
                            folder = { id: Date.now() + Math.random(), name: folderName };
                            importedFolders.push(folder);
                        }
                        outline.querySelectorAll('outline').forEach(feedOutline => {
                            const feedUrl = feedOutline.getAttribute('xmlUrl');
                            if (feedUrl && !existingFeedUrls.has(feedUrl)) {
                                const feedTitle = feedOutline.getAttribute('text') || new URL(feedUrl).hostname;
                                const iconUrl = `https://www.google.com/s2/favicons?sz=32&domain_url=${new URL(feedUrl).hostname}`;
                                importedFeeds.push({ id: Date.now() + Math.random(), title: feedTitle, url: feedUrl, iconUrl, folderId: folder.id, sourceType: 'rss' });
                                existingFeedUrls.add(feedUrl);
                            }
                        });
                    } else {
                        const feedUrl = outline.getAttribute('xmlUrl');
                        if (feedUrl && !existingFeedUrls.has(feedUrl)) {
                            const feedTitle = outline.getAttribute('text') || new URL(feedUrl).hostname;
                            const iconUrl = `https://www.google.com/s2/favicons?sz=32&domain_url=${new URL(feedUrl).hostname}`;
                            importedFeeds.push({ id: Date.now() + Math.random(), title: feedTitle, url: feedUrl, iconUrl, folderId: null, sourceType: 'rss' });
                            existingFeedUrls.add(feedUrl);
                        }
                    }
                });
                setFolders(importedFolders);
                setFeeds(importedFeeds);
                alert('Feeds imported successfully!');
            } catch (error) {
                alert(`Could not import OPML file. Error: ${(error as Error).message}`);
            }
        };
        reader.readAsText(file);
    };
    
    const handleExportSettings = () => {
        const settingsToExport: Settings = { feeds, folders, theme, articleView, widgets: widgetSettings };
        const blob = new Blob([JSON.stringify(settingsToExport, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'seemore_backup.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    };

    const handleImportSettings = (file: File) => {
        if (!window.confirm('This will overwrite all current settings. Continue?')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedSettings = JSON.parse(e.target?.result as string) as Settings;
                if (importedSettings.feeds && importedSettings.folders && importedSettings.theme) {
                    setFeeds(importedSettings.feeds);
                    setFolders(importedSettings.folders);
                    setTheme(importedSettings.theme);
                    setArticleView(importedSettings.articleView);
                    setWidgetSettings(importedSettings.widgets);
                    alert('Settings imported successfully!');
                } else throw new Error('Invalid settings file format.');
            } catch (error) {
                alert(`Could not import settings. Error: ${(error as Error).message}`);
            }
        };
        reader.readAsText(file);
    };
    
    const handleUpdateSettings = (newSettings: Partial<Omit<Settings, 'feeds' | 'folders'>>) => {
        if (newSettings.theme) setTheme(newSettings.theme);
        if (newSettings.articleView) setArticleView(newSettings.articleView);
        if (newSettings.widgets) setWidgetSettings(newSettings.widgets);
    };

    const handleRemoveFeed = (id: number) => {
        setFeeds(prev => prev.filter(f => f.id !== id));
    };

    const handleAddFolder = (name: string) => {
        setFolders(prev => [...prev, { id: Date.now(), name }]);
    };

    const handleRenameFolder = (id: number, newName: string) => {
        setFolders(prev => prev.map(f => (f.id === id ? { ...f, name: newName } : f)));
    };

    const handleDeleteFolder = (id: number) => {
        if (window.confirm('Delete this folder and unfile its feeds?')) {
            setFolders(prev => prev.filter(f => f.id !== id));
            setFeeds(prev => prev.map(f => (f.folderId === id ? { ...f, folderId: null } : f)));
        }
    };

    const handleMoveFeedToFolder = (feedId: number, folderId: number | null) => {
        setFeeds(prev => prev.map(f => (f.id === feedId ? { ...f, folderId } : f)));
    };
    
    const feedsToDisplay = useMemo(() => {
        switch (selection.type) {
            case 'all':
            case 'search':
            case 'bookmarks':
                return feeds;
            case 'folder':
                return feeds.filter(f => f.folderId === selection.id);
            case 'feed':
                return feeds.filter(f => f.id === selection.id);
            case 'reddit':
                return feeds.filter(f => f.sourceType === 'reddit');
            case 'youtube':
                return feeds.filter(f => f.sourceType === 'youtube');
            default:
                return [];
        }
    }, [feeds, selection]);
    
    const pageTitle = useMemo(() => {
        if (selection.type === 'search') return `Search: "${selection.query}"`;
        if (selection.type === 'bookmarks') return 'Saved Articles';
        if (selection.type === 'game_hub') return 'Game Hub';

        const mainPage = mainPages.find(p => p.selection.type === selection.type && p.selection.id === selection.id);
        if (mainPage) return mainPage.name;

        if (selection.type === 'feed') return feeds.find(f => f.id === selection.id)?.title || 'Feed';
        if (selection.type === 'folder') return folders.find(f => f.id === selection.id)?.name || 'Folder';
        
        return 'See More';
    }, [selection, mainPages, feeds, folders]);
    
    return (
        <div className="h-screen font-sans text-sm relative flex overflow-hidden">
            <Sidebar
                feeds={feeds}
                folders={folders}
                selection={selection}
                onAddSource={handleAddSource}
                onRemoveFeed={handleRemoveFeed}
                onSelect={handleSelectFromSidebar}
                onAddFolder={handleAddFolder}
                onRenameFolder={handleRenameFolder}
                onDeleteFolder={handleDeleteFolder}
                onMoveFeedToFolder={handleMoveFeedToFolder}
                isSidebarOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
            />
            <div {...swipeHandlers} className="flex-1 flex flex-col min-w-0 md:pl-72 relative">
                {selection.type === 'game_hub' ? (
                    <GameHubPage
                        key={gameHubResetKey}
                        sudokuStats={sudokuStats}
                        onSudokuWin={handleSudokuWin}
                        solitaireStats={solitaireStats}
                        onSolitaireWin={handleSolitaireWin}
                        onSolitaireStart={handleSolitaireStart}
                        solitaireSettings={solitaireSettings}
                        onUpdateSolitaireSettings={setSolitaireSettings}
                        isApiKeyMissing={isApiKeyMissing}
                    />
                ) : (
                    <MainContent
                        key={selection.type + String(selection.id)}
                        animationClass={animationClass}
                        pageTitle={pageTitle}
                        onSearch={(query: string) => {
                            setAnimationClass('animate-fade-in');
                            setSelection({ type: 'search', id: null, query })
                        }}
                        feedsToDisplay={feedsToDisplay}
                        selection={selection}
                        readArticleIds={readArticleIds}
                        bookmarkedArticleIds={bookmarkedArticleIds}
                        articleTags={articleTags}
                        onMarkAsRead={handleMarkAsRead}
                        onMarkAsUnread={handleMarkAsUnread}
                        onMarkMultipleAsRead={handleMarkMultipleAsRead}
                        onToggleBookmark={handleToggleBookmark}
                        onSetArticleTags={handleSetArticleTags}
                        allFeeds={feeds}
                        isApiKeyMissing={isApiKeyMissing}
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
             <BottomNavBar 
                pages={mainPages}
                currentPageIndex={currentPageIndex}
                onNavigate={navigate}
                onAddSource={() => setIsAddSourceModalOpen(true)}
                onRefresh={() => setLastRefresh(Date.now())}
             />
            <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                settings={{ feeds, folders, theme, articleView, widgets: widgetSettings }}
                onUpdateSettings={handleUpdateSettings}
                onImportOpml={handleImportOpml}
                onExportOpml={handleExportOpml}
                onImportSettings={handleImportSettings}
                onExportSettings={handleExportSettings}
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