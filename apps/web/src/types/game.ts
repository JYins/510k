/**
 * 510K Game Type Definitions
 *
 * These types define the data model for the 510K card game.
 * They are designed to work with Firebase real-time sync.
 */

/** Card suit types */
export type Suit = 'S' | 'H' | 'D' | 'C'; // Spades, Hearts, Diamonds, Clubs

/** Card rank types - includes jokers */
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' | 'SJ' | 'BJ';

/** Complete card object */
export interface Card {
  id: string;
  suit: Suit | null;
  rank: Rank;
  // For sorting/comparison
  value: number;
}

/** Card play by a player */
export interface Play {
  playerId: string;
  seat: number;
  cards: Card[];
  timestamp: number;
  // For validation
  playType: 'single' | 'pair' | 'triple' | 'straight' | 'bomb' | 'pass';
}

/** Current trick state */
export interface Trick {
  leaderId: string;
  leaderSeat: number;
  plays: Play[];
  lastPlay: Play | null;
  passes: number;
  // Running score of points in this trick
  points: number;
  // Cards accumulated in this trick
  pile: Card[];
}

/** Player in the room */
export interface Player {
  id: string;
  uid: string;
  name: string;
  seat: number;
  score: number;
  isHost: boolean;
  isReady: boolean;
  // Number of cards in hand (for other players)
  cardCount: number;
  // For UI - generated avatar color
  avatarColor?: string;
  // Connection status
  isOnline: boolean;
  joinedAt: number;
}

/** Game phases */
export type GamePhase = 'waiting' | 'dealing' | 'playing' | 'trick_end' | 'round_end' | 'finished';

/** Room status */
export type RoomStatus = 'waiting' | 'playing' | 'finished' | 'closed';

/** Complete room/game state */
export interface Room {
  id: string;
  status: RoomStatus;
  phase: GamePhase;
  // Game settings
  maxPlayers: number;
  targetScore: number;
  // Players
  players: Player[];
  // Current game state
  currentTurn: string; // playerId
  currentTurnSeat: number;
  currentRound: number;
  // Trick state
  trick: Trick | null;
  // Deck
  deckCount: number;
  // Player hands (keyed by playerId)
  hands: Record<string, Card[]>;
  // Game history
  tricks: Trick[];
  completedRounds: number;
  // Timestamps
  createdAt: number;
  startedAt: number | null;
  finishedAt: number | null;
  // Current leader for auto-reconnection
  hostId: string;
}

/** UI-specific game state (local) */
export interface LocalGameState {
  // Selected card IDs for current play
  selectedCards: string[];
  // Hint cards that could be played
  hintCards: string[];
  // Local player ID
  playerId: string;
  // Is it my turn?
  isMyTurn: boolean;
  // Error message
  error: string | null;
  // Loading state for actions
  isLoading: boolean;
  // Animation state
  animatingCards: boolean;
}

/** Game result for end screen */
export interface GameResult {
  players: Player[];
  winner: Player;
  finalScores: Record<string, number>;
  totalRounds: number;
  startedAt: number;
  finishedAt: number;
}

/** Rank values for card comparison */
export const RANK_VALUES: Record<Rank, number> = {
  '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15,
  'SJ': 16, // Small Joker
  'BJ': 17, // Big Joker
};

/** Suit values for tie-breaking */
export const SUIT_VALUES: Record<Suit, number> = {
  'C': 1, // Clubs
  'D': 2, // Diamonds
  'H': 3, // Hearts
  'S': 4, // Spades
};

/** Point cards in 510K */
export const POINT_CARDS: Record<string, number> = {
  '5': 5,
  '10': 10,
  'K': 10,
};

/** Check if a card is a point card */
export function getCardPoints(rank: Rank): number {
  return POINT_CARDS[rank] || 0;
}

/** Calculate total points in a set of cards */
export function calculatePoints(cards: Card[]): number {
  return cards.reduce((sum, card) => sum + getCardPoints(card.rank), 0);
}

/** Sort cards for display (by rank, then suit) */
export function sortCards(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    const rankDiff = RANK_VALUES[a.rank] - RANK_VALUES[b.rank];
    if (rankDiff !== 0) return rankDiff;
    if (!a.suit || !b.suit) return 0;
    return SUIT_VALUES[a.suit] - SUIT_VALUES[b.suit];
  });
}

/** Generate a unique card ID */
export function generateCardId(suit: Suit | null, rank: Rank): string {
  return suit ? `${suit}-${rank}-${Math.random().toString(36).substr(2, 9)}` : `${rank}-${Math.random().toString(36).substr(2, 9)}`;
}
