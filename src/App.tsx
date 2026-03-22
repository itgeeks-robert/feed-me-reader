import React, { useState, useEffect, useCallback, useMemo, useLayoutEffect } from 'react';
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
import { TubePage } from '../components/TubePage';
import { resilientFetch } from '../services/fetch';
import { parseRssXml } from '../services/rssParser';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { GlobeAltIcon, RadioIcon, VoidIcon, CpuChipIcon, BoltIcon, PaletteIcon, ArrowPathIcon, PlayIcon } from '../components/icons';
import { soundService } from '../services/soundService';
import SettingsModal from '../components/SettingsModal';

export interface Folder { id: number; name: string; }
export interface Feed { id: number; url: string; title: string; iconUrl: string; folderId: number | null; sourceType?: SourceType; category?: string; }
export interface Article { id: string; title: string; link: string; source: string; publishedDate: Date | null; snippet: string; imageUrl: string | null; feedCategory?: string; }

export type SudokuDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert';
export interface SudokuStats { totalWins: number; }
export interface SolitaireStats { gamesWon: number; currentStreak: number; }
export interface SolitaireSettings { drawThree: boolean; }

export type Theme = 'noir' | 'liquid-glass' | 'bento-grid' | 'brutalist' | 'claymorphism' | 'monochrome-zen' | 'y2k' | 'terminal' | 'comic' | 'aurora' | 'retro' | 'refraction' | 'sleek';

export type Selection = { 
    type: 'splash' | 'all' | 'folder' | 'bookmarks' | 'search' | 'feed' | 'reddit' | 'game_hub' | 'daily_uplink' | 'grid_reset' | 'deep_sync' | 'signal_scrambler' | 'utility_hub' | 'signal_streamer' | 'surveillance_radar' | 'transcoder' | 'base64_converter' | 'sudoku' | 'solitaire' | 'minesweeper' | 'tetris' | 'pool' | 'cipher_core' | 'void_runner' | 'synapse_link' | 'hangman' | 'neon_signal' | 'tube'; 
    id: string | number | null; 
    query?: string;
    category?: string;
};
export type ArticleView = 'list' | 'grid' | 'featured';
export interface WidgetSettings { showWeather: boolean; showFinance: boolean; weatherLocation: string; }
export interface Settings { feeds: Feed[]; folders: Folder[]; theme: Theme; articleView: ArticleView; widgets: WidgetSettings; }

// FIX: Defined the missing GlobalNavLink component used in the header.
const GlobalNavLink: React.FC<{
    active: boolean;
    onClick: () => void;
    label: string;
    icon: React.ReactNode;
}> = ({ active, onClick, label, icon }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 relative transition-all duration-300 outline-none group focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-pulse-500 rounded-md
            ${active
                ? 'category-active-glow'
                : 'text-zinc-400 hover:text-white'}`}
    >
        <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
            {icon}
        </div>
        <span className="text-xs font-semibold tracking-wide hidden sm:inline">
            {label}
        </span>
    </button>
);

const GUEST_USER_ID = 'survivor';
const READ_ARTICLES_KEY = `void_read_articles_${GUEST_USER_ID}`;
const BOOKMARKED_ARTICLES_KEY = `void_bookmarked_articles_${GUEST_USER_ID}`;
const FEEDS_KEY = `void_feeds_${GUEST_USER_ID}`;
const FOLDERS_KEY = `void_folders_${GUEST_USER_ID}`;
const THEME_KEY = `void_theme_${GUEST_USER_ID}`;
const ARTICLE_VIEW_KEY = `void_article_view_${GUEST_USER_ID}`;
const WIDGET_SETTINGS_KEY = `void_widget_settings_${GUEST_USER_ID}`;
const UPTIME_KEY = `void_uptime_${GUEST_USER_ID}`;
const FAV_GAMES_KEY = `void_fav_games_${GUEST_USER_ID}`;
const AMBIENT_SOUND_KEY = `void_ambient_sound_${GUEST_USER_ID}`;
const TV_MODE_KEY = `void_tv_mode_${GUEST_USER_ID}`;

const FALLBACK_WORD = "FABLE";
const SECTOR_LIMIT = 7;

const App: React.FC = () => {
    const [theme, setTheme] = useLocalStorage<Theme>(THEME_KEY, 'noir');
    const [articleView, setArticleView] = useLocalStorage<ArticleView>(ARTICLE_VIEW_KEY, 'list');
    const [widgetSettings, setWidgetSettings] = useLocalStorage<WidgetSettings>(WIDGET_SETTINGS_KEY, { showWeather: true, showFinance: false, weatherLocation: 'London' });
    const [folders, setFolders] = useLocalStorage<Folder[]>(FOLDERS_KEY, []);
    const [feeds, setFeeds] = useLocalStorage<Feed[]>(FEEDS_KEY, []);
    const [readArticleIds, setReadArticleIds] = useLocalStorage<Set<string>>(READ_ARTICLES_KEY, () => new Set());
    const [bookmarkedArticleIds, setBookmarkedArticleIds] = useLocalStorage<Set<string>>(BOOKMARKED_ARTICLES_KEY, () => new Set());
    const [favoriteGameIds] = useLocalStorage<Set<string>>(FAV_GAMES_KEY, () => new Set());
    const [ambientEnabled, setAmbientEnabled] = useLocalStorage<boolean>(AMBIENT_SOUND_KEY, false);
    const [tvMode, setTvMode] = useLocalStorage<boolean>(TV_MODE_KEY, false);
    
    // Selection is no longer persisted to ensure splash screen is seen every session
    const [selection, setSelection] = useState<Selection>({ type: 'splash', id: null });

    // Auto-detect TV mode
    useEffect(() => {
        const ua = navigator.userAgent.toLowerCase();
        const isTv = ua.includes('google tv') || ua.includes('android tv') || ua.includes('smarttv') || ua.includes('appletv');
        if (isTv && !tvMode) {
            setTvMode(true);
        }
    }, [tvMode, setTvMode]);

    // Global focus listener to ensure focused elements are always visible
    useEffect(() => {
        const handleFocus = (e: FocusEvent) => {
            const target = e.target as HTMLElement;
            if (target && target.scrollIntoView) {
                target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            }
        };
        window.addEventListener('focus', handleFocus, true);
        return () => window.removeEventListener('focus', handleFocus, true);
    }, []);

    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [rotationState, setRotationState] = useState<'auto' | 'portrait' | 'landscape'>('auto');
    const [readerArticle, setReaderArticle] = useState<Article | null>(null);
    const [prefetchedArticles, setPrefetchedArticles] = useState<Article[]>([]);
    const [lastRefresh, setLastRefresh] = useState(() => Date.now());

    const [cipherData, setCipherData] = useState<{ archiveMap: { date: string; word: string; label: string }[]; isSynced: boolean; loading: boolean }>({
        archiveMap: [],
        isSynced: false,
        loading: true
    });

    const themeLabel = useMemo(() => {
        switch(theme) {
            case 'liquid-glass': return 'GLASS';
            case 'bento-grid': return 'BENTO';
            case 'monochrome-zen': return 'ZEN';
            case 'claymorphism': return 'CLAY';
            case 'brutalist': return 'BRUTAL';
            default: return theme.toUpperCase();
        }
    }, [theme]);

    const updateSelection = useCallback((newSel: Selection, replace: boolean = false) => {
        setSelection(newSel);
        if (replace) window.history.replaceState({ selection: newSel }, '');
        else window.history.pushState({ selection: newSel }, '');
        setIsSidebarOpen(false);
    }, [setSelection]);

    // --- REFINED SPATIAL NAVIGATION ENGINE (BALANCED ROW ROUTING) ---
    useEffect(() => {
        if (!tvMode) return;

        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            const activeElement = document.activeElement as HTMLElement;
            
            // Handle Back Button (Escape, Backspace, or Android Back)
            if (e.key === 'Escape' || e.key === 'Backspace') {
                // If we are in a sub-page, go back to main
                if (selection.type !== 'all' && selection.type !== 'splash') {
                    e.preventDefault();
                    updateSelection({ type: 'all', id: null });
                    soundService.playClick();
                    return;
                }
            }

            if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') {
                 if (e.key === 'Escape' || e.key === 'Enter') {
                     activeElement.blur();
                     soundService.playPop();
                 }
                 return; 
            }
            
            const key = e.key.toUpperCase();
            const directionMap: Record<string, string> = {
                'W': 'ArrowUp', 'S': 'ArrowDown', 'A': 'ArrowLeft', 'D': 'ArrowRight',
                'ARROWUP': 'ArrowUp', 'ARROWDOWN': 'ArrowDown', 'ARROWLEFT': 'ArrowLeft', 'ARROWRIGHT': 'ArrowRight'
            };

            const mappedKey = directionMap[key];
            if (!mappedKey) return;

            e.preventDefault();

            const current = document.activeElement as HTMLElement;
            const focusable = Array.from(document.querySelectorAll('button:not([disabled]), a, input, [tabindex="0"]')) as HTMLElement[];
            
            if (!current || current === document.body) {
                const first = focusable[0];
                if (first) first.focus();
                return;
            }

            const rect = current.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;

            let bestMatch: HTMLElement | null = null;
            let minScore = Infinity;

            focusable.forEach(candidate => {
                if (candidate === current) return;
                const cRect = candidate.getBoundingClientRect();
                const ccx = cRect.left + cRect.width / 2;
                const ccy = cRect.top + cRect.height / 2;

                const dx = ccx - cx;
                const dy = ccy - cy;

                let isValidDirection = false;
                // Use a small buffer to avoid floating point issues
                const buffer = 2;
                if (mappedKey === 'ArrowUp' && dy < -buffer) isValidDirection = true;
                if (mappedKey === 'ArrowDown' && dy > buffer) isValidDirection = true;
                if (mappedKey === 'ArrowLeft' && dx < -buffer) isValidDirection = true;
                if (mappedKey === 'ArrowRight' && dx > buffer) isValidDirection = true;

                if (isValidDirection) {
                    const isHorizontalMove = mappedKey === 'ArrowLeft' || mappedKey === 'ArrowRight';
                    const primaryDist = isHorizontalMove ? Math.abs(dx) : Math.abs(dy);
                    const secondaryDist = isHorizontalMove ? Math.abs(dy) : Math.abs(dx);
                    
                    // Heavily penalize elements that are not in the same row/column
                    // This makes navigation feel much more "grid-like"
                    const score = primaryDist + (secondaryDist * 12);

                    if (score < minScore) {
                        minScore = score;
                        bestMatch = candidate;
                    }
                }
            });

            if (bestMatch) {
                (bestMatch as HTMLElement).focus();
                (bestMatch as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                soundService.playPop();
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [tvMode, selection.type, isSettingsModalOpen, updateSelection]);

    useLayoutEffect(() => {
        if (selection.type === 'splash' || !tvMode) return;
        
        const timer = setTimeout(() => {
            const firstTarget = document.querySelector('.main-content-area button, .main-content-area [tabindex="0"]') as HTMLElement;
            if (firstTarget) {
                firstTarget.focus();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [selection.type, selection.category, tvMode]);

    useEffect(() => {
        const doc = document.documentElement;
        doc.setAttribute('data-tv-mode', tvMode.toString());
        
        const dataThemeMap: Record<Theme, string> = {
            'noir': 'noir', 'terminal': 'terminal', 'liquid-glass': 'sleek',
            'brutalist': 'brutalist', 'claymorphism': 'claymorphism',
            'monochrome-zen': 'monochrome-zen', 'y2k': 'y2k', 'bento-grid': 'bento',
            'comic': 'comic', 'aurora': 'aurora', 'retro': 'retro', 'refraction': 'refraction',
            'sleek': 'sleek'
        };
        doc.setAttribute('data-theme', dataThemeMap[theme] || 'noir');

        const themeClasses = ['theme-liquid-glass', 'theme-bento-grid', 'theme-brutalist', 'theme-claymorphism', 'theme-monochrome-zen', 'theme-y2k', 'theme-terminal', 'theme-comic', 'theme-aurora', 'theme-retro', 'theme-refraction'];
        themeClasses.forEach(c => doc.classList.remove(c));
        if (theme !== 'noir') doc.classList.add(`theme-${theme}`);

        soundService.setAmbient(ambientEnabled, theme);
    }, [ambientEnabled, theme, tvMode]);

    const isGameActive = useMemo(() => {
        const gameTypes = ['sudoku', 'solitaire', 'minesweeper', 'tetris', 'pool', 'cipher_core', 'void_runner', 'synapse_link', 'hangman', 'neon_signal'];
        return gameTypes.includes(selection.type);
    }, [selection.type]);

    const isUtilityActive = useMemo(() => {
        const utilTypes = ['utility_hub', 'signal_streamer', 'surveillance_radar', 'transcoder', 'base64_converter'];
        return utilTypes.includes(selection.type);
    }, [selection.type]);

    const handleToggleTheme = useCallback(() => {
        const themes: Theme[] = ['noir', 'liquid-glass', 'bento-grid', 'brutalist', 'claymorphism', 'monochrome-zen', 'y2k', 'terminal', 'comic', 'aurora', 'retro', 'refraction'];
        const nextIndex = (themes.indexOf(theme) + 1) % themes.length;
        setTheme(themes[nextIndex]);
        soundService.playClick();
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
        } catch (err) {
            console.error("Prefetch failed:", err);
        }
    }, [feeds]);

    useEffect(() => {
        prefetchCipherFrequency();
        if (selection.type === 'splash' && feeds.length > 0) prefetchContentFrequencies();
    }, [prefetchCipherFrequency, prefetchContentFrequencies, selection.type, feeds.length]);

    useEffect(() => {
        // Ensure we start with unlocked orientation to follow device settings
        if ((window as any).AndroidInterface) {
            (window as any).AndroidInterface.unlockOrientation();
        } else if (window.screen && window.screen.orientation) {
            try {
                (window.screen.orientation as any).unlock();
            } catch (e) {}
        }
    }, []);

    const handleForceRotation = async () => {
        try {
            const nextState = rotationState === 'auto' ? 'portrait' : rotationState === 'portrait' ? 'landscape' : 'auto';
            setRotationState(nextState);

            // Try Android WebView interface first
            if ((window as any).AndroidInterface) {
                if (nextState === 'portrait') {
                    (window as any).AndroidInterface.forcePortrait();
                } else if (nextState === 'landscape') {
                    (window as any).AndroidInterface.forceLandscape();
                } else {
                    (window as any).AndroidInterface.unlockOrientation();
                }
                return;
            }

            // Fallback to Web API
            if (nextState === 'auto') {
                if (window.screen && window.screen.orientation) {
                    await window.screen.orientation.unlock();
                }
                if (document.fullscreenElement) {
                    await document.exitFullscreen();
                }
                return;
            }

            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            }
            if (window.screen && window.screen.orientation) {
                await (window.screen.orientation as any).lock(nextState);
            }
        } catch (err) {
            console.error("Failed to change rotation:", err);
        }
    };

    if (selection.type === 'splash') {
        return <SplashScreen theme={theme} onEnterFeeds={() => updateSelection({ type: 'all', id: null })} onEnterArcade={() => updateSelection({ type: 'game_hub', id: null })} onEnterTube={() => updateSelection({ type: 'tube', id: null })} onToggleTheme={handleToggleTheme} />;
    }

    return (
        <div className="h-screen w-full font-sans text-sm relative flex flex-col overflow-hidden bg-app-bg text-app-text transition-colors duration-300">
            <div className="safe-container">
                <header className="relative z-[60] bg-app-card border-b border-app-border shrink-0 rounded-t-xl overflow-hidden">
                    <div className="min-h-[2.75rem] md:min-h-[3rem] py-2 flex items-center justify-between px-4 md:px-8 flex-wrap gap-2">
                        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                            <button 
                                onClick={() => updateSelection({ type: 'all', id: null })} 
                                className={`flex items-center gap-1.5 shrink-0 pr-2 border-r border-app-border cursor-pointer transition-transform outline-none group relative py-1 ${selection.type === 'all' ? 'category-active-glow' : ''}`}
                            >
                                <VoidIcon className="w-4 h-4 md:w-5 md:h-5 transition-all" />
                                <span className="text-xs font-bold text-app-text hidden sm:inline uppercase group-focus:scale-110 transition-all">Void</span>
                            </button>
                            <nav className="flex h-full items-center gap-1 md:gap-2">
                                <GlobalNavLink active={selection.type === 'game_hub'} onClick={() => updateSelection({ type: 'game_hub', id: null })} label="ARCADE" icon={<RadioIcon className="w-3.5 h-3.5"/>} />
                                <GlobalNavLink active={selection.type === 'tube'} onClick={() => updateSelection({ type: 'tube', id: null })} label="VOIDTUBE" icon={<PlayIcon className="w-3.5 h-3.5"/>} />
                                <GlobalNavLink active={selection.type === 'all' && !selection.category} onClick={() => updateSelection({ type: 'all', id: null })} label="INTEL" icon={<GlobeAltIcon className="w-3.5 h-3.5"/>} />
                                <GlobalNavLink active={isUtilityActive} onClick={() => updateSelection({ type: 'utility_hub', id: null })} label="UTIL" icon={<BoltIcon className="w-3.5 h-3.5"/>} />
                                <GlobalNavLink active={isSettingsModalOpen} onClick={() => setIsSettingsModalOpen(true)} label="CORE" icon={<CpuChipIcon className="w-3.5 h-3.5"/>} />
                            </nav>
                        </div>
                        <div className="flex items-center gap-2 md:gap-4 shrink-0">
                            <button 
                                onClick={handleForceRotation}
                                className={`flex items-center gap-2 px-3 py-1.5 bg-app-card border rounded-lg text-xs font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-app-accent ${rotationState !== 'auto' ? 'border-app-accent text-app-accent' : 'border-app-border text-muted hover:text-app-text hover:bg-app-border/50'}`}
                                title={`Rotation: ${rotationState.toUpperCase()}`}
                            >
                                <ArrowPathIcon className={`w-4 h-4 ${rotationState !== 'auto' ? 'animate-spin-slow' : ''}`}/>
                                <span className="hidden md:inline">{rotationState.toUpperCase()}</span>
                            </button>
                            <button 
                                onClick={handleToggleTheme}
                                className="flex items-center gap-2 px-3 py-1.5 bg-app-card border border-app-border rounded-lg text-xs font-medium text-muted hover:text-app-text hover:bg-app-border/50 transition-all outline-none focus-visible:ring-2 focus-visible:ring-app-accent"
                            >
                                <PaletteIcon className="w-4 h-4"/>
                                <span className="capitalize">{theme}</span>
                            </button>
                        </div>
                    </div>
                </header>
                
                <div className="flex-1 flex min-h-0 relative bg-app-card/30 rounded-b-xl border-x border-b border-app-border overflow-hidden">
                    <Sidebar 
                        feeds={feeds}
                        folders={folders}
                        selection={selection}
                        onSelect={(sel) => updateSelection(sel)}
                        onAddSource={handleAddSource}
                        onRemoveFeed={() => {}}
                        onAddFolder={() => {}}
                        onRenameFolder={() => {}}
                        onDeleteFolder={() => {}}
                        onMoveFeedToFolder={() => {}}
                        isSidebarOpen={isSidebarOpen}
                        onClose={() => setIsSidebarOpen(false)}
                        onOpenSettings={() => setIsSettingsModalOpen(true)}
                    />
                    
                    {selection.type === 'tube' ? <TubePage onReturnToFeeds={() => updateSelection({type: 'all', id: null})} /> :
                    selection.type === 'game_hub' ? <GameHubPage onSelect={(id: any) => updateSelection({ type: id, id })} favoriteGameIds={favoriteGameIds} onToggleFavorite={() => {}} theme={theme} onToggleTheme={handleToggleTheme} onReturnToFeeds={() => updateSelection({type: 'all', id: null})} /> :
                    selection.type === 'utility_hub' ? <UtilityHubPage onSelect={(id: any) => updateSelection({type: id, id})} onBackToHub={() => updateSelection({ type: 'all', id: null })} theme={theme} onToggleTheme={handleToggleTheme} /> :
                    selection.type === 'signal_streamer' ? <SignalStreamerPage onBackToHub={() => updateSelection({ type: 'utility_hub', id: null })} /> :
                    selection.type === 'surveillance_radar' ? <SurveillanceRadarPage onBackToHub={() => updateSelection({ type: 'utility_hub', id: null })} /> :
                    selection.type === 'transcoder' ? <TranscoderPage onBackToHub={() => updateSelection({ type: 'utility_hub', id: null })} /> :
                    selection.type === 'base64_converter' ? <Base64ConverterPage onBackToHub={() => updateSelection({ type: 'utility_hub', id: null })} /> :
                    selection.type === 'sudoku' ? <SudokuPage stats={{totalWins: 0}} onGameWin={() => {}} onGameLoss={() => {}} onBackToHub={() => updateSelection({ type: 'game_hub', id: null })} onReturnToFeeds={() => updateSelection({type: 'all', id: null})} /> :
                    selection.type === 'solitaire' ? <SolitairePage stats={{gamesWon: 0, currentStreak: 0}} onGameWin={() => {}} onGameStart={() => {}} settings={{drawThree: true}} onUpdateSettings={() => {}} onBackToHub={() => updateSelection({ type: 'game_hub', id: null })} onReturnToFeeds={() => updateSelection({type: 'all', id: null})} /> :
                    selection.type === 'minesweeper' ? <MinesweeperPage onBackToHub={() => updateSelection({ type: 'game_hub', id: null })} onReturnToFeeds={() => updateSelection({type: 'all', id: null})} /> :
                    selection.type === 'tetris' ? <TetrisPage onBackToHub={() => updateSelection({ type: 'game_hub', id: null })} onReturnToFeeds={() => updateSelection({type: 'all', id: null})} /> :
                    selection.type === 'pool' ? <PoolGamePage onBackToHub={() => updateSelection({ type: 'game_hub', id: null })} onReturnToFeeds={() => updateSelection({type: 'all', id: null})} /> :
                    selection.type === 'cipher_core' ? <CipherCorePage onBackToHub={() => updateSelection({ type: 'game_hub', id: null })} preloadedData={cipherData} /> :
                    selection.type === 'void_runner' ? <VoidRunnerPage onBackToHub={() => updateSelection({ type: 'game_hub', id: null })} onReturnToFeeds={() => updateSelection({type: 'all', id: null})} /> :
                    selection.type === 'synapse_link' ? <SynapseLinkPage onBackToHub={() => updateSelection({ type: 'game_hub', id: null })} /> :
                    selection.type === 'grid_reset' ? <GridResetPage onBackToHub={() => updateSelection({ type: 'game_hub', id: null })} /> :
                    selection.type === 'hangman' ? <HangmanPage onBackToHub={() => updateSelection({ type: 'game_hub', id: null })} /> :
                    selection.type === 'neon_signal' ? <NeonSignalPage onBack={() => updateSelection({ type: 'game_hub', id: null })} onReturnToFeeds={() => updateSelection({type: 'all', id: null})} /> :
                    (
                        <MainContent 
                            feedsToDisplay={feeds} 
                            selection={selection} 
                            onSelectCategory={(cat: string | null) => updateSelection({ ...selection, category: cat || undefined })}
                            readArticleIds={readArticleIds}
                            bookmarkedArticleIds={bookmarkedArticleIds}
                            articleTags={new Map()}
                            onMarkAsRead={(id: string) => setReadArticleIds(prev => new Set(prev).add(id))}
                            onMarkAsUnread={() => {}}
                            onMarkMultipleAsRead={() => {}}
                            onPurgeBuffer={() => {}}
                            onToggleBookmark={(id: string) => setBookmarkedArticleIds(prev => {
                                const next = new Set(prev);
                                if (next.has(id)) next.delete(id); else next.add(id);
                                return next;
                            })}
                            onSetArticleTags={() => {}}
                            onSearch={(query: string) => updateSelection({ type: 'search', id: null, query })}
                            onOpenReader={(article: Article) => setReaderArticle(article)}
                            onOpenExternal={(url: string, id: string) => { window.open(url, '_blank'); setReadArticleIds(prev => new Set(prev).add(id)); }}
                            allFeeds={feeds}
                            onSetFeeds={setFeeds}
                            onSetFolders={setFolders}
                            refreshKey={lastRefresh}
                            onRefresh={() => setLastRefresh(Date.now())}
                            widgetSettings={widgetSettings}
                            articleView={articleView}
                            theme={theme}
                            onToggleTheme={handleToggleTheme}
                            onOpenSettings={() => {}}
                            onOpenAddSource={() => {}}
                            onOpenSidebar={() => setIsSidebarOpen(true)}
                            onAddSource={handleAddSource}
                            animationClass="animate-fade-in"
                            pageTitle="Signals"
                            initialArticles={prefetchedArticles}
                            onSetSniffErrorModal={() => {}}
                            ambientEnabled={ambientEnabled}
                            onToggleAmbient={() => setAmbientEnabled(!ambientEnabled)}
                            tvMode={tvMode}
                        />
                    )}
                </div>
            </div>

            {readerArticle && (
                <ReaderViewModal 
                    article={readerArticle}
                    onClose={() => setReaderArticle(null)}
                    onMarkAsRead={(id: string) => setReadArticleIds(prev => new Set(prev).add(id))}
                    onOpenExternal={(url: string, id: string) => { window.open(url, '_blank'); setReadArticleIds(prev => new Set(prev).add(id)); }}
                />
            )}

            <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                settings={{ feeds, folders, theme, articleView, widgets: widgetSettings }}
                onUpdateSettings={(newSettings: any) => {
                    if (newSettings.theme) setTheme(newSettings.theme);
                    if (newSettings.articleView) setArticleView(newSettings.articleView);
                    if (newSettings.widgets) setWidgetSettings(newSettings.widgets);
                }}
                onSelect={(sel) => updateSelection(sel)}
                onAddFolder={(name: string) => setFolders(f => [...f, { id: Date.now(), name }])}
                onRenameFolder={(id: number, name: string) => setFolders(f => f.map(fld => fld.id === id ? { ...fld, name } : fld))}
                onDeleteFolder={(id: number) => setFolders(f => f.filter(fld => fld.id !== id))}
                onRemoveFeed={(id: number) => setFeeds(f => f.filter(feed => feed.id !== id))}
                onImportOpml={() => {}}
                onExportOpml={() => {}}
                onImportSettings={() => {}}
                onExportSettings={() => {}}
                onAddSource={handleAddSource}
                onEnterUtils={() => updateSelection({ type: 'utility_hub', id: null })}
                onResetFeeds={handleResetSystem}
            />
        </div>
    );
};

// FIX: Added default export for the App component.
export default App;
