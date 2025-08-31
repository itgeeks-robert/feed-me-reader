
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Feed, Selection, ArticleView, WidgetSettings } from '../App';
import type { GoogleUserProfile } from '../services/googleDriveService';
import { CORS_PROXY } from '../App';
import { GoogleGenAI, Type } from '@google/genai';
import { SparklesIcon, CheckCircleIcon, MenuIcon, BookmarkIcon, ViewColumnsIcon, ViewListIcon, ViewGridIcon, XIcon, SearchIcon, ArrowUturnLeftIcon, ChevronDownIcon, TagIcon, SettingsIcon, CloudIcon, SunIcon, ShareIcon, DotsHorizontalIcon, SeymourIcon } from './icons';

// Create a single, shared AI instance, initialized once.
if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable is not set. AI features will be degraded or unavailable.");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

interface Article {
    id: string;
    title: string;
    link: string;
    source: string;
    publishedDate: Date | null;
    snippet: string;
    imageUrl: string | null;
}

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
    
    // For anything older than a week, show the date
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const parseRssXml = (xmlText: string, sourceTitle: string): Article[] => {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, "application/xml");
    const errorNode = xml.querySelector('parsererror');
    if (errorNode) {
        throw new Error(`Failed to parse RSS feed for ${sourceTitle}.`);
    }

    const items = Array.from(xml.querySelectorAll('item, entry'));
    return items.map(item => {
        const title = item.querySelector('title')?.textContent || 'No title';
        const link = item.querySelector('link')?.getAttribute('href') || item.querySelector('link')?.textContent || '';
        const description = item.querySelector('description')?.textContent || item.querySelector('summary')?.textContent || '';
        const snippet = description.replace(/<[^>]*>?/gm, '').substring(0, 200) + (description.length > 200 ? '...' : '');
        const pubDateStr = item.querySelector('pubDate')?.textContent || item.querySelector('published')?.textContent || item.querySelector('updated')?.textContent;
        const publishedDate = pubDateStr ? new Date(pubDateStr) : null;
        
        let imageUrl: string | null = null;
        
        const mediaContent = item.querySelector('media\\:content, content');
        if (mediaContent && mediaContent.getAttribute('medium') === 'image') {
            imageUrl = mediaContent.getAttribute('url');
        }

        if (!imageUrl) {
            const enclosure = item.querySelector('enclosure');
            if (enclosure && enclosure.getAttribute('type')?.startsWith('image')) {
                imageUrl = enclosure.getAttribute('url');
            }
        }
        
        if (!imageUrl) {
            const mediaThumbnail = item.querySelector('media\\:thumbnail, thumbnail');
            if (mediaThumbnail) {
                imageUrl = mediaThumbnail.getAttribute('url');
            }
        }

        if (!imageUrl) {
            const contentEncoded = item.querySelector('content\\:encoded, encoded')?.textContent;
            const contentToParse = contentEncoded || description;
            const doc = new DOMParser().parseFromString(contentToParse, 'text/html');
            const img = doc.querySelector('img');
            if (img) {
                imageUrl = img.getAttribute('src');
            }
        }

        return {
            id: link || `${title}-${pubDateStr}`,
            title,
            link,
            snippet,
            publishedDate,
            source: sourceTitle,
            imageUrl,
        };
    });
};

const ArticleItem: React.FC<{
    article: Article,
    isRead: boolean,
    isBookmarked: boolean,
    tags: Set<string>,
    onMarkAsRead: (id: string) => void,
    onMarkAsUnread: (id: string) => void,
    onToggleBookmark: (id: string) => void,
    onSetTags: (tags: Set<string>) => void,
    view: ArticleView,
    isFocused: boolean,
    articleRef: (el: HTMLDivElement | null) => void,
}> = ({ article, isRead, isBookmarked, tags, onMarkAsRead, onMarkAsUnread, onToggleBookmark, onSetTags, view, isFocused, articleRef }) => {
    const [isEditingTags, setIsEditingTags] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const tagInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditingTags) {
            tagInputRef.current?.focus();
        }
    }, [isEditingTags]);

    const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const newTag = tagInput.trim().toLowerCase();
            if (newTag && !tags.has(newTag)) {
                onSetTags(new Set([...tags, newTag]));
            }
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        const newTags = new Set(tags);
        newTags.delete(tagToRemove);
        onSetTags(newTags);
    };

    const handleTagEditorBlur = () => {
        const newTag = tagInput.trim().toLowerCase();
        if (newTag && !tags.has(newTag)) {
            onSetTags(new Set([...tags, newTag]));
        }
        setTagInput('');
        setIsEditingTags(false);
    };
    
    const handleMarkAsUnread = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onMarkAsUnread(article.id);
    };

    if (view === 'compact') {
        return (
             <div ref={articleRef} className={`flex items-start justify-between gap-4 py-3 border-b border-gray-200 dark:border-zinc-700/50 ${isRead ? 'opacity-60' : ''} ${isFocused ? 'bg-gray-100 dark:bg-zinc-800 rounded-md' : ''}`}>
                <div className="flex items-center gap-3 flex-1 truncate">
                    <a href={article.link} onClick={() => onMarkAsRead(article.id)} target="_blank" rel="noopener noreferrer" className="text-base font-medium text-zinc-800 dark:text-gray-100 hover:text-lime-500 dark:hover:text-lime-400 truncate">
                        {article.title}
                    </a>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                    <span className="w-24 truncate text-right">{article.source}</span>
                    <span className="w-16 text-right">{timeAgo(article.publishedDate)}</span>
                    {isRead && (
                         <button onClick={handleMarkAsUnread} className="text-gray-400 hover:text-lime-500" aria-label="Mark as unread">
                            <ArrowUturnLeftIcon className="w-5 h-5" />
                        </button>
                    )}
                     <button onClick={() => onToggleBookmark(article.id)} className="text-gray-400 hover:text-lime-500" aria-label="Bookmark article">
                        <BookmarkIcon className="w-5 h-5" solid={isBookmarked} />
                    </button>
                </div>
            </div>
        );
    }

    const isMagazine = view === 'magazine';
    const cardClasses = `bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-gray-200 dark:border-zinc-700/50 hover:border-gray-300 dark:hover:border-zinc-600 transition-all duration-200 ${isRead ? 'opacity-60 hover:opacity-100' : ''} ${isFocused ? 'ring-2 ring-lime-500' : ''}`;
    const layoutClasses = isMagazine ? 'flex flex-col' : 'flex flex-col md:flex-row md:items-start';
    const imageWrapperClasses = isMagazine ? 'w-full' : 'w-full md:w-32 md:flex-shrink-0';
    const imageClasses = isMagazine
        ? "w-full h-48 object-cover rounded-t-lg bg-gray-200 dark:bg-zinc-700"
        : "w-full h-40 object-cover rounded-t-lg md:h-20 md:w-32 md:rounded-l-lg md:rounded-t-none bg-gray-200 dark:bg-zinc-700";
    const contentClasses = isMagazine ? 'p-4' : 'p-4 flex-1';

    return (
        <div className={cardClasses} ref={articleRef}>
            <div className={layoutClasses}>
                {article.imageUrl && (
                    <div className={imageWrapperClasses}>
                        <a href={article.link} onClick={() => onMarkAsRead(article.id)} target="_blank" rel="noopener noreferrer" aria-label={article.title}>
                            <img src={article.imageUrl} alt="" className={imageClasses} loading="lazy" />
                        </a>
                    </div>
                )}
                <div className={contentClasses}>
                    <div className="flex justify-between items-start mb-2 gap-4">
                        <a href={article.link} onClick={() => onMarkAsRead(article.id)} target="_blank" rel="noopener noreferrer" className="text-lg font-medium text-zinc-800 dark:text-gray-100 hover:text-lime-500 dark:hover:text-lime-400">
                            {article.title}
                        </a>
                        <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap pt-1">{timeAgo(article.publishedDate)}</div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{article.snippet}</p>
                    
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                            <span>{article.source}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            {isRead && (
                                <button onClick={handleMarkAsUnread} className="flex items-center space-x-1 text-xs text-gray-500 dark:text-zinc-400 hover:text-lime-500 dark:hover:text-lime-400 font-medium">
                                    <ArrowUturnLeftIcon className="w-4 h-4" />
                                    <span>Unread</span>
                                </button>
                            )}
                            <button onClick={() => setIsEditingTags(!isEditingTags)} className="text-gray-400 hover:text-lime-500" aria-label="Add or edit tags">
                                <TagIcon className="w-5 h-5" />
                            </button>
                             <button onClick={() => onToggleBookmark(article.id)} className="text-gray-400 hover:text-lime-500" aria-label="Bookmark article">
                                <BookmarkIcon className="w-5 h-5" solid={isBookmarked} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {(tags.size > 0 || isEditingTags) && (
                 <div className="border-t border-gray-200 dark:border-zinc-700/50">
                    {(tags.size > 0 || isEditingTags) && (
                        <div className="p-4">
                            <div className="flex flex-wrap items-center gap-2">
                                {Array.from(tags).map(tag => (
                                    <span key={tag} className="inline-flex items-center gap-x-1.5 rounded-full bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-zinc-700 dark:text-zinc-300">
                                        {tag}
                                        {isEditingTags && (
                                            <button onClick={() => handleRemoveTag(tag)} className="flex-shrink-0 h-4 w-4 rounded-full inline-flex items-center justify-center text-gray-500 hover:bg-gray-300 hover:text-gray-600 dark:text-zinc-400 dark:hover:bg-zinc-600 dark:hover:text-zinc-200 focus:outline-none" aria-label={`Remove ${tag} tag`}>
                                                <XIcon className="h-3 w-3" />
                                            </button>
                                        )}
                                    </span>
                                ))}
                                {isEditingTags && (
                                    <input
                                        ref={tagInputRef}
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleAddTag}
                                        onBlur={handleTagEditorBlur}
                                        placeholder="Add a tag..."
                                        className="bg-transparent text-sm focus:outline-none p-1 flex-grow"
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const fetchWithTimeout = (resource: RequestInfo, options: RequestInit & { timeout?: number } = {}) => {
  const { timeout = 8000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const promise = fetch(resource, { ...options, signal: controller.signal });
  promise.finally(() => clearTimeout(id));
  return promise;
};

interface MainContentProps {
    feedsToDisplay: Feed[];
    title: string;
    selection: Selection;
    readArticleIds: Set<string>;
    bookmarkedArticleIds: Set<string>;
    articleTags: Map<string, Set<string>>;
    onMarkAsRead: (articleId: string) => void;
    onMarkAsUnread: (articleId: string) => void;
    onMarkMultipleAsRead: (articleIds: string[]) => void;
    onToggleBookmark: (articleId: string) => void;
    onSetArticleTags: (articleId: string, tags: Set<string>) => void;
    onMenuClick: () => void;
    onSearch: (query: string) => void;
    articleView: ArticleView;
    allFeeds: Feed[];
    isApiKeyMissing: boolean;
    refreshKey: number;
    userProfile: GoogleUserProfile | null;
    widgetSettings: WidgetSettings;
    onOpenSettings: () => void;
}

const MainContent: React.FC<MainContentProps> = (props) => {
    const { feedsToDisplay, title, selection, readArticleIds, bookmarkedArticleIds, articleTags, onMarkAsRead, onMarkAsUnread, onMarkMultipleAsRead, onToggleBookmark, onSetArticleTags, onMenuClick, onSearch, articleView, allFeeds, isApiKeyMissing, refreshKey, userProfile, widgetSettings, onOpenSettings } = props;
    
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [focusedArticleIndex, setFocusedArticleIndex] = useState<number | null>(null);
    const articleRefs = useRef<(HTMLDivElement | null)[]>([]);
    
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
            setArticles([]);
            
            const promises = feeds.map(feed => 
                fetchWithTimeout(`${CORS_PROXY}${encodeURIComponent(feed.url)}`, { timeout: 10000 })
                    .then(response => {
                        if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for ${feed.title}`);
                        return response.text();
                    })
                    .then(xmlText => parseRssXml(xmlText, feed.title))
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
                console.error('Error fetching RSS feeds:', e);
                setError(e instanceof Error ? e.message : 'An unknown error occurred while fetching feeds.');
            } finally {
                setLoading(false);
            }
        };

        const feedsForFetch = (selection.type === 'bookmarks' || selection.type === 'search' || selection.type === 'all') ? allFeeds : feedsToDisplay;
        fetchRssFeeds(feedsForFetch);

    }, [feedsToDisplay, allFeeds, selection, refreshKey]);
    
    const handleMarkAllAsRead = () => {
        onMarkMultipleAsRead(filteredArticles.map(a => a.id));
    };

    const filteredArticles = useMemo(() => {
        let result = articles;
        if (selection.type === 'bookmarks') {
            result = result.filter(a => bookmarkedArticleIds.has(a.id));
        } else if (selection.type === 'search' && selection.query) {
             const filter = selection.query.toLowerCase();
             result = result.filter(a => a.title.toLowerCase().includes(filter) || a.snippet.toLowerCase().includes(filter));
        }
        return result;
    }, [articles, selection, bookmarkedArticleIds]);
    
    const itemsToRender = filteredArticles;

    useEffect(() => {
        setFocusedArticleIndex(null);
        articleRefs.current = articleRefs.current.slice(0, itemsToRender.length);
    }, [itemsToRender]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement?.tagName === 'INPUT') return;

            if (['j', 'k', 'o', 'm', 'b'].includes(e.key)) {
                e.preventDefault();

                if (e.key === 'j') {
                    setFocusedArticleIndex(prev => {
                        const newIndex = prev === null ? 0 : Math.min(prev + 1, itemsToRender.length - 1);
                        articleRefs.current[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                        return newIndex;
                    });
                } else if (e.key === 'k') {
                    setFocusedArticleIndex(prev => {
                        const newIndex = prev === null || prev === 0 ? 0 : prev - 1;
                        articleRefs.current[newIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                        return newIndex;
                    });
                } else if (focusedArticleIndex !== null) {
                    const item = itemsToRender[focusedArticleIndex];
                    if (!item) return;
                    
                    if (e.key === 'o') {
                        window.open(item.link, '_blank', 'noopener,noreferrer');
                        onMarkAsRead(item.id);
                    } else if (e.key === 'm') {
                        if (readArticleIds.has(item.id)) onMarkAsUnread(item.id); else onMarkAsRead(item.id);
                    } else if (e.key === 'b') {
                        onToggleBookmark(item.id);
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [focusedArticleIndex, itemsToRender, onMarkAsRead, onMarkAsUnread, onToggleBookmark, readArticleIds]);
    
    const viewIcons = {
        card: ViewColumnsIcon,
        compact: ViewListIcon,
        magazine: ViewGridIcon,
    };
    
    const DiscoverView = () => (
        <div className="flex-1 flex flex-col bg-zinc-900 text-gray-300 h-full">
            <header className="flex items-center justify-between p-4 sticky top-0 bg-zinc-900/80 backdrop-blur-sm z-10 flex-shrink-0">
                 <div className="flex items-center gap-2">
                    <button onClick={onMenuClick} className="p-2 -ml-2 rounded-full text-zinc-400 hover:bg-zinc-700" aria-label="Open sidebar">
                        <MenuIcon className="w-6 h-6" />
                    </button>
                    <div className="flex items-center space-x-2">
                        <SeymourIcon className="w-7 h-7" />
                        <span className="text-md font-bold text-white">See More</span>
                    </div>
                </div>
                <div>
                    {userProfile?.picture ? (
                        <img src={userProfile.picture} alt="User" className="w-8 h-8 rounded-full" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-700"></div>
                    )}
                </div>
            </header>

            <div className="flex-1 overflow-y-auto">
                <DiscoverWidgetCarousel 
                    settings={widgetSettings}
                    onCustomizeClick={onOpenSettings}
                    isApiKeyMissing={isApiKeyMissing}
                />

                <div className="p-4 space-y-4">
                    {loading && <div className="text-center p-8 text-zinc-400">Loading articles...</div>}
                    {error && <div className="text-center text-red-500 p-4 bg-red-900/20 rounded-lg">{error}</div>}
                    {filteredArticles.map(article => (
                        <DiscoverArticleItem key={article.id} article={article} />
                    ))}
                </div>
            </div>
        </div>
    );
    
    return (
        <>
            {/* Mobile Discover View */}
            <div className="md:hidden h-full">
                <DiscoverView />
            </div>

            {/* Desktop View */}
            <main className="hidden md:flex h-full flex-col bg-white dark:bg-zinc-900 overflow-y-auto">
                <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-800 sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-2">
                        <button onClick={onMenuClick} className="p-2 -ml-2 rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700 md:hidden" aria-label="Open sidebar">
                            <MenuIcon className="w-6 h-6" />
                        </button>
                        <h1 className="text-xl font-bold text-zinc-900 dark:text-white truncate">{title}</h1>
                    </div>
                    <div className="flex items-center space-x-2">
                        <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search articles..."
                                className="w-48 bg-gray-100 dark:bg-zinc-800 border-transparent rounded-md py-1.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 dark:text-zinc-200 dark:placeholder-zinc-400"
                            />
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-zinc-400">
                                <SearchIcon className="w-4 h-4" />
                            </div>
                        </form>
                        {filteredArticles.length > 0 && (
                            <button onClick={handleMarkAllAsRead} className="flex items-center space-x-2 text-xs text-gray-500 dark:text-zinc-400 hover:text-lime-500 dark:hover:text-lime-400 font-medium">
                                <CheckCircleIcon className="w-4 h-4" />
                                <span>Mark All as Read</span>
                            </button>
                        )}
                        <div className="flex items-center rounded-md bg-gray-100 dark:bg-zinc-800 p-0.5">
                            {(['card', 'compact', 'magazine'] as ArticleView[]).map(view => {
                                const Icon = viewIcons[view];
                                return (
                                    <button key={view} onClick={() => { (props as any).setArticleView(view); }} className={`p-1.5 rounded-md transition-colors ${articleView === view ? 'bg-white dark:bg-zinc-700 text-lime-600 dark:text-lime-400' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white'}`} aria-label={`Switch to ${view} view`}>
                                        <Icon className="w-5 h-5" />
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </header>
                
                <div className="flex-1 p-4 md:p-6 lg:p-8">
                    {loading && !articles.length && (
                        <div className="flex justify-center items-center h-full pt-10">
                            <svg className="animate-spin h-8 w-8 text-lime-500 dark:text-lime-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    )}
                    {error && <div className="text-center text-red-700 dark:text-red-400 mt-4 bg-red-100 dark:bg-red-900/20 p-4 rounded-md border border-red-300 dark:border-red-500/30">{error}</div>}
                    
                    {!loading && !error && itemsToRender.length === 0 && (
                        <div className="text-center pt-10">
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">No articles found</h2>
                            <p className="text-gray-500 dark:text-zinc-400">There are no articles to display for this selection.</p>
                        </div>
                    )}
                    <div className={`grid gap-4 ${articleView === 'magazine' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                        {itemsToRender.map((item, index) =>
                            <ArticleItem
                                key={item.id}
                                article={item}
                                isRead={readArticleIds.has(item.id)}
                                isBookmarked={bookmarkedArticleIds.has(item.id)}
                                tags={articleTags.get(item.id) || new Set()}
                                onMarkAsRead={onMarkAsRead}
                                onMarkAsUnread={onMarkAsUnread}
                                onToggleBookmark={onToggleBookmark}
                                onSetTags={(tags) => onSetArticleTags(item.id, tags)}
                                view={articleView}
                                isFocused={focusedArticleIndex === index}
                                articleRef={el => (articleRefs.current[index] = el)}
                            />
                        )}
                    </div>
                </div>
            </main>
        </>
    );
};


// --- Components for Mobile Discover View ---

const DiscoverArticleItem: React.FC<{ article: Article }> = ({ article }) => (
    <a href={article.link} target="_blank" rel="noopener noreferrer" className="block bg-zinc-800 rounded-xl overflow-hidden border border-zinc-700/50">
        {article.imageUrl && <img src={article.imageUrl} alt="" className="w-full h-48 object-cover bg-zinc-700" />}
        <div className="p-4">
            <div className="flex items-center space-x-2 mb-2">
                {article.source && <img src={`https://www.google.com/s2/favicons?sz=32&domain_url=${new URL(article.link).hostname}`} alt="" className="w-4 h-4 rounded-full" />}
                <p className="text-xs text-zinc-400">{article.source}</p>
            </div>
            <h3 className="font-semibold text-white mb-4">{article.title}</h3>
            <div className="flex justify-between items-center">
                <p className="text-xs text-zinc-500">{timeAgo(article.publishedDate)}</p>
                <div className="flex items-center space-x-2 text-zinc-400">
                    <button className="p-2 -m-2 hover:text-red-400"><BookmarkIcon className="w-5 h-5"/></button>
                    <button className="p-2 -m-2 hover:text-lime-400"><ShareIcon className="w-5 h-5"/></button>
                    <button className="p-2 -m-2 hover:text-lime-400"><DotsHorizontalIcon className="w-5 h-5"/></button>
                </div>
            </div>
        </div>
    </a>
);


const DiscoverWidgetCarousel: React.FC<{
    settings: WidgetSettings;
    onCustomizeClick: () => void;
    isApiKeyMissing: boolean;
}> = ({ settings, onCustomizeClick, isApiKeyMissing }) => {
    return (
        <div className="flex space-x-3 overflow-x-auto p-4 pt-0 scrollbar-hide flex-shrink-0">
            {settings.showWeather && <WeatherWidget location={settings.weatherLocation} isApiKeyMissing={isApiKeyMissing} />}
            {settings.showSports && settings.sportsTeams.map(team => <SportsWidget key={team} team={team} isApiKeyMissing={isApiKeyMissing} />)}
            <CustomizeWidget onClick={onCustomizeClick} />
        </div>
    );
};

const WeatherWidget: React.FC<{ location: string; isApiKeyMissing: boolean }> = ({ location, isApiKeyMissing }) => {
    const [weather, setWeather] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWeather = async () => {
            if (isApiKeyMissing) { setLoading(false); return; }
            setLoading(true);
            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: `Get the current weather for ${location}.`,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT, properties: {
                                location: { type: Type.STRING },
                                temperatureCelsius: { type: Type.NUMBER },
                                condition: { type: Type.STRING },
                                precipitationChance: { type: Type.NUMBER }
                            }
                        }
                    }
                });
                setWeather(JSON.parse(response.text));
            } catch (e) {
                console.error("Error fetching weather", e);
            } finally {
                setLoading(false);
            }
        };
        fetchWeather();
    }, [location, isApiKeyMissing]);

    const WeatherIcon = ({ condition }: { condition: string }) => {
        const lowerCondition = condition ? condition.toLowerCase() : '';
        if (lowerCondition.includes('sun') || lowerCondition.includes('clear')) return <SunIcon className="w-6 h-6 text-yellow-400" />;
        if (lowerCondition.includes('cloud') || lowerCondition.includes('overcast')) return <CloudIcon className="w-6 h-6 text-gray-400" />;
        return <CloudIcon className="w-6 h-6 text-gray-400" />;
    };

    return (
        <div className="flex-shrink-0 w-40 p-3 bg-zinc-800 rounded-2xl text-white flex flex-col justify-between">
            {loading ? <div className="text-zinc-400 text-sm">Loading...</div> : weather ? (
                <>
                    <div>
                        <p className="font-bold">{weather.location}</p>
                        <p className="text-xs text-zinc-400">{weather.precipitationChance}% <span role="img" aria-label="rain">💧</span></p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                        <p className="text-3xl font-bold">{weather.temperatureCelsius}°</p>
                        <WeatherIcon condition={weather.condition} />
                    </div>
                </>
            ) : <p className="text-xs text-zinc-400">Weather unavailable</p>}
        </div>
    );
};

const SportsWidget: React.FC<{ team: string; isApiKeyMissing: boolean }> = ({ team, isApiKeyMissing }) => {
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchScore = async () => {
            if (isApiKeyMissing) { setLoading(false); return; }
            setLoading(true);
             try {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: `Get the latest final match result for the ${team} football team.`,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT, properties: {
                                homeTeam: { type: Type.STRING }, homeScore: { type: Type.NUMBER },
                                awayTeam: { type: Type.STRING }, awayScore: { type: Type.NUMBER },
                                status: { type: Type.STRING },
                                homeTeamWebsite: { type: Type.STRING }, awayTeamWebsite: { type: Type.STRING }
                            }
                        }
                    }
                });
                setResult(JSON.parse(response.text));
            } catch (e) {
                console.error(`Error fetching score for ${team}`, e);
            } finally {
                setLoading(false);
            }
        };
        fetchScore();
    }, [team, isApiKeyMissing]);

    const TeamLogo = ({ website, name }: { website: string; name: string }) => {
        const [hasError, setHasError] = useState(!website);
        if (hasError) {
             return <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center font-bold text-sm">{name.substring(0, 3).toUpperCase()}</div>;
        }
        return <img src={`https://www.google.com/s2/favicons?sz=32&domain_url=${website}`} onError={() => setHasError(true)} alt={`${name} logo`} className="w-8 h-8 object-contain" />;
    };

    return (
        <div className="flex-shrink-0 w-48 p-3 bg-zinc-800 rounded-2xl text-white flex flex-col">
            {loading ? <div className="text-zinc-400 text-sm">Loading...</div> : result ? (
                <>
                    <div className="flex justify-between items-center text-sm">
                        <span>{result.homeTeam.substring(0,3).toUpperCase()} vs {result.awayTeam.substring(0,3).toUpperCase()}</span>
                        <span className="text-xs bg-zinc-700 px-1.5 py-0.5 rounded-md font-semibold">{result.status}</span>
                    </div>
                    <div className="flex justify-around items-center mt-2 flex-grow">
                        <TeamLogo website={result.homeTeamWebsite} name={result.homeTeam} />
                        <span className="text-2xl font-bold">{result.homeScore} - {result.awayScore}</span>
                        <TeamLogo website={result.awayTeamWebsite} name={result.awayTeam} />
                    </div>
                </>
            ) : <p className="text-xs text-zinc-400">Result for {team} unavailable</p>}
        </div>
    );
};

const CustomizeWidget: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button onClick={onClick} className="flex-shrink-0 w-40 p-3 bg-zinc-800 rounded-2xl text-white flex flex-col items-center justify-center space-y-2 text-center">
        <SettingsIcon className="w-6 h-6" />
        <p className="text-sm font-semibold">Customize your space</p>
    </button>
);

export default MainContent;
