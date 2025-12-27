
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
                        if (cell === 2) color = "bg-plant-500";
                        else if (cell === 1) color = "bg-flesh-500";
                        return <div key={j} className={`w-1.5 h-1.5 ${color} rounded-[1px]`} />;
                    })}
                </div>
            ))}
        </div>
    );

    return (
        <div className="bg-black/60 border-2 border-plant-500/30 rounded-2xl p-4 font-mono w-full">
            <h3 className="text-center text-flesh-500 font-black italic uppercase tracking-tighter mb-4 text-sm border-b border-white/10 pb-2">{title} TOP 10</h3>
            {entries.length === 0 ? (
                <p className="text-center text-[10px] text-zinc-600 uppercase tracking-widest py-4">No Records Found</p>
            ) : (
                <div className="space-y-3">
                    {entries.map((entry, i) => (
                        <div key={i} className="flex justify-between items-center text-[10px] uppercase gap-2">
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-plant-500 w-3 font-black">{i + 1}</span>
                                <span className="text-white font-black w-8 truncate">{entry.name}</span>
                            </div>
                            
                            {entry.metadata?.sporeGrid && (
                                <div className="flex-grow flex justify-center">
                                    <SporeGrid grid={entry.metadata.sporeGrid} />
                                </div>
                            )}

                            <div className="flex flex-col items-end flex-shrink-0">
                                <span className="text-yellow-400 font-black leading-none">{entry.displayValue}</span>
                                <span className="text-zinc-600 text-[8px] font-bold mt-0.5">{formatDate(entry.date)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HighScoreTable;
