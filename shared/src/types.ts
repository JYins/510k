export type Suit = "S" | "H" | "C" | "D";
export type Rank =
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K"
  | "A"
  | "2"
  | "3"
  | "SJ"
  | "BJ";

export type RoomStatus = "lobby" | "playing" | "ended";

export interface Card {
  id: string;
  rank: Rank;
  suit?: Suit;
}

export interface Player {
  uid: string;
  seat: number;
  displayName?: string;
  score: number;
  isBot?: boolean;
}

export interface BotState {
  lastProcessedTurnKey?: string | null;
}

export interface TrickPlay {
  seat: number;
  cards: Card[];
  type: "play" | "pass";
}

export interface TrickState {
  leaderSeat: number;
  lastPlay?: {
    seat: number;
    cards: Card[];
  } | null;
  passes: number;
  pile: Card[];
  plays?: TrickPlay[];
}

export interface TrickResult {
  winnerSeat: number;
  points: number;
  pile: Card[];
  timestamp: number;
}

export interface RoomState {
  roomId: string;
  status: RoomStatus;
  maxPlayers: number;
  createdAt: number;
  updatedAt: number;
  players: Player[];
  currentTurnSeat: number;
  trick: TrickState;
  deck: Card[];
  hands: Record<string, Card[]>;
  discards: Card[];
  lastTrickResult?: TrickResult;
  botState?: BotState;
}
