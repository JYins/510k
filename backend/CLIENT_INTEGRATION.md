# Frontend Integration Guide for 510K

This guide shows how to integrate a Next.js frontend with the 510K game engine.

## Setup

```typescript
// lib/firebase.ts
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const auth = getAuth(app);

// Connect to emulator in development
if (process.env.NODE_ENV === 'development') {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

// Anonymous auth helper
export async function ensureAuth() {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
  return auth.currentUser!;
}
```

## Game State Hook

```typescript
// hooks/useGame.ts
import { useEffect, useState, useCallback } from 'react';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions, ensureAuth } from '@/lib/firebase';
import { Room, Card, PlayerGameView } from '@/types/game';

export function useGame(roomId: string | null) {
  const [room, setRoom] = useState<Room | null>(null);
  const [myHand, setMyHand] = useState<Card[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to room updates
  useEffect(() => {
    if (!roomId) return;

    let unsubscribe: Unsubscribe;

    const setup = async () => {
      try {
        await ensureAuth();

        // Subscribe to public room state
        const roomRef = doc(db, 'rooms', roomId);
        unsubscribe = onSnapshot(roomRef, (snapshot) => {
          if (snapshot.exists()) {
            setRoom(snapshot.data() as Room);
          } else {
            setError('Room not found');
          }
          setLoading(false);
        }, (err) => {
          setError(err.message);
          setLoading(false);
        });

        // Get initial hand
        const getGameState = httpsCallable(functions, 'getGameState');
        const { data } = await getGameState({ roomId }) as { data: PlayerGameView };
        setMyHand(data.myHand);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    setup();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [roomId]);

  // Refresh hand after actions
  const refreshHand = useCallback(async () => {
    if (!roomId) return;
    const getGameState = httpsCallable(functions, 'getGameState');
    const { data } = await getGameState({ roomId }) as { data: PlayerGameView };
    setMyHand(data.myHand);
  }, [roomId]);

  // Actions
  const playCards = useCallback(async (cardIndices: number[]) => {
    if (!roomId) return;
    const playCardsFn = httpsCallable(functions, 'playCards');
    const result = await playCardsFn({ roomId, cardIndices });
    await refreshHand();
    return result;
  }, [roomId, refreshHand]);

  const passTurn = useCallback(async () => {
    if (!roomId) return;
    const passTurnFn = httpsCallable(functions, 'passTurn');
    return passTurnFn({ roomId });
  }, [roomId]);

  return {
    room,
    myHand,
    loading,
    error,
    playCards,
    passTurn,
    refreshHand,
    isMyTurn: room?.gameState?.currentTurnPlayerId === auth.currentUser?.uid,
  };
}
```

## Room Management Hooks

```typescript
// hooks/useRoom.ts
import { useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions, ensureAuth } from '@/lib/firebase';

export function useRoomActions() {
  const createRoom = useCallback(async (displayName: string) => {
    await ensureAuth();
    const createRoomFn = httpsCallable(functions, 'createRoom');
    const { data } = await createRoomFn({ displayName }) as { data: { roomId: string } };
    return data.roomId;
  }, []);

  const joinRoom = useCallback(async (roomId: string, displayName: string) => {
    await ensureAuth();
    const joinRoomFn = httpsCallable(functions, 'joinRoom');
    await joinRoomFn({ roomId, displayName });
  }, []);

  const startGame = useCallback(async (roomId: string) => {
    const startGameFn = httpsCallable(functions, 'startGame');
    await startGameFn({ roomId });
  }, []);

  const leaveRoom = useCallback(async (roomId: string) => {
    const leaveRoomFn = httpsCallable(functions, 'leaveRoom');
    await leaveRoomFn({ roomId });
  }, []);

  return { createRoom, joinRoom, startGame, leaveRoom };
}
```

## Game Board Component

```tsx
// components/GameBoard.tsx
'use client';

import { useGame } from '@/hooks/useGame';
import { Card } from '@/components/Card';
import { TrickArea } from '@/components/TrickArea';

interface GameBoardProps {
  roomId: string;
}

export function GameBoard({ roomId }: GameBoardProps) {
  const { room, myHand, loading, error, playCards, passTurn, isMyTurn } = useGame(roomId);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!room) return <div>Room not found</div>;

  const currentPlayer = room.players.find(
    p => p.id === room.gameState?.currentTurnPlayerId
  );

  const handleCardClick = (index: number) => {
    if (!isMyTurn) return;
    setSelectedCards(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handlePlay = async () => {
    if (selectedCards.length === 0) return;
    try {
      await playCards(selectedCards);
      setSelectedCards([]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to play');
    }
  };

  const handlePass = async () => {
    try {
      await passTurn();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Cannot pass');
    }
  };

  const isTrickLeader = room.gameState?.currentTrick?.plays.length === 0;

  return (
    <div className="game-board">
      {/* Opponents */}
      <div className="opponents">
        {room.players
          .filter(p => p.id !== auth.currentUser?.uid)
          .map(player => (
            <div key={player.id} className="opponent">
              <div className="player-name">{player.displayName}</div>
              <div className="card-count">{player.cardsCount} cards</div>
              <div className="points">{player.pointsCaptured} pts</div>
            </div>
          ))}
      </div>

      {/* Trick Area */}
      <TrickArea
        trick={room.gameState?.currentTrick}
        currentPattern={room.gameState?.currentTrick?.highestPlay?.pattern}
      />

      {/* Current turn indicator */}
      <div className="turn-indicator">
        {currentPlayer?.displayName}'s turn
        {isMyTurn && <span> (Your turn!)</span>}
      </div>

      {/* My Hand */}
      <div className="my-hand">
        {myHand?.map((card, index) => (
          <Card
            key={`${card.suit}-${card.rank}-${index}`}
            card={card}
            selected={selectedCards.includes(index)}
            onClick={() => handleCardClick(index)}
            disabled={!isMyTurn}
          />
        ))}
      </div>

      {/* Actions */}
      {isMyTurn && (
        <div className="actions">
          <button
            onClick={handlePlay}
            disabled={selectedCards.length === 0}
          >
            Play
          </button>
          {!isTrickLeader && (
            <button onClick={handlePass}>Pass</button>
          )}
        </div>
      )}

      {/* Game Status */}
      <div className="game-status">
        <div>Round: {room.gameState?.roundNumber}</div>
        <div>Cards in deck: {room.gameState?.cardsInDeck}</div>
        <div>Trick points: {room.gameState?.currentTrick?.trickPoints}</div>
      </div>
    </div>
  );
}
```

## Card Component

```tsx
// components/Card.tsx
import { Card as CardType } from '@/types/game';

interface CardProps {
  card: CardType;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

const SUIT_SYMBOLS: Record<string, string> = {
  spade: '♠',
  heart: '♥',
  club: '♣',
  diamond: '♦',
  joker: '🃏',
};

const SUIT_COLORS: Record<string, string> = {
  spade: 'black',
  heart: 'red',
  club: 'black',
  diamond: 'red',
  joker: 'purple',
};

export function Card({ card, selected, disabled, onClick }: CardProps) {
  return (
    <div
      className={`card ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
      style={{ color: SUIT_COLORS[card.suit] }}
      onClick={!disabled ? onClick : undefined}
    >
      <div className="card-rank">{card.rank}</div>
      <div className="card-suit">{SUIT_SYMBOLS[card.suit]}</div>
      {card.points > 0 && <div className="card-points">{card.points}</div>}
    </div>
  );
}
```

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

## Type Definitions

```typescript
// types/game.ts
export interface Card {
  suit: 'spade' | 'heart' | 'club' | 'diamond' | 'joker';
  rank: string;
  value: number;
  points: number;
}

export interface PlayerPublic {
  id: string;
  displayName: string;
  index: number;
  status: 'active' | 'disconnected' | 'left';
  cardsCount: number;
  tricksWon: number;
  pointsCaptured: number;
}

export interface Play {
  playerId: string;
  playerIndex: number;
  cards: Card[];
  pattern: string;
  primaryValue: number;
}

export interface CurrentTrick {
  leaderId: string;
  plays: Play[];
  highestPlay: Play | null;
  passes: string[];
  trickPoints: number;
}

export interface GameState {
  currentTurnPlayerId: string;
  currentTrick: CurrentTrick | null;
  cardsInDeck: number;
  roundNumber: number;
  totalPointsPlayed: number;
}

export interface Room {
  id: string;
  hostId: string;
  status: 'waiting' | 'playing' | 'ended';
  players: PlayerPublic[];
  gameState?: GameState;
  result?: {
    winnerId: string;
    finalScores: Record<string, number>;
    reason: string;
  };
}

export interface PlayerGameView {
  room: Room;
  myHand: Card[] | null;
  myPlayerId: string;
}
```

## Pattern Helpers

```typescript
// utils/patterns.ts
import { Card } from '@/types/game';

export function sortHand(hand: Card[]): Card[] {
  const suitOrder = { spade: 4, heart: 3, club: 2, diamond: 1, joker: 5 };
  return [...hand].sort((a, b) => {
    if (a.value !== b.value) return b.value - a.value;
    return suitOrder[b.suit] - suitOrder[a.suit];
  });
}

export function groupByRank(hand: Card[]): Map<string, Card[]> {
  const groups = new Map<string, Card[]>();
  for (const card of hand) {
    const existing = groups.get(card.rank) || [];
    existing.push(card);
    groups.set(card.rank, existing);
  }
  return groups;
}

// Helper to suggest valid plays given current trick
export function getValidPlays(
  hand: Card[],
  currentPattern?: string,
  currentPrimaryValue?: number
): number[][] {
  // This is a client-side helper for UI hints
  // Actual validation happens server-side
  const validPlays: number[][] = [];

  // Singles
  for (let i = 0; i < hand.length; i++) {
    validPlays.push([i]);
  }

  // Pairs
  const byRank = groupByRank(hand);
  for (const [, cards] of byRank) {
    if (cards.length >= 2) {
      const indices = cards.map(c => hand.indexOf(c));
      validPlays.push(indices.slice(0, 2));
    }
  }

  // Add more patterns as needed...

  return validPlays;
}
```

## Error Handling

```typescript
// utils/errors.ts
export function handleGameError(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const firebaseError = error as { code?: string; message?: string };

    switch (firebaseError.code) {
      case 'functions/not-found':
        return 'Room not found';
      case 'functions/failed-precondition':
        return firebaseError.message || 'Invalid action';
      case 'functions/permission-denied':
        return 'Not authorized';
      case 'functions/unauthenticated':
        return 'Please sign in';
      default:
        return firebaseError.message || 'An error occurred';
    }
  }
  return 'An unexpected error occurred';
}
```
