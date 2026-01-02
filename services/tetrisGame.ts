// This service is adapted from the vanilla JavaScript Tetris implementation
// by Jake Gordon. Overhauled for VOID ARCADE with neon aesthetic and ghost logic.

//-------------------------------------------------------------------------
// Type Definitions
//-------------------------------------------------------------------------
export interface PieceType {
  size: number;
  blocks: number[];
  color: string;
  glow: string;
}

interface GameOptions {
  canvas: HTMLCanvasElement;
  previewCanvas: HTMLCanvasElement;
  holdCanvas: HTMLCanvasElement;
  onScoreUpdate: (score: number) => void;
  onRowsUpdate: (rows: number) => void;
  onLevelUpdate: (level: number) => void;
  onGameOver: () => void;
  onHoldUpdate: (piece: PieceType | null) => void;
  onNextUpdate: (queue: PieceType[]) => void;
}

interface Piece {
  x: number;
  y: number;
  dir: number;
  type: PieceType;
}

//-------------------------------------------------------------------------
// Constants - Neon Palette
//-------------------------------------------------------------------------

const DIR = { UP: 0, RIGHT: 1, DOWN: 2, LEFT: 3, MIN: 0, MAX: 3 };
const NEXT_QUEUE_SIZE = 3;

const I: PieceType = { size: 4, blocks: [0x0F00, 0x2222, 0x00F0, 0x4444], color: '#22d3ee', glow: '#06b6d4' };
const J: PieceType = { size: 3, blocks: [0x44C0, 0x8E00, 0x6440, 0x0E20], color: '#3b82f6', glow: '#2563eb' };
const L: PieceType = { size: 3, blocks: [0x4460, 0x0E80, 0xC440, 0x2E00], color: '#f59e0b', glow: '#d97706' };
const O: PieceType = { size: 2, blocks: [0xCC00, 0xCC00, 0xCC00, 0xCC00], color: '#fbbf24', glow: '#f59e0b' };
const S: PieceType = { size: 3, blocks: [0x06C0, 0x8C40, 0x6C00, 0x4620], color: '#10b981', glow: '#059669' };
const T: PieceType = { size: 3, blocks: [0x0E40, 0x4C40, 0x4E00, 0x4640], color: '#a78bfa', glow: '#8b5cf6' };
const Z: PieceType = { size: 3, blocks: [0x0C60, 0x4C80, 0xC600, 0x2640], color: '#e11d48', glow: '#be123c' };

const pieces = [I, J, L, O, S, T, Z];

//-------------------------------------------------------------------------
// Main Game Export
//-------------------------------------------------------------------------

export function startGame(options: GameOptions) {
  let canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D;
  let score = 0, rows = 0, level = 0;
  const nx = 10, ny = 20;
  let court: (string | 0)[][] = [];
  
  let current: Piece;
  let nextQueue: PieceType[] = [];
  let hold: PieceType | null = null;
  let canHold = true;
  
  let playing = false;
  let dt = 0, last = 0, step = 0;
  let animationFrameId: number;

  const random = (min: number, max: number) => min + (Math.random() * (max - min));
  const randomChoice = <T>(array: T[]): T => array[Math.floor(random(0, array.length))];

  const eachblock = (type: PieceType, x: number, y: number, dir: number, fn: (x: number, y: number) => void) => {
    let bit = 0x8000, row = 0, col = 0;
    const blocks = type.blocks[dir];
    for (bit = 0x8000; bit > 0; bit = bit >> 1) {
      if (blocks & bit) fn(x + col, y + row);
      if (++col === 4) { col = 0; ++row; }
    }
  };

  const occupied = (type: PieceType, x: number, y: number, dir: number) => {
    let result = false;
    eachblock(type, x, y, dir, (x, y) => {
      if (x < 0 || x >= nx || y < 0 || y >= ny || getBlock(x, y)) result = true;
    });
    return result;
  };

  const fillNextQueue = () => {
    while (nextQueue.length < NEXT_QUEUE_SIZE) {
      nextQueue.push(randomChoice(pieces));
    }
    options.onNextUpdate([...nextQueue]);
  };

  const popNextPiece = (): PieceType => {
    const piece = nextQueue.shift()!;
    fillNextQueue();
    return piece;
  };

  const resetPiece = (type: PieceType) => {
    current = { type, x: Math.round(nx / 2 - type.size / 2), y: 0, dir: DIR.UP };
    if (occupied(current.type, current.x, current.y, current.dir)) {
      lose();
    }
  };

  const newGame = () => {
    court = Array.from({ length: nx }, () => Array(ny).fill(0));
    setScore(0); setRows(0); setLevel(0);
    nextQueue = [];
    fillNextQueue();
    resetPiece(popNextPiece());
    setHold(null);
    canHold = true;
    playing = true;
  };
  
  const lose = () => {
    playing = false;
    options.onGameOver();
  };

  const setScore = (n: number) => { score = n; options.onScoreUpdate(n); };
  const setRows = (n: number) => { rows = n; setLevel(Math.floor(n / 10)); options.onRowsUpdate(n); };
  const setLevel = (n: number) => { level = n; step = Math.max(0.1, 0.8 - (level * 0.05)); options.onLevelUpdate(n); };
  const setHold = (piece: PieceType | null) => { hold = piece; options.onHoldUpdate(piece); };
  
  const getBlock = (x: number, y: number) => (court[x] ? court[x][y] : null);
  const setBlock = (x: number, y: number, type: PieceType) => { court[x][y] = type.color; };

  const clearLines = () => {
    let n = 0;
    for (let y = ny - 1; y > 0; --y) {
      let complete = true;
      for (let x = 0; x < nx; ++x) if (!getBlock(x, y)) complete = false;
      if (complete) {
        for (let y2 = y; y2 > 0; --y2) {
          for (let x = 0; x < nx; ++x) court[x][y2] = getBlock(x, y2 - 1) || 0;
        }
        y++; n++;
      }
    }
    if (n > 0) {
      setRows(rows + n);
      setScore(score + 100 * Math.pow(2, n - 1));
    }
  };
  
  const drop = () => {
    if (!move(0, 1)) {
      eachblock(current.type, current.x, current.y, current.dir, (x, y) => setBlock(x, y, current.type));
      clearLines();
      if (playing) {
        resetPiece(popNextPiece());
        canHold = true;
      }
    }
  };

  const move = (dx: number, dy: number) => {
    const x = current.x + dx; const y = current.y + dy;
    if (!occupied(current.type, x, y, current.dir)) {
      current.x = x; current.y = y; invalidate();
      return true;
    }
    return false;
  };

  const rotate = () => {
    const newdir = (current.dir === DIR.MAX ? DIR.MIN : current.dir + 1);
    if (!occupied(current.type, current.x, current.y, newdir)) {
      current.dir = newdir; invalidate();
    }
  };
  
  const holdPiece = () => {
    if (canHold) {
      canHold = false;
      if (hold) {
        const temp = hold;
        setHold(current.type);
        resetPiece(temp);
      } else {
        setHold(current.type);
        resetPiece(popNextPiece());
      }
      invalidate();
    }
  };

  let dx: number, dy: number;
  let invalid = true;
  const invalidate = () => { invalid = true; };

  const draw = () => {
    if (invalid) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawCourt();
      drawGhost();
      drawPiece(ctx, current.type, current.x, current.y, current.dir);
      invalid = false;
    }
  };

  const drawCourt = () => {
    // Draw matrix background
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= nx; x++) {
      ctx.beginPath(); ctx.moveTo(x * dx, 0); ctx.lineTo(x * dx, canvas.height); ctx.stroke();
    }
    for (let y = 0; y <= ny; y++) {
      ctx.beginPath(); ctx.moveTo(0, y * dy); ctx.lineTo(canvas.width, y * dy); ctx.stroke();
    }

    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        const block = getBlock(x, y);
        if (block) {
            drawBlock(ctx, x, y, block as string);
        }
      }
    }
  };

  const drawGhost = () => {
    let ghostY = current.y;
    while (!occupied(current.type, current.x, ghostY + 1, current.dir)) {
      ghostY++;
    }
    if (ghostY !== current.y) {
      eachblock(current.type, current.x, ghostY, current.dir, (x, y) => {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.setLineDash([2, 2]);
        ctx.strokeRect(x * dx + 2, y * dy + 2, dx - 4, dy - 4);
        ctx.restore();
      });
    }
  };

  const drawPiece = (c: CanvasRenderingContext2D, type: PieceType, x: number, y: number, dir: number) => {
    eachblock(type, x, y, dir, (bx, by) => drawBlock(c, bx, by, type.color));
  };
  
  const drawPieceOnCanvas = (targetCtx: CanvasRenderingContext2D, pieceType: PieceType | null, xOffset: number, yOffset: number) => {
        if (!pieceType) return;
        const tempDx = targetCtx.canvas.width / 5;
        const tempDy = targetCtx.canvas.width / 5; 
        
        const padding = (pieceType.size === 2 ? 1.5 : pieceType.size === 3 ? 1 : 0.5);
        eachblock(pieceType, padding + xOffset, padding + yOffset, DIR.UP, (x,y) => drawBlock(targetCtx, x, y, pieceType.color, tempDx, tempDy));
  };

  const drawBlock = (c: CanvasRenderingContext2D, x: number, y: number, color: string, blockDx = dx, blockDy = dy) => {
    const px = x * blockDx;
    const py = y * blockDy;
    
    // Main Body
    c.fillStyle = color;
    c.fillRect(px + 1, py + 1, blockDx - 2, blockDy - 2);

    // Inner Glow
    c.save();
    c.shadowBlur = 15;
    c.shadowColor = color;
    c.strokeStyle = 'white';
    c.lineWidth = 1;
    c.strokeRect(px + 3, py + 3, blockDx - 6, blockDy - 6);
    c.restore();

    // Top Highlight (Technical edge)
    c.fillStyle = 'rgba(255, 255, 255, 0.3)';
    c.fillRect(px + 1, py + 1, blockDx - 2, 2);
    c.fillRect(px + 1, py + 1, 2, blockDy - 2);
    
    // Bottom Shadow
    c.fillStyle = 'rgba(0, 0, 0, 0.4)';
    c.fillRect(px + 1, py + blockDy - 3, blockDx - 2, 2);
    c.fillRect(px + blockDx - 3, py + 1, 2, blockDy - 2);
  };
  
  const frame = () => {
    const now = window.performance.now();
    dt = dt + Math.min(1, (now - last) / 1000);
    while (dt > step) { dt -= step; if (playing) drop(); }
    draw();
    last = now;
    animationFrameId = requestAnimationFrame(frame);
  };

  const init = () => {
    canvas = options.canvas;
    ctx = canvas.getContext('2d')!;

    // Scaled internal resolution
    canvas.width = 300;
    canvas.height = 600;
    
    dx = canvas.width / nx;
    dy = canvas.height / ny;
    
    const sideCanvasWidth = dx * 5;
    options.holdCanvas.width = sideCanvasWidth;
    options.holdCanvas.height = dy * 5;
    options.previewCanvas.width = sideCanvasWidth;
    options.previewCanvas.height = dy * 13;

    newGame();
    last = window.performance.now();
    frame();
  };

  init();

  return {
    stop: () => cancelAnimationFrame(animationFrameId),
    moveLeft: () => playing && move(-1, 0),
    moveRight: () => playing && move(1, 0),
    rotate: () => playing && rotate(),
    softDrop: () => playing && drop(),
    hardDrop: () => {
      if (playing) {
        while (move(0, 1)) { /* keep going */ }
        drop();
        // Shake feedback
        canvas.classList.add('animate-shake');
        setTimeout(() => canvas.classList.remove('animate-shake'), 200);
        last = window.performance.now();
        dt = 0;
      }
    },
    hold: () => playing && holdPiece(),
    drawPieceOn: drawPieceOnCanvas,
  };
}