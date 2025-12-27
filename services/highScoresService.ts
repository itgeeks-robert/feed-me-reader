
export interface HighScoreEntry {
    name: string;
    score: number;
    date: string;
    displayValue: string; // e.g. "01:24" or "15,400"
    metadata?: any; // New field for game-specific data (e.g. grid patterns)
}

export type ScoreCategory = 
    | 'sudoku_easy' | 'sudoku_medium' | 'sudoku_hard' 
    | 'minesweeper_easy' | 'minesweeper_medium' | 'minesweeper_hard'
    | 'tetris' | 'solitaire' | 'spore_crypt';

const STORAGE_KEY = 'feedme_arcade_high_scores';

export const getHighScores = (category: ScoreCategory): HighScoreEntry[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
        const allScores = JSON.parse(stored);
        return allScores[category] || [];
    } catch (e) {
        return [];
    }
};

export const saveHighScore = (category: ScoreCategory, entry: HighScoreEntry, lowerIsBetter = false) => {
    const scores = getHighScores(category);
    scores.push(entry);
    
    if (lowerIsBetter) {
        scores.sort((a, b) => a.score - b.score);
    } else {
        scores.sort((a, b) => b.score - a.score);
    }
    
    const topScores = scores.slice(0, 10);
    const stored = localStorage.getItem(STORAGE_KEY);
    let allScores = stored ? JSON.parse(stored) : {};
    allScores[category] = topScores;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allScores));
};

export const isHighScore = (category: ScoreCategory, score: number, lowerIsBetter = false): boolean => {
    const scores = getHighScores(category);
    if (scores.length < 10) return true;
    if (lowerIsBetter) {
        return score < scores[scores.length - 1].score;
    }
    return score > scores[scores.length - 1].score;
};
