import type { Article } from '../App';
import { CORS_PROXY, FALLBACK_PROXY } from '../App';

const CACHE_PREFIX = 'reader_view_cache_';

const fetchWithTimeout = async (url: string, options: RequestInit & { timeout?: number } = {}) => {
    const { timeout = 15000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
};

const sanitizeHtml = (html: string, baseUrl: string): string => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    doc.querySelectorAll('script, style, link, meta, iframe, frame, frameset').forEach(el => el.remove());

    doc.querySelectorAll('*').forEach(el => {
        for (const attr of el.attributes) {
            if (attr.name.startsWith('on')) {
                el.removeAttribute(attr.name);
            }
        }
        if (el.tagName === 'A' && el.hasAttribute('href')) {
            try {
                el.setAttribute('href', new URL(el.getAttribute('href')!, baseUrl).href);
                el.setAttribute('target', '_blank');
                el.setAttribute('rel', 'noopener noreferrer');
            } catch (e) { el.removeAttribute('href'); }
        }
        if (el.tagName === 'IMG' && el.hasAttribute('src')) {
            try {
                const originalSrc = el.getAttribute('src')!;
                const proxiedSrc = `${CORS_PROXY}${encodeURIComponent(new URL(originalSrc, baseUrl).href)}`;
                el.setAttribute('src', proxiedSrc);
            } catch (e) { el.remove(); }
        }
    });

    return doc.body.innerHTML;
};

const parseArticleContent = (html: string): { title: string; content: string } => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const title = doc.querySelector('h1')?.textContent || doc.title || 'Untitled';
    
    const junkSelectors = [
        'header', 'footer', 'nav', 'aside', '.sidebar', '#sidebar',
        'script', 'style', 'noscript', 'link', 'meta',
        '[class*="social"]', '[id*="social"]', '[class*="share"]', '[id*="share"]',
        '[class*="comment"]', '[id*="comment"]', '[class*="related"]',
        '[class*="promo"]', '[class*="ads"]', '.ad', '#ad',
        '.header', '.footer', '.navbar', '.menu', '.nav',
        '.byline', '.meta', '.author', '.timestamp',
    ];
    doc.querySelectorAll(junkSelectors.join(', ')).forEach(el => el.remove());

    const selectors = [
        'article', '[role="main"]', 'main', '.post-content', '.article-body',
        '.entry-content', '#content', '#main', '.story-content', '.article-content'
    ];

    let contentEl: HTMLElement | null = null;
    for (const selector of selectors) {
        contentEl = doc.querySelector(selector);
        if (contentEl) break;
    }

    if (!contentEl) {
        let bestCandidate: HTMLElement | null = null;
        let maxScore = 0;
        doc.body.querySelectorAll('div, section').forEach(el => {
            const pCount = el.querySelectorAll('p').length;
            const textLength = (el.textContent || '').length;
            const score = pCount * 10 + textLength;
            if (score > maxScore && textLength > 200) {
                maxScore = score;
                bestCandidate = el as HTMLElement;
            }
        });
        contentEl = bestCandidate;
    }
    
    if (!contentEl) {
        return { title, content: doc.body.innerHTML };
    }

    return { title, content: contentEl.innerHTML };
};

export const fetchAndCacheArticleContent = async (article: Article): Promise<{ title: string; content: string }> => {
    const cacheKey = `${CACHE_PREFIX}${article.id}`;
    
    const cachedData = sessionStorage.getItem(cacheKey);
    if (cachedData) {
        return JSON.parse(cachedData);
    }

    let response: Response;
    try {
        response = await fetchWithTimeout(`${CORS_PROXY}${encodeURIComponent(article.link)}`);
        if (!response.ok) throw new Error(`Primary proxy failed with status: ${response.status}`);
    } catch (e) {
        console.warn(`Primary proxy failed for "${article.title}", trying fallback.`);
        response = await fetchWithTimeout(`${FALLBACK_PROXY}${encodeURIComponent(article.link)}`);
    }

    if (!response.ok) throw new Error(`Failed to fetch article (last status: ${response.status})`);

    const html = await response.text();
    const parsed = parseArticleContent(html);
    const sanitizedContent = sanitizeHtml(parsed.content, article.link);
    const result = { title: parsed.title, content: sanitizedContent };

    try {
        sessionStorage.setItem(cacheKey, JSON.stringify(result));
    } catch (error) {
        console.error("Failed to write to sessionStorage:", error);
    }

    return result;
};