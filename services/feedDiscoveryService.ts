import { resilientFetch } from './fetch';

/**
 * Probes a URL to find associated RSS or Atom feed signals.
 */
export const discoverFeedSignals = async (siteUrl: string): Promise<{ url: string; title: string }[]> => {
    try {
        const response = await resilientFetch(siteUrl, { timeout: 8000 });
        if (!response.ok) return [];

        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        
        const feeds: { url: string; title: string }[] = [];
        
        // Look for standard link tags
        const links = doc.querySelectorAll('link[type="application/rss+xml"], link[type="application/atom+xml"], link[type="application/json"]');
        
        links.forEach(link => {
            const href = link.getAttribute('href');
            const title = link.getAttribute('title') || doc.title || 'Discovered Signal';
            if (href) {
                try {
                    const absoluteUrl = new URL(href, siteUrl).href;
                    feeds.push({ url: absoluteUrl, title });
                } catch (e) {
                    console.warn("Invalid discovered URL:", href);
                }
            }
        });

        // Common fallback paths if no meta links exist
        if (feeds.length === 0) {
            const commonPaths = ['/feed', '/rss', '/rss.xml', '/index.xml', '/feed.xml'];
            for (const path of commonPaths) {
                try {
                    const probeUrl = new URL(path, siteUrl).href;
                    const probeRes = await fetch(probeUrl, { method: 'HEAD' });
                    if (probeRes.ok && probeRes.headers.get('content-type')?.includes('xml')) {
                        feeds.push({ url: probeUrl, title: doc.title || 'Discovered Signal' });
                    }
                } catch (e) { /* silent fail */ }
            }
        }

        return feeds;
    } catch (e) {
        console.error("Discovery probe failed:", e);
        return [];
    }
};
