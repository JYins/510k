/**
 * Scheduled cleanup functions
 * - Remove old completed games
 * - Clean up orphaned private data
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Clean up old game data daily
 * Removes rooms that ended more than 24 hours ago
 */
export const cleanupOldGames = functions.pubsub
  .schedule('0 3 * * *') // 3 AM daily
  .timeZone('UTC')
  .onRun(async (context) => {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoff);

    console.log('Starting daily cleanup of old games...');

    // Find old ended games
    const oldGames = await db.collection('rooms')
      .where('status', '==', 'ended')
      .where('endedAt', '<', cutoffTimestamp)
      .limit(100)
      .get();

    console.log(`Found ${oldGames.size} old games to clean up`);

    const batch = db.batch();
    let count = 0;

    for (const doc of oldGames.docs) {
      const roomId = doc.id;

      // Delete room document
      batch.delete(doc.ref);

      // Delete private state
      batch.delete(db.collection('roomPrivate').doc(roomId));

      // Delete subcollections (players, moves)
      const players = await doc.ref.collection('players').get();
      for (const player of players.docs) {
        batch.delete(player.ref);
      }

      const moves = await doc.ref.collection('moves').get();
      for (const move of moves.docs) {
        batch.delete(move.ref);
      }

      // Delete private hands
      const hands = await db.collection('roomPrivate').doc(roomId).collection('hands').get();
      for (const hand of hands.docs) {
        batch.delete(hand.ref);
      }

      count++;

      // Commit in batches of 10
      if (count >= 10) {
        await batch.commit();
        count = 0;
      }
    }

    // Final commit
    if (count > 0) {
      await batch.commit();
    }

    console.log(`Cleaned up ${oldGames.size} old games`);
    return null;
  });

/**
 * Clean up stale waiting rooms (older than 1 hour with no activity)
 */
export const cleanupStaleWaitingRooms = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    const cutoff = new Date(Date.now() - 60 * 60 * 1000);
    const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoff);

    const staleRooms = await db.collection('rooms')
      .where('status', '==', 'waiting')
      .where('lastActionAt', '<', cutoffTimestamp)
      .limit(50)
      .get();

    console.log(`Found ${staleRooms.size} stale waiting rooms`);

    for (const doc of staleRooms.docs) {
      const roomId = doc.id;

      // Delete the room and associated data
      await db.recursiveDelete(db.collection('rooms').doc(roomId));
      await db.recursiveDelete(db.collection('roomPrivate').doc(roomId));
    }

    return null;
  });

/**
 * Health check function
 * Can be called to verify backend is working
 */
export const healthCheck = functions.https.onCall(async (data, context) => {
  return {
    status: 'ok',
    timestamp: admin.firestore.Timestamp.now().toMillis(),
    version: '1.0.0'
  };
});
