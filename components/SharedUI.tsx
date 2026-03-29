import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { 
    ClockIcon, BoltIcon, RadioIcon, GlobeAltIcon, SparklesIcon, ChevronDownIcon,
    RssIcon, RedditIcon 
} from './icons';
import { summarizeArticle } from '../services/summaryService';
import { resilientFetch } from '../services/fetch';

// --- TYPES ---
export type SourceType = 'rss' | 'website' | 'reddit';

// --- TOAST ---
type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const MAX_TOASTS = 4;

  const addToast = useCallback((message: string, type: ToastType) => {
    setToasts((prev) => {
      const newToast = { id: Math.random().toString(36).substr(2, 9), message, type };
      const next = [...prev, newToast];
      if (next.length > MAX_TOASTS) {
        return next.slice(1); // Remove oldest
      }
      return next;
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = (msg: string) => addToast(msg, 'success');
  const error = (msg: string) => addToast(msg, 'error');
  const info = (msg: string) => addToast(msg, 'info');

  return (
    <ToastContext.Provider value={{ success, error, info }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </div>

      <style>{`
        .toast-container {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 12px;
          pointer-events: none;
        }

        @media (max-width: 640px) {
          .toast-container {
            right: 16px;
            left: 16px;
            bottom: 16px;
            align-items: center;
          }
        }

        .toast-item {
          pointer-events: auto;
          min-width: 280px;
          max-width: 400px;
          min-height: 48px;
          background: var(--c-surface);
          color: var(--c-ink);
          border: 1px solid var(--c-border);
          border-radius: var(--r-card);
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          animation: toast-in 300ms ease forwards;
        }

        @keyframes toast-in {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }

        .toast-item.exiting {
          animation: toast-out 300ms ease forwards;
        }

        @keyframes toast-out {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(20px); }
        }

        .toast-content {
          padding: 12px 16px;
          flex: 1;
          display: flex;
          align-items: center;
          border-left: 4px solid transparent;
        }

        .toast-success .toast-content { border-left-color: var(--c-accent); }
        .toast-error .toast-content { border-left-color: #ef4444; } /* Red */
        .toast-info .toast-content { border-left-color: var(--c-muted); }

        .toast-progress-container {
          height: 3px;
          background: rgba(255,255,255,0.05);
          width: 100%;
        }

        .toast-progress-bar {
          height: 100%;
          background: currentColor;
          opacity: 0.3;
          width: 100%;
          transform-origin: left;
          animation: toast-progress 3500ms linear forwards;
        }

        @keyframes toast-progress {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }

        .toast-success { color: var(--c-accent); }
        .toast-error { color: #ef4444; }
        .toast-info { color: var(--c-muted); }
        
        .toast-message {
          color: var(--c-ink);
          font-weight: 500;
        }
      `}</style>
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<{ toast: Toast; onRemove: () => void }> = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onRemove, 300);
    }, 3500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onRemove]);

  return (
    <div className={`toast-item toast-${toast.type} ${isExiting ? 'exiting' : ''}`}>
      <div className="toast-content">
        <span className="toast-message">{toast.message}</span>
      </div>
      <div className="toast-progress-container">
        <div className="toast-progress-bar" />
      </div>
    </div>
  );
};

// --- TOOLTIP ---
interface TooltipProps {
    text: string;
    children: React.ReactNode;
    position?: 'top' | 'bottom';
}

export const Tooltip: React.FC<TooltipProps> = ({ text, children, position = 'top' }) => {
    return (
        <div className="group relative flex items-center justify-center">
            {children}
            <div className={`pointer-events-none absolute ${position === 'top' ? 'bottom-full mb-3' : 'top-full mt-3'} left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-[200] w-max max-w-[180px] scale-95 group-hover:scale-100`}>
                <div className="bg-zinc-900 border-2 border-pulse-500/40 px-3 py-2 rounded-lg shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-md relative">
                    <p className="text-[8px] font-black uppercase italic tracking-[0.15em] text-pulse-500 leading-relaxed text-center">
                        {text}
                    </p>
                    <div className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 border-r-2 border-b-2 border-pulse-500/40 rotate-45 ${position === 'top' ? '-bottom-1.5' : '-top-1.5'}`} />
                </div>
            </div>
        </div>
    );
};

// --- SKELETON FEED ---
export const SkeletonListRow: React.FC = () => (
  <div className="skeleton-row">
    <div className="skeleton-image-square" />
    <div className="skeleton-text-container">
      <div className="skeleton-text-line title-line" />
      <div className="skeleton-text-line snippet-line" />
    </div>
  </div>
);

export const SkeletonGridCard: React.FC = () => (
  <div className="skeleton-card">
    <div className="skeleton-image-full" />
    <div className="skeleton-text-container">
      <div className="skeleton-text-line title-line" />
      <div className="skeleton-text-line snippet-line" />
    </div>
  </div>
);

export const SkeletonFeaturedCard: React.FC = () => (
  <div className="skeleton-featured">
    <div className="skeleton-image-full featured-height" />
    <div className="skeleton-featured-overlay">
      <div className="skeleton-text-line title-line" />
      <div className="skeleton-text-line snippet-line" />
    </div>
  </div>
);

interface SkeletonFeedListProps {
  count?: number;
  view: 'list' | 'grid' | 'featured';
}

export const SkeletonFeedList: React.FC<SkeletonFeedListProps> = ({ count = 6, view }) => {
  const skeletons = Array.from({ length: count });

  return (
    <div className={`skeleton-feed-container ${view}-view`}>
      {skeletons.map((_, i) => {
        if (view === 'list') return <SkeletonListRow key={i} />;
        if (view === 'grid') return <SkeletonGridCard key={i} />;
        if (view === 'featured') return <SkeletonFeaturedCard key={i} />;
        return null;
      })}

      <style>{`
        .skeleton-feed-container {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .skeleton-feed-container.grid-view {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          padding: 16px;
        }

        .skeleton-feed-container.featured-view {
          padding: 16px;
        }

        .skeleton-row {
          display: flex;
          gap: 12px;
          padding: 14px 16px;
          border-bottom: 1px solid var(--c-border);
        }

        .skeleton-card {
          background: var(--c-elevated);
          border: 1px solid var(--c-border);
          border-radius: var(--r-card);
          overflow: hidden;
        }

        .skeleton-featured {
          position: relative;
          border-radius: var(--r-card);
          overflow: hidden;
          margin-bottom: 16px;
        }

        .skeleton-image-square {
          width: 56px;
          height: 56px;
          border-radius: 6px;
          background: var(--c-elevated);
          position: relative;
          overflow: hidden;
        }

        .skeleton-image-full {
          width: 100%;
          height: 160px;
          background: var(--c-elevated);
          position: relative;
          overflow: hidden;
        }

        .featured-height {
          height: 280px;
        }

        .skeleton-text-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 12px;
        }

        .skeleton-row .skeleton-text-container {
          padding: 0;
          justify-content: center;
        }

        .skeleton-text-line {
          height: 12px;
          background: var(--c-elevated);
          border-radius: 6px;
          position: relative;
          overflow: hidden;
        }

        .title-line { width: 70%; height: 14px; }
        .snippet-line { width: 45%; }

        .skeleton-featured-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 20px;
          background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .skeleton-image-square::after,
        .skeleton-image-full::after,
        .skeleton-text-line::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            var(--c-border) 50%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite linear;
        }

        @keyframes shimmer {
          from { background-position: -200% 0; }
          to { background-position: 200% 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .skeleton-image-square::after,
          .skeleton-image-full::after,
          .skeleton-text-line::after {
            animation: none;
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

// --- SMART FEED ICON ---
const colorToGradient: { [key: string]: string } = {
    'bg-red-500': 'bg-gradient-to-br from-red-500 to-red-600',
    'bg-orange-500': 'bg-gradient-to-br from-orange-500 to-orange-600',
    'bg-amber-500': 'bg-gradient-to-br from-amber-500 to-amber-600',
    'bg-yellow-500': 'bg-gradient-to-br from-yellow-500 to-yellow-600',
    'bg-lime-500': 'bg-gradient-to-br from-lime-500 to-lime-600',
    'bg-green-500': 'bg-gradient-to-br from-green-500 to-green-600',
    'bg-emerald-500': 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    'bg-teal-500': 'bg-gradient-to-br from-teal-500 to-teal-600',
    'bg-cyan-500': 'bg-gradient-to-br from-cyan-500 to-cyan-600',
    'bg-sky-500': 'bg-gradient-to-br from-sky-500 to-sky-600',
    'bg-blue-500': 'bg-gradient-to-br from-blue-500 to-blue-600',
    'bg-indigo-500': 'bg-gradient-to-br from-indigo-500 to-indigo-600',
    'bg-violet-500': 'bg-gradient-to-br from-violet-500 to-violet-600',
    'bg-purple-500': 'bg-gradient-to-br from-purple-500 to-purple-600',
    'bg-fuchsia-500': 'bg-gradient-to-br from-fuchsia-500 to-fuchsia-600',
    'bg-pink-500': 'bg-gradient-to-br from-pink-500 to-pink-600',
    'bg-rose-500': 'bg-gradient-to-br from-rose-500 to-rose-600'
};

const textShadowStyle = { textShadow: '1px 1px 3px rgba(0,0,0,0.2)' };

export const SmartFeedIcon: React.FC<{
    iconUrl: string;
    feedTitle: string;
    sourceType?: SourceType;
    className?: string;
}> = ({ iconUrl, feedTitle, sourceType, className = 'w-5 h-5' }) => {
    const [hasError, setHasError] = useState(false);

    if (hasError || !iconUrl) {
        const commonClasses = `${className} flex-shrink-0`;
        const IconWrapper: React.FC<{ children: React.ReactNode, gradient: string }> = ({ children, gradient }) => (
            <div className={`${commonClasses} ${gradient} flex items-center justify-center`}>
                {children}
            </div>
        );
        
        const iconSize = "w-3/5 h-3/5";

        switch (sourceType) {
            case 'reddit':
                return <IconWrapper gradient="bg-gradient-to-br from-orange-500 to-red-500"><RedditIcon className={`${iconSize} text-white`} /></IconWrapper>;
            case 'website':
                return <IconWrapper gradient="bg-gradient-to-br from-sky-500 to-blue-600"><GlobeAltIcon className={`${iconSize} text-white`} /></IconWrapper>;
            case 'rss':
            default:
                if (!feedTitle) {
                    return <IconWrapper gradient="bg-gradient-to-br from-zinc-400 to-zinc-500"><RssIcon className={`${iconSize} text-white`} /></IconWrapper>;
                }

                const colors = [
                    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
                    'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
                    'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
                    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
                    'bg-rose-500'
                ];

                let hash = 0;
                for (let i = 0; i < feedTitle.length; i++) {
                    hash = feedTitle.charCodeAt(i) + ((hash << 5) - hash);
                }
                const colorClass = colors[Math.abs(hash) % colors.length];
                const gradientClass = colorToGradient[colorClass] || 'bg-gradient-to-br from-zinc-400 to-zinc-500';
                const initial = feedTitle.charAt(0).toUpperCase();

                return (
                    <div className={`${commonClasses} flex items-center justify-center text-white font-bold ${gradientClass}`}>
                        <span style={textShadowStyle}>{initial}</span>
                    </div>
                );
        }
    }

    return <img src={iconUrl} alt={`${feedTitle} icon`} className={`${className} flex-shrink-0`} onError={() => setHasError(true)} aria-hidden="true" />;
};

// --- SUMMARY BUTTON ---
interface SummaryButtonProps {
  articleTitle: string;
  articleText: string;
}

export const SummaryButton: React.FC<SummaryButtonProps> = ({ articleTitle, articleText }) => {
  const [summary, setSummary] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSummarize = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await summarizeArticle(articleTitle, articleText);
      setSummary(result);
    } catch (err) {
      console.error('Failed to summarize:', err);
      setError('AI offline');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="summary-container">
      {!summary && (
        <button 
          className="void-btn summarize-button" 
          onClick={handleSummarize}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="spinner" />
          ) : (
            'SUMMARISE'
          )}
        </button>
      )}

      {error && <p className="error-text">{error}</p>}

      {summary && (
        <div className="summary-card animate-fade-in">
          <h4 className="summary-title">NUTRI-INSIGHT</h4>
          <ul className="summary-list">
            {summary.map((point, index) => (
              <li key={index} className="summary-item">
                <span className="bullet-dot" />
                <span className="summary-text">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <style>{`
        .summary-container {
          margin: 16px 0;
          width: 100%;
        }

        .summarize-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 120px;
          min-height: 36px;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.2);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 800ms linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          color: var(--c-muted);
          margin-top: 8px;
        }

        .summary-card {
          background: var(--c-elevated);
          border: 1px solid var(--c-border);
          border-radius: var(--r-card);
          padding: 16px;
          width: 100%;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .summary-title {
          font-family: 'Syne', sans-serif;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: var(--c-accent);
          margin-bottom: 12px;
          text-transform: uppercase;
        }

        .summary-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .summary-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .bullet-dot {
          width: 6px;
          height: 6px;
          background: var(--c-accent);
          border-radius: 50%;
          margin-top: 6px;
          flex-shrink: 0;
        }

        .summary-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          line-height: 1.4;
          color: var(--c-ink);
        }

        .animate-fade-in {
          animation: fade-in 400ms ease forwards;
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

// --- IMAGE WITH PROXY ---
interface ImageWithProxyProps {
    src: string | null;
    alt: string;
    className: string; 
    wrapperClassName?: string; 
    children?: React.ReactNode;
    fallback: React.ReactNode;
}

export const ImageWithProxy: React.FC<ImageWithProxyProps> = ({ src, alt, className, wrapperClassName, children, fallback }) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [error, setError] = useState(!src);
    const objectUrlRef = useRef<string | null>(null);

    useEffect(() => {
        if (!src) {
            setError(true);
            return;
        }

        let isMounted = true;
        setError(false);
        setImageSrc(null);
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
        }

        const fetchImage = async () => {
            try {
                const response = await resilientFetch(src, { timeout: 15000 });
                if (!response.ok) throw new Error(`Image fetch failed with status ${response.status}`);
                const blob = await response.blob();
                if (isMounted) {
                    const url = URL.createObjectURL(blob);
                    objectUrlRef.current = url;
                    setImageSrc(url);
                }
            } catch (e) {
                console.warn(`Failed to load image via proxy: ${src}`, e);
                if (isMounted) {
                    setError(true);
                }
            }
        };

        fetchImage();

        return () => {
            isMounted = false;
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
            }
        };
    }, [src]);

    if (error || !imageSrc) {
        return <div className={wrapperClassName}>{fallback}</div>;
    }

    return (
        <div className={wrapperClassName}>
            <img src={imageSrc} alt={alt} className={className} />
            {children}
        </div>
    );
};

// --- GLOBAL STATUS WIDGETS ---
interface GlobalStatusWidgetsProps {
    location?: string;
}

const LOCATIONS = ['NEON_CITY', 'VOID_SECTOR', 'TOKYO', 'LONDON', 'NEW_YORK', 'BERLIN'];

export const GlobalStatusWidgets: React.FC<GlobalStatusWidgetsProps> = ({ location = 'NEON_CITY' }) => {
    const [time, setTime] = useState(new Date());
    const [locationIndex, setLocationIndex] = useState(() => {
        const idx = LOCATIONS.indexOf(location);
        return idx !== -1 ? idx : 0;
    });
    const [weather, setWeather] = useState<{ temp: string; city: string; desc: string }>({ temp: '--', city: LOCATIONS[0], desc: 'SCANNING...' });
    const [sysLoad, setSysLoad] = useState(85);
    const [showLocationPicker, setShowLocationPicker] = useState(false);

    const currentLocation = LOCATIONS[locationIndex];

    const fetchWeather = useCallback(async (loc: string) => {
        try {
            const res = await fetch(`https://wttr.in/${encodeURIComponent(loc)}?format=j1`);
            if (res.ok) {
                const data = await res.json();
                const current = data?.current_condition?.[0];
                const area = data?.nearest_area?.[0];
                if (current && area) {
                    setWeather({
                        temp: `${current.temp_C}°C`,
                        city: area.areaName?.[0]?.value?.toUpperCase() || loc.toUpperCase(),
                        desc: current.weatherDesc?.[0]?.value?.toUpperCase() || 'SCANNING...'
                    });
                }
            }
        } catch (e) {
            console.warn('Weather fetch failed, using fallback.');
            setWeather(prev => ({ ...prev, city: loc.toUpperCase(), desc: 'OFFLINE' }));
        }
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
            setSysLoad(prev => Math.min(99, Math.max(70, prev + (Math.random() * 4 - 2))));
        }, 1000);

        fetchWeather(currentLocation);
        const weatherTimer = setInterval(() => fetchWeather(currentLocation), 600000);

        return () => {
            clearInterval(timer);
            clearInterval(weatherTimer);
        };
    }, [currentLocation, fetchWeather]);

    const timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const dateString = time.toLocaleDateString([], { month: 'short', day: 'numeric' }).toUpperCase();

    return (
        <div className="flex items-center gap-4 px-4 py-1.5 bg-app-bg/40 backdrop-blur-xl border-b border-white/5 text-[9px] font-black tracking-widest uppercase italic text-app-text/40 shrink-0 z-[70] relative overflow-visible transition-all duration-500">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20" />

            <div className="flex items-center gap-2 shrink-0 group cursor-default">
                <ClockIcon className="w-3 h-3 text-app-accent opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="flex flex-col leading-none">
                    <span className="text-app-text/80 tabular-nums text-[10px]">{timeString}</span>
                    <span className="text-[6px] opacity-40 font-bold">{dateString}</span>
                </div>
            </div>

            <div className="w-px h-4 bg-white/5 shrink-0" />

            <div className="relative shrink-0">
                <button 
                    onClick={() => setShowLocationPicker(!showLocationPicker)}
                    className="flex items-center gap-2 group hover:text-app-text transition-colors outline-none focus-visible:ring-1 focus-visible:ring-app-accent rounded-sm"
                >
                    <GlobeAltIcon className="w-3 h-3 text-app-accent opacity-50 group-hover:opacity-100 transition-opacity" />
                    <div className="flex flex-col leading-none text-left">
                        <div className="flex items-center gap-1">
                            <span className="text-app-text/80 text-[10px]">{weather.city}</span>
                            <ChevronDownIcon className={`w-2 h-2 transition-transform ${showLocationPicker ? 'rotate-180' : ''}`} />
                        </div>
                        <span className="text-[6px] opacity-40 lowercase tracking-normal truncate max-w-[60px]">{weather.desc}</span>
                    </div>
                    <span className="text-app-text/80 font-bold ml-1 text-[10px]">{weather.temp}</span>
                </button>

                {showLocationPicker && (
                    <div className="absolute top-full left-0 mt-2 w-32 bg-app-card border border-white/10 rounded-xl shadow-2xl backdrop-blur-2xl z-[80] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        {LOCATIONS.map((loc, idx) => (
                            <button
                                key={loc}
                                onClick={() => {
                                    setLocationIndex(idx);
                                    setShowLocationPicker(false);
                                }}
                                className={`w-full px-3 py-2 text-left text-[8px] font-black uppercase tracking-widest hover:bg-app-accent hover:text-app-on-accent transition-colors outline-none focus:bg-app-accent focus:text-app-on-accent ${locationIndex === idx ? 'text-app-accent' : 'text-app-text/60'}`}
                            >
                                {loc.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="hidden sm:block w-px h-4 bg-white/5 shrink-0" />

            <div className="hidden sm:flex items-center gap-2 shrink-0 group">
                <BoltIcon className="w-3 h-3 text-app-accent opacity-50 group-hover:animate-pulse" />
                <div className="flex flex-col leading-none">
                    <span className="text-app-text/80 text-[10px]">{sysLoad.toFixed(0)}%</span>
                    <span className="text-[6px] opacity-40 font-bold">CORE_LOAD</span>
                </div>
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity cursor-help">
                    <RadioIcon className="w-3 h-3 text-app-accent" />
                    <span className="hidden md:inline text-[8px]">UPLINK_STABLE</span>
                </div>
                <div className="flex items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity cursor-help">
                    <SparklesIcon className="w-3 h-3 text-app-accent" />
                    <span className="hidden md:inline text-[8px]">SYNC_12MS</span>
                </div>
            </div>
        </div>
    );
};
