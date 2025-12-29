import type { Feed, Folder } from '../src/App';

/**
 * Generates an OPML XML string from current app state.
 */
export const exportToOpml = (feeds: Feed[], folders: Folder[]): string => {
    const timestamp = new Date().toUTCString();
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
    <head>
        <title>THE VOID | Signal Export</title>
        <dateCreated>${timestamp}</dateCreated>
        <ownerName>Void_Operator</ownerName>
    </head>
    <body>`;

    // Add folders and their feeds
    folders.forEach(folder => {
        const folderFeeds = feeds.filter(f => f.folderId === folder.id);
        xml += `\n        <outline text="${folder.name.toUpperCase()}" title="${folder.name.toUpperCase()}">`;
        folderFeeds.forEach(feed => {
            xml += `\n            <outline type="rss" text="${feed.title}" title="${feed.title}" xmlUrl="${feed.url}" htmlUrl="${feed.url}" />`;
        });
        xml += `\n        </outline>`;
    });

    // Add feeds not in folders
    const rootFeeds = feeds.filter(f => !f.folderId);
    if (rootFeeds.length > 0) {
        rootFeeds.forEach(feed => {
            xml += `\n        <outline type="rss" text="${feed.title}" title="${feed.title}" xmlUrl="${feed.url}" htmlUrl="${feed.url}" />`;
        });
    }

    xml += `\n    </body>\n</opml>`;
    return xml;
};

/**
 * Parses an OPML string into a flat list of feeds and folders.
 */
export const parseOpml = (xmlText: string): { feeds: Omit<Feed, 'id'>[], folders: Folder[] } => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "application/xml");
    const feeds: Omit<Feed, 'id'>[] = [];
    const folders: Folder[] = [];

    const body = doc.querySelector('body');
    if (!body) throw new Error("Invalid OPML structure: Body missing.");

    const processOutline = (element: Element, parentFolderId: number | null = null) => {
        const type = element.getAttribute('type');
        const text = element.getAttribute('text') || element.getAttribute('title') || 'Unknown Signal';
        const xmlUrl = element.getAttribute('xmlUrl');

        if (type === 'rss' && xmlUrl) {
            feeds.push({
                url: xmlUrl,
                title: text,
                iconUrl: `https://www.google.com/s2/favicons?sz=32&domain_url=${new URL(xmlUrl).hostname}`,
                folderId: parentFolderId,
                sourceType: 'rss',
                category: 'GENERAL'
            });
        } else if (element.children.length > 0) {
            // It's a folder
            const folderId = Date.now() + Math.floor(Math.random() * 1000);
            folders.push({ id: folderId, name: text });
            Array.from(element.children).forEach(child => processOutline(child, folderId));
        }
    };

    Array.from(body.children).forEach(outline => processOutline(outline));

    return { feeds, folders };
};
