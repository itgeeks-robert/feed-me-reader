/**
 * THE VOID // IMAGE_SIGNAL_RECONSTRUCTOR v2.0
 * Two-stage image resolution for articles that arrive without thumbnails.
 *
 * Stage 1 — Open Graph / Twitter Card metadata scrape (most reliable)
 * Stage 2 — Favicon-quality fallback placeholder (never empty)
 *
 * Results are cached in IndexedDB via cacheService to avoid re-fetching.
 */

import { resilientFetch } from './fetch';
import { get as cacheGet, set as cacheSet } from './cacheService';
import { hashStr } from './utils';

const CACHE_PREFIX = 'img_signal_v2_';

/* ── Meta tag selectors in priority order ── */
const OG_SELECTORS = [
  'meta[property="og:image:secure_url"]',
  'meta[property="og:image"]',
  'meta[name="twitter:image:src"]',
  'meta[name="twitter:image"]',
  'meta[property="og:image:url"]',
  'link[rel="image_src"]',
] as const;

/** Extract og:image / twitter:image from an article's HTML */
const extractOgImage = async (url: string): Promise<string | null> => {
  try {
    const res = await resilientFetch(url, { timeout: 7_000, directTimeout: 3_000 });
    if (!res.ok) return null;

    const html = await res.text();
    /* Parse only the <head> — massively faster than full document */
    const headEnd = html.indexOf('</head>');
    const headHtml = headEnd > -1 ? html.slice(0, headEnd + 7) : html.slice(0, 8_000);
    const doc = new DOMParser().parseFromString(headHtml, 'text/html');

    for (const sel of OG_SELECTORS) {
      const el      = doc.querySelector(sel);
      const content = el?.getAttribute('content') ?? el?.getAttribute('href');
      if (content?.startsWith('http')) return content;
    }
  } catch {
    /* network error / parse error — silent */
  }
  return null;
};

/**
 * Generate a placeholder image URL using the site's favicon as a fallback.
 * This guarantees the UI always has *something* to show.
 */
const faviconFallback = (articleUrl: string): string => {
  try {
    const { hostname } = new URL(articleUrl);
    return `https://www.google.com/s2/favicons?sz=128&domain_url=${hostname}`;
  } catch {
    return '';
  }
};

/**
 * Reconstruct a missing thumbnail for an article.
 *
 * Returns a fully-resolved image URL, or null if nothing could be found
 * (caller should handle the null case gracefully).
 */
export const reconstructSignalImage = async (
  articleUrl: string,
): Promise<string | null> => {
  const cacheKey = CACHE_PREFIX + hashStr(articleUrl);

  /* ── Cache hit ── */
  const cached = await cacheGet<string>(cacheKey);
  if (cached) return cached;

  /* ── Stage 1: OG/Twitter metadata ── */
  let image = await extractOgImage(articleUrl);

  /* ── Stage 2: Favicon placeholder (never truly empty) ── */
  if (!image) {
    image = faviconFallback(articleUrl) || null;
  }

  if (image) {
    /* Cache for 7 days — key is content-addressed so staleness isn't a concern */
    await cacheSet(cacheKey, image);
  }

  return image;
};
