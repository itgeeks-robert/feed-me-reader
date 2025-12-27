
import React, { useState, useEffect } from 'react';
import type { Feed, Article } from '../src/App';
import { WalkieTalkieIcon, RadioIcon, EntityIcon, SparklesIcon } from './icons';
import { resilientFetch } from '../services/fetch';
import { parseRssXml } from '../services/rssParser';
import FeaturedStory from './articles/FeaturedStory';
import ReaderViewModal from './ReaderViewModal';

interface DailyRationPageProps {
    feeds: Feed[];
    fertilizer: number;
    onComplete: () => void;
    onSelectGame: (id: string) => void;
}

const DailyRationPage: React.FC<DailyRationPageProps> = ({ feeds, fertilizer, onComplete, onSelectGame }) => {
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
        <main className="h-full w-full bg-void-950 overflow-y-auto p-5 md:p-16 relative scrollbar-hide font-horror pb-32">
            <div className="max-w-4xl mx-auto">
                <header className="mb-10 md:mb-12 border-b-2 md:border-b-4 border-pulse-500 pb-6 md:pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8">
                    <div>
                        <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                             <RadioIcon className="w-6 h-6 md:w-8 md:h-8 text-pulse-500 animate-pulse" />
                             <span className="text-[8px] md:text-[10px] font-black uppercase text-pulse-500 tracking-[0.4em] font-mono">FREQ: 104.5</span>
                        </div>
                        <h1 className="text-lg md:text-3xl font-black text-white italic tracking-tighter leading-none glitch-text">SURVEILLANCE LOG</h1>
                        <p className="text-zinc-600 font-bold uppercase tracking-widest text-[8px] md:text-[10px] mt-2 md:mt-3 font-mono">{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} // CLASSIFIED</p>
                    </div>
                    <div className="bg-void-900 p-3 md:p-4 border border-pulse-500/20 shadow-[4px_4px_0px_#180202]">
                        <span className="text-[7px] md:text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1 font-mono">Psychic Sync</span>
                        <div className="w-24 md:w-32 h-1.5 md:h-2 bg-black rounded-none overflow-hidden border border-pulse-500/30">
                            <div className="h-full bg-pulse-500 shadow-[0_0_15px_#e11d48]" style={{ width: `${fertilizer}%` }} />
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-8 md:gap-12">
                    <section className="space-y-6 md:space-y-8">
                        <div className="flex items-center gap-3 border-l-2 border-pulse-500 pl-3 md:pl-4">
                            <h2 className="text-[10px] md:text-xs font-black text-white italic uppercase tracking-tighter">Intercepted Signals</h2>
                        </div>
                        
                        {loading ? (
                            <div className="space-y-4">
                                {[...Array(2)].map((_, i) => (
                                    <div key={i} className="h-24 bg-void-900 border border-zinc-800 animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-6 md:space-y-8">
                                {articles.map(article => (
                                    <div key={article.id} className="relative group">
                                        <FeaturedStory 
                                            article={article} 
                                            onReadHere={() => setReaderArticle(article)} 
                                            onMarkAsRead={() => {}}
                                            isRead={false} 
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <aside className="space-y-8 md:space-y-12">
                         <div className={`p-5 md:p-8 border border-pulse-500/50 transition-all relative overflow-hidden ${isCryptDone ? 'bg-void-900 border-zinc-800 opacity-60' : 'bg-void-900 border-pulse-500 shadow-[6px_6px_0px_#e11d48]'}`}>
                            <WalkieTalkieIcon className={`w-8 h-8 md:w-10 md:h-10 mb-4 ${isCryptDone ? 'text-zinc-800' : 'text-pulse-500'}`} />
                            <h3 className="text-base md:text-xl font-black text-white italic uppercase tracking-tighter leading-none mb-1 md:mb-2">Signal Crypt</h3>
                            <p className="text-[8px] md:text-[9px] text-zinc-500 uppercase font-bold tracking-widest mb-6 font-mono">Daily Decryption</p>
                            
                            {isCryptDone ? (
                                <p className="text-pulse-500 font-black italic uppercase text-xs md:text-sm">Signal Clear</p>
                            ) : (
                                <button 
                                    onClick={() => onSelectGame('spore-crypt')}
                                    className="w-full py-2.5 md:py-3.5 bg-pulse-500 text-white font-black uppercase italic rounded-none hover:bg-white hover:text-black transition-all shadow-[2px_2px_0px_white] text-[8px] md:text-[10px]"
                                >
                                    Intercept Now
                                </button>
                            )}
                        </div>

                        <div className="bg-void-900 p-5 md:p-8 border border-zinc-800 shadow-[6px_6px_0px_rgba(0,0,0,0.5)]">
                             <h3 className="text-sm md:text-lg font-black text-white italic uppercase tracking-tighter mb-2">The Dark Arcade</h3>
                             <p className="text-[8px] md:text-[10px] text-zinc-500 font-mono mb-6 leading-relaxed uppercase">Simulation?</p>
                             <button 
                                onClick={onComplete}
                                className="w-full py-2.5 md:py-3.5 bg-white text-black font-black uppercase italic rounded-none hover:bg-pulse-500 hover:text-white transition-all text-[8px] md:text-[10px]"
                             >
                                Enter The Void
                             </button>
                        </div>
                    </aside>
                </div>
            </div>
            {readerArticle && (
                <ReaderViewModal 
                    article={readerArticle} 
                    onClose={() => setReaderArticle(null)} 
                    onMarkAsRead={() => {}} 
                />
            )}
        </main>
    );
};

export default DailyRationPage;
