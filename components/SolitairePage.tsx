import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { ArrowPathIcon, XIcon } from './icons';
import type { SolitaireStats, SolitaireSettings } from '../src/App';

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
  settings: SolitaireSettings;
  onUpdateSettings: (settings: SolitaireSettings) => void;
  isApiKeyMissing: boolean;
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
const SolitairePage: React.FC<SolitairePageProps> = (props) => {
  const { onBackToHub, stats, onGameWin, onGameStart, settings, onUpdateSettings, isApiKeyMissing } = props;
  const [gamePhase, setGamePhase] = useState<GamePhase>('intro');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [history, setHistory] = useState<GameState[]>([]);
  const [time, setTime] = useState(0);
  const timerRef = useRef<number | null>(null);
  const [selectedInfo, setSelectedInfo] = useState<{ type: string; pileIndex: number; cardIndex: number; } | null>(null);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

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

  const handleCardDoubleClick = (type: string, pileIndex: number, cardIndex: number) => {
    if (gamePhase !== 'playing' || !gameState) return;
    const sourcePile = type === 'tableau' ? gameState.tableau[pileIndex] : type === 'waste' ? gameState.waste : gameState.foundations[pileIndex];
    if (cardIndex !== sourcePile.length - 1) return; // Can only double click the top card
    
    const card = sourcePile[cardIndex];
    if (!card || !card.isFaceUp) return;

    for (let i = 0; i < 4; i++) {
        if (canPlaceOnFoundation(card, gameState.foundations[i])) {
            moveCards({ type, pileIndex, cardIndex }, { type: 'foundation', pileIndex: i });
            return;
        }
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
        const numToDraw = Math.min(settings.drawCount, newState.stock.length);
        for(let i=0; i < numToDraw; i++) {
            const drawnCard = newState.stock.pop();
            drawnCard.isFaceUp = true;
            newState.waste.push(drawnCard);
        }
    } else if (newState.waste.length > 0) {
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
      style={{
        padding: 'var(--board-padding, 0.5rem)',
        backgroundImage: settings.theme ? `url(${settings.theme.background})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
        {gamePhase === 'intro' ? 
            <IntroScreen 
              onStart={startNewGame} 
              onBackToHub={onBackToHub} 
              stats={stats}
              settings={settings}
              onUpdateSettings={onUpdateSettings}
              onCustomize={() => setIsThemeModalOpen(true)}
            /> : 
            <GameBoard 
                gamePhase={gamePhase}
                gameState={gameState}
                selectedInfo={selectedInfo}
                time={time}
                onDraw={handleDrawFromStock}
                onCardClick={handleCardClick}
                onCardDoubleClick={handleCardDoubleClick}
                onEmptyPileClick={handleEmptyPileClick}
                onNewGame={startNewGame}
                onUndo={handleUndo}
                settings={settings}
            />
        }
        {isThemeModalOpen && 
          <CustomizeThemeModal
            onClose={() => setIsThemeModalOpen(false)}
            onApply={(theme) => {
              onUpdateSettings({...settings, theme});
              setIsThemeModalOpen(false);
            }}
            isApiKeyMissing={isApiKeyMissing}
          />
        }
    </div>
  );
};

// --- Child Components ---

const IntroScreen: React.FC<{ 
  onStart: () => void; 
  onBackToHub: () => void; 
  stats: SolitaireStats;
  settings: SolitaireSettings;
  onUpdateSettings: (settings: SolitaireSettings) => void;
  onCustomize: () => void;
}> = ({ onStart, onBackToHub, stats, settings, onUpdateSettings, onCustomize }) => {
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

                <div className="my-6">
                    <div className="text-sm text-yellow-200/60 mb-2">Draw Mode</div>
                    <div className="flex justify-center bg-black/20 p-1 rounded-full">
                      <button onClick={() => onUpdateSettings({...settings, drawCount: 1})} className={`px-6 py-1.5 text-sm font-semibold rounded-full transition-colors ${settings.drawCount === 1 ? 'bg-yellow-400 text-black' : 'text-white/70 hover:bg-white/10'}`}>Draw 1</button>
                      <button onClick={() => onUpdateSettings({...settings, drawCount: 3})} className={`px-6 py-1.5 text-sm font-semibold rounded-full transition-colors ${settings.drawCount === 3 ? 'bg-yellow-400 text-black' : 'text-white/70 hover:bg-white/10'}`}>Draw 3</button>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={onStart}
                        className="flex-grow bg-gradient-to-b from-yellow-400 to-amber-600 text-zinc-900 font-bold py-3 px-8 rounded-lg shadow-lg text-xl tracking-wide hover:from-yellow-300 hover:to-amber-500 transition-all duration-300 transform hover:scale-105"
                    >
                        Start Game
                    </button>
                    <button onClick={onCustomize} className="flex-shrink-0 px-4 bg-white/10 text-yellow-200/80 rounded-lg hover:bg-white/20 transition-colors">
                        Customize
                    </button>
                </div>
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
    onCardDoubleClick: (type: string, pIdx: number, cIdx: number) => void;
    onEmptyPileClick: (type: string, pIdx: number) => void;
    onNewGame: () => void;
    onUndo: () => void;
    settings: SolitaireSettings;
}> = (props) => {
    const { gamePhase, gameState, selectedInfo, time, onDraw, onCardClick, onCardDoubleClick, onEmptyPileClick, onNewGame, onUndo, settings } = props;
    
    if (!gameState) return null;

    const wasteCardsToShow = settings.drawCount === 1 ? gameState.waste.slice(-1) : gameState.waste.slice(-3);

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
                        {gameState.stock.length > 0 ? <Card card={{...gameState.stock[0], isFaceUp: false}} settings={settings}/> : <EmptyPile />}
                    </div>
                    <div className="relative">
                        {wasteCardsToShow.map((card, index) => (
                           <div key={card.id} className="absolute" style={{left: `${index * 25}%`}}>
                                <Card 
                                    card={card}
                                    isSelected={selectedInfo?.type === 'waste' && (gameState.waste.length - wasteCardsToShow.length + index === selectedInfo.cardIndex)} 
                                    onClick={() => onCardClick('waste', 0, gameState.waste.length - wasteCardsToShow.length + index)}
                                    onDoubleClick={() => onCardDoubleClick('waste', 0, gameState.waste.length - wasteCardsToShow.length + index)}
                                    settings={settings}
                                />
                           </div>
                        ))}
                        {gameState.waste.length === 0 && <EmptyPile />}
                    </div>

                    <div className="col-start-4 col-span-4">
                        <div className="grid grid-cols-4" style={{ gap: 'var(--board-gap)' }}>
                        {gameState.foundations.map((pile, i) => (
                            <div key={i}>
                                {pile.length > 0 ? <Card card={pile[pile.length - 1]} isSelected={selectedInfo?.type === 'foundation' && selectedInfo.pileIndex === i} onClick={() => onCardClick('foundation', i, pile.length - 1)} onDoubleClick={() => onCardDoubleClick('foundation', i, pile.length - 1)} settings={settings}/> : <EmptyPile onClick={() => onEmptyPileClick('foundation', i)} />}
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
                                        <Card card={card} isSelected={selectedInfo?.type === 'tableau' && selectedInfo.pileIndex === i && selectedInfo.cardIndex <= j} onClick={() => onCardClick('tableau', i, j)} onDoubleClick={() => onCardDoubleClick('tableau', i, j)} isDealing={gamePhase === 'dealing'} dealIndex={i * 7 + j} settings={settings}/>
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
                        <h2 className="text-4xl font-['Helvetica',_sans-serif] font-bold text-transparent bg-clip-text bg-gradient-to-br from-yellow-200 to-amber-400">Congratulations!</h2>
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

const Card: React.FC<{ card: Card; isSelected?: boolean; onClick?: () => void; onDoubleClick?: () => void; isDealing?: boolean; dealIndex?: number; settings: SolitaireSettings; }> = ({ card, isSelected, onClick, onDoubleClick, isDealing, dealIndex, settings }) => {
    
    const animationStyle = isDealing ? { animation: `dealAnimation 0.5s ease-out ${ (dealIndex || 0) * 0.05}s forwards, flipAnimation 0.5s ease-out ${ (dealIndex || 0) * 0.05}s forwards` } : {};

    return (
        <div 
            className={`card-container relative rounded-md shadow-[2px_2px_8px_rgba(0,0,0,0.5)] cursor-pointer transition-transform duration-150 ${isSelected ? 'ring-2 ring-yellow-300 -translate-y-1' : ''}`}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            style={animationStyle}
        >
            {card.isFaceUp ? (
                <CardFace card={card} />
            ) : (
                <div 
                  className="w-full h-full rounded-md bg-[#1c3a5e] border-2 border-black/30 bg-cover bg-center"
                  style={{ backgroundImage: settings.theme ? `url(${settings.theme.cardBack})` : `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyMCcgaGVpZ2h0PScyMCcgdmlld0JveD0nMCAwIDIwIDIwJz48cmVjdCB3aWR0aD0nMjAnIGhlaWdodD0nMjAnIGZpbGw9JyMxYzNhNWUnLz48cGF0aCBkPSdNIDUgNSBMIDEwIDEwIEwgNSAxNSBMIDAgMTAgWiBNIDE1IDUgTCAyMCAxMCBMIDE1IDE1IEwgMTAgMTAgWiIgZmlsbC1vcGFjaXR5PScwLjInIGZpbGw9J3doaXRlJy8+PC9zdmc+')` }}
                ></div>
            )}
        </div>
    );
};

const EmptyPile: React.FC<{ onClick?: () => void; }> = ({ onClick }) => (
    <div className="card-container" onClick={onClick}></div>
);

const CustomizeThemeModal: React.FC<{
  onClose: () => void;
  onApply: (theme: { cardBack: string; background: string }) => void;
  isApiKeyMissing: boolean;
}> = ({ onClose, onApply, isApiKeyMissing }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedTheme, setGeneratedTheme] = useState<{ cardBack: string; background: string } | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || isApiKeyMissing) return;
    setIsLoading(true);
    setError(null);
    setGeneratedTheme(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const [cardBackRes, backgroundRes] = await Promise.all([
        ai.models.generateImages({
          model: 'imagen-4.0-generate-001',
          prompt: `A playing card back, abstract seamless pattern, ${prompt} theme.`,
          config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
        }),
        ai.models.generateImages({
          model: 'imagen-4.0-generate-001',
          prompt: `A beautiful, seamless background texture for a playing card game table, ${prompt} theme, subtle pattern.`,
          config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
        })
      ]);

      const cardBack = `data:image/jpeg;base64,${cardBackRes.generatedImages[0].image.imageBytes}`;
      const background = `data:image/jpeg;base64,${backgroundRes.generatedImages[0].image.imageBytes}`;

      setGeneratedTheme({ cardBack, background });
    } catch (err) {
      console.error("AI theme generation failed:", err);
      setError(err instanceof Error ? err.message : "Failed to generate images. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#35654d]/90 backdrop-blur-lg border border-yellow-300/30 rounded-2xl shadow-2xl w-full max-w-md text-white p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-yellow-200">Customize Theme with AI</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10"><XIcon className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-yellow-200/70 mb-4">Describe a theme, and AI will generate a custom look for your game.</p>
        
        <div className="relative">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., 'cosmic nebula', 'ancient library'"
            className="w-full bg-black/30 border border-yellow-300/30 rounded-lg py-2.5 px-4 text-white placeholder-yellow-200/50 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            disabled={isLoading || isApiKeyMissing}
          />
        </div>

        {isApiKeyMissing && <p className="text-xs text-red-400 mt-2">API Key is missing. AI features are disabled.</p>}
        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}

        <div className="mt-4 h-32 flex justify-center items-center bg-black/20 rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2 text-yellow-200/70">
              <ArrowPathIcon className="w-8 h-8 animate-spin" />
              <span>Generating...</span>
            </div>
          ) : generatedTheme ? (
            <div className="flex w-full h-full gap-4 p-4">
              <div className="w-1/2 h-full rounded-md bg-cover bg-center" style={{backgroundImage: `url(${generatedTheme.cardBack})`}}><span className="text-xs bg-black/50 px-1 rounded">Card Back</span></div>
              <div className="w-1/2 h-full rounded-md bg-cover bg-center" style={{backgroundImage: `url(${generatedTheme.background})`}}><span className="text-xs bg-black/50 px-1 rounded">Background</span></div>
            </div>
          ) : (
            <span className="text-yellow-200/50">Preview will appear here</span>
          )}
        </div>
        
        <div className="flex gap-4 mt-4">
          <button onClick={handleGenerate} disabled={isLoading || isApiKeyMissing || !prompt.trim()} className="flex-grow bg-gradient-to-b from-yellow-400 to-amber-600 text-zinc-900 font-bold py-2.5 rounded-lg shadow-lg hover:from-yellow-300 hover:to-amber-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            Generate
          </button>
          <button onClick={() => onApply(generatedTheme!)} disabled={!generatedTheme} className="flex-grow bg-blue-600 text-white font-bold py-2.5 rounded-lg shadow-lg hover:bg-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

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