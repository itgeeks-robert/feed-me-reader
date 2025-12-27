
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowPathIcon, XIcon } from './icons';
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
  score: number;
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

const CardFace = ({ card }: { card: Card }) => {
    const color = (card.suit === '♥' || card.suit === '♦') ? 'text-flesh-500' : 'text-black';
    return (
        <div className="w-full h-full bg-zinc-100 rounded-md relative text-[calc(var(--card-width)/6)] border border-black/10">
            <div className={`absolute top-1 left-1.5 font-black italic text-[1.8em] leading-none ${color}`}>{card.rank}</div>
            <div className={`w-full h-full flex items-center justify-center text-[3.5em] ${color}`}>{card.suit}</div>
            <div className={`absolute bottom-1 right-1.5 font-black italic text-[1.8em] leading-none rotate-180 ${color}`}>{card.rank}</div>
        </div>
    );
};

const SolitairePage: React.FC<SolitairePageProps> = (props) => {
  const { onBackToHub, onReturnToFeeds, stats, onGameWin, onGameStart, settings, onUpdateSettings } = props;
  const [gamePhase, setGamePhase] = useState<GamePhase>('intro');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [history, setHistory] = useState<GameState[]>([]);
  const [time, setTime] = useState(0);
  const [initials, setInitials] = useState("");
  const timerRef = useRef<number | null>(null);
  const [selectedInfo, setSelectedInfo] = useState<{ type: string; pileIndex: number; cardIndex: number; } | null>(null);

  const startTimer = useCallback(() => {
    stopTimer();
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

  const handleSaveScore = () => {
    saveHighScore('solitaire', {
        name: initials.toUpperCase() || "???",
        score: time,
        displayValue: `${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}`,
        date: new Date().toISOString()
    }, true);
    setGamePhase('intro');
  };

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
      tableau: Array.from({ length: 7 }, () => []), moves: 0, score: 0,
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
    if (!clickedCard || !clickedCard.isFaceUp) return;

    if (selectedInfo) {
      const { type: fromType, pileIndex: fromPileIndex, cardIndex: fromCardIndex } = selectedInfo;
      const sourcePile = fromType === 'tableau' ? gameState.tableau[fromPileIndex] : fromType === 'waste' ? gameState.waste : gameState.foundations[fromPileIndex];
      const cardToMove = sourcePile[fromCardIndex];
      if (type === fromType && pileIndex === fromPileIndex) { setSelectedInfo(null); return; }
      if (type === 'tableau' && canPlaceOnTableau(cardToMove, gameState.tableau[pileIndex])) moveCards(selectedInfo, { type: 'tableau', pileIndex });
      else if (type === 'foundation' && (sourcePile.length - fromCardIndex === 1) && canPlaceOnFoundation(cardToMove, gameState.foundations[pileIndex])) moveCards(selectedInfo, { type: 'foundation', pileIndex });
      else setSelectedInfo(null);
    } else {
      setSelectedInfo({ type, pileIndex, cardIndex });
    }
  };

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const newHistory = [...history];
    const prevState = newHistory.pop();
    setHistory(newHistory);
    setGameState(prevState!);
  }, [history]);

  return (
    <div className="flex-grow flex flex-col bg-zinc-950 overflow-auto font-sans relative select-none">
        <style>{`
            :root { --board-gap: clamp(0.25rem, 1.5vw, 0.75rem); --board-padding: 1rem; --card-width: min(calc((100vw - 6 * var(--board-gap) - 2 * var(--board-padding)) / 7.2), 5rem); --card-height: calc(var(--card-width) * 1.4); --tableau-overlap: calc(var(--card-height) / 5); }
            .card-container { width: var(--card-width); height: var(--card-height); }
            .alley-bg { background: radial-gradient(circle at center, #1a2e1a 0%, #050a06 100%); }
        `}</style>
        {gamePhase === 'intro' ? 
            <IntroScreen onStart={startNewGame} onBackToHub={onBackToHub} stats={stats} settings={settings} onUpdateSettings={onUpdateSettings} /> : 
            <div className="w-full h-full alley-bg p-4 flex flex-col items-center">
                 <div className="w-full max-w-5xl flex justify-between items-center mb-8 px-2">
                    <div className="flex gap-4">
                        <div className="bg-black/40 px-4 py-2 rounded-xl border border-plant-500/20">
                            <span className="text-[8px] font-black text-plant-500 uppercase block">Uptime</span>
                            <span className="text-lg font-black italic font-mono text-plant-400">{Math.floor(time / 60)}:{String(time % 60).padStart(2, '0')}</span>
                        </div>
                        <div className="bg-black/40 px-4 py-2 rounded-xl border border-plant-500/20">
                            <span className="text-[8px] font-black text-flesh-500 uppercase block">Steps</span>
                            <span className="text-lg font-black italic font-mono text-flesh-400">{gameState?.moves || 0}</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleUndo} className="px-4 py-2 bg-zinc-900 border border-white/5 rounded-full text-[10px] font-black uppercase italic text-zinc-400 hover:text-white">Undo</button>
                        <button onClick={onBackToHub} className="px-4 py-2 bg-zinc-900 border border-white/5 rounded-full text-[10px] font-black uppercase italic text-zinc-400 hover:text-flesh-500">Eject</button>
                    </div>
                </div>

                <div className="w-full max-w-5xl relative flex-grow">
                    <div className="grid grid-cols-7 w-full gap-[var(--board-gap)] mb-8">
                        <div onClick={() => { if (gamePhase === 'playing' && gameState) { 
                            const newState = JSON.parse(JSON.stringify(gameState));
                            if (newState.stock.length > 0) { const c = newState.stock.pop(); c.isFaceUp = true; newState.waste.push(c); }
                            else if (newState.waste.length > 0) { newState.stock = newState.waste.reverse().map((c: any) => ({...c, isFaceUp: false})); newState.waste = []; }
                            pushHistoryAndSetState(newState);
                        }}}>
                            {gameState?.stock.length ? <div className="card-container bg-plant-600 rounded-md border-2 border-plant-400 shadow-lg cursor-pointer"></div> : <div className="card-container border-2 border-white/5 rounded-md flex items-center justify-center text-zinc-800 text-2xl">↺</div>}
                        </div>
                        <div className="relative">
                            {gameState?.waste.slice(-1).map((card, i) => <div key={card.id} className="absolute inset-0"><Card card={card} isSelected={selectedInfo?.type === 'waste'} onClick={() => handleCardClick('waste', 0, gameState.waste.length - 1)} /></div>)}
                        </div>
                        <div className="col-start-4 col-span-4 grid grid-cols-4 gap-[var(--board-gap)]">
                            {gameState?.foundations.map((pile, i) => (
                                <div key={i} className="card-container border-2 border-white/5 rounded-md relative" onClick={() => selectedInfo && moveCards(selectedInfo, { type: 'foundation', pileIndex: i })}>
                                    {pile.length > 0 && <Card card={pile[pile.length - 1]} isSelected={selectedInfo?.type === 'foundation' && selectedInfo.pileIndex === i} onClick={() => handleCardClick('foundation', i, pile.length - 1)} />}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-7 w-full gap-[var(--board-gap)]">
                        {gameState?.tableau.map((pile, i) => (
                            <div key={i} className="relative" onClick={() => pile.length === 0 && selectedInfo && moveCards(selectedInfo, { type: 'tableau', pileIndex: i })}>
                                {pile.map((card, j) => (
                                    <div key={card.id} className="absolute w-full" style={{ top: `calc(${j} * var(--tableau-overlap))` }}>
                                        <Card card={card} isSelected={selectedInfo?.type === 'tableau' && selectedInfo.pileIndex === i && selectedInfo.cardIndex <= j} onClick={() => handleCardClick('tableau', i, j)} />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {gamePhase === 'won' && (
                    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-6 text-center">
                        <div className="max-w-sm w-full bg-zinc-900 p-12 rounded-[3rem] border-4 border-plant-500 shadow-[0_0_100px_rgba(34,197,94,0.3)]">
                            <h2 className="text-5xl font-black italic uppercase tracking-tighter text-plant-500 mb-4">CLEARED</h2>
                            <div className="mb-8">
                                <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-4">Enter Arcade Initials</p>
                                <input 
                                    autoFocus
                                    maxLength={3} 
                                    value={initials} 
                                    onChange={e => setInitials(e.target.value.toUpperCase())}
                                    className="bg-black/50 border-2 border-plant-500 text-plant-500 rounded-xl px-4 py-3 text-center text-2xl font-black w-32 outline-none uppercase italic"
                                    placeholder="???"
                                />
                            </div>
                            <button onClick={handleSaveScore} className="w-full py-5 bg-plant-600 text-black font-black text-xl italic uppercase rounded-full hover:scale-105 transition-transform">Post Record</button>
                        </div>
                    </div>
                )}
            </div>
        }
    </div>
  );
};

const IntroScreen = ({ onStart, onBackToHub, stats, settings, onUpdateSettings }: any) => {
    const topScores = getHighScores('solitaire');
    return (
        <div className="w-full h-full flex items-center justify-center bg-zinc-950 p-6 overflow-y-auto">
            <div className="w-full max-w-sm text-center bg-zinc-900 p-10 rounded-[3rem] border-4 border-plant-500 shadow-[0_0_50px_rgba(34,197,94,0.2)]">
                <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2">Leaf Patience</h2>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-8">Strategic alley survival</p>
                
                <HighScoreTable entries={topScores} title="PATIENCE" />

                <div className="grid grid-cols-2 gap-4 mt-8 mb-8">
                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                        <span className="text-[8px] font-black text-plant-500 uppercase block">Wins</span>
                        <span className="text-xl font-black italic text-white">{stats.gamesWon}</span>
                    </div>
                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                        <span className="text-[8px] font-black text-flesh-500 uppercase block">Streak</span>
                        <span className="text-xl font-black italic text-white">{stats.currentStreak}</span>
                    </div>
                </div>
                <div className="space-y-4">
                    <button onClick={onStart} className="w-full py-4 bg-plant-600 hover:bg-plant-500 text-black font-black uppercase italic rounded-2xl transition-all">Plant Deck</button>
                    <button onClick={onBackToHub} className="text-zinc-500 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors pt-4 block w-full">Back to Hub</button>
                </div>
            </div>
        </div>
    );
};

const Card = ({ card, isSelected, onClick }: any) => (
    <div onClick={onClick} className={`card-container rounded-md shadow-lg cursor-pointer transition-all ${isSelected ? 'ring-4 ring-flesh-500 -translate-y-2' : ''}`}>
        {card.isFaceUp ? <CardFace card={card} /> : <div className="w-full h-full bg-plant-900 rounded-md border-2 border-plant-700 relative overflow-hidden"><div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/leaves.png')]"></div></div>}
    </div>
);

export default SolitairePage;
