
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
const SELECTION_KEY = `void_selection_${GUEST_USER_ID}`;

const TerminalView: React.FC<{ children: React.ReactNode; hasBottomNav?: boolean }> = ({ children, hasBottomNav }) => (
    <div className={`flex-1 flex flex-col min-w-0 relative h-full overflow-hidden ${hasBottomNav ? 'pb-16 md:pb-0' : ''}`}>
        {children}
    </div>
);

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

    const [selection, setSelection] = useLocalStorage<Selection>(SELECTION_KEY, { type: 'splash', id: null });

    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
    const [isShopOpen, setIsShopOpen] = useState(false);
    const [readerArticle, setReaderArticle] = useState<Article | null>(null);
    const [prefetchedArticles, setPrefetchedArticles] = useState<Article[]>([]);
    const [isDecoding, setIsDecoding] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(() => Date.now());

    const [outboundLink, setOutboundLink] = useState<{url: string, id: string} | null>(null);
    const [showSniffErrorModal, setShowSniffErrorModal] = useState(false);
    const [showSearchExplainer, setShowSearchExplainer] = useState(false);
    const [showIntegrityBriefing, setShowIntegrityBriefing] = useState(false);
    const [skipExternalWarning, setSkipExternalWarning] = useLocalStorage<boolean>('void_skip_external_warning', false);
    const [skipSearchExplainer, setSkipSearchExplainer] = useLocalStorage<boolean>('void_skip_search_explainer', false);
    const [skipIntegrityBriefing, setSkipIntegrityBriefing] = useLocalStorage<boolean>('void_skip_integrity_briefing', false);

    const isGameActive = useMemo(() => {
        const gameTypes = ['sudoku', 'solitaire', 'minesweeper', 'tetris', 'pool', 'cipher_core', 'void_runner', 'synapse_link', 'grid_reset', 'hangman'];
        return gameTypes.includes(selection.type);
    }, [selection.type]);

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

    const openExternal = useCallback((url: string, id: string) => {
        if (skipExternalWarning) {
            if (!readArticleIds.has(id)) {
                setReadArticleIds(prev => new Set(prev).add(id));
                setCredits(c => c + 10);
            }
            window.open(url, '_blank', 'noopener,noreferrer');
        } else {
            setOutboundLink({ url, id });
            window.history.pushState({ isOutbound: true }, '');
        }
    }, [skipExternalWarning, readArticleIds, setReadArticleIds, setCredits]);

    const closeExternalWarning = useCallback(() => {
        setOutboundLink(null);
        if (window.history.state?.isOutbound) {
            window.history.back();
        }
    }, []);

    const confirmExternalLink = useCallback(() => {
        if (outboundLink) {
            // FIX: logic for marking as read and awarding credits upon confirmation of an external signal jump.
            if (!readArticleIds.has(outboundLink.id)) {
                setReadArticleIds(prev => new Set(prev).add(outboundLink.id));
                setCredits(c => c + 10);
            }
            window.open(outboundLink.url, '_blank', 'noopener,noreferrer');
            closeExternalWarning();
        }
    }, [outboundLink, readArticleIds, setReadArticleIds, setCredits, closeExternalWarning]);

    const currentFeed = useMemo(() => {
        if (selection.type === 'feed' || selection.type === 'reddit') {
            return feeds.find(f => f.id === selection.id);
        }
        return null;
    }, [selection, feeds]);

    const pageTitle = useMemo(() => {
        if (selection.type === 'splash') return 'THE VOID';
        if (selection.type === 'all') return 'INCOMING INTEL';
        if (selection.type === 'bookmarks') return 'SAVED SIGNALS';
        if (selection.type === 'search') return `SEARCH: ${selection.query}`;
        if (selection.type === 'folder') return folders.find(f => f.id === selection.id)?.name || 'ZONE';
        if (selection.type === 'game_hub') return 'THE ARCADE';
        if (selection.type === 'utility_hub') return 'TACTICAL HUB';
        if (currentFeed) return currentFeed.title;
        return 'THE VOID';
    }, [selection, folders, currentFeed]);

    if (selection.type === 'splash') {
        return (
            <div className={theme === 'dark' ? 'dark' : ''}>
                <SplashScreen 
                    onEnterFeeds={() => updateSelection({ type: 'all', id: null })}
                    onEnterArcade={() => updateSelection({ type: 'game_hub', id: null })}
                    isDecoding={isDecoding}
                />
            </div>
        );
    }

    return (
        <div className={theme === 'dark' ? 'dark' : ''}>
            <div className="flex flex-col h-screen bg-void-950 text-white overflow-hidden">
                <OrientationGuard portraitOnly={isGameActive}>
                    <TerminalView hasBottomNav={!isGameActive}>
                        {selection.type === 'game_hub' && (
                            <GameHubPage 
                                credits={credits} 
                                setShowShop={setIsShopOpen} 
                                onSelect={(gameId: any) => updateSelection({ type: gameId, id: null })}
                                onReturnToFeeds={() => updateSelection({ type: 'all', id: null })}
                            />
                        )}
                        {selection.type === 'sudoku' && (
                            <SudokuPage 
                                stats={{ totalWins: 0 }}
                                onGameWin={() => setCredits(c => c + 50)}
                                onGameLoss={() => {}}
                                onBackToHub={() => updateSelection({ type: 'game_hub', id: null })}
                                onReturnToFeeds={() => updateSelection({ type: 'all', id: null })}
                            />
                        )}
                        {selection.type === 'solitaire' && (
                            <SolitairePage 
                                stats={{ gamesWon: 0, currentStreak: 0 }}
                                onGameWin={() => setCredits(c => c + 50)}
                                onGameStart={() => {}}
                                onBackToHub={() => updateSelection({ type: 'game_hub', id: null })}
                                onReturnToFeeds={() => updateSelection({ type: 'all', id: null })}
                                settings={{ drawThree: false }}
                                onUpdateSettings={() => {}}
                            />
                        )}
                        {selection.type === 'minesweeper' && (
                            <MinesweeperPage 
                                onBackToHub={() => updateSelection({ type: 'game_hub', id: null })}
                                onReturnToFeeds={() => updateSelection({ type: 'all', id: null })}
                                onDefuse={() => setCredits(c => c + 50)}
                            />
                        )}
                        {selection.type === 'tetris' && (
                            <TetrisPage 
                                onBackToHub={() => updateSelection({ type: 'game_hub', id: null })}
                                onReturnToFeeds={() => updateSelection({ type: 'all', id: null })}
                            />
                        )}
                        {selection.type === 'pool' && (
                            <PoolGamePage 
                                onBackToHub={() => updateSelection({ type: 'game_hub', id: null })}
                                onReturnToFeeds={() => updateSelection({ type: 'all', id: null })}
                            />
                        )}
                        {selection.type === 'cipher_core' && (
                            <CipherCorePage 
                                onBackToHub={() => updateSelection({ type: 'game_hub', id: null })}
                            />
                        )}
                        {selection.type === 'void_runner' && (
                            <VoidRunnerPage 
                                onBackToHub={() => updateSelection({ type: 'game_hub', id: null })}
                                onReturnToFeeds={() => updateSelection({ type: 'all', id: null })}
                            />
                        )}
                        {selection.type === 'synapse_link' && (
                            <SynapseLinkPage 
                                onBackToHub={() => updateSelection({ type: 'game_hub', id: null })}
                            />
                        )}
                        {selection.type === 'grid_reset' && (
                            <GridResetPage 
                                onBackToHub={() => updateSelection({ type: 'game_hub', id: null })}
                            />
                        )}
                        {selection.type === 'hangman' && (
                            <HangmanPage 
                                onBackToHub={() => updateSelection({ type: 'game_hub', id: null })}
                            />
                        )}

                        {(selection.type === 'all' || selection.type === 'folder' || selection.type === 'bookmarks' || selection.type === 'search' || selection.type === 'feed') && (
                            <MainContent 
                                selection={selection}
                                feedsToDisplay={feeds}
                                allFeeds={feeds}
                                readArticleIds={readArticleIds}
                                bookmarkedArticleIds={bookmarkedArticleIds}
                                articleTags={new Map()}
                                onMarkAsRead={(id) => setReadArticleIds(prev => new Set(prev).add(id))}
                                onMarkAsUnread={(id) => {
                                    const next = new Set(readArticleIds);
                                    next.delete(id);
                                    setReadArticleIds(next);
                                }}
                                onPurgeBuffer={(ids) => setReadArticleIds(prev => new Set([...prev, ...ids]))}
                                onMarkMultipleAsRead={(ids) => setReadArticleIds(prev => new Set([...prev, ...ids]))}
                                onToggleBookmark={(id) => {
                                    const next = new Set(bookmarkedArticleIds);
                                    if (next.has(id)) next.delete(id); else next.add(id);
                                    setBookmarkedArticleIds(next);
                                }}
                                onSetArticleTags={() => {}}
                                onSearch={(q) => updateSelection({ type: 'search', id: null, query: q })}
                                onOpenReader={openReader}
                                onOpenExternal={openExternal}
                                refreshKey={lastRefresh}
                                onRefresh={() => setLastRefresh(Date.now())}
                                onSelectCategory={(cat) => updateSelection({ ...selection, category: cat || undefined })}
                                theme={theme}
                                onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                animationClass="animate-fade-in"
                                pageTitle={pageTitle}
                                uptime={uptime}
                                onOpenSidebar={() => {}}
                                onOpenSettings={() => setIsSettingsModalOpen(true)}
                                onOpenAddSource={() => setIsAddSourceModalOpen(true)}
                                onAddSource={async (url, type) => {
                                    setFeeds([...feeds, { id: Date.now(), url, title: 'New Signal', iconUrl: '', folderId: null, sourceType: type }]);
                                }}
                                onSetFeeds={setFeeds}
                                onSetFolders={setFolders}
                                widgetSettings={widgetSettings}
                                articleView={articleView}
                                onSetSniffErrorModal={setShowSniffErrorModal}
                            />
                        )}
                        
                        {selection.type === 'utility_hub' && (
                            <UtilityHubPage onSelect={(id) => updateSelection({ type: id as any, id: null })} onBackToHub={() => updateSelection({ type: 'all', id: null })} />
                        )}
                        {selection.type === 'signal_streamer' && <SignalStreamerPage onBackToHub={() => updateSelection({ type: 'utility_hub', id: null })} />}
                        {selection.type === 'transcoder' && <TranscoderPage onBackToHub={() => updateSelection({ type: 'utility_hub', id: null })} />}
                        {selection.type === 'deep_sync' && <DeepSyncPage onBackToHub={() => updateSelection({ type: 'utility_hub', id: null })} />}
                    </TerminalView>

                    {!isGameActive && (
                        <BottomNavBar 
                            selection={selection} 
                            onSelect={updateSelection} 
                            onOpenSettings={() => setIsSettingsModalOpen(true)} 
                        />
                    )}
                </OrientationGuard>

                <SettingsModal 
                    isOpen={isSettingsModalOpen} 
                    onClose={() => setIsSettingsModalOpen(false)} 
                    settings={{ feeds, folders, theme, articleView, widgets: widgetSettings }}
                    onUpdateSettings={(s) => {
                        if (s.theme) setTheme(s.theme);
                        if (s.articleView) setArticleView(s.articleView);
                        if (s.widgets) setWidgetSettings(s.widgets);
                    }}
                    onSelect={updateSelection}
                    onAddFolder={(n) => setFolders([...folders, { id: Date.now(), name: n }])}
                    onRenameFolder={(id, n) => setFolders(folders.map(f => f.id === id ? { ...f, name: n } : f))}
                    onDeleteFolder={(id) => setFolders(folders.filter(f => f.id !== id))}
                    onRemoveFeed={(id) => setFeeds(feeds.filter(f => f.id !== id))}
                    onImportOpml={(f, fld) => { 
                        const newFeeds = f.map(i => ({ ...i, id: Math.random() + Date.now() }));
                        setFeeds([...feeds, ...newFeeds]); 
                        setFolders([...folders, ...fld]); 
                    }}
                    onExportOpml={() => {}}
                    onImportSettings={() => {}}
                    onExportSettings={() => {}}
                    credits={credits}
                    onOpenShop={() => setIsShopOpen(true)}
                    onAddSource={async (url, type) => {
                        setFeeds([...feeds, { id: Date.now(), url, title: 'New Signal', iconUrl: '', folderId: null, sourceType: type }]);
                    }}
                    onEnterUtils={() => updateSelection({ type: 'utility_hub', id: null })}
                />

                <AddSourceModal 
                    isOpen={isAddSourceModalOpen} 
                    onClose={() => setIsAddSourceModalOpen(false)}
                    onAddSource={async (url, type) => {
                        setFeeds([...feeds, { id: Date.now(), url, title: 'New Signal', iconUrl: '', folderId: null, sourceType: type }]);
                    }}
                />

                <BlackMarket 
                    isOpen={isShopOpen} 
                    onClose={() => setIsShopOpen(false)} 
                    credits={credits} 
                    setCredits={setCredits} 
                    uptime={uptime} 
                    setUptime={setUptime} 
                />

                {readerArticle && (
                    <ReaderViewModal 
                        article={readerArticle} 
                        onClose={closeReader} 
                        onMarkAsRead={(id) => setReadArticleIds(prev => new Set(prev).add(id))} 
                    />
                )}
            </div>
        </div>
    );
};

// FIX: Added default export for the App component.
export default App;
