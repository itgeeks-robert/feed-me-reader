import React from 'react';
import type { Selection } from '../src/App';

interface NavPage {
    selection: Selection;
    name: string;
    icon: React.ReactNode;
}

interface TopNavBarProps {
    pages: NavPage[];
    currentPageIndex: number;
    onNavigate: (index: number) => void;
}

const TopNavBar: React.FC<TopNavBarProps> = ({ pages, currentPageIndex, onNavigate }) => {
    return (
        <nav className="fixed top-20 left-4 right-4 z-30 md:hidden">
            <div className="h-14 bg-white/50 dark:bg-zinc-900/60 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-lg">
                <div className="flex justify-around items-center h-full overflow-x-auto scrollbar-hide px-2">
                    {pages.map((page, index) => (
                        <button
                            key={page.name}
                            title={page.name}
                            onClick={() => onNavigate(index)}
                            className={`relative flex items-center justify-center h-full px-4 transition-colors group ${
                                currentPageIndex === index
                                    ? 'text-orange-600 dark:text-orange-400'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                            }`}
                            aria-label={page.name}
                        >
                            {React.cloneElement(page.icon as React.ReactElement, { className: "w-7 h-7" })}
                            <span
                                className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-8 rounded-full bg-orange-500 transition-transform duration-300 ease-in-out ${
                                    currentPageIndex === index ? 'scale-x-100' : 'scale-x-0'
                                } group-hover:scale-x-50`}
                            />
                        </button>
                    ))}
                </div>
            </div>
        </nav>
    );
};

export default TopNavBar;