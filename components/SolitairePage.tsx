
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowPathIcon, XIcon, VoidIcon, RadioIcon, BookOpenIcon, SparklesIcon, ExclamationTriangleIcon } from './icons';
import type { SolitaireStats, SolitaireSettings } from '../src/App';
import { saveHighScore, getHighScores } from '../services/highScoresService';
import { soundService } from '../services/soundService';
import HighScoreTable from './HighScoreTable';
import Tooltip from './Tooltip';

const SUITS = ['♥', '♦', '♠', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

interface Card {
  id: string;
  suit: string;
  rank: string;
  value: number;
  isFaceUp: boolean;
}

type Pile = Card[];

interface GameState {
  stock: Pile;
  waste: Pile;
  foundations: Pile[];
  tableau: Pile[];
  moves: number;
}

interface SolitairePageProps {
  onBackToHub: () => void;
  onReturnToFeeds: () => void;
  stats: SolitaireStats;
  onGameWin: (time: number, moves: number) => void;
  onGameStart: () => void;
  settings: SolitaireSettings;
  onUpdateSettings: (settings: SolitaireSettings) => void;
}

type GamePhase = 'intro' | 'dealing' | 'playing' | 'won';

const CardBack = () => (
    <div className="w-full h-full bg-zinc-900 rounded-md border-2 border-zinc-800 relative overflow-hidden shadow-inner flex items-center justify-center">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 opacity-40"></div>
        <div className="relative z-10 opacity-30">
            <VoidIcon className="w-10 h-10 text-white" />
        </div>
        <div className="absolute top-1 left-1.5 text-[5px] font-mono text-zinc-600 uppercase tracking-tighter opacity-50">ENCRYPTED_PACKET</div>
        <div className="absolute bottom-1 right-1.5 text-[5px] font-mono text-zinc-600 uppercase tracking-tighter opacity-50 font-black">VOID_CORE</div>
        <div className="absolute inset-0 border border-white/5 rounded-md"></div>
    </div>
);

const CardFace = ({ card }: { card: Card }) => {
    const isRed = card.suit === '♥' || card.suit === '♦';
    const color = isRed ? 'text-pulse-500' : 'text-emerald-400';
    const glow = isRed ? 'drop-shadow-[0_0_8px_rgba(225,29,72,0.6)]' : 'drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]';

    return (
        <div className="w-full h-full bg-zinc-950 rounded-md relative text-[calc(var(--card-width)/6)] border-2 border-white/5 shadow-2xl pointer-events-none overflow-hidden">
            <div className="absolute inset-0 bg-zinc-900/40 pointer-events-none" />
            <div className={`absolute top-1 left-1.5 font-black italic text-[1.8em] leading-none ${color} ${glow}`}>{card.rank}</div>
            <div className={`w-full h-full flex items-center justify-center text-[3.8em] ${color} ${glow}`}>{card.suit}</div>
            <div className={`absolute bottom-1 right-1.5 font-black italic text-[1.8em] leading-none rotate-180 ${color} ${glow}`}>{card.rank}</div>
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
        </div>
    );
};

const EmptyColumnAnimation = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-start py-4 gap-2 opacity-10 pointer-events-none">
        {[...Array(8)].map((_, i) => (
            <div key={i} className="w-px h-12 bg-white animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
        ))}
    </div>
);

const AlignmentGraphic: React.FC = () => (
    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping" />
        <div className="absolute inset-4 bg-emerald-500/20 rounded-full animate-pulse" />
        <div className="relative z-10 p-8 bg-zinc-900 rounded-[2rem] border-4 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
            <RadioIcon className="w-16 h-16 text-emerald-500" />
        </div>
        <div className="absolute -top-4 -left-4 text-[8px] font-mono text-emerald-500 uppercase tracking-widest animate-pulse font-black italic">PROTOCOL_STABLE</div>
    </div>
);

const SolitairePage: React.FC<SolitairePageProps> = (props) => {
  const { onBackToHub, stats, onGameWin, onGameStart } = props;
  const [gamePhase, setGamePhase] = useState<GamePhase>('intro');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [history, setHistory] = useState<GameState[]>([]);
  const [time, setTime] = useState(0);
  const [initials, setInitials] = useState("");
  const [showScores, setShowScores] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const timerRef = useRef<number | null>(null);
  const [selectedInfo, setSelectedInfo] = useState<{ type: string; pileIndex: number; cardIndex: number; } | null>(null);

  useEffect(() => {
    if (gamePhase === 'intro') {
        const interval = setInterval(() => {
            setShowScores(prev => !prev);
        }, 5000);
        return () => clearInterval(interval);
    }
  }, [gamePhase]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => setTime(t => t + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);
  
  const checkWinCondition = useCallback((state: GameState) => {
    const won = state.foundations.every(p => p.length === 13);
    if (won && gamePhase !== 'won') {
      soundService.playWin();
      setGamePhase('won');
      stopTimer();
      onGameWin(time, state.moves);
    }
  }, [gamePhase, onGameWin, stopTimer, time]);

  const pushHistoryAndSetState = useCallback((newState: GameState) => {
      if (gameState) setHistory(h => [...h, gameState]);
      setGameState(newState);
      checkWinCondition(newState);
  }, [gameState, checkWinCondition]);

  const startNewGame = useCallback(() => {
    soundService.playClick();
    onGameStart();
    stopTimer();
    const deck = SUITS.flatMap(suit => RANKS.map((rank, i) => ({ id: `${rank}-${suit}`, suit, rank, value: i + 1, isFaceUp: false })));
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    const tableau: Pile[] = Array.from({ length: 7 }, (_, i) => deck.splice(0, i + 1));
    const finalTableau = tableau.map(pile => {
        if(pile.length > 0) pile[pile.length - 1].isFaceUp = true;
        return pile;
    });

    setGameState({
      stock: deck, waste: [], foundations: [[], [], [], []],
      tableau: Array.from({ length: 7 }, () => []), moves: 0
    });
    setHistory([]);
    setTime(0);
    setInitials("");
    setSelectedInfo(null);
    setGamePhase('dealing');
    
    let cardDealIndex = 0;
    const dealInterval = setInterval(() => {
      setGameState(current => {
        if (!current) return null;
        const updatedState = JSON.parse(JSON.stringify(current));
        const pileIndex = cardDealIndex % 7;
        const pile = updatedState.tableau[pileIndex];
        if (pile.length < pileIndex + 1) {
          const cardToDeal = finalTableau[pileIndex][pile.length];
          if (cardToDeal) {
              soundService.playPop();
              pile.push(cardToDeal);
          }
        }
        return updatedState;
      });
      cardDealIndex++;
      if (cardDealIndex >= 28) {
        clearInterval(dealInterval);
        setTimeout(() => {
            setGameState(gs => ({...gs!, tableau: finalTableau}));
            setGamePhase('playing');
            startTimer();
        }, 300);
      }
    }, 40);
  }, [stopTimer, startTimer, onGameStart]);

  useEffect(() => { return () => stopTimer(); }, [stopTimer]);
  
  const canPlaceOnTableau = (cardToMove: Card, destinationPile: Pile): boolean => {
    if (!cardToMove) return false;
    if (destinationPile.length === 0) return cardToMove.value === 13; 
    const topCard = destinationPile[destinationPile.length - 1];
    if (!topCard.isFaceUp) return false;
    const isMovingCardRed = cardToMove.suit === '♥' || cardToMove.suit === '♦';
    const isTopCardRed = topCard.suit === '♥' || topCard.suit === '♦';
    if (isMovingCardRed === isTopCardRed) return false;
    return cardToMove.value === topCard.value - 1;
  };

  const canPlaceOnFoundation = (cardToMove: Card, destinationPile: Pile) => {
    if (!cardToMove) return false;
    if (destinationPile.length === 0) return cardToMove.value === 1; 
    const topCard = destinationPile[destinationPile.length - 1];
    return cardToMove.suit === topCard.suit && cardToMove.value === topCard.value + 1;
  };
  
  const moveCards = (from: { type: string; pileIndex: number; cardIndex: number; }, to: { type: string; pileIndex: number; }) => {
    if (!gameState) return;
    soundService.playPop();
    const newState = JSON.parse(JSON.stringify(gameState)) as GameState;
    let sourcePile: Pile = from.type === 'tableau' ? newState.tableau[from.pileIndex] : from.type === 'waste' ? newState.waste : newState.foundations[from.pileIndex];
    const cardsToMove = sourcePile.splice(from.cardIndex);
    newState.moves++;
    
    if (from.type === 'tableau' && sourcePile.length > 0 && !sourcePile[sourcePile.length-1].isFaceUp) {
        sourcePile[sourcePile.length-1].isFaceUp = true;
    }
    
    if(to.type === 'tableau') newState.tableau[to.pileIndex].push(...cardsToMove);
    else newState.foundations[to.pileIndex].push(...cardsToMove);
    
    pushHistoryAndSetState(newState);
    setSelectedInfo(null);
  };
  
  const handleCardClick = (type: string, pileIndex: number, cardIndex: number) => {
    if (gamePhase !== 'playing' || !gameState) return;
    const getClickedCard = () => {
        if (type === 'tableau') return gameState.tableau[pileIndex]?.[cardIndex];
        if (type === 'waste') return gameState.waste?.[cardIndex];
        if (type === 'foundation') return gameState.foundations[pileIndex]?.[cardIndex];
        return null;
    }
    const clickedCard = getClickedCard();
    if (!clickedCard || !clickedCard.isFaceUp) {
        setSelectedInfo(null);
        return;
    }

    if (selectedInfo) {
      const { type: fromType, pileIndex: fromPileIndex, cardIndex: fromCardIndex } = selectedInfo;
      const sourcePile = fromType === 'tableau' ? gameState.tableau[fromPileIndex] : fromType === 'waste' ? gameState.waste : gameState.foundations[fromPileIndex];
      const cardToMove = sourcePile[fromCardIndex];
      
      if (type === fromType && pileIndex === fromPileIndex && cardIndex === fromCardIndex) { 
        setSelectedInfo(null); 
        return; 
      }
      
      if (type === 'tableau' && canPlaceOnTableau(cardToMove, gameState.tableau[pileIndex])) {
        moveCards(selectedInfo, { type: 'tableau', pileIndex });
      } else if (type === 'foundation' && (sourcePile.length - fromCardIndex === 1) && canPlaceOnFoundation(cardToMove, cardToMove && gameState.foundations[pileIndex])) {
        moveCards(selectedInfo, { type: 'foundation', pileIndex });
      } else {
        soundService.playClick();
        setSelectedInfo({ type, pileIndex, cardIndex });
      }
    } else {
      soundService.playClick();
      setSelectedInfo({ type, pileIndex, cardIndex });
    }
  };

  const handleCardDoubleClick = (type: string, pileIndex: number, cardIndex: number) => {
    if (gamePhase !== 'playing' || !gameState) return;
    const sourcePile = type === 'tableau' ? gameState.tableau[pileIndex] : gameState.waste;
    if (cardIndex !== sourcePile.length - 1) return;
    const cardToMove = sourcePile[cardIndex];
    if (!cardToMove || !cardToMove.isFaceUp) return;

    for (let i = 0; i < 4; i++) {
        if (canPlaceOnFoundation(cardToMove, gameState.foundations[i])) {
            moveCards({ type, pileIndex, cardIndex }, { type: 'foundation', pileIndex: i });
            return;
        }
    }
    soundService.playWrong();
  };

  const handleTableauEmptyClick = (pileIndex: number) => {
    if (gamePhase !== 'playing' || !gameState || !selectedInfo) return;
    const { type: fromType, pileIndex: fromPileIndex, cardIndex: fromCardIndex } = selectedInfo;
    const sourcePile = fromType === 'tableau' ? gameState.tableau[fromPileIndex] : fromType === 'waste' ? gameState.waste : gameState.foundations[fromPileIndex];
    const cardToMove = sourcePile[fromCardIndex];
    
    if (cardToMove.value === 13) { 
        moveCards(selectedInfo, { type: 'tableau', pileIndex });
    } else {
        soundService.playWrong();
        setSelectedInfo(null);
    }
  };

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    soundService.playWrong();
    const newHistory = [...history];
    const prevState = newHistory.pop();
    setHistory(newHistory);
    setGameState(prevState!);
    setSelectedInfo(null);
  }, [history]);

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 overflow-y-auto font-mono relative select-none scrollbar-hide">
        <style>{`
            :root { 
                --board-gap: clamp(0.2rem, 1.2vw, 0.6rem); 
                --board-padding: 0.75rem; 
                --card-width: min(calc((100vw - 8 * var(--board-gap) - 2 * var(--board-padding)) / 7.2), 5.2rem); 
                --card-height: calc(var(--card-width) * 1.45); 
                --tableau-overlap: calc(var(--card-height) / 3.8); 
            }
            .card-container { width: var(--card-width); height: var(--card-height); }
            
            .alley-bg { 
                background: #050505;
                position: relative;
                min-height: 100%;
            }
            .alley-bg::before {
                content: "";
                position: absolute;
                inset: 0;
                background-image: linear-gradient(#ffffff03 1px, transparent 1px), linear-gradient(90deg, #ffffff03 1px, transparent 1px);
                background-size: 40px 40px;
                pointer-events: none;
            }
            .alley-bg::after {
                content: "";
                position: absolute;
                inset: 0;
                background: radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.8) 100%),
                            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(16, 185, 129, 0.03) 2px, rgba(16, 185, 129, 0.03) 4px);
                pointer-events: none;
                z-index: 1;
            }
            .game-content { position: relative; z-index: 2; }
            .card-animate { transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1); }
            
            @keyframes data-stream {
                0% { transform: translateY(-100%); opacity: 0; }
                50% { opacity: 0.2; }
                100% { transform: translateY(100%); opacity: 0; }
            }
            .binary-stream {
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                font-family: monospace;
                font-size: 8px;
                color: #10b981;
                opacity: 0.1;
                overflow: hidden;
                pointer-events: none;
                writing-mode: vertical-rl;
                text-orientation: upright;
                white-space: nowrap;
                animation: data-stream 10s linear infinite;
            }
        `}</style>
        {gamePhase === 'intro' ? 
            <IntroScreen onStart={startNewGame} onBackToHub={onBackToHub} onShowHelp={() => { soundService.playClick(); setShowHelp(true); }} stats={stats} showScores={showScores} /> : 
            <div className="w-full h-full alley-bg p-4 flex flex-col items-center">
                 <div className="w-full max-w-5xl flex flex-col md:flex-row justify-between items-center mb-6 px-2 game-content mt-[var(--safe-top)] gap-4">
                    <div className="flex gap-4">
                        <div className="bg-zinc-900 border border-emerald-500/20 px-4 py-2 rounded-lg shadow-xl flex items-center gap-4">
                            <div>
                                <span className="text-[7px] font-black text-emerald-500 uppercase block tracking-widest italic leading-none mb-1">Node_Time</span>
                                <span className="text-sm md:text-lg font-black italic font-mono text-white leading-none">{Math.floor(time / 60)}:{String(time % 60).padStart(2, '0')}</span>
                            </div>
                            <div className="w-px h-6 bg-white/10" />
                            <div>
                                <span className="text-[7px] font-black text-pulse-500 uppercase block tracking-widest italic leading-none mb-1">Packets</span>
                                <span className="text-sm md:text-lg font-black italic font-mono text-white leading-none">{gameState?.moves || 0}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleUndo} className="px-6 py-2 bg-zinc-800 border border-white/10 rounded-full text-[10px] font-black uppercase italic text-zinc-400 hover:text-white transition-all shadow-lg active:scale-95">Undo</button>
                        <button onClick={() => { soundService.playWrong(); onBackToHub(); }} className="px-6 py-2 bg-zinc-800 border border-white/10 rounded-full text-[10px] font-black uppercase italic text-pulse-500 hover:text-white hover:bg-pulse-600 transition-all shadow-lg active:scale-95">Eject</button>
                    </div>
                </div>

                <div className="w-full max-w-5xl relative flex-grow game-content pb-20">
                    <div className="grid grid-cols-7 w-full gap-[var(--board-gap)] mb-10">
                        <div onClick={() => { if (gamePhase === 'playing' && gameState) { 
                            const newState = JSON.parse(JSON.stringify(gameState));
                            if (newState.stock.length > 0) { soundService.playPop(); const c = newState.stock.pop(); c.isFaceUp = true; newState.waste.push(c); }
                            else if (newState.waste.length > 0) { soundService.playAction(); newState.stock = newState.waste.reverse().map((c: any) => ({...c, isFaceUp: false})); newState.waste = []; }
                            pushHistoryAndSetState(newState);
                            setSelectedInfo(null);
                        }}} className="cursor-pointer relative z-10 hover:scale-105 transition-transform active:scale-95 group">
                            {gameState?.stock.length ? <Card isSelected={false} card={{isFaceUp: false} as any} /> : <div className="card-container border-2 border-dashed border-white/10 rounded-md flex items-center justify-center text-white/20 text-xl font-black bg-black/40 group-hover:text-emerald-500 group-hover:border-emerald-500 transition-colors">↺</div>}
                        </div>
                        
                        <div className="relative">
                            {gameState?.waste.slice(-1).map((card, i) => (
                                <div key={card.id} className="absolute inset-0 z-10">
                                    <Card 
                                        card={card} 
                                        isSelected={selectedInfo?.type === 'waste'} 
                                        onClick={() => handleCardClick('waste', 0, gameState.waste.length - 1)} 
                                        onDoubleClick={() => handleCardDoubleClick('waste', 0, gameState.waste.length - 1)}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="col-start-4 col-span-4 grid grid-cols-4 gap-[var(--board-gap)]">
                            {gameState?.foundations.map((pile, i) => (
                                <div key={i} className="card-container border-2 border-white/5 rounded-md relative bg-zinc-900/20 z-10" onClick={() => selectedInfo && handleCardClick('foundation', i, pile.length - 1)}>
                                    {pile.length > 0 && (
                                        <Card 
                                            card={pile[pile.length - 1]} 
                                            isSelected={selectedInfo?.type === 'foundation' && selectedInfo.pileIndex === i} 
                                            onClick={() => handleCardClick('foundation', i, pile.length - 1)} 
                                            onDoubleClick={() => {}} 
                                        />
                                    )}
                                    {pile.length === 0 && <div className="w-full h-full flex items-center justify-center opacity-5 text-white text-lg font-black pointer-events-none tracking-tighter italic">BUF_0{i+1}</div>}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-7 w-full gap-[var(--board-gap)] min-h-[450px]">
                        {gameState?.tableau.map((pile, i) => {
                            const isEmpty = pile.length === 0;
                            return (
                                <div key={i} className="relative min-h-[var(--card-height)]" onClick={() => isEmpty && handleTableauEmptyClick(i)}>
                                    {isEmpty && (
                                        <div className="card-container border-2 border-emerald-500/10 rounded-md bg-emerald-500/5 flex flex-col items-center justify-center pointer-events-none overflow-hidden relative">
                                            <EmptyColumnAnimation />
                                            <span className="text-[6px] font-black text-emerald-500/40 uppercase tracking-widest relative z-10">EMPTY_NODE</span>
                                        </div>
                                    )}
                                    {pile.map((card, j) => {
                                        const isSelected = selectedInfo?.type === 'tableau' && selectedInfo.pileIndex === i && selectedInfo.cardIndex <= j;
                                        return (
                                            <div key={card.id} className="absolute w-full card-animate" style={{ top: `calc(${j} * var(--tableau-overlap))`, zIndex: j + (isSelected ? 100 : 0) }}>
                                                <Card 
                                                    card={card} 
                                                    isSelected={isSelected} 
                                                    onClick={() => handleCardClick('tableau', i, j)} 
                                                    onDoubleClick={() => handleCardDoubleClick('tableau', i, j)}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {gamePhase === 'won' && (
                    <div className="fixed inset-0 bg-black/98 backdrop-blur-md z-50 flex items-center justify-center p-6 text-center animate-fade-in">
                        <div className="max-w-sm w-full bg-zinc-900 p-12 rounded-[3.5rem] border-4 border-emerald-500 shadow-[0_0_120px_rgba(16,185,129,0.4)]">
                            <div className="mb-8 mx-auto w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center border-2 border-emerald-500 animate-pulse">
                                <SparklesIcon className="w-12 h-12 text-emerald-500" />
                            </div>
                            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-emerald-500 mb-4 leading-none">SIGNAL ALIGNED</h2>
                            <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.4em] mb-10 italic">Core synchronized at 100% efficiency.</p>
                            <div className="mb-10">
                                <p className="text-zinc-500 font-bold uppercase tracking-widest text-[9px] mb-4 italic">Register Operator ID</p>
                                <input 
                                    autoFocus
                                    maxLength={3} 
                                    value={initials} 
                                    onChange={e => setInitials(e.target.value.toUpperCase())}
                                    className="bg-black/50 border-2 border-emerald-500 text-white rounded-xl px-4 py-3 text-center text-3xl font-black w-32 outline-none uppercase italic shadow-2xl"
                                    placeholder="???"
                                />
                            </div>
                            <button onClick={() => {
                                soundService.playClick();
                                saveHighScore('solitaire', {
                                    name: initials.toUpperCase() || "???",
                                    score: time,
                                    displayValue: `${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}`,
                                    date: new Date().toISOString()
                                }, true);
                                setGamePhase('intro');
                            }} className="w-full py-5 bg-emerald-600 text-white font-black text-xl italic uppercase rounded-full hover:bg-emerald-500 transition-all shadow-xl">Transmit Sequence</button>
                        </div>
                    </div>
                )}
            </div>
        }
        {showHelp && <TacticalManual onClose={() => { soundService.playClick(); setShowHelp(false); }} />}
    </div>
  );
};

const IntroScreen = ({ onStart, onBackToHub, onShowHelp, stats, showScores }: any) => {
    const topScores = getHighScores('solitaire');
    return (
        <div className="w-full h-full flex items-center justify-center bg-zinc-950 p-6 overflow-y-auto scrollbar-hide">
             <style>{`
                @keyframes glitch-in {
                    0% { opacity: 0; transform: scale(0.9) skew(0deg); }
                    10% { opacity: 0.8; transform: scale(1.05) skew(5deg); filter: hue-rotate(90deg); }
                    20% { opacity: 1; transform: scale(1) skew(0deg); filter: hue-rotate(0deg); }
                }
                .animate-glitch-in { animation: glitch-in 0.4s ease-out forwards; }
            `}</style>
            
            <div className="w-full max-w-sm text-center bg-zinc-900 p-10 rounded-[3rem] border-4 border-emerald-500 shadow-[0_0_60px_rgba(16,185,129,0.2)]">
                <header className="mb-10">
                    <span className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.3em] italic block mb-1">Frequency Stack</span>
                    <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none glitch-text">SIGNAL ALIGN</h2>
                </header>

                <div className="h-[240px] flex items-center justify-center mb-8 overflow-hidden relative">
                    <div key={showScores ? 'scores' : 'graphic'} className="w-full animate-glitch-in">
                        {showScores ? (
                            <HighScoreTable entries={topScores} title="ALIGNED" />
                        ) : (
                            <AlignmentGraphic />
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8 mb-10">
                    <div className="bg-black/60 p-4 rounded-2xl border border-white/10 shadow-inner">
                        <span className="text-[8px] font-black text-emerald-500 uppercase block tracking-[0.2em] italic">Syncs</span>
                        <span className="text-xl font-black italic text-white leading-none">{stats.gamesWon}</span>
                    </div>
                    <div className="bg-black/60 p-4 rounded-2xl border border-white/10 shadow-inner">
                        <span className="text-[8px] font-black text-pulse-500 uppercase block tracking-[0.2em] italic">Streak</span>
                        <span className="text-xl font-black italic text-white leading-none">{stats.currentStreak}</span>
                    </div>
                </div>
                <div className="space-y-4">
                    <button onClick={onStart} className="w-full py-6 bg-white text-black font-black uppercase italic rounded-2xl transition-all shadow-[6px_6px_0_#10b981] hover:translate-x-[-1px] hover:translate-y-[-1px] active:scale-95 text-xl">Establish Sync</button>
                    <button onClick={onShowHelp} className="w-full py-4 bg-zinc-800 text-zinc-400 font-black uppercase italic rounded-2xl border border-white/5 hover:text-white transition-all active:scale-95 text-[10px] tracking-[0.3em] flex items-center justify-center gap-3">
                        <BookOpenIcon className="w-4 h-4" /> Tactical_Manual
                    </button>
                    <button onClick={() => { soundService.playWrong(); onBackToHub(); }} className="text-zinc-600 font-bold uppercase tracking-[0.4em] text-[9px] pt-6 block w-full italic hover:text-white transition-colors">Abort_Task</button>
                </div>
            </div>
        </div>
    );
};

const TacticalManual: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-10 font-mono" onClick={onClose}>
            <div className="max-w-xl w-full bg-zinc-900 border-4 border-emerald-500 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh] pt-[var(--safe-top)] pb-[var(--safe-bottom)]" onClick={e => e.stopPropagation()}>
                
                <header className="h-12 bg-emerald-600 flex items-center justify-between px-1 relative z-20 border-b-2 border-black shrink-0">
                    <div className="flex items-center gap-2 h-full">
                        <div className="w-10 h-8 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center">
                           <BookOpenIcon className="w-5 h-5 text-black" />
                        </div>
                        <h2 className="text-white text-[10px] font-black uppercase tracking-[0.2em] italic px-2">SIGNAL_ALIGNMENT_PROTOCOL.PDF</h2>
                    </div>
                    <button onClick={onClose} className="w-10 h-8 bg-zinc-300 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-zinc-600 flex items-center justify-center active:bg-zinc-400 transition-colors">
                        <XIcon className="w-5 h-5 text-black" />
                    </button>
                </header>

                <div className="p-6 md:p-10 overflow-y-auto flex-grow bg-void-950/40 relative">
                    <div className="absolute inset-0 pointer-events-none opacity-5 cctv-overlay" />
                    
                    <section className="space-y-8 relative z-10">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <SparklesIcon className="w-5 h-5 text-emerald-500" />
                                <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Data Organization</h3>
                            </div>
                            <p className="text-[10px] md:text-xs text-zinc-400 uppercase font-black leading-relaxed tracking-wider mb-4 border-l-2 border-emerald-500/30 pl-4">
                                Reconstruct the fractured data stacks into a linear sequential buffer for mainframe transmission.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <ManualPoint title="0x01_Packet_Analysis" desc="Target hidden packets first. Unveiling the full data set is critical for sequential mapping." color="text-emerald-500" />
                            <ManualPoint title="0x02_Buffer_Efficiency" desc="Kings act as node foundations. Only deploy them into empty sectors when you have an immediate sequence follow-up." color="text-emerald-500" />
                            <ManualPoint title="0x03_Foundation_Uplink" desc="Transfer Aces to the top foundation buffers immediately. They anchor the entire decryption string." color="text-emerald-500" />
                            <ManualPoint title="0x04_Alternating_Current" desc="Tableau columns must maintain alternating color patterns and strict descending order to prevent logic interference." color="text-emerald-500" />
                        </div>

                        <div className="p-5 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl flex items-start gap-4">
                            <ExclamationTriangleIcon className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5 animate-pulse" />
                            <div>
                                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1 italic">Pro Tip: Signal Drift</p>
                                <p className="text-[8px] text-zinc-500 uppercase font-black leading-tight italic">
                                    Avoid saturating the waste pile. Constant cycling leads to fragmentation. Move data to the tableau whenever logic permits.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>

                <footer className="p-4 bg-zinc-300 border-t-2 border-black shrink-0">
                    <button onClick={onClose} className="w-full py-4 bg-emerald-600 border-t-2 border-l-2 border-white/50 border-b-2 border-r-2 border-neon-950 text-[10px] font-black uppercase italic text-white hover:bg-emerald-500 active:bg-emerald-700 transition-all shadow-lg">
                        ACKNOWLEDGE_PROTOCOLS
                    </button>
                </footer>
            </div>
        </div>
    );
};

const ManualPoint: React.FC<{ title: string; desc: string; color: string }> = ({ title, desc, color }) => (
    <div className="space-y-2 group">
        <h4 className={`text-[9px] font-black ${color} uppercase tracking-[0.3em] italic flex items-center gap-2`}>
            <span className={`w-1.5 h-1.5 rounded-full ${color.replace('text-', 'bg-')} group-hover:scale-150 transition-transform`}></span>
            {title}
        </h4>
        <p className="text-[10px] md:text-xs text-zinc-300 font-bold uppercase tracking-wide leading-relaxed pl-3 border-l border-zinc-800">
            {desc}
        </p>
    </div>
);

const Card = ({ card, isSelected, onClick, onDoubleClick }: any) => (
    <div 
        onClick={onClick} 
        onDoubleClick={onDoubleClick}
        className={`card-container rounded-md shadow-2xl cursor-pointer transition-all card-animate ${isSelected ? 'ring-4 ring-emerald-500 -translate-y-4 shadow-emerald-500/40 z-[200]' : 'hover:-translate-y-1'}`}
    >
        {card.isFaceUp ? <CardFace card={card} /> : <CardBack />}
    </div>
);

export default SolitairePage;
