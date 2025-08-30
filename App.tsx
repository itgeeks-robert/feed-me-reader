import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import LoginView from './components/LoginView';
import GoogleDriveService, { type GoogleUserProfile } from './services/googleDriveService';

// Fix for TypeScript error: Cannot find namespace 'google'.
// Fix: Replaced `declare const google: any;` with a proper `declare namespace google` to fix "Cannot find namespace 'google'" TypeScript error.
declare namespace google {
  namespace accounts {
    namespace oauth2 {
      interface TokenResponse {
        access_token: string;
        expires_in: number;
        scope: string;
        token_type: string;
        error?: string;
      }
    }
  }
}

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
}

export interface MagicFeed {
  id: number;
  topic: string;
}

export type Selection = {
  type: 'all' | 'feed' | 'folder' | 'briefing' | 'bookmarks' | 'search' | 'magic';
  id: string | number | null;
  query?: string; // For search
};

export type Theme = 'light' | 'dark';
export type ArticleView = 'card' | 'compact' | 'magazine';
export type AllFeedsView = 'dashboard' | 'list';

export interface Settings {
    feeds: Feed[];
    folders: Folder[];
    magicFeeds: MagicFeed[];
    theme: Theme;
    articleView: ArticleView;
    allFeedsView: AllFeedsView;
}

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';


export const CORS_PROXY = 'https://corsproxy.io/?';
const READ_ARTICLES_KEY = (user: string) => `feedme_read_articles_${user}`;
const BOOKMARKED_ARTICLES_KEY = (user: string) => `feedme_bookmarked_articles_${user}`;
const LAST_AUTO_SYNC_KEY = (user: string) => `feedme_last_auto_sync_${user}`;
const AI_DISABLED_KEY = 'feedme_ai_disabled_until';
const GUEST_SETTINGS_KEY = 'feedme_guest_settings';

const defaultFolders: Folder[] = [
    { id: 1, name: 'News' },
    { id: 2, name: 'Tech' },
    { id: 3, name: 'Sport' },
];

const defaultFeeds: Feed[] = [
    { id: 1, url: 'https://feeds.bbci.co.uk/news/rss.xml', title: 'BBC News', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=bbc.co.uk', folderId: 1 },
    { id: 2, url: 'https://www.theguardian.com/world/rss', title: 'The Guardian', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=theguardian.com', folderId: 1 },
    { id: 3, url: 'https://feeds.skynews.com/feeds/rss/world.xml', title: 'Sky News', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=news.sky.com', folderId: 1 },
    { id: 4, url: 'https://www.wired.com/feed/rss', title: 'Wired', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=wired.com', folderId: 2 },
    { id: 5, url: 'https://www.theverge.com/rss/index.xml', title: 'The Verge', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=theverge.com', folderId: 2 },
    { id: 6, url: 'https://news.ycombinator.com/rss', title: 'Hacker News', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=ycombinator.com', folderId: null },
    { id: 7, url: 'https://feeds.arstechnica.com/arstechnica/index/', title: 'Ars Technica', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=arstechnica.com', folderId: 2 },
    { id: 8, url: 'https://feeds.bbci.co.uk/sport/football/rss.xml', title: 'BBC Football', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=bbc.co.uk', folderId: 3 },
    { id: 9, url: 'https://feeds.bbci.co.uk/sport/motorsport/rss.xml', title: 'BBC Motorsport', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=bbc.co.uk', folderId: 3 },
];

const App: React.FC = () => {
    const [userProfile, setUserProfile] = useState<GoogleUserProfile | null>(null);
    const [isGapiReady, setIsGapiReady] = useState(false);
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [isGuestMode, setIsGuestMode] = useState(false);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [theme, setTheme] = useState<Theme>('dark');
    const [articleView, setArticleView] = useState<ArticleView>('card');
    const [allFeedsView, setAllFeedsView] = useState<AllFeedsView>('dashboard');
    
    const [folders, setFolders] = useState<Folder[]>(defaultFolders);
    const [feeds, setFeeds] = useState<Feed[]>(defaultFeeds);
    const [readArticleIds, setReadArticleIds] = useState<Set<string>>(new Set());
    const [bookmarkedArticleIds, setBookmarkedArticleIds] = useState<Set<string>>(new Set());
    const [magicFeeds, setMagicFeeds] = useState<MagicFeed[]>([]);

    const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
    const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
    
    const loadSettings = (settings: Partial<Settings>) => {
        setFeeds(settings.feeds || defaultFeeds);
        setFolders(settings.folders || defaultFolders);
        setMagicFeeds(settings.magicFeeds || []);
        setTheme(settings.theme || 'dark');
        setArticleView(settings.articleView || 'card');
        setAllFeedsView(settings.allFeedsView || 'dashboard');
    };

    const handleAuthChange = useCallback(async (token: google.accounts.oauth2.TokenResponse | null) => {
        if (token) {
            const profile = await GoogleDriveService.getSignedInUser();
            setUserProfile(profile);
            setIsSignedIn(true);
            setIsGuestMode(false);
            
            // User signed in, load data from Drive or local as fallback
            const driveSettings = await GoogleDriveService.downloadSettings();
            if (driveSettings) {
                console.log("Settings loaded from Google Drive.");
                loadSettings(driveSettings);
                setLastSyncTime(Date.now());
            } else {
                console.log("No settings file found in Drive. Preparing to upload local/default settings.");
                await handleSyncToDrive(true); // Initial sync for new users
            }
             try {
                const savedReadArticles = window.localStorage.getItem(READ_ARTICLES_KEY(profile.id));
                setReadArticleIds(savedReadArticles ? new Set(JSON.parse(savedReadArticles)) : new Set());
                const savedBookmarks = window.localStorage.getItem(BOOKMARKED_ARTICLES_KEY(profile.id));
                setBookmarkedArticleIds(savedBookmarks ? new Set(JSON.parse(savedBookmarks)) : new Set());
             } catch(e) { console.error("Error loading local article states", e); }

        } else {
            setUserProfile(null);
            setIsSignedIn(false);
            // Reset state to defaults on logout
            loadSettings({});
            setReadArticleIds(new Set());
            setBookmarkedArticleIds(new Set());
            setSelection({ type: 'all', id: null });
        }
    }, []);

    useEffect(() => {
        const initGoogleClient = async () => {
            await GoogleDriveService.initClient(handleAuthChange);
            setIsGapiReady(true);
        };
        initGoogleClient();
    }, [handleAuthChange]);
    
    const handleSyncToDrive = async (isSilent: boolean = false) => {
        if (!isGapiReady || !isSignedIn) {
            alert("Please sign in with Google first.");
            return;
        }
        if (!isSilent) setSyncStatus('syncing');
        
        try {
            const settings: Settings = { feeds, folders, magicFeeds, theme, articleView, allFeedsView };
            await GoogleDriveService.uploadSettings(settings);
            if (!isSilent) setSyncStatus('success');
            setLastSyncTime(Date.now());
            console.log("Settings successfully synced to Google Drive.");
        } catch (error) {
            console.error("Failed to sync settings to Google Drive:", error);
            if (!isSilent) setSyncStatus('error');
        } finally {
            if (!isSilent) {
                setTimeout(() => setSyncStatus('idle'), 2000);
            }
        }
    };
    
    // Automatic daily backup
    useEffect(() => {
        if (!isSignedIn || !userProfile) return;

        const autoSync = async () => {
            try {
                const lastSync = localStorage.getItem(LAST_AUTO_SYNC_KEY(userProfile.id));
                const twentyFourHours = 24 * 60 * 60 * 1000;
                if (!lastSync || (Date.now() - parseInt(lastSync) > twentyFourHours)) {
                    console.log("Performing automatic daily backup to Google Drive...");
                    await handleSyncToDrive(true);
                    localStorage.setItem(LAST_AUTO_SYNC_KEY(userProfile.id), String(Date.now()));
                }
            } catch (e) {
                console.error("Auto-sync failed:", e);
            }
        };

        const intervalId = setInterval(autoSync, 60 * 60 * 1000); // Check every hour
        autoSync(); // Check once on load

        return () => clearInterval(intervalId);
    }, [isSignedIn, userProfile, feeds, folders, magicFeeds, theme, articleView, allFeedsView]); // Re-eval if user or settings change

    const [isAiDisabled, setIsAiDisabled] = useState<boolean>(() => {
        try {
            const disabledUntil = window.localStorage.getItem(AI_DISABLED_KEY);
            if (disabledUntil && new Date().getTime() < parseInt(disabledUntil, 10)) {
                return true;
            }
        } catch (error) { console.error("Failed to read AI disable state from localStorage", error); }
        return false;
    });

    useEffect(() => {
        const interval = setInterval(() => {
            try {
                const disabledUntil = window.localStorage.getItem(AI_DISABLED_KEY);
                if (disabledUntil) {
                    if (new Date().getTime() >= parseInt(disabledUntil, 10)) {
                        window.localStorage.removeItem(AI_DISABLED_KEY);
                        setIsAiDisabled(false);
                    } else if (!isAiDisabled) {
                        setIsAiDisabled(true);
                    }
                } else if (isAiDisabled) {
                    setIsAiDisabled(false);
                }
            } catch (error) { console.error("Error in AI disable check interval", error); }
        }, 60 * 1000);
        return () => clearInterval(interval);
    }, [isAiDisabled]);

    const handleAiError = useCallback((error: unknown): boolean => {
        if (error instanceof Error && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('rate limit') || error.message.includes('quota'))) {
            try {
                const twelveHours = 12 * 60 * 60 * 1000;
                const disabledUntil = new Date().getTime() + twelveHours;
                window.localStorage.setItem(AI_DISABLED_KEY, disabledUntil.toString());
                setIsAiDisabled(true);
                return true;
            } catch (e) { console.error("Failed to set AI disable state in localStorage", e); }
        }
        return false;
    }, []);
    
    const handleResetAiCooldown = () => {
        try {
            window.localStorage.removeItem(AI_DISABLED_KEY);
            setIsAiDisabled(false);
            alert("AI cooldown has been reset. You may need to refresh the page.");
        } catch (e) {
            console.error("Failed to reset AI cooldown", e);
        }
    };

    const userId = useMemo(() => {
        if (isSignedIn && userProfile) return userProfile.id;
        if (isGuestMode) return 'guest';
        return null;
    }, [isSignedIn, userProfile, isGuestMode]);

    useEffect(() => {
        if (!userId) return;
        try {
            window.localStorage.setItem(READ_ARTICLES_KEY(userId), JSON.stringify(Array.from(readArticleIds)));
        } catch (error) { console.error("Failed to save read articles to localStorage", error); }
    }, [readArticleIds, userId]);

    useEffect(() => {
        if (!userId) return;
        try {
            window.localStorage.setItem(BOOKMARKED_ARTICLES_KEY(userId), JSON.stringify(Array.from(bookmarkedArticleIds)));
        } catch (error) { console.error("Failed to save bookmarks to localStorage", error); }
    }, [bookmarkedArticleIds, userId]);
    
    useEffect(() => {
        if (isGuestMode) {
            try {
                const settings: Settings = { feeds, folders, magicFeeds, theme, articleView, allFeedsView };
                window.localStorage.setItem(GUEST_SETTINGS_KEY, JSON.stringify(settings));
            } catch (error) {
                console.error("Failed to save guest settings to localStorage", error);
            }
        }
    }, [isGuestMode, feeds, folders, magicFeeds, theme, articleView, allFeedsView]);
    
    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [theme]);

    const [selection, setSelection] = useState<Selection>({ type: 'all', id: null });

    const handleSelect = (sel: Selection) => {
        setSelection(sel);
        setIsSidebarOpen(false);
    };

    const handleAddFeed = async (url: string) => {
        if (url && !feeds.some(feed => feed.url === url)) {
            try {
                const response = await fetch(`${CORS_PROXY}${url}`);
                if (!response.ok) throw new Error('Network response was not ok.');
                const text = await response.text();
                const parser = new DOMParser();
                const xml = parser.parseFromString(text, "application/xml");
                if (xml.querySelector('parsererror')) throw new Error('Failed to parse RSS feed.');
                const feedTitle = xml.querySelector('channel > title')?.textContent || xml.querySelector('feed > title')?.textContent || new URL(url).hostname;
                const siteLink = xml.querySelector('channel > link')?.textContent;
                const domainUrl = siteLink ? new URL(siteLink).hostname : new URL(url).hostname;
                const iconUrl = `https://www.google.com/s2/favicons?sz=32&domain_url=${domainUrl}`;
                const newFeed: Feed = { id: Date.now(), title: feedTitle, url, iconUrl, folderId: null };
                setFeeds(prevFeeds => [...prevFeeds, newFeed]);
                setSelection({ type: 'feed', id: newFeed.id });
            } catch (error) {
                console.error("Failed to add feed:", error);
                alert("Could not fetch or parse the RSS feed. Please check the URL and try again.");
            }
        }
    };

    const handleRemoveFeed = (id: number) => {
        const feedToRemove = feeds.find(f => f.id === id);
        setFeeds(feeds.filter(feed => feed.id !== id));
        if (feedToRemove && selection.type === 'feed' && selection.id === feedToRemove.id) {
            setSelection({ type: 'all', id: null });
        }
    };
    
    const handleAddMagicFeed = (topic: string) => {
        const newMagicFeed: MagicFeed = { id: Date.now(), topic };
        setMagicFeeds(prev => [...prev, newMagicFeed]);
        handleSelect({ type: 'magic', id: newMagicFeed.id });
    };
    
    const handleRemoveMagicFeed = (id: number) => {
        setMagicFeeds(magicFeeds.filter(mf => mf.id !== id));
        if (selection.type === 'magic' && selection.id === id) {
            setSelection({ type: 'all', id: null });
        }
    };

    const handleAddFolder = (name: string) => {
        const newFolder: Folder = { id: Date.now(), name };
        setFolders(prev => [...prev, newFolder]);
    };

    const handleRenameFolder = (id: number, newName: string) => {
        setFolders(folders.map(f => f.id === id ? { ...f, name: newName } : f));
    };
    
    const handleDeleteFolder = (id: number) => {
        setFolders(folders.filter(f => f.id !== id));
        setFeeds(feeds.map(f => f.folderId === id ? { ...f, folderId: null } : f));
        if (selection.type === 'folder' && selection.id === id) {
            setSelection({ type: 'all', id: null });
        }
    };

    const handleMoveFeedToFolder = (feedId: number, folderId: number | null) => {
        setFeeds(feeds.map(f => f.id === feedId ? { ...f, folderId } : f));
    };

    const handleMarkAsRead = (articleId: string) => {
        setReadArticleIds(prev => {
            if (prev.has(articleId)) return prev;
            const newSet = new Set(prev);
            newSet.add(articleId);
            return newSet;
        });
    };

    const handleMarkMultipleAsRead = (articleIds: string[]) => {
        setReadArticleIds(prev => {
            const newSet = new Set(prev);
            articleIds.forEach(id => newSet.add(id));
            return newSet;
        });
    };

    const handleToggleBookmark = (articleId: string) => {
        setBookmarkedArticleIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(articleId)) {
                newSet.delete(articleId);
            } else {
                newSet.add(articleId);
            }
            return newSet;
        });
    };
    
    const handleGuestLogin = () => {
        setIsGuestMode(true);
        setIsSignedIn(false);
        setUserProfile(null);
        try {
            const guestSettings = JSON.parse(window.localStorage.getItem(GUEST_SETTINGS_KEY) || '{}');
            loadSettings(guestSettings);
            const savedReadArticles = window.localStorage.getItem(READ_ARTICLES_KEY('guest'));
            setReadArticleIds(savedReadArticles ? new Set(JSON.parse(savedReadArticles)) : new Set());
            const savedBookmarks = window.localStorage.getItem(BOOKMARKED_ARTICLES_KEY('guest'));
            setBookmarkedArticleIds(savedBookmarks ? new Set(JSON.parse(savedBookmarks)) : new Set());
        } catch (e) {
            console.error("Error loading guest data from localStorage", e);
            loadSettings({});
            setReadArticleIds(new Set());
            setBookmarkedArticleIds(new Set());
        }
    };
    
    const handleGoToLogin = () => {
        setIsGuestMode(false);
        loadSettings({});
        setReadArticleIds(new Set());
        setBookmarkedArticleIds(new Set());
        setSelection({ type: 'all', id: null });
    };

    if (!isSignedIn && !isGuestMode) {
        return <LoginView onLogin={GoogleDriveService.signIn} onGuestLogin={handleGuestLogin} isApiReady={isGapiReady} isAiDisabled={isAiDisabled} onResetAiCooldown={handleResetAiCooldown} />;
    }

    let feedsToDisplay: Feed[] = [];
    let title = '';
    let magicFeedTopic: string | undefined = undefined;

    if (selection.type === 'all' || selection.type === 'search' || selection.type === 'bookmarks') {
        feedsToDisplay = feeds;
        if (selection.type === 'all') title = 'All Feeds';
        if (selection.type === 'search') title = `Search: "${selection.query}"`;
        if (selection.type === 'bookmarks') title = 'Read Later';
    } else if (selection.type === 'folder') {
        feedsToDisplay = feeds.filter(f => f.folderId === selection.id);
        title = folders.find(f => f.id === selection.id)?.name || 'Folder';
    } else if (selection.type === 'feed') {
        const feed = feeds.find(f => f.id === selection.id);
        feedsToDisplay = feed ? [feed] : [];
        title = feed?.title || 'Feed';
    } else if (selection.type === 'briefing') {
        feedsToDisplay = feeds;
        title = 'Daily Briefing';
    } else if (selection.type === 'magic') {
        feedsToDisplay = [];
        const magicFeed = magicFeeds.find(mf => mf.id === selection.id);
        if (magicFeed) {
            title = `Magic: ${magicFeed.topic}`;
            magicFeedTopic = magicFeed.topic;
        }
    }

    return (
        <div className="h-screen font-sans text-sm relative overflow-hidden">
            {isSidebarOpen && (
                <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-30 md:hidden" aria-hidden="true" />
            )}
            <Sidebar
                isSidebarOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                feeds={feeds}
                folders={folders}
                magicFeeds={magicFeeds}
                selection={selection}
                onAddFeed={handleAddFeed}
                onRemoveFeed={handleRemoveFeed}
                onAddMagicFeed={handleAddMagicFeed}
                onRemoveMagicFeed={handleRemoveMagicFeed}
                onSelect={handleSelect}
                onAddFolder={handleAddFolder}
                onRenameFolder={handleRenameFolder}
                onDeleteFolder={handleDeleteFolder}
                onMoveFeedToFolder={handleMoveFeedToFolder}
                theme={theme}
                toggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
                userProfile={userProfile}
                onLogout={GoogleDriveService.signOut}
                onSync={handleSyncToDrive}
                syncStatus={syncStatus}
                lastSyncTime={lastSyncTime}
                isGuestMode={isGuestMode}
                onGoToLogin={handleGoToLogin}
            />
            <div className="md:ml-72 h-full">
                <MainContent
                    onMenuClick={() => setIsSidebarOpen(true)}
                    onSearch={(query: string) => setSelection({ type: 'search', id: null, query })}
                    feedsToDisplay={feedsToDisplay}
                    title={title}
                    selection={selection}
                    magicFeedTopic={magicFeedTopic}
                    key={JSON.stringify(selection) + userId}
                    readArticleIds={readArticleIds}
                    bookmarkedArticleIds={bookmarkedArticleIds}
                    onMarkAsRead={handleMarkAsRead}
                    onMarkMultipleAsRead={handleMarkMultipleAsRead}
                    onToggleBookmark={handleToggleBookmark}
                    articleView={articleView}
                    setArticleView={setArticleView}
                    allFeeds={feeds}
                    allFeedsView={allFeedsView}
                    setAllFeedsView={setAllFeedsView}
                    isAiDisabled={isAiDisabled}
                    handleAiError={handleAiError}
                />
            </div>
        </div>
    );
};

export default App;