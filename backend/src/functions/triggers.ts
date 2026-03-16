/**
 * Firestore triggers for reactive game logic
 * - Clean up abandoned rooms
 * - Handle disconnections
 * - Process async actions
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Room, RoomPrivate } from '../types';
import { shouldAutoSettle, autoSettle } from '../engine/gameLogic';

const db = admin.firestore();

/**
 * Trigger when room document is updated
 * Handles auto-settle detection and cleanup
 */
export const onRoomUpdate = functions.firestore
  .document('rooms/{roomId}')
  .onUpdate(async (change, context) => {
    const { roomId } = context.params;
    const before = change.before.data() as Room;
    const after = change.after.data() as Room;

    // Game just started - could set up additional listeners here
    if (before.status === 'waiting' && after.status === 'playing') {
      console.log(`Game started in room ${roomId}`);

      // Set a timeout for game completion (safety net)
      // If game doesn't end in 2 hours, auto-end it
      const endTime = new Date(Date.now() + 2 * 60 * 60 * 1000);

      await db.collection('gameTimeouts').doc(roomId).set({
        roomId,
        scheduledEndTime: admin.firestore.Timestamp.fromDate(endTime),
        createdAt: admin.firestore.Timestamp.now()
      });
    }

    // Game ended - cleanup
    if (before.status === 'playing' && after.status === 'ended') {
      console.log(`Game ended in room ${roomId}`);

      // Clean up timeout doc
      await db.collection('gameTimeouts').doc(roomId).delete().catch(() => {
        // Ignore errors - may not exist
      });
    }

    return null;
  });

/**
 * Trigger when a player disconnects (optional - requires presence system)
 * Could implement using Firebase's onDisconnect or a heartbeat system
 */
export const onPlayerDisconnect = functions.firestore
  .document('rooms/{roomId}/players/{playerId}')
  .onUpdate(async (change, context) => {
    const { roomId, playerId } = context.params;
    const before = change.before.data();
    const after = change.after.data();

    // Player went offline
    if (before.status === 'active' && after.status === 'disconnected') {
      console.log(`Player ${playerId} disconnected from room ${roomId}`);

      // Give them 60 seconds to reconnect before considering them gone
      await new Promise(resolve => setTimeout(resolve, 60000));

      // Check if they reconnected
      const playerDoc = await db
        .collection('rooms')
        .doc(roomId)
        .collection('players')
        .doc(playerId)
        .get();

      if (playerDoc.exists && playerDoc.data()?.status === 'disconnected') {
        // Still disconnected - remove from game
        const roomRef = db.collection('rooms').doc(roomId);
        const roomDoc = await roomRef.get();

        if (roomDoc.exists) {
          const room = roomDoc.data() as Room;

          if (room.status === 'playing') {
            // End game with remaining players
            const remainingPlayers = room.players.filter(p => p.id !== playerId);
            if (remainingPlayers.length > 0) {
              const winner = remainingPlayers.reduce((max, p) =>
                p.pointsCaptured > max.pointsCaptured ? p : max
              );

              await roomRef.update({
                status: 'ended',
                endedAt: admin.firestore.Timestamp.now(),
                'result.winnerId': winner.id,
                'result.reason': 'player-left',
                'result.endedAt': admin.firestore.Timestamp.now()
              });
            }
          }
        }
      }
    }

    return null;
  });

/**
 * Check for stuck games every minute
 * Uses a separate collection to track active games
 */
export const checkStuckGames = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const fiveMinutesAgoTimestamp = admin.firestore.Timestamp.fromDate(fiveMinutesAgo);

    // Find games that haven't had action in 5+ minutes
    const stuckGames = await db.collection('rooms')
      .where('status', '==', 'playing')
      .where('lastActionAt', '<', fiveMinutesAgoTimestamp)
      .limit(10)
      .get();

    console.log(`Found ${stuckGames.size} potentially stuck games`);

    for (const doc of stuckGames.docs) {

      try {
        await db.runTransaction(async (transaction) => {
          const roomRef = db.collection('rooms').doc(doc.id);
          const privateRef = db.collection('roomPrivate').doc(doc.id);

          const [roomDoc, privateDoc] = await Promise.all([
            transaction.get(roomRef),
            transaction.get(privateRef)
          ]);

          if (!roomDoc.exists || !privateDoc.exists) return;

          const currentRoom = roomDoc.data() as Room;
          const privateState = privateDoc.data() as RoomPrivate;

          // Double-check conditions
          if (currentRoom.status !== 'playing') return;
          if (!shouldAutoSettle(currentRoom)) return;

          console.log(`Auto-settling stuck game: ${doc.id}`);

          // Perform auto-settle
          const { room: settledRoom, privateState: settledPrivate } = autoSettle(
            currentRoom,
            privateState
          );

          transaction.update(roomRef, {
            status: settledRoom.status,
            endedAt: settledRoom.endedAt,
            result: settledRoom.result,
            lastActionAt: settledRoom.lastActionAt,
            'gameState.consecutivePasses': settledRoom.gameState?.consecutivePasses
          });

          transaction.update(privateRef, {
            moveHistory: settledPrivate.moveHistory
          });
        });
      } catch (error) {
        console.error(`Failed to auto-settle game ${doc.id}:`, error);
      }
    }

    return null;
  });
