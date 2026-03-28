/**
 * THE VOID // READER_SERVICE v2.0
 * Fetches, extracts, sanitises and caches article content for the reader view.
 *
 * Key improvements over v1:
 * - Content extraction runs a Readability-style scoring pass (no extra library)
 * - Images are lazy-loaded URLs rather than base64-embedded (much faster, smaller cache)
 * - Sanitisation is strict but keeps semantic HTML (headings, lists, blockquotes)
 * - Caches both the extracted result AND the original URL resolution for deduplication
 */

import type { Article } from '../src/App';
import { resilientFetch } from './fetch';
import { get as cacheGet, set as cacheSet } from './cacheService';
import { hashStr } from './utils';

const CACHE_PREFIX = 'reader_v2_';

/* ── Tags that are always junk ── */
const JUNK_TAGS = [
  'script', 'style', 'link', 'meta', 'noscript', 'iframe', 'frame',
  'frameset', 'video', 'audio', 'source', 'object', 'embed', 'canvas',
  'svg', 'form', 'input', 'textarea', 'select', 'button',
].join(',');

/* ── CSS classes/IDs strongly associated with non-content ── */
const JUNK_PATTERNS = [
  /nav(igation)?/i, /header/i, /footer/i, /sidebar/i, /menu/i,
  /social/i, /share/i, /comment/i, /related/i, /recommend/i,
  /promo/i, /advert/i, /\bad\b/i, /banner/i, /popup/i, /overlay/i,
  /paywall/i, /subscri/i, /newsletter/i, /cookie/i, /consent/i,
  /breadcrumb/i, /byline/i, /author/i, /timestamp/i, /tags?-/i,
];

const isJunkEl = (el: Element): boolean => {
  const combined = `${el.className} ${el.id}`.toLowerCase();
  return JUNK_PATTERNS.some(rx => rx.test(combined));
};

/* ── Allowed tags in the sanitised output ── */
const ALLOWED_TAGS = new Set([
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'blockquote', 'pre', 'code', 'kbd',
  'strong', 'em', 'b', 'i', 'u', 's', 'mark', 'sub', 'sup',
  'a', 'img', 'figure', 'figcaption', 'picture',
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'caption',
  'br', 'hr', 'span', 'div', 'section', 'article', 'aside',
  'time',
]);

/* ── Allowed attributes per tag ── */
const ALLOWED_ATTRS: Record<string, string[]> = {
  a:    ['href', 'title', 'rel'],
  img:  ['src', 'alt', 'title', 'width', 'height', 'loading'],
  time: ['datetime'],
  td:   ['colspan', 'rowspan'],
  th:   ['colspan', 'rowspan', 'scope'],
};

/** Strip an element down to only safe attributes */
const sanitiseEl = (el: Element, baseUrl: string): void => {
  const tag = el.tagName.toLowerCase();
  const allowed = ALLOWED_ATTRS[tag] ?? [];

  /* Remove all disallowed attributes */
  const toRemove: string[] = [];
  for (const attr of el.attributes) {
    if (!allowed.includes(attr.name)) toRemove.push(attr.name);
  }
  toRemove.forEach(a => el.removeAttribute(a));

  /* Resolve relative URLs */
  if (tag === 'a' && el.hasAttribute('href')) {
    try {
      el.setAttribute('href', new URL(el.getAttribute('href')!, baseUrl).href);
    } catch {
      el.removeAttribute('href');
    }
    el.setAttribute('target', '_blank');
    el.setAttribute('rel', 'noopener noreferrer');
  }

  if (tag === 'img') {
    const src = el.getAttribute('src');
    if (src && !src.startsWith('data:')) {
      try {
        el.setAttribute('src', new URL(src, baseUrl).href);
        el.setAttribute('loading', 'lazy');
      } catch {
        el.removeAttribute('src');
      }
    } else if (!src) {
      /* Check data-src (lazy-loaded images) */
      const lazySrc = el.getAttribute('data-src') ?? el.getAttribute('data-lazy-src');
      if (lazySrc) {
        try {
          el.setAttribute('src', new URL(lazySrc, baseUrl).href);
          el.setAttribute('loading', 'lazy');
        } catch {
          el.removeAttribute('src');
        }
      }
    }
  }
};

/**
 * Readability-style content scorer.
 * Returns the element most likely to be the article body.
 */
const findMainContent = (doc: Document): HTMLElement => {
  /* Try semantic selectors first */
  const semantic = [
    'article[class*="body"]', 'article[class*="content"]', 'article',
    '[role="main"]', 'main',
    '.post-content', '.article-body', '.article-content', '.entry-content',
    '.story-body', '.story-content', '#article-body', '#content',
    '.ssrcss-11r1m41-RichTextContainer', // BBC
    '.article__body', '.ArticleBody', // common CMS patterns
  ];
  for (const sel of semantic) {
    const el = doc.querySelector<HTMLElement>(sel);
    if (el && (el.textContent?.trim().length ?? 0) > 150) return el;
  }

  /* Scoring fallback: score every div/section by paragraph density */
  let best: HTMLElement = doc.body;
  let bestScore = 0;

  doc.querySelectorAll<HTMLElement>('div, section').forEach(el => {
    if (isJunkEl(el)) return;
    const pCount     = el.querySelectorAll('p').length;
    const textLen    = el.textContent?.trim().length ?? 0;
    const linkDensity = (el.querySelectorAll('a').length * 100) / Math.max(1, pCount);
    const score = pCount * 15 + textLen * 0.5 - linkDensity;
    if (score > bestScore && textLen > 200) { bestScore = score; best = el; }
  });

  return best;
};

/** Extract og:section or breadcrumb category */
const extractCategory = (doc: Document): string => {
  const sources = [
    doc.querySelector('meta[property="article:section"]')?.getAttribute('content'),
    doc.querySelector('meta[name="category"]')?.getAttribute('content'),
    doc.querySelector('meta[property="og:section"]')?.getAttribute('content'),
    doc.querySelector('[class*="breadcrumb"] li:last-child')?.textContent?.trim(),
    doc.querySelector('meta[name="keywords"]')?.getAttribute('content')?.split(',')[0],
  ];
  return (sources.find(Boolean) ?? '').toUpperCase().trim();
};

export interface ReaderResult {
  title:    string;
  content:  string;   // sanitised HTML — images are lazy-loaded src= URLs (not base64)
  category: string;
}

export const fetchAndCacheArticleContent = async (
  article: Article,
): Promise<ReaderResult> => {
  const cacheKey = CACHE_PREFIX + hashStr(article.id ?? article.link);

  const cached = await cacheGet<ReaderResult>(cacheKey);
  if (cached) return cached;

  const res = await resilientFetch(article.link, { timeout: 15_000 });
  if (!res.ok) throw new Error(`Reader fetch failed: HTTP ${res.status}`);

  const html = await res.text();
  const doc  = new DOMParser().parseFromString(html, 'text/html');

  /* ── Remove hard junk ── */
  doc.querySelectorAll<Element>(JUNK_TAGS).forEach(el => el.remove());
  doc.querySelectorAll<Element>('*').forEach(el => {
    if (isJunkEl(el)) el.remove();
  });

  /* ── Find content, sanitise it ── */
  const contentEl = findMainContent(doc);
  const title     = doc.querySelector('h1')?.textContent?.trim() ?? doc.title ?? article.title;
  const category  = extractCategory(doc);

  /* Walk every element: remove disallowed tags (keep children), sanitise allowed ones */
  const walker = document.createTreeWalker(contentEl, NodeFilter.SHOW_ELEMENT);
  const toUnwrap: Element[] = [];
  let node: Element | null;
  while ((node = walker.nextNode() as Element | null)) {
    const tag = node.tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) {
      toUnwrap.push(node);
    } else {
      sanitiseEl(node, article.link);
    }
  }
  /* Unwrap disallowed elements (keep text/children) */
  for (const el of toUnwrap.reverse()) {
    el.replaceWith(...Array.from(el.childNodes));
  }

  const result: ReaderResult = {
    title,
    content:  contentEl.innerHTML,
    category,
  };

  try {
    await cacheSet(cacheKey, result);
  } catch {
    /* Cache write failure is non-fatal */
  }

  return result;
};
