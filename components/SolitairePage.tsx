
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowPathIcon, XIcon, VoidIcon } from './icons';
import type { SolitaireStats, SolitaireSettings } from '../src/App';
import { saveHighScore, getHighScores } from '../services/highScoresService';
import HighScoreTable from './HighScoreTable';

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
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 opacity-40"></div>
        <div className="relative z-10 opacity-30">
            <VoidIcon className="w-10 h-10 text-white" />
        </div>
        <div className="absolute top-1 left-1.5 text-[5px] font-mono text-zinc-600 uppercase tracking-tighter opacity-50">SECURE_LINK_v2</div>
        <div className="absolute bottom-1 right-1.5 text-[5px] font-mono text-zinc-600 uppercase tracking-tighter opacity-50 font-black">VOID_CORE_NET</div>
        <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="w-full h-full bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.5)_2px,rgba(0,0,0,0.5)_3px)]"></div>
        </div>
        <div className="absolute inset-0 border border-white/5 rounded-md"></div>
    </div>
);

const CardFace = ({ card }: { card: Card }) => {
    const color = (card.suit === '♥' || card.suit === '♦') ? 'text-pulse-500' : 'text-zinc-950';
    return (
        <div className="w-full h-full bg-zinc-50 rounded-md relative text-[calc(var(--card-width)/6)] border border-black/10 shadow-lg pointer-events-none ring-1 ring-black/5">
            <div className={`absolute top-1 left-1.5 font-black italic text-[1.8em] leading-none ${color}`}>{card.rank}</div>
            <div className={`w-full h-full flex items-center justify-center text-[3.8em] ${color} drop-shadow-sm`}>{card.suit}</div>
            <div className={`absolute bottom-1 right-1.5 font-black italic text-[1.8em] leading-none rotate-180 ${color}`}>{card.rank}</div>
        </div>
    );
};

const SolitairePage: React.FC<SolitairePageProps> = (props) => {
  const { onBackToHub, stats, onGameWin, onGameStart } = props;
  const [gamePhase, setGamePhase] = useState<GamePhase>('intro');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [history, setHistory] = useState<GameState[]>([]);
  const [time, setTime] = useState(0);
  const [initials, setInitials] = useState("");
  const timerRef = useRef<number | null>(null);
  const [selectedInfo, setSelectedInfo] = useState<{ type: string; pileIndex: number; cardIndex: number; } | null>(null);

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
          if (cardToDeal) pile.push(cardToDeal);
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
  }, [stopTimer, startTimer]);

  useEffect(() => { return () => stopTimer(); }, [stopTimer]);
  
  const canPlaceOnTableau = (cardToMove: Card, destinationPile: Pile): boolean => {
    if (!cardToMove) return false;
    if (destinationPile.length === 0) return cardToMove.value === 13; // King on empty
    const topCard = destinationPile[destinationPile.length - 1];
    if (!topCard.isFaceUp) return false;
    const isMovingCardRed = cardToMove.suit === '♥' || cardToMove.suit === '♦';
    const isTopCardRed = topCard.suit === '♥' || topCard.suit === '♦';
    if (isMovingCardRed === isTopCardRed) return false;
    return cardToMove.value === topCard.value - 1;
  };

  const canPlaceOnFoundation = (cardToMove: Card, destinationPile: Pile) => {
    if (!cardToMove) return false;
    if (destinationPile.length === 0) return cardToMove.value === 1; // Ace on empty
    const topCard = destinationPile[destinationPile.length - 1];
    return cardToMove.suit === topCard.suit && cardToMove.value === topCard.value + 1;
  };
  
  const moveCards = (from: { type: string; pileIndex: number; cardIndex: number; }, to: { type: string; pileIndex: number; }) => {
    if (!gameState) return;
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
      } else if (type === 'foundation' && (sourcePile.length - fromCardIndex === 1) && canPlaceOnFoundation(cardToMove, gameState.foundations[pileIndex])) {
        moveCards(selectedInfo, { type: 'foundation', pileIndex });
      } else {
        setSelectedInfo({ type, pileIndex, cardIndex });
      }
    } else {
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
  };

  const handleTableauEmptyClick = (pileIndex: number) => {
    if (gamePhase !== 'playing' || !gameState || !selectedInfo) return;
    const { type: fromType, pileIndex: fromPileIndex, cardIndex: fromCardIndex } = selectedInfo;
    const sourcePile = fromType === 'tableau' ? gameState.tableau[fromPileIndex] : fromType === 'waste' ? gameState.waste : gameState.foundations[fromPileIndex];
    const cardToMove = sourcePile[fromCardIndex];
    
    if (cardToMove.value === 13) { // Only Kings can move to empty tableau
        moveCards(selectedInfo, { type: 'tableau', pileIndex });
    } else {
        setSelectedInfo(null);
    }
  };

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const newHistory = [...history];
    const prevState = newHistory.pop();
    setHistory(newHistory);
    setGameState(prevState!);
    setSelectedInfo(null);
  }, [history]);

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 overflow-y-auto font-sans relative select-none scrollbar-hide">
        <style>{`
            :root { 
                --board-gap: clamp(0.25rem, 1.5vw, 0.75rem); 
                --board-padding: 1rem; 
                --card-width: min(calc((100vw - 6 * var(--board-gap) - 2 * var(--board-padding)) / 7.2), 5.5rem); 
                --card-height: calc(var(--card-width) * 1.4); 
                --tableau-overlap: calc(var(--card-height) / 4); 
            }
            .card-container { width: var(--card-width); height: var(--card-height); }
            
            .alley-bg { 
                background: radial-gradient(circle at center, #065f46 0%, #022c22 100%);
                position: relative;
                min-height: 100%;
            }
            .alley-bg::after {
                content: "";
                position: absolute;
                inset: 0;
                background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%),
                            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34, 197, 94, 0.08) 2px, rgba(34, 197, 94, 0.08) 4px);
                pointer-events: none;
                z-index: 1;
            }
            .game-content { position: relative; z-index: 2; }
            .card-animate { transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        `}</style>
        {gamePhase === 'intro' ? 
            <IntroScreen onStart={startNewGame} onBackToHub={onBackToHub} stats={stats} /> : 
            <div className="w-full h-full alley-bg p-4 flex flex-col items-center">
                 <div className="w-full max-w-5xl flex justify-between items-center mb-8 px-2 game-content">
                    <div className="flex gap-4">
                        <div className="bg-black/70 px-4 py-2 rounded-xl border border-pulse-500/40 shadow-2xl backdrop-blur-md">
                            <span className="text-[8px] font-black text-emerald-500 uppercase block tracking-widest italic">Uptime</span>
                            <span className="text-lg font-black italic font-mono text-white leading-none">{Math.floor(time / 60)}:{String(time % 60).padStart(2, '0')}</span>
                        </div>
                        <div className="bg-black/70 px-4 py-2 rounded-xl border border-pulse-500/40 shadow-2xl backdrop-blur-md">
                            <span className="text-[8px] font-black text-pulse-500 uppercase block tracking-widest italic">Moves</span>
                            <span className="text-lg font-black italic font-mono text-white leading-none">{gameState?.moves || 0}</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleUndo} className="px-6 py-2 bg-zinc-950 border border-white/20 rounded-full text-[10px] font-black uppercase italic text-zinc-400 hover:text-white transition-all shadow-lg active:scale-95">Undo</button>
                        <button onClick={onBackToHub} className="px-6 py-2 bg-zinc-950 border border-white/20 rounded-full text-[10px] font-black uppercase italic text-pulse-500 transition-all shadow-lg active:scale-95">Eject</button>
                    </div>
                </div>

                <div className="w-full max-w-5xl relative flex-grow game-content pb-20">
                    <div className="grid grid-cols-7 w-full gap-[var(--board-gap)] mb-8">
                        <div onClick={() => { if (gamePhase === 'playing' && gameState) { 
                            const newState = JSON.parse(JSON.stringify(gameState));
                            if (newState.stock.length > 0) { const c = newState.stock.pop(); c.isFaceUp = true; newState.waste.push(c); }
                            else if (newState.waste.length > 0) { newState.stock = newState.waste.reverse().map((c: any) => ({...c, isFaceUp: false})); newState.waste = []; }
                            pushHistoryAndSetState(newState);
                            setSelectedInfo(null);
                        }}} className="cursor-pointer relative z-10 hover:scale-105 transition-transform active:scale-95">
                            {gameState?.stock.length ? <Card isSelected={false} card={{isFaceUp: false} as any} /> : <div className="card-container border-2 border-white/20 rounded-md flex items-center justify-center text-white text-2xl font-black bg-black/40">↺</div>}
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
                                <div key={i} className="card-container border-2 border-white/10 rounded-md relative bg-black/30 z-10" onClick={() => selectedInfo && handleCardClick('foundation', i, pile.length - 1)}>
                                    {pile.length > 0 && (
                                        <Card 
                                            card={pile[pile.length - 1]} 
                                            isSelected={selectedInfo?.type === 'foundation' && selectedInfo.pileIndex === i} 
                                            onClick={() => handleCardClick('foundation', i, pile.length - 1)} 
                                            onDoubleClick={() => {}} 
                                        />
                                    )}
                                    {pile.length === 0 && <div className="w-full h-full flex items-center justify-center opacity-10 text-white text-xl font-black pointer-events-none tracking-tighter italic">NODE_{i+1}</div>}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-7 w-full gap-[var(--board-gap)] min-h-[500px]">
                        {gameState?.tableau.map((pile, i) => (
                            <div key={i} className="relative min-h-[var(--card-height)]" onClick={() => pile.length === 0 && handleTableauEmptyClick(i)}>
                                {pile.length === 0 && (
                                    <div className="card-container border-2 border-emerald-500/20 rounded-md bg-black/20 flex items-center justify-center pointer-events-none">
                                        <div className="w-1/3 h-1/3 border border-emerald-500/10 rounded-sm animate-pulse" />
                                    </div>
                                )}
                                {pile.map((card, j) => {
                                    const isSelected = selectedInfo?.type === 'tableau' && selectedInfo.pileIndex === i && selectedInfo.cardIndex <= j;
                                    return (
                                        <div key={card.id} className="absolute w-full" style={{ top: `calc(${j} * var(--tableau-overlap))`, zIndex: j + (isSelected ? 100 : 0) }}>
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
                        ))}
                    </div>
                </div>

                {gamePhase === 'won' && (
                    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-6 text-center">
                        <div className="max-w-sm w-full bg-zinc-900 p-12 rounded-[3rem] border-4 border-emerald-500 shadow-[0_0_100px_rgba(16,185,129,0.3)]">
                            <h2 className="text-5xl font-black italic uppercase tracking-tighter text-emerald-500 mb-4 leading-none">SEQUENCE ALIGNED</h2>
                            <div className="mb-8">
                                <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-4 italic">Post Frequency ID</p>
                                <input 
                                    autoFocus
                                    maxLength={3} 
                                    value={initials} 
                                    onChange={e => setInitials(e.target.value.toUpperCase())}
                                    className="bg-black/50 border-2 border-emerald-500 text-white rounded-xl px-4 py-3 text-center text-2xl font-black w-32 outline-none uppercase italic"
                                    placeholder="???"
                                />
                            </div>
                            <button onClick={() => {
                                saveHighScore('solitaire', {
                                    name: initials.toUpperCase() || "???",
                                    score: time,
                                    displayValue: `${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}`,
                                    date: new Date().toISOString()
                                }, true);
                                setGamePhase('intro');
                            }} className="w-full py-5 bg-pulse-600 text-white font-black text-xl italic uppercase rounded-full hover:scale-105 transition-transform shadow-xl">Transmit Sequence</button>
                        </div>
                    </div>
                )}
            </div>
        }
    </div>
  );
};

const IntroScreen = ({ onStart, onBackToHub, stats }: any) => {
    const topScores = getHighScores('solitaire');
    return (
        <div className="w-full h-full flex items-center justify-center bg-zinc-950 p-6 overflow-y-auto scrollbar-hide">
            <div className="w-full max-w-sm text-center bg-zinc-900 p-10 rounded-[3rem] border-4 border-emerald-500 shadow-[0_0_60px_rgba(16,185,129,0.2)]">
                <div className="mb-6 mx-auto w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/30">
                    <VoidIcon className="w-12 h-12 text-emerald-500 animate-pulse" />
                </div>
                <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2 leading-none">Void Patience</h2>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-8 italic">Signal Alignment Protocol</p>
                
                <HighScoreTable entries={topScores} title="ALIGNMENT" />

                <div className="grid grid-cols-2 gap-4 mt-8 mb-8">
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
                    <button onClick={onStart} className="w-full py-5 bg-pulse-600 hover:bg-pulse-500 text-white font-black uppercase italic rounded-2xl transition-all shadow-xl border-2 border-white/10 active:scale-95 text-lg">Sync Sequence</button>
                    <button onClick={onBackToHub} className="text-zinc-500 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors pt-4 block w-full italic">Return to Hub</button>
                </div>
            </div>
        </div>
    );
};

const Card = ({ card, isSelected, onClick, onDoubleClick }: any) => (
    <div 
        onClick={onClick} 
        onDoubleClick={onDoubleClick}
        className={`card-container rounded-md shadow-2xl cursor-pointer transition-all card-animate ${isSelected ? 'ring-4 ring-pulse-500 -translate-y-4 shadow-pulse-500/20' : 'hover:-translate-y-1'}`}
    >
        {card.isFaceUp ? <CardFace card={card} /> : <CardBack />}
    </div>
);

export default SolitairePage;
