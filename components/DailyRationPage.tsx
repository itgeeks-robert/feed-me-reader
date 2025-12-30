import React, { useState, useEffect } from 'react';
import type { Feed, Article } from '../src/App';
import { WalkieTalkieIcon, RadioIcon, EntityIcon, SparklesIcon, ChevronRightIcon } from './icons';
import { resilientFetch } from '../services/fetch';
import { parseRssXml } from '../services/rssParser';
import FeaturedStory from './articles/FeaturedStory';
import ReaderViewModal from './ReaderViewModal';

interface DailyRationPageProps {
    feeds: Feed[];
    fertilizer: number;
    onComplete: () => void;
    onEnterArcade: () => void;
    onSelectGame: (id: string) => void;
}

const DailyRationPage: React.FC<DailyRationPageProps> = ({ feeds, fertilizer, onComplete, onEnterArcade, onSelectGame }) => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [readerArticle, setReaderArticle] = useState<Article | null>(null);

    useEffect(() => {
        const fetchRation = async () => {
            setLoading(true);
            const rationFeeds = feeds.slice(0, 3);
            const promises = rationFeeds.map(f => 
                resilientFetch(f.url)
                    .then(res => res.text())
                    .then(xml => parseRssXml(xml, f.title, f.url))
                    .catch(() => [])
            );
            const results = await Promise.all(promises);
            const flat = results.flat().sort((a, b) => (b.publishedDate?.getTime() || 0) - (a.publishedDate?.getTime() || 0));
            setArticles(flat.slice(0, 5));
            setLoading(false);
        };
        fetchRation();
    }, [feeds]);

    const daysSinceEpoch = Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24));
    const isCryptDone = !!localStorage.getItem(`spore_crypt_${daysSinceEpoch}`);

    return (
        <main className="h-full w-full bg-void-950 overflow-y-auto p-6 md:p-20 relative scrollbar-hide font-horror pb-40">
            <div className="max-w-4xl mx-auto">
                <header className="mb-12 md:mb-20 border-b-4 border-pulse-500 pb-8 md:pb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div>
                        <div className="flex items-center gap-4 mb-6">
                             <RadioIcon className="w-8 h-8 md:w-10 md:h-10 text-pulse-500 animate-pulse" />
                             <span className="text-[10px] md:text-xs font-black uppercase text-pulse-500 tracking-[0.5em] font-mono">CHANNEL FREQ: 104.5</span>
                        </div>
                        <h1 className="text-3xl md:text-6xl font-black text-white italic tracking-tighter leading-none glitch-text">SURVEILLANCE LOG</h1>
                        <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs md:text-sm mt-4 font-mono">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} // TOP SECRET</p>
                    </div>
                    <div className="bg-void-900 p-4 md:p-6 border-2 border-pulse-500/20 shadow-[6px_6px_0px_#180202]">
                        <span className="text-[9px] md:text-xs font-black text-zinc-500 uppercase tracking-widest block mb-2 font-mono">Psychic Synchronization</span>
                        <div className="w-32 md:w-48 h-2 md:h-3 bg-black rounded-none overflow-hidden border border-pulse-500/30">
                            <div className="h-full bg-pulse-500 shadow-[0_0_15px_#e11d48]" style={{ width: `${fertilizer}%` }} />
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-12 md:gap-20">
                    <section className="space-y-10 md:space-y-16">
                        <div className="flex items-center gap-4 border-l-4 border-pulse-500 pl-4 md:pl-6">
                            <h2 className="text-xs md:text-sm font-black text-white italic uppercase tracking-tighter">Intercepted Frequency Signals</h2>
                        </div>
                        
                        {loading ? (
                            <div className="space-y-6">
                                {[...Array(2)].map((_, i) => (
                                    <div key={i} className="h-40 bg-void-900 border-2 border-zinc-800 animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-10 md:space-y-16">
                                {articles.map(article => (
                                    <div key={article.id} className="relative group">
                                        {/* Fix: Replaced onMarkAsRead with onReadExternal to match FeaturedStory component interface */}
                                        <FeaturedStory 
                                            article={article} 
                                            onReadHere={() => setReaderArticle(article)} 
                                            onReadExternal={() => window.open(article.link, '_blank')}
                                            isRead={false} 
                                        />
                                    </div>
                                ))}
                                
                                <div className="pt-10 flex justify-center">
                                    <button 
                                        onClick={onComplete}
                                        className="group flex items-center gap-4 px-12 py-5 bg-white text-black font-black uppercase italic text-sm tracking-widest hover:bg-pulse-500 hover:text-white transition-all shadow-[8px_8px_0px_#e11d48]"
                                    >
                                        <span>Return to Main Signal</span>
                                        <ChevronRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-2" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>

                    <aside className="space-y-12 md:space-y-20">
                         <div className={`p-8 md:p-10 border-2 border-pulse-500/50 transition-all relative overflow-hidden ${isCryptDone ? 'bg-void-900 border-zinc-800 opacity-60' : 'bg-void-900 border-pulse-500 shadow-[10px_10px_0px_#e11d48]'}`}>
                            <WalkieTalkieIcon className={`w-12 h-12 md:w-16 md:h-16 mb-6 ${isCryptDone ? 'text-zinc-800' : 'text-pulse-500'}`} />
                            <h3 className="text-xl md:text-3xl font-black text-white italic uppercase tracking-tighter leading-none mb-2 md:mb-3">Signal Crypt</h3>
                            <p className="text-[10px] md:text-xs text-zinc-500 uppercase font-bold tracking-widest mb-8 font-mono">Daily Decryption Routine</p>
                            
                            {isCryptDone ? (
                                <p className="text-pulse-500 font-black italic uppercase text-sm md:text-lg">Signal Decoded</p>
                            ) : (
                                <button 
                                    onClick={() => onSelectGame('spore-crypt')}
                                    className="w-full py-4 md:py-6 bg-pulse-500 text-white font-black uppercase italic rounded-none hover:bg-white hover:text-black transition-all shadow-[4px_4px_0px_white] text-xs md:text-sm tracking-widest"
                                >
                                    Intercept Now
                                </button>
                            )}
                        </div>

                        <div className="bg-void-900 p-8 md:p-10 border-2 border-zinc-800 shadow-[10px_10px_0px_rgba(0,0,0,0.5)]">
                             <h3 className="text-lg md:text-2xl font-black text-white italic uppercase tracking-tighter mb-3">The Dark Arcade</h3>
                             <p className="text-xs md:text-sm text-zinc-500 font-mono mb-10 leading-relaxed uppercase">Simulation Active. Awaiting Host.</p>
                             <button 
                                onClick={onEnterArcade}
                                className="w-full py-4 md:py-6 bg-white text-black font-black uppercase italic rounded-none hover:bg-pulse-500 hover:text-white transition-all text-xs md:text-sm tracking-widest"
                             >
                                Enter The Void
                             </button>
                        </div>
                    </aside>
                </div>
            </div>
            {readerArticle && (
                /* Fix: Added missing onOpenExternal prop to ReaderViewModal to match its required interface */
                <ReaderViewModal 
                    article={readerArticle} 
                    onClose={() => setReaderArticle(null)} 
                    onMarkAsRead={() => {}} 
                    onOpenExternal={(url) => window.open(url, '_blank')}
                />
            )}
        </main>
    );
};

export default DailyRationPage;