/**
 * Firebase Room Hook
 *
 * Provides real-time synchronization with the room document.
 * Replace mock data with actual Firebase implementation.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { Room, RoomStatus } from "@/types/game";
import { MOCK_ROOM_WAITING, MOCK_ROOM_PLAYING_MY_TURN, MOCK_ROOM_FINISHED } from "@/mocks/gameData";

interface UseRoomOptions {
  roomId: string;
  enableMock?: boolean;
}

interface UseRoomReturn {
  room: Room | null;
  isLoading: boolean;
  error: string | null;
  // Actions
  createRoom: (maxPlayers: number) => Promise<{ roomId: string }>;
  joinRoom: () => Promise<void>;
  leaveRoom: () => Promise<void>;
  startGame: () => Promise<void>;
  kickPlayer: (playerId: string) => Promise<void>;
  // Reconnection
  reconnect: () => void;
}

/**
 * Hook for room state management
 *
 * TODO: Replace mock implementation with Firebase:
 * 1. Import { doc, onSnapshot, updateDoc, collection, addDoc } from 'firebase/firestore'
 * 2. Subscribe to room document using onSnapshot
 * 3. Use updateDoc for state changes
 * 4. Handle offline/online status with onDisconnect
 */
export function useRoom({ roomId, enableMock = true }: UseRoomOptions): UseRoomReturn {
  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to room updates
  useEffect(() => {
    if (!roomId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    if (enableMock) {
      // Mock subscription - simulate network delay
      const timer = setTimeout(() => {
        // Cycle through mock states for demo
        const mockRooms: Record<string, Room> = {
          "WAIT": MOCK_ROOM_WAITING,
          "PLAY": MOCK_ROOM_PLAYING_MY_TURN,
          "END": MOCK_ROOM_FINISHED,
        };
        setRoom(mockRooms[roomId] || MOCK_ROOM_WAITING);
        setIsLoading(false);
      }, 500);

      return () => clearTimeout(timer);
    }

    // TODO: Firebase implementation
    /*
    import { getFirestore, doc, onSnapshot } from 'firebase/firestore';

    const db = getFirestore();
    const roomRef = doc(db, 'rooms', roomId);

    const unsubscribe = onSnapshot(
      roomRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setRoom({ id: snapshot.id, ...snapshot.data() } as Room);
        } else {
          setError('Room not found');
        }
        setIsLoading(false);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
    */

    return undefined;
  }, [roomId, enableMock]);

  const createRoom = useCallback(async (maxPlayers: number) => {
    // TODO: Firebase implementation
    /*
    const db = getFirestore();
    const roomsRef = collection(db, 'rooms');

    const newRoom = {
      status: 'waiting',
      maxPlayers,
      players: [],
      createdAt: Date.now(),
      // ...
    };

    const docRef = await addDoc(roomsRef, newRoom);
    return { roomId: docRef.id };
    */

    console.log("Creating room with max players:", maxPlayers);
    return { roomId: "ABC123" };
  }, []);

  const joinRoom = useCallback(async () => {
    // TODO: Firebase implementation
    /*
    const db = getFirestore();
    const roomRef = doc(db, 'rooms', roomId);

    await updateDoc(roomRef, {
      players: arrayUnion({
        id: currentUserId,
        name: currentUserName,
        // ...
      })
    });
    */

    console.log("Joining room:", roomId);
  }, [roomId]);

  const leaveRoom = useCallback(async () => {
    // TODO: Firebase implementation
    console.log("Leaving room:", roomId);
  }, [roomId]);

  const startGame = useCallback(async () => {
    // TODO: Firebase implementation
    /*
    const db = getFirestore();
    const roomRef = doc(db, 'rooms', roomId);

    await updateDoc(roomRef, {
      status: 'playing',
      startedAt: Date.now(),
      // Initialize game state
    });
    */

    console.log("Starting game in room:", roomId);
  }, [roomId]);

  const kickPlayer = useCallback(async (playerId: string) => {
    // TODO: Firebase implementation
    console.log("Kicking player:", playerId);
  }, []);

  const reconnect = useCallback(() => {
    setIsLoading(true);
    // Trigger re-subscription
  }, []);

  return {
    room,
    isLoading,
    error,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    kickPlayer,
    reconnect,
  };
}
