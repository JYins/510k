/**
 * Mock Data for 510K Game
 *
 * Use these for development and testing.
 * Replace with Firebase subscriptions in production.
 */

import {
  Card,
  Suit,
  Rank,
  RANK_VALUES,
  Player,
  Room,
  Trick,
  Play,
  GamePhase,
  generateCardId,
  sortCards,
} from '@/types/game';

// ============================================
// Card Helpers
// ============================================

export function createCard(suit: Suit | null, rank: Rank): Card {
  return {
    id: generateCardId(suit, rank),
    suit,
    rank,
    value: RANK_VALUES[rank],
  };
}

/** Create a standard 54-card deck (with jokers) */
export function createDeck(): Card[] {
  const suits: Suit[] = ['S', 'H', 'D', 'C'];
  const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

  const cards: Card[] = [];

  // Regular cards
  for (const suit of suits) {
    for (const rank of ranks) {
      cards.push(createCard(suit, rank));
    }
  }

  // Jokers
  cards.push(createCard(null, 'SJ'));
  cards.push(createCard(null, 'BJ'));

  return cards;
}

/** Shuffle deck using Fisher-Yates */
export function shuffleDeck(cards: Card[]): Card[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ============================================
// Mock Players
// ============================================

export const MOCK_PLAYERS: Player[] = [
  {
    id: 'player-1',
    uid: 'uid-1',
    name: '你',
    seat: 1,
    score: 0,
    isHost: true,
    isReady: true,
    cardCount: 0,
    avatarColor: 'from-violet-500 to-purple-600',
    isOnline: true,
    joinedAt: Date.now(),
  },
  {
    id: 'player-2',
    uid: 'uid-2',
    name: '张三',
    seat: 2,
    score: 15,
    isHost: false,
    isReady: true,
    cardCount: 13,
    avatarColor: 'from-emerald-500 to-green-600',
    isOnline: true,
    joinedAt: Date.now() - 5000,
  },
  {
    id: 'player-3',
    uid: 'uid-3',
    name: '李四',
    seat: 3,
    score: 25,
    isHost: false,
    isReady: true,
    cardCount: 12,
    avatarColor: 'from-amber-500 to-yellow-600',
    isOnline: true,
    joinedAt: Date.now() - 10000,
  },
  {
    id: 'player-4',
    uid: 'uid-4',
    name: '王五',
    seat: 4,
    score: 10,
    isHost: false,
    isReady: false,
    cardCount: 14,
    avatarColor: 'from-rose-500 to-pink-600',
    isOnline: true,
    joinedAt: Date.now() - 15000,
  },
];

// ============================================
// Mock Hands
// ============================================

function generateMockHand(count: number): Card[] {
  const deck = shuffleDeck(createDeck());
  return sortCards(deck.slice(0, count));
}

export const MOCK_HANDS: Record<string, Card[]> = {
  'player-1': sortCards([
    createCard('S', 'A'),
    createCard('H', 'K'),
    createCard('D', 'Q'),
    createCard('C', 'J'),
    createCard('S', '10'),
    createCard('H', '9'),
    createCard('D', '8'),
    createCard('C', '7'),
    createCard('S', '6'),
    createCard('H', '5'),
    createCard('D', '5'),
    createCard('C', '3'),
    createCard(null, 'SJ'),
  ]),
  'player-2': generateMockHand(13),
  'player-3': generateMockHand(12),
  'player-4': generateMockHand(14),
};

// ============================================
// Mock Trick
// ============================================

export const MOCK_TRICK: Trick = {
  leaderId: 'player-2',
  leaderSeat: 2,
  plays: [
    {
      playerId: 'player-2',
      seat: 2,
      cards: [createCard('H', '5'), createCard('D', '5')],
      timestamp: Date.now() - 30000,
      playType: 'pair',
    },
  ],
  lastPlay: {
    playerId: 'player-2',
    seat: 2,
    cards: [createCard('H', '5'), createCard('D', '5')],
    timestamp: Date.now() - 30000,
    playType: 'pair',
  },
  passes: 0,
  points: 10,
  pile: [
    createCard('H', '5'),
    createCard('D', '5'),
    createCard('S', '10'),
    createCard('C', 'K'),
  ],
};

// ============================================
// Mock Room States
// ============================================

/** Waiting room state */
export const MOCK_ROOM_WAITING: Room = {
  id: 'ABC123',
  status: 'waiting',
  phase: 'waiting',
  maxPlayers: 4,
  targetScore: 100,
  players: MOCK_PLAYERS.slice(0, 3),
  currentTurn: '',
  currentTurnSeat: 0,
  currentRound: 0,
  trick: null,
  deckCount: 54,
  hands: {},
  tricks: [],
  completedRounds: 0,
  createdAt: Date.now() - 60000,
  startedAt: null,
  finishedAt: null,
  hostId: 'player-1',
};

/** Playing game state - my turn */
export const MOCK_ROOM_PLAYING_MY_TURN: Room = {
  id: 'ABC123',
  status: 'playing',
  phase: 'playing',
  maxPlayers: 4,
  targetScore: 100,
  players: [
    { ...MOCK_PLAYERS[0], cardCount: 13, score: 20 },
    { ...MOCK_PLAYERS[1], cardCount: 11, score: 35 },
    { ...MOCK_PLAYERS[2], cardCount: 14, score: 15 },
    { ...MOCK_PLAYERS[3], cardCount: 12, score: 10 },
  ],
  currentTurn: 'player-1',
  currentTurnSeat: 1,
  currentRound: 1,
  trick: MOCK_TRICK,
  deckCount: 0,
  hands: MOCK_HANDS,
  tricks: [],
  completedRounds: 0,
  createdAt: Date.now() - 300000,
  startedAt: Date.now() - 120000,
  finishedAt: null,
  hostId: 'player-1',
};

/** Playing game state - other player's turn */
export const MOCK_ROOM_PLAYING_OTHER_TURN: Room = {
  ...MOCK_ROOM_PLAYING_MY_TURN,
  currentTurn: 'player-2',
  currentTurnSeat: 2,
};

/** Empty trick (waiting for leader) */
export const MOCK_TRICK_EMPTY: Trick = {
  leaderId: 'player-1',
  leaderSeat: 1,
  plays: [],
  lastPlay: null,
  passes: 0,
  points: 0,
  pile: [],
};

/** Trick with multiple plays */
export const MOCK_TRICK_IN_PROGRESS: Trick = {
  leaderId: 'player-2',
  leaderSeat: 2,
  plays: [
    {
      playerId: 'player-2',
      seat: 2,
      cards: [createCard('S', '3')],
      timestamp: Date.now() - 60000,
      playType: 'single',
    },
    {
      playerId: 'player-3',
      seat: 3,
      cards: [createCard('H', '5')],
      timestamp: Date.now() - 45000,
      playType: 'single',
    },
    {
      playerId: 'player-4',
      seat: 4,
      cards: [],
      timestamp: Date.now() - 30000,
      playType: 'pass',
    },
  ],
  lastPlay: {
    playerId: 'player-3',
    seat: 3,
    cards: [createCard('H', '5')],
    timestamp: Date.now() - 45000,
    playType: 'single',
  },
  passes: 1,
  points: 15,
  pile: [
    createCard('S', '3'),
    createCard('H', '5'),
    createCard('C', '10'),
  ],
};

/** Finished game state */
export const MOCK_ROOM_FINISHED: Room = {
  ...MOCK_ROOM_PLAYING_MY_TURN,
  status: 'finished',
  phase: 'finished',
  players: [
    { ...MOCK_PLAYERS[0], score: 85 },
    { ...MOCK_PLAYERS[1], score: 120 },
    { ...MOCK_PLAYERS[2], score: 65 },
    { ...MOCK_PLAYERS[3], score: 45 },
  ],
  finishedAt: Date.now(),
};

// ============================================
// Utility Functions
// ============================================

/** Get suit symbol for display */
export function getSuitSymbol(suit: Suit | null): string {
  const symbols: Record<string, string> = {
    S: '♠',
    H: '♥',
    D: '♦',
    C: '♣',
  };
  return suit ? symbols[suit] : '';
}

/** Get rank display text */
export function getRankDisplay(rank: Rank): string {
  if (rank === 'SJ') return '小王';
  if (rank === 'BJ') return '大王';
  return rank;
}

/** Check if card is red */
export function isRedCard(suit: Suit | null): boolean {
  return suit === 'H' || suit === 'D';
}

/** Format card for display */
export function formatCard(card: Card): string {
  if (card.rank === 'SJ') return '🃟';
  if (card.rank === 'BJ') return '🃏';
  return `${getSuitSymbol(card.suit)}${card.rank}`;
}

/** Get player by ID */
export function getPlayerById(players: Player[], id: string): Player | undefined {
  return players.find(p => p.id === id);
}

/** Get player by seat */
export function getPlayerBySeat(players: Player[], seat: number): Player | undefined {
  return players.find(p => p.seat === seat);
}

/** Calculate fan overlap for hand display */
export function calculateCardOverlap(cardCount: number, containerWidth: number, cardWidth: number): number {
  if (cardCount <= 1) return 0;
  const maxWidth = containerWidth - cardWidth;
  const overlap = maxWidth / (cardCount - 1);
  return Math.min(overlap, cardWidth * 0.6); // Max 60% overlap
}
