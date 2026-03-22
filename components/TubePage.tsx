
import React, { useState, useEffect, useRef } from 'react';
import { SearchIcon, PlayIcon, ArrowPathIcon, XIcon, RadioIcon, GlobeAltIcon, BoltIcon, CpuChipIcon, UserIcon, MusicIcon, ControllerIcon, SettingsIcon } from './icons';

interface Video {
    id: string;
    title: string;
    thumbnail: string;
    author: string;
    views: string;
    published: string;
    description?: string;
    category?: string;
}

const MOCK_VIDEOS: Video[] = [
    { id: 'dQw4w9WgXcQ', title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)', thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', author: 'Rick Astley', views: '1.4B views', published: '14 years ago', category: 'Music' },
    { id: '9bZkp7q19f0', title: 'PSY - GANGNAM STYLE(강남스타일) M/V', thumbnail: 'https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg', author: 'officialpsy', views: '4.9B views', published: '11 years ago', category: 'Music' },
    { id: 'kJQP7kiw5Fk', title: 'Luis Fonsi - Despacito ft. Daddy Yankee', thumbnail: 'https://img.youtube.com/vi/kJQP7kiw5Fk/maxresdefault.jpg', author: 'Luis Fonsi', views: '8.3B views', published: '7 years ago', category: 'Music' },
    { id: 'fJ9rUzIMcZQ', title: 'Queen – Bohemian Rhapsody (Official Video Remastered)', thumbnail: 'https://img.youtube.com/vi/fJ9rUzIMcZQ/maxresdefault.jpg', author: 'Queen Official', views: '1.6B views', published: '15 years ago', category: 'Music' },
    { id: 'JGwWNGJdvx8', title: 'Ed Sheeran - Shape of You (Official Music Video)', thumbnail: 'https://img.youtube.com/vi/JGwWNGJdvx8/maxresdefault.jpg', author: 'Ed Sheeran', views: '6.1B views', published: '7 years ago', category: 'Music' },
    { id: 'L_jWHffIx5E', title: 'Smash Mouth - All Star (Official Music Video)', thumbnail: 'https://img.youtube.com/vi/L_jWHffIx5E/maxresdefault.jpg', author: 'Smash Mouth', views: '450M views', published: '14 years ago', category: 'Music' },
    { id: 'jNQXAC9IVRw', title: 'Me at the zoo', thumbnail: 'https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg', author: 'jawed', views: '300M views', published: '18 years ago', category: 'New' },
    { id: 'y6120QOlsfU', title: 'Darude - Sandstorm', thumbnail: 'https://img.youtube.com/vi/y6120QOlsfU/maxresdefault.jpg', author: 'Darude', views: '200M views', published: '14 years ago', category: 'Shorts' },
    { id: '9S_pX9S_pX9', title: 'Minecraft Speedrun World Record', thumbnail: 'https://picsum.photos/seed/gaming1/400/225', author: 'Dream', views: '50M views', published: '2 years ago', category: 'Gaming' },
    { id: '8S_pX8S_pX8', title: 'Elden Ring - Official Trailer', thumbnail: 'https://picsum.photos/seed/gaming2/400/225', author: 'Bandai Namco', views: '30M views', published: '1 year ago', category: 'Gaming' }
];

interface TubeSettings {
    quality: 'Auto' | '1080p' | '720p' | '480p';
    speed: number;
    autoplay: boolean;
}

export const TubePage: React.FC<{ onReturnToFeeds: () => void }> = ({ onReturnToFeeds }) => {
    const [videos, setVideos] = useState<Video[]>(MOCK_VIDEOS);
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [activeCategory, setActiveCategory] = useState('Home');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userProfile, setUserProfile] = useState<{ name: string; picture: string; email: string } | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [deviceAuthData, setDeviceAuthData] = useState<{ user_code: string; verification_url: string; device_code: string; expires_in: number; interval: number } | null>(null);
    const [isPolling, setIsPolling] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [tubeSettings, setTubeSettings] = useState<TubeSettings>({
        quality: 'Auto',
        speed: 1,
        autoplay: true
    });
    
    const searchInputRef = useRef<HTMLInputElement>(null);

    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    const fetchTrending = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/youtube/trending');
            if (res.ok) {
                const data = await res.json();
                setVideos(data);
            } else {
                // Fallback to mock data if API key is missing or error
                setVideos(MOCK_VIDEOS);
            }
        } catch (error) {
            console.error('Failed to fetch trending:', error);
            setVideos(MOCK_VIDEOS);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCategoryClick = (categoryId: string) => {
        setActiveCategory(categoryId);
        if (categoryId === 'Trending' || categoryId === 'Home') {
            fetchTrending();
        }
    };

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            const filtered = MOCK_VIDEOS.filter(v => 
                v.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                v.author.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setVideos(filtered.length > 0 ? filtered : [...MOCK_VIDEOS].sort(() => Math.random() - 0.5));
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const categories = [
        { id: 'Home', icon: <RadioIcon className="w-5 h-5" /> },
        { id: 'Trending', icon: <BoltIcon className="w-5 h-5" /> },
        { id: 'Shorts', icon: <BoltIcon className="w-5 h-5" /> },
        { id: 'Music', icon: <MusicIcon className="w-5 h-5" /> },
        { id: 'Gaming', icon: <ControllerIcon className="w-5 h-5" /> },
        { id: 'Search', icon: <SearchIcon className="w-5 h-5" /> },
        { id: 'Settings', icon: <CpuChipIcon className="w-5 h-5" /> }
    ];

    const homeRows = ['New', 'Shorts', 'Music', 'Gaming'];

    const checkLoginStatus = async () => {
        try {
            const res = await fetch('/api/auth/status');
            const data = await res.json();
            if (data.loggedIn) {
                setIsLoggedIn(true);
                setUserProfile(data.user);
            } else {
                setIsLoggedIn(false);
                setUserProfile(null);
            }
        } catch (error) {
            console.error('Failed to check login status:', error);
        }
    };

    const handleLogin = async () => {
        if (isLoggedIn) {
            // Logout
            try {
                await fetch('/api/auth/logout', { method: 'POST' });
                setIsLoggedIn(false);
                setUserProfile(null);
            } catch (error) {
                console.error('Logout failed:', error);
            }
            return;
        }

        try {
            const res = await fetch('/api/auth/device/code');
            if (res.status === 412) {
                alert('VOIDTUBE_AUTH_ERROR: GOOGLE_CLIENT_ID NOT CONFIGURED. PLEASE SET UP CREDENTIALS IN SETTINGS.');
                return;
            }
            const data = await res.json();
            if (data.error) {
                alert(`AUTH_ERROR: ${data.error_description || data.error}`);
                return;
            }
            setDeviceAuthData(data);
            setIsPolling(true);
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    useEffect(() => {
        let pollTimer: NodeJS.Timeout;

        if (isPolling && deviceAuthData) {
            const poll = async () => {
                try {
                    const res = await fetch('/api/auth/device/poll', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ device_code: deviceAuthData.device_code })
                    });
                    const data = await res.json();

                    if (data.success) {
                        setIsPolling(false);
                        setDeviceAuthData(null);
                        checkLoginStatus();
                    } else if (data.error === 'authorization_pending') {
                        // Continue polling
                        pollTimer = setTimeout(poll, deviceAuthData.interval * 1000);
                    } else {
                        // Error (expired, slow down, etc)
                        setIsPolling(false);
                        setDeviceAuthData(null);
                        if (data.error !== 'authorization_pending') {
                            alert(`AUTH_SESSION_ENDED: ${data.error_description || data.error}`);
                        }
                    }
                } catch (error) {
                    console.error('Polling error:', error);
                    setIsPolling(false);
                }
            };

            pollTimer = setTimeout(poll, deviceAuthData.interval * 1000);
        }

        return () => clearTimeout(pollTimer);
    }, [isPolling, deviceAuthData]);

    useEffect(() => {
        checkLoginStatus();
        fetchTrending();

        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
                checkLoginStatus();
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    useEffect(() => {
        if (activeCategory === 'Search') {
            searchInputRef.current?.focus();
        }
    }, [activeCategory]);

    const renderVideoCard = (video: Video) => (
        <button
            key={video.id}
            onClick={() => setSelectedVideo(video)}
            className="group text-left flex flex-col gap-3 outline-none focus:ring-4 focus:ring-red-500 rounded-2xl p-2 transition-all hover:bg-white/5 shrink-0 w-64 md:w-72"
        >
            <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-800">
                <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all" />
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-[10px] font-bold rounded">
                    10:00
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <h3 className="font-bold text-white line-clamp-2 leading-tight group-hover:text-red-500 transition-colors">
                    {video.title}
                </h3>
                <div className="flex flex-col text-xs text-zinc-500 font-medium">
                    <span>{video.author}</span>
                    <div className="flex items-center gap-1">
                        <span>{video.views}</span>
                        <span>•</span>
                        <span>{video.published}</span>
                    </div>
                </div>
            </div>
        </button>
    );

    if (selectedVideo) {
        return (
            <div className="flex-1 flex flex-col bg-black relative animate-fade-in">
                <div className="absolute top-4 left-4 z-50 flex gap-2">
                    <button 
                        onClick={() => setSelectedVideo(null)}
                        className="p-3 bg-black/50 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-white/20 transition-all outline-none focus:ring-2 focus:ring-red-500"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                    <button 
                        onClick={() => setShowSettings(true)}
                        className="p-3 bg-black/50 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-white/20 transition-all outline-none focus:ring-2 focus:ring-red-500"
                    >
                        <SettingsIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-1 w-full h-full">
                    <iframe 
                        src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1&modestbranding=1&rel=0&playback_speed=${tubeSettings.speed}`}
                        title={selectedVideo.title}
                        className="w-full h-full border-none"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
                <div className="p-6 bg-zinc-900 border-t border-white/5">
                    <h1 className="text-xl font-bold text-white mb-2">{selectedVideo.title}</h1>
                    <div className="flex items-center gap-4 text-sm text-zinc-400">
                        <span>{selectedVideo.author}</span>
                        <span>•</span>
                        <span>{selectedVideo.views}</span>
                        <span>•</span>
                        <span>{selectedVideo.published}</span>
                        <span className="ml-auto text-red-500 font-bold uppercase tracking-widest text-xs">{tubeSettings.quality} • {tubeSettings.speed}x</span>
                    </div>
                </div>

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
                                        {['Auto', '1080p', '720p', '480p'].map(q => (
                                            <button 
                                                key={q}
                                                onClick={() => setTubeSettings({...tubeSettings, quality: q as any})}
                                                className={`py-3 rounded-xl font-bold transition-all ${tubeSettings.quality === q ? 'bg-red-600 text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Playback Speed</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[0.5, 1, 1.25, 1.5, 2].map(s => (
                                            <button 
                                                key={s}
                                                onClick={() => setTubeSettings({...tubeSettings, speed: s})}
                                                className={`py-3 rounded-xl font-bold transition-all ${tubeSettings.speed === s ? 'bg-red-600 text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}
                                            >
                                                {s}x
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                                    <span className="font-bold uppercase tracking-wider text-sm">Autoplay</span>
                                    <button 
                                        onClick={() => setTubeSettings({...tubeSettings, autoplay: !tubeSettings.autoplay})}
                                        className={`w-12 h-6 rounded-full transition-all relative ${tubeSettings.autoplay ? 'bg-red-600' : 'bg-zinc-700'}`}
                                    >
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

    return (
        <div className="flex-1 flex min-h-0 bg-[#0f0f0f] text-white font-sans overflow-hidden animate-fade-in">
            {/* Sidebar */}
            <aside className={`flex flex-col border-r border-white/5 bg-[#0f0f0f] transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'} shrink-0`}>
                <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide">
                    <div className="p-6 flex items-center gap-3">
                        <button 
                            onClick={toggleSidebar}
                            className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shrink-0 outline-none focus:ring-4 focus:ring-white"
                            aria-label="Toggle Sidebar"
                        >
                            <PlayIcon className="w-5 h-5 text-white" />
                        </button>
                        {!isSidebarCollapsed && <span className="font-black text-xl tracking-tighter uppercase italic">VoidTube</span>}
                    </div>

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
                        
                        <div className="pt-4 mt-4 border-t border-white/5">
                            <button
                                onClick={handleLogin}
                                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all outline-none focus:ring-4 focus:ring-red-500 ${isLoggedIn ? 'text-emerald-500' : 'text-zinc-400 hover:text-white'}`}
                            >
                                {userProfile?.picture ? (
                                    <img src={userProfile.picture} alt="Profile" className="w-6 h-6 rounded-full border border-emerald-500/50" referrerPolicy="no-referrer" />
                                ) : (
                                    <UserIcon className="w-5 h-5" />
                                )}
                                {!isSidebarCollapsed && (
                                    <div className="flex flex-col items-start overflow-hidden">
                                        <span className="font-bold text-sm uppercase tracking-wider truncate w-full">
                                            {isLoggedIn ? userProfile?.name || 'Survivor_01' : 'Login'}
                                        </span>
                                        {isLoggedIn && <span className="text-[8px] font-black text-zinc-500 italic uppercase">Uplink_Active</span>}
                                    </div>
                                )}
                            </button>
                        </div>
                    </nav>

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

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Header / Search */}
                <header className="h-20 border-b border-white/5 flex items-center px-8 gap-8 shrink-0">
                    {activeCategory === 'Search' ? (
                        <form onSubmit={handleSearch} className="flex-1 flex items-center gap-4">
                            <div className="flex-1 relative">
                                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                <input 
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search videos..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full bg-zinc-800/50 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/50 transition-all"
                                />
                            </div>
                            <button 
                                type="submit"
                                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-all outline-none focus:ring-4 focus:ring-white"
                            >
                                SEARCH
                            </button>
                        </form>
                    ) : (
                        <div className="flex-1 flex items-center justify-between">
                            <h2 
                                tabIndex={0}
                                className="text-2xl font-black uppercase tracking-tight outline-none focus:ring-4 focus:ring-red-500 rounded-lg px-2"
                            >
                                {activeCategory}
                            </h2>
                            <div className="flex items-center gap-4">
                                <button className="p-3 text-zinc-400 hover:text-white transition-all outline-none focus:ring-4 focus:ring-red-500 rounded-xl bg-white/5">
                                    <ArrowPathIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </header>

                {/* Video Content */}
                <div className="flex-1 overflow-y-auto scrollbar-hide relative">
                    {isLoading && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-4">
                                <ArrowPathIcon className="w-12 h-12 text-red-600 animate-spin" />
                                <span className="text-xs font-bold uppercase tracking-[0.3em] text-red-500">Syncing_VoidTube...</span>
                            </div>
                        </div>
                    )}
                    {isSearching ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4">
                            <ArrowPathIcon className="w-12 h-12 text-red-600 animate-spin" />
                            <span className="text-zinc-500 font-bold uppercase tracking-widest">Scanning Signal...</span>
                        </div>
                    ) : activeCategory === 'Home' ? (
                        <div className="p-8 space-y-12">
                            {homeRows.map(row => (
                                <section key={row} className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-black uppercase tracking-widest text-zinc-500">{row}</h3>
                                        <button className="text-xs font-bold text-red-500 hover:underline uppercase tracking-widest outline-none focus:ring-4 focus:ring-red-500 rounded-lg px-2 py-1">View All</button>
                                    </div>
                                    <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x">
                                        {MOCK_VIDEOS.filter(v => v.category === row).map(video => (
                                            <div key={video.id} className="snap-start">
                                                {renderVideoCard(video)}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {videos.map(video => renderVideoCard(video))}
                        </div>
                    )}
                </div>
            </main>

            {/* Device Auth Modal */}
            {deviceAuthData && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
                    <div className="bg-zinc-900 border border-red-500/30 rounded-3xl p-10 w-full max-w-lg shadow-2xl text-center relative overflow-hidden">
                        {/* Scanning effect */}
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-red-500/5 to-transparent h-1/2 animate-pulse" />
                        
                        <div className="relative z-10 space-y-8">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center animate-bounce">
                                    <UserIcon className="w-10 h-10 text-white" />
                                </div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter italic text-red-500">Uplink_Authorization</h2>
                            </div>

                            <div className="space-y-4">
                                <p className="text-zinc-400 font-medium uppercase tracking-widest text-sm">
                                    Scan signal on another device:
                                </p>
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 font-mono text-red-400 break-all">
                                    {deviceAuthData.verification_url}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-zinc-400 font-medium uppercase tracking-widest text-sm">
                                    Enter this decryption code:
                                </p>
                                <div className="text-6xl font-black tracking-widest text-white bg-white/5 rounded-2xl py-6 border-2 border-red-600/50 shadow-[0_0_30px_rgba(220,38,38,0.3)]">
                                    {deviceAuthData.user_code}
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-6 pt-4">
                                <div className="flex items-center gap-3 text-zinc-500">
                                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                                    <span className="text-xs font-bold uppercase tracking-[0.2em]">Waiting for signal...</span>
                                </div>
                                
                                <button 
                                    onClick={() => {
                                        setIsPolling(false);
                                        setDeviceAuthData(null);
                                    }}
                                    className="px-8 py-3 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white font-bold rounded-xl transition-all uppercase tracking-widest text-xs border border-white/10"
                                >
                                    Abort Uplink
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

