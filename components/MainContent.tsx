import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Feed, Selection, ArticleView, AllFeedsView } from '../App';
import { CORS_PROXY } from '../App';
import { GoogleGenAI, Type } from '@google/genai';
import { SparklesIcon, CheckCircleIcon, MenuIcon, BookmarkIcon, ViewColumnsIcon, ViewListIcon, ViewGridIcon, LayoutGridIcon, FireIcon, ShieldCheckIcon, BugAntIcon, XIcon } from './icons';

// Create a single, shared AI instance, initialized once.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface Article {
    id: string;
    title: string;
    link: string;
    source: string;
    publishedDate: Date | null;
    snippet: string;
    imageUrl: string | null;
}

interface EnrichedArticle extends Article {
    summary?: string;
    sentiment?: 'Positive' | 'Neutral' | 'Negative';
    tags?: string[];
}

interface Briefing {
    topHeadlines: string[];
    keyThemes: string[];
    deepDive: {
        title: string;
        snippet: string;
    };
}

interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
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

const ArticleItem: React.FC<{
    article: EnrichedArticle,
    isRead: boolean,
    isBookmarked: boolean,
    onMarkAsRead: (id: string) => void,
    onToggleBookmark: (id: string) => void,
    onEnrich: (id: string, data: Partial<EnrichedArticle>) => void,
    view: ArticleView,
    isAiDisabled: boolean,
    handleAiError: (error: unknown) => boolean,
}> = ({ article, isRead, isBookmarked, onMarkAsRead, onToggleBookmark, onEnrich, view, isAiDisabled, handleAiError }) => {
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [summaryError, setSummaryError] = useState('');

    const handleSummarize = async () => {
        if (isAiDisabled) {
            setSummaryError("AI features are temporarily disabled.");
            return;
        }
        setIsSummarizing(true);
        setSummaryError('');
        try {
            const prompt = `Provide a concise, one-paragraph summary of the following news article based on its title and snippet.\n\nTitle: "${article.title}"\n\nSnippet: "${article.snippet}"`;
            
            const maxRetries = 3;
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: prompt,
                    });
                    onEnrich(article.id, { summary: response.text });
                    return;
                } catch (e) {
                    console.error(`Error summarizing article (attempt ${attempt}):`, e);
                    if (handleAiError(e)) {
                        setSummaryError("AI features are temporarily disabled.");
                        return;
                    }
                    if (attempt < maxRetries && e instanceof Error && (e.message.includes('429') || e.message.includes('RESOURCE_EXHAUSTED'))) {
                        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                        await new Promise(resolve => setTimeout(resolve, delay));
                    } else {
                        throw e;
                    }
                }
            }
        } catch (e) {
            console.error("Final error summarizing article:", e);
            setSummaryError("Could not generate summary.");
        } finally {
            setIsSummarizing(false);
        }
    };

    const sentimentColor = {
        'Positive': 'bg-green-500',
        'Neutral': 'bg-gray-500',
        'Negative': 'bg-red-500',
    };
    
    if (view === 'compact') {
        return (
             <div className={`flex items-start justify-between gap-4 py-3 border-b border-gray-200 dark:border-zinc-700/50 ${isRead ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-3 flex-1 truncate">
                    {article.sentiment && <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sentimentColor[article.sentiment]}`} title={`Sentiment: ${article.sentiment}`}></div>}
                    <a href={article.link} onClick={() => onMarkAsRead(article.id)} target="_blank" rel="noopener noreferrer" className="text-base font-medium text-zinc-800 dark:text-gray-100 hover:text-lime-500 dark:hover:text-lime-400 truncate">
                        {article.title}
                    </a>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                    <span className="w-24 truncate text-right">{article.source}</span>
                    <span className="w-16 text-right">{timeAgo(article.publishedDate)}</span>
                     <button onClick={() => onToggleBookmark(article.id)} className="text-gray-400 hover:text-lime-500" aria-label="Bookmark article">
                        <BookmarkIcon className="w-5 h-5" solid={isBookmarked} />
                    </button>
                </div>
            </div>
        );
    }

    const isMagazine = view === 'magazine';
    const cardClasses = `bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-gray-200 dark:border-zinc-700/50 hover:border-gray-300 dark:hover:border-zinc-600 transition-all duration-200 ${isRead ? 'opacity-60 hover:opacity-100' : ''}`;
    const layoutClasses = isMagazine ? 'flex flex-col' : 'flex flex-col md:flex-row md:items-start';
    const imageWrapperClasses = isMagazine ? 'w-full' : 'w-full md:w-32 md:flex-shrink-0';
    const imageClasses = isMagazine
        ? "w-full h-48 object-cover rounded-t-lg bg-gray-200 dark:bg-zinc-700"
        : "w-full h-40 object-cover rounded-t-lg md:h-20 md:w-32 md:rounded-l-lg md:rounded-t-none bg-gray-200 dark:bg-zinc-700";
    const contentClasses = isMagazine ? 'p-4' : 'p-4 flex-1';

    return (
        <div className={cardClasses}>
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
                    
                    {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {article.tags.map(tag => (
                                <span key={tag} className="text-xs bg-lime-100 text-lime-800 dark:bg-lime-900/50 dark:text-lime-300 px-2 py-1 rounded-full">{tag}</span>
                            ))}
                        </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                            {article.sentiment && <div className={`w-2 h-2 rounded-full ${sentimentColor[article.sentiment]}`} title={`Sentiment: ${article.sentiment}`}></div>}
                            <span>{article.source}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button onClick={handleSummarize} disabled={isSummarizing || !!article.summary || isAiDisabled} className="flex items-center space-x-2 text-xs text-gray-500 dark:text-zinc-400 hover:text-lime-500 dark:hover:text-lime-400 disabled:opacity-50 disabled:cursor-not-allowed font-medium" title={isAiDisabled ? "AI features are temporarily disabled" : "Summarize"}>
                                <SparklesIcon className="w-4 h-4" />
                                <span>{isSummarizing ? '...' : (article.summary ? 'Summary' : 'Summarize')}</span>
                            </button>
                             <button onClick={() => onToggleBookmark(article.id)} className="text-gray-400 hover:text-lime-500" aria-label="Bookmark article">
                                <BookmarkIcon className="w-5 h-5" solid={isBookmarked} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {(isSummarizing || article.summary || summaryError) && (
                <div className="p-4 mt-2 border-t border-gray-200 dark:border-zinc-700/50">
                     {summaryError && <p className="text-sm text-red-600 dark:text-red-400">{summaryError}</p>}
                     {article.summary && (
                         <div>
                             <h4 className="text-sm font-bold text-zinc-800 dark:text-gray-100 mb-2">AI Summary</h4>
                             <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{article.summary}</p>
                         </div>
                     )}
                </div>
            )}
        </div>
    );
};

const BriefingView: React.FC<{
    unreadArticles: Article[],
    isAiDisabled: boolean,
    handleAiError: (error: unknown) => boolean,
}> = ({ unreadArticles, isAiDisabled, handleAiError }) => {
    const [briefing, setBriefing] = useState<Briefing | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (unreadArticles.length === 0) return;

        if (isAiDisabled) {
            setError("AI features are temporarily unavailable due to rate limits.");
            return;
        }

        const generateBriefing = async () => {
            setIsLoading(true);
            setError('');
            setBriefing(null);
            
            try {
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
                                },
                            },
                        },
                    },
                });

                const parsedBriefing = JSON.parse(response.text);
                setBriefing(parsedBriefing);

            } catch (e) {
                console.error("Error generating briefing:", e);
                if (!handleAiError(e)) {
                    setError("Sorry, the AI briefing could not be generated at this time.");
                } else {
                    setError("AI features are temporarily unavailable due to rate limits.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        generateBriefing();
    }, [unreadArticles, isAiDisabled, handleAiError]);

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

interface ThreatDashboardData {
    trendingTopics: string[];
    keyVulnerabilities: string[];
    emergingThreats: string[];
}

const ThreatDashboard: React.FC<{
    unreadArticles: Article[];
    onSetFilter: (filter: string) => void;
    isAiDisabled: boolean;
    handleAiError: (error: unknown) => boolean;
}> = ({ unreadArticles, onSetFilter, isAiDisabled, handleAiError }) => {
    const [dashboardData, setDashboardData] = useState<ThreatDashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (unreadArticles.length === 0) {
            setIsLoading(false);
            return;
        }

        if (isAiDisabled) {
            setError("AI features are temporarily unavailable due to rate limits.");
            setIsLoading(false);
            return;
        }

        const generateDashboard = async () => {
            setIsLoading(true);
            setError('');
            try {
                const articlesForPrompt = unreadArticles
                    .slice(0, 50)
                    .map(a => `Title: ${a.title}\nSnippet: ${a.snippet}`)
                    .join('\n\n');

                const prompt = `You are a cybersecurity intelligence analyst. Analyze the following article titles and snippets and generate a "Threat Landscape" dashboard. Identify:
1.  3-5 'Trending Topics': The most frequently discussed subjects or events.
2.  3-5 'Key Vulnerabilities': Specific CVEs or significant software/hardware security flaws.
3.  3-5 'Emerging Threats': New malware families, threat actor groups, or attack techniques.

Do not invent information. If a category is empty, return an empty list for it.
Articles:\n\n${articlesForPrompt}`;

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                trendingTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
                                keyVulnerabilities: { type: Type.ARRAY, items: { type: Type.STRING } },
                                emergingThreats: { type: Type.ARRAY, items: { type: Type.STRING } },
                            },
                        },
                    },
                });

                setDashboardData(JSON.parse(response.text));
            } catch (e) {
                console.error("Error generating dashboard:", e);
                if (!handleAiError(e)) {
                    setError("The AI-powered dashboard could not be generated.");
                } else {
                    setError("AI features are temporarily unavailable due to rate limits.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        generateDashboard();
    }, [unreadArticles, isAiDisabled, handleAiError]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center pt-10">
                <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-lime-500 dark:text-lime-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-gray-500 dark:text-zinc-400 text-lg">Generating Threat Landscape...</span>
            </div>
        );
    }
    
    if (error) {
        return (
             <div className="text-center text-red-700 dark:text-red-400 mt-10 bg-red-100 dark:bg-red-900/20 p-4 rounded-md border border-red-300 dark:border-red-500/30">
                 <h2 className="font-bold text-lg mb-2">Dashboard Error</h2>
                 <p className="text-sm">{error}</p>
             </div>
        );
    }
    
    if (!dashboardData || (dashboardData.trendingTopics.length === 0 && dashboardData.keyVulnerabilities.length === 0 && dashboardData.emergingThreats.length === 0)) {
        return (
            <div className="text-center pt-10">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">All caught up!</h2>
                <p className="text-gray-500 dark:text-zinc-400">No new articles to analyze for the Threat Landscape.</p>
            </div>
        );
    }

    const DashboardSection: React.FC<{ title: string; items: string[]; icon: React.ReactNode; onSetFilter: (filter: string) => void }> = ({ title, items, icon, onSetFilter }) => {
        if (!items || items.length === 0) return null;
        return (
            <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-gray-200 dark:border-zinc-700/50">
                <h3 className="flex items-center gap-2 text-base font-semibold text-zinc-800 dark:text-gray-100 mb-3">
                    {icon}
                    {title}
                </h3>
                <div className="flex flex-col space-y-2">
                    {items.map(item => (
                        <button key={item} onClick={() => onSetFilter(item)} className="text-left text-sm text-gray-600 dark:text-gray-300 hover:text-lime-600 dark:hover:text-lime-400 bg-white dark:bg-zinc-800 p-2 rounded-md hover:bg-lime-50 dark:hover:bg-zinc-700/50 transition-colors duration-150">
                           {item}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Threat Landscape</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <DashboardSection title="Trending Topics" items={dashboardData.trendingTopics} icon={<FireIcon className="w-5 h-5 text-orange-500" />} onSetFilter={onSetFilter} />
                <DashboardSection title="Key Vulnerabilities" items={dashboardData.keyVulnerabilities} icon={<ShieldCheckIcon className="w-5 h-5 text-blue-500" />} onSetFilter={onSetFilter} />
                <DashboardSection title="Emerging Threats" items={dashboardData.emergingThreats} icon={<BugAntIcon className="w-5 h-5 text-red-500" />} onSetFilter={onSetFilter} />
            </div>
        </div>
    );
};

interface AIAnswer {
    answer: string;
    source_ids: string[];
}

const AIAnswerView: React.FC<{
    query: string;
    articles: Article[];
    isAiDisabled: boolean;
    handleAiError: (error: unknown) => boolean;
}> = ({ query, articles, isAiDisabled, handleAiError }) => {
    const [result, setResult] = useState<AIAnswer | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const getAnswer = async () => {
            if (isAiDisabled) {
                setError("AI features are temporarily unavailable due to rate limits.");
                setIsLoading(false);
                return;
            }

            if (articles.length === 0) {
                setError("There are no articles to search through.");
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError('');

            try {
                const articlesForPrompt = articles
                    .slice(0, 100) // Limit context size
                    .map(a => `ID: ${a.id}\nTitle: ${a.title}\nSnippet: ${a.snippet}`)
                    .join('\n\n---\n\n');

                const prompt = `You are a helpful research assistant. Based ONLY on the provided article summaries below, answer the user's question.
- Your answer must be comprehensive and directly address the user's query.
- If the articles do not contain enough information to answer the question, you MUST respond with "I could not find a definitive answer in the current articles."
- After your answer, you MUST list the most relevant article IDs that you used to formulate the response.

User Question: "${query}"

Articles:
${articlesForPrompt}`;

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                answer: { type: Type.STRING, description: 'A synthesized answer to the user query based on the provided articles.' },
                                source_ids: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'A list of the article IDs that were most relevant to generating the answer.' }
                            }
                        }
                    }
                });
                
                setResult(JSON.parse(response.text));
            } catch (e) {
                console.error("Error generating AI answer:", e);
                if (!handleAiError(e)) {
                    setError("The AI was unable to answer the question. Please try again.");
                } else {
                    setError("AI features are temporarily unavailable due to rate limits.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        getAnswer();
    }, [query, articles, isAiDisabled, handleAiError]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center pt-10">
                <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-lime-500 dark:text-lime-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-gray-500 dark:text-zinc-400 text-lg">Searching for an answer...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-700 dark:text-red-400 mt-10 bg-red-100 dark:bg-red-900/20 p-4 rounded-md border border-red-300 dark:border-red-500/30">
                <h2 className="font-bold text-lg mb-2">Search Error</h2>
                <p className="text-sm">{error}</p>
            </div>
        );
    }

    if (!result) return null;

    const sourceArticles = result.source_ids
        .map(id => articles.find(a => a.id === id))
        .filter((a): a is Article => !!a);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-sm text-gray-500 dark:text-zinc-400">AI Answer for:</h2>
                <p className="text-xl font-semibold text-zinc-900 dark:text-white">"{query}"</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700/50 rounded-lg">
                <div className="flex items-start gap-3">
                    <SparklesIcon className="w-5 h-5 text-lime-500 flex-shrink-0 mt-1" />
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{result.answer}</p>
                </div>
            </div>
            {sourceArticles.length > 0 && (
                 <div>
                    <h3 className="text-base font-semibold text-zinc-800 dark:text-gray-100 mb-3">Sources</h3>
                    <div className="space-y-2">
                        {sourceArticles.map(article => (
                            <a href={article.link} target="_blank" rel="noopener noreferrer" key={article.id} className="block p-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700/50 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">
                                <p className="font-medium text-zinc-800 dark:text-gray-100">{article.title}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{article.source}</p>
                            </a>
                        ))}
                    </div>
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
    onMarkAsRead: (articleId: string) => void;
    onMarkMultipleAsRead: (articleIds: string[]) => void;
    onToggleBookmark: (articleId: string) => void;
    onMenuClick: () => void;
    articleView: ArticleView;
    setArticleView: (view: ArticleView) => void;
    allFeeds: Feed[];
    magicFeedTopic?: string;
    allFeedsView: AllFeedsView;
    setAllFeedsView: (view: AllFeedsView) => void;
    isAiDisabled: boolean;
    handleAiError: (error: unknown) => boolean;
}

const MainContent: React.FC<MainContentProps> = (props) => {
    const { feedsToDisplay, title, selection, readArticleIds, bookmarkedArticleIds, onMarkAsRead, onMarkMultipleAsRead, onToggleBookmark, onMenuClick, articleView, setArticleView, allFeeds, magicFeedTopic, allFeedsView, setAllFeedsView, isAiDisabled, handleAiError } = props;
    
    const [articles, setArticles] = useState<EnrichedArticle[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    
    const readArticleIdsRef = useRef(readArticleIds);
    useEffect(() => {
        readArticleIdsRef.current = readArticleIds;
    }, [readArticleIds]);

    const handleEnrichArticle = (articleId: string, data: Partial<EnrichedArticle>) => {
        setArticles(prev => prev.map(a => a.id === articleId ? { ...a, ...data } : a));
    };
    
    const handleSetFilter = (filter: string) => {
        setActiveFilter(filter);
        setAllFeedsView('list');
    };
    
    const isDashboardView = selection.type === 'all' && allFeedsView === 'dashboard' && !activeFilter;

    useEffect(() => {
        if (isDashboardView && isAiDisabled) {
            setAllFeedsView('list');
        }
    }, [isDashboardView, isAiDisabled, setAllFeedsView]);

    useEffect(() => {
        const enrichArticles = async (articlesToEnrich: Article[]) => {
            if (isAiDisabled) {
                console.log("AI enrichment skipped as features are disabled.");
                return;
            }

            const articlesNeedingEnrichment = articlesToEnrich.filter(a => (a as EnrichedArticle).sentiment === undefined);
            if (articlesNeedingEnrichment.length === 0) return;

            for (const article of articlesNeedingEnrichment) {
                 if (isAiDisabled) {
                    console.log("Stopping enrichment mid-run as AI features are now disabled.");
                    break;
                 }

                if (readArticleIdsRef.current.has(article.id)) {
                    continue;
                }

                const maxRetries = 3;
                for (let attempt = 1; attempt <= maxRetries; attempt++) {
                    try {
                        const prompt = `Analyze the sentiment and extract key entity tags from this article.
                        Title: "${article.title}"
                        Snippet: "${article.snippet}"
                        Sentiment must be one of: "Positive", "Neutral", or "Negative".
                        Tags should be a list of 1 to 4 important entities (companies, technologies, people, concepts).`;

                        const response = await ai.models.generateContent({
                            model: 'gemini-2.5-flash',
                            contents: prompt,
                            config: {
                                responseMimeType: "application/json",
                                responseSchema: {
                                    type: Type.OBJECT,
                                    properties: {
                                        sentiment: { type: Type.STRING, enum: ["Positive", "Neutral", "Negative"] },
                                        tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                                    },
                                }
                            }
                        });
                        
                        const enrichedData = JSON.parse(response.text);
                        handleEnrichArticle(article.id, enrichedData);
                        break; // Exit retry loop on success
                    } catch (err) {
                        console.error(`Attempt ${attempt} failed for article: ${article.title}`, err);
                        if (handleAiError(err)) {
                           break; // Stop retrying for this article and the outer loop will stop on next iteration
                        }
                        if (attempt < maxRetries && err instanceof Error && (err.message.includes('429') || err.message.includes('RESOURCE_EXHAUSTED'))) {
                            const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                            console.warn(`Rate limit hit. Retrying in ${delay.toFixed(0)}ms...`);
                            await new Promise(resolve => setTimeout(resolve, delay));
                        } else {
                            console.error(`Skipping enrichment for "${article.title}" after max retries or due to a non-retriable error.`);
                            break; // Exit retry loop
                        }
                    }
                }
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        };

        const fetchMagicFeed = async (topic: string) => {
            setLoading(true);
            setError(null);
            setArticles([]);
            if (isAiDisabled) {
                setError("AI features are temporarily unavailable due to rate limits.");
                setLoading(false);
                return;
            }
            try {
                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: `Find recent, relevant online articles about the topic: "${topic}". Provide a diverse list of sources.`,
                    config: {
                      tools: [{googleSearch: {}}],
                    },
                });

                const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] | undefined;
                if (!groundingChunks || groundingChunks.length === 0) {
                    throw new Error("The AI couldn't find any articles for this topic.");
                }
                
                const magicArticles: Article[] = groundingChunks
                    .map((chunk: GroundingChunk) => {
                        if (chunk.web) {
                            return {
                                id: chunk.web.uri,
                                title: chunk.web.title || 'Untitled Article',
                                link: chunk.web.uri,
                                source: new URL(chunk.web.uri).hostname.replace('www.', ''),
                                publishedDate: new Date(), // Grounding API doesn't provide dates
                                snippet: `Sourced via Google Search. Click to read the full article.`,
                                imageUrl: null,
                            };
                        }
                        return null;
                    })
                    .filter((article: Article | null): article is Article => article !== null && !!article.link);
                
                const uniqueMagicArticles = Array.from(new Map(magicArticles.map(a => [a.id, a])).values());
                setArticles(uniqueMagicArticles);
                enrichArticles(uniqueMagicArticles);
            } catch (e) {
                console.error('Error fetching magic feed:', e);
                 if (!handleAiError(e)) {
                    setError(e instanceof Error ? e.message : 'An unknown error occurred while fetching the magic feed.');
                 } else {
                    setError("AI features are temporarily unavailable due to rate limits.");
                 }
            } finally {
                setLoading(false);
            }
        };

        const fetchRssFeeds = async (feeds: Feed[]) => {
            if (feeds.length === 0) {
                setArticles([]);
                return;
            };

            setLoading(true);
            setError(null);
            setArticles([]);
            
            const promises = feeds.map(feed => 
                fetchWithTimeout(`${CORS_PROXY}${feed.url}`, { timeout: 10000 })
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
                enrichArticles(uniqueArticles);
            } catch (e) {
                console.error('Error fetching RSS feeds:', e);
                setError(e instanceof Error ? e.message : 'An unknown error occurred while fetching feeds.');
            } finally {
                setLoading(false);
            }
        };

        if (magicFeedTopic) {
            fetchMagicFeed(magicFeedTopic);
        } else if (selection.type !== 'briefing') {
            const feedsForFetch = (selection.type === 'bookmarks' || selection.type === 'search' || selection.type === 'all') ? allFeeds : feedsToDisplay;
            fetchRssFeeds(feedsForFetch);
        }
    }, [feedsToDisplay, allFeeds, selection, magicFeedTopic, isAiDisabled, handleAiError]);

    const handleMarkAllAsRead = () => {
        onMarkMultipleAsRead(filteredArticles.map(a => a.id));
    };

    const filteredArticles = useMemo(() => {
        let result = articles;
        if (selection.type === 'bookmarks') {
            result = result.filter(a => bookmarkedArticleIds.has(a.id));
        } else if (activeFilter) {
            const filter = activeFilter.toLowerCase();
            result = result.filter(a => a.title.toLowerCase().includes(filter) || a.snippet.toLowerCase().includes(filter));
        }
        return result;
    }, [articles, selection, bookmarkedArticleIds, activeFilter]);

    const unreadArticles = useMemo(() => {
        return articles.filter(a => !readArticleIds.has(a.id));
    }, [articles, readArticleIds]);

    if (selection.type === 'briefing') {
        return (
            <main className="flex-1 flex flex-col bg-white dark:bg-zinc-900 overflow-y-auto">
                <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-800 sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-2">
                         <button onClick={onMenuClick} className="p-2 -ml-2 rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700 md:hidden" aria-label="Open sidebar">
                            <MenuIcon className="w-6 h-6" />
                        </button>
                        <h1 className="text-xl font-bold text-zinc-900 dark:text-white truncate">{title}</h1>
                    </div>
                </header>
                <div className="p-4 md:p-6 lg:p-8">
                     <BriefingView unreadArticles={unreadArticles} isAiDisabled={isAiDisabled} handleAiError={handleAiError} />
                </div>
            </main>
        );
    }
    
    const viewIcons = {
        card: ViewColumnsIcon,
        compact: ViewListIcon,
        magazine: ViewGridIcon,
    };
    
    return (
        <main className="flex-1 flex flex-col bg-white dark:bg-zinc-900 overflow-y-auto">
            <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-800 sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm z-10">
                <div className="flex items-center gap-2">
                    <button onClick={onMenuClick} className="p-2 -ml-2 rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700 md:hidden" aria-label="Open sidebar">
                        <MenuIcon className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold text-zinc-900 dark:text-white truncate">{title}</h1>
                </div>
                <div className="flex items-center space-x-2">
                    {filteredArticles.length > 0 && !isDashboardView && selection.type !== 'search' &&(
                        <button onClick={handleMarkAllAsRead} className="flex items-center space-x-2 text-xs text-gray-500 dark:text-zinc-400 hover:text-lime-500 dark:hover:text-lime-400 font-medium">
                            <CheckCircleIcon className="w-4 h-4" />
                            <span>Mark All as Read</span>
                        </button>
                    )}
                    {selection.type === 'all' && (
                         <div className="flex items-center rounded-md bg-gray-100 dark:bg-zinc-800 p-0.5">
                           <button onClick={() => setAllFeedsView('dashboard')} className={`p-1.5 rounded-md transition-colors ${allFeedsView === 'dashboard' ? 'bg-white dark:bg-zinc-700 text-lime-600 dark:text-lime-400' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white'}`} aria-label="Switch to dashboard view">
                                <LayoutGridIcon className="w-5 h-5" />
                            </button>
                            <button onClick={() => setAllFeedsView('list')} className={`p-1.5 rounded-md transition-colors ${allFeedsView === 'list' ? 'bg-white dark:bg-zinc-700 text-lime-600 dark:text-lime-400' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white'}`} aria-label="Switch to list view">
                                <ViewListIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                    {!isDashboardView && selection.type !== 'search' && (
                         <div className="flex items-center rounded-md bg-gray-100 dark:bg-zinc-800 p-0.5">
                            {(['card', 'compact', 'magazine'] as ArticleView[]).map(view => {
                                 const Icon = viewIcons[view];
                                 return (
                                    <button key={view} onClick={() => setArticleView(view)} className={`p-1.5 rounded-md transition-colors ${articleView === view ? 'bg-white dark:bg-zinc-700 text-lime-600 dark:text-lime-400' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white'}`} aria-label={`Switch to ${view} view`}>
                                        <Icon className="w-5 h-5" />
                                    </button>
                                 )
                            })}
                        </div>
                    )}
                </div>
            </header>
            
            <div className="flex-1 p-4 md:p-6 lg:p-8">
                {isAiDisabled && (
                    <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-500/40 rounded-lg text-sm text-yellow-800 dark:text-yellow-200" role="alert">
                        AI features are temporarily disabled due to high usage. They will be re-enabled automatically.
                    </div>
                )}
                 {activeFilter && (
                    <div className="mb-4 flex items-center gap-2">
                        <span className="text-sm text-gray-500 dark:text-zinc-400">Filtered by:</span>
                        <span className="inline-flex items-center gap-x-2 rounded-full bg-lime-100 px-3 py-1 text-sm font-medium text-lime-800 dark:bg-lime-900/50 dark:text-lime-300">
                            {activeFilter}
                            <button onClick={() => setActiveFilter(null)} className="flex-shrink-0 h-4 w-4 rounded-full inline-flex items-center justify-center text-lime-600 dark:text-lime-200 hover:bg-lime-200 dark:hover:bg-lime-800/50 focus:outline-none">
                                <span className="sr-only">Remove filter</span>
                                <XIcon className="h-3 w-3" />
                            </button>
                        </span>
                    </div>
                 )}

                {loading && !articles.length && (
                    <div className="flex justify-center items-center h-full pt-10">
                        <svg className="animate-spin h-8 w-8 text-lime-500 dark:text-lime-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                )}
                {error && <div className="text-center text-red-700 dark:text-red-400 mt-4 bg-red-100 dark:bg-red-900/20 p-4 rounded-md border border-red-300 dark:border-red-500/30">{error}</div>}
                
                {selection.type === 'search' && selection.query ? (
                    <AIAnswerView query={selection.query} articles={articles} isAiDisabled={isAiDisabled} handleAiError={handleAiError} />
                ) : isDashboardView ? (
                    <ThreatDashboard unreadArticles={unreadArticles} onSetFilter={handleSetFilter} isAiDisabled={isAiDisabled} handleAiError={handleAiError} />
                ) : (
                    <>
                        {!loading && !error && filteredArticles.length === 0 && (
                            <div className="text-center pt-10">
                                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">No articles found</h2>
                                <p className="text-gray-500 dark:text-zinc-400">There are no articles to display for this selection.</p>
                            </div>
                        )}
                        <div className={`grid gap-4 ${articleView === 'magazine' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                            {filteredArticles.map(article => (
                                <ArticleItem
                                    key={article.id}
                                    article={article}
                                    isRead={readArticleIds.has(article.id)}
                                    isBookmarked={bookmarkedArticleIds.has(article.id)}
                                    onMarkAsRead={onMarkAsRead}
                                    onToggleBookmark={onToggleBookmark}
                                    onEnrich={handleEnrichArticle}
                                    view={articleView}
                                    isAiDisabled={isAiDisabled}
                                    handleAiError={handleAiError}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </main>
    );
};

export default MainContent;