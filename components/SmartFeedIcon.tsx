import React, { useState } from 'react';
import { SourceType } from './AddSource';
import { RssIcon, RedditIcon, YoutubeIcon, GlobeAltIcon } from './icons';

// Mapping single colors to richer gradients for a more polished look.
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

    // If the image fails to load or there's no URL, render a high-quality fallback.
    if (hasError || !iconUrl) {
        const commonClasses = `${className} flex-shrink-0`;

        // A reusable wrapper for icons that applies a gradient and centers the content.
        const IconWrapper: React.FC<{ children: React.ReactNode, gradient: string }> = ({ children, gradient }) => (
            <div className={`${commonClasses} ${gradient} flex items-center justify-center`}>
                {children}
            </div>
        );
        
        const iconSize = "w-3/5 h-3/5";

        switch (sourceType) {
            case 'reddit':
                return <IconWrapper gradient="bg-gradient-to-br from-orange-500 to-red-500"><RedditIcon className={`${iconSize} text-white`} /></IconWrapper>;
            case 'youtube':
                return <IconWrapper gradient="bg-gradient-to-br from-red-500 to-red-700"><YoutubeIcon className={`${iconSize} text-white`} /></IconWrapper>;
            case 'website':
                return <IconWrapper gradient="bg-gradient-to-br from-sky-500 to-blue-600"><GlobeAltIcon className={`${iconSize} text-white`} /></IconWrapper>;
            case 'rss':
            default:
                if (!feedTitle) {
                    return <IconWrapper gradient="bg-gradient-to-br from-zinc-400 to-zinc-500"><RssIcon className={`${iconSize} text-white`} /></IconWrapper>;
                }

                // Generate a consistent, vibrant color from the feed title.
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

                // Render the initial with a subtle shadow for better readability and depth.
                return (
                    <div className={`${commonClasses} flex items-center justify-center text-white font-bold ${gradientClass}`}>
                        <span style={textShadowStyle}>{initial}</span>
                    </div>
                );
        }
    }

    // If the image exists and loads correctly, display it.
    return <img src={iconUrl} alt={`${feedTitle} icon`} className={`${className} flex-shrink-0`} onError={() => setHasError(true)} aria-hidden="true" />;
};
