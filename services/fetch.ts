/**
 * THE VOID // FETCH_ENGINE v2.0
 * Resilient multi-proxy fetcher with:
 * - Proxy health tracking (failures penalise, successes reward)
 * - Per-proxy timeout instead of a single global timeout
 * - Direct fetch attempted first with a short CORS-detect fallback
 * - Automatic AbortController cleanup
 */

export interface Proxy {
  url:    string;
  encode: boolean;
}

/* ── Proxy registry ── */
export const PROXIES: Proxy[] = [
  { url: 'https://api.allorigins.win/raw?url=',          encode: true  },
  { url: 'https://corsproxy.io/?',                        encode: true  },
  { url: 'https://cors.eu.org/',                          encode: false },
  { url: 'https://thingproxy.freeboard.io/fetch/',        encode: false },
  { url: 'https://api.codetabs.com/v1/proxy/?quest=',     encode: true  },
];

/* ── Proxy health scores (higher = more preferred) ── */
const scores = new Map<string, number>(PROXIES.map(p => [p.url, 50]));

const reward = (url: string) => scores.set(url, Math.min(100, (scores.get(url) ?? 50) + 10));
const penalise = (url: string) => scores.set(url, Math.max(0,  (scores.get(url) ?? 50) - 20));

const sortedProxies = (): Proxy[] =>
  [...PROXIES].sort((a, b) => (scores.get(b.url) ?? 50) - (scores.get(a.url) ?? 50));

/* ── Fetch with AbortController timeout ── */
const fetchWithTimeout = (
  url:     string,
  options: RequestInit,
  ms:      number,
): Promise<Response> => {
  const ctrl = new AbortController();
  const id   = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...options, signal: ctrl.signal })
    .finally(() => clearTimeout(id));
};

/* ── Determine if a URL is same-origin (no proxy needed) ── */
const isSameOrigin = (url: string): boolean => {
  try {
    return new URL(url).origin === window.location.origin;
  } catch {
    return false;
  }
};

export interface FetchOptions extends Omit<RequestInit, 'signal'> {
  /** Total timeout for the entire operation (ms). Default: 15 000 */
  timeout?: number;
  /** Timeout for the direct (non-proxy) attempt (ms). Default: timeout / 3 */
  directTimeout?: number;
  /** Timeout per individual proxy attempt (ms). Default: timeout */
  proxyTimeout?: number;
}

/**
 * Fetches a URL resiliently:
 * 1. Direct fetch (short timeout — fast fail on CORS)
 * 2. Each proxy in descending health-score order
 *
 * Proxy health scores update automatically so good proxies get tried first.
 */
export const resilientFetch = async (
  url:     string,
  options: FetchOptions = {},
): Promise<Response> => {
  const {
    timeout      = 15_000,
    directTimeout = Math.round(timeout / 3),
    proxyTimeout  = timeout,
    ...fetchOpts
  } = options;

  let lastError: Error = new Error(`Failed to fetch: ${url}`);

  /* Step 1 — Direct fetch (skip for cross-origin if we know it'll be blocked) */
  if (url.startsWith('http') && !isSameOrigin(url)) {
    try {
      const res = await fetchWithTimeout(url, fetchOpts, directTimeout);
      if (res.ok) return res;
      lastError = new Error(`Direct fetch status ${res.status} for ${url}`);
    } catch (e) {
      lastError = e as Error;
      /* CORS block or timeout — expected, continue to proxies */
    }
  } else if (isSameOrigin(url)) {
    /* Same-origin: no proxy needed */
    return fetch(url, fetchOpts);
  }

  /* Step 2 — Proxies in health order */
  for (const proxy of sortedProxies()) {
    const proxyUrl = proxy.url + (proxy.encode ? encodeURIComponent(url) : url);
    try {
      const res = await fetchWithTimeout(proxyUrl, fetchOpts, proxyTimeout);
      if (res.ok) {
        reward(proxy.url);
        return res;
      }
      penalise(proxy.url);
      lastError = new Error(`Proxy ${proxy.url} returned ${res.status} for ${url}`);
    } catch (e) {
      penalise(proxy.url);
      lastError = (e as Error).name === 'AbortError'
        ? new Error(`Proxy ${proxy.url} timed out for ${url}`)
        : e as Error;
    }
  }

  throw lastError;
};
