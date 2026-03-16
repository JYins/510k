/**
 * Room management functions
 * - createRoom
 * - joinRoom
 * - leaveRoom
 * - startGame
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {
  CreateRoomRequest,
  CreateRoomResponse,
  JoinRoomRequest,
  JoinRoomResponse,
  StartGameRequest,
  Room,
  RoomPrivate,
  PlayerPublic,
  GameError
} from '../types';
import { initializeGame } from '../engine/gameLogic';

const db = admin.firestore();
const { Timestamp } = admin.firestore;

/**
 * Create a new game room
 * Caller becomes the host
 */
export const createRoom = functions.https.onCall(
  async (data: CreateRoomRequest, context): Promise<CreateRoomResponse> => {
    // Authentication check
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const playerId = context.auth.uid;
    const displayName = data.displayName?.trim() || 'Player';
    const maxPlayers = Math.min(Math.max(data.maxPlayers || 4, 2), 4);

    try {
      const roomId = db.collection('rooms').doc().id;
      const now = Timestamp.now();

      // Create host player
      const hostPlayer: PlayerPublic = {
        id: playerId,
        displayName: displayName.slice(0, 20), // Limit length
        index: 0,
        status: 'active',
        cardsCount: 0,
        tricksWon: 0,
        pointsCaptured: 0,
        lastActionAt: now
      };

      // Create room document
      const room: Room = {
        id: roomId,
        hostId: playerId,
        status: 'waiting',
        players: [hostPlayer],
        maxPlayers,
        config: {
          minPlayers: 2,
          maxPlayers: 4,
          targetScore: 1000 // Future feature
        },
        createdAt: now,
        lastActionAt: now
      };

      // Create private state (empty until game starts)
      const privateState: RoomPrivate = {
        roomId,
        deck: [],
        hands: {},
        moveHistory: [],
        processingAction: false,
        lastProcessedAt: now
      };

      // Write both documents in a batch
      const batch = db.batch();
      batch.set(db.collection('rooms').doc(roomId), room);
      batch.set(db.collection('roomPrivate').doc(roomId), privateState);
      batch.set(db.collection('rooms').doc(roomId).collection('players').doc(playerId), hostPlayer);

      await batch.commit();

      console.log(`Room created: ${roomId} by ${playerId}`);
      return { roomId, playerId };

    } catch (error) {
      console.error('createRoom error:', error);
      throw new functions.https.HttpsError('internal', 'Failed to create room');
    }
  }
);

/**
 * Join an existing room
 */
export const joinRoom = functions.https.onCall(
  async (data: JoinRoomRequest, context): Promise<JoinRoomResponse> => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const playerId = context.auth.uid;
    const { roomId, displayName } = data;

    if (!roomId || !displayName) {
      throw new functions.https.HttpsError('invalid-argument', 'Room ID and display name required');
    }

    try {
      const result = await db.runTransaction(async (transaction) => {
        const roomRef = db.collection('rooms').doc(roomId);
        const roomDoc = await transaction.get(roomRef);

        if (!roomDoc.exists) {
          throw new GameError('ROOM_NOT_FOUND', 'Room does not exist');
        }

        const room = roomDoc.data() as Room;

        // Check if game already started
        if (room.status !== 'waiting') {
          throw new GameError('GAME_ALREADY_STARTED', 'Game has already started');
        }

        // Check if already in room
        if (room.players.some(p => p.id === playerId)) {
          throw new GameError('ALREADY_IN_ROOM', 'You are already in this room');
        }

        // Check room capacity
        if (room.players.length >= room.maxPlayers) {
          throw new GameError('ROOM_FULL', 'Room is full');
        }

        const now = Timestamp.now();

        // Create new player
        const newPlayer: PlayerPublic = {
          id: playerId,
          displayName: displayName.slice(0, 20),
          index: room.players.length,
          status: 'active',
          cardsCount: 0,
          tricksWon: 0,
          pointsCaptured: 0,
          lastActionAt: now
        };

        // Update room
        const updatedPlayers = [...room.players, newPlayer];

        transaction.update(roomRef, {
          players: updatedPlayers,
          lastActionAt: now
        });

        // Add player subdocument
        transaction.set(
          roomRef.collection('players').doc(playerId),
          newPlayer
        );

        return { playerIndex: newPlayer.index };
      });

      console.log(`Player ${playerId} joined room ${roomId}`);
      return { success: true, playerIndex: result.playerIndex };

    } catch (error) {
      if (error instanceof GameError) {
        throw new functions.https.HttpsError('failed-precondition', error.message);
      }
      console.error('joinRoom error:', error);
      throw new functions.https.HttpsError('internal', 'Failed to join room');
    }
  }
);

/**
 * Leave a room (voluntary or disconnect)
 */
export const leaveRoom = functions.https.onCall(
  async (data: { roomId: string }, context): Promise<{ success: boolean }> => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const playerId = context.auth.uid;
    const { roomId } = data;

    try {
      await db.runTransaction(async (transaction) => {
        const roomRef = db.collection('rooms').doc(roomId);
        const roomDoc = await transaction.get(roomRef);

        if (!roomDoc.exists) {
          throw new GameError('ROOM_NOT_FOUND', 'Room does not exist');
        }

        const room = roomDoc.data() as Room;
        const playerIndex = room.players.findIndex(p => p.id === playerId);

        if (playerIndex === -1) {
          throw new GameError('NOT_IN_ROOM', 'You are not in this room');
        }

        // If game is in progress, end it with remaining players
        if (room.status === 'playing') {
          // Mark game as ended due to player leaving
          const remainingPlayers = room.players.filter(p => p.id !== playerId);
          if (remainingPlayers.length > 0) {
            // Winner is player with most points so far
            const winner = remainingPlayers.reduce((max, p) =>
              p.pointsCaptured > max.pointsCaptured ? p : max
            );

            transaction.update(roomRef, {
              status: 'ended',
              endedAt: Timestamp.now(),
              'result.winnerId': winner.id,
              'result.reason': 'player-left',
              'result.endedAt': Timestamp.now()
            });
          } else {
            // Last player left, delete room
            transaction.delete(roomRef);
            transaction.delete(db.collection('roomPrivate').doc(roomId));
          }
        } else {
          // Waiting room - just remove player
          const updatedPlayers = room.players
            .filter(p => p.id !== playerId)
            .map((p, idx) => ({ ...p, index: idx }));

          if (updatedPlayers.length === 0) {
            // No players left, delete room
            transaction.delete(roomRef);
            transaction.delete(db.collection('roomPrivate').doc(roomId));
          } else {
            // Update room with remaining players
            const newHostId = updatedPlayers[0].id;
            transaction.update(roomRef, {
              players: updatedPlayers,
              hostId: newHostId,
              lastActionAt: Timestamp.now()
            });

            // Delete player subdocument
            transaction.delete(roomRef.collection('players').doc(playerId));
          }
        }
      });

      console.log(`Player ${playerId} left room ${roomId}`);
      return { success: true };

    } catch (error) {
      if (error instanceof GameError) {
        throw new functions.https.HttpsError('failed-precondition', error.message);
      }
      console.error('leaveRoom error:', error);
      throw new functions.https.HttpsError('internal', 'Failed to leave room');
    }
  }
);

/**
 * Start the game (host only)
 */
export const startGame = functions.https.onCall(
  async (data: StartGameRequest, context): Promise<{ success: boolean }> => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const playerId = context.auth.uid;
    const { roomId } = data;

    try {
      await db.runTransaction(async (transaction) => {
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

        // Check host
        if (room.hostId !== playerId) {
          throw new GameError('NOT_HOST', 'Only host can start the game');
        }

        // Check status
        if (room.status !== 'waiting') {
          throw new GameError('GAME_ALREADY_STARTED', 'Game has already started');
        }

        // Check player count
        if (room.players.length < room.config.minPlayers) {
          throw new GameError('NOT_ENOUGH_PLAYERS', `Need at least ${room.config.minPlayers} players`);
        }

        // Check private state
        if (!privateDoc.exists) {
          throw new GameError('SERVER_ERROR', 'Room private state missing');
        }

        const privateState = privateDoc.data() as RoomPrivate;

        // Check if already processing
        if (privateState.processingAction) {
          throw new GameError('RACE_CONDITION', 'Game is processing another action');
        }

        // Initialize game
        const { room: updatedRoom, privateState: updatedPrivate } = initializeGame(room, privateState);

        // Lock processing during initialization
        updatedPrivate.processingAction = false;

        // Write updates
        transaction.update(roomRef, {
          status: updatedRoom.status,
          startedAt: updatedRoom.startedAt,
          lastActionAt: updatedRoom.lastActionAt,
          gameState: updatedRoom.gameState,
          players: updatedRoom.players
        });

        transaction.set(privateRef, updatedPrivate, { merge: true });

        // Write player hands to private subcollection
        for (const [pid, hand] of Object.entries(updatedPrivate.hands)) {
          transaction.set(
            privateRef.collection('hands').doc(pid),
            {
              playerId: pid,
              hand,
              updatedAt: Timestamp.now()
            }
          );
        }

        // Update player public docs with card counts
        for (const player of updatedRoom.players) {
          transaction.update(
            roomRef.collection('players').doc(player.id),
            { cardsCount: player.cardsCount }
          );
        }
      });

      console.log(`Game started in room ${roomId}`);
      return { success: true };

    } catch (error) {
      if (error instanceof GameError) {
        throw new functions.https.HttpsError('failed-precondition', error.message);
      }
      console.error('startGame error:', error);
      throw new functions.https.HttpsError('internal', 'Failed to start game');
    }
  }
);
