import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

export async function createRoom(maxPlayers: number) {
  const callable = httpsCallable(functions, "createRoom");
  const result = await callable({ maxPlayers });
  return result.data as { roomId: string };
}

export async function joinRoom(roomId: string) {
  const callable = httpsCallable(functions, "joinRoom");
  const result = await callable({ roomId });
  return result.data as { roomId: string; seat: number };
}

export async function startGame(roomId: string) {
  const callable = httpsCallable(functions, "startGame");
  const result = await callable({ roomId });
  return result.data as { roomId: string };
}

export async function addBotToRoom(roomId: string) {
  const callable = httpsCallable(functions, "addBotToRoom");
  const result = await callable({ roomId });
  return result.data as { roomId: string; seat: number; botCount: number };
}

export async function playCards(roomId: string, cardIds: string[]) {
  const callable = httpsCallable(functions, "playCards");
  const result = await callable({ roomId, cardIds });
  return result.data as { roomId: string };
}

export async function passTurn(roomId: string) {
  const callable = httpsCallable(functions, "passTurn");
  const result = await callable({ roomId });
  return result.data as { roomId: string };
}

export async function autoSettle(roomId: string) {
  const callable = httpsCallable(functions, "autoSettleIfNeeded");
  const result = await callable({ roomId });
  return result.data as { roomId: string; settled: boolean; reason?: string };
}
