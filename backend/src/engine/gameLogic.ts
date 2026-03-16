/**
 * Core game logic and state transitions
 * All validation happens here - this is the authoritative source of truth
 */

import * as admin from 'firebase-admin';
import {
  Room,
  RoomPrivate,
  CurrentTrick,
  Card,
  Play,
  ParsedPlay,
  GameError
} from '../types';
import {
  createDeck,
  shuffleDeck,
  countPoints,
  sortCards,
  validateCardIndices,
  removeCardsFromHand,
  RANK_VALUES
} from './cards';
import { parsePlay, canBeat, describePlay } from './patterns';

const { Timestamp } = admin.firestore;

// ============================================================================
// GAME INITIALIZATION
// ============================================================================

/**
 * Initialize a new game
 * - Create and shuffle deck
 * - Deal 5 cards to each player
 * - Determine starting player (lowest card)
 * - Set up initial game state
 */
export function initializeGame(
  room: Room,
  privateState: RoomPrivate
): { room: Room; privateState: RoomPrivate } {
  const numPlayers = room.players.length;
  if (numPlayers < 2 || numPlayers > 4) {
    throw new GameError('INVALID_PLAY', 'Game requires 2-4 players');
  }

  // Create and shuffle deck
  const deck = shuffleDeck(createDeck());

  // Deal 5 cards to each player
  const hands: Record<string, Card[]> = {};
  for (const player of room.players) {
    const hand: Card[] = [];
    for (let i = 0; i < 5; i++) {
      const card = deck.pop();
      if (!card) throw new GameError('SERVER_ERROR', 'Not enough cards in deck');
      hand.push(card);
    }
    hands[player.id] = sortCards(hand);
  }

  // Find player with lowest card to start (4 of diamonds is lowest)
  let startingPlayerId = room.players[0].id;
  let lowestValue = 999;
  let lowestSuit = 999;

  for (const [playerId, hand] of Object.entries(hands)) {
    for (const card of hand) {
      const cardValue = RANK_VALUES[card.rank];
      const suitValue = card.suit === 'diamond' ? 1 : card.suit === 'club' ? 2 :
                        card.suit === 'heart' ? 3 : 4;
      if (cardValue < lowestValue || (cardValue === lowestValue && suitValue < lowestSuit)) {
        lowestValue = cardValue;
        lowestSuit = suitValue;
        startingPlayerId = playerId;
      }
    }
  }

  const startingPlayerIndex = room.players.findIndex(p => p.id === startingPlayerId);

  // Initialize current trick
  const currentTrick: CurrentTrick = {
    leaderId: startingPlayerId,
    plays: [],
    highestPlay: null,
    passes: [],
    trickPoints: 0,
    startedAt: Timestamp.now()
  };

  // Update room with game state
  const updatedRoom: Room = {
    ...room,
    status: 'playing',
    startedAt: Timestamp.now(),
    lastActionAt: Timestamp.now(),
    gameState: {
      currentTurnIndex: startingPlayerIndex,
      currentTurnPlayerId: startingPlayerId,
      currentTrick,
      cardsInDeck: deck.length,
      roundNumber: 1,
      totalPointsPlayed: 0,
      consecutivePasses: 0,
      lastPlayTimestamp: Timestamp.now()
    }
  };

  // Update private state
  const updatedPrivate: RoomPrivate = {
    ...privateState,
    deck,
    hands,
    processingAction: false,
    lastProcessedAt: Timestamp.now()
  };

  return { room: updatedRoom, privateState: updatedPrivate };
}

// ============================================================================
// PLAY VALIDATION
// ============================================================================

/**
 * Validate a playCards action
 * Returns the parsed play if valid, throws GameError otherwise
 */
export function validatePlay(
  room: Room,
  privateState: RoomPrivate,
  playerId: string,
  cardIndices: number[]
): { play: ParsedPlay; cards: Card[]; remainingHand: Card[] } {
  if (!room.gameState) {
    throw new GameError('GAME_NOT_STARTED', 'Game has not started');
  }

  // Check turn
  if (room.gameState.currentTurnPlayerId !== playerId) {
    throw new GameError('NOT_YOUR_TURN', 'It is not your turn');
  }

  const playerHand = privateState.hands[playerId];
  if (!playerHand) {
    throw new GameError('SERVER_ERROR', 'Player hand not found');
  }

  // Validate card indices
  let selectedCards: Card[];
  try {
    selectedCards = validateCardIndices(playerHand, cardIndices);
  } catch (err) {
    throw new GameError('INVALID_CARD_INDICES', err instanceof Error ? err.message : 'Invalid cards');
  }

  // Parse and validate pattern
  const parsedPlay = parsePlay(selectedCards);
  if (!parsedPlay) {
    throw new GameError('INVALID_PLAY', 'Cards do not form a valid pattern');
  }

  const currentTrick = room.gameState.currentTrick;
  if (!currentTrick) {
    throw new GameError('SERVER_ERROR', 'No current trick');
  }

  // If this is the first play of the trick, any valid pattern is OK
  if (currentTrick.plays.length === 0) {
    // Leader must play
    return {
      play: parsedPlay,
      cards: selectedCards,
      remainingHand: removeCardsFromHand(playerHand, cardIndices)
    };
  }

  // Must beat the current highest play
  if (!currentTrick.highestPlay) {
    throw new GameError('SERVER_ERROR', 'Trick has plays but no highest');
  }

  const currentHighest: ParsedPlay = {
    pattern: currentTrick.highestPlay.pattern,
    cards: currentTrick.highestPlay.cards,
    primaryValue: currentTrick.highestPlay.primaryValue,
    length: currentTrick.highestPlay.length,
    isJokerBomb: currentTrick.highestPlay.pattern === 'joker-bomb'
  };

  if (!canBeat(parsedPlay, currentHighest)) {
    throw new GameError('MUST_BEAT_CURRENT',
      `Your ${describePlay(parsedPlay)} cannot beat ${describePlay(currentHighest)}`);
  }

  return {
    play: parsedPlay,
    cards: selectedCards,
    remainingHand: removeCardsFromHand(playerHand, cardIndices)
  };
}

// ============================================================================
// STATE TRANSITIONS
// ============================================================================

/**
 * Apply a playCards action to game state
 * Returns updated room and private state
 */
export function applyPlay(
  room: Room,
  privateState: RoomPrivate,
  playerId: string,
  parsedPlay: ParsedPlay,
  playedCards: Card[],
  remainingHand: Card[]
): { room: Room; privateState: RoomPrivate; trickEnded: boolean } {
  if (!room.gameState) {
    throw new GameError('GAME_NOT_STARTED', 'Game has not started');
  }

  const now = Timestamp.now();
  const playerIndex = room.players.findIndex(p => p.id === playerId);
  const player = room.players[playerIndex];

  // Create play record
  const play: Play = {
    playerId,
    playerIndex,
    cards: playedCards,
    pattern: parsedPlay.pattern,
    primaryValue: parsedPlay.primaryValue,
    length: parsedPlay.length,
    timestamp: now
  };

  // Calculate points in this play
  const playPoints = countPoints(playedCards);

  // Update trick
  const currentTrick = room.gameState.currentTrick;
  if (!currentTrick) {
    throw new GameError('SERVER_ERROR', 'No current trick');
  }
  currentTrick.plays.push(play);
  currentTrick.highestPlay = play;
  currentTrick.trickPoints += playPoints;

  // Update game state
  room.gameState.lastPlayTimestamp = now;
  room.gameState.consecutivePasses = 0;

  // Update private state
  privateState.hands[playerId] = remainingHand;

  // Update player's public card count
  player.cardsCount = remainingHand.length;
  player.lastActionAt = now;

  // Check if player is out of cards
  if (remainingHand.length === 0) {
    // Game should end - all points go to this player
    // This is handled by the caller
  }

  // Determine next player
  const nextPlayerIndex = getNextActivePlayerIndex(room, playerIndex);
  const nextPlayerId = room.players[nextPlayerIndex].id;

  // Check if trick should end (everyone else passed)
  const otherPlayerCount = room.players.length - 1;
  const passesAfterThisPlay = currentTrick.passes.filter(
    p => p !== playerId && !currentTrick.plays.some(pl => pl.playerId === p)
  ).length;

  // Trick ends if: next player has passed OR next player has played and everyone else passed
  const shouldEndTrick = currentTrick.passes.includes(nextPlayerId) ||
    (currentTrick.plays.length > 0 && passesAfterThisPlay >= otherPlayerCount - 1);

  let trickEnded = false;

  if (shouldEndTrick) {
    // Trick ends, winner is current player
    trickEnded = true;
  } else {
    // Continue trick, next player's turn
    room.gameState.currentTurnIndex = nextPlayerIndex;
    room.gameState.currentTurnPlayerId = nextPlayerId;
  }

  room.lastActionAt = now;
  privateState.lastProcessedAt = now;

  // Add move to history
  privateState.moveHistory.push({
    moveId: `play-${now.seconds}-${now.nanoseconds}`,
    type: 'play',
    playerId,
    timestamp: now,
    data: {
      pattern: parsedPlay.pattern,
      cards: playedCards,
      points: playPoints
    }
  });

  return { room, privateState, trickEnded };
}

/**
 * Apply a pass action
 */
export function applyPass(
  room: Room,
  privateState: RoomPrivate,
  playerId: string
): { room: Room; privateState: RoomPrivate; trickEnded: boolean } {
  if (!room.gameState) {
    throw new GameError('GAME_NOT_STARTED', 'Game has not started');
  }

  // Check turn
  if (room.gameState.currentTurnPlayerId !== playerId) {
    throw new GameError('NOT_YOUR_TURN', 'It is not your turn');
  }

  const currentTrick = room.gameState.currentTrick;
  if (!currentTrick) {
    throw new GameError('SERVER_ERROR', 'No current trick');
  }

  // Cannot pass if you're the leader (first play)
  if (currentTrick.plays.length === 0) {
    throw new GameError('INVALID_PLAY', 'Leader must play, cannot pass');
  }

  const now = Timestamp.now();
  const playerIndex = room.players.findIndex(p => p.id === playerId);
  const player = room.players[playerIndex];

  // Record pass
  if (!currentTrick.passes.includes(playerId)) {
    currentTrick.passes.push(playerId);
  }

  player.lastActionAt = now;

  // Determine next player
  const nextPlayerIndex = getNextActivePlayerIndex(room, playerIndex);
  const nextPlayerId = room.players[nextPlayerIndex].id;

  // Check if trick should end (everyone else passed)
  const otherPlayers = room.players.filter(p => p.id !== currentTrick.leaderId);
  const allOthersPassed = otherPlayers.every(p =>
    currentTrick.passes.includes(p.id) || currentTrick.plays.some(pl => pl.playerId === p.id)
  );

  let trickEnded = false;

  if (allOthersPassed || nextPlayerId === currentTrick.highestPlay?.playerId) {
    // Trick ends, winner is the one with highest play
    trickEnded = true;
  } else {
    // Continue to next player
    room.gameState.currentTurnIndex = nextPlayerIndex;
    room.gameState.currentTurnPlayerId = nextPlayerId;
    room.gameState.consecutivePasses++;
  }

  room.lastActionAt = now;
  privateState.lastProcessedAt = now;

  // Add move to history
  privateState.moveHistory.push({
    moveId: `pass-${now.seconds}-${now.nanoseconds}`,
    type: 'pass',
    playerId,
    timestamp: now,
    data: {}
  });

  return { room, privateState, trickEnded };
}

// ============================================================================
// TRICK RESOLUTION
// ============================================================================

/**
 * Resolve a completed trick
 * - Award points to winner
 * - Check if refill is needed
 * - Set up next trick
 */
export function resolveTrick(
  room: Room,
  privateState: RoomPrivate
): {
  room: Room;
  privateState: RoomPrivate;
  needsRefill: boolean;
  gameEnded: boolean;
} {
  if (!room.gameState) {
    throw new GameError('GAME_NOT_STARTED', 'Game has not started');
  }

  const currentTrick = room.gameState.currentTrick;
  if (!currentTrick) {
    throw new GameError('SERVER_ERROR', 'No current trick to resolve');
  }
  if (!currentTrick.highestPlay) {
    throw new GameError('SERVER_ERROR', 'Cannot resolve trick with no winner');
  }

  const now = Timestamp.now();
  const winnerId = currentTrick.highestPlay.playerId;
  const winnerIndex = room.players.findIndex(p => p.id === winnerId);
  const winner = room.players[winnerIndex];

  // Award points to winner
  winner.pointsCaptured += currentTrick.trickPoints;
  winner.tricksWon++;
  room.gameState.totalPointsPlayed += currentTrick.trickPoints;

  // Add move to history
  privateState.moveHistory.push({
    moveId: `trick-${now.seconds}-${now.nanoseconds}`,
    type: 'trick-won',
    playerId: winnerId,
    timestamp: now,
    data: {
      points: currentTrick.trickPoints,
      winningPattern: currentTrick.highestPlay.pattern
    }
  });

  // Check if any player is out of cards (game ends)
  const playersOut = room.players.filter(p => p.cardsCount === 0);
  if (playersOut.length > 0) {
    // Collect all remaining points from hands
    let remainingPoints = 0;
    for (const [pid, hand] of Object.entries(privateState.hands)) {
      if (pid !== winnerId) {
        remainingPoints += countPoints(hand);
      }
    }
    winner.pointsCaptured += remainingPoints;

    return {
      room: endGame(room, winnerId, 'normal'),
      privateState,
      needsRefill: false,
      gameEnded: true
    };
  }

  // Determine if refill is needed
  // Refill happens if trick had no points AND deck still has cards
  const needsRefill = currentTrick.trickPoints === 0 && privateState.deck.length > 0;

  // Set up next trick
  const nextTrick: CurrentTrick = {
    leaderId: winnerId,
    plays: [],
    highestPlay: null,
    passes: [],
    trickPoints: 0,
    startedAt: now
  };

  room.gameState.currentTrick = nextTrick;
  room.gameState.currentTurnIndex = winnerIndex;
  room.gameState.currentTurnPlayerId = winnerId;
  room.gameState.roundNumber++;
  room.gameState.consecutivePasses = 0;
  room.gameState.lastPlayTimestamp = now;
  room.lastActionAt = now;

  return {
    room,
    privateState,
    needsRefill,
    gameEnded: false
  };
}

// ============================================================================
// REFILL LOGIC
// ============================================================================

/**
 * Refill player hands back to 5 cards
 * Starts from trick winner and goes clockwise
 */
export function refillHands(
  room: Room,
  privateState: RoomPrivate
): { room: Room; privateState: RoomPrivate } {
  if (!room.gameState) {
    throw new GameError('GAME_NOT_STARTED', 'Game has not started');
  }

  const now = Timestamp.now();
  const startPlayerIndex = room.gameState.currentTurnIndex;
  const numPlayers = room.players.length;

  // Deal cards clockwise starting from current player
  for (let i = 0; i < numPlayers; i++) {
    const playerIndex = (startPlayerIndex + i) % numPlayers;
    const playerId = room.players[playerIndex].id;
    const currentHand = privateState.hands[playerId];

    // Deal up to 5 cards
    while (currentHand.length < 5 && privateState.deck.length > 0) {
      const card = privateState.deck.pop();
      if (card) {
        currentHand.push(card);
      }
    }

    // Sort and update counts
    privateState.hands[playerId] = sortCards(currentHand);
    room.players[playerIndex].cardsCount = currentHand.length;
  }

  // Update deck count
  room.gameState.cardsInDeck = privateState.deck.length;
  room.lastActionAt = now;

  // Add move to history
  privateState.moveHistory.push({
    moveId: `refill-${now.seconds}-${now.nanoseconds}`,
    type: 'refill',
    timestamp: now,
    data: {
      cardsRemaining: privateState.deck.length
    }
  });

  return { room, privateState };
}

// ============================================================================
// AUTO-SETTLE
// ============================================================================

/**
 * Check if game should auto-settle
 * Conditions:
 * 1. Deck is empty
 * 2. No progress being made (consecutive passes or stuck state)
 */
export function shouldAutoSettle(room: Room): boolean {
  if (!room.gameState) return false;
  if (room.gameState.cardsInDeck > 0) return false;

  // If too many consecutive passes, game might be stuck
  if (room.gameState.consecutivePasses >= room.players.length * 2) {
    return true;
  }

  // Check if game has been idle too long
  const now = Timestamp.now();
  const lastPlay = room.gameState.lastPlayTimestamp;
  const minutesSinceLastPlay = (now.seconds - lastPlay.seconds) / 60;
  if (minutesSinceLastPlay > 5) {
    return true;
  }

  return false;
}

/**
 * Auto-settle the game
 * Winner is player with highest remaining card
 * All remaining points go to winner
 */
export function autoSettle(
  room: Room,
  privateState: RoomPrivate
): { room: Room; privateState: RoomPrivate } {
  if (!room.gameState) {
    throw new GameError('GAME_NOT_STARTED', 'Game has not started');
  }

  const now = Timestamp.now();

  // Find player with highest remaining card
  let winnerId = '';
  let highestCardValue = -1;
  let highestSuit = -1;

  for (const [playerId, hand] of Object.entries(privateState.hands)) {
    for (const card of hand) {
      const suitValue = card.suit === 'diamond' ? 1 : card.suit === 'club' ? 2 :
                        card.suit === 'heart' ? 3 : card.suit === 'spade' ? 4 : 5;
      if (card.value > highestCardValue ||
          (card.value === highestCardValue && suitValue > highestSuit)) {
        highestCardValue = card.value;
        highestSuit = suitValue;
        winnerId = playerId;
      }
    }
  }

  if (!winnerId) {
    // No cards left, use current leader
    winnerId = room.gameState.currentTrick?.leaderId || room.players[0].id;
  }

  // Calculate remaining points
  let remainingPoints = 0;
  for (const hand of Object.values(privateState.hands)) {
    remainingPoints += countPoints(hand);
  }

  // Award to winner
  const winner = room.players.find(p => p.id === winnerId);
  if (winner) {
    winner.pointsCaptured += remainingPoints;
  }

  // Add move to history
  privateState.moveHistory.push({
    moveId: `autosettle-${now.seconds}-${now.nanoseconds}`,
    type: 'auto-settle',
    timestamp: now,
    data: {
      winnerId,
      remainingPoints,
      reason: 'stuck-game'
    }
  });

  return {
    room: endGame(room, winnerId, 'auto-settle'),
    privateState
  };
}

// ============================================================================
// GAME END
// ============================================================================

/**
 * End the game and calculate final scores
 */
export function endGame(
  room: Room,
  winnerId: string,
  reason: 'normal' | 'auto-settle' | 'player-left'
): Room {
  const now = Timestamp.now();

  const finalScores: Record<string, number> = {};
  for (const player of room.players) {
    finalScores[player.id] = player.pointsCaptured;
  }

  room.status = 'ended';
  room.endedAt = now;
  room.result = {
    winnerId,
    finalScores,
    reason,
    endedAt: now
  };
  room.lastActionAt = now;

  return room;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the next active player index (clockwise)
 */
function getNextActivePlayerIndex(room: Room, currentIndex: number): number {
  const numPlayers = room.players.length;
  for (let i = 1; i <= numPlayers; i++) {
    const nextIndex = (currentIndex + i) % numPlayers;
    const player = room.players[nextIndex];
    if (player.status === 'active') {
      return nextIndex;
    }
  }
  return currentIndex; // Fallback (should not happen in normal game)
}

/**
 * Get a player's current hand (for private API)
 */
export function getPlayerHand(privateState: RoomPrivate, playerId: string): Card[] {
  return privateState.hands[playerId] || [];
}

/**
 * Check if it's a player's turn
 */
export function isPlayerTurn(room: Room, playerId: string): boolean {
  return room.gameState?.currentTurnPlayerId === playerId;
}

/**
 * Get available actions for a player
 */
export function getAvailableActions(room: Room, playerId: string): {
  canPlay: boolean;
  canPass: boolean;
  mustPlay: boolean;
} {
  if (!room.gameState) {
    return { canPlay: false, canPass: false, mustPlay: false };
  }

  if (room.gameState.currentTurnPlayerId !== playerId) {
    return { canPlay: false, canPass: false, mustPlay: false };
  }

  const currentTrick = room.gameState.currentTrick;
  if (!currentTrick) {
    return { canPlay: false, canPass: false, mustPlay: false };
  }
  const isLeader = currentTrick.plays.length === 0;

  return {
    canPlay: true,
    canPass: !isLeader,
    mustPlay: isLeader
  };
}
