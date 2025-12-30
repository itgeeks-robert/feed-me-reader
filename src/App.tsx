
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import MainContent from '../components/MainContent';
import type { SourceType } from '../components/AddSource';
import SettingsModal from '../components/SettingsModal';
import AddSourceModal from '../components/AddSourceModal';
import BottomNavBar from '../components/BottomNavBar';
import GameHubPage from '../components/GameHubPage';
import DailyUplinkPage from '../components/DailyUplinkPage';
import ReaderViewModal from '../components/ReaderViewModal';
import SplashScreen from '../components/SplashScreen';
import DeepSyncPage from '../components/DeepSyncPage';
import SignalScramblerPage from '../components/SignalScramblerPage';
import UtilityHubPage from '../components/UtilityHubPage';
import SignalStreamerPage from '../components/SignalStreamerPage';
import TranscoderPage from '../components/TranscoderPage';
import SudokuPage from '../components/SudokuPage';
import SolitairePage from '../components/SolitairePage';
import MinesweeperPage from '../components/MinesweeperPage';
import TetrisPage from '../components/TetrisPage';
import PoolGamePage from '../components/PoolGamePage';
import CipherCorePage from '../components/SporeCryptPage'; 
import VoidRunnerPage from '../components/VoidRunnerPage';
import SynapseLinkPage from '../components/SynapseLinkPage';
import GridResetPage from '../components/GridResetPage';
import HangmanPage from '../components/HangmanPage';
import BlackMarket from '../components/BlackMarket';
import { resilientFetch } from '../services/fetch';
import { parseRssXml } from '../services/rssParser';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { GlobeAltIcon, RadioIcon, XIcon, ShieldCheckIcon, SearchIcon, BeakerIcon, SparklesIcon } from '../components/icons';

export interface Folder { id: number; name: string; }
export interface Feed { id: number; url: string; title: string; iconUrl: string; folderId: number | null; sourceType?: SourceType; category?: string; }
export interface Article { id: string; title: string; link: string; source: string; publishedDate: Date | null; snippet: string; imageUrl: string | null; feedCategory?: string; }

export type SudokuDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert';
export interface SudokuStats { totalWins: number; lastDailyCompletionDate?: string; }
export interface SolitaireStats { gamesWon: number; currentStreak: number; }
export interface SolitaireSettings { drawThree: boolean; }

export type Selection = { 
    type: 'splash' | 'all' | 'folder' | 'bookmarks' | 'search' | 'feed' | 'reddit' | 'game_hub' | 'daily_uplink' | 'grid_reset' | 'deep_sync' | 'signal_scrambler' | 'utility_hub' | 'signal_streamer' | 'transcoder' | 'sudoku' | 'solitaire' | 'minesweeper' | 'tetris' | 'pool' | 'cipher_core' | 'void_runner' | 'synapse_link' | 'hangman'; 
    id: string | number | null; 
    query?: string;
    category?: string;
};
export type Theme = 'light' | 'dark';
export type ArticleView = 'list' | 'grid' | 'featured';
export interface WidgetSettings { showWeather: boolean; showFinance: boolean; weatherLocation: string; }
export interface Settings { feeds: Feed[]; folders: Folder[]; theme: Theme; articleView: ArticleView; widgets: WidgetSettings; }

const GUEST_USER_ID = 'survivor';
const READ_ARTICLES_KEY = `void_read_articles_${GUEST_USER_ID}`;
const BOOKMARKED_ARTICLES_KEY = `void_bookmarked_articles_${GUEST_USER_ID}`;
const FEEDS_KEY = `void_feeds_${GUEST_USER_ID}`;
const FOLDERS_KEY = `void_folders_${GUEST_USER_ID}`;
const THEME_KEY = `void_theme_${GUEST_USER_ID}`;
const ARTICLE_VIEW_KEY = `void_article_view_${GUEST_USER_ID}`;
const WIDGET_SETTINGS_KEY = `void_widget_settings_${GUEST_USER_ID}`;
const UPTIME_KEY = `void_uptime_${GUEST_USER_ID}`;
const CREDITS_KEY = `void_credits_${GUEST_USER_ID}`;

const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const App: React.FC = () => {
    const [theme, setTheme] = useLocalStorage<Theme>(THEME_KEY, 'dark');
    const [articleView, setArticleView] = useLocalStorage<ArticleView>(ARTICLE_VIEW_KEY, 'list');
    const [widgetSettings, setWidgetSettings] = useLocalStorage<WidgetSettings>(WIDGET_SETTINGS_KEY, { showWeather: true, showFinance: false, weatherLocation: 'London' });
    const [folders, setFolders] = useLocalStorage<Folder[]>(FOLDERS_KEY, []);
    const [feeds, setFeeds] = useLocalStorage<Feed[]>(FEEDS_KEY, []);
    const [readArticleIds, setReadArticleIds] = useLocalStorage<Set<string>>(READ_ARTICLES_KEY, () => new Set());
    const [bookmarkedArticleIds, setBookmarkedArticleIds] = useLocalStorage<Set<string>>(BOOKMARKED_ARTICLES_KEY, () => new Set());
    
    const [uptime, setUptime] = useLocalStorage<number>(UPTIME_KEY, 25);
    const [credits, setCredits] = useLocalStorage<number>(CREDITS_KEY, 100); 

    const [selection, setSelection] = useState<Selection>(() => {
        if (typeof window !== 'undefined' && window.history.state?.selection) {
            return window.history.state.selection;
        }
        return { type: 'splash', id: null };
    });

    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
    const [isShopOpen, setIsShopOpen] = useState(false);
    const [readerArticle, setReaderArticle] = useState<Article | null>(null);
    const [prefetchedArticles, setPrefetchedArticles] = useState<Article[]>([]);
    const [isDecoding, setIsDecoding] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(() => Date.now());

    // Global Modal States
    const [outboundLink, setOutboundLink] = useState<{url: string, id: string} | null>(null);
    const [showSniffErrorModal, setShowSniffErrorModal] = useState(false);
    const [showSearchExplainer, setShowSearchExplainer] = useState(false);
    const [showIntegrityBriefing, setShowIntegrityBriefing] = useState(false);
    const [skipExternalWarning, setSkipExternalWarning] = useLocalStorage<boolean>('void_skip_external_warning', false);
    const [skipSearchExplainer, setSkipSearchExplainer] = useLocalStorage<boolean>('void_skip_search_explainer', false);
    const [skipIntegrityBriefing, setSkipIntegrityBriefing] = useLocalStorage<boolean>('void_skip_integrity_briefing', false);

    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            if (event.state?.isReader) {
                // Modal reader view handled
            } else if (event.state?.isOutbound || event.state?.isExplainer || event.state?.isIntegrity) {
                // Modals handled
            } else if (readerArticle) {
                setReaderArticle(null);
            } else if (outboundLink) {
                setOutboundLink(null);
            } else if (showSearchExplainer) {
                setShowSearchExplainer(false);
            } else if (showIntegrityBriefing) {
                setShowIntegrityBriefing(false);
            } else if (event.state?.selection) {
                setSelection(event.state.selection);
            } else {
                setSelection({ type: 'all', id: null });
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [readerArticle, outboundLink, showSearchExplainer, showIntegrityBriefing]);

    const updateSelection = useCallback((newSel: Selection, replace: boolean = false) => {
        setSelection(newSel);
        if (replace) {
            window.history.replaceState({ selection: newSel }, '');
        } else {
            window.history.pushState({ selection: newSel }, '');
        }
    }, []);

    const openReader = useCallback((article: Article) => {
        setReaderArticle(article);
        window.history.pushState({ isReader: true }, '');
    }, []);

    const closeReader = useCallback(() => {
        setReaderArticle(null);
        if (window.history.state?.isReader) {
            window.history.back();
        }
    }, []);

    const openExternal = useCallback((url: string, id: string) => {
        if (skipExternalWarning) {
            if (!readArticleIds.has(id)) {
                setReadArticleIds(prev => new Set(prev).add(id));
                setCredits(c => c + 10);
            }
            if (isMobile()) {
                window.location.assign(url);
            } else {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        } else {
            setOutboundLink({ url, id });
            window.history.pushState({ isOutbound: true }, '');
        }
    }, [skipExternalWarning, readArticleIds]);

    const closeExternalWarning = useCallback(() => {
        setOutboundLink(null);
        if (window.history.state?.isOutbound) {
            window.history.back();
        }
    }, []);

    const proceedExternal = useCallback(() => {
        if (outboundLink) {
            if (!readArticleIds.has(outboundLink.id)) {
                setReadArticleIds(prev => new Set(prev).add(outboundLink.id));
                setCredits(c => c + 10);
            }
            if (isMobile()) {
                window.location.assign(outboundLink.url);
            } else {
                window.open(outboundLink.url, '_blank', 'noopener,noreferrer');
                closeExternalWarning();
            }
        }
    }, [outboundLink, readArticleIds, closeExternalWarning]);

    const openSearchExplainer = useCallback(() => {
        if (!skipSearchExplainer) {
            setShowSearchExplainer(true);
            window.history.pushState({ isExplainer: true }, '');
        }
    }, [skipSearchExplainer]);

    const openIntegrityBriefing = useCallback((manual: boolean = false) => {
        if (manual || !skipIntegrityBriefing) {
            setShowIntegrityBriefing(true);
            window.history.pushState({ isIntegrity: true }, '');
        }
    }, [skipIntegrityBriefing]);

    const decodeCoreSignals = useCallback(async (targetFeeds: Feed[]) => {
        if (targetFeeds.length === 0) return;
        setIsDecoding(true);
        const promises = targetFeeds.map(feed => 
            resilientFetch(feed.url, { timeout: 10000 })
                .then(res => res.text())
                .then(xml => parseRssXml(xml, feed.title, feed.url).map(a => ({ ...a, feedCategory: feed.category || 'GENERAL' })))
                .catch(() => [])
        );
        const results = await Promise.all(promises);
        const all = results.flat().sort((a, b) => (b.publishedDate?.getTime() || 0) - (a.publishedDate?.getTime() || 0));
        setPrefetchedArticles(Array.from(new Map(all.map(a => [a.id, a])).values()));
        setIsDecoding(false);
    }, []);

    useEffect(() => {
        if (feeds.length > 0 && prefetchedArticles.length === 0) {
            decodeCoreSignals(feeds);
        }
    }, [feeds, decodeCoreSignals, prefetchedArticles.length]);

    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'light') { root.classList.remove('dark'); root.classList.add('light'); }
        else { root.classList.remove('light'); root.classList.add('dark'); }
    }, [theme]);

    const handleMarkAsRead = (id: string) => {
        if (!readArticleIds.has(id)) {
            setReadArticleIds(prev => new Set(prev).add(id));
            setUptime(f => Math.min(100, f + 5)); 
            setCredits(c => c + 10);
        }
    };

    const handleReturnToFeeds = useCallback(() => { updateSelection({ type: 'all', id: null }, selection.type === 'splash'); }, [updateSelection, selection.type]);
    const handleEnterArcade = useCallback(() => { updateSelection({ type: 'game_hub', id: null }, selection.type === 'splash'); }, [updateSelection, selection.type]);
    const handleEnterUtils = useCallback(() => { updateSelection({ type: 'utility_hub', id: null }); }, [updateSelection]);

    const handleAddSource = async (url: string, type: SourceType) => {
        let feedUrl = url.trim();
        try {
            if (type === 'reddit') {
                const match = url.trim().match(/reddit\.com\/(r\/[a-zA-Z0-9_]+|user\/[a-zA-Z0-9_-]+)/);
                feedUrl = match ? `https://www.reddit.com/${match[1]}/.rss` : `${url.trim().replace(/\/$/, '')}/.rss`;
            }
            const response = await resilientFetch(feedUrl);
            const text = await response.text();
            const xml = new DOMParser().parseFromString(text, "application/xml");
            const feedTitle = xml.querySelector('channel > title, feed > title')?.textContent || new URL(url).hostname;
            const siteLink = xml.querySelector('channel > link')?.textContent || url;
            const iconUrl = `https://www.google.com/s2/favicons?sz=32&domain_url=${new URL(siteLink).hostname}`;
            
            const newFeed: Feed = { id: Date.now(), title: feedTitle, url: feedUrl, iconUrl, folderId: null, sourceType: type, category: 'GENERAL' };
            setFeeds(prev => [...prev, newFeed]);
            setPrefetchedArticles([]); 
        } catch (error) { throw error; }
    };

    const handleImportOpml = (importedFeeds: Omit<Feed, 'id'>[], importedFolders: Folder[]) => {
        const feedsWithIds = importedFeeds.map(f => ({ ...f, id: Math.random() + Date.now() }));
        setFolders(prev => [...prev, ...importedFolders]);
        setFeeds(prev => [...prev, ...feedsWithIds]);
        setPrefetchedArticles([]);
    };

    const pageTitle = useMemo(() => {
        if (selection.type === 'search') return `SCANNING: "${selection.query}"`;
        if (selection.type === 'bookmarks') return 'SAVED PACKETS';
        if (selection.type === 'game_hub') return 'VOID ARCADE';
        if (selection.type === 'utility_hub') return 'SECTOR UTILITIES';
        if (selection.category) return `${selection.category} NODE`;
        if (selection.type === 'feed') return feeds.find(f => f.id === selection.id)?.title || 'Feed';
        return 'INCOMING INTEL';
    }, [selection, feeds]);

    if (selection.type === 'splash') {
        return <SplashScreen onEnterFeeds={handleReturnToFeeds} onEnterArcade={handleEnterArcade} isDecoding={isDecoding} />;
    }

    const renderCurrentPage = () => {
        switch (selection.type) {
            case 'utility_hub':
                return <UtilityHubPage onSelect={(id) => updateSelection({ type: id as any, id: null })} onBackToHub={handleReturnToFeeds} />;
            case 'game_hub':
                return <GameHubPage sudokuStats={{totalWins: 0}} solitaireStats={{gamesWon: 0, currentStreak: 0}} onReturnToFeeds={handleReturnToFeeds} uptime={uptime} setUptime={setUptime} credits={credits} setCredits={setCredits} showShop={isShopOpen} setShowShop={setIsShopOpen} onSelect={(type: any) => updateSelection({ type, id: null })} />;
            case 'sudoku': return <SudokuPage stats={{totalWins: 0}} onGameWin={() => {}} onGameLoss={() => {}} onBackToHub={handleEnterArcade} onReturnToFeeds={handleReturnToFeeds} />;
            case 'solitaire': return <SolitairePage stats={{gamesWon: 0, currentStreak: 0}} onGameWin={() => {}} onGameStart={() => {}} settings={{drawThree: true}} onUpdateSettings={() => {}} onBackToHub={handleEnterArcade} onReturnToFeeds={handleReturnToFeeds} />;
            case 'minesweeper': return <MinesweeperPage onBackToHub={handleEnterArcade} onReturnToFeeds={handleReturnToFeeds} />;
            case 'tetris': return <TetrisPage onBackToHub={handleEnterArcade} onReturnToFeeds={handleReturnToFeeds} />;
            case 'pool': return <PoolGamePage onBackToHub={handleEnterArcade} onReturnToFeeds={handleReturnToFeeds} />;
            case 'cipher_core': return <CipherCorePage onBackToHub={handleEnterArcade} uptime={uptime} setUptime={setUptime} />;
            case 'void_runner': return <VoidRunnerPage onBackToHub={handleEnterArcade} onReturnToFeeds={handleReturnToFeeds} />;
            case 'synapse_link': return <SynapseLinkPage onBackToHub={handleEnterArcade} />;
            case 'grid_reset': return <GridResetPage onBackToHub={handleEnterArcade} />;
            case 'hangman': return <HangmanPage onBackToHub={handleEnterArcade} />;
            case 'signal_streamer': return <SignalStreamerPage onBackToHub={handleEnterUtils} />;
            case 'transcoder': return <TranscoderPage onBackToHub={handleEnterUtils} />;
            case 'deep_sync': return <DeepSyncPage onBackToHub={handleEnterUtils} />;
            case 'signal_scrambler': return <SignalScramblerPage onBackToHub={handleEnterUtils} />;
            default:
                return (
                    <MainContent
                        key={selection.type + String(selection.id) + (selection.category || '')}
                        animationClass="animate-fade-in"
                        pageTitle={pageTitle}
                        onSearch={(query: string) => updateSelection({ type: 'search', id: null, query })}
                        feedsToDisplay={
                            selection.category ? feeds.filter(f => f.category === selection.category) :
                            selection.type === 'folder' ? feeds.filter(f => f.folderId === selection.id) : 
                            (selection.type === 'feed' ? feeds.filter(f => f.id === selection.id) : feeds)
                        }
                        selection={selection}
                        onSelectCategory={(cat) => updateSelection(cat ? { type: 'all', id: null, category: cat } : { type: 'all', id: null })}
                        readArticleIds={readArticleIds}
                        bookmarkedArticleIds={bookmarkedArticleIds}
                        articleTags={new Map()}
                        onMarkAsRead={handleMarkAsRead}
                        onPurgeBuffer={(ids) => setReadArticleIds(new Set([...Array.from(readArticleIds), ...ids]))}
                        onMarkAsUnread={(id) => { const n = new Set(readArticleIds); n.delete(id); setReadArticleIds(n); }}
                        onMarkMultipleAsRead={(ids) => setReadArticleIds(new Set([...Array.from(readArticleIds), ...ids]))}
                        onToggleBookmark={(id) => { const n = new Set(bookmarkedArticleIds); if (n.has(id)) n.delete(id); else n.add(id); setBookmarkedArticleIds(n); }}
                        onSetArticleTags={() => {}}
                        onOpenReader={openReader}
                        onOpenExternal={openExternal}
                        allFeeds={feeds}
                        onSetFeeds={setFeeds}
                        onSetFolders={setFolders}
                        refreshKey={lastRefresh}
                        onRefresh={() => { setPrefetchedArticles([]); setLastRefresh(Date.now()); }}
                        widgetSettings={widgetSettings}
                        articleView={articleView}
                        theme={theme}
                        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        onOpenSettings={() => setIsSettingsModalOpen(true)}
                        onOpenAddSource={() => setIsAddSourceModalOpen(true)}
                        onAddSource={handleAddSource}
                        onOpenSidebar={() => setIsSettingsModalOpen(true)}
                        uptime={uptime}
                        initialArticles={prefetchedArticles}
                        onSetSniffErrorModal={setShowSniffErrorModal}
                        onOpenSearchExplainer={openSearchExplainer}
                        onOpenIntegrityBriefing={() => openIntegrityBriefing(true)}
                    />
                );
        }
    };

    // SAFE ZONE LOCK: Root container enforces safe area padding to respect system bars globally
    return (
        <div className="h-screen w-full font-sans text-sm relative flex flex-col overflow-hidden bg-void-950 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
            <div className="flex-1 flex flex-col min-w-0 relative pb-20 md:pb-0 h-full overflow-hidden">
                {renderCurrentPage()}
            </div>
            
            <BottomNavBar selection={selection} onSelect={(s) => updateSelection(s)} onOpenSettings={() => setIsSettingsModalOpen(true)} />
            
            <SettingsModal 
                isOpen={isSettingsModalOpen} 
                onClose={() => setIsSettingsModalOpen(false)} 
                settings={{ feeds, folders, theme, articleView, widgets: widgetSettings }} 
                onUpdateSettings={(s) => { if(s.theme) setTheme(s.theme); if(s.articleView) setArticleView(s.articleView); }} 
                onSelect={(s) => { updateSelection(s); setIsSettingsModalOpen(false); }}
                onAddFolder={(n) => setFolders([...folders, {id: Date.now(), name: n}])}
                onRenameFolder={(id, n) => setFolders(folders.map(x => x.id === id ? {...x, name: n} : x))}
                onDeleteFolder={(id) => setFolders(folders.filter(x => x.id !== id))}
                onRemoveFeed={(id) => setFeeds(feeds.filter(x => x.id !== id))}
                onImportOpml={handleImportOpml} onExportOpml={() => {}} onImportSettings={() => {}} onExportSettings={() => {}}
                credits={credits} onOpenShop={() => { setIsSettingsModalOpen(false); setIsShopOpen(true); }} onAddSource={handleAddSource} onEnterUtils={handleEnterUtils}
            />
            
            <AddSourceModal isOpen={isAddSourceModalOpen} onClose={() => setIsAddSourceModalOpen(false)} onAddSource={handleAddSource} />
            <BlackMarket isOpen={isShopOpen} onClose={() => setIsShopOpen(false)} credits={credits} setCredits={setCredits} uptime={uptime} setUptime={setUptime} />
            {readerArticle && <ReaderViewModal article={readerArticle} onClose={closeReader} onMarkAsRead={handleMarkAsRead} />}

            {/* Global Overlays remain absolute but interactive content respects safe area */}
            {showSearchExplainer && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4 md:p-6 font-mono animate-fade-in pointer-events-auto">
                    <div className="bg-zinc-900 border-4 border-pulse-500 shadow-[0_0_120px_rgba(225,29,72,0.3)] w-full max-w-sm relative overflow-hidden flex flex-col">
                        <header className="h-10 bg-pulse-600 flex items-center justify-between px-1 border-b-2 border-black">
                            <div className="flex items-center gap-2 h-full">
                                <div className="w-8 h-7 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center">
                                   <div className="w-4 h-1 bg-black shadow-[0_4px_0_black]" />
                                </div>
                                <h2 className="text-white text-[10px] font-black uppercase tracking-[0.2em] italic px-2">SNIFFER_MANUAL.EXE</h2>
                            </div>
                            <button onClick={() => setShowSearchExplainer(false)} className="w-8 h-7 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center active:bg-zinc-400">
                                <XIcon className="w-4 h-4 text-black" />
                            </button>
                        </header>
                        <div className="p-10 bg-void-950 space-y-8 text-center">
                            <div className="mx-auto w-20 h-20 bg-pulse-500/10 rounded-full flex items-center justify-center border-2 border-pulse-500 animate-pulse">
                                <SearchIcon className="w-10 h-10 text-pulse-500" />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">Frequency Sniffer</h3>
                                <p className="text-[10px] text-zinc-500 leading-relaxed uppercase tracking-widest italic">Interception depends on target node RSS broadcast protocols.</p>
                            </div>
                        </div>
                        <footer className="p-4 bg-zinc-300 border-t-2 border-black">
                            <button onClick={() => setShowSearchExplainer(false)} className="w-full py-4 bg-zinc-100 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-400 text-xs font-black uppercase italic text-black active:bg-zinc-200">PROCEED_WITH_SCAN</button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
