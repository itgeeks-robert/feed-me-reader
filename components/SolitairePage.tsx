import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SeymourIcon } from './icons';
import type { SolitaireStats } from '../src/App';

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
  stats: SolitaireStats;
  onGameWin: (time: number, moves: number) => void;
  onGameStart: () => void;
}

type GamePhase = 'intro' | 'dealing' | 'playing' | 'won';

// --- Card Rendering Logic ---

const CardFace = ({ card }: { card: Card }) => {
    const color = (card.suit === '♥' || card.suit === '♦') ? 'text-red-700' : 'text-black';
    const rank = card.rank;
    const suit = card.suit;

    return (
        <div className="w-full h-full bg-white rounded-md relative text-[calc(var(--card-width)/6)]">
            
            {/* Corner Text (Top Left) */}
            <div className={`absolute top-1 left-1.5 font-bold text-[1.8em] leading-none ${color}`}>
                {rank}
            </div>

            {/* Large Central Suit Logo */}
            <div className={`w-full h-full flex items-center justify-center text-[3.5em] ${color}`}>
                {suit}
            </div>

            {/* Corner Text (Bottom Right) */}
             <div className={`absolute bottom-1 right-1.5 font-bold text-[1.8em] leading-none rotate-180 ${color}`}>
                {rank}
            </div>
        </div>
    );
};


// --- SolitairePage Component ---
const SolitairePage: React.FC<SolitairePageProps> = ({ onBackToHub, stats, onGameWin, onGameStart }) => {
  const [gamePhase, setGamePhase] = useState<GamePhase>('intro');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [history, setHistory] = useState<GameState[]>([]);
  const [time, setTime] = useState(0);
  const timerRef = useRef<number | null>(null);
  const [selectedInfo, setSelectedInfo] = useState<{ type: string; pileIndex: number; cardIndex: number; } | null>(null);

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = window.setInterval(() => setTime(t => t + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
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

    const newGameState: GameState = {
      stock: deck,
      waste: [],
      foundations: [[], [], [], []],
      tableau: Array.from({ length: 7 }, () => []),
      moves: 0,
      score: 0,
    };
    
    setGameState(newGameState);
    setHistory([]);
    setTime(0);
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
    }, 50);

  }, [stopTimer, startTimer, onGameStart]);


  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);
  
  const canPlaceOnTableau = (cardToMove: Card, destinationPile: Pile): boolean => {
    if (!cardToMove || typeof cardToMove.value === 'undefined') return false;
    if (destinationPile.length === 0) return cardToMove.value === 13; // King
    const topCard = destinationPile[destinationPile.length - 1];
    if (!topCard.isFaceUp) return false;
    const isMovingCardRed = cardToMove.suit === '♥' || cardToMove.suit === '♦';
    const isTopCardRed = topCard.suit === '♥' || topCard.suit === '♦';
    if (isMovingCardRed === isTopCardRed) return false;
    return cardToMove.value === topCard.value - 1;
  };

  const canPlaceOnFoundation = (cardToMove: Card, destinationPile: Pile) => {
    if (!cardToMove) return false;
    if (destinationPile.length === 0) return cardToMove.value === 1; // Ace
    const topCard = destinationPile[destinationPile.length - 1];
    if (cardToMove.suit !== topCard.suit) return false;
    return cardToMove.value === topCard.value + 1;
  };
  
  const moveCards = (from: { type: string; pileIndex: number; cardIndex: number; }, to: { type: string; pileIndex: number; }) => {
    if (!gameState) return;
    const newState = JSON.parse(JSON.stringify(gameState)) as GameState;
    let sourcePile: Pile;

    if(from.type === 'tableau') sourcePile = newState.tableau[from.pileIndex];
    else if (from.type === 'waste') sourcePile = newState.waste;
    else if (from.type === 'foundation') sourcePile = newState.foundations[from.pileIndex];
    else return;

    const cardsToMove = sourcePile.splice(from.cardIndex);
    newState.moves++;

    // Scoring
    if (to.type === 'foundation') {
        if (from.type === 'tableau' || from.type === 'waste') newState.score += 10;
    } else if (to.type === 'tableau') {
        if (from.type === 'waste') newState.score += 5;
        if (from.type === 'foundation') newState.score -= 15;
    }
    
    if (from.type === 'tableau' && sourcePile.length > 0 && !sourcePile[sourcePile.length-1].isFaceUp) {
        sourcePile[sourcePile.length-1].isFaceUp = true;
        newState.score += 5;
    }
    if (newState.score < 0) newState.score = 0;


    if(to.type === 'tableau') newState.tableau[to.pileIndex].push(...cardsToMove);
    else newState.foundations[to.pileIndex].push(...cardsToMove);
    
    pushHistoryAndSetState(newState);
    setSelectedInfo(null);
  };
  
  const handleCardClick = (type: string, pileIndex: number, cardIndex: number) => {
    if (gamePhase !== 'playing' || !gameState) return;

    const getClickedCard = () => {
        if (!gameState) return null;
        if (type === 'tableau') return gameState.tableau[pileIndex]?.[cardIndex];
        if (type === 'waste') return gameState.waste?.[cardIndex];
        if (type === 'foundation') return gameState.foundations[pileIndex]?.[cardIndex];
        return null;
    }
    const clickedCard = getClickedCard();
    if (!clickedCard || !clickedCard.isFaceUp) return;

    const isTopCard = (type === 'waste' && cardIndex === gameState.waste.length - 1) || (type === 'tableau' && cardIndex === gameState.tableau[pileIndex].length - 1);
    if (isTopCard) {
        for (let i = 0; i < 4; i++) {
            if (canPlaceOnFoundation(clickedCard, gameState.foundations[i])) {
                moveCards({ type, pileIndex, cardIndex }, { type: 'foundation', pileIndex: i });
                return;
            }
        }
    }
    
    if (selectedInfo) {
      const { type: fromType, pileIndex: fromPileIndex, cardIndex: fromCardIndex } = selectedInfo;
      const sourcePile = fromType === 'tableau' ? gameState.tableau[fromPileIndex] : fromType === 'waste' ? gameState.waste : gameState.foundations[fromPileIndex];
      const cardToMove = sourcePile[fromCardIndex];
      const isStack = sourcePile.length - fromCardIndex > 1;

      if (type === fromType && pileIndex === fromPileIndex) {
        setSelectedInfo(null); return;
      }

      if (type === 'tableau' && canPlaceOnTableau(cardToMove, gameState.tableau[pileIndex])) {
        moveCards(selectedInfo, { type: 'tableau', pileIndex });
      } else if (type === 'foundation' && !isStack && canPlaceOnFoundation(cardToMove, gameState.foundations[pileIndex])) {
        moveCards(selectedInfo, { type: 'foundation', pileIndex });
      } else {
        setSelectedInfo(null);
      }
    } else {
      setSelectedInfo({ type, pileIndex, cardIndex });
    }
  };

  const handleEmptyPileClick = (type: string, pileIndex: number) => {
    if (gamePhase !== 'playing' || !selectedInfo || !gameState) return;
    const { type: fromType, pileIndex: fromPileIndex, cardIndex: fromCardIndex } = selectedInfo;

    let sourcePile: Pile | undefined;
    if (fromType === 'tableau') sourcePile = gameState.tableau[fromPileIndex];
    else if (fromType === 'waste') sourcePile = gameState.waste;
    else if (fromType === 'foundation') sourcePile = gameState.foundations[fromPileIndex];

    if (!sourcePile) {
      setSelectedInfo(null);
      return;
    }

    const cardToMove = sourcePile[fromCardIndex];
    
    if (type === 'tableau' && canPlaceOnTableau(cardToMove, [])) {
      moveCards(selectedInfo, { type, pileIndex });
    } else if (type === 'foundation' && sourcePile.length - fromCardIndex === 1 && canPlaceOnFoundation(cardToMove, [])) {
      moveCards(selectedInfo, { type, pileIndex });
    } else {
      setSelectedInfo(null);
    }
  };
  
  const handleDrawFromStock = () => {
    if (gamePhase !== 'playing' || !gameState) return;
    const newState = JSON.parse(JSON.stringify(gameState));
    newState.moves++;
    if (newState.stock.length > 0) {
        const drawnCard = newState.stock.pop();
        drawnCard.isFaceUp = true;
        newState.waste.push(drawnCard);
    } else {
        newState.score = Math.max(0, newState.score - 20);
        newState.stock = newState.waste.reverse().map((c: Card) => ({...c, isFaceUp: false}));
        newState.waste = [];
    }
    pushHistoryAndSetState(newState);
  };
  
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const newHistory = [...history];
    const prevState = newHistory.pop();
    setHistory(newHistory);
    setGameState(prevState!);
  }, [history]);

  return (
    <div 
      className="flex-grow flex flex-col bg-zinc-900 overflow-auto font-sans relative select-none"
      style={{ padding: 'var(--board-padding, 0.5rem)' }}
    >
        {gamePhase === 'intro' ? 
            <IntroScreen onStart={startNewGame} onBackToHub={onBackToHub} stats={stats} /> : 
            <GameBoard 
                gamePhase={gamePhase}
                gameState={gameState}
                selectedInfo={selectedInfo}
                time={time}
                onDraw={handleDrawFromStock}
                onCardClick={handleCardClick}
                onEmptyPileClick={handleEmptyPileClick}
                onNewGame={startNewGame}
                onUndo={handleUndo}
            />
        }
    </div>
  );
};

// --- Child Components ---

const IntroScreen: React.FC<{ onStart: () => void; onBackToHub: () => void; stats: SolitaireStats }> = ({ onStart, onBackToHub, stats }) => {
    const formatTime = (seconds: number | null) => {
        if (seconds === null) return '-';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const StatItem: React.FC<{label: string, value: string | number}> = ({ label, value }) => (
        <div className="text-center">
            <div className="text-xs text-yellow-200/60 uppercase tracking-wider">{label}</div>
            <div className="text-2xl font-bold text-white">{value}</div>
        </div>
    );

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 animate-fade-in">
            <div className="relative text-center p-8 bg-[#35654d]/80 backdrop-blur-md rounded-3xl shadow-2xl border border-yellow-300/20 w-full max-w-md">
                <h1 className="text-5xl font-['Helvetica',_sans-serif] font-bold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-br from-yellow-200 to-amber-400">SOLITAIRE</h1>
                <div className="my-6 grid grid-cols-3 gap-4 border-y border-yellow-300/20 py-4">
                    <StatItem label="Wins" value={stats.gamesWon} />
                    <StatItem label="Best Time" value={formatTime(stats.fastestTime)} />
                    <StatItem label="Streak" value={stats.currentStreak} />
                </div>
                <button
                    onClick={onStart}
                    className="w-full bg-gradient-to-b from-yellow-400 to-amber-600 text-zinc-900 font-bold py-3 px-8 rounded-lg shadow-lg text-xl tracking-wide hover:from-yellow-300 hover:to-amber-500 transition-all duration-300 transform hover:scale-105"
                >
                    Start Game
                </button>
                <button onClick={onBackToHub} className="mt-4 text-sm font-medium text-yellow-200/60 hover:text-white">
                    Back to Hub
                </button>
            </div>
        </div>
    );
};

const GameInfo: React.FC<{ time: number; moves: number; score: number }> = ({ time, moves, score }) => {
    const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}`.padStart(2, '0') + ':' + `${seconds % 60}`.padStart(2, '0');
    return (
        <div 
            className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 select-none pointer-events-none"
            style={{ top: `calc(var(--card-height) + (var(--board-gap) / 2) + 4 * var(--tableau-overlap))` }}
        >
            <h1 className="text-3xl font-sans font-thin tracking-[0.3em] text-yellow-200/60 uppercase">
                Solitaire
            </h1>
            <div className="flex items-center justify-between w-full max-w-xs font-['Helvetica',_sans_serif] text-base md:text-lg text-yellow-200/70">
                <div className="text-center flex-1"><span className="text-xs opacity-70 block">Score</span> {score}</div>
                <div className="text-center flex-1"><span className="text-xs opacity-70 block">Time</span> {formatTime(time)}</div>
                <div className="text-center flex-1"><span className="text-xs opacity-70 block">Moves</span> {moves}</div>
            </div>
        </div>
    );
};

const ControlsBar: React.FC<{onNewGame: () => void; onUndo: () => void}> = ({ onNewGame, onUndo }) => (
    <div className="absolute bottom-0 left-0 right-0 flex justify-center items-center p-2 z-20">
        <div className="flex items-center gap-4 bg-black/20 backdrop-blur-sm p-2 rounded-full border border-white/10">
            <button onClick={onNewGame} className="px-4 py-1 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors">New Game</button>
            <button onClick={onUndo} className="px-4 py-1 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors">Undo</button>
        </div>
    </div>
);


const GameBoard: React.FC<{
    gamePhase: GamePhase;
    gameState: GameState | null;
    selectedInfo: any;
    time: number;
    onDraw: () => void;
    onCardClick: (type: string, pIdx: number, cIdx: number) => void;
    onEmptyPileClick: (type: string, pIdx: number) => void;
    onNewGame: () => void;
    onUndo: () => void;
}> = (props) => {
    const { gamePhase, gameState, selectedInfo, time, onDraw, onCardClick, onEmptyPileClick, onNewGame, onUndo } = props;
    
    if (!gameState) return null;

    return (
        <div className="relative z-10 w-full h-full">
            <div className="absolute inset-[-2rem] rounded-[2.5rem] p-4 bg-[#4a2c2a] shadow-2xl">
                 <div className="w-full h-full rounded-[1.75rem] p-4 bg-[#35654d] bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%27100%27%20height=%27100%27%20viewBox=%270%200%20100%20100%27%3E%3Cfilter%20id=%27n%27%20x=%270%27%20y=%270%27%3E%3CfeTurbulence%20type=%27fractalNoise%27%20baseFrequency=%270.7%27%20numOctaves=%2710%27%20stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect%20width=%27100%27%20height=%27100%27%20filter=%27url(%23n)%27%20opacity=%270.07%27/%3E%3C/svg%3E')] shadow-[0_0_20px_rgba(0,0,0,0.5)_inset]"></div>
            </div>

            <div className="relative w-full h-full max-w-7xl mx-auto">
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    <div className="absolute grid grid-cols-7 w-full top-0" style={{ gap: 'var(--board-gap)' }}>
                        {Array.from({length: 2}).map((_, i) => <div key={i} className="aspect-[2/3] border border-[#bfa65a]/50 rounded-lg shadow-[0_0_2px_1px_rgba(191,166,90,0.2)_inset]"></div>)}
                        <div className="col-start-4 col-span-4">
                            <div className="grid grid-cols-4" style={{ gap: 'var(--board-gap)' }}>
                                {Array.from({length: 4}).map((_, i) => <div key={i} className="aspect-[2/3] border border-[#bfa65a]/50 rounded-lg shadow-[0_0_2px_1px_rgba(191,166,90,0.2)_inset]"></div>)}
                            </div>
                        </div>
                    </div>
                    <div className="absolute grid grid-cols-7 w-full" style={{ top: `calc(var(--card-height) + var(--board-gap) + 8 * var(--tableau-overlap))` }}>
                         {Array.from({length: 7}).map((_, i) => <div key={i} className="aspect-[2/3] border border-[#bfa65a]/50 rounded-lg shadow-[0_0_2px_1px_rgba(191,166,90,0.2)_inset]"></div>)}
                    </div>
                </div>

                <div className="absolute top-0 left-0 w-full grid grid-cols-7" style={{ gap: 'var(--board-gap)' }}>
                    <div onClick={onDraw}>
                        {gameState.stock.length > 0 ? <Card card={{...gameState.stock[0], isFaceUp: false}} /> : <EmptyPile />}
                    </div>
                    <div>
                        {gameState.waste.length > 0 ? <Card card={gameState.waste[gameState.waste.length - 1]} isSelected={selectedInfo?.type === 'waste'} onClick={() => onCardClick('waste', 0, gameState.waste.length-1)} /> : <EmptyPile />}
                    </div>

                    <div className="col-start-4 col-span-4">
                        <div className="grid grid-cols-4" style={{ gap: 'var(--board-gap)' }}>
                        {gameState.foundations.map((pile, i) => (
                            <div key={i}>
                                {pile.length > 0 ? <Card card={pile[pile.length - 1]} isSelected={selectedInfo?.type === 'foundation' && selectedInfo.pileIndex === i} onClick={() => onCardClick('foundation', i, pile.length - 1)} /> : <EmptyPile onClick={() => onEmptyPileClick('foundation', i)} />}
                            </div>
                        ))}
                        </div>
                    </div>
                </div>

                <div className="absolute w-full" style={{ top: `calc(var(--card-height) + var(--board-gap) + 8 * var(--tableau-overlap))` }}>
                     <div className="grid grid-cols-7" style={{ gap: 'var(--board-gap)' }}>
                        {gameState.tableau.map((pile, i) => (
                            <div key={i} className="relative h-[calc(var(--card-height)_*_2.5)]" onClick={pile.length === 0 ? () => onEmptyPileClick('tableau', i) : undefined}>
                                {pile.map((card, j) => (
                                    <div key={card.id} className="absolute transition-all duration-150" style={{ top: `calc(${j} * var(--tableau-overlap))` }}>
                                        <Card card={card} isSelected={selectedInfo?.type === 'tableau' && selectedInfo.pileIndex === i && selectedInfo.cardIndex <= j} onClick={() => onCardClick('tableau', i, j)} isDealing={gamePhase === 'dealing'} dealIndex={i * 7 + j}/>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
                <GameInfo time={time} moves={gameState.moves} score={gameState.score} />
            </div>

            {gamePhase === 'won' && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-[#35654d]/80 backdrop-blur-lg border border-yellow-300/40 rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center text-white">
                        <h2 className="text-4xl font-['Helvetica',_sans_serif] font-bold text-transparent bg-clip-text bg-gradient-to-br from-yellow-200 to-amber-400">Congratulations!</h2>
                         <button onClick={onNewGame} className="mt-6 w-full bg-gradient-to-b from-yellow-400 to-amber-600 text-zinc-900 font-bold py-3 rounded-lg shadow-lg hover:from-yellow-300 hover:to-amber-500 transition-colors">
                            Play Again
                        </button>
                    </div>
                </div>
            )}
            <ControlsBar onNewGame={onNewGame} onUndo={onUndo} />
        </div>
    );
};

const Card: React.FC<{ card: Card; isSelected?: boolean; onClick?: () => void; isDealing?: boolean; dealIndex?: number }> = ({ card, isSelected, onClick, isDealing, dealIndex }) => {
    
    const animationStyle = isDealing ? { animation: `dealAnimation 0.5s ease-out ${ (dealIndex || 0) * 0.05}s forwards, flipAnimation 0.5s ease-out ${ (dealIndex || 0) * 0.05}s forwards` } : {};

    return (
        <div 
            className={`card-container relative rounded-md shadow-[2px_2px_8px_rgba(0,0,0,0.5)] cursor-pointer transition-transform duration-150 ${isSelected ? 'ring-2 ring-yellow-300 -translate-y-1' : ''}`}
            onClick={onClick}
            style={animationStyle}
        >
            {card.isFaceUp ? (
                <CardFace card={card} />
            ) : (
                <div className="w-full h-full rounded-md bg-[#1c3a5e] border-2 border-black/30 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyMCcgaGVpZ2h0PScyMCcgdmlld0JveD0nMCAwIDIwIDIwJz48cmVjdCB3aWR0aD0nMjAnIGhlaWdodD0nMjAnIGZpbGw9JyMxYzNhNWUnLz48cGF0aCBkPSdNIDUgNSBMIDEwIDEwIEwgNSAxNSBMIDAgMTAgWiBNIDE1IDUgTCAyMCAxMCBMIDE1IDE1IEwgMTAgMTAgWiIgZmlsbC1vcGFjaXR5PScwLjInIGZpbGw9J3doaXRlJy8+PC9zdmc+')]"></div>
            )}
        </div>
    );
};

const EmptyPile: React.FC<{ onClick?: () => void; }> = ({ onClick }) => (
    <div className="card-container" onClick={onClick}></div>
);

const SolitaireStyles = () => (
    <style>{`
        :root {
            --board-gap: clamp(0.25rem, 1.5vw, 1rem);
            --board-padding: clamp(0.25rem, 2vw, 1rem);
            --card-width: min(calc((100vw - 6 * var(--board-gap) - 2 * var(--board-padding)) / 7.2), 6rem);
            --card-aspect-ratio: 1.4;
            --card-height: calc(var(--card-width) * var(--card-aspect-ratio));
            --tableau-overlap: calc(var(--card-height) / 5);
        }
        .card-container {
            width: var(--card-width);
            height: var(--card-height);
        }
        @keyframes dealAnimation {
            from {
                transform: translate(-15vw, -30vh) rotate(-15deg);
                opacity: 0;
            }
            to {
                transform: translate(0, 0) rotate(0);
                opacity: 1;
            }
        }
        @keyframes flipAnimation {
            from { transform: rotateY(0deg); }
            to { transform: rotateY(180deg); }
        }
    `}</style>
);

const SolitairePageWithStyles: React.FC<SolitairePageProps> = (props) => (
  <>
    <SolitaireStyles />
    <SolitairePage {...props} />
  </>
);


export default SolitairePageWithStyles;