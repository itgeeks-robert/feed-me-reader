import React from 'react';
import { HighScoreEntry } from '../services/highScoresService';

interface HighScoreTableProps {
    entries: HighScoreEntry[];
    title: string;
}

const HighScoreTable: React.FC<HighScoreTableProps> = ({ entries, title }) => {
    const formatDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        } catch (e) {
            return "??";
        }
    };

    const SporeGrid: React.FC<{ grid: number[][] }> = ({ grid }) => (
        <div className="flex flex-col gap-[1px] bg-black/40 p-1 rounded-sm border border-white/5">
            {grid.map((row, i) => (
                <div key={i} className="flex gap-[1px]">
                    {row.map((cell, j) => {
                        let color = "bg-zinc-800";
                        if (cell === 2) color = "bg-signal-500";
                        else if (cell === 1) color = "bg-pulse-500";
                        return <div key={j} className={`w-1.5 h-1.5 ${color} rounded-[1px] shadow-[0_0_2px_rgba(0,0,0,0.5)]`} />;
                    })}
                </div>
            ))}
        </div>
    );

    return (
        <div className="bg-void-950 border-2 border-white/5 rounded-2xl p-5 font-mono w-full shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-pulse-500/5 to-transparent pointer-events-none"></div>
            <h3 className="text-center text-white font-black italic uppercase tracking-widest mb-5 text-xs border-b border-white/10 pb-3 relative z-10">
                {title} <span className="text-pulse-500">ARCHIVES</span>
            </h3>
            {entries.length === 0 ? (
                <p className="text-center text-[10px] text-zinc-700 uppercase font-black tracking-widest py-8 italic animate-pulse">No Records Extracted</p>
            ) : (
                <div className="space-y-4 relative z-10">
                    {entries.map((entry, i) => (
                        <div key={i} className="flex justify-between items-center text-[10px] uppercase gap-3 hover:bg-white/5 p-1 rounded transition-colors group/row">
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <span className="text-pulse-500 w-4 font-black italic">{i + 1}</span>
                                <span className="text-white font-black w-10 truncate tracking-tighter">{entry.name}</span>
                            </div>
                            
                            {entry.metadata?.sporeGrid && (
                                <div className="flex-grow flex justify-center opacity-80 group-hover/row:opacity-100 transition-opacity">
                                    <SporeGrid grid={entry.metadata.sporeGrid} />
                                </div>
                            )}

                            <div className="flex flex-col items-end flex-shrink-0">
                                <span className="text-signal-400 font-black leading-none italic">{entry.displayValue}</span>
                                <span className="text-zinc-700 text-[8px] font-black mt-1 italic">{formatDate(entry.date)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HighScoreTable;