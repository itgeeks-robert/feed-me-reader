
import React from 'react';

export const SeymourIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <g stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Pot */}
            <path d="M30 75H50L55 60H25L30 75Z" fill="#A0522D"/>
            <path d="M24 60H56V55H24V60Z" fill="#8B4513"/>

            {/* Stem */}
            <path d="M40 60C35 50 45 45 42 35 C40 28 35 25 38 20" fill="none" stroke="#2E7D32" strokeWidth="4"/>
            {/* Thorns */}
            <path d="M41 48L44 46" stroke="#2E7D32" strokeWidth="1.5"/>
            <path d="M38 38L35 36" stroke="#2E7D32" strokeWidth="1.5"/>
            <path d="M39 28L42 26" stroke="#2E7D32" strokeWidth="1.5"/>
            
            {/* Leaves behind head */}
            <path d="M40 10 L50 2 L55 12 L65 5 L68 18 L78 15 L75 28 L65 25 L60 35 L50 28 Z" fill="#FDD835"/>
            
            {/* Head */}
            <path d="M38 20 C10 15 10 45 35 48 C55 52 65 35 60 20 C50 10 45 12 38 20 Z" fill="#66BB6A"/>
            
            {/* Lips */}
            <path d="M20 38 C30 45 50 48 58 40 C55 45 35 48 20 38 Z" fill="#D4E157"/>

            {/* Mouth Interior and Teeth */}
            <g>
                <path d="M25 35 C35 40 50 42 55 36 C50 38 35 40 28 35Z" fill="#424242"/>
                {/* Teeth */}
                <path d="M28 35.5 L30 38 L32 35.5" stroke="white" strokeWidth="0.5" fill="white"/>
                <path d="M33 36 L35 38.5 L37 36" stroke="white" strokeWidth="0.5" fill="white"/>
                <path d="M38 36.5 L40 39 L42 36.5" stroke="white" strokeWidth="0.5" fill="white"/>
                <path d="M43 37 L45 39.5 L47 37" stroke="white" strokeWidth="0.5" fill="white"/>
            </g>

            {/* Eye */}
            <path d="M25 25 C 30 22 38 25 38 25" fill="none" strokeWidth="1.5"/>

            {/* Blood drip */}
            <path d="M21 39 C 21 45 18 45 18 42 C18 45 15 45 15 39" fill="#E53935" stroke="#c62828"/>
        </g>
    </svg>
);

export const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
);

export const RssIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.73 0 14 6.27 14 14M6 13a7 7 0 017 7" />
        <circle cx="6" cy="18" r="1" fill="currentColor" />
    </svg>
);

export const YoutubeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M21.582,6.186c-0.23-0.86-0.908-1.538-1.768-1.768C18.254,4,12,4,12,4S5.746,4,4.186,4.418 c-0.86,0.23-1.538,0.908-1.768,1.768C2,7.746,2,12,2,12s0,4.254,0.418,5.814c0.23,0.86,0.908,1.538,1.768,1.768 C5.746,20,12,20,12,20s6.254,0,7.814-0.418c0.861-0.23,1.538-0.908,1.768-1.768C22,16.254,22,12,22,12S22,7.746,21.582,6.186z M10,15.464V8.536L16,12L10,15.464z" />
    </svg>
);

export const GlobeAltIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m0 0a9 9 0 019-9m-9 9a9 9 0 009 9" />
    </svg>
);

export const ListIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

export const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export const FolderIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
);

export const PencilIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
    </svg>
);

export const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

export const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

export const XIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const BookmarkIcon: React.FC<{ className?: string; solid?: boolean; }> = ({ className, solid = false }) => (
  <svg className={className} fill={solid ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
  </svg>
);

export const LogoutIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

export const CloudSyncIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6h.1a5 5 0 011 9.9M12 11v6m0 0l-2-2m2 2l2-2" />
    </svg>
);

export const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const LoginIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
    </svg>
);

export const GoogleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.223 0-9.641-3.356-11.303-7.918l-6.522 5.023C9.505 39.556 16.227 44 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 35.846 44 30.138 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
);

export const MenuIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

export const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.293 2.293a1 1 0 010 1.414L10 16l-4 4-4-4 5.293-5.293a1 1 0 011.414 0L13 14m3-3l4 4-4 4-1.414-1.414a1 1 0 010-1.414l2.293-2.293m-3.586 3.586l-2.293-2.293" />
    </svg>
);

export const ViewColumnsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 4h6a2 2 0 012 2v12a2 2 0 01-2 2H9a2 2 0 01-2-2V6a2 2 0 012-2zM5 12h14" />
  </svg>
);

export const ViewListIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

export const ViewGridIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

export const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

export const ArrowUturnLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
    </svg>
);

export const TagIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5a2 2 0 012 2v5a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zM12 12l-4 4m0 0l4 4" />
    </svg>
);

export const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const CloudIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.99A5.002 5.002 0 1012 5a4 4 0 00-9 10z" />
    </svg>
);

export const SunIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

export const ShareIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8m-4-6l-4-4m0 0L8 6m4-4v12" />
    </svg>
);

export const DotsHorizontalIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01" />
    </svg>
);

export const CloudArrowDownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a4 4 0 01-4-4V7a4 4 0 014-4h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

export const MoonIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
);

export const DayWeatherBackground: React.FC = () => (
    <svg width="100%" height="100%" viewBox="0 0 160 96" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="daySky" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#76b8f2" />
                <stop offset="100%" stopColor="#f0e6d2" />
            </linearGradient>
            <radialGradient id="sunGlow">
                <stop offset="10%" stopColor="white" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
            </radialGradient>
        </defs>
        <rect width="160" height="96" fill="url(#daySky)" />
        <circle cx="40" cy="45" r="30" fill="url(#sunGlow)" />
        <circle cx="40" cy="45" r="12" fill="#fff5d1" />
        <path d="M -10 80 C 40 60, 80 75, 120 65, 170 55, 170 96, 170 96 L -10 96 Z" fill="#6b7f94" opacity="0.5" />
        <path d="M -10 85 C 50 70, 100 85, 140 80, 180 75, 180 96, 180 96 L -10 96 Z" fill="#596d82" opacity="0.7" />
        <path d="M -10 96 L 170 96 L 170 90 C 120 80, 80 92, 40 88, 0 85, -10 92, -10 92 Z" fill="#475a70" />
    </svg>
);

export const NightWeatherBackground: React.FC = () => (
    <svg width="100%" height="100%" viewBox="0 0 160 96" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="nightSkyMature" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#020817" />
                <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <filter id="moonGlow">
                <feGaussianBlur stdDeviation="1.5" />
            </filter>
        </defs>
        <rect width="160" height="96" fill="url(#nightSkyMature)" />
        <g fill="white">
            <circle cx="20" cy="20" r="0.5" opacity="0.8"/>
            <circle cx="45" cy="35" r="0.4" opacity="0.6"/>
            <circle cx="60" cy="15" r="0.6" opacity="0.9"/>
            <circle cx="85" cy="40" r="0.5" opacity="0.7"/>
            <circle cx="100" cy="10" r="0.3" opacity="0.5"/>
            <circle cx="120" cy="25" r="0.55" opacity="0.8"/>
            <circle cx="140" cy="30" r="0.45" opacity="0.7"/>
            <circle cx="150" cy="50" r="0.4" opacity="0.6"/>
            <circle cx="15" cy="55" r="0.5" opacity="0.9"/>
            <circle cx="90" cy="60" r="0.45" opacity="0.8"/>
            <circle cx="33" cy="65" r="0.3" opacity="0.5"/>
            <circle cx="130" cy="70" r="0.5" opacity="0.7"/>
            <circle cx="75" cy="5" r="0.4" opacity="0.6"/>
        </g>
        <g transform="translate(120, 30)">
            <circle cx="0" cy="0" r="10" fill="#fefce8" filter="url(#moonGlow)" opacity="0.5"/>
            <path d="M 0 -12 A 12 12 0 1 0 0 12 A 8 8 0 1 1 0 -12 Z" fill="#fefce8" />
        </g>
        <path d="M -10 96 L 170 96 L 170 88 C 120 80, 80 92, 40 88, 0 85, -10 92, -10 92 Z" fill="#0f172a" />
    </svg>
);

export const SunriseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 18H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5 18C5 14.134 8.13401 11 12 11C15.866 11 19 14.134 19 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 5V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4.92969 8.92969L7.05097 11.051" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M19.0703 8.92969L16.949 11.051" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export const SunsetIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 18H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10.1504 15.8496C7.90483 14.843 6 12.6075 6 10C6 6.68629 8.68629 4 12 4C13.5663 4 15.0134 4.59013 16.126 5.5862" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M19 18C19 16.2163 18.293 14.562 17.1107 13.3893" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
