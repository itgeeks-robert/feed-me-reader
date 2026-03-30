import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SearchIcon, PlayIcon, ArrowPathIcon, XIcon, RadioIcon, GlobeAltIcon, BoltIcon, CpuChipIcon, UserIcon, MusicIcon, ControllerIcon, SettingsIcon } from './icons';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Video {
  id:           string;
  title:        string;
  thumbnail:    string;
  author:       string;
  views:        string;
  published:    string;
  description?: string;
  duration?:    string;
  category?:    string;
}

interface TubeSettings {
  quality:  'Auto' | '1080p' | '720p' | '480p';
  speed:    number;
  autoplay: boolean;
}

// ─── Fallback data shown only when every network request fails ─────────────────

const FALLBACK_VIDEOS: Video[] = [
  { id: 'dQw4w9WgXcQ', title: 'Rick Astley - Never Gonna Give You Up', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', author: 'Rick Astley', views: '1.4B views', published: '14 years ago', category: 'Music' },
  { id: '9bZkp7q19f0', title: 'PSY - GANGNAM STYLE M/V', thumbnail: 'https://i.ytimg.com/vi/9bZkp7q19f0/maxresdefault.jpg', author: 'officialpsy', views: '4.9B views', published: '11 years ago', category: 'Music' },
  { id: 'kJQP7kiw5Fk', title: 'Luis Fonsi - Despacito ft. Daddy Yankee', thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/maxresdefault.jpg', author: 'Luis Fonsi', views: '8.3B views', published: '7 years ago', category: 'Music' },
  { id: 'fJ9rUzIMcZQ', title: 'Queen – Bohemian Rhapsody', thumbnail: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/maxresdefault.jpg', author: 'Queen Official', views: '1.6B views', published: '15 years ago', category: 'Music' },
  { id: 'JGwWNGJdvx8', title: 'Ed Sheeran - Shape of You', thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/maxresdefault.jpg', author: 'Ed Sheeran', views: '6.1B views', published: '7 years ago', category: 'Music' },
  { id: 'L_jWHffIx5E', title: 'Smash Mouth - All Star', thumbnail: 'https://i.ytimg.com/vi/L_jWHffIx5E/maxresdefault.jpg', author: 'Smash Mouth', views: '450M views', published: '14 years ago', category: 'Music' },
];

// ─── API helpers ──────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json();
}

// ─── Component ────────────────────────────────────────────────────────────────

export const TubePage: React.FC<{ onReturnToFeeds: () => void }> = ({ onReturnToFeeds }) => {
  const [videos, setVideos]                   = useState<Video[]>([]);
  const [relatedVideos, setRelatedVideos]     = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo]     = useState<Video | null>(null);
  const [searchQuery, setSearchQuery]         = useState('');
  const [isSearching, setIsSearching]         = useState(false);
  const [isLoading, setIsLoading]             = useState(false);
  const [activeCategory, setActiveCategory]   = useState('Home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showSettings, setShowSettings]       = useState(false);
  const [lastUpdated, setLastUpdated]         = useState<Date | null>(null);
  const [error, setError]                     = useState<string | null>(null);
  const [tubeSettings, setTubeSettings]       = useState<TubeSettings>({ quality: 'Auto', speed: 1, autoplay: true });

  const searchInputRef = useRef<HTMLInputElement>(null);

  // ── Trending ─────────────────────────────────────────────────────────────────

  const fetchTrending = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Video[]>('/api/youtube/trending');
      setVideos(data.length > 0 ? data : FALLBACK_VIDEOS);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('[TubePage] trending failed:', err);
      setError('Could not reach YouTube. Showing cached titles.');
      setVideos(FALLBACK_VIDEOS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Search ───────────────────────────────────────────────────────────────────

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    setIsSearching(true);
    setError(null);
    try {
      const data = await apiFetch<Video[]>(`/api/youtube/search?q=${encodeURIComponent(q)}`);
      setVideos(data.length > 0 ? data : FALLBACK_VIDEOS);
    } catch (err) {
      console.error('[TubePage] search failed:', err);
      setError('Search unavailable.');
      // Fuzzy fallback against what we already have
      const lower = q.toLowerCase();
      const filtered = FALLBACK_VIDEOS.filter(v =>
        v.title.toLowerCase().includes(lower) || v.author.toLowerCase().includes(lower)
      );
      setVideos(filtered.length > 0 ? filtered : FALLBACK_VIDEOS);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // ── Related videos when a video is selected ──────────────────────────────────

  const fetchRelated = useCallback(async (videoId: string) => {
    setRelatedVideos([]);
    try {
      const data = await apiFetch<Video[]>(`/api/youtube/related?videoId=${videoId}`);
      setRelatedVideos(data);
    } catch (err) {
      console.error('[TubePage] related failed:', err);
      // Silently fail — related sidebar just stays empty
    }
  }, []);

  const handleSelectVideo = useCallback((video: Video) => {
    setSelectedVideo(video);
    fetchRelated(video.id);
    window.scrollTo(0, 0);
  }, [fetchRelated]);

  // ── Category nav ─────────────────────────────────────────────────────────────

  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
    setError(null);
    if (cat === 'Home' || cat === 'Trending') fetchTrending();
    if (cat === 'Search') setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  // ── Init ──────────────────────────────────────────────────────────────────────

  useEffect(() => { fetchTrending(); }, [fetchTrending]);

  // ── Sidebar items ─────────────────────────────────────────────────────────────

  const categories = [
    { id: 'Home',     icon: <RadioIcon className="w-5 h-5" /> },
    { id: 'Trending', icon: <BoltIcon className="w-5 h-5" /> },
    { id: 'Music',    icon: <MusicIcon className="w-5 h-5" /> },
    { id: 'Gaming',   icon: <ControllerIcon className="w-5 h-5" /> },
    { id: 'Search',   icon: <SearchIcon className="w-5 h-5" /> },
    { id: 'Settings', icon: <CpuChipIcon className="w-5 h-5" /> },
  ];

  // ── Video card ────────────────────────────────────────────────────────────────

  const VideoCard: React.FC<{ video: Video; compact?: boolean }> = ({ video, compact }) => (
    <button
      onClick={() => handleSelectVideo(video)}
      className={`group text-left outline-none focus:ring-4 focus:ring-red-500 rounded-2xl transition-all hover:bg-white/5 ${compact ? 'flex gap-3 p-2 w-full' : 'flex flex-col gap-3 p-2 shrink-0 w-64 md:w-72'}`}
    >
      {/* Thumbnail */}
      <div className={`relative ${compact ? 'w-32 shrink-0' : 'w-full'} aspect-video rounded-xl overflow-hidden bg-zinc-800`}>
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
          onError={e => { (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`; }}
        />
        {video.duration && (
          <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/80 text-[10px] font-bold rounded">
            {video.duration}
          </div>
        )}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all" />
      </div>

      {/* Meta */}
      <div className="flex flex-col gap-1 min-w-0">
        <h3 className={`font-bold text-white leading-tight group-hover:text-red-400 transition-colors ${compact ? 'text-sm line-clamp-2' : 'line-clamp-2'}`}>
          {video.title}
        </h3>
        <div className="flex flex-col text-xs text-zinc-500 font-medium">
          <span className="truncate">{video.author}</span>
          <div className="flex items-center gap-1 flex-wrap">
            {video.views && <span>{video.views}</span>}
            {video.views && video.published && <span>•</span>}
            {video.published && <span>{video.published}</span>}
          </div>
        </div>
      </div>
    </button>
  );

  // ── Player view ───────────────────────────────────────────────────────────────

  if (selectedVideo) {
    return (
      <div className="flex-1 flex flex-col bg-black animate-fade-in">
        {/* Back + settings */}
        <div className="absolute top-4 left-4 z-50 flex gap-2">
          <button
            onClick={() => setSelectedVideo(null)}
            className="p-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-white/20 transition-all focus:ring-2 focus:ring-red-500 outline-none"
          >
            <XIcon className="w-6 h-6" />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-white/20 transition-all focus:ring-2 focus:ring-red-500 outline-none"
          >
            <SettingsIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Player + related side panel */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          {/* iframe */}
          <div className="flex-1 min-h-0 relative">
            <iframe
              src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=${tubeSettings.autoplay ? 1 : 0}&modestbranding=1&rel=0`}
              title={selectedVideo.title}
              className="w-full h-full border-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ minHeight: '56.25vw', maxHeight: '80vh' }}
            />
          </div>

          {/* Related videos panel */}
          {relatedVideos.length > 0 && (
            <div className="w-full lg:w-96 overflow-y-auto scrollbar-hide bg-zinc-950 border-t lg:border-t-0 lg:border-l border-white/5 p-3 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 px-2 py-1">Up Next</p>
              {relatedVideos.map(v => <VideoCard key={v.id} video={v} compact />)}
            </div>
          )}
        </div>

        {/* Video info bar */}
        <div className="p-4 md:p-6 bg-zinc-900 border-t border-white/5 shrink-0">
          <h1 className="text-lg md:text-xl font-bold text-white mb-1 leading-snug">{selectedVideo.title}</h1>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-sm text-zinc-400">
            <span className="font-medium">{selectedVideo.author}</span>
            {selectedVideo.views && <><span>•</span><span>{selectedVideo.views}</span></>}
            {selectedVideo.published && <><span>•</span><span>{selectedVideo.published}</span></>}
            <span className="ml-auto text-red-500 font-bold uppercase tracking-widest text-xs">
              {tubeSettings.quality} · {tubeSettings.speed}x
            </span>
          </div>
          {selectedVideo.description && (
            <p className="mt-2 text-xs text-zinc-500 line-clamp-2">{selectedVideo.description}</p>
          )}
        </div>

        {/* Settings modal */}
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black uppercase tracking-tight">Playback Settings</h2>
                <button onClick={() => setShowSettings(false)} className="text-zinc-500 hover:text-white transition-all">
                  <XIcon className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-8">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Resolution</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Auto', '1080p', '720p', '480p'] as const).map(q => (
                      <button key={q} onClick={() => setTubeSettings(s => ({ ...s, quality: q }))}
                        className={`py-3 rounded-xl font-bold transition-all ${tubeSettings.quality === q ? 'bg-red-600 text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Playback Speed</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[0.5, 1, 1.25, 1.5, 2].map(s => (
                      <button key={s} onClick={() => setTubeSettings(st => ({ ...st, speed: s }))}
                        className={`py-3 rounded-xl font-bold transition-all ${tubeSettings.speed === s ? 'bg-red-600 text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}>
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                  <span className="font-bold uppercase tracking-wider text-sm">Autoplay</span>
                  <button onClick={() => setTubeSettings(s => ({ ...s, autoplay: !s.autoplay }))}
                    className={`w-12 h-6 rounded-full transition-all relative ${tubeSettings.autoplay ? 'bg-red-600' : 'bg-zinc-700'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${tubeSettings.autoplay ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Browse view ───────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex min-h-0 bg-[#0f0f0f] text-white font-sans overflow-hidden animate-fade-in"
      style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)', paddingLeft: 'var(--safe-left)', paddingRight: 'var(--safe-right)' }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className={`flex flex-col border-r border-white/5 bg-[#0f0f0f] transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'} shrink-0`}>
        <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide">
          {/* Logo */}
          <div className="p-6 flex items-center gap-3">
            <button
              onClick={() => setIsSidebarCollapsed(c => !c)}
              className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shrink-0 outline-none focus:ring-4 focus:ring-white"
              aria-label="Toggle Sidebar"
            >
              <PlayIcon className="w-5 h-5 text-white" />
            </button>
            {!isSidebarCollapsed && <span className="font-black text-xl tracking-tighter uppercase italic">VoidTube</span>}
          </div>

          {/* Nav */}
          <nav className="px-3 py-4 space-y-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all outline-none focus:ring-4 focus:ring-red-500 ${activeCategory === cat.id ? 'bg-white/10 text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
              >
                <span className={activeCategory === cat.id ? 'text-red-500' : ''}>{cat.icon}</span>
                {!isSidebarCollapsed && <span className="font-bold text-sm uppercase tracking-wider">{cat.id}</span>}
              </button>
            ))}
          </nav>

          {/* Error banner */}
          {error && (
            <div className="px-4 py-3 mx-3 bg-red-500/10 border border-red-500/20 rounded-xl animate-fade-in">
              <p className="text-[10px] text-zinc-400 font-bold leading-relaxed uppercase tracking-wider">{error}</p>
              <button onClick={() => setError(null)} className="text-[8px] font-black text-red-500 uppercase tracking-[0.2em] hover:text-white transition-colors mt-1 block">
                [ DISMISS ]
              </button>
            </div>
          )}

          {/* Back to app */}
          <div className="mt-auto p-4 border-t border-white/5">
            <button
              onClick={onReturnToFeeds}
              className="w-full flex items-center gap-4 px-4 py-3 text-zinc-400 hover:text-white transition-all outline-none focus:ring-4 focus:ring-red-500 rounded-xl"
            >
              <GlobeAltIcon className="w-5 h-5" />
              {!isSidebarCollapsed && <span className="font-bold text-sm uppercase tracking-wider">Back to Intel</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

        {/* Header */}
        <header className="h-20 border-b border-white/5 flex items-center px-4 md:px-8 gap-4 md:gap-8 shrink-0">
          {activeCategory === 'Search' ? (
            <form onSubmit={handleSearch} className="flex-1 flex items-center gap-4">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search YouTube..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/50 transition-all"
                />
              </div>
              <button type="submit" className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-all outline-none focus:ring-4 focus:ring-white">
                SEARCH
              </button>
            </form>
          ) : (
            <div className="flex-1 flex items-center justify-between">
              <h2 className="text-2xl font-black uppercase tracking-tight">{activeCategory}</h2>
              <div className="flex items-center gap-4">
                {lastUpdated && (
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest hidden md:block">
                    Sync: {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
                <button
                  onClick={fetchTrending}
                  disabled={isLoading}
                  className={`p-3 text-zinc-400 hover:text-white transition-all focus:ring-4 focus:ring-red-500 outline-none rounded-xl bg-white/5 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title="Refresh"
                >
                  <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Video grid */}
        <div className="flex-1 overflow-y-auto scrollbar-hide relative">
          {/* Loading overlay */}
          {(isLoading || isSearching) && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-4">
                <ArrowPathIcon className="w-12 h-12 text-red-600 animate-spin" />
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-red-500">
                  {isSearching ? 'Searching...' : 'Syncing_VoidTube...'}
                </span>
              </div>
            </div>
          )}

          <div className="p-4 md:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
            {videos.map(video => <VideoCard key={video.id} video={video} />)}
          </div>

          {/* Empty state */}
          {!isLoading && !isSearching && videos.length === 0 && (
            <div className="h-64 flex flex-col items-center justify-center gap-4 text-zinc-600">
              <RadioIcon className="w-12 h-12" />
              <span className="font-bold uppercase tracking-widest text-sm">No signal detected</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
