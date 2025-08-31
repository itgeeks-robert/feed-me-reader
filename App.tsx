
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import { type SourceType } from './components/AddSource';
import SettingsModal from './components/SettingsModal';

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

export type Selection = {
  type: 'all' | 'feed' | 'folder' | 'bookmarks' | 'search';
  id: string | number | null;
  query?: string; // For search
};

export type Theme = 'light' | 'dark';
export type ArticleView = 'card' | 'compact' | 'magazine';
export type ViewMode = 'pc' | 'mobile';

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
    viewMode: ViewMode;
}

export const CORS_PROXY = 'https://corsproxy.io/?';
const GUEST_USER_ID = 'guest';
const READ_ARTICLES_KEY = `feedme_read_articles_${GUEST_USER_ID}`;
const BOOKMARKED_ARTICLES_KEY = `feedme_bookmarked_articles_${GUEST_USER_ID}`;
const ARTICLE_TAGS_KEY = `feedme_article_tags_${GUEST_USER_ID}`;
const SETTINGS_KEY = `feedme_settings_${GUEST_USER_ID}`;


const defaultFolders: Folder[] = [
    { id: 1, name: 'News' },
    { id: 2, name: 'Tech' },
    { id: 3, name: 'Sport' },
];

const defaultFeeds: Feed[] = [
    // News (folderId: 1)
    { id: 1, url: 'https://feeds.bbci.co.uk/news/rss.xml', title: 'BBC News', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=bbc.co.uk', folderId: 1 },
    { id: 2, url: 'https://www.theguardian.com/world/rss', title: 'The Guardian', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=theguardian.com', folderId: 1 },
    { id: 3, url: 'https://feeds.skynews.com/feeds/rss/world.xml', title: 'Sky News', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=news.sky.com', folderId: 1 },
    { id: 20, url: 'https://www.manchestereveningnews.co.uk/rss.xml', title: 'Manchester Evening News', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=manchestereveningnews.co.uk', folderId: 1 },
    
    // Tech (folderId: 2)
    { id: 4, url: 'https://www.wired.com/feed/rss', title: 'Wired', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=wired.com', folderId: 2 },
    { id: 5, url: 'https://www.theverge.com/rss/index.xml', title: 'The Verge', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=theverge.com', folderId: 2 },
    { id: 8, url: 'https://techcrunch.com/feed/', title: 'TechCrunch', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=techcrunch.com', folderId: 2 },
    { id: 9, url: 'https://mashable.com/feeds/rss/all', title: 'Mashable', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=mashable.com', folderId: 2 },
    { id: 10, url: 'https://www.producthunt.com/feed', title: 'Product Hunt', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=producthunt.com', folderId: 2 },
    { id: 11, url: 'https://www.engadget.com/rss.xml', title: 'Engadget', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=engadget.com', folderId: 2 },
    { id: 13, url: 'https://gizmodo.com/rss', title: 'Gizmodo', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=gizmodo.com', folderId: 2 },
    
    // Sports (folderId: 3)
    { id: 14, url: 'https://feeds.bbci.co.uk/sport/football/rss.xml', title: 'BBC Football', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=bbc.co.uk', folderId: 3 },
    { id: 15, url: 'https://feeds.bbci.co.uk/sport/motorsport/rss.xml', title: 'BBC Motorsport', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=bbc.co.uk', folderId: 3 },
    { id: 17, url: 'https://www.skysports.com/rss/12040', title: 'Sky Sports', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=skysports.com', folderId: 3 },
    { id: 19, url: 'https://www.formula1.com/rss/news/headlines.rss?searchString=home', title: 'Formula 1', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=formula1.com', folderId: 3 },
];

const defaultWidgetSettings: WidgetSettings = {
    showWeather: true,
    showSports: true,
    showFinance: false,
    weatherLocation: 'Kirkham',
    sportsTeams: ['MUN', 'FYL'],
};

const App: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [theme, setTheme] = useState<Theme>('dark');
    const [articleView, setArticleView] = useState<ArticleView>('card');
    const [viewMode, setViewMode] = useState<ViewMode>('pc');
    const [widgetSettings, setWidgetSettings] = useState<WidgetSettings>(defaultWidgetSettings);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    
    const [folders, setFolders] = useState<Folder[]>(defaultFolders);
    const [feeds, setFeeds] = useState<Feed[]>(defaultFeeds);
    const [readArticleIds, setReadArticleIds] = useState<Set<string>>(new Set());
    const [bookmarkedArticleIds, setBookmarkedArticleIds] = useState<Set<string>>(new Set());
    const [articleTags, setArticleTags] = useState<Map<string, Set<string>>>(new Map());

    const [lastRefresh, setLastRefresh] = useState(() => Date.now());
    
    const isApiKeyMissing = !process.env.API_KEY;

    const loadSettings = useCallback((settings: Partial<Settings>) => {
        setFeeds(settings.feeds || defaultFeeds);
        setFolders(settings.folders || defaultFolders);
        setTheme(settings.theme || 'dark');
        setArticleView(settings.articleView || 'card');
        setViewMode(settings.viewMode || 'pc');
        setWidgetSettings(settings.widgets || defaultWidgetSettings);
    }, []);

    const loadLocalData = useCallback(() => {
        try {
            const storedSettings = window.localStorage.getItem(SETTINGS_KEY);
            const settings = storedSettings ? JSON.parse(storedSettings) : {};
            loadSettings(settings);

            const savedReadArticles = window.localStorage.getItem(READ_ARTICLES_KEY);
            setReadArticleIds(savedReadArticles ? new Set(JSON.parse(savedReadArticles)) : new Set());
            const savedBookmarks = window.localStorage.getItem(BOOKMARKED_ARTICLES_KEY);
            setBookmarkedArticleIds(savedBookmarks ? new Set(JSON.parse(savedBookmarks)) : new Set());
            const savedTags = window.localStorage.getItem(ARTICLE_TAGS_KEY);
            if (savedTags) {
                const parsedTags = JSON.parse(savedTags) as [string, string[]][];
                setArticleTags(new Map(parsedTags.map(([id, tags]) => [id, new Set(tags)])));
            } else {
                setArticleTags(new Map());
            }
        } catch (e) {
            console.error("Error loading data from localStorage", e);
            loadSettings({});
            setReadArticleIds(new Set());
            setBookmarkedArticleIds(new Set());
            setArticleTags(new Map());
        }
    }, [loadSettings]);
    
    // Load data from local storage on initial mount
    useEffect(() => {
        loadLocalData();
    }, [loadLocalData]);
    
    // Auto-refresh feeds every 5 minutes
    useEffect(() => {
        const feedInterval = setInterval(() => {
            console.log('Auto-refreshing feeds...');
            setLastRefresh(Date.now());
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(feedInterval);
    }, []);

    // Save article states to local storage when they change
    useEffect(() => {
        try {
            window.localStorage.setItem(READ_ARTICLES_KEY, JSON.stringify(Array.from(readArticleIds)));
        } catch (error) { console.error("Failed to save read articles to localStorage", error); }
    }, [readArticleIds]);

    useEffect(() => {
        try {
            window.localStorage.setItem(BOOKMARKED_ARTICLES_KEY, JSON.stringify(Array.from(bookmarkedArticleIds)));
        } catch (error) { console.error("Failed to save bookmarks to localStorage", error); }
    }, [bookmarkedArticleIds]);

    useEffect(() => {
        try {
            const tagsToSave = Array.from(articleTags.entries()).map(([id, tags]) => [id, Array.from(tags)]);
            const filteredTagsToSave = tagsToSave.filter(([, tags]) => tags.length > 0);
            window.localStorage.setItem(ARTICLE_TAGS_KEY, JSON.stringify(filteredTagsToSave));
        } catch (error) {
            console.error("Failed to save article tags to localStorage", error);
        }
    }, [articleTags]);
    
    // Save settings to local storage when they change
    useEffect(() => {
        try {
            const settings: Settings = { feeds, folders, theme, articleView, viewMode, widgets: widgetSettings };
            window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error("Failed to save settings to localStorage", error);
        }
    }, [feeds, folders, theme, articleView, viewMode, widgetSettings]);
    
    // Apply theme to HTML element
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

    const handleAddSource = async (url: string, type: SourceType) => {
        let feedUrl = url;
        let originalUrl = url;

        try {
            if (type === 'youtube') {
                const response = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);
                if (!response.ok) throw new Error('Could not fetch YouTube channel page.');
                const text = await response.text();
                const match = text.match(/"channelId":"(.*?)"/);
                if (!match || !match[1]) throw new Error('Could not find YouTube channel ID.');
                const channelId = match[1];
                feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
            } else if (type === 'website') {
                feedUrl = `https://www.fivefilters.org/feed-creator/extract.php?url=${encodeURIComponent(url)}&format=xml`;
            }

            if (feeds.some(feed => feed.url === feedUrl)) {
                alert("This feed has already been added.");
                return;
            }

            const response = await fetch(`${CORS_PROXY}${encodeURIComponent(feedUrl)}`);
            if (!response.ok) throw new Error(`Network response was not ok (status: ${response.status}).`);
            const text = await response.text();
            const parser = new DOMParser();
            const xml = parser.parseFromString(text, "application/xml");
            if (xml.querySelector('parsererror')) {
                throw new Error('Failed to parse RSS feed. If this is a website URL, please use the "Website" tab.');
            }
            const feedTitle = xml.querySelector('channel > title')?.textContent || xml.querySelector('feed > title')?.textContent || new URL(originalUrl).hostname;
            const siteLink = xml.querySelector('channel > link')?.textContent || originalUrl;
            const domainUrl = new URL(siteLink).hostname;
            const iconUrl = `https://www.google.com/s2/favicons?sz=32&domain_url=${domainUrl}`;
            const newFeed: Feed = { id: Date.now(), title: feedTitle, url: feedUrl, iconUrl, folderId: null };
            setFeeds(prevFeeds => [...prevFeeds, newFeed]);
            setSelection({ type: 'feed', id: newFeed.id });

        } catch (error) {
            console.error("Failed to add source:", error);
            alert(`Could not add source. ${error instanceof Error ? error.message : 'Please check the URL and try again.'}`);
        }
    };

    const handleRemoveFeed = (id: number) => {
        const feedToRemove = feeds.find(f => f.id === id);
        setFeeds(feeds.filter(feed => feed.id !== id));
        if (feedToRemove && selection.type === 'feed' && selection.id === feedToRemove.id) {
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
    
    const handleMarkAsUnread = (articleId: string) => {
        setReadArticleIds(prev => {
            if (!prev.has(articleId)) return prev;
            const newSet = new Set(prev);
            newSet.delete(articleId);
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
    
    const handleSetArticleTags = (articleId: string, tags: Set<string>) => {
        setArticleTags(prev => {
            const newMap = new Map(prev);
            if (tags.size === 0) {
                newMap.delete(articleId); // Clean up empty sets from the map
            } else {
                newMap.set(articleId, tags);
            }
            return newMap;
        });
    };

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
                const parser = new DOMParser();
                const xml = parser.parseFromString(xmlText, "application/xml");
                if (xml.querySelector('parsererror')) throw new Error('Failed to parse OPML file.');
                
                const importedFolders: Folder[] = [...folders];
                const importedFeeds: Feed[] = [...feeds];
                
                const body = xml.querySelector('body');
                if (!body) throw new Error("Invalid OPML file: missing <body> tag.");

                const existingFeedUrls = new Set(feeds.map(f => f.url));

                body.querySelectorAll(':scope > outline').forEach(outline => {
                    const isFolder = !outline.getAttribute('xmlUrl');
                    if (isFolder) {
                        const folderName = outline.getAttribute('text') || outline.getAttribute('title');
                        if (folderName) {
                            let folder = importedFolders.find(f => f.name === folderName);
                            if (!folder) {
                                folder = { id: Date.now() + Math.random(), name: folderName };
                                importedFolders.push(folder);
                            }
                            
                            outline.querySelectorAll('outline').forEach(feedOutline => {
                                const feedUrl = feedOutline.getAttribute('xmlUrl');
                                if (feedUrl && !existingFeedUrls.has(feedUrl)) {
                                    const feedTitle = feedOutline.getAttribute('text') || feedOutline.getAttribute('title') || new URL(feedUrl).hostname;
                                    const iconUrl = `https://www.google.com/s2/favicons?sz=32&domain_url=${new URL(feedUrl).hostname}`;
                                    importedFeeds.push({ id: Date.now() + Math.random(), title: feedTitle, url: feedUrl, iconUrl, folderId: folder.id });
                                    existingFeedUrls.add(feedUrl);
                                }
                            });
                        }
                    } else { // Unfiled feed
                        const feedUrl = outline.getAttribute('xmlUrl');
                        if (feedUrl && !existingFeedUrls.has(feedUrl)) {
                            const feedTitle = outline.getAttribute('text') || outline.getAttribute('title') || new URL(feedUrl).hostname;
                            const iconUrl = `https://www.google.com/s2/favicons?sz=32&domain_url=${new URL(feedUrl).hostname}`;
                            importedFeeds.push({ id: Date.now() + Math.random(), title: feedTitle, url: feedUrl, iconUrl, folderId: null });
                            existingFeedUrls.add(feedUrl);
                        }
                    }
                });

                setFolders(importedFolders);
                setFeeds(importedFeeds);
                alert('Feeds imported successfully!');
            } catch (error) {
                console.error("Failed to import OPML:", error);
                alert(`Could not import OPML file. It may be invalid. Error: ${error instanceof Error ? error.message : String(error)}`);
            }
        };
        reader.readAsText(file);
    };

    const handleExportSettings = () => {
        const settingsToExport: Settings = {
            feeds,
            folders,
            theme,
            articleView,
            viewMode,
            widgets: widgetSettings
        };
        const jsonString = JSON.stringify(settingsToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'seemore_backup.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportSettings = (file: File) => {
        if (!window.confirm('This will overwrite all your current feeds, folders, and preferences. Are you sure you want to continue?')) {
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const importedSettings = JSON.parse(text) as Settings;
                
                // Basic validation
                if (importedSettings.feeds && importedSettings.folders && importedSettings.theme && importedSettings.articleView && importedSettings.widgets) {
                    loadSettings(importedSettings);
                    alert('Settings imported successfully!');
                } else {
                    throw new Error('Invalid settings file format.');
                }
            } catch (error) {
                 console.error("Failed to import settings:", error);
                 alert(`Could not import settings file. It may be invalid. Error: ${error instanceof Error ? error.message : String(error)}`);
            }
        };
        reader.readAsText(file);
    };
    
    const handleUpdateSettings = (newSettings: Partial<Omit<Settings, 'feeds' | 'folders'>>) => {
        if (newSettings.theme) setTheme(newSettings.theme);
        if (newSettings.articleView) setArticleView(newSettings.articleView);
        if (newSettings.viewMode) setViewMode(newSettings.viewMode);
        if (newSettings.widgets) setWidgetSettings(newSettings.widgets);
    };
    
    let feedsToDisplay: Feed[] = [];
    let title = '';

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
    }

    const currentSettings: Settings = {
        feeds, folders, theme, articleView, viewMode, widgets: widgetSettings
    };
    
    return (
        <div className="h-screen font-sans text-sm relative bg-white dark:bg-zinc-950">
            {isSidebarOpen && (
                <div onClick={() => setIsSidebarOpen(false)} className={`fixed inset-0 bg-black/60 z-30 ${viewMode === 'pc' ? 'md:hidden' : ''}`} aria-hidden="true" />
            )}
            <Sidebar
                isSidebarOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                feeds={feeds}
                folders={folders}
                selection={selection}
                onAddSource={handleAddSource}
                onRemoveFeed={handleRemoveFeed}
                onSelect={handleSelect}
                onAddFolder={handleAddFolder}
                onRenameFolder={handleRenameFolder}
                onDeleteFolder={handleDeleteFolder}
                onMoveFeedToFolder={handleMoveFeedToFolder}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
                viewMode={viewMode}
                setViewMode={setViewMode}
            />
            <div className={`${viewMode === 'pc' ? 'md:ml-72' : ''} h-full`}>
                <MainContent
                    onMenuClick={() => setIsSidebarOpen(true)}
                    onSearch={(query: string) => setSelection({ type: 'search', id: null, query })}
                    feedsToDisplay={feedsToDisplay}
                    title={title}
                    selection={selection}
                    key={JSON.stringify(selection)}
                    readArticleIds={readArticleIds}
                    bookmarkedArticleIds={bookmarkedArticleIds}
                    articleTags={articleTags}
                    onMarkAsRead={handleMarkAsRead}
                    onMarkAsUnread={handleMarkAsUnread}
                    onMarkMultipleAsRead={handleMarkMultipleAsRead}
                    onToggleBookmark={handleToggleBookmark}
                    onSetArticleTags={handleSetArticleTags}
                    articleView={articleView}
                    setArticleView={setArticleView}
                    allFeeds={feeds}
                    isApiKeyMissing={isApiKeyMissing}
                    refreshKey={lastRefresh}
                    widgetSettings={widgetSettings}
                    onOpenSettings={() => setIsSettingsModalOpen(true)}
                    viewMode={viewMode}
                />
            </div>
            <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                settings={currentSettings}
                onUpdateSettings={handleUpdateSettings}
                onImportOpml={handleImportOpml}
                onExportOpml={handleExportOpml}
                onImportSettings={handleImportSettings}
                onExportSettings={handleExportSettings}
            />
        </div>
    );
};

export default App;
