
import React from 'react';

export const SeymourIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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

export const ControllerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.44 3.09c.38.16.7.4.94.73.22.3.36.64.44.99" />
      <path d="M19.13 6.64c.26.42.43.89.51 1.38" />
      <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      <path d="M12 12H4.87c.09-.5.26-1 .51-1.38" />
      <path d="M8.56 3.09c-.38.16-.7.4-.94.73-.22.3-.36.64-.44.99" />
      <path d="M12 12h7.13c-.08-.5-.26-.99-.5-1.38" />
      <path d="M12 12v7.13c.5 0 .99-.17 1.38-.51" />
      <path d="M12 12v-7.13c-.5-.01-1 .16-1.38.51" />
      <path d="m15 13-1-1-1 1" />
      <path d="m9 13 1-1 1 1" />
    </svg>
);

export const KeypadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <line x1="9" y1="8" x2="9.01" y2="8"/>
        <line x1="15" y1="8" x2="15.01" y2="8"/>
        <line x1="9" y1="12" x2="9.01" y2="12"/>
        <line x1="15" y1="12" x2="15.01" y2="12"/>
        <line x1="9" y1="16" x2="9.01" y2="16"/>
        <line x1="15" y1="16" x2="15.01" y2="16"/>
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

export const RedditIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M12,20c-4.41,0-8-3.59-8-8s3.59-8,8-8 s8,3.59,8,8S16.41,20,12,20z M12.5,9.5C12.5,8.67,11.83,8,11,8s-1.5,0.67-1.5,1.5S10.17,11,11,11S12.5,10.33,12.5,9.5z M16,12 c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S17.1,12,16,12z M8,12c-1.1,0-2,0.9-2,2s0.9,2,2,2s2-0.9,2-2S9.1,12,8,12z M12,16.5 c-2.28,0-4.25-1.44-5.12-3.41c-0.12-0.28,0.04-0.6,0.32-0.72c0.28-0.12,0.6,0.04,0.72,0.32C8.67,14.28,10.21,15.5,12,15.5 c1.79,0,3.33-1.22,4.08-2.81c0.12-0.28,0.44-0.44,0.72-0.32c0.28,0.12,0.44,0.44,0.32,0.72C16.25,15.06,14.28,16.5,12,16.5z"/>
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

export const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

export const MenuIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

export const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

export const ArrowPathIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.18-3.185m-3.18-3.182l-3.182-3.182a8.25 8.25 0 00-11.664 0l-3.18 3.185" />
    </svg>
);

export const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const SunIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path clipRule="evenodd" fillRule="evenodd" d="M12 16.5a4.5 4.5 0 100-9 4.5 4.5 0 000 9zM12 15a3 3 0 100-6 3 3 0 000 6z"></path>
      <path d="M12 1.5a.75.75 0 01.75.75V4.5a.75.75 0 01-1.5 0V2.25A.75.75 0 0112 1.5zM12 19.5a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V20.25a.75.75 0 01.75-.75zM4.929 4.929a.75.75 0 011.06 0l1.591 1.591a.75.75 0 11-1.06 1.06L4.93 5.99a.75.75 0 010-1.06zM17.48 17.48a.75.75 0 011.06 0l1.591 1.591a.75.75 0 11-1.06 1.06l-1.591-1.59a.75.75 0 010-1.061zM1.5 12a.75.75 0 01.75-.75h2.25a.75.75 0 010 1.5H2.25A.75.75 0 011.5 12zM19.5 12a.75.75 0 01.75-.75h2.25a.75.75 0 010 1.5H20.25a.75.75 0 01-.75-.75zM5.99 19.071a.75.75 0 010-1.06l1.59-1.591a.75.75 0 011.061 1.06l-1.59 1.591a.75.75 0 01-1.06 0zM18.54 5.99a.75.75 0 010-1.06l1.59-1.591a.75.75 0 111.06 1.06l-1.59 1.591a.75.75 0 01-1.06 0z"></path>
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
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.528 14.288a.75.75 0 00-.916.347 7.5 7.5 0 01-9.473-9.473.75.75 0 00.346-.916A9.001 9.001 0 003 12c0 4.97 4.03 9 9 9 4.103 0 7.584-2.755 8.653-6.528a.75.75 0 00-.125-.184z"></path>
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

export const UserCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
  
export const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 2