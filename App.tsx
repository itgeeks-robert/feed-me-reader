import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';

export interface Folder {
  id: number;
  name: string;
}

export interface Feed {
  id: number;
  url: string;
  title: string;
  iconUrl: string;
  folderId: number | null;
}

export type Selection = {
  type: 'all' | 'feed' | 'folder' | 'briefing';
  id: string | number | null;
};

export type Theme = 'light' | 'dark';

export const CORS_PROXY = 'https://corsproxy.io/?';
const READ_ARTICLES_KEY = 'feedme_read_articles';

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => {
      if (typeof window === 'undefined') return 'light';
      if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        return 'dark';
      }
      return 'light';
  });

  const [readArticleIds, setReadArticleIds] = useState<Set<string>>(() => {
    try {
        const item = window.localStorage.getItem(READ_ARTICLES_KEY);
        return item ? new Set(JSON.parse(item)) : new Set();
    } catch (error) {
        console.error("Failed to load read articles from localStorage", error);
        return new Set();
    }
  });

  useEffect(() => {
      try {
          window.localStorage.setItem(READ_ARTICLES_KEY, JSON.stringify(Array.from(readArticleIds)));
      } catch (error) {
          console.error("Failed to save read articles to localStorage", error);
      }
  }, [readArticleIds]);


  const toggleTheme = () => {
      setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
      const root = window.document.documentElement;
      if (theme === 'dark') {
          root.classList.add('dark');
          localStorage.setItem('theme', 'dark');
      } else {
          root.classList.remove('dark');
          localStorage.setItem('theme', 'light');
      }
  }, [theme]);

  const [folders, setFolders] = useState<Folder[]>([
      { id: 1, name: 'News' },
      { id: 2, name: 'Tech' },
      { id: 3, name: 'Sport' },
  ]);

  const [feeds, setFeeds] = useState<Feed[]>([
    { id: 1, url: 'https://feeds.bbci.co.uk/news/rss.xml', title: 'BBC News', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=bbc.co.uk', folderId: 1 },
    { id: 2, url: 'https://www.theguardian.com/world/rss', title: 'The Guardian', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=theguardian.com', folderId: 1 },
    { id: 3, url: 'https://feeds.skynews.com/feeds/rss/world.xml', title: 'Sky News', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=news.sky.com', folderId: 1 },
    { id: 4, url: 'https://www.wired.com/feed/rss', title: 'Wired', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=wired.com', folderId: 2 },
    { id: 5, url: 'https://www.theverge.com/rss/index.xml', title: 'The Verge', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=theverge.com', folderId: 2 },
    { id: 6, url: 'https://news.ycombinator.com/rss', title: 'Hacker News', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=ycombinator.com', folderId: null },
    { id: 7, url: 'https://feeds.arstechnica.com/arstechnica/index/', title: 'Ars Technica', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=arstechnica.com', folderId: 2 },
    { id: 8, url: 'https://feeds.bbci.co.uk/sport/football/rss.xml', title: 'BBC Football', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=bbc.co.uk', folderId: 3 },
    { id: 9, url: 'https://feeds.bbci.co.uk/sport/motorsport/rss.xml', title: 'BBC Motorsport', iconUrl: 'https://www.google.com/s2/favicons?sz=32&domain_url=bbc.co.uk', folderId: 3 },
  ]);

  const [selection, setSelection] = useState<Selection>({ type: 'all', id: null });

  const handleAddFeed = async (url: string) => {
    if (url && !feeds.some(feed => feed.url === url)) {
      try {
        const response = await fetch(`${CORS_PROXY}${url}`);
        if (!response.ok) throw new Error('Network response was not ok.');
        
        const text = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, "application/xml");
        if (xml.querySelector('parsererror')) throw new Error('Failed to parse RSS feed.');

        const feedTitle = xml.querySelector('channel > title')?.textContent || xml.querySelector('feed > title')?.textContent || new URL(url).hostname;
        const siteLink = xml.querySelector('channel > link')?.textContent;
        const domainUrl = siteLink ? new URL(siteLink).hostname : new URL(url).hostname;
        const iconUrl = `https://www.google.com/s2/favicons?sz=32&domain_url=${domainUrl}`;

        const newFeed: Feed = {
          id: Date.now(),
          title: feedTitle,
          url,
          iconUrl,
          folderId: null, // Add to unfiled by default
        };
        
        setFeeds(prevFeeds => [...prevFeeds, newFeed]);
        setSelection({ type: 'feed', id: newFeed.id });
      } catch (error) {
        console.error("Failed to add feed:", error);
        alert("Could not fetch or parse the RSS feed. Please check the URL and try again.");
      }
    }
  };

  const handleRemoveFeed = (id: number) => {
    const feedToRemove = feeds.find(f => f.id === id);
    setFeeds(feeds.filter(feed => feed.id !== id));
    if (feedToRemove && selection.type === 'feed' && selection.id === feedToRemove.id) {
      setSelection({ type: 'all', id: null });
    }
  };

  const handleAddFolder = (name: string) => {
      const newFolder: Folder = { id: Date.now(), name };
      setFolders(prev => [...prev, newFolder]);
  };

  const handleRenameFolder = (id: number, newName: string) => {
      setFolders(folders.map(f => f.id === id ? { ...f, name: newName } : f));
  };
  
  const handleDeleteFolder = (id: number) => {
      setFolders(folders.filter(f => f.id !== id));
      // Move feeds from deleted folder to unfiled
      setFeeds(feeds.map(f => f.folderId === id ? { ...f, folderId: null } : f));
      if (selection.type === 'folder' && selection.id === id) {
          setSelection({ type: 'all', id: null });
      }
  };

  const handleMoveFeedToFolder = (feedId: number, folderId: number | null) => {
      setFeeds(feeds.map(f => f.id === feedId ? { ...f, folderId } : f));
  };

  const handleMarkAsRead = (articleId: string) => {
      setReadArticleIds(prev => {
          if (prev.has(articleId)) return prev;
          const newSet = new Set(prev);
          newSet.add(articleId);
          return newSet;
      });
  };

  const handleMarkMultipleAsRead = (articleIds: string[]) => {
      setReadArticleIds(prev => {
          const newSet = new Set(prev);
          articleIds.forEach(id => newSet.add(id));
          return newSet;
      });
  };

  let feedsToDisplay: Feed[] = [];
  let title = '';

  if (selection.type === 'all') {
    feedsToDisplay = feeds;
    title = 'All Feeds';
  } else if (selection.type === 'folder') {
    feedsToDisplay = feeds.filter(f => f.folderId === selection.id);
    title = folders.find(f => f.id === selection.id)?.name || 'Folder';
  } else if (selection.type === 'feed') {
    const feed = feeds.find(f => f.id === selection.id);
    feedsToDisplay = feed ? [feed] : [];
    title = feed?.title || 'Feed';
  } else if (selection.type === 'briefing') {
    feedsToDisplay = feeds;
    title = 'Daily Briefing';
  }

  return (
    <div className="flex h-screen font-sans text-sm">
      <Sidebar
        feeds={feeds}
        folders={folders}
        selection={selection}
        onAddFeed={handleAddFeed}
        onRemoveFeed={handleRemoveFeed}
        onSelect={setSelection}
        onAddFolder={handleAddFolder}
        onRenameFolder={handleRenameFolder}
        onDeleteFolder={handleDeleteFolder}
        onMoveFeedToFolder={handleMoveFeedToFolder}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <MainContent
        feedsToDisplay={feedsToDisplay}
        title={title}
        selectionType={selection.type}
        key={JSON.stringify(selection)}
        readArticleIds={readArticleIds}
        onMarkAsRead={handleMarkAsRead}
        onMarkMultipleAsRead={handleMarkMultipleAsRead}
      />A
    </div>
  );
};

export default App;
