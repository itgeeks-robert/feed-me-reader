import React, { useState, useEffect, useCallback } from 'react';
import { ClockIcon, BoltIcon, RadioIcon, GlobeAltIcon, SparklesIcon, ChevronDownIcon } from './icons';

interface GlobalStatusWidgetsProps {
    location?: string;
}

const LOCATIONS = ['NEON_CITY', 'VOID_SECTOR', 'TOKYO', 'LONDON', 'NEW_YORK', 'BERLIN'];

const GlobalStatusWidgets: React.FC<GlobalStatusWidgetsProps> = ({ location = 'NEON_CITY' }) => {
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
            {/* Subtle scanline effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20" />

            {/* Time Widget */}
            <div className="flex items-center gap-2 shrink-0 group cursor-default">
                <ClockIcon className="w-3 h-3 text-app-accent opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="flex flex-col leading-none">
                    <span className="text-app-text/80 tabular-nums text-[10px]">{timeString}</span>
                    <span className="text-[6px] opacity-40 font-bold">{dateString}</span>
                </div>
            </div>

            <div className="w-px h-4 bg-white/5 shrink-0" />

            {/* Weather / Location Widget */}
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

            {/* System Status */}
            <div className="hidden sm:flex items-center gap-2 shrink-0 group">
                <BoltIcon className="w-3 h-3 text-app-accent opacity-50 group-hover:animate-pulse" />
                <div className="flex flex-col leading-none">
                    <span className="text-app-text/80 text-[10px]">{sysLoad.toFixed(0)}%</span>
                    <span className="text-[6px] opacity-40 font-bold">CORE_LOAD</span>
                </div>
            </div>

            <div className="flex-1" />

            {/* Connectivity */}
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

export default GlobalStatusWidgets;
