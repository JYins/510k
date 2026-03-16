/**
 * Game action functions
 * - playCards
 * - passTurn
 * - getGameState (for initial load)
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {
  PlayCardsRequest,
  PlayCardsResponse,
  PassTurnRequest,
  PassTurnResponse,
  Room,
  RoomPrivate,
  GameError,
  PlayerGameView,
  Card
} from '../types';
import {
  validatePlay,
  applyPlay,
  applyPass,
  resolveTrick,
  refillHands,
  shouldAutoSettle,
  autoSettle,
} from '../engine/gameLogic';

const db = admin.firestore();
const { Timestamp } = admin.firestore;

/**
 * Play cards from hand
 * Server validates everything: valid pattern, can beat current, etc.
 */
export const playCards = functions.https.onCall(
  async (data: PlayCardsRequest, context): Promise<PlayCardsResponse> => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const playerId = context.auth.uid;
    const { roomId, cardIndices } = data;

    if (!roomId || !cardIndices || !Array.isArray(cardIndices)) {
      throw new functions.https.HttpsError('invalid-argument', 'Room ID and card indices required');
    }

    try {
      const result = await db.runTransaction(async (transaction) => {
        const roomRef = db.collection('rooms').doc(roomId);
        const privateRef = db.collection('roomPrivate').doc(roomId);

        const [roomDoc, privateDoc] = await Promise.all([
          transaction.get(roomRef),
          transaction.get(privateRef)
        ]);

        if (!roomDoc.exists) {
          throw new GameError('ROOM_NOT_FOUND', 'Room does not exist');
        }

        const room = roomDoc.data() as Room;

        if (room.status !== 'playing') {
          throw new GameError('GAME_NOT_STARTED', 'Game is not in progress');
        }

        if (!privateDoc.exists) {
          throw new GameError('SERVER_ERROR', 'Private state missing');
        }

        const privateState = privateDoc.data() as RoomPrivate;

        // Anti-cheat: Prevent race conditions
        if (privateState.processingAction) {
          throw new GameError('RACE_CONDITION', 'Server is processing another action');
        }

        // Lock processing
        transaction.update(privateRef, { processingAction: true });

        // Validate play (this checks turn, pattern, can beat, etc.)
        const { play, cards, remainingHand } = validatePlay(
          room,
          privateState,
          playerId,
          cardIndices
        );

        // Apply the play
        const { room: updatedRoom, privateState: updatedPrivate, trickEnded } = applyPlay(
          room,
          privateState,
          playerId,
          play,
          cards,
          remainingHand
        );

        // Update player hand in private collection
        transaction.update(privateRef.collection('hands').doc(playerId), {
          hand: remainingHand,
          updatedAt: Timestamp.now()
        });

        // If trick ended, resolve it
        let needsRefill = false;
        let gameEnded = false;

        if (trickEnded) {
          const resolveResult = resolveTrick(updatedRoom, updatedPrivate);
          needsRefill = resolveResult.needsRefill;
          gameEnded = resolveResult.gameEnded;

          // If needs refill, do it
          if (needsRefill && !gameEnded) {
            const refillResult = refillHands(resolveResult.room, resolveResult.privateState);
            Object.assign(updatedRoom, refillResult.room);
            Object.assign(updatedPrivate, refillResult.privateState);
          }
        }

        // Check for auto-settle if game hasn't ended
        if (!gameEnded && shouldAutoSettle(updatedRoom)) {
          const settleResult = autoSettle(updatedRoom, updatedPrivate);
          Object.assign(updatedRoom, settleResult.room);
          Object.assign(updatedPrivate, settleResult.privateState);
          gameEnded = true;
        }

        // Write updates
        transaction.update(roomRef, {
          status: updatedRoom.status,
          gameState: updatedRoom.gameState,
          players: updatedRoom.players,
          result: updatedRoom.result || null,
          endedAt: updatedRoom.endedAt || null,
          lastActionAt: updatedRoom.lastActionAt
        });

        transaction.update(privateRef, {
          deck: updatedPrivate.deck,
          hands: updatedPrivate.hands,
          moveHistory: updatedPrivate.moveHistory,
          processingAction: false,
          lastProcessedAt: updatedPrivate.lastProcessedAt
        });

        // Update player public doc
        const player = updatedRoom.players.find(p => p.id === playerId)!;
        transaction.update(
          roomRef.collection('players').doc(playerId),
          {
            cardsCount: player.cardsCount,
            pointsCaptured: player.pointsCaptured,
            tricksWon: player.tricksWon,
            lastActionAt: player.lastActionAt
          }
        );

        // Add move record
        const moveRef = roomRef.collection('moves').doc();
        transaction.set(moveRef, {
          type: 'play',
          playerId,
          pattern: play.pattern,
          cardCount: cards.length,
          timestamp: Timestamp.now()
        });

        return {
          success: true,
          pattern: play.pattern,
          isWinningPlay: !trickEnded || updatedRoom.gameState?.currentTrick?.leaderId === playerId,
          trickEnded,
          pointsWon: trickEnded ? updatedRoom.players.find(p => p.id === playerId)?.pointsCaptured : undefined
        };
      });

      return result;

    } catch (error) {
      if (error instanceof GameError) {
        throw new functions.https.HttpsError('failed-precondition', error.message);
      }
      console.error('playCards error:', error);
      throw new functions.https.HttpsError('internal', 'Failed to play cards');
    }
  }
);

/**
 * Pass turn (cannot beat or choose not to)
 */
export const passTurn = functions.https.onCall(
  async (data: PassTurnRequest, context): Promise<PassTurnResponse> => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const playerId = context.auth.uid;
    const { roomId } = data;

    if (!roomId) {
      throw new functions.https.HttpsError('invalid-argument', 'Room ID required');
    }

    try {
      const result = await db.runTransaction(async (transaction) => {
        const roomRef = db.collection('rooms').doc(roomId);
        const privateRef = db.collection('roomPrivate').doc(roomId);

        const [roomDoc, privateDoc] = await Promise.all([
          transaction.get(roomRef),
          transaction.get(privateRef)
        ]);

        if (!roomDoc.exists) {
          throw new GameError('ROOM_NOT_FOUND', 'Room does not exist');
        }

        const room = roomDoc.data() as Room;

        if (room.status !== 'playing') {
          throw new GameError('GAME_NOT_STARTED', 'Game is not in progress');
        }

        if (!privateDoc.exists) {
          throw new GameError('SERVER_ERROR', 'Private state missing');
        }

        const privateState = privateDoc.data() as RoomPrivate;

        // Anti-cheat: Prevent race conditions
        if (privateState.processingAction) {
          throw new GameError('RACE_CONDITION', 'Server is processing another action');
        }

        transaction.update(privateRef, { processingAction: true });

        // Apply pass
        const { room: updatedRoom, privateState: updatedPrivate, trickEnded } = applyPass(
          room,
          privateState,
          playerId
        );

        // If trick ended, resolve it
        let needsRefill = false;
        let gameEnded = false;

        if (trickEnded) {
          const resolveResult = resolveTrick(updatedRoom, updatedPrivate);
          needsRefill = resolveResult.needsRefill;
          gameEnded = resolveResult.gameEnded;

          if (needsRefill && !gameEnded) {
            const refillResult = refillHands(resolveResult.room, resolveResult.privateState);
            Object.assign(updatedRoom, refillResult.room);
            Object.assign(updatedPrivate, refillResult.privateState);
          }
        }

        // Check for auto-settle
        if (!gameEnded && shouldAutoSettle(updatedRoom)) {
          const settleResult = autoSettle(updatedRoom, updatedPrivate);
          Object.assign(updatedRoom, settleResult.room);
          Object.assign(updatedPrivate, settleResult.privateState);
          gameEnded = true;
        }

        // Write updates
        transaction.update(roomRef, {
          status: updatedRoom.status,
          gameState: updatedRoom.gameState,
          players: updatedRoom.players,
          result: updatedRoom.result || null,
          endedAt: updatedRoom.endedAt || null,
          lastActionAt: updatedRoom.lastActionAt
        });

        transaction.update(privateRef, {
          moveHistory: updatedPrivate.moveHistory,
          processingAction: false,
          lastProcessedAt: updatedPrivate.lastProcessedAt
        });

        // Update player public doc
        const player = updatedRoom.players.find(p => p.id === playerId)!;
        transaction.update(
          roomRef.collection('players').doc(playerId),
          { lastActionAt: player.lastActionAt }
        );

        // Add move record
        const moveRef = roomRef.collection('moves').doc();
        transaction.set(moveRef, {
          type: 'pass',
          playerId,
          timestamp: Timestamp.now()
        });

        return {
          success: true,
          trickEnded,
          nextPlayerId: updatedRoom.gameState?.currentTurnPlayerId || ''
        };
      });

      return result;

    } catch (error) {
      if (error instanceof GameError) {
        throw new functions.https.HttpsError('failed-precondition', error.message);
      }
      console.error('passTurn error:', error);
      throw new functions.https.HttpsError('internal', 'Failed to pass turn');
    }
  }
);

/**
 * Get complete game state including player's private hand
 * Used for initial load and reconnects
 */
export const getGameState = functions.https.onCall(
  async (data: { roomId: string }, context): Promise<PlayerGameView> => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const playerId = context.auth.uid;
    const { roomId } = data;

    if (!roomId) {
      throw new functions.https.HttpsError('invalid-argument', 'Room ID required');
    }

    try {
      // Get room (public state)
      const roomDoc = await db.collection('rooms').doc(roomId).get();
      if (!roomDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Room not found');
      }

      const room = roomDoc.data() as Room;

      // Verify player is in the room
      if (!room.players.some(p => p.id === playerId)) {
        throw new functions.https.HttpsError('permission-denied', 'Not a member of this room');
      }

      // Get player's hand if game is in progress
      let myHand: Card[] | null = null;
      if (room.status === 'playing') {
        const handDoc = await db
          .collection('roomPrivate')
          .doc(roomId)
          .collection('hands')
          .doc(playerId)
          .get();

        if (handDoc.exists) {
          myHand = (handDoc.data() as { hand: Card[] }).hand;
        }
      }

      return {
        room,
        myHand,
        myPlayerId: playerId
      };

    } catch (error) {
      console.error('getGameState error:', error);
      throw new functions.https.HttpsError('internal', 'Failed to get game state');
    }
  }
);

/**
 * Admin/Debug function to get full game state
 * Only callable by room host for debugging
 */
export const debugGameState = functions.https.onCall(
  async (data: { roomId: string }, context): Promise<unknown> => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const playerId = context.auth.uid;
    const { roomId } = data;

    try {
      const roomDoc = await db.collection('rooms').doc(roomId).get();
      if (!roomDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Room not found');
      }

      const room = roomDoc.data() as Room;

      // Only host can debug
      if (room.hostId !== playerId) {
        throw new functions.https.HttpsError('permission-denied', 'Only host can debug');
      }

      const privateDoc = await db.collection('roomPrivate').doc(roomId).get();
      const hands: Record<string, Card[]> = {};

      if (privateDoc.exists) {
        const privateState = privateDoc.data() as RoomPrivate;
        Object.assign(hands, privateState.hands);
      }

      return {
        room,
        hands,
        allCardsCount: Object.values(hands).reduce((sum, h) => sum + h.length, 0)
      };

    } catch (error) {
      console.error('debugGameState error:', error);
      throw new functions.https.HttpsError('internal', 'Failed to get debug state');
    }
  }
);
