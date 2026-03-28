/**
 * THE VOID // UTILS v2.0
 * Shared utility functions used across the app.
 */

/* ── Time formatting ── */

/** "2m", "3h", "4d", or "12 Jan" */
export const timeAgo = (date: Date | null): string => {
  if (!date) return '';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60)   return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60)   return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)     return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7)       return `${days}d`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

/** "1:04" from a total seconds value */
export const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

/** "15,320" score display */
export const formatScore = (n: number): string =>
  n.toLocaleString(undefined, { maximumFractionDigits: 0 });

/* ── String helpers ── */

/** Truncate a string to `max` characters, appending "…" if needed */
export const truncate = (str: string, max: number): string =>
  str.length <= max ? str : str.slice(0, max - 1) + '…';

/** Strip all HTML tags from a string */
export const stripHtml = (html: string): string =>
  html.replace(/<[^>]*>?/gm, '');

/** Convert a URL to its hostname for display ("bbc.co.uk") */
export const hostOf = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

/** Simple deterministic hash (for cache keys, IDs) */
export const hashStr = (str: string): string => {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return Math.abs(h).toString(36);
};

/* ── Array helpers ── */

/** Shuffle array in-place using Fisher-Yates */
export const shuffle = <T>(arr: T[], rng: () => number = Math.random): T[] => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/** Pick a random element from an array */
export const randomPick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/** Chunk an array into sub-arrays of size `n` */
export const chunk = <T>(arr: T[], n: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += n) result.push(arr.slice(i, i + n));
  return result;
};

/** Deduplicate an array by a key function */
export const uniqueBy = <T>(arr: T[], key: (item: T) => string | number): T[] => {
  const seen = new Set<string | number>();
  return arr.filter(item => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

/* ── DOM helpers ── */

/** Lazy-load an image: resolves with the final src on success, null on error */
export const preloadImage = (src: string): Promise<string | null> =>
  new Promise(resolve => {
    const img = new Image();
    img.onload  = () => resolve(src);
    img.onerror = () => resolve(null);
    img.src = src;
  });

/** Apply `.loaded` class to an <img> element once it has loaded */
export const bindImageFade = (img: HTMLImageElement): void => {
  if (img.complete) {
    img.classList.add('loaded');
    return;
  }
  img.onload  = () => img.classList.add('loaded');
  img.onerror = () => img.classList.add('loaded'); // still remove shimmer
};

/* ── Number helpers ── */

/** Clamp a value between min and max */
export const clamp = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, v));

/** Linear interpolation */
export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

/** Map a value from one range to another */
export const mapRange = (
  v: number,
  inMin: number, inMax: number,
  outMin: number, outMax: number,
): number => outMin + ((v - inMin) / (inMax - inMin)) * (outMax - outMin);

/* ── Local storage (safe wrappers) ── */

export const lsGet = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
};

export const lsSet = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* QuotaExceededError — silent fail */
  }
};

export const lsDel = (key: string): void => {
  try { localStorage.removeItem(key); } catch {}
};
