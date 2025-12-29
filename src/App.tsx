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
import { resilientFetch } from '../services/fetch';
import { useLocalStorage } from '../hooks/useLocalStorage';

export interface Folder { id: number; name: string; }
export interface Feed { id: number; url: string; title: string; iconUrl: string; folderId: number | null; sourceType?: SourceType; category?: string; }
export interface Article { id: string; title: string; link: string; source: string; publishedDate: Date | null; snippet: string; imageUrl: string | null; feedCategory?: string; }
export type Selection = { 
    type: 'splash' | 'all' | 'folder' | 'bookmarks' | 'search' | 'feed' | 'reddit' | 'game_hub' | 'daily_uplink' | 'grid_reset' | 'deep_sync' | 'signal_scrambler' | 'utility_hub' | 'signal_streamer' | 'transcoder' | 'sudoku' | 'solitaire' | 'minesweeper' | 'tetris' | 'pool' | 'cipher_core' | 'void_runner' | 'synapse_link'; 
    id: string | number | null; 
    query?: string;
    category?: string;
};
export type Theme = 'light' | 'dark';
export type ArticleView = 'list' | 'grid' | 'featured';
export interface WidgetSettings { showWeather: boolean; showFinance: boolean; weatherLocation: string; }
export interface Settings { feeds: Feed[]; folders: Folder[]; theme: Theme; articleView: ArticleView; widgets: WidgetSettings; }

export type SudokuDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert';
export interface SudokuStats { totalWins: number; lastDailyCompletionDate?: string; }
export interface SolitaireStats { gamesWon: number; currentStreak: number; }
export interface SolitaireSettings { drawThree: boolean; }

const GUEST_USER_ID = 'survivor';
const READ_ARTICLES_KEY = `void_read_articles_${GUEST_USER_ID}`;
const BOOKMARKED_ARTICLES_KEY = `void_bookmarked_articles_${GUEST_USER_ID}`;
const ARTICLE_TAGS_KEY = `void_article_tags_${GUEST_USER_ID}`;
const FEEDS_KEY = `void_feeds_${GUEST_USER_ID}`;
const FOLDERS_KEY = `void_folders_${GUEST_USER_ID}`;
const THEME_KEY = `void_theme_${GUEST_USER_ID}`;
const ARTICLE_VIEW_KEY = `void_article_view_${GUEST_USER_ID}`;
const WIDGET_SETTINGS_KEY = `void_widget_settings_${GUEST_USER_ID}`;
const UPTIME_KEY = `void_uptime_${GUEST_USER_ID}`;
const CREDITS_KEY = `void_credits_${GUEST_USER_ID}`;

const App: React.FC = () => {
    const [theme, setTheme] = useLocalStorage<Theme>(THEME_KEY, 'dark');
    const [articleView, setArticleView] = useLocalStorage<ArticleView>(ARTICLE_VIEW_KEY, 'list');
    const [widgetSettings, setWidgetSettings] = useLocalStorage<WidgetSettings>(WIDGET_SETTINGS_KEY, { showWeather: true, showFinance: false, weatherLocation: 'London' });
    const [folders, setFolders] = useLocalStorage<Folder[]>(FOLDERS_KEY, []);
    const [feeds, setFeeds] = useLocalStorage<Feed[]>(FEEDS_KEY, []);
    const [readArticleIds, setReadArticleIds] = useLocalStorage<Set<string>>(READ_ARTICLES_KEY, () => new Set());
    const [bookmarkedArticleIds, setBookmarkedArticleIds] = useLocalStorage<Set<string>>(BOOKMARKED_ARTICLES_KEY, () => new Set());
    const [uptime, setUptime] = useLocalStorage<number>(UPTIME_KEY, 0);
    const [credits, setCredits] = useLocalStorage<number>(CREDITS_KEY, 100); 

    const [selection, setSelection] = useState<Selection>({ type: 'splash', id: null });
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
    const [readerArticle, setReaderArticle] = useState<Article | null>(null);
    const [lastRefresh, setLastRefresh] = useState(() => Date.now());

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

    const handleReturnToFeeds = useCallback(() => { setSelection({ type: 'all', id: null }); }, []);
    const handleEnterArcade = useCallback(() => { setSelection({ type: 'game_hub', id: null }); }, []);
    const handleEnterUtils = useCallback(() => { setSelection({ type: 'utility_hub', id: null }); }, []);

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
            
            let detectedCategory = 'GENERAL';
            const titleUpper = feedTitle.toUpperCase();
            const urlUpper = feedUrl.toUpperCase();
            if (titleUpper.includes('SPORT') || urlUpper.includes('SPORT')) detectedCategory = 'SPORTS';
            else if (titleUpper.includes('TECH') || urlUpper.includes('VERGE') || urlUpper.includes('WIRED')) detectedCategory = 'TECH';
            else if (titleUpper.includes('NEWS') || urlUpper.includes('BBC') || urlUpper.includes('REUTERS')) detectedCategory = 'NEWS';
            else if (titleUpper.includes('GAME') || urlUpper.includes('IGN') || urlUpper.includes('KOTAKU')) detectedCategory = 'GAMING';
            else if (titleUpper.includes('FINANCE') || urlUpper.includes('BLOOMBERG') || urlUpper.includes('MONEY')) detectedCategory = 'FINANCE';
            else if (titleUpper.includes('SCIENCE') || urlUpper.includes('NASA') || urlUpper.includes('NATURE')) detectedCategory = 'SCIENCE';
            else if (titleUpper.includes('CULTURE') || urlUpper.includes('MUSIC') || urlUpper.includes('FILM')) detectedCategory = 'CULTURE';

            setFeeds(prev => [...prev, { id: Date.now(), title: feedTitle, url: feedUrl, iconUrl, folderId: null, sourceType: type, category: detectedCategory }]);
        } catch (error) { throw error; }
    };

    const pageTitle = useMemo(() => {
        if (selection.type === 'search') return `SCANNING: "${selection.query}"`;
        if (selection.type === 'bookmarks') return 'SAVED PACKETS';
        if (selection.type === 'game_hub') return 'VOID ARCADE';
        if (selection.type === 'utility_hub') return 'SECTOR UTILITIES';
        if (selection.category) return `${selection.category} NODE`;
        if (selection.type === 'feed') return feeds.find(f => f.id === selection.id)?.title || 'Feed';
        return 'PERSONAL SIGS';
    }, [selection, feeds]);

    if (selection.type === 'splash') {
        return <SplashScreen onEnterFeeds={handleReturnToFeeds} onEnterArcade={handleEnterArcade} />;
    }

    const renderCurrentPage = () => {
        switch (selection.type) {
            case 'utility_hub':
                return <UtilityHubPage onSelect={(id) => setSelection({ type: id as any, id: null })} onBackToHub={handleReturnToFeeds} />;
            case 'game_hub':
                return <GameHubPage sudokuStats={{totalWins: 0}} solitaireStats={{gamesWon: 0, currentStreak: 0}} onReturnToFeeds={handleReturnToFeeds} uptime={uptime} setUptime={setUptime} credits={credits} setCredits={setCredits} showShop={false} setShowShop={() => {}} onSelect={(type: any) => setSelection({ type, id: null })} />;
            
            // Simulation Pages (Arcade)
            case 'sudoku': return <SudokuPage stats={{totalWins: 0}} onGameWin={() => {}} onGameLoss={() => {}} onBackToHub={handleEnterArcade} onReturnToFeeds={handleReturnToFeeds} />;
            case 'solitaire': return <SolitairePage stats={{gamesWon: 0, currentStreak: 0}} onGameWin={() => {}} onGameStart={() => {}} settings={{drawThree: true}} onUpdateSettings={() => {}} onBackToHub={handleEnterArcade} onReturnToFeeds={handleReturnToFeeds} />;
            case 'minesweeper': return <MinesweeperPage onBackToHub={handleEnterArcade} onReturnToFeeds={handleReturnToFeeds} />;
            case 'tetris': return <TetrisPage onBackToHub={handleEnterArcade} onReturnToFeeds={handleReturnToFeeds} />;
            case 'pool': return <PoolGamePage onBackToHub={handleEnterArcade} onReturnToFeeds={handleReturnToFeeds} />;
            case 'cipher_core': return <CipherCorePage onBackToHub={handleEnterArcade} uptime={uptime} setUptime={setUptime} />;
            case 'void_runner': return <VoidRunnerPage onBackToHub={handleEnterArcade} onReturnToFeeds={handleReturnToFeeds} />;
            case 'synapse_link': return <SynapseLinkPage onBackToHub={handleEnterArcade} />;
            case 'grid_reset': return <GridResetPage onBackToHub={handleEnterArcade} />;

            // Utility Pages (Media)
            case 'signal_streamer': return <SignalStreamerPage onBackToHub={handleEnterUtils} />;
            case 'transcoder': return <TranscoderPage onBackToHub={handleEnterUtils} />;
            case 'deep_sync': return <DeepSyncPage onBackToHub={handleEnterUtils} />;

            // Default fallback is Feeds/MainContent
            default:
                return (
                    <MainContent
                        key={selection.type + String(selection.id) + (selection.category || '')}
                        animationClass="animate-fade-in"
                        pageTitle={pageTitle}
                        onSearch={(query: string) => setSelection({ type: 'search', id: null, query })}
                        feedsToDisplay={
                            selection.category ? feeds.filter(f => f.category === selection.category) :
                            selection.type === 'folder' ? feeds.filter(f => f.folderId === selection.id) : 
                            (selection.type === 'feed' ? feeds.filter(f => f.id === selection.id) : feeds)
                        }
                        selection={selection}
                        onSelectCategory={(cat) => setSelection(cat ? { type: 'all', id: null, category: cat } : { type: 'all', id: null })}
                        readArticleIds={readArticleIds}
                        bookmarkedArticleIds={bookmarkedArticleIds}
                        articleTags={new Map()}
                        onMarkAsRead={handleMarkAsRead}
                        onPurgeBuffer={(ids) => setReadArticleIds(new Set([...Array.from(readArticleIds), ...ids]))}
                        onMarkAsUnread={(id) => { const n = new Set(readArticleIds); n.delete(id); setReadArticleIds(n); }}
                        onMarkMultipleAsRead={(ids) => setReadArticleIds(new Set([...Array.from(readArticleIds), ...ids]))}
                        onToggleBookmark={(id) => { const n = new Set(bookmarkedArticleIds); if (n.has(id)) n.delete(id); else n.add(id); setBookmarkedArticleIds(n); }}
                        onSetArticleTags={() => {}}
                        onOpenReader={setReaderArticle}
                        allFeeds={feeds}
                        onSetFeeds={setFeeds}
                        onSetFolders={setFolders}
                        refreshKey={lastRefresh}
                        onRefresh={() => setLastRefresh(Date.now())}
                        widgetSettings={widgetSettings}
                        articleView={articleView}
                        theme={theme}
                        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        onOpenSettings={() => setIsSettingsModalOpen(true)}
                        onOpenAddSource={() => setIsAddSourceModalOpen(true)}
                        onAddSource={handleAddSource}
                        onOpenSidebar={() => setIsSettingsModalOpen(true)}
                        uptime={uptime}
                    />
                );
        }
    };

    return (
        <div className="h-screen w-full font-sans text-sm relative flex flex-col overflow-hidden bg-void-950">
            {/* Main Application Frame with Top Safe Inset */}
            <div className="flex-1 flex flex-col min-w-0 relative pb-20 md:pb-0 h-full overflow-hidden">
                {renderCurrentPage()}
            </div>

            <BottomNavBar selection={selection} onSelect={setSelection} onOpenSettings={() => setIsSettingsModalOpen(true)} />

            <SettingsModal 
                isOpen={isSettingsModalOpen} 
                onClose={() => setIsSettingsModalOpen(false)} 
                settings={{ feeds, folders, theme, articleView, widgets: widgetSettings }} 
                onUpdateSettings={(s) => { if(s.theme) setTheme(s.theme); if(s.articleView) setArticleView(s.articleView); }} 
                onSelect={(s) => { setSelection(s); setIsSettingsModalOpen(false); }}
                onAddFolder={(n) => setFolders([...folders, {id: Date.now(), name: n}])}
                onRenameFolder={(id, n) => setFolders(folders.map(x => x.id === id ? {...x, name: n} : x))}
                onDeleteFolder={(id) => setFolders(folders.filter(x => x.id !== id))}
                onRemoveFeed={(id) => setFeeds(feeds.filter(x => x.id !== id))}
                onImportOpml={() => {}} onExportOpml={() => {}} onImportSettings={() => {}} onExportSettings={() => {}}
                credits={credits} onOpenShop={() => {}} onAddSource={handleAddSource} onEnterUtils={handleEnterUtils}
            />
            <AddSourceModal isOpen={isAddSourceModalOpen} onClose={() => setIsAddSourceModalOpen(false)} onAddSource={handleAddSource} />
            {readerArticle && <ReaderViewModal article={readerArticle} onClose={() => setReaderArticle(null)} onMarkAsRead={handleMarkAsRead} />}
        </div>
    );
};

export default App;