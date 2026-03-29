import React, { useRef, useEffect, useState, useCallback } from 'react';

// ─── Vector2 ─────────────────────────────────────────────────────────────────
class Vec2 {
  constructor(public x = 0, public y = 0) {}
  add(v: Vec2) { return new Vec2(this.x + v.x, this.y + v.y); }
  sub(v: Vec2) { return new Vec2(this.x - v.x, this.y - v.y); }
  mul(s: number) { return new Vec2(this.x * s, this.y * s); }
  dot(v: Vec2) { return this.x * v.x + this.y * v.y; }
  len() { return Math.sqrt(this.x * this.x + this.y * this.y); }
  lenSq() { return this.x * this.x + this.y * this.y; }
  norm() { const l = this.len(); return l > 0 ? new Vec2(this.x / l, this.y / l) : new Vec2(); }
  clone() { return new Vec2(this.x, this.y); }
  distTo(v: Vec2) { return this.sub(v).len(); }
}

// ─── Types & palette ─────────────────────────────────────────────────────────
type BallType = 'solid' | 'stripe';
type Player = 'human' | 'ai';
type Phase = 'playing' | 'gameOver';

interface Ball {
  num: number;
  pos: Vec2;
  vel: Vec2;
  angVel: number;
  angle: number;
  r: number;
  mass: number;
  color: string;
  stripeColor?: string;
  type?: BallType;
  inPocket: boolean;
  pocketAnim: number;
  pottedAnim: number;
}

const COLORS: Record<number, string> = {
  0: '#f5f5f0', 1: '#f6c90e', 2: '#1a6bb5', 3: '#c0392b', 4: '#6c3483',
  5: '#d35400', 6: '#1e8449', 7: '#922b21', 8: '#1a1a1a',
  9: '#f6c90e', 10: '#1a6bb5', 11: '#c0392b', 12: '#6c3483', 13: '#d35400',
  14: '#1e8449', 15: '#922b21',
};

// ─── IMPROVED CONSTANTS ──────────────────────────────────────────────────────
const FRICTION = 0.984;
const ANG_FRIC = 0.925;
const RESTITUTION = 0.965;
const WALL_REST = 0.87;
const MIN_VEL = 0.045;
const MAX_POWER = 29;
const SUB_STEPS = 12;

function darken(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) - amt, g = ((n >> 8) & 0xff) - amt, b = (n & 0xff) - amt;
  r = Math.max(0, r); g = Math.max(0, g); b = Math.max(0, b);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}
function lighten(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + amt, g = ((n >> 8) & 0xff) + amt, b = (n & 0xff) + amt;
  r = Math.min(255, r); g = Math.min(255, g); b = Math.min(255, b);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

interface GameState {
  balls: Ball[];
  pockets: Vec2[];
  aimDir: Vec2;
  moving: boolean;
  turn: Player;
  humanType: BallType | null;
  aiType: BallType | null;
  humanPotted: number[];
  aiPotted: number[];
  pottedThisTurn: Ball[];
  winner: Player | null;
  phase: Phase;
  tableW: number; tableH: number; ballR: number; pocketR: number; inset: number;
  cueAnim: number;
  foulMsg: string; foulTimer: number;
  isDragging: boolean;
}

// ─── Main component ──────────────────────────────────────────────────────────
const PoolGamePage: React.FC<{ onBackToHub: () => void; onReturnToFeeds: () => void }> = ({ onBackToHub, onReturnToFeeds }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const [, forceUpdate] = useState({});

  const [landscape, setLandscape] = useState(() => typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : true);

  useEffect(() => {
    const update = () => setLandscape(window.innerWidth > window.innerHeight);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => { window.removeEventListener('resize', update); window.removeEventListener('orientationchange', update); };
  }, []);

  const G = useRef<GameState>({
    balls: [], pockets: [], tableW: 0, tableH: 0, ballR: 0, pocketR: 0, inset: 0,
    moving: false, turn: 'human', phase: 'playing', pottedThisTurn: [],
    humanType: null, aiType: null, humanPotted: [], aiPotted: [], winner: null,
    aimDir: new Vec2(-1, 0), isDragging: false, cueAnim: 1, foulMsg: '', foulTimer: 0
  });

  const [power, setPower] = useState(0.65);
  const [spin, setSpin] = useState(new Vec2(0, 0));
  const [showHelp, setShowHelp] = useState(false);

  // roundRect helper
  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // Ball drawing
  function drawBall(ctx: CanvasRenderingContext2D, b: Ball, scale: number, R: number) {
    const { pos } = b;
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.scale(scale, scale);
    ctx.rotate(b.angle);

    ctx.shadowColor = 'rgba(0,0,0,0.65)';
    ctx.shadowBlur = R*1.1;
    ctx.shadowOffsetX = R*0.18;
    ctx.shadowOffsetY = R*0.3;

    const baseGrad = ctx.createRadialGradient(-R*0.3, -R*0.35, R*0.08, 0, 0, R);
    baseGrad.addColorStop(0, lighten(b.color, 55));
    baseGrad.addColorStop(0.45, b.color);
    baseGrad.addColorStop(0.85, darken(b.color, 65));
    ctx.fillStyle = baseGrad;
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI*2); ctx.fill();

    ctx.shadowColor = 'transparent';

    if (b.type === 'stripe') {
      ctx.save();
      ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI*2); ctx.clip();
      const stripeFill = ctx.createLinearGradient(0, -R*0.44, 0, R*0.44);
      stripeFill.addColorStop(0, '#f8f4ec');
      stripeFill.addColorStop(1, '#e8e2d6');
      ctx.fillStyle = stripeFill;
      ctx.fillRect(-R, -R*0.44, R*2, R*0.88);
      ctx.restore();
    }

    if (b.num > 0) {
      const nr = R * 0.53;
      ctx.fillStyle = b.type === 'stripe' ? b.color : '#f8f4ee';
      ctx.beginPath(); ctx.arc(0, 0, nr, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, nr, 0, Math.PI*2); ctx.stroke();
      ctx.fillStyle = b.type === 'stripe' ? '#f8f4ee' : '#111';
      ctx.font = `bold ${R * (b.num >= 10 ? 0.58 : 0.68)}px Georgia`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(b.num), 0, R*0.04);
    }

    const spec = ctx.createRadialGradient(-R*0.34, -R*0.4, 0, -R*0.32, -R*0.38, R*0.72);
    spec.addColorStop(0, 'rgba(255,255,255,0.95)');
    spec.addColorStop(0.3, 'rgba(255,255,255,0.45)');
    spec.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = spec;
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI*2); ctx.fill();

    const rim = ctx.createRadialGradient(0, 0, R*0.58, 0, 0, R);
    rim.addColorStop(0, 'rgba(255,255,255,0.1)');
    rim.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = rim;
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI*2); ctx.fill();

    ctx.restore();
  }

  const drawScene = useCallback((ctx: CanvasRenderingContext2D, dpr: number) => {
    const g = G.current;
    const { tableW: W, tableH: H, ballR: R, pocketR: PR, inset, balls, pockets, moving } = g;
    if (!W || !H) return;

    const cw = ctx.canvas.width / dpr;
    const ch = ctx.canvas.height / dpr;
    ctx.clearRect(0, 0, cw, ch);

    const woodGrad = ctx.createLinearGradient(0, 0, cw, ch);
    woodGrad.addColorStop(0, '#5c3317');
    woodGrad.addColorStop(0.35, '#8b5e3c');
    woodGrad.addColorStop(0.7, '#3e2010');
    ctx.fillStyle = woodGrad;
    ctx.beginPath(); roundRect(ctx, 0, 0, cw, ch, 22); ctx.fill();

    ctx.strokeStyle = 'rgba(255,220,160,0.25)';
    ctx.lineWidth = 6;
    ctx.beginPath(); roundRect(ctx, 6, 6, cw - 12, ch - 12, 16); ctx.stroke();

    const feltGrad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H)*0.75);
    feltGrad.addColorStop(0, '#0d8a4a');
    feltGrad.addColorStop(0.55, '#0a6f3e');
    feltGrad.addColorStop(1, '#053d22');
    ctx.fillStyle = feltGrad;
    ctx.beginPath(); roundRect(ctx, inset, inset, W - inset*2, H - inset*2, 4); ctx.fill();

    ctx.save();
    ctx.globalAlpha = 0.035;
    ctx.strokeStyle = '#fff';
    for (let x = inset; x < W - inset; x += 3.5) {
      ctx.beginPath(); ctx.moveTo(x, inset); ctx.lineTo(x, H - inset); ctx.stroke();
    }
    ctx.restore();

    const vignette = ctx.createRadialGradient(W/2, H/2, H*0.08, W/2, H/2, Math.max(W,H)*0.65);
    vignette.addColorStop(0, 'rgba(255,255,255,0.09)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.fillStyle = vignette;
    ctx.fillRect(inset, inset, W - inset*2, H - inset*2);

    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 8]);
    ctx.beginPath(); ctx.moveTo(W*0.28, inset + 4); ctx.lineTo(W*0.28, H - inset - 4); ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath(); ctx.arc(W*0.72, H/2, R*0.22, 0, Math.PI*2); ctx.fill();

    for (const p of pockets) {
      const pg = ctx.createRadialGradient(p.x, p.y, PR*0.15, p.x, p.y, PR*1.4);
      pg.addColorStop(0, '#111'); pg.addColorStop(0.75, '#050505'); pg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = pg;
      ctx.beginPath(); ctx.arc(p.x, p.y, PR*1.4, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#2c1708'; ctx.lineWidth = R*0.52;
      ctx.beginPath(); ctx.arc(p.x, p.y, PR*0.95, 0, Math.PI*2); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,200,120,0.4)'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(p.x - R*0.12, p.y - R*0.12, PR*0.82, 0, Math.PI*2); ctx.stroke();
    }

    const cue = balls.find(b => b.num === 0);
    if (!moving && cue && !cue.inPocket && g.turn === 'human' && g.cueAnim >= 1 && g.phase === 'playing') {
      const dir = g.aimDir;
      let hitDist = Infinity;
      let hitBall: Ball | null = null;
      for (const b of balls) {
        if (b.num === 0 || b.inPocket) continue;
        const oc = b.pos.sub(cue.pos);
        const b_dot_dir = oc.dot(dir);
        if (b_dot_dir < 0) continue;
        const h2 = oc.dot(oc) - b_dot_dir * b_dot_dir;
        if (h2 > (R * 2) * (R * 2)) continue;
        const d = b_dot_dir - Math.sqrt((R * 2) * (R * 2) - h2);
        if (d < hitDist) { hitDist = d; hitBall = b; }
      }
      const L = inset + R, RT = W - inset - R, TOP = inset + R, BOT = H - inset - R;
      if (dir.x > 0) hitDist = Math.min(hitDist, (RT - cue.pos.x) / dir.x);
      if (dir.x < 0) hitDist = Math.min(hitDist, (L - cue.pos.x) / dir.x);
      if (dir.y > 0) hitDist = Math.min(hitDist, (BOT - cue.pos.y) / dir.y);
      if (dir.y < 0) hitDist = Math.min(hitDist, (TOP - cue.pos.y) / dir.y);
      const aimEnd = cue.pos.add(dir.mul(hitDist));
      ctx.save();
      ctx.shadowColor = 'rgba(255,255,255,0.7)'; ctx.shadowBlur = 12;
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 3.5; ctx.setLineDash([10, 12]);
      ctx.beginPath(); ctx.moveTo(cue.pos.x, cue.pos.y); ctx.lineTo(aimEnd.x, aimEnd.y); ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1.4; ctx.setLineDash([10, 12]);
      ctx.beginPath(); ctx.moveTo(cue.pos.x, cue.pos.y); ctx.lineTo(aimEnd.x, aimEnd.y); ctx.stroke();
      ctx.setLineDash([]);
      if (hitBall) {
        ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(aimEnd.x, aimEnd.y, R, 0, Math.PI*2); ctx.stroke();
        const normal = hitBall.pos.sub(aimEnd).norm();
        ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(hitBall.pos.x, hitBall.pos.y); 
        ctx.lineTo(hitBall.pos.x + normal.x * R * 4, hitBall.pos.y + normal.y * R * 4); ctx.stroke();
      }
    }

    for (const b of balls) {
      if (b.inPocket && b.pottedAnim >= 1) continue;
      const scale = b.inPocket ? 1 - b.pottedAnim : 1;
      drawBall(ctx, b, scale, R);
    }

    if (cue && !cue.inPocket) {
      const anim = g.cueAnim;
      const isAiming = (g.turn === 'human' && !moving);
      const retract = isAiming ? R*2.6 + power*R*17.5 : R*2.6 + (1 - Math.min(1, anim*2))*power*R*17.5;
      const tipX = cue.pos.x - g.aimDir.x * (R + retract);
      const tipY = cue.pos.y - g.aimDir.y * (R + retract);
      const buttX = tipX - g.aimDir.x * 355;
      const buttY = tipY - g.aimDir.y * 355;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 12; ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 6;
      const cueGrad = ctx.createLinearGradient(tipX, tipY, buttX, buttY);
      cueGrad.addColorStop(0, '#f0e0c0'); cueGrad.addColorStop(0.12, '#d4b88a'); cueGrad.addColorStop(0.65, '#8f5f3a');
      cueGrad.addColorStop(0.88, '#5c3317'); cueGrad.addColorStop(0.92, '#2ecc71'); cueGrad.addColorStop(1, '#2a1808');
      ctx.lineCap = 'round'; ctx.lineWidth = 11; ctx.strokeStyle = '#3a2108';
      ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.lineTo(buttX, buttY); ctx.stroke();
      ctx.lineWidth = 8; ctx.strokeStyle = cueGrad;
      ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.lineTo(buttX, buttY); ctx.stroke();
      ctx.lineWidth = 4.5; ctx.strokeStyle = '#4fc3f7';
      ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.lineTo(tipX - g.aimDir.x*9, tipY - g.aimDir.y*9); ctx.stroke();
      ctx.restore();
    }

    if (g.foulTimer > 0) {
      const alpha = Math.min(1, g.foulTimer / 40);
      ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = '#ff4757';
      ctx.font = `bold ${R*1.35}px 'Courier New', monospace`; ctx.textAlign = 'center';
      ctx.fillText(g.foulMsg, W/2, H/2 - R*2.2); ctx.restore();
    }
  }, [power]);

  const setupGame = useCallback((W: number, H: number) => {
    const g = G.current;
    const R = Math.min(W, H) * 0.026;
    const PR = R * 1.65;
    const inset = R * 3.3;
    g.tableW = W; g.tableH = H; g.ballR = R; g.pocketR = PR; g.inset = inset;
    g.pockets = [
      new Vec2(inset*0.55, inset*0.55), new Vec2(W/2, inset*0.48), new Vec2(W - inset*0.55, inset*0.55),
      new Vec2(inset*0.55, H - inset*0.55), new Vec2(W/2, H - inset*0.48), new Vec2(W - inset*0.55, H - inset*0.55),
    ];
    const balls: Ball[] = [];
    const headSpot = new Vec2(W * 0.72, H / 2);
    const rackNums = [1,9,2,8,15,3,14,4,13,5,12,6,11,7,10];
    let ri = 0;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col <= row; col++) {
        const num = rackNums[ri++];
        balls.push({
          num, color: COLORS[num], stripeColor: num > 8 ? '#f0ede8' : undefined,
          type: num < 8 ? 'solid' : num > 8 ? 'stripe' : undefined,
          pos: new Vec2(headSpot.x + row * R * 2.02 * Math.cos(Math.PI / 6), headSpot.y + col * R * 2.02 - row * R * 0.5),
          vel: new Vec2(), angVel: 0, angle: 0, r: R, mass: 1, inPocket: false, pocketAnim: 0, pottedAnim: 0
        });
      }
    }
    balls.push({ num: 0, color: COLORS[0], pos: new Vec2(W * 0.28, H / 2), vel: new Vec2(), angVel: 0, angle: 0, r: R, mass: 1.05, inPocket: false, pocketAnim: 0, pottedAnim: 0 });
    g.balls = balls;
    g.humanPotted = []; g.aiPotted = []; g.pottedThisTurn = [];
    g.turn = 'human'; g.humanType = null; g.aiType = null;
    g.winner = null; g.phase = 'playing'; g.moving = false;
    g.aimDir = new Vec2(-1, 0); g.cueAnim = 1; g.foulMsg = ''; g.foulTimer = 0;
    forceUpdate({});
  }, []);

  const physicsStep = useCallback(() => {
    const g = G.current;
    const { balls, pockets, tableW: W, tableH: H, ballR: R, pocketR: PR, inset } = g;
    const L = inset, RT = W - inset, TOP = inset, BOT = H - inset;
    const newPotted: Ball[] = [];
    for (let s = 0; s < SUB_STEPS; s++) {
      const dt = 1 / SUB_STEPS;
      for (const b of balls) {
        if (b.inPocket) continue;
        b.pos = b.pos.add(b.vel.mul(dt));
        b.vel = b.vel.mul(FRICTION);
        b.angVel *= ANG_FRIC;
        b.angle += b.angVel * dt;
        if (b.vel.len() < MIN_VEL) b.vel = new Vec2();
        if (Math.abs(b.angVel) < 0.01) b.angVel = 0;
      }
      for (const b of balls) {
        if (b.inPocket) continue;
        const { pos: p, vel: v } = b;
        if (p.x - R < L) { p.x = L + R; b.vel.x = Math.abs(v.x) * WALL_REST; b.vel.y += b.angVel * 1.2; b.angVel *= 0.75; }
        if (p.x + R > RT) { p.x = RT - R; b.vel.x = -Math.abs(v.x) * WALL_REST; b.vel.y += b.angVel * 1.2; b.angVel *= 0.75; }
        if (p.y - R < TOP) { p.y = TOP + R; b.vel.y = Math.abs(v.y) * WALL_REST; b.vel.x += b.angVel * 1.2; }
        if (p.y + R > BOT) { p.y = BOT - R; b.vel.y = -Math.abs(v.y) * WALL_REST; b.vel.x += b.angVel * 1.2; }
      }
      for (let i = 0; i < balls.length; i++) {
        const a = balls[i]; if (a.inPocket) continue;
        for (let j = i + 1; j < balls.length; j++) {
          const b = balls[j]; if (b.inPocket) continue;
          const delta = a.pos.sub(b.pos); const dist = delta.len(); const minD = a.r + b.r;
          if (dist >= minD || dist === 0) continue;
          const overlap = minD - dist; const norm = delta.norm(); const corr = overlap / 2;
          a.pos = a.pos.add(norm.mul(corr)); b.pos = b.pos.sub(norm.mul(corr));
          const tan = new Vec2(-norm.y, norm.x);
          const van = a.vel.dot(norm), vat = a.vel.dot(tan);
          const vbn = b.vel.dot(norm), vbt = b.vel.dot(tan);
          const mA = a.mass, mB = b.mass, totalM = mA + mB;
          const vanNew = (van * (mA - mB) + 2 * mB * vbn) / totalM;
          const vbnNew = (vbn * (mB - mA) + 2 * mA * van) / totalM;
          a.vel = norm.mul(vanNew * RESTITUTION).add(tan.mul(vat));
          b.vel = norm.mul(vbnNew * RESTITUTION).add(tan.mul(vbt));
          const relSlip = (a.angVel - b.angVel) * 0.18; a.angVel -= relSlip; b.angVel += relSlip;
        }
      }
    }
    for (const b of balls) {
      if (b.inPocket) continue;
      for (const p of pockets) {
        if (b.pos.distTo(p) < PR * 1.08) {
          b.inPocket = true; b.vel = new Vec2(); b.angVel = 0; b.pottedAnim = 0;
          newPotted.push(b); break;
        }
      }
    }
    for (const b of balls) { if (b.inPocket && b.pottedAnim < 1) b.pottedAnim = Math.min(1, b.pottedAnim + 0.085); }
    const anyMoving = balls.some(b => !b.inPocket && (b.vel.len() > MIN_VEL || Math.abs(b.angVel) > 0.01));
    return { anyMoving, newPotted };
  }, []);

  const handleShoot = useCallback((p: number, s: Vec2) => {
    const g = G.current; const cue = g.balls.find(b => b.num === 0);
    if (!cue || g.moving || g.turn !== 'human' || g.phase === 'gameOver') return;
    cue.vel = g.aimDir.mul(p * MAX_POWER); cue.angVel = s.x * 22;
    g.moving = true; g.pottedThisTurn = []; g.cueAnim = 0; forceUpdate({});
  }, []);

  const aiShot = useCallback(() => {
    const g = G.current; if (g.phase === 'gameOver') return;
    const cue = g.balls.find(b => b.num === 0); if (!cue || g.moving || g.turn !== 'ai') return;
    let targets = g.balls.filter(b => !b.inPocket && b.num !== 0 && b.num !== 8);
    if (g.aiType) targets = targets.filter(b => b.type === g.aiType);
    if (targets.length === 0) targets = [g.balls.find(b => b.num === 8)!];
    const target = targets[Math.floor(Math.random() * targets.length)];
    if (!target) return;
    const noise = (Math.random() - 0.5) * 0.05;
    g.aimDir = target.pos.add(new Vec2(noise, noise)).sub(cue.pos).norm();
    setTimeout(() => {
      const p = 0.4 + Math.random() * 0.5;
      cue.vel = g.aimDir.mul(p * MAX_POWER); g.moving = true; g.pottedThisTurn = []; g.cueAnim = 0; forceUpdate({});
    }, 1500);
  }, []);

  const handleTurnEnd = useCallback((potted: Ball[]) => {
    const g = G.current; const cue = g.balls.find(b => b.num === 0); const eight = g.balls.find(b => b.num === 8);
    let foul = false; let msg = '';
    if (cue?.inPocket) { foul = true; msg = 'SCRATCH!'; cue.inPocket = false; cue.pos = new Vec2(g.tableW * 0.28, g.tableH / 2); cue.vel = new Vec2(); }
    if (eight?.inPocket) {
      const win = (g.turn === 'human' && g.humanPotted.length === 7) || (g.turn === 'ai' && g.aiPotted.length === 7);
      g.winner = win ? g.turn : (g.turn === 'human' ? 'ai' : 'human');
      g.phase = 'gameOver'; forceUpdate({}); return;
    }
    if (!g.humanType && potted.length > 0) {
      const first = potted.find(b => b.num !== 0 && b.num !== 8);
      if (first) {
        g.humanType = g.turn === 'human' ? first.type! : (first.type === 'solid' ? 'stripe' : 'solid');
        g.aiType = g.humanType === 'solid' ? 'stripe' : 'solid';
      }
    }
    potted.forEach(b => {
      if (b.num === 0 || b.num === 8) return;
      if (b.type === g.humanType) g.humanPotted.push(b.num); else if (b.type === g.aiType) g.aiPotted.push(b.num);
    });
    const validPot = potted.some(b => (g.turn === 'human' && b.type === g.humanType) || (g.turn === 'ai' && b.type === g.aiType) || (!g.humanType && b.num !== 0 && b.num !== 8));
    if (foul || !validPot) g.turn = g.turn === 'human' ? 'ai' : 'human';
    if (foul) { g.foulMsg = msg; g.foulTimer = 120; }
    g.moving = false; g.cueAnim = 0; forceUpdate({});
    if (g.turn === 'ai') aiShot();
  }, [aiShot]);

  useEffect(() => {
    const loop = () => {
      const g = G.current; if (g.foulTimer > 0) g.foulTimer--; if (g.cueAnim < 1) g.cueAnim += 0.05;
      if (g.moving) {
        const { anyMoving, newPotted } = physicsStep();
        g.pottedThisTurn.push(...newPotted);
        if (!anyMoving) handleTurnEnd(g.pottedThisTurn);
      }
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) { const dpr = window.devicePixelRatio || 1; drawScene(ctx, dpr); }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [physicsStep, handleTurnEnd, drawScene]);

  useEffect(() => {
    const w = wrapRef.current; if (w) setupGame(w.clientWidth, w.clientHeight);
  }, [setupGame]);

  const handlePointerDown = (e: React.PointerEvent) => { if (G.current.turn !== 'human' || G.current.moving) return; G.current.isDragging = true; handlePointerMove(e); };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!G.current.isDragging || G.current.moving) return;
    const rect = canvasRef.current?.getBoundingClientRect(); if (!rect) return;
    const x = (e.clientX - rect.left) * (G.current.tableW / rect.width);
    const y = (e.clientY - rect.top) * (G.current.tableH / rect.height);
    const cue = G.current.balls.find(b => b.num === 0);
    if (cue) { G.current.aimDir = new Vec2(x, y).sub(cue.pos).norm(); forceUpdate({}); }
  };
  const handlePointerUp = () => { G.current.isDragging = false; };

  const g = G.current;
  const isHumanTurn = g.turn === 'human' && !g.moving;

  return (
    <div ref={wrapRef} style={css.root} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
      {!landscape && <div style={css.landscapePrompt}>Please rotate to landscape for the best experience</div>}
      <canvas ref={canvasRef} width={g.tableW * (window.devicePixelRatio || 1)} height={g.tableH * (window.devicePixelRatio || 1)} style={{ width: '100%', height: '100%', touchAction: 'none' }} onPointerDown={handlePointerDown} />
      <div style={css.hud}>
        <div style={{ ...css.playerInfo, opacity: g.turn === 'human' ? 1 : 0.5 }}>
          <div style={css.playerName}>PLAYER 1 {g.humanType && `(${g.humanType.toUpperCase()}S)`}</div>
          <div style={css.ballList}>
            {[1,2,3,4,5,6,7].map(n => {
              const num = g.humanType === 'stripe' ? n + 8 : n;
              const potted = g.humanPotted.includes(num);
              return <div key={n} style={{ ...css.ballDot, backgroundColor: COLORS[num], opacity: potted ? 0.2 : 1 }} />;
            })}
          </div>
        </div>
        <div style={css.turnIndicator}>
          <div style={{ ...css.turnBar, transform: `translateX(${g.turn === 'human' ? '-50%' : '50%'})` }} />
          <div style={css.turnText}>{g.turn === 'human' ? "YOUR TURN" : "AI THINKING..."}</div>
        </div>
        <div style={{ ...css.playerInfo, opacity: g.turn === 'ai' ? 1 : 0.5, alignItems: 'flex-end' }}>
          <div style={css.playerName}>AI OVERLORD {g.aiType && `(${g.aiType.toUpperCase()}S)`}</div>
          <div style={css.ballList}>
            {[1,2,3,4,5,6,7].map(n => {
              const num = g.aiType === 'stripe' ? n + 8 : n;
              const potted = g.aiPotted.includes(num);
              return <div key={n} style={{ ...css.ballDot, backgroundColor: COLORS[num], opacity: potted ? 0.2 : 1 }} />;
            })}
          </div>
        </div>
      </div>
      {isHumanTurn && (
        <div style={css.controls}>
          <div style={css.controlGroup}>
            <label style={css.label}>POWER</label>
            <input type="range" min="0.1" max="1" step="0.01" value={power} onChange={e => setPower(parseFloat(e.target.value))} style={css.range} />
          </div>
          <button style={css.shootBtn} onClick={() => handleShoot(power, spin)}>SHOOT</button>
          <div style={css.controlGroup}>
            <label style={css.label}>SPIN (ENGLISH)</label>
            <div style={css.spinPad} onPointerDown={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
              const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
              setSpin(new Vec2(x, y));
            }}>
              <div style={{ ...css.spinDot, left: `${(spin.x + 1) * 50}%`, top: `${(spin.y + 1) * 50}%` }} />
            </div>
          </div>
        </div>
      )}
      {g.phase === 'gameOver' && (
        <div style={css.overlay}>
          <h1 style={css.winTitle}>{g.winner === 'human' ? 'VICTORY' : 'DEFEAT'}</h1>
          <p style={css.winSub}>{g.winner === 'human' ? 'You cleared the table.' : 'The AI was too precise.'}</p>
          <button style={css.retryBtn} onClick={() => setupGame(g.tableW, g.tableH)}>PLAY AGAIN</button>
          <button style={css.backBtn} onClick={onBackToHub}>BACK TO ARCADE</button>
          <button style={{ ...css.backBtn, marginTop: 10 }} onClick={onReturnToFeeds}>BACK TO FEEDS</button>
        </div>
      )}
      <button style={css.helpBtn} onClick={() => setShowHelp(true)}>?</button>
      {showHelp && (
        <div style={css.overlay} onClick={() => setShowHelp(false)}>
          <div style={css.helpCard} onClick={e => e.stopPropagation()}>
            <h2 style={css.helpTitle}>HOW TO PLAY</h2>
            <ul style={css.helpList}>
              <li>Drag on table to aim</li>
              <li>Adjust power slider for strength</li>
              <li>Use spin pad for "English" (curve/stop)</li>
              <li>Pot all your balls, then the 8-ball to win</li>
            </ul>
            <button style={css.retryBtn} onClick={() => setShowHelp(false)}>GOT IT</button>
          </div>
        </div>
      )}
    </div>
  );
};

const css: Record<string, React.CSSProperties> = {
  root: { width: '100%', height: '100%', position: 'relative', background: '#000', overflow: 'hidden', cursor: 'crosshair' },
  landscapePrompt: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, textAlign: 'center', padding: 20, fontWeight: 'bold' },
  hud: { position: 'absolute', top: 0, left: 0, right: 0, height: 80, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)', pointerEvents: 'none' },
  playerInfo: { display: 'flex', flexDirection: 'column', gap: 4 },
  playerName: { color: '#fff', fontSize: 12, fontWeight: 900, letterSpacing: 1 },
  ballList: { display: 'flex', gap: 6 },
  ballDot: { width: 14, height: 14, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)' },
  turnIndicator: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  turnBar: { width: 120, height: 3, background: '#2ecc71', borderRadius: 2, transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' },
  turnText: { color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: 2, opacity: 0.6 },
  controls: { position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 30, background: 'rgba(0,0,0,0.7)', padding: '15px 30px', borderRadius: 40, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' },
  controlGroup: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  label: { color: '#fff', fontSize: 9, fontWeight: 900, opacity: 0.5, letterSpacing: 1 },
  range: { width: 120, accentColor: '#2ecc71' },
  shootBtn: { background: '#2ecc71', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: 25, fontWeight: 900, letterSpacing: 2, cursor: 'pointer', boxShadow: '0 4px 15px rgba(46, 204, 113, 0.4)' },
  spinPad: { width: 50, height: 50, borderRadius: '50%', background: '#fff', position: 'relative', cursor: 'pointer', border: '2px solid #2ecc71' },
  spinDot: { width: 8, height: 8, background: '#ff4757', borderRadius: '50%', position: 'absolute', transform: 'translate(-50%, -50%)', pointerEvents: 'none' },
  overlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(5px)' },
  winTitle: { color: '#fff', fontSize: 80, fontWeight: 900, margin: 0, letterSpacing: -2 },
  winSub: { color: '#2ecc71', fontSize: 18, fontWeight: 500, marginBottom: 30 },
  retryBtn: { background: '#fff', color: '#000', border: 'none', padding: '15px 40px', borderRadius: 30, fontWeight: 900, letterSpacing: 1, cursor: 'pointer', marginBottom: 15 },
  backBtn: { background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', padding: '12px 30px', borderRadius: 30, fontWeight: 700, cursor: 'pointer' },
  helpBtn: { position: 'absolute', bottom: 20, right: 20, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer' },
  helpCard: { background: '#1a1a1a', padding: 40, borderRadius: 24, maxWidth: 400, textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' },
  helpTitle: { color: '#fff', fontSize: 24, fontWeight: 900, marginBottom: 20 },
  helpList: { color: 'rgba(255,255,255,0.7)', textAlign: 'left', fontSize: 14, lineHeight: 1.8, marginBottom: 30 },
};

export default PoolGamePage;
