import {
  Card,
  Suit,
  Rank,
  RANK_VALUES,
  Player,
  Room,
  Trick,
  Play,
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

export function createDeck(): Card[] {
  const suits: Suit[] = ['S', 'H', 'D', 'C'];
  const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const cards: Card[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      cards.push(createCard(suit, rank));
    }
  }
  cards.push(createCard(null, 'SJ'));
  cards.push(createCard(null, 'BJ'));
  return cards;
}

export function shuffleDeck(cards: Card[]): Card[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ============================================
// Mock Players (5 players, matching reference)
// ============================================

export const MOCK_PLAYERS: Player[] = [
  {
    id: 'player-1',
    uid: 'uid-1',
    name: 'Gary',
    seat: 1,
    score: 383,
    emoji: '👨🏻',
    isHost: true,
    isReady: true,
    cardCount: 0,
    isOnline: true,
    joinedAt: Date.now(),
  },
  {
    id: 'player-2',
    uid: 'uid-2',
    name: 'Ruby',
    seat: 2,
    score: 239,
    emoji: '👩🏼‍🦱',
    isHost: false,
    isDealer: true,
    isReady: true,
    cardCount: 10,
    isOnline: true,
    joinedAt: Date.now() - 5000,
  },
  {
    id: 'player-3',
    uid: 'uid-3',
    name: 'Luna',
    seat: 3,
    score: 376,
    emoji: '👩🏽',
    isHost: false,
    isReady: true,
    cardCount: 10,
    isOnline: true,
    joinedAt: Date.now() - 10000,
  },
  {
    id: 'player-4',
    uid: 'uid-4',
    name: 'Ravi',
    seat: 4,
    score: 302,
    emoji: '👨🏿',
    isHost: false,
    isReady: true,
    cardCount: 10,
    isOnline: true,
    joinedAt: Date.now() - 15000,
  },
  {
    id: 'player-5',
    uid: 'uid-5',
    name: 'Olivia',
    seat: 5,
    score: 259,
    emoji: '👩🏼',
    isHost: false,
    isReady: true,
    cardCount: 10,
    isOnline: true,
    joinedAt: Date.now() - 20000,
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
  'player-2': generateMockHand(10),
  'player-3': generateMockHand(10),
  'player-4': generateMockHand(10),
  'player-5': generateMockHand(10),
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
      cards: [createCard('S', '8'), createCard('C', '2'), createCard('D', '4')],
      timestamp: Date.now() - 30000,
      playType: 'single',
    },
  ],
  lastPlay: {
    playerId: 'player-2',
    seat: 2,
    cards: [createCard('S', '8'), createCard('C', '2'), createCard('D', '4')],
    timestamp: Date.now() - 30000,
    playType: 'single',
  },
  passes: 0,
  points: 36,
  pile: [
    createCard('S', '8'),
    createCard('C', '2'),
    createCard('D', '4'),
  ],
};

// ============================================
// Mock Room States
// ============================================

export const MOCK_ROOM_WAITING: Room = {
  id: 'ABC123',
  status: 'waiting',
  phase: 'waiting',
  maxPlayers: 5,
  targetScore: 500,
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

export const MOCK_ROOM_PLAYING_MY_TURN: Room = {
  id: 'ABC123',
  status: 'playing',
  phase: 'playing',
  maxPlayers: 5,
  targetScore: 500,
  players: [
    { ...MOCK_PLAYERS[0], cardCount: 13, score: 383 },
    { ...MOCK_PLAYERS[1], cardCount: 10, score: 239 },
    { ...MOCK_PLAYERS[2], cardCount: 10, score: 376 },
    { ...MOCK_PLAYERS[3], cardCount: 10, score: 302 },
    { ...MOCK_PLAYERS[4], cardCount: 10, score: 259 },
  ],
  currentTurn: 'player-1',
  currentTurnSeat: 1,
  currentRound: 1,
  trick: MOCK_TRICK,
  deckCount: 4,
  hands: MOCK_HANDS,
  tricks: [],
  completedRounds: 0,
  createdAt: Date.now() - 300000,
  startedAt: Date.now() - 120000,
  finishedAt: null,
  hostId: 'player-1',
};

export const MOCK_ROOM_PLAYING_OTHER_TURN: Room = {
  ...MOCK_ROOM_PLAYING_MY_TURN,
  currentTurn: 'player-4',
  currentTurnSeat: 4,
};

export const MOCK_TRICK_EMPTY: Trick = {
  leaderId: 'player-1',
  leaderSeat: 1,
  plays: [],
  lastPlay: null,
  passes: 0,
  points: 0,
  pile: [],
};

export const MOCK_ROOM_FINISHED: Room = {
  ...MOCK_ROOM_PLAYING_MY_TURN,
  status: 'finished',
  phase: 'finished',
  players: [
    { ...MOCK_PLAYERS[0], score: 485 },
    { ...MOCK_PLAYERS[1], score: 520 },
    { ...MOCK_PLAYERS[2], score: 365 },
    { ...MOCK_PLAYERS[3], score: 445 },
    { ...MOCK_PLAYERS[4], score: 310 },
  ],
  finishedAt: Date.now(),
};

// ============================================
// Utility Functions
// ============================================

export function getSuitSymbol(suit: Suit | null): string {
  const symbols: Record<string, string> = {
    S: '♠',
    H: '♥',
    D: '♦',
    C: '♣',
  };
  return suit ? symbols[suit] : '';
}

export function getRankDisplay(rank: Rank): string {
  if (rank === 'SJ') return 'S';
  if (rank === 'BJ') return 'B';
  return rank;
}

export function isRedCard(suit: Suit | null): boolean {
  return suit === 'H' || suit === 'D';
}

export function formatCard(card: Card): string {
  if (card.rank === 'SJ') return 'SJ';
  if (card.rank === 'BJ') return 'BJ';
  return `${getSuitSymbol(card.suit)}${card.rank}`;
}

export function getPlayerById(players: Player[], id: string): Player | undefined {
  return players.find(p => p.id === id);
}

export function getPlayerBySeat(players: Player[], seat: number): Player | undefined {
  return players.find(p => p.seat === seat);
}

export function getPlayTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    single: '单张',
    pair: '对子',
    triple: '三条',
    straight: '顺子',
    bomb: '炸弹',
    pass: '过',
  };
  return labels[type] || type;
}
