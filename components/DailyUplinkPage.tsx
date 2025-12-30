import React, { useState, useEffect } from 'react';
import type { Feed, Article } from '../src/App';
import { WalkieTalkieIcon, RadioIcon, ChevronRightIcon } from './icons';
import { resilientFetch } from '../services/fetch';
import { parseRssXml } from '../services/rssParser';
import FeaturedStory from './articles/FeaturedStory';
import ReaderViewModal from './ReaderViewModal';

interface DailyUplinkPageProps {
    feeds: Feed[];
    uptime: number;
    onComplete: () => void;
    onEnterArcade: () => void;
    onSelectGame: (id: string) => void;
}

const DailyUplinkPage: React.FC<DailyUplinkPageProps> = ({ feeds, uptime, onComplete, onEnterArcade, onSelectGame }) => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [readerArticle, setReaderArticle] = useState<Article | null>(null);

    useEffect(() => {
        const fetchUplink = async () => {
            setLoading(true);
            const promises = feeds.slice(0, 3).map(f => resilientFetch(f.url).then(res => res.text()).then(xml => parseRssXml(xml, f.title, f.url)).catch(() => []));
            const results = await Promise.all(promises);
            const flat = results.flat().sort((a, b) => (b.publishedDate?.getTime() || 0) - (a.publishedDate?.getTime() || 0));
            setArticles(flat.slice(0, 5));
            setLoading(false);
        };
        fetchUplink();
    }, [feeds]);

    const daysSinceEpoch = Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24));
    const isCipherDone = !!localStorage.getItem(`cipher_core_${daysSinceEpoch}`);

    return (
        <main className="h-full w-full bg-void-950 overflow-y-auto p-6 md:p-20 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(10rem+env(safe-area-inset-bottom))] relative scrollbar-hide">
            <div className="max-w-4xl mx-auto">
                <header className="mb-12 md:mb-20 border-b-4 border-emerald-500 pb-8 md:pb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div>
                        <div className="flex items-center gap-4 mb-6"><RadioIcon className="w-8 h-8 md:w-10 md:h-10 text-emerald-500 animate-pulse" /><span className="text-[10px] md:text-xs font-black uppercase text-emerald-500 tracking-[0.5em] font-mono">UPLINK FREQ: 104.5</span></div>
                        <h1 className="text-3xl md:text-6xl font-black text-white italic tracking-tighter leading-none glitch-text">UPLINK SEQUENCE</h1>
                        <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs md:text-sm mt-4 font-mono">{new Date().toLocaleDateString()} // SURVEILLANCE LOG</p>
                    </div>
                    <div className="bg-void-900 p-4 md:p-6 border-2 border-emerald-500/20 shadow-[6px_6px_0px_#180202]">
                        <span className="text-[9px] md:text-xs font-black text-zinc-500 uppercase tracking-widest block mb-2 font-mono">System Integrity</span>
                        <div className="w-32 md:w-48 h-2 md:h-3 bg-black rounded-none overflow-hidden border border-emerald-500/30">
                            <div className="h-full bg-emerald-500 shadow-[0_0_15px_#10b981]" style={{ width: `${uptime}%` }} />
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-12 md:gap-20">
                    <section className="space-y-10 md:space-y-16">
                        {loading ? <div className="h-40 bg-void-900 border-2 border-zinc-800 animate-pulse" /> : articles.map(article => (
                            /* Fix: Replaced onMarkAsRead with onReadExternal to correctly link to source as required by FeaturedStory */
                            <FeaturedStory key={article.id} article={article} onReadHere={() => setReaderArticle(article)} onReadExternal={() => window.open(article.link, '_blank')} isRead={false} />
                        ))}
                        <button onClick={onComplete} className="group flex items-center gap-4 px-12 py-5 bg-white text-black font-black uppercase italic text-sm tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-[8px_8px_0px_#10b981]"><span>Intercept Main Signal</span><ChevronRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-2" /></button>
                    </section>

                    <aside className="space-y-12 md:space-y-20">
                         <div className={`p-8 md:p-10 border-2 transition-all relative overflow-hidden ${isCipherDone ? 'bg-void-900 border-zinc-800 opacity-60' : 'bg-void-900 border-emerald-500 shadow-[10px_10px_0px_#065f46]'}`}>
                            <WalkieTalkieIcon className={`w-12 h-12 md:w-16 md:h-16 mb-6 ${isCipherDone ? 'text-zinc-800' : 'text-emerald-500'}`} />
                            <h3 className="text-xl md:text-3xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">CIPHER CORE</h3>
                            <p className="text-[10px] md:text-xs text-zinc-500 uppercase font-bold tracking-widest mb-8 font-mono">Daily Decryption Routine</p>
                            {isCipherDone ? (
                                <p className="text-emerald-500 font-black italic uppercase text-sm md:text-lg">Decoded</p>
                            ) : (
                                <button onClick={() => onSelectGame('cipher-core')} className="w-full py-4 md:py-6 bg-emerald-500 text-white font-black uppercase italic rounded-none hover:bg-white hover:text-black transition-all shadow-[4px_4px_0px_white] text-xs md:text-sm">Intercept Now</button>
                            )}
                        </div>

                        <div className="bg-void-900 p-8 md:p-10 border-2 border-zinc-800 shadow-[10px_10px_0px_black]">
                             <h3 className="text-lg md:text-2xl font-black text-white italic uppercase tracking-tighter mb-3">VOID ARCADE</h3>
                             <p className="text-xs md:text-sm text-zinc-500 font-mono mb-10 leading-relaxed uppercase">Simulation Active. Awaiting Host.</p>
                             <button onClick={onEnterArcade} className="w-full py-4 md:py-6 bg-white text-black font-black uppercase italic rounded-none hover:bg-emerald-500 hover:text-white transition-all text-xs md:text-sm">Establish Link</button>
                        </div>
                    </aside>
                </div>
            </div>
            {/* Fix: Added missing onOpenExternal prop to ReaderViewModal to resolve TypeScript error */}
            {readerArticle && <ReaderViewModal article={readerArticle} onClose={() => setReaderArticle(null)} onMarkAsRead={() => {}} onOpenExternal={(url) => window.open(url, '_blank')} />}
        </main>
    );
};

export default DailyUplinkPage;