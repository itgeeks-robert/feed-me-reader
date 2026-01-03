import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import MainContent from '../components/MainContent';
import type { SourceType } from '../components/AddSource';
import Sidebar from '../components/Sidebar';
import GameHubPage from '../components/GameHubPage';
import ReaderViewModal from '../components/ReaderViewModal';
import SplashScreen from '../components/SplashScreen';
import UtilityHubPage from '../components/UtilityHubPage';
import SignalStreamerPage from '../components/SignalStreamerPage';
import SurveillanceRadarPage from '../components/SurveillanceRadarPage';
import TranscoderPage from '../components/TranscoderPage';
import Base64ConverterPage from '../components/Base64ConverterPage';
import SudokuPage from '../components/SudokuPage';
import SolitairePage from '../components/SolitairePage';
import MinesweeperPage from '../components/MinesweeperPage';
import TetrisPage from '../components/TetrisPage';
import PoolGamePage from '../components/PoolGamePage';
import CipherCorePage from '../components/CipherCorePage'; 
import VoidRunnerPage from '../components/VoidRunnerPage';
import SynapseLinkPage from '../components/SynapseLinkPage';
import GridResetPage from '../components/GridResetPage';
import HangmanPage from '../components/HangmanPage';
import NeonSignalPage from '../components/NeonSignalPage';
import OrientationGuard from '../components/OrientationGuard';
import { resilientFetch } from '../services/fetch';
import { parseRssXml } from '../services/rssParser';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { GlobeAltIcon, RadioIcon, XIcon, SearchIcon, VoidIcon, ControllerIcon, CpuChipIcon, MenuIcon, BoltIcon, ShieldCheckIcon } from '../components/icons';
import { soundService } from '../services/soundService';
import SettingsModal from '../components/SettingsModal';

export interface Folder { id: number; name: string; }
export interface Feed { id: number; url: string; title: string; iconUrl: string; folderId: number | null; sourceType?: SourceType; category?: string; }
export interface Article { id: string; title: string; link: string; source: string; publishedDate: Date | null; snippet: string; imageUrl: string | null; feedCategory?: string; }

export type SudokuDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert';
export interface SudokuStats { totalWins: number; }
export interface SolitaireStats { gamesWon: number; currentStreak: number; }
export interface SolitaireSettings { drawThree: boolean; }

export type Theme = 'noir' | 'liquid-glass' | 'bento-grid' | 'brutalist' | 'claymorphism' | 'monochrome-zen' | 'y2k' | 'terminal';

export type Selection = { 
    type: 'splash' | 'all' | 'folder' | 'bookmarks' | 'search' | 'feed' | 'reddit' | 'game_hub' | 'daily_uplink' | 'grid_reset' | 'deep_sync' | 'signal_scrambler' | 'utility_hub' | 'signal_streamer' | 'surveillance_radar' | 'transcoder' | 'base64_converter' | 'sudoku' | 'solitaire' | 'minesweeper' | 'tetris' | 'pool' | 'cipher_core' | 'void_runner' | 'synapse_link' | 'hangman' | 'neon_signal'; 
    id: string | number | null; 
    query?: string;
    category?: string;
};
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
const SELECTION_KEY = `void_selection_${GUEST_USER_ID}`;
const FAV_GAMES_KEY = `void_fav_games_${GUEST_USER_ID}`;
const AMBIENT_SOUND_KEY = `void_ambient_sound_${GUEST_USER_ID}`;

const FALLBACK_WORD = "FABLE";
const SECTOR_LIMIT = 7;

const TerminalView: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex-1 flex flex-col min-w-0 relative h-full overflow-hidden">
        {children}
    </div>
);

const App: React.FC = () => {
    const [theme, setTheme] = useLocalStorage<Theme>(THEME_KEY, 'noir');
    const [articleView, setArticleView] = useLocalStorage<ArticleView>(ARTICLE_VIEW_KEY, 'list');
    const [widgetSettings, setWidgetSettings] = useLocalStorage<WidgetSettings>(WIDGET_SETTINGS_KEY, { showWeather: true, showFinance: false, weatherLocation: 'London' });
    const [folders, setFolders] = useLocalStorage<Folder[]>(FOLDERS_KEY, []);
    const [feeds, setFeeds] = useLocalStorage<Feed[]>(FEEDS_KEY, []);
    const [readArticleIds, setReadArticleIds] = useLocalStorage<Set<string>>(READ_ARTICLES_KEY, () => new Set());
    const [bookmarkedArticleIds, setBookmarkedArticleIds] = useLocalStorage<Set<string>>(BOOKMARKED_ARTICLES_KEY, () => new Set());
    const [favoriteGameIds, setFavoriteGameIds] = useLocalStorage<Set<string>>(FAV_GAMES_KEY, () => new Set());
    const [ambientEnabled, setAmbientEnabled] = useLocalStorage<boolean>(AMBIENT_SOUND_KEY, false);
    
    const [uptime, setUptime] = useLocalStorage<number>(UPTIME_KEY, 25);
    const [selection, setSelection] = useLocalStorage<Selection>(SELECTION_KEY, { type: 'splash', id: null });

    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [readerArticle, setReaderArticle] = useState<Article | null>(null);
    const [prefetchedArticles, setPrefetchedArticles] = useState<Article[]>([]);
    const [isDecoding, setIsDecoding] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(() => Date.now());

    const [cipherData, setCipherData] = useState<{ archiveMap: { date: string; word: string; label: string }[]; isSynced: boolean; loading: boolean }>({
        archiveMap: [],
        isSynced: false,
        loading: true
    });

    useEffect(() => {
        const doc = document.documentElement;
        const dataThemeMap: Record<Theme, string> = {
            'noir': 'noir',
            'terminal': 'terminal',
            // Fix: Remove invalid key 'bento' from dataThemeMap Record, as it is not part of the Theme type.
            'liquid-glass': 'sleek',
            'brutalist': 'brutalist',
            'claymorphism': 'claymorphism',
            'monochrome-zen': 'monochrome-zen',
            'y2k': 'y2k',
            'bento-grid': 'bento'
        };
        doc.setAttribute('data-theme', dataThemeMap[theme] || 'noir');

        const themeClasses = ['theme-liquid-glass', 'theme-bento-grid', 'theme-brutalist', 'theme-claymorphism', 'theme-monochrome-zen', 'theme-y2k', 'theme-terminal'];
        themeClasses.forEach(c => doc.classList.remove(c));
        if (theme !== 'noir') {
            doc.classList.add(`theme-${theme}`);
        }

        soundService.setAmbient(ambientEnabled, theme);
    }, [ambientEnabled, theme]);

    const isGameActive = useMemo(() => {
        const gameTypes = ['sudoku', 'solitaire', 'minesweeper', 'tetris', 'pool', 'cipher_core', 'void_runner', 'synapse_link', 'grid_reset', 'hangman', 'neon_signal'];
        return gameTypes.includes(selection.type);
    }, [selection.type]);

    const isUtilityActive = useMemo(() => {
        const utilTypes = ['utility_hub', 'signal_streamer', 'surveillance_radar', 'transcoder', 'base64_converter'];
        return utilTypes.includes(selection.type);
    }, [selection.type]);

    const handleToggleTheme = useCallback(() => {
        const themes: Theme[] = ['noir', 'liquid-glass', 'bento-grid', 'brutalist', 'claymorphism', 'monochrome-zen', 'y2k', 'terminal'];
        const nextIndex = (themes.indexOf(theme) + 1) % themes.length;
        setTheme(themes[nextIndex]);
    }, [theme, setTheme]);

    const handleResetSystem = useCallback(() => {
        soundService.playWrong();
        setFeeds([]);
        setFolders([]);
        setReadArticleIds(new Set());
        setBookmarkedArticleIds(new Set());
        setSelection({ type: 'all', id: null });
        setIsSettingsModalOpen(false);
    }, [setFeeds, setFolders, setReadArticleIds, setBookmarkedArticleIds, setSelection]);

    const handleAddSource = useCallback(async (url: string, type: SourceType) => {
        setFeeds(prev => [...prev, { 
            id: Date.now() + Math.random(), 
            url, title: 'New Signal', 
            iconUrl: `https://www.google.com/s2/favicons?sz=32&domain_url=${new URL(url).hostname}`, 
            folderId: null, sourceType: type 
        }]);
    }, [setFeeds]);

    const prefetchCipherFrequency = useCallback(async () => {
        const results = new Map<string, string>();
        try {
            const response = await resilientFetch('https://screenrant.com/wordle-history/', { timeout: 12000 });
            if (response.ok) {
                const html = await response.text();
                const doc = new DOMParser().parseFromString(html, 'text/html');
                const tables = doc.querySelectorAll('table');
                tables.forEach(table => {
                    table.querySelectorAll('tr').forEach(row => {
                        const cells = row.querySelectorAll('td');
                        if (cells.length >= 2) {
                            const dateRaw = cells[0].textContent?.trim() || "";
                            const wordRaw = cells[1].textContent?.trim().toUpperCase() || "";
                            if (/^[A-Z]{5}$/.test(wordRaw)) {
                                try {
                                    const d = new Date(dateRaw);
                                    if (!isNaN(d.getTime())) results.set(d.toISOString().split('T')[0], wordRaw);
                                } catch (e) {}
                            }
                        }
                    });
                });
            }
        } catch (e) {}

        const finalMap = Array.from({ length: SECTOR_LIMIT }, (_, i) => {
            const d = new Date(); d.setDate(d.getDate() - i);
            const iso = d.toISOString().split('T')[0];
            let word = results.get(iso) || FALLBACK_WORD;
            return { date: iso, word, label: i === 0 ? "TODAY" : `T-${i}` };
        });
        setCipherData({ archiveMap: finalMap, isSynced: results.size > 0, loading: false });
    }, []);

    const prefetchContentFrequencies = useCallback(async () => {
        if (feeds.length === 0) return;
        setIsDecoding(true);
        const topFeeds = feeds.slice(0, 3);
        const promises = topFeeds.map(feed => 
            resilientFetch(feed.url, { timeout: 8000 })
                .then(res => res.text())
                .then(xml => parseRssXml(xml, feed.title, feed.url))
                .catch(() => [])
        );
        try {
            const results = await Promise.all(promises);
            const all = results.flat().sort((a, b) => (b.publishedDate?.getTime() || 0) - (a.publishedDate?.getTime() || 0));
            setPrefetchedArticles(Array.from(new Map(all.map(a => [a.id, a])).values()));
        } finally { setIsDecoding(false); }
    }, [feeds]);

    useEffect(() => {
        prefetchCipherFrequency();
        if (selection.type === 'splash' && feeds.length > 0) prefetchContentFrequencies();
    }, [prefetchCipherFrequency, prefetchContentFrequencies, selection.type, feeds.length]);

    const updateSelection = useCallback((newSel: Selection, replace: boolean = false) => {
        setSelection(newSel);
        if (replace) window.history.replaceState({ selection: newSel }, '');
        else window.history.pushState({ selection: newSel }, '');
        setIsSidebarOpen(false);
    }, [setSelection]);

    if (selection.type === 'splash') {
        return <SplashScreen onEnterFeeds={() => updateSelection({ type: 'all', id: null })} onEnterArcade={() => updateSelection({ type: 'game_hub', id: null })} isDecoding={isDecoding} onReset={handleResetSystem} />;
    }

    // Shield sidebar when in games
    const hideMenuTrigger = isGameActive || selection.type === 'game_hub';

    return (
        <div className="h-screen w-full font-sans text-sm relative flex flex-col overflow-hidden bg-app-bg text-app-text transition-colors duration-300">
            <header className="fixed top-0 left-0 right-0 z-[60] bg-black border-b border-white/10 pt-[var(--safe-top)] shrink-0">
                <div className="h-11 md:h-12 flex items-center px-2 md:px-8 justify-between">
                    <div className="flex items-center h-full gap-2 md:gap-3 overflow-x-auto scrollbar-hide">
                        <div onClick={() => updateSelection({ type: 'all', id: null })} className="flex items-center gap-1.5 shrink-0 pr-2 border-r border-white/10 cursor-pointer active:scale-95 transition-transform">
                            <VoidIcon className="w-4 h-4 md:w-5 md:h-5 text-pulse-500" />
                            <span className="text-[10px] font-black italic text-white tracking-tighter hidden sm:inline uppercase">Void</span>
                        </div>
                        <nav className="flex h-full items-center gap-1 md:gap-2">
                            <GlobalNavLink active={selection.type === 'game_hub'} onClick={() => updateSelection({ type: 'game_hub', id: null })} label="ARCADE" icon={<RadioIcon className="w-3.5 h-3.5"/>} />
                            <GlobalNavLink active={selection.type === 'all' && !selection.category} onClick={() => updateSelection({ type: 'all', id: null })} label="INTEL" icon={<GlobeAltIcon className="w-3.5 h-3.5"/>} />
                            <GlobalNavLink active={isUtilityActive} onClick={() => updateSelection({ type: 'utility_hub', id: null })} label="UTIL" icon={<BoltIcon className="w-3.5 h-3.5"/>} />
                            <GlobalNavLink active={isSettingsModalOpen} onClick={() => setIsSettingsModalOpen(true)} label="CORE" icon={<CpuChipIcon className="w-3.5 h-3.5"/>} />
                        </nav>
                    </div>
                    <div className={`flex items-center gap-1 shrink-0 pl-1 transition-opacity duration-500 ${hideMenuTrigger ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                        <button onClick={() => setIsSidebarOpen(true)} className="p-1.5 md:p-2 text-zinc-500 hover:text-white transition-colors active:scale-90"><MenuIcon className="w-5 h-5 md:w-6 md:h-6" /></button>
                    </div>
                </div>
            </header>

            <TerminalView>
                {selection.type === 'game_hub' ? (
                    <GameHubPage onSelect={(type: any) => updateSelection({ type, id: null })} onReturnToFeeds={() => updateSelection({ type: 'all', id: null })} favoriteGameIds={favoriteGameIds} onToggleFavorite={(id: string) => setFavoriteGameIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; })} theme={theme} onToggleTheme={handleToggleTheme} />
                ) : isGameActive ? (
                    <OrientationGuard portraitOnly>
                        {selection.type === 'sudoku' && <SudokuPage stats={{totalWins: 0}} onGameWin={() => {}} onGameLoss={() => {}} onBackToHub={() => updateSelection({ type: 'game_hub', id: null })} onReturnToFeeds={() => updateSelection({ type: 'all', id: null })} />}
                        {selection.type === 'solitaire' && <SolitairePage stats={{gamesWon: 0, currentStreak: 0}} onGameWin={() => {}} onGameStart={() => {}} settings={{drawThree: true}} onUpdateSettings={() => {}} onBackToHub={() => updateSelection({ type: 'game_hub', id: null })} onReturnToFeeds={() => updateSelection({ type: 'all', id: null })} />}
                        {selection.type === 'minesweeper' && <MinesweeperPage onBackToHub={() => updateSelection({ type: 'game_hub', id: null })} onReturnToFeeds={() => updateSelection({ type: 'all', id: null })} onDefuse={() => {}} />}
                        {selection.type === 'tetris' && <TetrisPage onBackToHub={() => updateSelection({ type: 'game_hub', id: null })} onReturnToFeeds={() => updateSelection({ type: 'all', id: null })} />}
                        {selection.type === 'pool' && <PoolGamePage onBackToHub={() => updateSelection({ type: 'game_hub', id: null })} onReturnToFeeds={() => updateSelection({ type: 'all', id: null })} />}
                        {selection.type === 'cipher_core' && <CipherCorePage onBackToHub={() => updateSelection({ type: 'game_hub', id: null })} uptime={uptime} setUptime={setUptime} preloadedData={cipherData} onWin={() => setUptime(prev => Math.min(100, prev + 15))} />}
                        {selection.type === 'void_runner' && <VoidRunnerPage onBackToHub={() => updateSelection({ type: 'game_hub', id: null })} onReturnToFeeds={() => updateSelection({ type: 'all', id: null })} />}
                        {selection.type === 'synapse_link' && <SynapseLinkPage onBackToHub={() => updateSelection({ type: 'game_hub', id: null })} />}
                        {selection.type === 'grid_reset' && <GridResetPage onBackToHub={() => updateSelection({ type: 'game_hub', id: null })} />}
                        {selection.type === 'hangman' && <HangmanPage onBackToHub={() => updateSelection({ type: 'game_hub', id: null })} />}
                        {selection.type === 'neon_signal' && <NeonSignalPage onBack={() => updateSelection({ type: 'game_hub', id: null })} onReturnToFeeds={() => updateSelection({ type: 'all', id: null })} />}
                    </OrientationGuard>
                ) : isUtilityActive ? (
                    <>
                        {selection.type === 'utility_hub' && <UtilityHubPage onSelect={(id) => updateSelection({ type: id as any, id: null })} onBackToHub={() => updateSelection({ type: 'all', id: null })} theme={theme} onToggleTheme={handleToggleTheme} />}
                        {selection.type === 'signal_streamer' && <SignalStreamerPage onBackToHub={() => updateSelection({ type: 'utility_hub', id: null })} />}
                        {selection.type === 'surveillance_radar' && <SurveillanceRadarPage onBackToHub={() => updateSelection({ type: 'utility_hub', id: null })} />}
                        {selection.type === 'transcoder' && <TranscoderPage onBackToHub={() => updateSelection({ type: 'utility_hub', id: null })} />}
                        {selection.type === 'base64_converter' && <Base64ConverterPage onBackToHub={() => updateSelection({ type: 'utility_hub', id: null })} />}
                    </>
                ) : (
                    <MainContent animationClass="animate-fade-in" pageTitle={selection.type === 'search' ? `SCANNING: "${selection.query}"` : 'INCOMING INTEL'} onSearch={(query: string) => updateSelection({ type: 'search', id: null, query })} feedsToDisplay={feeds} selection={selection} onSelectCategory={(cat) => updateSelection(cat ? { type: 'all', id: null, category: cat } : { type: 'all', id: null }, false)} readArticleIds={readArticleIds} bookmarkedArticleIds={bookmarkedArticleIds} articleTags={new Map()} onMarkAsRead={(id) => setReadArticleIds(prev => new Set(prev).add(id))} onPurgeBuffer={(ids) => setReadArticleIds(new Set([...Array.from(readArticleIds), ...ids]))} onMarkAsUnread={(id) => { const n = new Set(readArticleIds); n.delete(id); setReadArticleIds(n); }} onMarkMultipleAsRead={(ids) => setReadArticleIds(new Set([...Array.from(readArticleIds), ...ids]))} onToggleBookmark={(id) => { const n = new Set(bookmarkedArticleIds); if (n.has(id)) n.delete(id); else n.add(id); setBookmarkedArticleIds(n); }} onSetArticleTags={() => {}} onOpenReader={(a) => { setReaderArticle(a); window.history.pushState({ isReader: true }, ''); }} onOpenExternal={(url, id) => { setReadArticleIds(prev => new Set(prev).add(id)); window.open(url, '_blank', 'noopener,noreferrer'); }} allFeeds={feeds} onSetFeeds={setFeeds} onSetFolders={setFolders} refreshKey={lastRefresh} onRefresh={() => { setPrefetchedArticles([]); setLastRefresh(Date.now()); }} widgetSettings={widgetSettings} articleView={articleView} theme={theme} onToggleTheme={handleToggleTheme} onOpenSettings={() => setIsSettingsModalOpen(true)} onOpenAddSource={() => {}} onOpenSidebar={() => setIsSidebarOpen(true)} onAddSource={handleAddSource} initialArticles={prefetchedArticles} onSetSniffErrorModal={() => {}} onOpenSearchExplainer={() => {}} onOpenIntegrityBriefing={() => {}} ambientEnabled={ambientEnabled} onToggleAmbient={() => setAmbientEnabled(!ambientEnabled)} />
                )}
            </TerminalView>
            
            {!hideMenuTrigger && (
                <Sidebar feeds={feeds} folders={folders} selection={selection} onAddSource={handleAddSource} onRemoveFeed={(id) => setFeeds(feeds.filter(x => x.id !== id))} onSelect={updateSelection} onAddFolder={(n) => setFolders([...folders, {id: Date.now(), name: n}])} onRenameFolder={(id, n) => setFolders(folders.map(x => x.id === id ? {...x, name: n} : x))} onDeleteFolder={(id) => setFolders(folders.filter(x => x.id !== id))} onMoveFeedToFolder={(fid, foldId) => setFeeds(feeds.map(x => x.id === fid ? {...x, folderId: foldId} : x))} isSidebarOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onOpenSettings={() => setIsSettingsModalOpen(true)} />
            )}
            <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} settings={{ feeds, folders, theme, articleView, widgets: widgetSettings }} onUpdateSettings={(s) => { if(s.theme) setTheme(s.theme as Theme); if(s.articleView) setArticleView(s.articleView); }} onSelect={(s) => { updateSelection(s); setIsSettingsModalOpen(false); }} onAddFolder={(n) => setFolders([...folders, {id: Date.now(), name: n}])} onRenameFolder={(id, n) => setFolders(folders.map(x => x.id === id ? {...x, name: n} : x))} onDeleteFolder={(id) => setFolders(folders.filter(x => x.id !== id))} onRemoveFeed={(id) => setFeeds(feeds.filter(x => x.id !== id))} onImportOpml={(f, fld) => { setFeeds([...feeds, ...f.map(i => ({...i, id: Date.now() + Math.random()}))]); setFolders([...folders, ...fld]); }} onExportOpml={() => {}} onImportSettings={() => {}} onExportSettings={() => {}} onAddSource={handleAddSource} onEnterUtils={() => updateSelection({ type: 'utility_hub', id: null })} onResetFeeds={handleResetSystem} />
            {readerArticle && <ReaderViewModal article={readerArticle} onClose={() => setReaderArticle(null)} onMarkAsRead={(id) => setReadArticleIds(prev => new Set(prev).add(id))} onOpenExternal={(url) => window.open(url, '_blank')} />}
        </div>
    );
};

const GlobalNavLink: React.FC<{ active: boolean; onClick: () => void; label: string; icon: React.ReactNode }> = ({ active, onClick, label, icon }) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-1 md:gap-1.5 h-11 md:h-12 px-2 md:px-3 border-b-2 transition-all relative group shrink-0
            ${active ? 'border-pulse-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
    >
        <span className="scale-90 md:scale-100">{icon}</span>
        <span className="text-[8px] md:text-[9.5px] font-black tracking-widest uppercase">{label}</span>
    </button>
);

export default App;