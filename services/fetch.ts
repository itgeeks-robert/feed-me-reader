export interface Proxy {
  url: string;
  encode: boolean;
}

export const PROXIES: Proxy[] = [
  { url: 'https://api.allorigins.win/raw?url=', encode: true },
  { url: 'https://cors.eu.org/', encode: false },
  { url: 'https://corsproxy.io/?', encode: true },
  { url: 'https://thingproxy.freeboard.io/fetch/', encode: false },
  { url: 'https://api.codetabs.com/v1/proxy/?quest=', encode: true },
];

const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};


export const resilientFetch = async (url: string, options: RequestInit & { timeout?: number } = {}) => {
  let lastError: Error | null = null;
  const { timeout = 15000 } = options;
  
  // Attempt direct fetch first, if not a localhost or file URL which would fail CORS
  if (url.startsWith('http')) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout / 2); // Shorter timeout for direct
      try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        if (response.ok) {
          return response;
        }
        lastError = new Error(`Direct fetch failed for ${url} with status: ${response.status}`);
      } catch (e) {
        clearTimeout(timeoutId);
        lastError = e as Error;
        // Don't log this failure, as it's common for CORS to block it. Proxies are the fallback.
      }
  }

  const shuffledProxies = shuffleArray(PROXIES);
  for (const proxy of shuffledProxies) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const proxyUrl = `${proxy.url}${proxy.encode ? encodeURIComponent(url) : url}`;
    
    try {
      const response = await fetch(proxyUrl, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        return response;
      }
      const errorText = await response.text().catch(() => 'Could not read error response.');
      lastError = new Error(`Proxy ${proxy.url} failed for ${url} with status: ${response.status}. Body: ${errorText.substring(0, 100)}`);
    } catch (e) {
      clearTimeout(timeoutId);
      if ((e as Error).name === 'AbortError') {
        lastError = new Error(`Proxy ${proxy.url} timed out for ${url}`);
      } else {
        lastError = e as Error;
      }
    }
  }
  throw lastError || new Error(`All proxies failed to fetch the resource: ${url}`);
};
