
import type { Article } from '../src/App';
import { resilientFetch } from './fetch';
import { get as cacheGet, set as cacheSet } from './cacheService';

const CACHE_PREFIX = 'reader_view_cache_';

const sanitizeAndEmbedImages = async (html: string, baseUrl: string): Promise<string> => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    // Aggressively remove non-content elements
    doc.querySelectorAll('script, style, link, meta, iframe, frame, frameset, noscript, video, audio, source, object, embed').forEach(el => el.remove());
    
    // Remove common media player and interactive elements
    doc.querySelectorAll('button, svg, [role="button"], [class*="player"], [class*="control"], [class*="media-ui"], [class*="social-share"], [class*="consent"], [class*="newsletter"]').forEach(el => el.remove());

    doc.querySelectorAll('*').forEach(el => {
        el.removeAttribute('style');
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
    });

    const imagePromises = Array.from(doc.querySelectorAll('img[src]')).map(async (img) => {
        try {
            const originalSrc = img.getAttribute('src')!;
            if (originalSrc.startsWith('data:')) return; 
            const absoluteUrl = new URL(originalSrc, baseUrl).href;
            const response = await resilientFetch(absoluteUrl);
            const blob = await response.blob();
            if (blob.size > 10 * 1024 * 1024) { 
                img.remove();
                return;
            }
            const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
            img.setAttribute('src', dataUrl);
        } catch (e) {
            img.remove(); 
        }
    });
        
    await Promise.all(imagePromises);
    return doc.body.innerHTML;
};

const parseArticleContent = (html: string): { title: string; content: string; category: string } => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const title = doc.querySelector('h1')?.textContent || doc.title || 'Untitled';
    
    // HEURISTIC CATEGORY EXTRACTION
    const extractedCategory = (
        doc.querySelector('meta[property="article:section"]')?.getAttribute('content') ||
        doc.querySelector('meta[name="category"]')?.getAttribute('content') ||
        doc.querySelector('meta[property="og:section"]')?.getAttribute('content') ||
        doc.querySelector('meta[name="keywords"]')?.getAttribute('content')?.split(',')[0] ||
        doc.querySelector('.breadcrumb li:last-child')?.textContent?.trim() ||
        ''
    ).toUpperCase();

    const junkSelectors = [
        'header', 'footer', 'nav', 'aside', '.sidebar', '#sidebar',
        'script', 'style', 'noscript', 'link', 'meta',
        '[class*="social"]', '[id*="social"]', '[class*="share"]', '[id*="share"]',
        '[class*="comment"]', '[id*="comment"]', '[class*="related"]',
        '[class*="promo"]', '[class*="ads"]', '.ad', '#ad',
        '.header', '.footer', '.navbar', '.menu', '.nav',
        '.byline', '.meta', '.author', '.timestamp',
        'button', 'svg', '.media-player', '.audio-player', '.video-player',
        '.p-media-player', '.bbc-news-visual-journalism', '.sharing',
        '.paywall', '#paywall', '.subscribe', '.popup', '.overlay'
    ];
    doc.querySelectorAll(junkSelectors.join(', ')).forEach(el => el.remove());

    const selectors = [
        'article', '[role="main"]', 'main', '.post-content', '.article-body',
        '.entry-content', '#content', '#main', '.story-content', '.article-content',
        '.ssrcss-11r1m41-RichTextContainer', '.story-body'
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
    
    const contentHtml = contentEl ? contentEl.innerHTML : doc.body.innerHTML;
    return { title, content: contentHtml, category: extractedCategory };
};

export const fetchAndCacheArticleContent = async (article: Article): Promise<{ title: string; content: string; category: string }> => {
    const cacheKey = `${CACHE_PREFIX}${article.id}`;
    const cachedData = await cacheGet<{ title: string; content: string; category: string }>(cacheKey);
    if (cachedData) return cachedData;

    const response = await resilientFetch(article.link);
    if (!response.ok) throw new Error(`Failed to fetch article (last status: ${response.status})`);

    const html = await response.text();
    const parsed = parseArticleContent(html);
    const sanitizedContent = await sanitizeAndEmbedImages(parsed.content, article.link);
    const result = { title: parsed.title, content: sanitizedContent, category: parsed.category };

    try { await cacheSet(cacheKey, result); } catch (error) { console.error("Cache Write Error:", error); }
    return result;
};
