"use client";

import { useEffect, useState, useCallback } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import type { RoomState, Player } from "@510k/shared";

interface UseRoomOptions {
  roomId: string;
}

interface UseRoomReturn {
  room: RoomState | null;
  isLoading: boolean;
  error: string | null;
  createRoom: (maxPlayers: number) => Promise<{ roomId: string }>;
  joinRoom: () => Promise<{ roomId: string; seat: number }>;
  startGame: () => Promise<void>;
  leaveRoom: () => Promise<void>;
}

export function useRoom({ roomId }: UseRoomOptions): UseRoomReturn {
  const { user } = useAuth();
  const [room, setRoom] = useState<RoomState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsub = onSnapshot(
      doc(db, "rooms", roomId),
      (snap) => {
        if (snap.exists()) {
          setRoom(snap.data() as RoomState);
        } else {
          setError("房间不存在");
        }
        setIsLoading(false);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      }
    );

    return unsub;
  }, [roomId]);

  const createRoom = useCallback(async (maxPlayers: number) => {
    const fn = httpsCallable(functions, "createRoom");
    const result = await fn({ maxPlayers });
    return result.data as { roomId: string };
  }, []);

  const joinRoom = useCallback(async () => {
    const fn = httpsCallable(functions, "joinRoom");
    const result = await fn({ roomId });
    return result.data as { roomId: string; seat: number };
  }, [roomId]);

  const startGame = useCallback(async () => {
    const fn = httpsCallable(functions, "startGame");
    await fn({ roomId });
  }, [roomId]);

  const leaveRoom = useCallback(async () => {
    // No leave function exists yet; just navigate away
  }, []);

  return { room, isLoading, error, createRoom, joinRoom, startGame, leaveRoom };
}
