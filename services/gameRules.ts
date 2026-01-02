/**
 * THE VOID: ARCADE REGISTRY v1.0
 * Single source of truth for game balance and logic constraints.
 */

export const ARCADE_RULES = {
    SYNAPSE_LINK: {
        MAX_MISTAKES: 3, // Ring-fenced: Do not increment.
        STREAK_BONUS: 50,
        DECODE_TIME_LIMIT: 300, // 5 minutes
    },
    SUDOKU: {
        MAX_MISTAKES: 3,
        HINT_COST: 25,
    },
    HANGMAN: {
        MAX_MISTAKES: 7,
        TIME_LIMIT: 60,
    },
    MINESWEEPER: {
        LIVES: 1, // Traditional mode
    },
    NEON_SIGNAL: {
        GAME_DURATION: 60,
        POINT_VALUE: 5,
    }
};