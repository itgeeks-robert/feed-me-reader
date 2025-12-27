
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { XIcon, SparklesIcon } from './icons';
import { GameboyControls, GameboyButton } from './GameboyControls';
import { saveHighScore } from '../services/highScoresService';

// --- Types & Constants ---
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'NONE';
type GameState = 'INTRO' | 'STORY' | 'PLAYING' | 'WON' | 'LOST' | 'FINAL';

const TILE_SIZE = 24;
const SPEED = 4;
const GHOST_FRIGHT_TIME = 8000;

// --- Vector Narrative Art Components ---

const HeartIcon: React.FC<{ filled: boolean; animated?: boolean }> = ({ filled, animated }) => (
    <svg 
        className={`w-5 h-5 transition-all duration-500 ${filled ? 'text-pulse-500 drop-shadow-[0_0_8px_#e11d48]' : 'text-zinc-800'} ${animated && !filled ? 'animate-bounce' : ''}`} 
        viewBox="0 0 24 24" 
        fill={filled ? "currentColor" : "none"} 
        stroke="currentColor" 
        strokeWidth="2"
    >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
);

const SceneWrapper: React.FC<{ children: React.ReactNode; color: string; label: string }> = ({ children, color, label }) => (
    <div className="w-full h-full relative overflow-hidden bg-[#050101] flex items-center justify-center border-b-2" style={{ borderColor: color }}>
        {children}
        <div className="absolute inset-0 cctv-overlay opacity-20 pointer-events-none" />
        <div className="absolute top-3 left-3 flex items-center gap-2 opacity-60">
            <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_5px_red]" />
            <span className="text-[7px] font-mono text-white uppercase tracking-[0.3em] font-black">{label}</span>
        </div>
        <div className="absolute bottom-2 right-3 opacity-30">
            <span className="text-[6px] font-mono text-white uppercase tracking-widest">HKS-84.0092</span>
        </div>
    </div>
);

const Sector1Art = () => (
    <SceneWrapper color="#e11d48" label="ARCADE_BREACH">
        <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
                <radialGradient id="floorGlow" cx="50%" cy="100%" r="60%">
                    <stop offset="0%" stopColor="#e11d48" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#000" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="screenGlowMain" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#e11d48" stopOpacity="0.8" />
                    <stop offset="70%" stopColor="#e11d48" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#000" stopOpacity="0" />
                </radialGradient>
            </defs>
            <rect x="0" y="0" width="200" height="200" fill="#0a0303" />
            <rect x="0" y="160" width="200" height="40" fill="url(#floorGlow)" />
            <path d="M20 200 Q 60 180 100 190 T 180 200" fill="none" stroke="#000" strokeWidth="2" opacity="0.8" />
            <path d="M40 200 Q 80 190 120 195 T 190 205" fill="none" stroke="#000" strokeWidth="1.5" opacity="0.6" />
            <g transform="translate(0, 5)">
                <path d="M65 40 L135 40 L138 170 L62 170 Z" fill="#111" />
                <path d="M65 40 L135 40 L135 65 L65 65 Z" fill="#1a1a1a" />
                <rect x="72" y="70" width="56" height="42" fill="#000" rx="1" />
                <rect x="68" y="65" width="64" height="52" fill="url(#screenGlowMain)" className="animate-pulse" />
                <g className="font-mono text-[7px] font-black fill-[#ffcbd1]" transform="translate(100, 88)">
                    <text x="0" y="0" textAnchor="middle" className="uppercase tracking-tighter shadow-lg">CRITICAL</text>
                    <text x="0" y="8" textAnchor="middle" className="uppercase tracking-tighter shadow-lg">FAILURE</text>
                </g>
                <path d="M62 115 L138 115 L142 130 L58 130 Z" fill="#151515" />
                <circle cx="85" cy="122" r="2" fill="#e11d48" opacity="0.6" />
                <circle cx="115" cy="122" r="2" fill="#e11d48" opacity="0.6" />
            </g>
            <path d="M40 200 Q 55 140 70 200 Z" fill="#050101" />
            <circle cx="55" cy="145" r="7" fill="#050101" />
            <path d="M85 180 Q 100 135 115 180 Z" fill="#050101" />
            <circle cx="100" cy="140" r="6" fill="#050101" />
            <path d="M130 200 Q 145 135 160 200 Z" fill="#050101" />
            <circle cx="145" cy="140" r="8" fill="#050101" />
            <rect x="0" y="0" width="200" height="200" fill="#e11d48" opacity="0.03" className="animate-pulse" />
        </svg>
    </SceneWrapper>
);

const Sector2Art = () => (
    <SceneWrapper color="#22c55e" label="SUBSTATION_02">
        <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
                <radialGradient id="greenGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#051a05" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="mist" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#051a05" stopOpacity="0.8" />
                    <stop offset="60%" stopColor="#22c55e" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#000" stopOpacity="1" />
                </linearGradient>
            </defs>
            <rect x="0" y="0" width="200" height="200" fill="#051a05" />
            <circle cx="100" cy="80" r="70" fill="url(#greenGlow)" className="animate-pulse" />
            <g transform="translate(0, 10)" opacity="0.9">
                <rect x="150" y="40" width="5" height="100" fill="#000" />
                <rect x="165" y="20" width="3" height="120" fill="#000" />
                <rect x="40" y="60" width="4" height="80" fill="#000" />
                <rect x="70" y="90" width="60" height="50" fill="#000" />
                <rect x="85" y="65" width="30" height="25" fill="#000" />
                <rect x="95" y="70" width="10" height="4" fill="#22c55e" className="animate-pulse" opacity="0.8" />
                <circle cx="100" cy="110" r="2" fill="#22c55e" opacity="0.4" />
                <path d="M20 90 V 160 M 15 105 H 25" stroke="#000" strokeWidth="1" />
                <path d="M180 90 V 160 M 175 105 H 185" stroke="#000" strokeWidth="1" />
            </g>
            <rect x="0" y="0" width="200" height="200" fill="url(#mist)" opacity="0.8" />
            <path d="M0 170 Q 100 160 200 175 V 200 H 0 Z" fill="#000" />
            <g transform="translate(25, 155) scale(0.55)">
                <circle cx="20" cy="30" r="12" stroke="#000" fill="none" strokeWidth="3" />
                <circle cx="60" cy="30" r="12" stroke="#000" fill="none" strokeWidth="3" />
                <path d="M20 30 L40 10 L60 30 M40 10 L40 -5 M32 -5 H48" stroke="#000" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            </g>
            <g transform="translate(85, 158) scale(0.55)">
                <circle cx="20" cy="30" r="12" stroke="#000" fill="none" strokeWidth="3" />
                <circle cx="60" cy="30" r="12" stroke="#000" fill="none" strokeWidth="3" />
                <path d="M20 30 L40 10 L60 30 M40 10 L40 -5 M32 -5 H48" stroke="#000" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            </g>
            <g transform="translate(145, 155) scale(0.55)">
                <circle cx="20" cy="30" r="12" stroke="#000" fill="none" strokeWidth="3" />
                <circle cx="60" cy="30" r="12" stroke="#000" fill="none" strokeWidth="3" />
                <path d="M20 30 L40 10 L60 30 M40 10 L40 -5 M32 -5 H48" stroke="#000" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            </g>
            <rect x="0" y="0" width="200" height="200" fill="#22c55e" opacity="0.04" className="animate-pulse" />
        </svg>
    </SceneWrapper>
);

const Sector3Art = () => (
    <SceneWrapper color="#e11d48" label="VOID_GATEWAY">
        <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
                <radialGradient id="portalGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ff4d4d" stopOpacity="0.9" />
                    <stop offset="40%" stopColor="#e11d48" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#000" stopOpacity="0" />
                </radialGradient>
            </defs>
            <rect width="200" height="200" fill="#0d0404" />
            <g fill="#050101">
                <path d="M40 200 Q 20 100 90 30 L 95 35 Q 30 105 45 200 Z" />
                <path d="M25 200 Q 5 80 80 15 L 85 20 Q 15 85 30 200 Z" opacity="0.8" />
                <path d="M60 200 Q 50 120 85 60 L 88 63 Q 55 125 65 200 Z" opacity="0.6" />
            </g>
            <g fill="#050101">
                <path d="M160 200 Q 180 100 110 30 L 105 35 Q 170 105 155 200 Z" />
                <path d="M175 200 Q 195 80 120 15 L 115 20 Q 185 85 170 200 Z" opacity="0.8" />
                <path d="M140 200 Q 150 120 115 60 L 112 63 Q 145 125 135 200 Z" opacity="0.6" />
            </g>
            <circle cx="100" cy="100" r="70" fill="url(#portalGlow)" className="animate-pulse" />
            <path d="M100 30 L104 60 L96 85 L108 110 L94 140 L102 170 L98 140 L106 110 L92 85 L100 60 Z" fill="#ff9da5" className="animate-pulse" style={{ filter: 'drop-shadow(0 0 5px #ff0000)' }} />
            <g fill="#fff">
                <rect x="95" y="45" width="2" height="2" opacity="0.4" className="animate-bounce" />
                <rect x="108" y="130" width="1.5" height="1.5" opacity="0.3" className="animate-pulse" />
                <rect x="88" y="90" width="2" height="2" opacity="0.2" />
                <rect x="115" y="70" width="1" height="1" opacity="0.5" className="animate-ping" />
            </g>
            <path d="M0 185 Q 100 170 200 190 V 200 H 0 Z" fill="#080101" />
            <path d="M40 200 L 100 175 L 160 200 Z" fill="#150505" opacity="0.4" />
        </svg>
    </SceneWrapper>
);

const Sector4Art = () => (
    <SceneWrapper color="#a855f7" label="RECON_VAN">
        <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
                <radialGradient id="purpleAmbient" cx="50%" cy="30%" r="80%">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#050101" stopOpacity="0.8" />
                </radialGradient>
                <radialGradient id="crtGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#c084fc" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                </radialGradient>
            </defs>
            <rect width="200" height="200" fill="#080105" />
            <rect width="200" height="200" fill="url(#purpleAmbient)" />
            <path d="M5 40 L45 55 L45 130 L5 145 Z" fill="#020108" opacity="0.9" />
            <path d="M155 55 L195 40 L195 145 L155 130 Z" fill="#020108" opacity="0.9" />
            <circle cx="15" cy="80" r="1" fill="#fff" opacity="0.2" />
            <circle cx="185" cy="70" r="1" fill="#fff" opacity="0.2" />
            <rect x="40" y="115" width="120" height="5" fill="#1a1a1a" />
            <rect x="75" y="75" width="50" height="40" fill="#111" rx="2" />
            <rect x="78" y="78" width="44" height="34" fill="#000" rx="1" />
            <rect x="78" y="78" width="44" height="34" fill="url(#crtGlow)" opacity="0.3" className="animate-pulse" />
            <g stroke="#c084fc" strokeWidth="0.5" opacity="0.4">
                <path d="M85 85 L115 105 M90 100 L110 80" />
                <circle cx="100" cy="92" r="2" fill="#c084fc" className="animate-ping" />
            </g>
            <rect x="85" y="45" width="30" height="25" fill="#111" rx="1" />
            <rect x="87" y="47" width="26" height="21" fill="#000" />
            <rect x="87" y="47" width="26" height="21" fill="url(#crtGlow)" opacity="0.2" />
            <g fill="#c084fc" opacity="0.5">
                <rect x="90" y="52" width="10" height="1" />
                <rect x="90" y="55" width="15" height="1" />
                <rect x="90" y="58" width="8" height="1" />
            </g>
            <rect x="130" y="85" width="30" height="25" fill="#111" rx="1" />
            <rect x="132" y="87" width="26" height="21" fill="#000" />
            <rect x="132" y="87" width="26" height="21" fill="url(#crtGlow)" opacity="0.2" />
            <path d="M125 115 Q 140 130 160 115" fill="none" stroke="#000" strokeWidth="1" />
            <rect x="55" y="110" width="4" height="6" fill="#111" />
            <g transform="translate(45, 125)">
                <path d="M0 75 Q 15 10 30 75 Z" fill="#050101" />
                <circle cx="15" cy="15" r="12" fill="#050101" />
            </g>
            <g transform="translate(125, 125)">
                <path d="M0 75 Q 15 10 30 75 Z" fill="#050101" />
                <circle cx="15" cy="15" r="13" fill="#050101" />
            </g>
            <ellipse cx="100" cy="5" rx="40" ry="10" fill="#a855f7" opacity="0.1" />
        </svg>
    </SceneWrapper>
);

const Sector5Art = () => (
    <SceneWrapper color="#ef4444" label="MAINFRAME_BUNKER">
        <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
                <radialGradient id="mainframeRedGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#050101" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="reelGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#555" />
                    <stop offset="50%" stopColor="#222" />
                    <stop offset="100%" stopColor="#333" />
                </linearGradient>
            </defs>
            <rect width="200" height="200" fill="#0a0202" />
            <rect width="200" height="200" fill="url(#mainframeRedGlow)" className="animate-pulse" />
            <g transform="translate(35, 15)">
                <rect x="0" y="0" width="130" height="150" fill="#111" stroke="#222" strokeWidth="1" />
                <rect x="5" y="5" width="120" height="35" fill="#050505" rx="1" />
                {[20, 45, 70, 95, 110].map((x, i) => (
                    <g key={i} transform={`translate(${x}, 22)`}>
                        <circle r="8" fill="url(#reelGradient)" />
                        <circle r="2" fill="#000" />
                        <g className="animate-spin" style={{ transformOrigin: 'center', animationDuration: i % 2 === 0 ? '4s' : '3s' }}>
                            <path d="M-6 0 L6 0 M0 -6 L0 6" stroke="#444" strokeWidth="0.5" />
                        </g>
                    </g>
                ))}
                <rect x="5" y="45" width="120" height="20" fill="#080808" />
                {[20, 40, 60, 80, 100].map((x, i) => (
                    <g key={i} transform={`translate(${x}, 55)`}>
                        <circle r="4" fill="#111" stroke="#333" strokeWidth="0.5" />
                        <path d="M0 0 L 2 -3" stroke="#ef4444" strokeWidth="0.5" className="animate-pulse" />
                    </g>
                ))}
                <g transform="translate(5, 70)">
                    {Array.from({ length: 12 }).map((_, r) => (
                        <g key={r} transform={`translate(0, ${r * 5})`}>
                            {Array.from({ length: 24 }).map((_, c) => {
                                const isLit = Math.random() > 0.4;
                                return (
                                    <rect 
                                        key={c} 
                                        x={c * 5} 
                                        y={0} 
                                        width="3" 
                                        height="3" 
                                        fill={isLit ? "#f59e0b" : "#1a1a1a"} 
                                        opacity={isLit ? 0.8 : 0.3}
                                        className={isLit ? "animate-pulse" : ""}
                                        style={{ animationDelay: `${Math.random() * 2}s` }}
                                    />
                                );
                            })}
                        </g>
                    ))}
                </g>
            </g>
            <g transform="translate(120, 160)">
                <rect x="0" y="0" width="60" height="30" fill="#111" rx="1" />
                <rect x="10" y="-15" width="35" height="25" fill="#1a1a1a" rx="2" />
                <rect x="13" y="-12" width="29" height="19" fill="#000" rx="1" />
                <rect x="15" y="-10" width="15" height="2" fill="#22c55e" opacity="0.6" className="animate-pulse" />
                <rect x="15" y="-6" width="20" height="1" fill="#22c55e" opacity="0.3" />
                <rect x="15" y="-4" width="10" height="1" fill="#22c55e" opacity="0.4" />
            </g>
            <rect x="40" y="0" width="30" height="22" fill="#fff" opacity="0.2" />
            <rect x="130" y="0" width="40" height="2" fill="#fff" opacity="0.2" />
        </svg>
    </SceneWrapper>
);

const Sector6Art = () => (
    <SceneWrapper color="#06b6d4" label="DATA_STREAM">
        <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
                <radialGradient id="gridGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#050101" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="cubeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="1" />
                    <stop offset="100%" stopColor="#0891b2" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="cubeMagenta" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ec4899" stopOpacity="1" />
                    <stop offset="100%" stopColor="#be123c" stopOpacity="0.8" />
                </linearGradient>
            </defs>
            <rect width="200" height="200" fill="#050101" />
            <circle cx="100" cy="110" r="100" fill="url(#gridGlow)" opacity="0.3" />
            <g stroke="#06b6d4" strokeWidth="0.5" opacity="0.4">
                {[110, 120, 135, 155, 185, 220].map((y, i) => (<line key={i} x1="0" y1={y} x2="200" y2={y} />))}
                {Array.from({ length: 11 }).map((_, i) => {
                    const xOffset = (i - 5) * 40;
                    return <line key={i} x1="100" y1="100" x2={100 + xOffset} y2="200" />;
                })}
            </g>
            <g transform="translate(140, 105) scale(1.2)" className="animate-bounce" style={{ animationDuration: '3s' }}>
                <path d="M0 10 L15 5 L30 10 L30 25 L15 30 L0 25 Z" fill="#0891b2" opacity="0.4" />
                <path d="M0 10 L15 5 L30 10 L15 15 Z" fill="url(#cubeGradient)" />
                <path d="M0 10 L15 15 L15 30 L0 25 Z" fill="#06b6d4" opacity="0.8" />
                <path d="M15 15 L30 10 L30 25 L15 30 Z" fill="#0e7490" />
            </g>
            <g transform="translate(50, 95) rotate(-15)" className="animate-pulse">
                <path d="M0 8 L10 4 L20 8 L20 20 L10 24 L0 20 Z" fill="#be123c" opacity="0.4" />
                <path d="M0 8 L10 4 L20 8 L10 12 Z" fill="url(#cubeMagenta)" />
                <path d="M0 8 L10 12 L10 24 L0 20 Z" fill="#ec4899" opacity="0.8" />
                <path d="M10 12 L20 8 L20 20 L10 24 Z" fill="#9d174d" />
            </g>
        </svg>
    </SceneWrapper>
);

const Sector7Art = () => (
    <SceneWrapper color="#ef4444" label="THE_CORE_EYE">
        <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
                <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#000" stopOpacity="0" />
                </radialGradient>
            </defs>
            <rect width="200" height="200" fill="#050101" />
            <g stroke="#ef4444" strokeWidth="0.5" opacity="0.4">
                {Array.from({ length: 48 }).map((_, i) => {
                    const angle = (i / 48) * Math.PI * 2;
                    const len = 100 + Math.random() * 100;
                    return <line key={i} x1="100" y1="100" x2={100 + Math.cos(angle) * len} y2={100 + Math.sin(angle) * len} className="animate-pulse" />;
                })}
            </g>
            <circle cx="100" cy="100" r="55" fill="url(#coreGlow)" className="animate-pulse" />
            <circle cx="100" cy="100" r="32" fill="#000" />
        </svg>
    </SceneWrapper>
);

const VictoryArt = () => (
    <SceneWrapper color="#fbbf24" label="HAWKINS_DAWN">
        <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
                <linearGradient id="sunsetSky" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#d97706" />
                    <stop offset="40%" stopColor="#f59e0b" />
                    <stop offset="70%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#fef3c7" />
                </linearGradient>
                <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fffbeb" stopOpacity="1" />
                    <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                </radialGradient>
            </defs>
            <rect width="200" height="200" fill="url(#sunsetSky)" />
            <circle cx="100" cy="120" r="35" fill="#fffbeb" />
            <path d="M0 130 L40 120 L80 135 L120 115 L160 140 L200 125 V200 H0 Z" fill="#4d7c0f" opacity="0.6" />
            <path d="M85 200 L98 120 L102 120 L115 200 Z" fill="#78350f" opacity="0.3" />
            <path d="M0 160 H200 V200 H0 Z" fill="#3f6212" />
        </svg>
    </SceneWrapper>
);

const LEVELS = [
  { name: 'LOCAL NETWORK', wallColor: '#166534', dotColor: '#22c55e', bonus: '🔋', story: "The arcade went cold. Sam, Leo, and Maya watched as the high-score board dissolved into red static. This wasn't a glitch. The Void was here.", art: <Sector1Art /> },
  { name: 'SUB-STATION 02', wallColor: '#166534', dotColor: '#22c55e', bonus: '⚡', story: "Sam's walkie-talkie picked up a frequency from the power station. 'It's feeding on the town grid,' Maya whispered. They grabbed their bikes and rode into the fog.", art: <Sector2Art /> },
  { name: 'VOID GATEWAY', wallColor: '#166534', dotColor: '#22c55e', bonus: '📟', story: "The pavement cracked open. Reality felt thin. The kids reached the edge of the woods where the sky turned a bruised purple. The first Sentinel appeared.", art: <Sector3Art /> },
  { name: 'RECON DATASET', wallColor: '#166534', dotColor: '#22c55e', bonus: '💾', story: "The trio found the missing research van. Inside, blueprints of the 'Inverted Realm' lay scattered. They aren't just invading—they're rewriting our history.", art: <Sector4Art /> },
  { name: 'FIREBASE ZERO', wallColor: '#166534', dotColor: '#22c55e', bonus: '📼', story: "They infiltrated the restricted base. Leo held the door as Maya hot-wired the Interceptor Terminal. They needed to take the fight into the code itself.", art: <Sector5Art /> },
  { name: 'ETHEREAL NODE', wallColor: '#166534', dotColor: '#22c55e', bonus: '💠', story: "Everything turned weightless. The kids were no longer in the physical world. They were drifting through the data stream, chasing a signal to the Core.", art: <Sector6Art /> },
  { name: 'THE CORE', wallColor: '#166534', dotColor: '#22c55e', bonus: '👁️', story: "The Shattered Core. The source of the infection. A massive geometric eye loomed over them. 'Don't look away,' Sam shouted. 'Finish the sequence!'", art: <Sector7Art /> },
  { name: 'TOTAL SYSTEM', wallColor: '#166534', dotColor: '#22c55e', bonus: '☀️', story: "This is it. The final upload. If they clear this sector, the Void collapses. The town is depending on three kids and a stolen interceptor.", art: <VictoryArt /> }
];

const MAZE_LAYOUT = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,2,1],
    [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
    [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
    [1,1,1,1,0,1,1,1,5,1,5,1,1,1,0,1,1,1,1],
    [5,5,5,1,0,1,5,5,5,5,5,5,5,1,0,1,5,5,5],
    [1,1,1,1,0,1,5,1,1,3,1,1,5,1,0,1,1,1,1],
    [5,5,5,5,0,5,5,1,5,5,5,1,5,5,0,5,5,5,5], 
    [1,1,1,1,0,1,5,1,1,1,1,1,5,1,0,1,1,1,1],
    [5,5,5,1,0,1,5,5,5,4,5,5,5,1,0,1,5,5,5],
    [1,1,1,1,0,1,5,1,1,1,1,1,5,1,0,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
    [1,2,0,1,0,0,0,0,0,5,0,0,0,0,0,1,0,2,1],
    [1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1],
    [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
    [1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const ROWS = MAZE_LAYOUT.length;
const COLS = MAZE_LAYOUT[0].length;

const VoidRunnerPage: React.FC<{ onBackToHub: () => void; onReturnToFeeds: () => void }> = ({ onBackToHub, onReturnToFeeds }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<GameState>('INTRO');
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(0);
    const [lives, setLives] = useState(3);
    const [initials, setInitials] = useState("");
    const [activeLevel, setActiveLevel] = useState(LEVELS[0]);
    const [showBonus, setShowBonus] = useState(false);

    const keysPressed = useRef<Set<string>>(new Set());
    const player = useRef({ x: 9 * TILE_SIZE + TILE_SIZE/2, y: 15 * TILE_SIZE + TILE_SIZE/2, dir: 'NONE' as Direction, nextDir: 'NONE' as Direction, rotation: 0, ping: 0 });
    const ghosts = useRef([
        { x: 9 * TILE_SIZE + TILE_SIZE/2, y: 8 * TILE_SIZE + TILE_SIZE/2, color: '#00ff41', dir: 'UP' as Direction, state: 'NORMAL' as 'NORMAL' | 'FRIGHTENED' | 'EATEN', personality: 'CHASE' },
        { x: 9 * TILE_SIZE + TILE_SIZE/2, y: 9 * TILE_SIZE + TILE_SIZE/2, color: '#00ff41', dir: 'UP' as Direction, state: 'NORMAL', personality: 'AMBUSH' },
        { x: 8 * TILE_SIZE + TILE_SIZE/2, y: 9 * TILE_SIZE + TILE_SIZE/2, color: '#00ff41', dir: 'UP' as Direction, state: 'NORMAL', personality: 'RANDOM' },
        { x: 10 * TILE_SIZE + TILE_SIZE/2, y: 9 * TILE_SIZE + TILE_SIZE/2, color: '#00ff41', dir: 'UP' as Direction, state: 'NORMAL', personality: 'SHY' },
    ]);
    const dots = useRef<boolean[][]>([]);
    const powerPellets = useRef<boolean[][]>([]);
    const frightTimer = useRef<number | null>(null);

    const isWall = (tx: number, ty: number, forPlayer = true) => {
        if (ty === 9 && (tx < 0 || tx >= COLS)) return false;
        if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) return true;
        const tile = MAZE_LAYOUT[ty][tx];
        return tile === 1 || (tile === 3 && forPlayer);
    };

    const resetBoard = useCallback(() => {
        dots.current = MAZE_LAYOUT.map(row => row.map(tile => tile === 0));
        powerPellets.current = MAZE_LAYOUT.map(row => row.map(tile => tile === 2));
        player.current = { x: 9 * TILE_SIZE + TILE_SIZE/2, y: 15 * TILE_SIZE + TILE_SIZE/2, dir: 'NONE', nextDir: 'NONE', rotation: 0, ping: 0 };
        ghosts.current.forEach((g, i) => {
            g.x = (9 + (i % 2 === 0 ? -1 : 1) * Math.floor(i/2)) * TILE_SIZE + TILE_SIZE/2;
            g.y = 9 * TILE_SIZE + TILE_SIZE/2;
            g.state = 'NORMAL';
            g.dir = 'UP';
        });
        setShowBonus(false);
        setTimeout(() => setShowBonus(true), 15000);
    }, []);

    const startLevel = useCallback((lvlIdx: number) => {
        if (lvlIdx >= LEVELS.length) { setGameState('FINAL'); return; }
        setLevel(lvlIdx);
        setActiveLevel(LEVELS[lvlIdx]);
        resetBoard();
        setGameState('PLAYING');
    }, [resetBoard]);

    const handleSaveScore = () => {
        saveHighScore('void_runner', {
            name: initials.toUpperCase() || "???",
            score: score,
            displayValue: score.toLocaleString(),
            date: new Date().toISOString()
        });
        onBackToHub();
    };

    useEffect(() => {
        if (gameState !== 'PLAYING') return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        let frameId: number;
        const update = () => {
            const p = player.current;
            p.ping = (p.ping + 0.1) % 1;
            const atCenter = p.x % TILE_SIZE === TILE_SIZE / 2 && p.y % TILE_SIZE === TILE_SIZE / 2;
            if (atCenter) {
                const tx = Math.floor(p.x / TILE_SIZE); const ty = Math.floor(p.y / TILE_SIZE);
                let requestedDir: Direction = 'NONE';
                if (keysPressed.current.has('UP')) requestedDir = 'UP';
                else if (keysPressed.current.has('DOWN')) requestedDir = 'DOWN';
                else if (keysPressed.current.has('LEFT')) requestedDir = 'LEFT';
                else if (keysPressed.current.has('RIGHT')) requestedDir = 'RIGHT';

                if (requestedDir !== 'NONE') {
                    let nx = tx, ny = ty;
                    if (requestedDir === 'UP') ny--; else if (requestedDir === 'DOWN') ny++; else if (requestedDir === 'LEFT') nx--; else if (requestedDir === 'RIGHT') nx++;
                    if (!isWall(nx, ny, true)) p.dir = requestedDir;
                } else {
                    let nx = tx, ny = ty;
                    if (p.dir === 'UP') ny--; else if (p.dir === 'DOWN') ny++; else if (p.dir === 'LEFT') nx--; else if (p.dir === 'RIGHT') nx++;
                    if (isWall(nx, ny, true)) p.dir = 'NONE';
                }

                if (dots.current[ty]?.[tx]) { dots.current[ty][tx] = false; setScore(s => s + 10); }
                if (powerPellets.current[ty]?.[tx]) {
                    powerPellets.current[ty][tx] = false; setScore(s => s + 50);
                    ghosts.current.forEach(g => { if (g.state !== 'EATEN') g.state = 'FRIGHTENED'; });
                    if (frightTimer.current) clearTimeout(frightTimer.current);
                    frightTimer.current = window.setTimeout(() => {
                        ghosts.current.forEach(g => { if (g.state === 'FRIGHTENED') g.state = 'NORMAL'; });
                    }, GHOST_FRIGHT_TIME);
                }
                if (showBonus && ty === 11 && tx === 9) { setShowBonus(false); setScore(s => s + 500); }
            }

            if (p.dir === 'UP') { p.y -= SPEED; p.rotation = -Math.PI/2; }
            else if (p.dir === 'DOWN') { p.y += SPEED; p.rotation = Math.PI/2; }
            else if (p.dir === 'LEFT') { p.x -= SPEED; p.rotation = Math.PI; }
            else if (p.dir === 'RIGHT') { p.x += SPEED; p.rotation = 0; }

            if (p.x < -TILE_SIZE/2) p.x = canvas.width + TILE_SIZE/2;
            if (p.x > canvas.width + TILE_SIZE/2) p.x = -TILE_SIZE/2;

            ghosts.current.forEach(g => {
                const gAtCenter = g.x % TILE_SIZE === TILE_SIZE / 2 && g.y % TILE_SIZE === TILE_SIZE / 2;
                if (g.state === 'EATEN') {
                    const homeX = 9 * TILE_SIZE + TILE_SIZE/2; const homeY = 9 * TILE_SIZE + TILE_SIZE/2;
                    if (Math.abs(g.x - homeX) < 5 && Math.abs(g.y - homeY) < 5) g.state = 'NORMAL';
                    g.x += (homeX - g.x) * 0.15; g.y += (homeY - g.y) * 0.15;
                } else if (gAtCenter) {
                    const tx = Math.floor(g.x / TILE_SIZE); const ty = Math.floor(g.y / TILE_SIZE);
                    const ptx = Math.floor(p.x / TILE_SIZE); const pty = Math.floor(p.y / TILE_SIZE);
                    const target = g.state === 'FRIGHTENED' ? { tx: Math.random() * COLS, ty: Math.random() * ROWS } : { tx: ptx, ty: pty };
                    const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
                    const opposites: Record<Direction, Direction> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT', NONE: 'NONE' };
                    const validDirs = directions.filter(d => d !== opposites[g.dir] && !isWall(tx + (d==='LEFT'?-1:d==='RIGHT'?1:0), ty + (d==='UP'?-1:d==='DOWN'?1:0), false));
                    if (validDirs.length > 0) {
                        validDirs.sort((a, b) => {
                            const d = (dir: Direction) => Math.sqrt((tx + (dir==='LEFT'?-1:dir==='RIGHT'?1:0) - target.tx)**2 + (ty + (dir==='UP'?-1:dir==='DOWN'?1:0) - target.ty)**2);
                            return d(a) - d(b);
                        });
                        g.dir = validDirs[0];
                    } else g.dir = opposites[g.dir];
                }
                const gSpeed = g.state === 'FRIGHTENED' ? SPEED * 0.5 : SPEED * (0.7 + (level * 0.05));
                if (g.state !== 'EATEN') {
                    if (g.dir === 'UP') g.y -= gSpeed; else if (g.dir === 'DOWN') g.y += gSpeed; else if (g.dir === 'LEFT') g.x -= gSpeed; else if (g.dir === 'RIGHT') g.x += gSpeed;
                }
                if (Math.sqrt((p.x - g.x)**2 + (p.y - g.y)**2) < TILE_SIZE * 0.7) {
                    if (g.state === 'FRIGHTENED') { g.state = 'EATEN'; setScore(s => s + 200); }
                    else if (g.state === 'NORMAL') setLives(l => { if (l <= 1) setGameState('LOST'); else resetBoard(); return l - 1; });
                }
            });

            if (dots.current.flat().filter(d => d).length === 0 && powerPellets.current.flat().filter(p => p).length === 0) {
                setGameState('STORY'); setLevel(prev => prev + 1);
            }
        };

        const draw = () => {
            ctx.fillStyle = '#050101'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            // CRT Lines & HUD
            ctx.strokeStyle = 'rgba(0, 255, 65, 0.05)'; ctx.lineWidth = 1;
            for(let i=0; i<COLS; i++) { ctx.beginPath(); ctx.moveTo(i*TILE_SIZE, 0); ctx.lineTo(i*TILE_SIZE, canvas.height); ctx.stroke(); }
            for(let i=0; i<ROWS; i++) { ctx.beginPath(); ctx.moveTo(0, i*TILE_SIZE); ctx.lineTo(canvas.width, i*TILE_SIZE); ctx.stroke(); }
            
            MAZE_LAYOUT.forEach((row, y) => {
                row.forEach((tile, x) => {
                    if (tile === 1) { ctx.strokeStyle = '#064e3b'; ctx.lineWidth = 1; ctx.strokeRect(x * TILE_SIZE + 4, y * TILE_SIZE + 4, TILE_SIZE - 8, TILE_SIZE - 8); }
                    if (dots.current[y]?.[x]) { ctx.fillStyle = '#14532d'; ctx.beginPath(); ctx.arc(x * TILE_SIZE + TILE_SIZE/2, y * TILE_SIZE + TILE_SIZE/2, 1.5, 0, Math.PI*2); ctx.fill(); }
                    if (powerPellets.current[y]?.[x]) {
                        ctx.fillStyle = '#22c55e'; ctx.shadowBlur = 10; ctx.shadowColor = '#22c55e';
                        ctx.beginPath(); ctx.arc(x * TILE_SIZE + TILE_SIZE/2, y * TILE_SIZE + TILE_SIZE/2, 3.5, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
                    }
                });
            });

            if (showBonus) { 
                ctx.fillStyle = '#fbbf24'; ctx.font = '16px monospace'; ctx.textAlign = 'center';
                ctx.fillText(activeLevel.bonus, 9 * TILE_SIZE + TILE_SIZE/2, 11 * TILE_SIZE + TILE_SIZE/2); 
            }

            // Draw Anomalies (Ghosts)
            ghosts.current.forEach(g => {
                const isFright = g.state === 'FRIGHTENED';
                ctx.save(); ctx.translate(g.x, g.y);
                if (g.state === 'EATEN') {
                    ctx.strokeStyle = 'rgba(0, 255, 65, 0.3)'; ctx.strokeRect(-5, -5, 10, 10);
                } else {
                    ctx.fillStyle = isFright ? '#fb7185' : '#00ff41';
                    ctx.globalAlpha = 0.6 + Math.random() * 0.4;
                    ctx.shadowBlur = 15; ctx.shadowColor = ctx.fillStyle as string;
                    // Glitchy Hexagon
                    ctx.beginPath();
                    for (let i = 0; i < 6; i++) {
                        const angle = (i / 6) * Math.PI * 2;
                        const rx = Math.cos(angle) * (8 + Math.random() * 2);
                        const ry = Math.sin(angle) * (8 + Math.random() * 2);
                        if (i === 0) ctx.moveTo(rx, ry); else ctx.lineTo(rx, ry);
                    }
                    ctx.closePath(); ctx.fill();
                    // Technical Overlay
                    ctx.strokeStyle = 'white'; ctx.lineWidth = 0.5;
                    ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(12, 0); ctx.moveTo(0, -12); ctx.lineTo(0, 12); ctx.stroke();
                }
                ctx.restore();
            });

            // Draw Target (Player)
            const p = player.current;
            ctx.save(); ctx.translate(p.x, p.y);
            ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1.5;
            ctx.shadowBlur = 10; ctx.shadowColor = '#ef4444';
            // Crosshair
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI*2);
            ctx.moveTo(-15, 0); ctx.lineTo(-5, 0); ctx.moveTo(15, 0); ctx.lineTo(5, 0);
            ctx.moveTo(0, -15); ctx.lineTo(0, -5); ctx.moveTo(0, 15); ctx.lineTo(0, 5);
            ctx.stroke();
            // Ping ring
            ctx.beginPath(); ctx.arc(0, 0, 10 + p.ping * 20, 0, Math.PI*2);
            ctx.strokeStyle = `rgba(239, 68, 68, ${1 - p.ping})`; ctx.stroke();
            // Center Dot
            ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI*2); ctx.fill();
            // Label
            ctx.fillStyle = 'white'; ctx.font = '8px monospace'; ctx.fillText('TRK_01', 12, -12);
            ctx.restore();

            // Screen HUD
            ctx.fillStyle = '#00ff41'; ctx.font = '7px monospace'; ctx.textAlign = 'left';
            ctx.fillText(`AZIMUTH: ${Math.floor(p.x)}`, 10, 15);
            ctx.fillText(`RANGE: ${Math.floor(p.y)}`, 10, 25);
            ctx.fillText('STATUS: AUTO_TRACK', 10, 35);
            ctx.textAlign = 'right';
            ctx.fillText(`SCORE: ${score.toString().padStart(6, '0')}`, canvas.width - 10, 15);
        };
        const loop = () => { update(); draw(); frameId = requestAnimationFrame(loop); };
        loop(); return () => cancelAnimationFrame(frameId);
    }, [gameState, level, activeLevel, showBonus, resetBoard, score]);

    const handleInput = (btn: GameboyButton, isPress: boolean) => {
        if (isPress) {
            if (btn === 'start') {
                if (gameState === 'INTRO') setGameState('STORY');
                else if (gameState === 'STORY') startLevel(level);
                else if (gameState === 'FINAL') onBackToHub();
                return;
            }
            if (btn === 'up') keysPressed.current.add('UP');
            if (btn === 'down') keysPressed.current.add('DOWN');
            if (btn === 'left') keysPressed.current.add('LEFT');
            if (btn === 'right') keysPressed.current.add('RIGHT');
        } else {
            if (btn === 'up') keysPressed.current.delete('UP');
            if (btn === 'down') keysPressed.current.delete('DOWN');
            if (btn === 'left') keysPressed.current.delete('LEFT');
            if (btn === 'right') keysPressed.current.delete('RIGHT');
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowUp') handleInput('up', true);
            if (e.key === 'ArrowDown') handleInput('down', true);
            if (e.key === 'ArrowLeft') handleInput('left', true);
            if (e.key === 'ArrowRight') handleInput('right', true);
            if (e.key === 'Enter') handleInput('start', true);
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'ArrowUp') handleInput('up', false);
            if (e.key === 'ArrowDown') handleInput('down', false);
            if (e.key === 'ArrowLeft') handleInput('left', false);
            if (e.key === 'ArrowRight') handleInput('right', false);
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
    }, [gameState, level]);

    return (
        <main className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-4 overflow-hidden font-mono">
            <style>{`
                .game-canvas { image-rendering: pixelated; box-shadow: 0 0 40px rgba(0, 255, 65, 0.15); border: 1px solid rgba(0, 255, 65, 0.2); }
                .crt::after { content: " "; display: block; position: absolute; top: 0; left: 0; bottom: 0; right: 0; background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03)); z-index: 2; pointer-events: none; background-size: 100% 2px, 3px 100%; }
            `}</style>
            
            <div className="max-w-xl w-full flex flex-col gap-4">
                <header className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-3xl border border-white/5 flex-shrink-0">
                    <button onClick={onBackToHub} className="p-2 bg-zinc-800 rounded-xl text-zinc-400 hover:text-flesh-500 transition-colors"><XIcon className="w-6 h-6" /></button>
                    <div className="text-center">
                        <span className="text-[10px] font-black uppercase text-plant-500 tracking-[0.3em] block">Target Identification</span>
                        <div className="flex items-center gap-1 justify-center mt-1">
                            {[1, 2, 3].map(i => <HeartIcon key={i} filled={lives >= i} />)}
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-[8px] font-black uppercase text-zinc-500 block">Sector</span>
                        <span className="text-lg font-black text-yellow-400 font-mono">{level + 1}</span>
                    </div>
                </header>

                <div className="relative flex justify-center bg-black p-2 rounded-2xl border-4 border-zinc-800 crt overflow-hidden min-h-[420px]">
                    {gameState === 'INTRO' && (
                        <div className="h-[420px] w-full flex flex-col items-center justify-center text-center p-8 gap-6 animate-fade-in bg-zinc-900/40">
                            <div className="w-20 h-20 bg-zinc-800 border-2 border-plant-500 flex items-center justify-center rounded-full animate-pulse shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                                <SparklesIcon className="w-12 h-12 text-plant-500" />
                            </div>
                            <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">VOID RUNNER</h2>
                            <p className="text-zinc-500 text-[10px] uppercase tracking-widest leading-loose text-center">ANOMALOUS ACTIVITY DETECTED.<br/>HAWKINS SECTOR 08.<br/>INITIATE TARGET TRACKING.</p>
                            <button onClick={() => setGameState('STORY')} className="w-full max-w-xs py-4 bg-plant-600 text-black font-black uppercase italic rounded-full shadow-xl hover:scale-105 transition-transform border-b-4 border-plant-800">Establish Link</button>
                        </div>
                    )}

                    {gameState === 'STORY' && (
                        <div className="h-[420px] w-full flex flex-col p-6 gap-6 overflow-y-auto scrollbar-hide text-center justify-center animate-fade-in bg-zinc-900/40">
                            <div className="w-full h-[200px] flex-shrink-0">
                                {LEVELS[level % LEVELS.length].art}
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-plant-500 uppercase tracking-[0.2em] italic">Intelligence Log: Sector {level + 1}</h3>
                                <p className="text-xs text-zinc-300 leading-relaxed font-mono uppercase tracking-wide px-4 italic">{LEVELS[level % LEVELS.length].story}</p>
                                <button onClick={() => startLevel(level)} className="px-8 py-3 bg-white text-black font-black uppercase italic text-xs rounded-full hover:scale-105 transition-transform shadow-lg">Begin Navigation</button>
                            </div>
                        </div>
                    )}

                    {gameState === 'PLAYING' && (
                        <canvas ref={canvasRef} width={COLS * TILE_SIZE} height={ROWS * TILE_SIZE} className="game-canvas max-w-full" />
                    )}

                    {gameState === 'FINAL' && (
                        <div className="h-[420px] w-full flex flex-col items-center justify-center text-center p-8 gap-8 animate-fade-in bg-zinc-900/40">
                            <div className="w-full h-[200px] flex-shrink-0"><VictoryArt /></div>
                            <div>
                                <h2 className="text-3xl font-black text-plant-500 italic uppercase tracking-tighter">THE VOID COLLAPSED</h2>
                                <p className="text-zinc-400 text-xs mt-4 leading-relaxed font-mono italic px-4">The signal stabilized. The anomalies dissipated. Hawkins is quiet... for now.</p>
                            </div>
                            <button onClick={onBackToHub} className="px-10 py-4 bg-plant-600 text-black font-black uppercase italic rounded-full shadow-xl border-b-4 border-plant-800">Return to Feed Pit</button>
                        </div>
                    )}
                </div>

                <div className="md:hidden">
                    <GameboyControls onButtonPress={(btn) => handleInput(btn, true)} onButtonRelease={(btn) => handleInput(btn, false)} />
                </div>
                <div className="hidden md:flex justify-center text-[8px] font-black text-zinc-700 uppercase tracking-[0.6em] animate-pulse">
                    SIGNAL STATUS: STABLE // AUTO-RECORD ON
                </div>
            </div>

            {gameState === 'LOST' && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-6 text-center">
                    <div className="max-w-sm w-full bg-zinc-900 p-12 rounded-[3rem] border-4 border-flesh-600 shadow-[0_0_100px_rgba(236,72,153,0.3)] relative overflow-hidden">
                        <div className="absolute inset-0 static-noise opacity-5 pointer-events-none" />
                        <h2 className="text-5xl font-black italic uppercase tracking-tighter text-flesh-500 mb-4 relative z-10">LOST SIGNAL</h2>
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-8 relative z-10">Connection severed. Archive lost.</p>
                        <input autoFocus maxLength={3} value={initials} onChange={e => setInitials(e.target.value.toUpperCase())} className="bg-black/50 border-2 border-flesh-500 text-flesh-500 rounded-xl px-4 py-3 text-center text-2xl font-black w-32 outline-none uppercase italic mb-8 relative z-10 shadow-inner" placeholder="???" />
                        <button onClick={handleSaveScore} className="w-full py-5 bg-flesh-600 text-white font-black text-xl italic uppercase rounded-full shadow-2xl hover:bg-flesh-500 transition-colors relative z-10">Post Log</button>
                    </div>
                </div>
            )}
        </main>
    );
};

export default VoidRunnerPage;
