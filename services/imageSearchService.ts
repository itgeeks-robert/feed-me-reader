import { resilientFetch } from './fetch';
import { get as cacheGet, set as cacheSet } from './cacheService';

const IMAGE_CACHE_PREFIX = 'reconstructed_image_';

/**
 * Cleans headlines to improve search accuracy by removing common filler.
 */
const sanitizeHeadlineForSearch = (headline: string): string => {
    return headline
        .replace(/Exclusive:|Breaking:|LIVE:|Video:|Watch:|Opinion:/gi, '') // Remove prefixes
        .replace(/\s+-\s+.*$/g, '') // Remove trailing site names like "- BBC News"
        .replace(/['"“”‘’]/g, '') // Remove quotes
        .trim();
};

/**
 * Attempts to find high-quality preview images by inspecting the article's HTML metadata.
 * This is the most accurate non-AI method (og:image, twitter:image).
 */
const extractMetadataImage = async (url: string): Promise<string | null> => {
    try {
        const response = await resilientFetch(url, { timeout: 6000 });
        if (!response.ok) return null;
        
        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        
        // Check standard social media tags
        const metaTags = [
            'meta[property="og:image"]',
            'meta[name="twitter:image"]',
            'meta[property="og:image:secure_url"]',
            'link[rel="image_src"]'
        ];

        for (const selector of metaTags) {
            const el = doc.querySelector(selector);
            const content = el?.getAttribute('content') || el?.getAttribute('href');
            if (content && content.startsWith('http')) return content;
        }
    } catch (e) {
        console.warn("Metadata extraction failed for:", url);
    }
    return null;
};

/**
 * Simple hash function for safe cache keys regardless of Unicode content.
 */
const getSafeHash = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
};

/**
 * Reconstructs a missing visual signal using a two-stage interception process.
 */
export const reconstructSignalImage = async (headline: string, articleUrl: string): Promise<string | null> => {
    const cacheKey = `${IMAGE_CACHE_PREFIX}${getSafeHash(articleUrl)}`;
    
    const cached = await cacheGet<string>(cacheKey);
    if (cached) return cached;

    // STAGE 1: Direct Metadata Interception (Highest Accuracy)
    let foundImage = await extractMetadataImage(articleUrl);

    // STAGE 2: Web Search Scrape (Fallback)
    if (!foundImage) {
        try {
            const cleanHeadline = sanitizeHeadlineForSearch(headline);
            const query = encodeURIComponent(cleanHeadline + " news");
            const searchUrl = `https://www.google.com/search?q=${query}&tbm=isch&asearch=ichunk&async=_id:rg_s,_pms:s,_fmt:pc`;
            
            const response = await resilientFetch(searchUrl, { timeout: 8000 });
            if (response.ok) {
                const html = await response.text();
                const imgRegex = /(https?:\/\/[^"<>]*?\.(?:jpg|jpeg|png|webp|gstatic\.com\/images\?q=tbn:[^"<>]*))/gi;
                const matches = html.match(imgRegex);

                if (matches && matches.length > 0) {
                    foundImage = matches.find(url => 
                        !url.includes('googlelogo') && 
                        !url.includes('cleardot') &&
                        (url.includes('gstatic.com') || url.length > 30)
                    ) || null;
                }
            }
        } catch (e) {
            console.warn("Search scrape failed for:", headline);
        }
    }

    if (foundImage) {
        await cacheSet(cacheKey, foundImage);
        return foundImage;
    }

    return null;
};
