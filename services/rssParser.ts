import type { Article } from '../src/App';

export const parseRssXml = (xmlText: string, sourceTitle: string, feedUrl: string): Article[] => {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, "application/xml");
    const errorNode = xml.querySelector('parsererror');
    if (errorNode) throw new Error(`Failed to parse RSS feed for ${sourceTitle}.`);

    const channelLink = xml.querySelector('channel > link');
    const feedLink = xml.querySelector('feed > link[rel="alternate"], feed > link:not([rel])');
    const siteLink = channelLink?.textContent?.trim() || (feedLink ? feedLink.getAttribute('href') : null) || feedUrl;

    const items = Array.from(xml.querySelectorAll('item, entry'));
    return items.map(item => {
        const title = item.querySelector('title')?.textContent || 'No title';
        const linkElem = item.querySelector('link');
        const link = linkElem?.getAttribute('href') || linkElem?.textContent || '';
        const description = item.querySelector('description')?.textContent || item.querySelector('summary')?.textContent || '';
        const snippet = description.replace(/<[^>]*>?/gm, '').substring(0, 100) + (description.length > 100 ? '...' : '');
        const pubDateStr = item.querySelector('pubDate')?.textContent || item.querySelector('published')?.textContent || item.querySelector('updated')?.textContent;
        const publishedDate = pubDateStr ? new Date(pubDateStr) : null;
        const guid = item.querySelector('guid')?.textContent || item.querySelector('id')?.textContent;
        
        let imageUrl: string | null = null;
        const mediaContent = item.querySelector('media\\:content, content');
        if (mediaContent && mediaContent.getAttribute('medium') === 'image') imageUrl = mediaContent.getAttribute('url');
        if (!imageUrl) {
            const enclosure = item.querySelector('enclosure');
            if (enclosure && enclosure.getAttribute('type')?.startsWith('image')) imageUrl = enclosure.getAttribute('url');
        }
        if (!imageUrl) {
            const mediaThumbnail = item.querySelector('media\\:thumbnail, thumbnail');
            if (mediaThumbnail) imageUrl = mediaThumbnail.getAttribute('url');
        }
        if (!imageUrl) {
            const contentEncoded = item.querySelector('content\\:encoded, encoded')?.textContent;
            const contentToParse = contentEncoded || description;
            if (contentToParse) {
                try {
                    const doc = new DOMParser().parseFromString(contentToParse, 'text/html');
                    const img = doc.querySelector('img');
                    if (img) imageUrl = img.getAttribute('src');
                } catch (e) { console.warn("Error parsing HTML content for image", e); }
            }
        }

        if (imageUrl) {
            try {
                imageUrl = new URL(imageUrl, siteLink).href;
            } catch (e) {
                console.warn(`Could not construct valid URL for image: "${imageUrl}" with base "${siteLink}"`);
                imageUrl = null;
            }
        }
        
        const id = guid || link || `${title}-${pubDateStr}`;

        return { id, title, link, snippet, publishedDate, source: sourceTitle, imageUrl };
    });
};
