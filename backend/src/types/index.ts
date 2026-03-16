/**
 * 510K Card Game - Core Types
 * All game entities and state definitions
 */

// ============================================================================
// CARD DEFINITIONS
// ============================================================================

export type Suit = 'spade' | 'heart' | 'club' | 'diamond' | 'joker';
export type Rank = '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' | '2' | '3' | 'small' | 'big';

export interface Card {
  suit: Suit;
  rank: Rank;
  /**
   * Numeric value for comparison
   * 4=4, 5=5, ..., 10=10, J=11, Q=12, K=13, A=14, 2=15, 3=16, small joker=17, big joker=18
   */
  value: number;
  /**
   * Points: 5=5, 10=10, K=10, others=0
   */
  points: number;
}

// ============================================================================
// PLAY PATTERNS (Valid card combinations)
// ============================================================================

export type PlayPattern =
  | 'single'           // One card
  | 'pair'             // Two same rank
  | 'triplet'          // Three same rank
  | 'triplet+single'   // Three same rank + one single
  | 'triplet+pair'     // Three same rank + one pair
  | 'straight'         // 5+ consecutive ranks (e.g., 4-5-6-7-8)
  | 'consecutive-pairs' // 3+ consecutive pairs (e.g., 4-4-5-5-6-6)
  | 'airplane'         // 2+ consecutive triplets (e.g., 4-4-4-5-5-5)
  | 'bomb'             // Four same rank
  | 'joker-bomb';      // Both jokers

export interface ParsedPlay {
  pattern: PlayPattern;
  cards: Card[];
  /**
   * Primary value for comparison (highest card in pattern)
   */
  primaryValue: number;
  /**
   * For straight/consecutive-pairs/airplane: the length
   */
  length?: number;
  /**
   * For triplet+single/triplet+pair: the kicker value
   */
  kickerValue?: number;
  /**
   * For bomb comparison: 4-rank bomb < joker bomb
   */
  isJokerBomb: boolean;
}

// ============================================================================
// GAME STATE ENUMS
// ============================================================================

export type RoomStatus = 'waiting' | 'playing' | 'ended';
export type PlayerStatus = 'active' | 'disconnected' | 'left';

// ============================================================================
// PLAYER ENTITIES
// ============================================================================

/**
 * Public player information (visible to all players)
 */
export interface PlayerPublic {
  id: string;
  displayName: string;
  index: number;           // 0-3 position at table
  status: PlayerStatus;
  cardsCount: number;      // Number of cards in hand (hidden)
  tricksWon: number;
  pointsCaptured: number;  // Total points from won tricks
  lastActionAt: FirebaseFirestore.Timestamp;
}

/**
 * Private player information (only visible to owning player + server)
 * Stored in roomPrivate/{roomId}/hands/{playerId}
 */
export interface PlayerHand {
  playerId: string;
  hand: Card[];            // Actual cards in hand
  updatedAt: FirebaseFirestore.Timestamp;
}

// ============================================================================
// TRICK (Current play)
// ============================================================================

export interface Play {
  playerId: string;
  playerIndex: number;
  cards: Card[];
  pattern: PlayPattern;
  primaryValue: number;
  length?: number;
  timestamp: FirebaseFirestore.Timestamp;
}

export interface CurrentTrick {
  /**
   * Player who led this trick
   */
  leaderId: string;
  /**
   * All plays in chronological order
   */
  plays: Play[];
  /**
   * Current highest play
   */
  highestPlay: Play | null;
  /**
   * Players who have passed this trick (by playerId)
   */
  passes: string[];
  /**
   * Points accumulated in this trick (from point cards played)
   */
  trickPoints: number;
  /**
   * When trick started
   */
  startedAt: FirebaseFirestore.Timestamp;
}

// ============================================================================
// ROOM (Public Game State)
// ============================================================================

/**
 * Public room document - visible to all players
 * Path: rooms/{roomId}
 */
export interface Room {
  id: string;
  hostId: string;
  status: RoomStatus;

  // Player slots (max 4)
  players: PlayerPublic[];
  maxPlayers: number;

  // Game configuration
  config: {
    minPlayers: number;      // 2
    maxPlayers: number;      // 4
    targetScore: number;     // Game ends when someone reaches this
  };

  // Current game state (only valid when status === 'playing')
  gameState?: {
    // Turn management
    currentTurnIndex: number;    // Which player's turn (0-3)
    currentTurnPlayerId: string; // Player ID whose turn it is

    // Trick state
    currentTrick: CurrentTrick | null;

    // Deck state (public info only)
    cardsInDeck: number;         // How many cards remain

    // Game progress
    roundNumber: number;         // Which round/trick number
    totalPointsPlayed: number;   // Total points captured so far

    // Auto-settle detection
    consecutivePasses: number;   // Count for stuck game detection
    lastPlayTimestamp: FirebaseFirestore.Timestamp;
  };

  // Game result (only when status === 'ended')
  result?: {
    winnerId: string;
    finalScores: Record<string, number>;  // playerId -> score
    reason: 'normal' | 'auto-settle' | 'player-left';
    endedAt: FirebaseFirestore.Timestamp;
  };

  // Metadata
  createdAt: FirebaseFirestore.Timestamp;
  startedAt?: FirebaseFirestore.Timestamp;
  endedAt?: FirebaseFirestore.Timestamp;
  lastActionAt: FirebaseFirestore.Timestamp;
}

// ============================================================================
// PRIVATE GAME STATE (Server-only)
// ============================================================================

/**
 * Private game state - never exposed to clients
 * Path: roomPrivate/{roomId}
 */
export interface RoomPrivate {
  roomId: string;

  // The deck (cards not yet dealt)
  deck: Card[];

  // Player hands (indexed by playerId)
  hands: Record<string, Card[]>;

  // Audit log of all moves for replay/debugging
  moveHistory: GameMove[];

  // Internal flags
  processingAction: boolean;  // Lock to prevent race conditions
  lastProcessedAt: FirebaseFirestore.Timestamp;
}

/**
 * Audit log entry for every game action
 */
export interface GameMove {
  moveId: string;
  type: 'deal' | 'play' | 'pass' | 'trick-won' | 'refill' | 'auto-settle' | 'game-end';
  playerId?: string;
  timestamp: FirebaseFirestore.Timestamp;
  data: Record<string, unknown>;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateRoomRequest {
  displayName: string;
  maxPlayers?: number;
}

export interface CreateRoomResponse {
  roomId: string;
  playerId: string;
}

export interface JoinRoomRequest {
  roomId: string;
  displayName: string;
}

export interface JoinRoomResponse {
  success: boolean;
  playerIndex: number;
}

export interface StartGameRequest {
  roomId: string;
}

export interface PlayCardsRequest {
  roomId: string;
  cardIndices: number[];  // Indices in player's hand (0-based)
}

export interface PlayCardsResponse {
  success: boolean;
  pattern: PlayPattern;
  isWinningPlay: boolean;
  trickEnded?: boolean;
  pointsWon?: number;
}

export interface PassTurnRequest {
  roomId: string;
}

export interface PassTurnResponse {
  success: boolean;
  trickEnded?: boolean;
  nextPlayerId: string;
}

// ============================================================================
// CLIENT-SIDE STATE (What frontend receives)
// ============================================================================

/**
 * Complete game state sent to a specific player
 * Includes their private hand + public state
 */
export interface PlayerGameView {
  room: Room;
  myHand: Card[] | null;  // Only populated for the requesting player
  myPlayerId: string;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export type GameErrorCode =
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'ALREADY_IN_ROOM'
  | 'NOT_IN_ROOM'
  | 'NOT_HOST'
  | 'NOT_ENOUGH_PLAYERS'
  | 'GAME_ALREADY_STARTED'
  | 'NOT_YOUR_TURN'
  | 'INVALID_PLAY'
  | 'MUST_BEAT_CURRENT'
  | 'GAME_NOT_STARTED'
  | 'INVALID_CARD_INDICES'
  | 'PATTERN_MISMATCH'
  | 'NOT_ENOUGH_CARDS'
  | 'SERVER_ERROR'
  | 'RACE_CONDITION';

export class GameError extends Error {
  constructor(
    public code: GameErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'GameError';
  }
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Firebase Timestamp shorthand
 */
export type Timestamp = FirebaseFirestore.Timestamp;

/**
 * Transaction function type
 */
export type FirestoreTransaction = FirebaseFirestore.Transaction;
