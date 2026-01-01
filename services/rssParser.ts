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
        const title = item.querySelector('title')?.textContent?.trim() || 'No title';
        
        // --- ROBUST LINK EXTRACTION ---
        let link = '';
        
        // 1. Try Atom-style links with priority on 'alternate'
        const atomLinks = Array.from(item.querySelectorAll('link'));
        if (atomLinks.length > 0) {
            const alternateLink = atomLinks.find(l => l.getAttribute('rel') === 'alternate');
            const hrefLink = alternateLink || atomLinks.find(l => l.hasAttribute('href'));
            if (hrefLink) {
                link = hrefLink.getAttribute('href') || '';
            }
            
            // If still no link, check if the first link element has text content (RSS standard)
            if (!link && atomLinks[0].textContent) {
                link = atomLinks[0].textContent.trim();
            }
        }

        // 2. Fallback to GUID if it's a permalink
        if (!link) {
            const guid = item.querySelector('guid');
            if (guid && (guid.getAttribute('isPermaLink') !== 'false')) {
                link = guid.textContent?.trim() || '';
            }
        }

        // 3. Fallback to any element named 'link' that might have been missed
        if (!link) {
            link = item.querySelector('link')?.textContent?.trim() || '';
        }

        // Clean up whitespace
        link = link.trim();

        const description = item.querySelector('description')?.textContent || item.querySelector('summary')?.textContent || '';
        const snippet = description.replace(/<[^>]*>?/gm, '').substring(0, 100) + (description.length > 100 ? '...' : '');
        const pubDateStr = item.querySelector('pubDate')?.textContent || item.querySelector('published')?.textContent || item.querySelector('updated')?.textContent;
        const publishedDate = pubDateStr ? new Date(pubDateStr) : null;
        const guidValue = item.querySelector('guid')?.textContent || item.querySelector('id')?.textContent;
        
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
        
        // Ensure link is absolute
        if (link && !link.startsWith('http')) {
            try {
                link = new URL(link, siteLink).href;
            } catch (e) {
                console.warn("Could not normalize link:", link);
            }
        }

        const id = guidValue || link || `${title}-${pubDateStr}`;

        return { id, title, link, snippet, publishedDate, source: sourceTitle, imageUrl };
    });
};