import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import MainContent from '../components/MainContent';
import Sidebar from '../components/Sidebar';
import { 
  GameHubPage,
  SudokuPage,
  SolitairePage,
  MinesweeperPage,
  PoolGamePage,
  TetrisPage,
  CipherCorePage,
  VoidRunnerPage,
  SynapseLinkPage,
  GridResetPage,
  HangmanPage,
  NeonSignalPage
} from '../components/GamePages';
import ReaderViewModal from '../components/ReaderViewModal';
import SplashScreen from '../components/SplashScreen';
import { 
  UtilityHubPage,
  SignalStreamerPage, 
  SurveillanceRadarPage, 
  TranscoderPage, 
  Base64ConverterPage,
  DeepSyncPage,
  SignalScramblerPage
} from '../components/UtilityPages';
import { TubePage } from '../components/TubePage';
import { resilientFetch } from '../services/fetch';
import { parseRssXml } from '../services/rssParser';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useServiceWorker } from '../hooks/useServiceWorker';
import { useToast, GlobalStatusWidgets, type SourceType } from '../components/SharedUI';
import {
  GlobeAltIcon,
  RadioIcon,
  CpuChipIcon,
  BoltIcon,
  PlayIcon,
} from '../components/icons';
import { soundService } from '../services/soundService';
import SettingsModal from '../components/SettingsModal';

/* ─────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────── */
export interface Folder  { id: number; name: string; }
export interface Feed    { id: number; url: string; title: string; iconUrl: string; folderId: number | null; sourceType?: SourceType; category?: string; }
export interface Article { id: string; title: string; link: string; source: string; publishedDate: Date | null; snippet: string; imageUrl: string | null; feedCategory?: string; }

export type SudokuDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert';
export interface SudokuStats   { totalWins: number; }
export interface SolitaireStats { gamesWon: number; currentStreak: number; }
export interface SolitaireSettings { drawThree: boolean; }

/**
 * VOID DESIGN SYSTEM v3 — 3 polished modes.
 * Swap at runtime: document.documentElement.setAttribute('data-mode', mode)
 */
export type Mode = 'noir' | 'glass' | 'terminal' | 'horizon';
export type Theme = Mode;

export type SelectionType =
  | 'splash' | 'all' | 'folder' | 'bookmarks' | 'search' | 'feed'
  | 'game_hub' | 'utility_hub' | 'tube'
  | 'signal_streamer' | 'surveillance_radar' | 'transcoder' | 'base64_converter'
  | 'sudoku' | 'solitaire' | 'minesweeper' | 'tetris' | 'pool'
  | 'cipher_core' | 'void_runner' | 'synapse_link' | 'grid_reset'
  | 'hangman' | 'neon_signal' | 'deep_sync'
  | 'signal_scrambler' | 'reddit';

export type Selection = {
  type: SelectionType;
  id: string | number | null;
  query?: string;
  category?: string;
};

export type ArticleView = 'list' | 'grid' | 'featured';
export interface WidgetSettings { showWeather: boolean; showFinance: boolean; weatherLocation: string; }
export interface Settings { feeds: Feed[]; folders: Folder[]; theme: Mode; articleView: ArticleView; widgets: WidgetSettings; }

/* ─────────────────────────────────────────────────
   STORAGE KEYS
───────────────────────────────────────────────── */
const UID = 'survivor';
const KEY = (k: string) => `void_${k}_${UID}`;

const FALLBACK_WORD = 'FABLE';
const SECTOR_LIMIT  = 7;

/* ─────────────────────────────────────────────────
   GLOBAL NAV LINK — pill-style, accent on active
───────────────────────────────────────────────── */
const NavLink: React.FC<{
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}> = ({ active, onClick, label, icon }) => (
  <button
    onClick={onClick}
    className={`void-nav-item ${active ? 'active' : ''}`}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

/* ─────────────────────────────────────────────────
   MODE META — label + icon colour per mode
───────────────────────────────────────────────── */
const MODES: Mode[] = ['noir', 'glass', 'terminal', 'horizon'];
const MODE_LABEL: Record<Mode, string> = {
  noir:     'NOIR',
  glass:    'GLASS',
  terminal: 'TERM',
  horizon:  'HORIZ',
};

/* ─────────────────────────────────────────────────
   APP
───────────────────────────────────────────────── */
const App: React.FC = () => {
  /* ── Persistent state ── */
  const [mode,           setMode]           = useLocalStorage<Mode>(KEY('mode'), 'noir');
  const [articleView,    setArticleView]    = useLocalStorage<ArticleView>(KEY('article_view'), 'list');
  const [widgetSettings, setWidgetSettings] = useLocalStorage<WidgetSettings>(KEY('widgets'), { showWeather: true, showFinance: false, weatherLocation: 'London' });
  const [folders,        setFolders]        = useLocalStorage<Folder[]>(KEY('folders'), []);
  const [feeds,          setFeeds]          = useLocalStorage<Feed[]>(KEY('feeds'), []);
  const [readIds,        setReadIds]        = useLocalStorage<Set<string>>(KEY('read'), () => new Set());
  const [bookmarkIds,    setBookmarkIds]    = useLocalStorage<Set<string>>(KEY('bookmarks'), () => new Set());
  const [favGameIds,     setFavGameIds]     = useLocalStorage<Set<string>>(KEY('fav_games'), () => new Set());
  const [ambientEnabled, setAmbientEnabled] = useLocalStorage<boolean>(KEY('ambient'), false);
  const [tvMode,         setTvMode]         = useLocalStorage<boolean>(KEY('tv_mode'), false);

  const toast = useToast();
  const { isUpdateAvailable } = useServiceWorker({
    onBackgroundSync: () => {
      toast.info('Background sync complete. Feeds updated.');
      setLastRefresh(Date.now());
    }
  });

  useEffect(() => {
    if (isUpdateAvailable) {
      toast.info('A new version is available. Click to update.');
    }
  }, [isUpdateAvailable, toast]);

  /* ── Session-only state ── */
  const [selection,         setSelection]         = useState<Selection>({ type: 'splash', id: null });
  const [isSettingsOpen,    setIsSettingsOpen]    = useState(false);
  const [isSidebarOpen,     setIsSidebarOpen]     = useState(false);
  const [readerArticle,     setReaderArticle]     = useState<Article | null>(null);
  const [prefetchedArticles, setPrefetchedArticles] = useState<Article[]>([]);
  const [lastRefresh,       setLastRefresh]       = useState(() => Date.now());
  const [rotationState,     setRotationState]     = useState<'auto' | 'portrait' | 'landscape'>('auto');

  const [cipherData, setCipherData] = useState<{
    archiveMap: { date: string; word: string; label: string }[];
    isSynced: boolean;
    loading: boolean;
  }>({ archiveMap: [], isSynced: false, loading: true });

  /* ── Apply mode to <html> ── */
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-mode', mode);
    root.setAttribute('data-tv', tvMode.toString());
    soundService.setAmbient(ambientEnabled, mode);
  }, [mode, tvMode, ambientEnabled]);

  /* ── Auto-detect TV ── */
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if ((ua.includes('google tv') || ua.includes('android tv') || ua.includes('smarttv')) && !tvMode) {
      setTvMode(true);
    }
  }, []); // eslint-disable-line

  /* ── Navigation ── */
  const navigate = useCallback((sel: Selection) => {
    setSelection(sel);
    window.history.pushState({ selection: sel }, '');
    setIsSidebarOpen(false);
  }, []);

  /* ── Browser back button ── */
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      if (e.state?.selection) setSelection(e.state.selection);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  /* ── TV spatial navigation ── */
  useEffect(() => {
    if (!tvMode) return;

    const handler = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement;

      // Back action
      if (e.key === 'Escape' || e.key === 'Backspace') {
        if (selection.type !== 'all' && selection.type !== 'splash') {
          e.preventDefault();
          navigate({ type: 'all', id: null });
          soundService.playClick();
        }
        return;
      }

      // Ignore when typing
      if (active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA') return;

      const dirMap: Record<string, string> = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        W: 'up', S: 'down', A: 'left', D: 'right',
      };
      const dir = dirMap[e.key];
      if (!dir) return;

      e.preventDefault();

      const focusable = Array.from(
        document.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), [tabindex="0"]'
        )
      ).filter(el => {
        const rect = el.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0;
        const isNotHidden = !el.closest('[aria-hidden="true"]');
        const isNotTabIndexMinusOne = el.tabIndex !== -1;
        
        // If a modal is open, only allow focus within that modal
        const openModal = document.querySelector('[role="dialog"], .modal-overlay, .settings-modal-overlay');
        if (openModal) {
          return isVisible && isNotHidden && isNotTabIndexMinusOne && openModal.contains(el);
        }
        
        return isVisible && isNotHidden && isNotTabIndexMinusOne;
      });

      if (!active || active === document.body) {
        focusable[0]?.focus();
        return;
      }

      const cur = active.getBoundingClientRect();
      const cx = cur.left + cur.width / 2;
      const cy = cur.top  + cur.height / 2;

      let best: HTMLElement | null = null;
      let bestScore = Infinity;

      for (const el of focusable) {
        if (el === active) continue;
        const r  = el.getBoundingClientRect();
        const ex = r.left + r.width  / 2;
        const ey = r.top  + r.height / 2;
        const dx = ex - cx;
        const dy = ey - cy;

        const valid =
          (dir === 'up'    && dy < -2) ||
          (dir === 'down'  && dy >  2) ||
          (dir === 'left'  && dx < -2) ||
          (dir === 'right' && dx >  2);

        if (!valid) continue;

        const isH = dir === 'left' || dir === 'right';
        const primary   = isH ? Math.abs(dx) : Math.abs(dy);
        const secondary = isH ? Math.abs(dy) : Math.abs(dx);
        const score = primary + secondary * 3.5;

        if (score < bestScore) { bestScore = score; best = el; }
      }

      if (best) {
        best.focus();
        best.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        soundService.playPop();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [tvMode, selection.type, navigate]);

  /* ── Auto-focus first item after navigation in TV mode ── */
  useLayoutEffect(() => {
    if (!tvMode || selection.type === 'splash') return;
    const t = setTimeout(() => {
      const first = document.querySelector<HTMLElement>(
        '.void-main button, .void-main [tabindex="0"]'
      );
      first?.focus();
    }, 400);
    return () => clearTimeout(t);
  }, [selection.type, tvMode]);

  /* ── Derived flags ── */
  const hideSidebar = useMemo(() => {
    const fullScreenPages = new Set([
      'splash', 'game_hub', 'tube',
      'utility_hub', 'signal_streamer', 'surveillance_radar',
      'transcoder', 'base64_converter', 'deep_sync', 'signal_scrambler',
      'sudoku', 'solitaire', 'minesweeper', 'tetris', 'pool',
      'cipher_core', 'void_runner', 'synapse_link', 'grid_reset',
      'hangman', 'neon_signal'
    ]);
    return fullScreenPages.has(selection.type);
  }, [selection.type]);

  const isUtilPage = useMemo(() => {
    const utils = new Set(['utility_hub','signal_streamer','surveillance_radar',
      'transcoder','base64_converter']);
    return utils.has(selection.type);
  }, [selection.type]);

  /* ── Mode cycling ── */
  const cycleMode = useCallback(() => {
    const next = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
    setMode(next);
    soundService.playClick();
  }, [mode, setMode]);

  /* ── Cipher prefetch ── */
  const prefetchCipher = useCallback(async () => {
    const results = new Map<string, string>();
    try {
      const res = await resilientFetch('https://screenrant.com/wordle-history/', { timeout: 12000 });
      if (res.ok) {
        const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
        doc.querySelectorAll('table tr').forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length < 2) return;
          const word = cells[1].textContent?.trim().toUpperCase() || '';
          if (!/^[A-Z]{5}$/.test(word)) return;
          try {
            const d = new Date(cells[0].textContent?.trim() || '');
            if (!isNaN(d.getTime())) results.set(d.toISOString().split('T')[0], word);
          } catch {}
        });
      }
    } catch {}

    const archiveMap = Array.from({ length: SECTOR_LIMIT }, (_, i) => {
      const d   = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      return { date: iso, word: results.get(iso) || FALLBACK_WORD, label: i === 0 ? 'TODAY' : `T-${i}` };
    });

    setCipherData({ archiveMap, isSynced: results.size > 0, loading: false });
  }, []);

  /* ── Feed prefetch ── */
  const prefetchFeeds = useCallback(async () => {
    if (feeds.length === 0) return;
    const results = await Promise.allSettled(
      feeds.slice(0, 3).map(f =>
        resilientFetch(f.url, { timeout: 8000 })
          .then((r: any) => r.text())
          .then((xml: any) => parseRssXml(xml, f.title, f.url))
          .catch(() => [] as Article[])
      )
    );
    const all = (results as any[])
      .filter((r: any) => r.status === 'fulfilled')
      .flatMap((r: any) => r.value)
      .sort((a: Article, b: Article) => (b.publishedDate?.getTime() || 0) - (a.publishedDate?.getTime() || 0));
    setPrefetchedArticles(Array.from(new Map(all.map((a: Article) => [a.id, a])).values()) as Article[]);
  }, [feeds]);

  useEffect(() => {
    prefetchCipher();
    if (selection.type === 'splash' && feeds.length > 0) prefetchFeeds();
  }, [prefetchCipher, prefetchFeeds, selection.type, feeds.length]);

  /* ── Orientation control ── */
  const handleRotation = async () => {
    const next = rotationState === 'auto' ? 'portrait' : rotationState === 'portrait' ? 'landscape' : 'auto';
    setRotationState(next);

    const ai = (window as any).AndroidInterface;
    if (ai) {
      next === 'portrait'   ? ai.forcePortrait()   :
      next === 'landscape'  ? ai.forceLandscape()  :
                              ai.unlockOrientation();
      return;
    }
    try {
      if (next === 'auto') {
        window.screen?.orientation?.unlock();
        if (document.fullscreenElement) await document.exitFullscreen();
      } else {
        if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
        await (window.screen.orientation as any)?.lock(next);
      }
    } catch {}
  };

  /* ── Reset ── */
  const handleReset = useCallback(() => {
    soundService.playWrong();
    setFeeds([]);
    setFolders([]);
    setReadIds(new Set());
    setBookmarkIds(new Set());
    navigate({ type: 'all', id: null });
    setIsSettingsOpen(false);
  }, [setFeeds, setFolders, setReadIds, setBookmarkIds, navigate]);

  const handleAddSource = useCallback(async (url: string, type: SourceType) => {
    setFeeds(prev => [...prev, {
      id: Date.now() + Math.random(),
      url, title: 'New Signal',
      iconUrl: `https://www.google.com/s2/favicons?sz=32&domain_url=${new URL(url).hostname}`,
      folderId: null, sourceType: type,
    }]);
  }, [setFeeds]);

  const toggleFavGame = useCallback((id: string) => {
    setFavGameIds(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
    soundService.playPop();
  }, [setFavGameIds]);

  /* ─────────────────────────────────────────────────
     SPLASH
  ───────────────────────────────────────────────── */
  if (selection.type === 'splash') {
    return (
      <SplashScreen
        theme={mode}
        onEnterFeeds={() => navigate({ type: 'all', id: null })}
        onEnterArcade={() => navigate({ type: 'game_hub', id: null })}
        onEnterTube={() => navigate({ type: 'tube', id: null })}
        onToggleTheme={cycleMode}
      />
    );
  }

  /* ─────────────────────────────────────────────────
     MAIN LAYOUT
  ───────────────────────────────────────────────── */
  return (
    <div id="void-app" className="flex flex-col h-screen w-full overflow-hidden bg-base text-ink">
      <GlobalStatusWidgets location={widgetSettings.weatherLocation} />

      {/* Safe-area shell */}
      <div
        className="flex flex-col flex-1 min-h-0 overflow-hidden"
        style={{
          padding: 'max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left))',
        }}
      >
        {/* ── HEADER ── */}
        <header className="void-header">
          {/* Wordmark */}
          <button
            onClick={() => navigate({ type: 'all', id: null })}
            className="void-wordmark"
            aria-label="Go to home"
          >
            <span className="void-wordmark-dot" aria-hidden />
            VOID
          </button>

          {/* Primary navigation */}
          <nav className="flex items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }} aria-label="Main navigation">
            <NavLink
              active={selection.type === 'all' && !selection.category}
              onClick={() => navigate({ type: 'all', id: null })}
              label="INTEL"
              icon={<GlobeAltIcon className="w-3.5 h-3.5 flex-shrink-0" />}
            />
            <NavLink
              active={selection.type === 'game_hub'}
              onClick={() => navigate({ type: 'game_hub', id: null })}
              label="ARCADE"
              icon={<RadioIcon className="w-3.5 h-3.5 flex-shrink-0" />}
            />
            <NavLink
              active={selection.type === 'tube'}
              onClick={() => navigate({ type: 'tube', id: null })}
              label="TUBE"
              icon={<PlayIcon className="w-3.5 h-3.5 flex-shrink-0" />}
            />
            <NavLink
              active={isUtilPage}
              onClick={() => navigate({ type: 'utility_hub', id: null })}
              label="UTILS"
              icon={<BoltIcon className="w-3.5 h-3.5 flex-shrink-0" />}
            />
          </nav>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Rotation toggle (compact icon-only) */}
            <button
              onClick={handleRotation}
              className={`void-btn void-btn-ghost ${rotationState !== 'auto' ? 'text-accent' : ''}`}
              title={`Rotation: ${rotationState}`}
              aria-label={`Screen rotation: ${rotationState}`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
              <span className="hidden md:inline text-xs">{rotationState.slice(0,4).toUpperCase()}</span>
            </button>

            {/* Mode switcher */}
            <button
              onClick={cycleMode}
              className="void-btn void-btn-ghost"
              aria-label={`Current mode: ${MODE_LABEL[mode]}. Click to cycle.`}
            >
              {/* Coloured dot representing current mode */}
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: 'var(--c-accent)' }}
                aria-hidden
              />
              <span className="text-xs font-bold tracking-wider">{MODE_LABEL[mode]}</span>
            </button>

            {/* Settings */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="void-btn void-btn-ghost"
              aria-label="Open settings"
            >
              <CpuChipIcon className="w-4 h-4" />
              <span className="hidden md:inline text-xs">CORE</span>
            </button>
          </div>
        </header>

        {/* ── BODY ── */}
        <div className="flex flex-1 min-h-0 gap-2 overflow-hidden">

          {/* Sidebar — hidden on full-screen pages */}
          {!hideSidebar && (
            <Sidebar
              feeds={feeds}
              folders={folders}
              selection={selection}
              onSelect={navigate}
              onAddSource={handleAddSource}
              onRemoveFeed={() => {}}
              onAddFolder={() => {}}
              onRenameFolder={() => {}}
              onDeleteFolder={() => {}}
              onMoveFeedToFolder={() => {}}
              isSidebarOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          )}

          {/* Main content — renders based on selection */}
          <main className="void-main main-content-area">
            {renderPage()}
          </main>
        </div>
      </div>

      {/* ── READER MODAL ── */}
      {readerArticle && (
        <ReaderViewModal
          article={readerArticle}
          onClose={() => setReaderArticle(null)}
          onMarkAsRead={(id) => setReadIds(prev => new Set(prev).add(id))}
          onOpenExternal={(url, id) => {
            window.open(url, '_blank');
            setReadIds(prev => new Set(prev).add(id));
          }}
        />
      )}

      {/* ── SETTINGS MODAL ── */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={{ feeds, folders, theme: mode, articleView, widgets: widgetSettings }}
        onUpdateSettings={(s: any) => {
          if (s.theme)       setMode(s.theme);
          if (s.articleView) setArticleView(s.articleView);
          if (s.widgets)     setWidgetSettings(s.widgets);
        }}
        onSelect={navigate}
        onAddFolder={(name) => setFolders(f => [...f, { id: Date.now(), name }])}
        onRenameFolder={(id, name) => setFolders(f => f.map(x => x.id === id ? { ...x, name } : x))}
        onDeleteFolder={(id) => setFolders(f => f.filter(x => x.id !== id))}
        onRemoveFeed={(id) => setFeeds(f => f.filter(x => x.id !== id))}
        onImportOpml={() => {}}
        onExportOpml={() => {}}
        onImportSettings={() => {}}
        onExportSettings={() => {}}
        onAddSource={handleAddSource}
        onEnterUtils={() => navigate({ type: 'utility_hub', id: null })}
        onResetFeeds={handleReset}
      />
    </div>
  );

  /* ─────────────────────────────────────────────────
     PAGE RENDERER — replaces the giant ternary chain
  ───────────────────────────────────────────────── */
  function renderPage() {
    const goHub    = () => navigate({ type: 'game_hub', id: null });
    const goUtil   = () => navigate({ type: 'utility_hub', id: null });
    const goFeeds  = () => navigate({ type: 'all', id: null });

    switch (selection.type) {
      case 'tube':
        return <TubePage onReturnToFeeds={goFeeds} />;

      case 'game_hub':
        return (
          <GameHubPage
            onSelect={(id: any) => navigate({ type: id, id })}
            favoriteGameIds={favGameIds}
            onToggleFavorite={toggleFavGame}
            onReturnToFeeds={goFeeds}
            onBack={goFeeds}
          />
        );

      case 'utility_hub':
        return (
          <UtilityHubPage
            onSelect={(id: any) => navigate({ type: id, id })}
            onBackToHub={goFeeds}
            onToggleTheme={cycleMode}
          />
        );

      case 'signal_streamer':     return <SignalStreamerPage onBackToHub={goUtil} />;
      case 'surveillance_radar':  return <SurveillanceRadarPage onBackToHub={goUtil} />;
      case 'transcoder':          return <TranscoderPage onBackToHub={goUtil} />;
      case 'base64_converter':    return <Base64ConverterPage onBackToHub={goUtil} />;
      case 'deep_sync':           return <DeepSyncPage onBackToHub={goUtil} />;
      case 'signal_scrambler':    return <SignalScramblerPage onBackToHub={goUtil} />;

      case 'sudoku':
        return <SudokuPage stats={{ totalWins: 0 }} onGameWin={() => {}} onGameLoss={() => {}} onBackToHub={goHub} onReturnToFeeds={goFeeds} />;
      case 'solitaire':
        return <SolitairePage stats={{ gamesWon: 0, currentStreak: 0 }} onGameWin={() => {}} onGameStart={() => {}} settings={{ drawThree: true }} onUpdateSettings={() => {}} onBackToHub={goHub} onReturnToFeeds={goFeeds} />;
      case 'minesweeper':         return <MinesweeperPage onBackToHub={goHub} onReturnToFeeds={goFeeds} />;
      case 'tetris':              return <TetrisPage onBackToHub={goHub} onReturnToFeeds={goFeeds} />;
      case 'pool':                return <PoolGamePage onBackToHub={goHub} onReturnToFeeds={goFeeds} />;
      case 'cipher_core':         return <CipherCorePage onBackToHub={goHub} preloadedData={cipherData} />;
      case 'void_runner':         return <VoidRunnerPage onBackToHub={goHub} onReturnToFeeds={goFeeds} />;
      case 'synapse_link':        return <SynapseLinkPage onBackToHub={goHub} />;
      case 'grid_reset':          return <GridResetPage onBackToHub={goHub} />;
      case 'hangman':             return <HangmanPage onBackToHub={goHub} />;
      case 'neon_signal':         return <NeonSignalPage onBack={goHub} onReturnToFeeds={goFeeds} />;

      default:
        return (
          <MainContent
            feedsToDisplay={feeds}
            selection={selection}
            onSelectCategory={(cat) => navigate({ ...selection, category: cat || undefined })}
            readArticleIds={readIds}
            bookmarkedArticleIds={bookmarkIds}
            articleTags={new Map()}
            onMarkAsRead={(id) => setReadIds(prev => new Set(prev).add(id))}
            onMarkAsUnread={() => {}}
            onMarkMultipleAsRead={() => {}}
            onPurgeBuffer={() => {}}
            onToggleBookmark={(id) => setBookmarkIds(prev => {
              const s = new Set(prev);
              s.has(id) ? s.delete(id) : s.add(id);
              return s;
            })}
            onSetArticleTags={() => {}}
            onSearch={(q) => navigate({ type: 'search', id: null, query: q })}
            onOpenReader={setReaderArticle}
            onOpenExternal={(url, id) => {
              window.open(url, '_blank');
              setReadIds(prev => new Set(prev).add(id));
            }}
            allFeeds={feeds}
            onSetFeeds={setFeeds}
            onSetFolders={setFolders}
            refreshKey={lastRefresh}
            onRefresh={() => setLastRefresh(Date.now())}
            widgetSettings={widgetSettings}
            articleView={articleView}
            theme={mode}
            onToggleTheme={cycleMode}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenAddSource={() => {}}
            onOpenSidebar={() => setIsSidebarOpen(true)}
            animationClass="animate-fade-up"
            pageTitle="Signals"
            initialArticles={prefetchedArticles}
            onSetSniffErrorModal={() => {}}
            ambientEnabled={ambientEnabled}
            onToggleAmbient={() => setAmbientEnabled(a => !a)}
            tvMode={tvMode}
          />
        );
    }
  }
};

export default App;
