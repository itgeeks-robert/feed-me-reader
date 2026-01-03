
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
import { GlobeAltIcon, RadioIcon, XIcon, ShieldCheckIcon, SearchIcon, BeakerIcon, SparklesIcon, ExclamationTriangleIcon } from '../components/icons';

export interface Folder { id: number; name: string; }
export interface Feed { id: number; url: string; title: string; iconUrl: string; folderId: number | null; sourceType?: SourceType; category?: string; }
export interface Article { id: string; title: string; link: string; source: string; publishedDate: Date | null; snippet: string; imageUrl: string | null; feedCategory?: string; }

export type SudokuDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert';
export interface SudokuStats { totalWins: number; lastDailyCompletionDate?: string; }
export interface SolitaireStats { gamesWon: number; currentStreak: number; }
export interface SolitaireSettings { drawThree: boolean; }

export type Theme = 'noir' | 'liquid-glass' | 'bento-grid' | 'brutalist' | 'claymorphism' | 'monochrome-zen' | 'y2k' | 'terminal';

export type Selection = { 
    type: 'splash' | 'all' | 'folder' | 'bookmarks' | 'search' | 'feed' | 'reddit' | 'game_hub' | 'daily_uplink' | 'grid_reset' | 'deep_sync' | 'signal_scrambler' | 'utility_hub' | 'signal_streamer' | 'transcoder' | 'base64_converter' | 'sudoku' | 'solitaire' | 'minesweeper' | 'tetris' | 'pool' | 'cipher_core' | 'void_runner' | 'synapse_link' | 'hangman' | 'neon_signal'; 
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

const FALLBACK_WORD = "FABLE";
const SECTOR_LIMIT = 7;

const TerminalView: React.FC<{ children: React.ReactNode; hasBottomNav?: boolean }> = ({ children, hasBottomNav }) => (
    <div className={`flex-1 flex flex-col min-w-0 relative h-full overflow-hidden ${hasBottomNav ? 'pb-16 md:pb-0' : ''}`}>
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
    
    const [uptime, setUptime] = useLocalStorage<number>(UPTIME_KEY, 25);

    const [selection, setSelection] = useLocalStorage<Selection>(SELECTION_KEY, { type: 'splash', id: null });

    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
    const [readerArticle, setReaderArticle] = useState<Article | null>(null);
    const [prefetchedArticles, setPrefetchedArticles] = useState<Article[]>([]);
    const [isDecoding, setIsDecoding] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(() => Date.now());

    const [outboundLink, setOutboundLink] = useState<{url: string, id: string} | null>(null);
    const [showSniffErrorModal, setShowSniffErrorModal] = useState(false);
    const [showSearchExplainer, setShowSearchExplainer] = useState(false);
    const [showIntegrityBriefing, setShowIntegrityBriefing] = useState(false);
    const [skipExternalWarning, setSkipExternalWarning] = useLocalStorage<boolean>('void_skip_external_warning', false);

    const [cipherData, setCipherData] = useState<{ archiveMap: { date: string; word: string; label: string }[]; isSynced: boolean; loading: boolean }>({
        archiveMap: [],
        isSynced: false,
        loading: true
    });

    const isGameActive = useMemo(() => {
        const gameTypes = ['sudoku', 'solitaire', 'minesweeper', 'tetris', 'pool', 'cipher_core', 'void_runner', 'synapse_link', 'grid_reset', 'hangman', 'neon_signal'];
        return gameTypes.includes(selection.type);
    }, [selection.type]);

    const isUtilityActive = useMemo(() => {
        const utilityTypes = ['signal_streamer', 'transcoder', 'base64_converter', 'deep_sync', 'signal_scrambler'];
        return utilityTypes.includes(selection.type);
    }, [selection.type]);

    const handleToggleTheme = useCallback(() => {
        const themes: Theme[] = ['noir', 'liquid-glass', 'bento-grid', 'brutalist', 'claymorphism', 'monochrome-zen', 'y2k', 'terminal'];
        const nextIndex = (themes.indexOf(theme) + 1) % themes.length;
        setTheme(themes[nextIndex]);
    }, [theme, setTheme]);

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
        } catch (e) { console.warn("Signal Leak in Startup Interceptor."); }

        const finalMap = Array.from({ length: SECTOR_LIMIT }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const iso = d.toISOString().split('T')[0];
            let word = results.get(iso) || FALLBACK_WORD;
            if (i === 0 && iso === '2026-01-01') word = "FABLE"; 
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
            const unique = Array.from(new Map(all.map(a => [a.id, a])).values());
            setPrefetchedArticles(unique);
        } catch (e) {
            console.warn("Background Decode Interrupted.");
        } finally {
            setIsDecoding(false);
        }
    }, [feeds]);

    useEffect(() => {
        prefetchCipherFrequency();
        if (selection.type === 'splash' && feeds.length > 0) {
            prefetchContentFrequencies();
        }
    }, [prefetchCipherFrequency, prefetchContentFrequencies, selection.type, feeds.length]);

    useEffect(() => {
        if (!window.history.state || !window.history.state.selection) {
            window.history.replaceState({ selection }, '');
        }
    }, []);

    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            if (event.state?.isReader) {
            } else if (event.state?.isOutbound || event.state?.isExplainer || event.state?.isIntegrity) {
            } else if (readerArticle) {
                setReaderArticle(null);
            } else if (outboundLink) {
                setOutboundLink(null);
            } else if (showSearchExplainer) {
                setShowSearchExplainer(false);
            } else if (showIntegrityBriefing) {
                setShowIntegrityBriefing(false);
            } 
            else if (event.state?.selection) {
                setSelection(event.state.selection);
            } else {
                setSelection({ type: 'splash', id: null });
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [readerArticle, outboundLink, showSearchExplainer, showIntegrityBriefing, setSelection]);

    useEffect(() => {
        const root = document.documentElement;
        // Strip previous theme classes
        root.className = Array.from(root.classList).filter(c => !c.startsWith('theme-')).join(' ');
        if (theme !== 'noir') {
            root.classList.add(`theme-${theme}`);
        }
    }, [theme]);

    const updateSelection = useCallback((newSel: Selection, replace: boolean = false) => {
        setSelection(newSel);
        if (replace) {
            window.history.replaceState({ selection: newSel }, '');
        } else {
            window.history.pushState({ selection: newSel }, '');
        }
    }, [setSelection]);

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

    const handleMarkAsRead = useCallback((id: string) => {
        setReadArticleIds(prev => {
            if (prev.has(id)) return prev;
            return new Set(prev).add(id);
        });
    }, [setReadArticleIds]);

    const openExternal = useCallback((url: string, id: string) => {
        if (skipExternalWarning) {
            handleMarkAsRead(id);
            window.open(url, '_blank', 'noopener,noreferrer');
        } else {
            setOutboundLink({ url, id });
            window.history.pushState({ isOutbound: true }, '');
        }
    }, [skipExternalWarning, handleMarkAsRead]);

    const confirmExternalLink = useCallback(() => {
        if (outboundLink) {
            handleMarkAsRead(outboundLink.id);
            window.open(outboundLink.url, '_blank', 'noopener,noreferrer');
            setOutboundLink(null);
            if (window.history.state?.isOutbound) {
                window.history.back();
            }
        }
    }, [outboundLink, handleMarkAsRead]);

    const toggleFavoriteGame = useCallback((id: string) => {
        setFavoriteGameIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, [setFavoriteGameIds]);

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
        return <SplashScreen onEnterFeeds={() => updateSelection({ type: 'all', id: null })} onEnterArcade={() => updateSelection({ type: 'game_hub', id: null })} isDecoding={isDecoding} />;
    }

    const hasBottomNav = !isGameActive && !isUtilityActive;

    return (
        <div className="h-screen w-full font-sans text-sm relative flex flex-col overflow-hidden bg-void-bg text-terminal transition-colors duration-300">
            <TerminalView hasBottomNav={hasBottomNav}>
                {selection.type === 'utility_hub' ? (
                    <UtilityHubPage 
                        onSelect={(id) => updateSelection({ type: id as any, id: null })} 
                        onBackToHub={() => updateSelection({ type: 'all', id: null })} 
                        theme={theme}
                        onToggleTheme={handleToggleTheme}
                    />
                ) : selection.type === 'signal_streamer' ? (
                    <SignalStreamerPage onBackToHub={() => updateSelection({ type: 'utility_hub', id: null })} />
                ) : selection.type === 'transcoder' ? (
                    <TranscoderPage onBackToHub={() => updateSelection({ type: 'utility_hub', id: null })} />
                ) : selection.type === 'base64_converter' ? (
                    <Base64ConverterPage onBackToHub={() => updateSelection({ type: 'utility_hub', id: null })} />
                ) : selection.type === 'deep_sync' ? (
                    <DeepSyncPage onBackToHub={() => updateSelection({ type: 'utility_hub', id: null })} />
                ) : selection.type === 'signal_scrambler' ? (
                    <SignalScramblerPage onBackToHub={() => updateSelection({ type: 'utility_hub', id: null })} />
                ) : selection.type === 'game_hub' ? (
                    <GameHubPage 
                        onSelect={(type: any) => updateSelection({ type, id: null })} 
                        onReturnToFeeds={() => updateSelection({ type: 'all', id: null })}
                        favoriteGameIds={favoriteGameIds}
                        onToggleFavorite={toggleFavoriteGame}
                        theme={theme}
                        onToggleTheme={handleToggleTheme}
                    />
                ) : isGameActive ? (
                    <>
                        {selection.type === 'neon_signal' ? (
                            <NeonSignalPage 
                                onBack={() => updateSelection({ type: 'game_hub', id: null })} 
                                onReturnToFeeds={() => updateSelection({ type: 'all', id: null })}
                            />
                        ) : (
                            <OrientationGuard portraitOnly>
                                {selection.type === 'sudoku' && <SudokuPage stats={{totalWins: 0}} onGameWin={() => {}} onGameLoss={() => {}} onBackToHub={() => updateSelection({ type: 'game_hub', id: null })} onReturnToFeeds={() => updateSelection({ type: 'all', id: null })} />}
                                {selection.type === 'solitaire' && <SolitairePage stats={{gamesWon: 0, currentStreak: 0}} onGameWin={() => {}} onGameStart={() => {}} settings={{drawThree: true}} onUpdateSettings={() => {}} onBackToHub={() => updateSelection({ type: 'game_hub', id: null })} onReturnToFeeds={() => updateSelection({ type: 'all', id: null })} />}
                                {selection.type === 'minesweeper' && <MinesweeperPage onBackToHub={() => updateSelection({ type: 'game_hub', id: null })} onReturnToFeeds={() => updateSelection({ type: 'all', id: null })} onDefuse={() => {}} />}
                                {selection.type === 'tetris' && <TetrisPage onBackToHub={() => updateSelection({ type: 'game_hub', id: null })} onReturnToFeeds={() => updateSelection({ type: 'all', id: null })} />}
                                {selection.type === 'pool' && <PoolGamePage onBackToHub={() => updateSelection({ type: 'game_hub', id: null })} onReturnToFeeds={() => updateSelection({ type: 'all', id: null })} />}
                                {selection.type === 'cipher_core' && (
                                    <CipherCorePage 
                                        onBackToHub={() => updateSelection({ type: 'game_hub', id: null })} 
                                        uptime={uptime} 
                                        setUptime={setUptime} 
                                        preloadedData={cipherData}
                                        onWin={() => {
                                            setUptime(prev => Math.min(100, prev + 15));
                                        }}
                                    />
                                )}
                                {selection.type === 'void_runner' && <VoidRunnerPage onBackToHub={() => updateSelection({ type: 'game_hub', id: null })} onReturnToFeeds={() => updateSelection({ type: 'all', id: null })} />}
                                {selection.type === 'synapse_link' && <SynapseLinkPage onBackToHub={() => updateSelection({ type: 'game_hub', id: null })} />}
                                {selection.type === 'grid_reset' && <GridResetPage onBackToHub={() => updateSelection({ type: 'game_hub', id: null })} />}
                                {selection.type === 'hangman' && <HangmanPage onBackToHub={() => updateSelection({ type: 'game_hub', id: null })} />}
                            </OrientationGuard>
                        )}
                    </>
                ) : (
                    <MainContent
                        key={selection.type + String(selection.id) + (selection.category || '')}
                        animationClass="animate-fade-in"
                        pageTitle={pageTitle}
                        onSearch={(query: string) => updateSelection({ type: 'search', id: null, query })}
                        feedsToDisplay={feeds}
                        selection={selection}
                        onSelectCategory={(cat) => updateSelection(cat ? { type: 'all', id: null, category: cat } : { type: 'all', id: null }, false)}
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
                        onToggleTheme={handleToggleTheme}
                        onOpenSettings={() => setIsSettingsModalOpen(true)}
                        onOpenAddSource={() => setIsAddSourceModalOpen(true)}
                        onAddSource={async (url, type) => { setFeeds([...feeds, { id: Date.now(), url, title: 'New Signal', iconUrl: '', folderId: null, sourceType: type }]); }}
                        onOpenSidebar={() => setIsSettingsModalOpen(true)}
                        initialArticles={prefetchedArticles}
                        onSetSniffErrorModal={setShowSniffErrorModal}
                        onOpenSearchExplainer={() => { setShowSearchExplainer(true); window.history.pushState({isExplainer: true}, ''); }}
                        onOpenIntegrityBriefing={() => { setShowIntegrityBriefing(true); window.history.pushState({isIntegrity: true}, ''); }}
                    />
                )}
            </TerminalView>
            
            {hasBottomNav && (
                <BottomNavBar selection={selection} onSelect={(s) => updateSelection(s)} onOpenSettings={() => setIsSettingsModalOpen(true)} />
            )}
            
            <SettingsModal 
                isOpen={isSettingsModalOpen} 
                onClose={() => setIsSettingsModalOpen(false)} 
                settings={{ feeds, folders, theme, articleView, widgets: widgetSettings }} 
                onUpdateSettings={(s) => { if(s.theme) setTheme(s.theme as Theme); if(s.articleView) setArticleView(s.articleView); }} 
                onSelect={(s) => { updateSelection(s); setIsSettingsModalOpen(false); }}
                onAddFolder={(n) => setFolders([...folders, {id: Date.now(), name: n}])}
                onRenameFolder={(id, n) => setFolders(folders.map(x => x.id === id ? {...x, name: n} : x))}
                onDeleteFolder={(id) => setFolders(folders.filter(x => x.id !== id))}
                onRemoveFeed={(id) => setFeeds(feeds.filter(x => x.id !== id))}
                onImportOpml={(f, fld) => { setFeeds([...feeds, ...f.map(i => ({...i, id: Date.now() + Math.random()}))]); setFolders([...folders, ...fld]); }}
                onExportOpml={() => {}} onImportSettings={() => {}} onExportSettings={() => {}}
                onAddSource={async (url, type) => { setFeeds([...feeds, { id: Date.now(), url, title: 'New Signal', iconUrl: '', folderId: null, sourceType: type }]); }}
                onEnterUtils={() => updateSelection({ type: 'utility_hub', id: null })}
            />
            
            {readerArticle && <ReaderViewModal article={readerArticle} onClose={closeReader} onMarkAsRead={handleMarkAsRead} onOpenExternal={openExternal} />}

            {outboundLink && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-6 font-mono animate-fade-in">
                    <div className="void-card w-full max-w-sm relative overflow-hidden flex flex-col p-8 text-center space-y-6">
                        <div className="mx-auto w-16 h-16 bg-pulse-500/10 rounded-full flex items-center justify-center border-2 border-pulse-500 animate-pulse">
                            <GlobeAltIcon className="w-8 h-8 text-pulse-500" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-black text-terminal italic uppercase tracking-tighter leading-none">External Frequency Drift</h3>
                            <p className="text-[9px] text-muted leading-relaxed uppercase tracking-widest italic px-4">
                                Operator, you are jumping to an <span className="text-pulse-500 font-black">external node</span>. System encryption cannot follow.
                            </p>
                        </div>
                        
                        <label className="flex items-center justify-center gap-3 cursor-pointer group pt-2">
                            <input type="checkbox" className="sr-only" checked={skipExternalWarning} onChange={(e) => setSkipExternalWarning(e.target.checked)} />
                            <div className={`w-4 h-4 border-2 flex-shrink-0 transition-colors ${skipExternalWarning ? 'bg-pulse-500 border-pulse-400' : 'bg-transparent border-zinc-700'}`} />
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted group-hover:text-terminal italic leading-none">Do not warn again</span>
                        </label>

                        <footer className="pt-4 flex gap-3">
                            <button onClick={() => setOutboundLink(null)} className="flex-1 py-3 bg-void-bg border border-void-border text-terminal text-[10px] font-black uppercase italic rounded-xl">ABORT</button>
                            <button onClick={confirmExternalLink} className="flex-1 py-3 bg-pulse-600 text-white text-[10px] font-black uppercase italic rounded-xl shadow-lg">LINK_ESTABLISH</button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
