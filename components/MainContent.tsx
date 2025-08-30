import React, { useState, useEffect } from 'react';
import type { Feed, Selection } from '../App';
import { CORS_PROXY } from '../App';
import { GoogleGenAI, Type } from '@google/genai';
import { SparklesIcon, CheckCircleIcon, NewspaperIcon } from './icons';

interface Article {
    id: string;
    title: string;
    link: string;
    source: string;
    publishedDate: Date | null;
    snippet: string;
    imageUrl: string | null;
}

interface Briefing {
    topHeadlines: string[];
    keyThemes: string[];
    deepDive: {
        title: string;
        snippet: string;
    };
}

function timeAgo(date: Date | null): string {
    if (!date) return '';

    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)}y ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)}mo ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)}d ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)}m ago`;
    return `${Math.floor(seconds)}s ago`;
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

const ArticleImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
    const [hasError, setHasError] = useState(false);

    if (hasError) {
        return null;
    }

    return (
         <img
            src={src}
            alt={alt}
            className="w-32 h-20 object-cover rounded-md bg-gray-200 dark:bg-zinc-700 flex-shrink-0 mr-4"
            onError={() => setHasError(true)}
            loading="lazy"
        />
    );
};

const ArticleItem: React.FC<{ article: Article, isRead: boolean, onMarkAsRead: (id: string) => void }> = ({ article, isRead, onMarkAsRead }) => {
    const [summary, setSummary] = useState('');
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [summaryError, setSummaryError] = useState('');

    const handleSummarize = async () => {
        setIsSummarizing(true);
        setSummary('');
        setSummaryError('');
        try {
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
            const prompt = `Provide a concise, one-paragraph summary of the following news article based on its title and snippet.\n\nTitle: "${article.title}"\n\nSnippet: "${article.snippet}"`;
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setSummary(response.text);
        } catch (e) {
            console.error("Error summarizing article:", e);
            setSummaryError("Could not generate summary.");
        } finally {
            setIsSummarizing(false);
        }
    };
    
    return (
    <div className={`bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-gray-200 dark:border-zinc-700/50 hover:border-gray-300 dark:hover:border-zinc-600 transition-all duration-200 ${isRead ? 'opacity-60 hover:opacity-100' : ''}`}>
        <div className="flex items-start">
            {article.imageUrl && <ArticleImage src={article.imageUrl} alt={article.title} />}
            <div className="flex-1">
                <div className="flex justify-between items-start mb-2 gap-4">
                    <a href={article.link} onClick={() => onMarkAsRead(article.id)} target="_blank" rel="noopener noreferrer" className="text-lg font-medium text-zinc-800 dark:text-gray-100 hover:text-lime-500 dark:hover:text-lime-400 transition-colors">
                        {article.title}
                    </a>
                    <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap pt-1">{timeAgo(article.publishedDate)}</div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{article.snippet}</p>
                <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-400 dark:text-gray-500">{article.source}</div>
                    <button
                        onClick={handleSummarize}
                        disabled={isSummarizing}
                        className="flex items-center space-x-2 text-xs text-gray-500 dark:text-zinc-400 hover:text-lime-500 dark:hover:text-lime-400 disabled:opacity-50 disabled:cursor-wait transition-colors font-medium"
                        aria-label="Summarize article with AI"
                    >
                        <SparklesIcon className="w-4 h-4" />
                        <span>{isSummarizing ? 'Summarizing...' : 'Summarize'}</span>
                    </button>
                </div>
            </div>
        </div>
        {(isSummarizing || summary || summaryError) && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-zinc-700/50">
                 {isSummarizing && (
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-zinc-400">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span>Generating AI summary...</span>
                    </div>
                 )}
                 {summaryError && <p className="text-sm text-red-600 dark:text-red-400">{summaryError}</p>}
                 {summary && (
                     <div>
                         <h4 className="text-sm font-bold text-zinc-800 dark:text-gray-100 mb-2">AI Summary</h4>
                         <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{summary}</p>
                     </div>
                 )}
            </div>
        )}
    </div>
)};

const BriefingView: React.FC<{ unreadArticles: Article[] }> = ({ unreadArticles }) => {
    const [briefing, setBriefing] = useState<Briefing | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (unreadArticles.length === 0) return;

        const generateBriefing = async () => {
            setIsLoading(true);
            setError('');
            setBriefing(null);
            
            try {
                const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
                const articlesForPrompt = unreadArticles
                    .slice(0, 50) // Limit to 50 articles to avoid exceeding context length
                    .map(a => `Title: ${a.title}\nSnippet: ${a.snippet}`)
                    .join('\n\n');

                const prompt = `Analyze the following list of unread article titles and snippets. From this list, provide an executive summary that includes:
1.  The top 3-5 most important headlines.
2.  A list of 2-4 key themes or recurring topics found across the articles.
3.  A recommendation for a single "deep dive" article that seems most significant or interesting, including its title and snippet.

Here are the articles:\n\n${articlesForPrompt}`;

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                topHeadlines: { type: Type.ARRAY, items: { type: Type.STRING } },
                                keyThemes: { type: Type.ARRAY, items: { type: Type.STRING } },
                                deepDive: {
                                    type: Type.OBJECT,
                                    properties: {
                                        title: { type: Type.STRING },
                                        snippet: { type: Type.STRING }
                                    },
                                    required: ["title", "snippet"]
                                }
                            },
                            required: ["topHeadlines", "keyThemes", "deepDive"]
                        },
                    },
                });

                const parsedBriefing = JSON.parse(response.text);
                setBriefing(parsedBriefing);

            } catch (e) {
                console.error("Error generating briefing:", e);
                setError("Sorry, the AI briefing could not be generated at this time.");
            } finally {
                setIsLoading(false);
            }
        };

        generateBriefing();
    }, [unreadArticles]);

    if (unreadArticles.length === 0) {
        return (
            <div className="text-center pt-10">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">You're all caught up!</h2>
                <p className="text-gray-500 dark:text-zinc-400">There are no new articles to include in your briefing.</p>
            </div>
        );
    }

    if (isLoading) {
        return (
             <div className="flex justify-center items-center pt-10">
                <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-lime-500 dark:text-lime-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-gray-500 dark:text-zinc-400 text-lg">Generating your AI briefing...</span>
            </div>
        );
    }
    
    if (error) {
         return (
             <div className="text-center text-red-700 dark:text-red-400 mt-10 bg-red-100 dark:bg-red-900/20 p-4 rounded-md border border-red-300 dark:border-red-500/30">
                 <h2 className="font-bold text-lg mb-2">Briefing Error</h2>
                 <p className="text-sm">{error}</p>
             </div>
         );
    }

    if (!briefing) return null;

    return (
        <div className="bg-gray-50 dark:bg-zinc-800/50 p-6 rounded-lg border border-gray-200 dark:border-zinc-700/50">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Your Briefing for Today</h2>
            <div className="space-y-8">
                <div>
                    <h3 className="text-lg font-semibold text-zinc-800 dark:text-gray-100 mb-3 border-b border-gray-200 dark:border-zinc-700 pb-2">Top Headlines</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                        {briefing.topHeadlines.map((headline, i) => <li key={i}>{headline}</li>)}
                    </ul>
                </div>
                 <div>
                    <h3 className="text-lg font-semibold text-zinc-800 dark:text-gray-100 mb-3 border-b border-gray-200 dark:border-zinc-700 pb-2">Key Themes</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                        {briefing.keyThemes.map((theme, i) => <li key={i}>{theme}</li>)}
                    </ul>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-zinc-800 dark:text-gray-100 mb-3 border-b border-gray-200 dark:border-zinc-700 pb-2">Recommended Deep Dive</h3>
                    <div className="bg-gray-100 dark:bg-zinc-900/50 p-4 rounded-md">
                        <h4 className="font-bold text-zinc-900 dark:text-white">{briefing.deepDive.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{briefing.deepDive.snippet}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const fetchWithTimeout = (resource: RequestInfo, options: RequestInit & { timeout?: number } = {}) => {
  const { timeout = 8000 } = options; // 8 second timeout
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const promise = fetch(resource, {
    ...options,
    signal: controller.signal  
  });
  
  promise.finally(() => clearTimeout(id));

  return promise;
};

interface MainContentProps {
    feedsToDisplay: Feed[];
    title: string;
    selectionType: Selection['type'];
    readArticleIds: Set<string>;
    onMarkAsRead: (articleId: string) => void;
    onMarkMultipleAsRead: (articleIds: string[]) => void;
}

const MainContent: React.FC<MainContentProps> = ({ feedsToDisplay, title, selectionType, readArticleIds, onMarkAsRead, onMarkMultipleAsRead }) => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFeeds = async (feeds: Feed[]) => {
            setLoading(true);
            setError(null);
            setArticles([]);
            
            const promises = feeds.map(feed =>
                fetchWithTimeout(`${CORS_PROXY}${feed.url}`, { timeout: 8000 })
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    return response.text();
                })
                .then(text => parseRssXml(text, feed.title))
            );

            const results = await Promise.allSettled(promises);
            
            const successfulArticles: Article[] = [];
            const failedFeeds: string[] = [];
            
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    successfulArticles.push(...result.value);
                } else {
                    const feedTitle = feeds[index].title;
                    let reason = 'Unknown Error';
                    if (result.reason instanceof Error) {
                        if (result.reason.name === 'AbortError') {
                            reason = 'Timed out';
                        } else if (result.reason.message.includes('Failed to fetch')) {
                            reason = 'Fetch failed';
                        } else {
                            reason = 'Parse error';
                        }
                    }
                    failedFeeds.push(`${feedTitle} (${reason})`);
                    console.error(`Failed to fetch ${feedTitle}:`, result.reason);
                }
            });

            if (failedFeeds.length > 0) {
                setError(`Failed to load some feeds: ${failedFeeds.join(', ')}. Displaying results from others.`);
            }
            
            successfulArticles.sort((a, b) => (b.publishedDate?.getTime() || 0) - (a.publishedDate?.getTime() || 0));
            setArticles(successfulArticles);
            setLoading(false);
        };

        if (feedsToDisplay.length > 0) {
            fetchFeeds(feedsToDisplay);
        } else {
            setArticles([]);
            setError(null);
            setLoading(false);
        }
    }, [feedsToDisplay]);

    const unreadCount = articles.filter(a => !readArticleIds.has(a.id)).length;

    const handleMarkAllAsRead = () => {
        onMarkMultipleAsRead(articles.map(a => a.id));
    };

    const renderContent = () => {
        if (loading) {
            return (
                 <div className="flex justify-center items-center pt-10">
                    <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-lime-500 dark:text-lime-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-gray-500 dark:text-zinc-400 text-lg">Fetching latest articles...</span>
                </div>
            );
        }
        
        if (selectionType === 'briefing') {
            const unreadArticles = articles.filter(a => !readArticleIds.has(a.id));
            return <BriefingView unreadArticles={unreadArticles} />;
        }
        
        if (error && articles.length === 0) {
             return (
                 <div className="text-center text-yellow-700 dark:text-yellow-400 mt-10 bg-yellow-100 dark:bg-yellow-900/20 p-4 rounded-md border border-yellow-300 dark:border-yellow-500/30">
                    <h2 className="font-bold text-lg mb-2">Notice</h2>
                    <p className="text-sm">{error.replace('Displaying results from others.', '')}</p>
                </div>
            );
        }

        if (feedsToDisplay.length === 0) {
             return (
                <div className="text-center pt-10">
                     <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">{title || "Feed Me"}</h1>
                     <p className="text-gray-500 dark:text-zinc-400">
                        {title ? "No feeds in this folder." : "Add a new feed from the sidebar to get started."}
                    </p>
                </div>
            );
        }
        
        if (articles.length > 0) {
            return (
                 <div className="space-y-4">
                    {error && (
                         <div className="text-center text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20 p-3 rounded-md border border-yellow-300 dark:border-yellow-500/30 text-sm">
                            <p>{error}</p>
                        </div>
                    )}
                    {articles.map(article => <ArticleItem key={article.id} article={article} isRead={readArticleIds.has(article.id)} onMarkAsRead={onMarkAsRead} />)}
                </div>
            );
        }

        return (
            <div className="text-center text-gray-500 dark:text-zinc-400 mt-10">
                <p>No articles found for the selected feeds.</p>
            </div>
        );
    }
    
    return (
        <main className="flex-1 bg-gray-100 dark:bg-zinc-800 p-8 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{title}</h1>
                {articles.length > 0 && !loading && selectionType !== 'briefing' && (
                    <button
                        onClick={handleMarkAllAsRead}
                        disabled={unreadCount === 0}
                        className="flex items-center space-x-2 text-sm text-gray-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Mark all articles as read"
                    >
                        <CheckCircleIcon className="w-5 h-5" />
                        <span>Mark all as read</span>
                    </button>
                )}
            </div>
            {renderContent()}
        </main>
    );
};

export default MainContent;