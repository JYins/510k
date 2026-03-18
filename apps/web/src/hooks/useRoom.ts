"use client";

import { useEffect, useState, useCallback } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

interface Player {
  uid: string;
  seat: number;
  displayName?: string;
  score: number;
  isBot?: boolean;
}

interface BotState {
  lastProcessedTurnKey?: string | null;
}

interface TrickState {
  leaderSeat: number;
  lastPlay?: { seat: number; cards: Array<{ id: string; rank: string; suit?: string }> } | null;
  passes: number;
  pile: Array<{ id: string; rank: string; suit?: string }>;
}

export interface RoomState {
  roomId: string;
  status: "lobby" | "playing" | "ended";
  maxPlayers: number;
  createdAt: number;
  updatedAt: number;
  players: Player[];
  currentTurnSeat: number;
  trick: TrickState;
  deck: Array<{ id: string; rank: string; suit?: string }>;
  hands: Record<string, Array<{ id: string; rank: string; suit?: string }>>;
  discards: Array<{ id: string; rank: string; suit?: string }>;
  botState?: BotState;
}

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
  addBot: () => Promise<{ roomId: string; seat: number; botCount: number }>;
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

  const addBot = useCallback(async () => {
    const fn = httpsCallable(functions, "addBotToRoom");
    const result = await fn({ roomId });
    return result.data as { roomId: string; seat: number; botCount: number };
  }, [roomId]);

  const leaveRoom = useCallback(async () => {
    // No leave function exists yet; just navigate away
  }, []);

  return { room, isLoading, error, createRoom, joinRoom, startGame, addBot, leaveRoom };
}
