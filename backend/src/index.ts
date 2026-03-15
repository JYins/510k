/**
 * 510K Game Engine - Cloud Functions Entry Point
 *
 * Architecture:
 * - Firestore: Real-time state sync (rooms, players, public game state)
 * - Cloud Functions: Server-authoritative game logic (all mutations)
 * - Private Collection: Server-only game state (hands, deck)
 *
 * Security Model:
 * - Clients can ONLY read public state and their own hand
 * - All game mutations go through callable functions
 * - Functions validate everything - clients cannot be trusted
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Export all callable functions
export * from './functions/room';
export * from './functions/game';

// Export Firestore triggers for reactive game logic
export * from './functions/triggers';

// Export scheduled functions for cleanup
export * from './functions/scheduler';
