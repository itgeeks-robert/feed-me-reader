/**
 * THE VOID // HIGH_SCORES v2.0
 * Persists via IndexedDB (same cacheService used by the reader/images)
 * so scores survive cache-clears that wipe localStorage.
 * Falls back to localStorage if IndexedDB is unavailable.
 */

import React from 'react';
import type { HighScoreEntry } from '../services/highScoresService';

export const HighScoreTable: React.FC<{ entries: HighScoreEntry[]; title: string }> = ({ entries, title }) => {
  return (
    <div className="w-full h-full flex flex-col bg-zinc-900/40 rounded-2xl border border-white/5 p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
        <h3 className="text-[10px] font-black uppercase text-app-accent tracking-[0.2em]">{title} TOP_10</h3>
        <div className="w-1.5 h-1.5 rounded-full bg-app-accent animate-pulse" />
      </div>
      
      <div className="flex-grow overflow-y-auto scrollbar-hide space-y-2">
        {entries.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[9px] font-bold text-zinc-600 uppercase italic">
            No Records Found
          </div>
        ) : (
          entries.map((entry, idx) => (
            <div key={idx} className="flex justify-between items-center text-[10px] font-bold uppercase italic group">
              <div className="flex items-center gap-2">
                <span className="text-[8px] text-zinc-700 w-3">{idx + 1}</span>
                <span className="text-zinc-400 group-hover:text-white transition-colors">{entry.name}</span>
              </div>
              <span className="text-app-text">{entry.displayValue}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HighScoreTable;
