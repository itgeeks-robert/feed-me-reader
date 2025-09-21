

import React, { useRef, useEffect, useState, useCallback } from 'react';

// --- Helper Classes and Types ---
class Vector2 {
    x: number;
    y: number;
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    add(vec: Vector2) { return new Vector2(this.x + vec.x, this.y + vec.y); }
    subtract(vec: Vector2) { return new Vector2(this.x - vec.x, this.y - vec.y); }
    multiply(scalar: number) { return new Vector2(this.x * scalar, this.y * scalar); }
    dot(vec: Vector2) { return this.x * vec.x + this.y * vec.y; }
    length() { return Math.sqrt(this.x * this.x + this.y * this.y); }
    normalize() { const len = this.length(); return len > 0 ? new Vector2(this.x / len, this.y / len) : new Vector2(); }
    clone() { return new Vector2(this.x, this.y); }
}

type BallType = 'solid' | 'stripe';
type PlayerType = 'human' | 'ai';
type GamePhase = 'break' | 'playing' | 'gameOver';

interface Ball {
    pos: Vector2;
    vel: Vector2;
    num: number;
    color: string;
    type?: BallType;
    radius: number;
    mass: number;
    inPocket: boolean;
}

// --- Constants ---
const BALL_RADIUS_RATIO = 0.02; // relative to table width
const POCKET_RADIUS_RATIO = 0.035;
const TABLE_INSET_RATIO = 0.05;

const BALL_COLORS: { [key: number]: string } = {
    0: '#ffffff', 1: '#fdd835', 2: '#1e88e5', 3: '#d81b60', 4: '#5e35b1',
    5: '#fb8c00', 6: '#43a047', 7: '#8e24aa', 8: '#212121', 9: '#fdd835',
    10: '#1e88e5', 11: '#d81b60', 12: '#5e35b1', 13: '#fb8c00', 14: '#43a047',
    15: '#8e24aa'
};

// --- UI Sub-components ---
const TopIndicatorBar: React.FC<{ humanPotted: Ball[], aiPotted: Ball[], humanType: BallType | null }> = ({ humanPotted, aiPotted, humanType }) => {
    const isHumanSolids = humanType === 'solid';
    const humanBalls = humanType ? (isHumanSolids ? [1,2,3,4,5,6,7] : [9,10,11,12,13,14,15]) : [];
    const aiBalls = humanType ? (isHumanSolids ? [9,10,11,12,13,14,15] : [1,2,3,4,5,6,7]) : [];
    
    const humanBallsOnTable = humanBalls.filter(num => !humanPotted.some(b => b.num === num));
    const aiBallsOnTable = aiBalls.filter(num => !aiPotted.some(b => b.num === num));
    const humanCanWin = humanBallsOnTable.length === 0 && humanType !== null;
    const aiCanWin = aiBallsOnTable.length === 0 && humanType !== null;

    const BallIcon: React.FC<{ num: number, isPotted: boolean, canWin?: boolean }> = ({ num, isPotted, canWin }) => {
        const ball = { num, color: BALL_COLORS[num], type: num > 8 ? 'stripe' as BallType : 'solid' as BallType };
        return (
            <div className={`w-5 h-5 rounded-full relative transition-all duration-300 ${isPotted ? 'opacity-30 scale-90' : 'opacity-100'} ${canWin ? 'ring-2 ring-yellow-300 shadow-lg' : ''}`} style={{ backgroundColor: ball.color }}>
                {ball.type === 'stripe' && <div className="absolute top-1/4 left-0 w-full h-1/2 bg-white" />}
                <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.6), rgba(255,255,255,0) 70%)' }} />
            </div>
        );
    };

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg z-10 p-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 shadow-lg">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 border-2 border-white/50 flex-shrink-0"></div>
                    <div className="flex flex-wrap gap-1 w-auto sm:w-44">
                        {humanBalls.map(num => <BallIcon key={num} num={num} isPotted={!humanBallsOnTable.includes(num)} />)}
                    </div>
                </div>
                <div className="px-2 flex-shrink-0"><BallIcon num={8} isPotted={false} canWin={humanCanWin || aiCanWin} /></div>
                <div className="flex items-center gap-2 flex-row-reverse">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-pink-600 border-2 border-white/50 flex-shrink-0"></div>
                     <div className="flex flex-wrap-reverse gap-1 w-auto sm:w-44 justify-end">
                        {aiBalls.map(num => <BallIcon key={num} num={num} isPotted={!aiBallsOnTable.includes(num)} />)}
                    </div>
                </div>
            </div>
        </div>
    );
};

const SpinControl: React.FC<{ spin: Vector2, setSpin: (s: Vector2) => void }> = ({ spin, setSpin }) => {
    const controlRef = useRef<HTMLDivElement>(null);
    const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
        if (!controlRef.current) return;
        e.preventDefault();
        const rect = controlRef.current.getBoundingClientRect();
        const touch = 'touches' in e ? e.touches[0] : e;
        const x = (touch.clientX - rect.left - rect.width / 2) / (rect.width / 2);
        const y = (touch.clientY - rect.top - rect.height / 2) / (rect.height / 2);
        const clampedX = Math.max(-1, Math.min(1, x));
        const clampedY = Math.max(-1, Math.min(1, y));
        setSpin(new Vector2(clampedX, clampedY));
    };
    
    return (
        <div ref={controlRef} onMouseDown={handleInteraction} onTouchStart={handleInteraction} onMouseMove={(e) => e.buttons === 1 && handleInteraction(e)} onTouchMove={handleInteraction}
            className="w-20 h-20 bg-black/30 backdrop-blur-sm rounded-full border-2 border-white/20 flex items-center justify-center cursor-pointer">
            <div className="w-16 h-16 bg-white rounded-full relative shadow-inner">
                <div className="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-md"
                    style={{ left: `calc(50% - 0.5rem + ${spin.x * 1.5}rem)`, top: `calc(50% - 0.5rem + ${spin.y * 1.5}rem)` }}
                />
            </div>
        </div>
    );
};

const PowerMeter: React.FC<{ power: number, setPower: (p: number) => void }> = ({ power, setPower }) => {
    const meterRef = useRef<HTMLDivElement>(null);
    const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
        if (!meterRef.current) return;
        e.preventDefault();
        const rect = meterRef.current.getBoundingClientRect();
        const touch = 'touches' in e ? e.touches[0] : e;
        const x = touch.clientX - rect.left;
        const newPower = x / rect.width;
        setPower(Math.max(0, Math.min(1, newPower)));
    };

    return (
        <div ref={meterRef} onMouseDown={handleInteraction} onTouchStart={handleInteraction} onMouseMove={(e) => e.buttons === 1 && handleInteraction(e)} onTouchMove={handleInteraction}
            className="w-48 h-6 bg-black/30 backdrop-blur-sm rounded-full border-2 border-white/20 p-1 cursor-pointer">
            <div className="w-full h-full bg-cyan-400/20 rounded-full relative overflow-hidden">
                <div className="absolute left-0 h-full bg-gradient-to-r from-cyan-400 to-cyan-200 rounded-full transition-all duration-100" style={{ width: `${power * 100}%` }} />
            </div>
        </div>
    );
};

const ShootButton: React.FC<{ onClick: () => void, disabled?: boolean }> = ({ onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled} className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full border-2 border-white/50 shadow-lg text-white font-bold text-sm uppercase tracking-wider disabled:opacity-50 disabled:animate-none active:scale-95 transition-transform">
        SHOOT
    </button>
);

// --- Main PoolGamePage Component ---
const PoolGamePage: React.FC<{ onBackToHub: () => void }> = ({ onBackToHub }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const game = useRef({
        balls: [] as Ball[],
        pockets: [] as Vector2[],
        aimDir: new Vector2(1, 0),
        humanPotted: [] as Ball[],
        aiPotted: [] as Ball[],
        phase: 'playing' as GamePhase,
        ballsMoving: false,
        turn: 'human' as PlayerType,
        humanPlayerBallType: null as BallType | null,
        aiPlayerBallType: null as BallType | null,
        winner: null as PlayerType | null,
        pottedThisTurn: [] as Ball[],
    });
    
    const [tick, setTick] = useState(0);
    const forceUpdate = useCallback(() => setTick(t => t + 1), []);
    
    const [power, setPower] = useState(0.8);
    const [spin, setSpin] = useState(new Vector2(0, 0));
    const shotAnimationProgress = useRef(1);

    const setupGame = useCallback(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const { width, height } = canvas.getBoundingClientRect();
        const BALL_RADIUS = width * BALL_RADIUS_RATIO;
        const POCKET_RADIUS = width * POCKET_RADIUS_RATIO;
        const TABLE_INSET = width * TABLE_INSET_RATIO;
        const pocketInset = TABLE_INSET * 0.9;
        game.current.pockets = [
            new Vector2(pocketInset, pocketInset), new Vector2(width / 2, pocketInset * 0.8), new Vector2(width - pocketInset, pocketInset),
            new Vector2(pocketInset, height - pocketInset), new Vector2(width / 2, height - pocketInset * 0.8), new Vector2(width - pocketInset, height - pocketInset)
        ];

        const balls: Ball[] = [];
        const headSpot = new Vector2(width * 0.75, height / 2);
        const rackOrder = [1, 14, 2, 8, 15, 3, 13, 4, 7, 12, 5, 11, 6, 10, 9];
        let rackIndex = 0;
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j <= i; j++) {
                const num = rackOrder[rackIndex++];
                balls.push({
                    pos: new Vector2(headSpot.x + i * BALL_RADIUS * 1.732, headSpot.y + j * BALL_RADIUS * 2 - i * BALL_RADIUS),
                    vel: new Vector2(), num, color: BALL_COLORS[num], type: num < 8 ? 'solid' : (num > 8 ? 'stripe' : undefined),
                    radius: BALL_RADIUS, mass: 1, inPocket: false,
                });
            }
        }
        balls.push({
            pos: new Vector2(width * 0.25, height / 2), vel: new Vector2(), num: 0,
            color: '#ffffff', radius: BALL_RADIUS, mass: 1.1, inPocket: false
        });
        
        game.current.balls = balls;
        game.current.humanPotted = [];
        game.current.aiPotted = [];
        game.current.phase = 'playing';
        game.current.ballsMoving = false;
        game.current.turn = 'human';
        game.current.humanPlayerBallType = null;
        game.current.aiPlayerBallType = null;
        game.current.winner = null;
        forceUpdate();
    }, [forceUpdate]);

    const handleShoot = useCallback(() => {
        if (game.current.ballsMoving || game.current.turn !== 'human') return;
    
        shotAnimationProgress.current = 0;
    
        const cueBall = game.current.balls.find(b => b.num === 0);
        if (cueBall) {
            const maxPower = 20;
            cueBall.vel = game.current.aimDir.multiply(power * maxPower);
            game.current.pottedThisTurn = [];
            game.current.ballsMoving = true;
            forceUpdate();
        }
    }, [power, forceUpdate]);
    
    const findBestAiShot = useCallback((): { aimDir: Vector2; power: number } | null => {
        const { balls, pockets, aiPlayerBallType } = game.current;
        const cueBall = balls.find(b => b.num === 0);
        if (!cueBall || cueBall.inPocket) return null;

        let targetBallNums: number[] = [];
        const isTableOpen = !aiPlayerBallType;
        if (isTableOpen) {
            targetBallNums = [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15];
        } else {
            const aiBalls = aiPlayerBallType === 'solid' ? [1, 2, 3, 4, 5, 6, 7] : [9, 10, 11, 12, 13, 14, 15];
            const aiBallsOnTable = balls.filter(b => aiBalls.includes(b.num) && !b.inPocket);
            targetBallNums = aiBallsOnTable.length > 0 ? aiBallsOnTable.map(b => b.num) : [8];
        }
        
        const targetBalls = balls.filter(b => targetBallNums.includes(b.num) && !b.inPocket);
        const potentialShots = [];

        for (const targetBall of targetBalls) {
            for (const pocket of pockets) {
                const targetToPocket = pocket.subtract(targetBall.pos);
                const shotDistance = targetToPocket.length();
                const collisionPoint = targetBall.pos.subtract(targetToPocket.normalize().multiply(2 * targetBall.radius));
                const aimDir = collisionPoint.subtract(cueBall.pos).normalize();
                
                let isObstructed = false;
                const obstructingBalls = balls.filter(b => b.num !== 0 && b.num !== targetBall.num && !b.inPocket);
                
                const cuePathLength = collisionPoint.subtract(cueBall.pos).length();
                for (const otherBall of obstructingBalls) {
                    const d = otherBall.pos.subtract(cueBall.pos);
                    const t = d.dot(aimDir);
                    if (t > 0 && t < cuePathLength) {
                        const closestPoint = cueBall.pos.add(aimDir.multiply(t));
                        if (closestPoint.subtract(otherBall.pos).length() < 2 * targetBall.radius) {
                            isObstructed = true; break;
                        }
                    }
                }
                if (isObstructed) continue;

                const targetPathDir = targetToPocket.normalize();
                for (const otherBall of obstructingBalls) {
                    const d = otherBall.pos.subtract(targetBall.pos);
                    const t = d.dot(targetPathDir);
                    if (t > 0 && t < shotDistance) {
                        const closestPoint = targetBall.pos.add(targetPathDir.multiply(t));
                        if (closestPoint.subtract(otherBall.pos).length() < 2 * targetBall.radius) {
                           isObstructed = true; break;
                        }
                    }
                }
                if (isObstructed) continue;

                potentialShots.push({ aimDir, power: 0.8, score: 1 / shotDistance });
            }
        }

        if (potentialShots.length > 0) {
            potentialShots.sort((a, b) => b.score - a.score);
            return potentialShots[0];
        }
        
        if (targetBalls.length > 0) {
            const closestTarget = targetBalls.sort((a, b) => a.pos.subtract(cueBall.pos).length() - b.pos.subtract(cueBall.pos).length())[0];
            return { aimDir: closestTarget.pos.subtract(cueBall.pos).normalize(), power: 0.3 };
        }

        return null;
    }, []);

    useEffect(() => {
        if (game.current.turn === 'ai' && !game.current.ballsMoving) {
            const thinkingTimeout = setTimeout(() => {
                const shot = findBestAiShot();
                if (shot) {
                    game.current.aimDir = shot.aimDir;
                    const cueBall = game.current.balls.find(b => b.num === 0);
                    if (cueBall) {
                        const maxPower = 20;
                        cueBall.vel = game.current.aimDir.multiply(shot.power * maxPower);
                        game.current.pottedThisTurn = [];
                        game.current.ballsMoving = true;
                        forceUpdate();
                    }
                } else {
                    console.log("AI cannot find a shot.");
                    game.current.turn = 'human';
                    forceUpdate();
                }
            }, 1500);
            return () => clearTimeout(thinkingTimeout);
        }
    }, [tick, findBestAiShot, forceUpdate]);

    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d'); if (!ctx) return;

        const draw = () => {
            const { width, height } = ctx.canvas.getBoundingClientRect();
            const BALL_RADIUS = width * BALL_RADIUS_RATIO;
            const POCKET_RADIUS = width * POCKET_RADIUS_RATIO;
            const TABLE_INSET = width * TABLE_INSET_RATIO;
            const lightSource = new Vector2(width * 0.6, height * 0.4);

            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = '#1a1a1a'; ctx.fillRect(0, 0, width, height);

            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 20;
            const woodGradient = ctx.createLinearGradient(0, 0, width, height);
            woodGradient.addColorStop(0, '#4a2c2a'); woodGradient.addColorStop(1, '#2d1a1a');
            ctx.fillStyle = woodGradient;
            ctx.fillRect(TABLE_INSET / 2, TABLE_INSET / 2, width - TABLE_INSET, height - TABLE_INSET);
            ctx.restore();
            
            const feltGradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/1.5);
            feltGradient.addColorStop(0, '#0a9a5a'); feltGradient.addColorStop(1, '#067f40');
            ctx.fillStyle = feltGradient;
            ctx.fillRect(TABLE_INSET, TABLE_INSET, width - 2 * TABLE_INSET, height - 2 * TABLE_INSET);
            
            game.current.pockets.forEach(p => {
                ctx.fillStyle = 'black';
                ctx.beginPath(); ctx.arc(p.x, p.y, POCKET_RADIUS, 0, 2 * Math.PI); ctx.fill();
            });

            const { balls } = game.current;
            balls.filter(b => !b.inPocket).forEach(ball => {
                ctx.beginPath(); ctx.arc(ball.pos.x, ball.pos.y, BALL_RADIUS, 0, 2 * Math.PI);
                ctx.fillStyle = ball.color; ctx.fill();
                
                if (ball.type === 'stripe') {
                    ctx.fillStyle = '#f5f5f5';
                    ctx.save();
                    ctx.beginPath(); ctx.arc(ball.pos.x, ball.pos.y, BALL_RADIUS, 0, 2 * Math.PI); ctx.clip();
                    ctx.fillRect(ball.pos.x - BALL_RADIUS, ball.pos.y - BALL_RADIUS * 0.5, BALL_RADIUS * 2, BALL_RADIUS);
                    ctx.restore();
                }
                
                const highlightPos = ball.pos.subtract(lightSource).normalize().multiply(-BALL_RADIUS * 0.4).add(ball.pos);
                const highlight = ctx.createRadialGradient(highlightPos.x, highlightPos.y, 0, highlightPos.x, highlightPos.y, BALL_RADIUS * 0.7);
                highlight.addColorStop(0, 'rgba(255,255,255,0.8)'); highlight.addColorStop(0.5, 'rgba(255,255,255,0)');
                ctx.fillStyle = highlight;
                ctx.beginPath(); ctx.arc(ball.pos.x, ball.pos.y, BALL_RADIUS, 0, 2 * Math.PI); ctx.fill();
            });

            const cueBall = balls.find(b => b.num === 0);
            const isAnimatingCue = shotAnimationProgress.current < 1;
            const shouldShowAiming = cueBall && !cueBall.inPocket && game.current.turn === 'human' && !game.current.ballsMoving && !isAnimatingCue;
            
            if (shouldShowAiming) {
                const aimDir = game.current.aimDir;
                let firstHit: { dist: number, ball: Ball | null } = { dist: Infinity, ball: null };
                for(const ball of balls) {
                    if(ball.num === 0 || ball.inPocket) continue;
                    const oc = ball.pos.subtract(cueBall.pos);
                    const l = aimDir.dot(oc);
                    if (l <= 0) continue;
                    const d2 = oc.dot(oc) - l*l;
                    if (d2 > (BALL_RADIUS*2)**2) continue;
                    const thc = Math.sqrt((BALL_RADIUS*2)**2 - d2);
                    const t0 = l - thc;
                    if (t0 > 0 && t0 < firstHit.dist) firstHit = { dist: t0, ball: ball };
                }

                ctx.save();
                const aimEnd = cueBall.pos.add(aimDir.multiply(firstHit.dist));
                ctx.beginPath(); ctx.moveTo(cueBall.pos.x, cueBall.pos.y); ctx.lineTo(aimEnd.x, aimEnd.y);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'; ctx.lineWidth = 1; ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.restore();
            }

            if ((shouldShowAiming || isAnimatingCue) && cueBall && !cueBall.inPocket) {
                const aimDir = game.current.aimDir;
                let cueRetract;
                if (isAnimatingCue) {
                    const progress = shotAnimationProgress.current;
                    const startRetract = 15 + 100 * power;
                    const endRetract = -15;
                    const easedProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                    cueRetract = startRetract + (endRetract - startRetract) * easedProgress;
                } else {
                    cueRetract = 15 + 100 * power;
                }
                
                const cueStart = cueBall.pos.subtract(aimDir.multiply(cueRetract));
                const cueEnd = cueBall.pos.subtract(aimDir.multiply(cueRetract + 400));
                ctx.save();
                ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 8;
                const cueGradient = ctx.createLinearGradient(cueStart.x, cueStart.y, cueEnd.x, cueEnd.y);
                cueGradient.addColorStop(0, '#d2b48c'); cueGradient.addColorStop(0.8, '#8c6d4f');
                ctx.strokeStyle = cueGradient; ctx.lineWidth = 6; ctx.lineCap = 'round';
                ctx.beginPath(); ctx.moveTo(cueStart.x, cueStart.y); ctx.lineTo(cueEnd.x, cueEnd.y); ctx.stroke();
                ctx.restore();
            }
        };

        const handleTurnEnd = () => {
            const { pottedThisTurn, turn } = game.current;
            const pottedCueBall = pottedThisTurn.some(b => b.num === 0);
            const potted8Ball = pottedThisTurn.some(b => b.num === 8);
            const pottedStripes = pottedThisTurn.filter(b => b.type === 'stripe');
            const pottedSolids = pottedThisTurn.filter(b => b.type === 'solid');

            let foul = pottedCueBall;
            let turnContinues = false;

            if (potted8Ball) {
                const playerBallType = turn === 'human' ? game.current.humanPlayerBallType : game.current.aiPlayerBallType;
                const playerBalls = game.current.balls.filter(b => b.type === playerBallType && !b.inPocket);
                if (playerBalls.length === 0) {
                    game.current.winner = turn;
                } else {
                    game.current.winner = turn === 'human' ? 'ai' : 'human';
                }
                game.current.phase = 'gameOver';
                forceUpdate();
                return;
            }

            if (!game.current.humanPlayerBallType && (pottedSolids.length > 0 || pottedStripes.length > 0)) {
                const firstPotted = pottedThisTurn.find(b => b.type === 'solid' || b.type === 'stripe');
                if (firstPotted) {
                    if (turn === 'human') {
                        game.current.humanPlayerBallType = firstPotted.type;
                        game.current.aiPlayerBallType = firstPotted.type === 'solid' ? 'stripe' : 'solid';
                    } else {
                        game.current.aiPlayerBallType = firstPotted.type;
                        game.current.humanPlayerBallType = firstPotted.type === 'solid' ? 'stripe' : 'solid';
                    }
                }
            }
            
            const playerBallType = turn === 'human' ? game.current.humanPlayerBallType : game.current.aiPlayerBallType;
            const successfulPot = pottedThisTurn.some(b => b.type === playerBallType);

            if (successfulPot && !foul) {
                turnContinues = true;
            }
            
            if (!turnContinues) {
                game.current.turn = turn === 'human' ? 'ai' : 'human';
            }

            if (pottedCueBall) {
                const cueBall = game.current.balls.find(b => b.num === 0);
                if (cueBall) {
                    cueBall.inPocket = false;
                    cueBall.pos = new Vector2(canvas.getBoundingClientRect().width * 0.25, canvas.getBoundingClientRect().height / 2);
                    cueBall.vel = new Vector2();
                }
            }

            pottedThisTurn.forEach(pottedBall => {
                if(pottedBall.type === game.current.humanPlayerBallType) game.current.humanPotted.push(pottedBall);
                if(pottedBall.type === game.current.aiPlayerBallType) game.current.aiPotted.push(pottedBall);
            });

            forceUpdate();
        };

        const update = () => {
            const { balls, pockets } = game.current;
            const { width, height } = canvas.getBoundingClientRect();
            const POCKET_RADIUS = width * POCKET_RADIUS_RATIO;
            const TABLE_INSET = width * TABLE_INSET_RATIO;
            const left = TABLE_INSET; const right = width - TABLE_INSET;
            const top = TABLE_INSET; const bottom = height - TABLE_INSET;

            let ballsStillMoving = false;
            const newPottedBalls: Ball[] = [];

            const SUB_STEPS = 5;
            for (let step = 0; step < SUB_STEPS; step++) {
                balls.forEach(b => {
                    if (b.inPocket) return;
                    b.pos = b.pos.add(b.vel.multiply(1 / SUB_STEPS));
                    b.vel = b.vel.multiply(0.998); 
                    if (b.vel.length() < 0.05) b.vel = new Vector2();
                });

                balls.forEach(b => {
                    if (b.inPocket) return;
                    if (b.pos.x - b.radius < left) { b.pos.x = left + b.radius; b.vel.x *= -0.8; }
                    if (b.pos.x + b.radius > right) { b.pos.x = right - b.radius; b.vel.x *= -0.8; }
                    if (b.pos.y - b.radius < top) { b.pos.y = top + b.radius; b.vel.y *= -0.8; }
                    if (b.pos.y + b.radius > bottom) { b.pos.y = bottom - b.radius; b.vel.y *= -0.8; }
                });

                for (let i = 0; i < balls.length; i++) {
                    for (let j = i + 1; j < balls.length; j++) {
                        const b1 = balls[i]; const b2 = balls[j];
                        if (b1.inPocket || b2.inPocket) continue;
                        const distVec = b1.pos.subtract(b2.pos);
                        const dist = distVec.length();
                        if (dist < b1.radius + b2.radius) {
                            const overlap = (b1.radius + b2.radius - dist) / 2;
                            b1.pos = b1.pos.add(distVec.normalize().multiply(overlap));
                            b2.pos = b2.pos.subtract(distVec.normalize().multiply(overlap));
                            
                            const normal = distVec.normalize();
                            const tangent = new Vector2(-normal.y, normal.x);
                            const v1n = b1.vel.dot(normal); const v1t = b1.vel.dot(tangent);
                            const v2n = b2.vel.dot(normal); const v2t = b2.vel.dot(tangent);
                            const v1n_new = (v1n * (b1.mass - b2.mass) + 2 * b2.mass * v2n) / (b1.mass + b2.mass);
                            const v2n_new = (v2n * (b2.mass - b1.mass) + 2 * b1.mass * v1n) / (b1.mass + b2.mass);
                            b1.vel = normal.multiply(v1n_new).add(tangent.multiply(v1t));
                            b2.vel = normal.multiply(v2n_new).add(tangent.multiply(v2t));
                        }
                    }
                }
            }
            
            balls.forEach(b => {
                if (b.inPocket) return;
                pockets.forEach(p => {
                    if (b.pos.subtract(p).length() < POCKET_RADIUS) {
                        b.inPocket = true; b.vel = new Vector2();
                        newPottedBalls.push(b);
                    }
                });
                if (b.vel.length() > 0) ballsStillMoving = true;
            });

            return { ballsStillMoving, newPottedBalls };
        };
        
        let animationFrameId: number;
        const renderLoop = () => {
            if (shotAnimationProgress.current < 1) shotAnimationProgress.current += 0.08;
            if (game.current.ballsMoving) {
                const { ballsStillMoving, newPottedBalls } = update();
                if (newPottedBalls.length > 0) {
                    game.current.pottedThisTurn.push(...newPottedBalls);
                }
                if (!ballsStillMoving) {
                    game.current.ballsMoving = false;
                    handleTurnEnd();
                }
            }
            draw();
            animationFrameId = window.requestAnimationFrame(renderLoop);
        };
        
        const resizeCanvas = () => {
            const parent = canvas.parentElement;
            if (parent) {
                const dpr = window.devicePixelRatio || 1;
                const { width, height } = parent.getBoundingClientRect();
                canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
                canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
                ctx.scale(dpr, dpr);
                setupGame();
            }
        };
        resizeCanvas();
        renderLoop();

        const getEventPos = (e: MouseEvent | TouchEvent) => {
            const rect = canvas.getBoundingClientRect();
            const touch = 'touches' in e ? e.touches[0] || e.changedTouches[0] : e;
            return new Vector2(touch.clientX - rect.left, touch.clientY - rect.top);
        };
        const onAim = (e: MouseEvent | TouchEvent) => {
            if (game.current.turn !== 'human' || game.current.ballsMoving || shotAnimationProgress.current < 1) return;
            const cueBall = game.current.balls.find(b => b.num === 0);
            if (!cueBall || cueBall.inPocket) return;
            const pos = getEventPos(e);
            const newDir = pos.subtract(cueBall.pos).normalize();
            if(newDir.length() > 0) game.current.aimDir = newDir;
        };
        
        window.addEventListener('resize', resizeCanvas);
        canvas.addEventListener('mousemove', onAim);
        canvas.addEventListener('touchmove', onAim, { passive: true });

        return () => {
            window.cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resizeCanvas);
            canvas.removeEventListener('mousemove', onAim);
            canvas.removeEventListener('touchmove', onAim);
        };
    }, [forceUpdate, findBestAiShot, setupGame]);

    return (
        <div className="w-full h-full bg-black flex flex-col relative font-sans text-white overflow-hidden">
            <TopIndicatorBar humanPotted={game.current.humanPotted} aiPotted={game.current.aiPotted} humanType={game.current.humanPlayerBallType} />
            <main className="flex-grow relative w-full h-full min-h-0">
                <canvas ref={canvasRef} className="w-full h-full" />
            </main>
             <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-between items-end px-4 pointer-events-none">
                <div className="pointer-events-auto"><SpinControl spin={spin} setSpin={setSpin} /></div>
                <div className="flex flex-col items-center gap-2 pointer-events-auto">
                    <PowerMeter power={power} setPower={setPower} />
                    <ShootButton onClick={handleShoot} disabled={game.current.ballsMoving || game.current.turn !== 'human'} />
                </div>
            </div>
            <button onClick={onBackToHub} className="absolute top-5 right-5 z-30 bg-black/30 backdrop-blur-sm p-2 rounded-full text-sm">Back to Hub</button>
            {game.current.winner && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center">
                    <div className="text-center p-8 bg-black/50 rounded-xl">
                        <h2 className="text-4xl font-bold mb-4">{game.current.winner === 'human' ? 'You Win!' : 'AI Wins!'}</h2>
                        {/* Fix: Call setupGame directly. It was previously out of scope. */}
                        <button onClick={setupGame} className="px-6 py-2 bg-cyan-500 text-white font-semibold rounded-lg">Play Again</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PoolGamePage;
