



import React, { useState, useEffect, useCallback, useMemo } from 'react';
import MainContent from '../components/MainContent';
import type { SourceType } from '../components/AddSource';
import SettingsModal from '../components/SettingsModal';
import AddSourceModal from '../components/AddSourceModal';
import Sidebar from '../components/Sidebar';
import { useSwipe } from '../hooks/useSwipe';
import NavigationOverlay from '../components/NavigationOverlay';
import { ListIcon, TrophyIcon, RedditIcon, YoutubeIcon, NewspaperIcon } from '../components/icons';


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
  type: 'all' | 'folder' | 'bookmarks' | 'search' | 'feed' | 'reddit' | 'youtube';
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

export interface Proxy {
  url: string;
  encode: boolean;
}

export const PROXIES: Proxy[] = [
  { url: 'https://api.allorigins.win/raw?url=', encode: true },
  { url: 'https://cors.eu.org/', encode: false },
  { url: 'https://corsproxy.io/?', encode: true }, // Corrected: was false
  { url: 'https://thingproxy.freeboard.io/fetch/', encode: false },
  { url: 'https://api.codetabs.com/v1/proxy/?quest=', encode: true },
];

const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};


export const resilientFetch = async (url: string, options: RequestInit & { timeout?: number } = {}) => {
  let lastError: Error | null = null;
  const { timeout = 15000 } = options;
  const shuffledProxies = shuffleArray(PROXIES);

  for (const proxy of shuffledProxies) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const proxyUrl = `${proxy.url}${proxy.encode ? encodeURIComponent(url) : url}`;
    
    try {
      const response = await fetch(proxyUrl, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        return response;
      }
      const errorText = await response.text().catch(() => 'Could not read error response.');
      lastError = new Error(`Proxy ${proxy.url} failed for ${url} with status: ${response.status}. Body: ${errorText.substring(0, 100)}`);
      console.warn(lastError.message);
    } catch (e) {
      clearTimeout(timeoutId);
      if ((e as Error).name === 'AbortError') {
        lastError = new Error(`Proxy ${proxy.url} timed out for ${url}`);
      } else {
        lastError = e as Error;
      }
      console.warn(`Proxy ${proxy.url} fetch failed for ${url}:`, lastError);
    }
  }
  throw lastError || new Error(`All proxies failed to fetch the resource: ${url}`);
};

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

const App: React.FC = () => {
    const [theme, setTheme] = useState<Theme>('dark');
    const [articleView, setArticleView] = useState<ArticleView>('list');
    const [widgetSettings, setWidgetSettings] = useState<WidgetSettings>(defaultWidgetSettings);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isNavOverlayOpen, setIsNavOverlayOpen] = useState(false);
    
    const [folders, setFolders] = useState<Folder[]>(defaultFolders);
    const [feeds, setFeeds] = useState<Feed[]>(defaultFeeds);
    const [readArticleIds, setReadArticleIds] = useState<Set<string>>(new Set());
    const [bookmarkedArticleIds, setBookmarkedArticleIds] = useState<Set<string>>(new Set());
    const [articleTags, setArticleTags] = useState<Map<string, Set<string>>>(new Map());

    const [lastRefresh, setLastRefresh] = useState(() => Date.now());
    
    const isApiKeyMissing = !process.env.API_KEY;

    // New Navigation State
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [animationClass, setAnimationClass] = useState('animate-fade-in');

    const mainPages = useMemo(() => {
        const sportFolder = folders.find(f => f.name.toLowerCase() === 'sport');
        const newsFolder = folders.find(f => f.name.toLowerCase() === 'news');
        return [
            { selection: { type: 'all' as const, id: null }, name: 'All Feeds', icon: <ListIcon className="w-6 h-6" /> },
            newsFolder ? { selection: { type: 'folder' as const, id: newsFolder.id }, name: 'News', icon: <NewspaperIcon className="w-6 h-6" /> } : null,
            sportFolder ? { selection: { type: 'folder' as const, id: sportFolder.id }, name: 'Sport', icon: <TrophyIcon className="w-6 h-6" /> } : null,
            { selection: { type: 'reddit' as const, id: null }, name: 'Reddit', icon: <RedditIcon className="w-6 h-6" /> },
            { selection: { type: 'youtube' as const, id: null }, name: 'YouTube', icon: <YoutubeIcon className="w-6 h-6" /> },
        ].filter((page): page is NonNullable<typeof page> => !!page);
    }, [folders]);
    
    const [selection, setSelection] = useState<Selection>(mainPages[currentPageIndex].selection);

    const navigate = useCallback((newIndex: number) => {
        if (newIndex === currentPageIndex || newIndex < 0 || newIndex >= mainPages.length) {
            return;
        }

        if (newIndex > currentPageIndex) {
            setAnimationClass('animate-slide-in-from-right');
        } else {
            setAnimationClass('animate-slide-in-from-left');
        }
        // Update both the index and the selection in the same render cycle
        // to prevent UI flicker with stale content.
        setCurrentPageIndex(newIndex);
        setSelection(mainPages[newIndex].selection);
    }, [currentPageIndex, mainPages]);

    const swipeHandlers = useSwipe({
        onSwipeLeft: () => {
            if (currentPageIndex < mainPages.length - 1) {
                navigate(currentPageIndex + 1);
            }
        },
        onSwipeRight: () => {
            if (currentPageIndex > 0) {
                navigate(currentPageIndex - 1);
            }
        },
    });

    const loadSettings = useCallback((settings: Partial<Settings>) => {
        setFeeds(settings.feeds || defaultFeeds);
        setFolders(settings.folders || defaultFolders);
        setTheme(settings.theme || 'dark');
        setArticleView(settings.articleView || 'list');
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
    
    useEffect(() => {
        loadLocalData();
    }, [loadLocalData]);
    
    useEffect(() => {
        const feedInterval = setInterval(() => {
            setLastRefresh(Date.now());
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(feedInterval);
    }, []);

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
    
    useEffect(() => {
        try {
            const settings: Settings = { feeds, folders, theme, articleView, widgets: widgetSettings };
            window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error("Failed to save settings to localStorage", error);
        }
    }, [feeds, folders, theme, articleView, widgetSettings]);
    
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
        // Find if the selection corresponds to a main page
        const pageIndex = mainPages.findIndex(p => 
            p.selection.type === sel.type && p.selection.id === sel.id
        );

        if (pageIndex !== -1) {
            navigate(pageIndex);
        } else {
            // It's a selection not on the main nav (e.g., a specific feed), just set it directly
            setAnimationClass('animate-fade-in');
            setSelection(sel);
            // We might want to reset currentPageIndex here or handle it differently
            // For now, let's just show the content without changing the main page index
        }
        setIsSidebarOpen(false);
    };

    const handleAddSource = async (url: string, type: SourceType) => {
        let feedUrl = url;
        let originalUrl = url;

        try {
            if (type === 'youtube') {
                // Fast path for playlist URLs
                if (url.includes('/playlist?list=')) {
                    const playlistIdMatch = url.match(/list=([a-zA-Z0-9_-]+)/);
                    if (playlistIdMatch && playlistIdMatch[1]) {
                        feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistIdMatch[1]}`;
                    } else {
                        throw new Error('Could not parse playlist ID from URL.');
                    }
                } else {
                    // Handle channel, handle, user, and custom URLs
                    let channelId: string | null = null;
    
                    // 1. Try to parse channel ID directly from URL (fastest)
                    const channelIdMatch = url.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]{24})/);
                    if (channelIdMatch && channelIdMatch[1]) {
                        channelId = channelIdMatch[1];
                    } else {
                        // 2. Use a lightweight API to resolve handle/username to channel ID
                        const pathParts = new URL(url).pathname.split('/').filter(p => p);
                        const identifier = pathParts.length > 0 ? pathParts[pathParts.length - 1] : null;
    
                        if (!identifier) {
                            throw new Error('Could not find a channel identifier in the URL.');
                        }
                        
                        let resolverApiUrl: string;
                        // Check for @handle format first, as it's the most common now
                        if (identifier.startsWith('@')) {
                            resolverApiUrl = `https://yt.lemnoslife.com/channels?handle=${encodeURIComponent(identifier)}`;
                        } else if (pathParts.includes('user')) {
                            resolverApiUrl = `https://yt.lemnoslife.com/channels?username=${encodeURIComponent(identifier)}`;
                        } else {
                            // Fallback for custom URLs like /c/SomeName or just /SomeName
                            resolverApiUrl = `https://yt.lemnoslife.com/channels?handle=@${encodeURIComponent(identifier)}`;
                        }
    
                        try {
                            const response = await resilientFetch(resolverApiUrl);
                            if (!response.ok) throw new Error(`Resolver API failed with status ${response.status}`);
                            const data = await response.json();
                            if (data.items && data.items.length > 0 && data.items[0].id) {
                                channelId = data.items[0].id;
                            } else {
                                throw new Error('Could not resolve channel ID from the API.');
                            }
                        } catch (apiError) {
                            console.warn("YouTube resolver API failed, falling back to page scraping.", apiError);
                            // 3. Fallback to the original, slow scraping method if the API fails
                            let cleanUrl = url.split('?')[0];
                            const response = await resilientFetch(cleanUrl);
                            if (!response.ok) throw new Error('Could not fetch YouTube channel page.');
                            const text = await response.text();
                            const canonicalMatch = text.match(/<link rel="canonical" href="https:\/\/www.youtube.com\/channel\/([a-zA-Z0-9_-]+)"/);
                            if (canonicalMatch && canonicalMatch[1]) {
                                channelId = canonicalMatch[1];
                            } else {
                                const jsonMatch = text.match(/"channelId":"([a-zA-Z0-9_-]+)"/);
                                if (jsonMatch && jsonMatch[1]) {
                                    channelId = jsonMatch[1];
                                }
                            }
    
                            if (!channelId) {
                                 throw new Error('Could not find a valid YouTube channel ID from both the API and page source.');
                            }
                        }
                    }
                    
                    if (!channelId) {
                         throw new Error('Could not find a valid YouTube channel ID from the provided URL.');
                    }
    
                    // Every channel's uploads can be accessed via a playlist ID derived from its channel ID.
                    // This is often more reliable than the channel_id feed URL.
                    const uploadsPlaylistId = channelId.replace(/^UC/, 'UU');
                    feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${uploadsPlaylistId}`;
                }
            } else if (type === 'website') {
                feedUrl = `https://www.fivefilters.org/feed-creator/extract.php?url=${encodeURIComponent(url)}&format=xml`;
            } else if (type === 'reddit') {
                const redditUrl = url.trim();
                const match = redditUrl.match(/reddit\.com\/(r\/[a-zA-Z0-9_]+|user\/[a-zA-Z0-9_-]+)/);
                if (match && match[1]) {
                    feedUrl = `https://www.reddit.com/${match[1]}/.rss`;
                } else {
                    let tempUrl = url.trim();
                    if (tempUrl.endsWith('/')) {
                        tempUrl = tempUrl.slice(0, -1);
                    }
                    feedUrl = `${tempUrl}/.rss`;
                }
            }

            if (feeds.some(feed => feed.url === feedUrl)) {
                throw new Error("This feed has already been added.");
            }

            const response = await resilientFetch(feedUrl);
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
            const newFeed: Feed = { id: Date.now(), title: feedTitle, url: feedUrl, iconUrl, folderId: null, sourceType: type };
            setFeeds(prevFeeds => [...prevFeeds, newFeed]);
            navigate(0); // Go back to 'All Feeds'
        } catch (error) {
            console.error("Failed to add source:", error);
            if (error instanceof TypeError && error.message.toLowerCase().includes('failed to fetch')) {
                 throw new Error('Connection failed. Please check your network or try again. A browser extension might also be blocking requests.');
            }
            throw error;
        }
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
                newMap.delete(articleId);
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
                                    importedFeeds.push({ id: Date.now() + Math.random(), title: feedTitle, url: feedUrl, iconUrl, folderId: folder.id, sourceType: 'rss' });
                                    existingFeedUrls.add(feedUrl);
                                }
                            });
                        }
                    } else { // Unfiled feed
                        const feedUrl = outline.getAttribute('xmlUrl');
                        if (feedUrl && !existingFeedUrls.has(feedUrl)) {
                            const feedTitle = outline.getAttribute('text') || outline.getAttribute('title') || new URL(feedUrl).hostname;
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
        if (newSettings.widgets) setWidgetSettings(newSettings.widgets);
    };

    const handleRemoveFeed = (id: number) => {
        setFeeds(prev => prev.filter(f => f.id !== id));
    };

    const handleAddFolder = (name: string) => {
        const newFolder: Folder = { id: Date.now(), name };
        setFolders(prev => [...prev, newFolder]);
    };

    const handleRenameFolder = (id: number, newName: string) => {
        setFolders(prev => prev.map(f => (f.id === id ? { ...f, name: newName } : f)));
    };

    const handleDeleteFolder = (id: number) => {
        if (window.confirm('Are you sure you want to delete this folder and unfile its feeds?')) {
            setFolders(prev => prev.filter(f => f.id !== id));
            setFeeds(prev => prev.map(f => (f.folderId === id ? { ...f, folderId: null } : f)));
        }
    };

    const handleMoveFeedToFolder = (feedId: number, folderId: number | null) => {
        setFeeds(prev => prev.map(f => (f.id === feedId ? { ...f, folderId } : f)));
    };
    
    let feedsToDisplay: Feed[] = [];
    if (selection.type === 'all' || selection.type === 'search' || selection.type === 'bookmarks') {
        feedsToDisplay = feeds;
    } else if (selection.type === 'folder') {
        feedsToDisplay = feeds.filter(f => f.folderId === selection.id);
    } else if (selection.type === 'feed') {
        const feed = feeds.find(f => f.id === selection.id);
        feedsToDisplay = feed ? [feed] : [];
    } else if (selection.type === 'reddit') {
        feedsToDisplay = feeds.filter(f => f.sourceType === 'reddit');
    } else if (selection.type === 'youtube') {
        feedsToDisplay = feeds.filter(f => f.sourceType === 'youtube');
    }

    const currentSettings: Settings = {
        feeds, folders, theme, articleView, widgets: widgetSettings
    };

    const pageTitle = useMemo(() => {
        if (selection.type === 'search') {
            return `Search: "${selection.query}"`;
        }
        if (selection.type === 'bookmarks') {
            return 'Read Later';
        }

        const mainPage = mainPages.find(p => p.selection.type === selection.type && p.selection.id === selection.id);
        if (mainPage) {
            return mainPage.name;
        }

        if (selection.type === 'feed') {
            const feed = feeds.find(f => f.id === selection.id);
            return feed ? feed.title : 'Feed';
        }
        if (selection.type === 'folder') {
            const folder = folders.find(f => f.id === selection.id);
            return folder ? folder.name : 'Folder';
        }
        
        return 'See More'; // Fallback
    }, [selection, mainPages, feeds, folders]);
    
    return (
        <div className="h-screen font-sans text-sm relative flex">
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
            <div {...swipeHandlers} className="flex-1 flex flex-col min-w-0 md:ml-72 relative overflow-hidden">
                <MainContent
                    key={currentPageIndex}
                    animationClass={animationClass}
                    pageTitle={pageTitle}
                    onSearch={(query: string) => setSelection({ type: 'search', id: null, query })}
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
                    onOpenNavOverlay={() => setIsNavOverlayOpen(true)}
                />
            </div>
            <NavigationOverlay
                isOpen={isNavOverlayOpen}
                onClose={() => setIsNavOverlayOpen(false)}
                pages={mainPages}
                currentPageIndex={currentPageIndex}
                onNavigate={navigate}
                onOpenSidebar={() => setIsSidebarOpen(true)}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
            />
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
            <AddSourceModal
                isOpen={isAddSourceModalOpen}
                onClose={() => setIsAddSourceModalOpen(false)}
                onAddSource={handleAddSource}
            />
        </div>
    );
};

export default App;