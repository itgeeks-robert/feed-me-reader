
import type { SudokuDifficulty as Difficulty } from '../src/App';
type Grid = number[][];

const createSeededRandom = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

const shuffle = (array: any[], random = Math.random) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
};

const isSafe = (grid: Grid, row: number, col: number, num: number): boolean => {
  for (let x = 0; x < 9; x++) {
    if (grid[row][x] === num || grid[x][col] === num) {
      return false;
    }
  }
  const startRow = row - (row % 3);
  const startCol = col - (col % 3);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[i + startRow][j + startCol] === num) {
        return false;
      }
    }
  }
  return true;
};

const getCellsToRemove = (difficulty: Difficulty): number => {
    switch (difficulty) {
        case 'Easy': return 35;
        case 'Medium': return 45;
        case 'Hard': return 55;
        case 'Expert': return 62;
        default: return 35;
    }
};

export const generateSudoku = async (difficulty: Difficulty, seed?: number): Promise<{ puzzle: string, solution: Grid }> => {
  return new Promise((resolve, reject) => {
    try {
      const random = seed ? createSeededRandom(seed) : Math.random;
      
      const solution: Grid = Array(9).fill(0).map(() => Array(9).fill(0));
      
      const solveSudokuWithRandom = (grid: Grid): boolean => {
          for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
              if (grid[row][col] === 0) {
                const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
                shuffle(numbers, random);
                for (const num of numbers) {
                  if (isSafe(grid, row, col, num)) {
                    grid[row][col] = num;
                    if (solveSudokuWithRandom(grid)) {
                      return true;
                    }
                    grid[row][col] = 0;
                  }
                }
                return false;
              }
            }
          }
          return true;
      };

      if (!solveSudokuWithRandom(solution)) {
          throw new Error("Failed to generate a solved Sudoku grid.");
      }
      
      const puzzle = JSON.parse(JSON.stringify(solution));
      const cellsToRemove = getCellsToRemove(difficulty);
      const cells = [];
      for(let r=0; r<9; r++) for(let c=0; c<9; c++) cells.push({r, c});
      shuffle(cells, random);
      
      for(let i=0; i < cellsToRemove; i++) {
        const { r, c } = cells[i];
        puzzle[r][c] = 0;
      }
      
      const puzzleString = puzzle.flat().join('');

      resolve({ puzzle: puzzleString, solution });
    } catch (error) {
        console.error("Error generating Sudoku puzzle locally:", error);
        reject(new Error("Failed to create a new puzzle. Please try again."));
    }
  });
};
