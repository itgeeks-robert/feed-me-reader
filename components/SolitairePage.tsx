import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SeymourIcon } from './icons';

const SUITS = ['♥', '♦', '♠', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

interface Card {
  id: string;
  suit: string;
  rank: string;
  isFaceUp: boolean;
}

type Pile = Card[];

interface GameState {
  stock: Pile;
  waste: Pile;
  foundations: Pile[];
  tableau: Pile[];
}

interface SolitairePageProps {
  onBackToHub: () => void;
}

type GamePhase = 'intro' | 'dealing' | 'playing' | 'won';

// --- Card Rendering Logic ---

const CardFace = ({ card }: { card: Card }) => {
    const color = (card.suit === '♥' || card.suit === '♦') ? 'text-red-700' : 'text-black';
    const rank = card.rank;
    const suit = card.suit;

    // A container that defines a base font size relative to the card's width.
    // This helps all text elements scale together.
    return (
        <div className="w-full h-full bg-white rounded-md relative text-[calc(var(--card-width)/6)]">
            
            {/* Corner Text (Top Left) */}
            <div className={`absolute top-1 left-1 text-center leading-none ${color}`}>
                <div className="font-bold text-[1.2em]">{rank}</div>
                <div className="text-[1em]">{suit}</div>
            </div>

            {/* Large Central Suit Logo */}
            <div className={`w-full h-full flex items-center justify-center text-[3.5em] ${color}`}>
                {suit}
            </div>

            {/* Corner Text (Bottom Right) */}
            <div className={`absolute bottom-1 right-1 text-center leading-none rotate-180 ${color}`}>
                <div className="font-bold text-[1.2em]">{rank}</div>
                <div className="text-[1em]">{suit}</div>
            </div>
        </div>
    );
};


// --- SolitairePage Component ---
const SolitairePage: React.FC<SolitairePageProps> = ({ onBackToHub }) => {
  const [gamePhase, setGamePhase] = useState<GamePhase>('intro');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [time, setTime] = useState(0);
  const [moves, setMoves] = useState(0);
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

  const startNewGame = useCallback(() => {
    stopTimer();
    const deck = SUITS.flatMap(suit => RANKS.map((rank, i) => ({ id: `${rank}-${suit}`, suit, rank, isFaceUp: false })));
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
      tableau: Array.from({ length: 7 }, () => []), // Start empty for animation
    };
    
    setGameState(newGameState);
    setTime(0);
    setMoves(0);
    setSelectedInfo(null);
    setGamePhase('dealing');
    
    // Animate dealing
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
      if (cardDealIndex >= 28) { // 1+2+3+4+5+6+7 cards
        clearInterval(dealInterval);
        setTimeout(() => {
            setGameState(gs => ({...gs!, tableau: finalTableau}));
            setGamePhase('playing');
            startTimer();
        }, 300);
      }
    }, 50);

  }, [stopTimer, startTimer]);


  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);
  
  const checkWinCondition = (state: GameState) => {
    const won = state.foundations.every(p => p.length === 13);
    if (won) {
      setGamePhase('won');
      stopTimer();
    }
  };
  
  const handleMove = (newState: GameState) => {
    setMoves(m => m + 1);
    checkWinCondition(newState);
    setGameState(newState);
  };

  const getCardColor = (suit: string) => (suit === '♥' || suit === '♦') ? 'red' : 'black';
  const getRankValue = (rank: string) => RANKS.indexOf(rank);

  const canPlaceOnTableau = (cardToMove: Card, destinationPile: Pile) => {
    if (destinationPile.length === 0) return getRankValue(cardToMove.rank) === 12; // King on empty
    const topCard = destinationPile[destinationPile.length - 1];
    if (!topCard.isFaceUp) return false;
    return getCardColor(topCard.suit) !== getCardColor(cardToMove.suit) && getRankValue(topCard.rank) === getRankValue(cardToMove.rank) + 1;
  };

  const canPlaceOnFoundation = (cardToMove: Card, destinationPile: Pile) => {
    if (destinationPile.length === 0) return getRankValue(cardToMove.rank) === 0; // Ace on empty
    const topCard = destinationPile[destinationPile.length - 1];
    return topCard.suit === cardToMove.suit && getRankValue(topCard.rank) + 1 === getRankValue(cardToMove.rank);
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
    if(from.type === 'tableau' && sourcePile.length > 0) {
        sourcePile[sourcePile.length - 1].isFaceUp = true;
    }

    if(to.type === 'tableau') newState.tableau[to.pileIndex].push(...cardsToMove);
    else newState.foundations[to.pileIndex].push(...cardsToMove);
    
    handleMove(newState);
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

    // Auto-move to foundation if possible
    const isTopCard = (type === 'waste' && cardIndex === gameState.waste.length - 1) || (type === 'tableau' && cardIndex === gameState.tableau[pileIndex].length - 1);
    if (isTopCard) {
        for (let i = 0; i < 4; i++) {
            if (canPlaceOnFoundation(clickedCard, gameState.foundations[i])) {
                moveCards({ type, pileIndex, cardIndex }, { type: 'foundation', pileIndex: i });
                return;
            }
        }
    }
    
    if (selectedInfo) { // A card is already selected, try to move it
      const { type: fromType, pileIndex: fromPileIndex, cardIndex: fromCardIndex } = selectedInfo;
      const sourcePile = fromType === 'tableau' ? gameState.tableau[fromPileIndex] : fromType === 'waste' ? gameState.waste : gameState.foundations[fromPileIndex];
      const cardToMove = sourcePile[fromCardIndex];
      const isStack = sourcePile.length - fromCardIndex > 1;

      if (type === 'tableau' && pileIndex === fromPileIndex) { // Clicked on same pile
        setSelectedInfo(null); return;
      }

      if (type === 'tableau' && canPlaceOnTableau(cardToMove, gameState.tableau[pileIndex])) {
        moveCards(selectedInfo, { type: 'tableau', pileIndex });
      } else if (type === 'foundation' && !isStack && canPlaceOnFoundation(cardToMove, gameState.foundations[pileIndex])) {
        moveCards(selectedInfo, { type: 'foundation', pileIndex });
      } else {
        setSelectedInfo(null); // Invalid move, deselect
      }
    } else { // No card selected, so select this one
      setSelectedInfo({ type, pileIndex, cardIndex });
    }
  };

  const handleEmptyPileClick = (type: string, pileIndex: number) => {
    if (gamePhase !== 'playing' || !selectedInfo || !gameState) return;
    const { type: fromType, pileIndex: fromPileIndex, cardIndex: fromCardIndex } = selectedInfo;
    const sourcePile = fromType === 'tableau' ? gameState.tableau[fromPileIndex] : gameState.waste;
    const cardToMove = sourcePile[fromCardIndex];

    if (type === 'tableau' && canPlaceOnTableau(cardToMove, [])) {
      moveCards(selectedInfo, { type, pileIndex });
    } else if (type === 'foundation' && sourcePile.length - fromCardIndex === 1 && canPlaceOnFoundation(cardToMove, [])) {
      moveCards(selectedInfo, { type, pileIndex });
    }
  };
  
  const handleDrawFromStock = () => {
    if (gamePhase !== 'playing' || !gameState) return;
    const newState = JSON.parse(JSON.stringify(gameState));
    if (newState.stock.length > 0) {
        const drawnCard = newState.stock.pop();
        drawnCard.isFaceUp = true;
        newState.waste.push(drawnCard);
    } else {
        newState.stock = newState.waste.reverse().map((c: Card) => ({...c, isFaceUp: false}));
        newState.waste = [];
    }
    handleMove(newState);
  };

  return (
    <div className="flex-grow flex flex-col p-2 bg-[#046307] bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%27100%27%20height=%27100%27%20viewBox=%270%200%20100%20100%27%3E%3Cfilter%20id=%27n%27%20x=%270%27%20y=%270%27%3E%3CfeTurbulence%20type=%27fractalNoise%27%20baseFrequency=%270.7%27%20numOctaves=%2710%27%20stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect%20width=%27100%27%20height=%27100%27%20filter=%27url(%23n)%27%20opacity=%270.07%27/%3E%3C/svg%3E')] overflow-auto font-sans relative select-none">
        {gamePhase === 'intro' ? 
            <IntroScreen onStart={startNewGame} onBackToHub={onBackToHub} /> : 
            <GameBoard 
                gamePhase={gamePhase}
                gameState={gameState}
                selectedInfo={selectedInfo}
                onDraw={handleDrawFromStock}
                onCardClick={handleCardClick}
                onEmptyPileClick={handleEmptyPileClick}
                onStart={startNewGame}
            />
        }
    </div>
  );
};

// --- Child Components ---

const IntroScreen: React.FC<{ onStart: () => void; onBackToHub: () => void; }> = ({ onStart, onBackToHub }) => (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 animate-fade-in">
        <div className="relative text-center p-8 bg-[#046307]/80 backdrop-blur-md rounded-3xl shadow-2xl border border-yellow-300/20">
            <h1 className="text-5xl font-['Helvetica',_sans-serif] font-bold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-br from-yellow-200 to-amber-400">SOLITAIRE</h1>
            <SeymourIcon className="w-24 h-24 mx-auto my-6 text-yellow-300/30" />
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

const GameBoard: React.FC<{
    gamePhase: GamePhase;
    gameState: GameState | null;
    selectedInfo: any;
    onDraw: () => void;
    onCardClick: (type: string, pIdx: number, cIdx: number) => void;
    onEmptyPileClick: (type: string, pIdx: number) => void;
    onStart: () => void;
}> = (props) => {
    const { gamePhase, gameState, selectedInfo, onDraw, onCardClick, onEmptyPileClick, onStart } = props;
    
    if (!gameState) return null;

    return (
        <div className="relative z-10 w-full h-full">
            {/* Table Frame */}
            <div className="absolute inset-[-2rem] rounded-[2.5rem] p-4 bg-[#65000b] shadow-2xl">
                 <div className="w-full h-full rounded-[1.75rem] p-4 bg-gradient-to-br from-[#4a2e20] to-[#291a13] shadow-[0_0_20px_rgba(0,0,0,0.5)_inset]"></div>
            </div>

            {/* Main Board */}
            <div className="relative w-full h-full max-w-7xl mx-auto p-4">
                 {/* Gold-leaf Outlines */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    <div className="absolute grid grid-cols-7 gap-4 w-full top-0">
                        {Array.from({length: 2}).map((_, i) => <div key={i} className="aspect-[2/3] border border-[#bfa65a]/50 rounded-lg shadow-[0_0_2px_1px_rgba(191,166,90,0.2)_inset]"></div>)}
                        <div className="col-start-4 col-span-4">
                            <div className="grid grid-cols-4 gap-4">
                                {Array.from({length: 4}).map((_, i) => <div key={i} className="aspect-[2/3] border border-[#bfa65a]/50 rounded-lg shadow-[0_0_2px_1px_rgba(191,166,90,0.2)_inset]"></div>)}
                            </div>
                        </div>
                    </div>
                    <div className="absolute grid grid-cols-7 gap-4 w-full top-[calc(var(--card-aspect-ratio)_*_var(--card-width)_+_1rem)]">
                         {Array.from({length: 7}).map((_, i) => <div key={i} className="aspect-[2/3] border border-[#bfa65a]/50 rounded-lg shadow-[0_0_2px_1px_rgba(191,166,90,0.2)_inset]"></div>)}
                    </div>
                </div>

                {/* Top Row: Stock, Waste, Foundations */}
                <div className="absolute top-0 left-0 w-full grid grid-cols-7 gap-4">
                    <div onClick={onDraw}>
                        {gameState.stock.length > 0 ? <Card card={{...gameState.stock[0], isFaceUp: false}} /> : <EmptyPile />}
                    </div>
                    <div>
                        {gameState.waste.length > 0 ? <Card card={gameState.waste[gameState.waste.length - 1]} isSelected={selectedInfo?.type === 'waste'} onClick={() => onCardClick('waste', 0, gameState.waste.length-1)} /> : <EmptyPile />}
                    </div>

                    <div className="col-start-4 col-span-4">
                        <div className="grid grid-cols-4 gap-4">
                        {gameState.foundations.map((pile, i) => (
                            <div key={i}>
                                {pile.length > 0 ? <Card card={pile[pile.length - 1]} isSelected={selectedInfo?.type === 'foundation' && selectedInfo.pileIndex === i} onClick={() => onCardClick('foundation', i, pile.length - 1)} /> : <EmptyPile onClick={() => onEmptyPileClick('foundation', i)} />}
                            </div>
                        ))}
                        </div>
                    </div>
                </div>

                {/* Tableau */}
                <div className="absolute w-full top-[calc(var(--card-aspect-ratio)_*_var(--card-width)_+_1rem)]">
                     <div className="grid grid-cols-7 gap-4">
                        {gameState.tableau.map((pile, i) => (
                            <div key={i} className="relative h-[calc(var(--card-aspect-ratio)_*_var(--card-width)_*_2.5)]" onClick={pile.length === 0 ? () => onEmptyPileClick('tableau', i) : undefined}>
                                {pile.map((card, j) => (
                                    <div key={card.id} className="absolute transition-all duration-150" style={{ top: `calc(${j} * var(--tableau-overlap))` }}>
                                        <Card card={card} isSelected={selectedInfo?.type === 'tableau' && selectedInfo.pileIndex === i && selectedInfo.cardIndex <= j} onClick={() => onCardClick('tableau', i, j)} isDealing={gamePhase === 'dealing'} dealIndex={i * 7 + j}/>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="absolute bottom-[2rem] left-1/2 -translate-x-1/2 text-2xl font-['Helvetica',_sans-serif] tracking-[0.3em] text-gray-200/80 select-none pointer-events-none">
                    SOLITAIRE
                </div>
            </div>

            {/* Win Screen */}
            {gamePhase === 'won' && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-[#046307]/80 backdrop-blur-lg border border-yellow-300/40 rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center text-white">
                        <h2 className="text-4xl font-['Helvetica',_sans-serif] font-bold text-transparent bg-clip-text bg-gradient-to-br from-yellow-200 to-amber-400">Congratulations!</h2>
                         <button onClick={onStart} className="mt-6 w-full bg-gradient-to-b from-yellow-400 to-amber-600 text-zinc-900 font-bold py-3 rounded-lg shadow-lg hover:from-yellow-300 hover:to-amber-500 transition-colors">
                            Play Again
                        </button>
                    </div>
                </div>
            )}
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

// Add CSS for layout and animations
const SolitaireStyles = () => (
    <style>{`
        :root {
            --card-width: min(calc((100vw - 6rem) / 7), 6rem);
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

// Inject styles into the component
const SolitairePageWithStyles: React.FC<SolitairePageProps> = (props) => (
  <>
    <SolitaireStyles />
    <SolitairePage {...props} />
  </>
);


export default SolitairePageWithStyles;