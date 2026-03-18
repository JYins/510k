import * as admin from "firebase-admin";
import { HttpsError, onCall, CallableRequest } from "firebase-functions/v2/https";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { setGlobalOptions } from "firebase-functions/v2";
import {
  Card,
  Player,
  PlayValue,
  RoomState,
  analyzePlay,
  canBeatPlay,
  compareCard,
  createDeck,
  maxCard,
  pointValue,
  RANK_VALUE,
  SUIT_VALUE
} from "@510k/shared";

setGlobalOptions({ region: "us-central1", invoker: "public" });

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });
const ROOMS_COLLECTION = "rooms";

function requireAuth(request: CallableRequest): string {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError("unauthenticated", "需要登录后才能调用。");
  }
  return request.auth.uid;
}

function shuffle<T>(items: T[]): T[] {
  const copied = [...items];
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
}

function nextSeat(currentSeat: number, totalPlayers: number): number {
  return (currentSeat + 1) % totalPlayers;
}

function pickNextSeat(players: Player[], maxPlayers: number): number {
  const usedSeats = new Set(players.map((player) => player.seat));
  for (let seat = 0; seat < maxPlayers; seat += 1) {
    if (!usedSeats.has(seat)) {
      return seat;
    }
  }
  return players.length;
}

function removeCardsFromHand(
  hand: Card[],
  cardIds: string[]
): { newHand: Card[]; removed: Card[] } {
  const remaining = [...hand];
  const removed: Card[] = [];
  for (const cardId of cardIds) {
    const index = remaining.findIndex((card) => card.id === cardId);
    if (index === -1) {
      throw new HttpsError("invalid-argument", "手牌中不存在该牌。");
    }
    removed.push(remaining[index]);
    remaining.splice(index, 1);
  }
  return { newHand: remaining, removed };
}

function dealHands(
  deck: Card[],
  players: Player[],
  handSize: number
): { hands: Record<string, Card[]>; remainingDeck: Card[] } {
  const remainingDeck = [...deck];
  const hands: Record<string, Card[]> = {};
  for (const player of players) {
    hands[player.uid] = remainingDeck.splice(0, handSize);
  }
  return { hands, remainingDeck };
}

function sumPoints(cards: Card[]): number {
  return cards.reduce((total, card) => total + pointValue(card), 0);
}

/** 找到持有最小牌的玩家座位号（用于决定先手） */
function findSmallestCardSeat(
  hands: Record<string, Card[]>,
  players: Player[]
): number {
  let smallestCard: Card | null = null;
  let smallestSeat = 0;

  for (const player of players) {
    const hand = hands[player.uid] ?? [];
    for (const card of hand) {
      if (!smallestCard) {
        smallestCard = card;
        smallestSeat = player.seat;
        continue;
      }
      // 比较牌大小：先比 rank，再比 suit
      const rankDiff = RANK_VALUE[card.rank] - RANK_VALUE[smallestCard.rank];
      if (rankDiff < 0) {
        smallestCard = card;
        smallestSeat = player.seat;
      } else if (rankDiff === 0) {
        // rank 相同时比较 suit
        const cardSuit = card.suit ? SUIT_VALUE[card.suit] : 0;
        const smallestSuit = smallestCard.suit ? SUIT_VALUE[smallestCard.suit] : 0;
        if (cardSuit < smallestSuit) {
          smallestCard = card;
          smallestSeat = player.seat;
        }
      }
    }
  }

  return smallestSeat;
}

function refillHandsIfNeeded(
  hands: Record<string, Card[]>,
  deck: Card[],
  players: Player[],
  startSeat: number,
  targetHandSize: number
): { hands: Record<string, Card[]>; deck: Card[] } {
  const nextHands = { ...hands };
  let nextDeck = [...deck];
  let seat = startSeat;
  const orderedSeats = players.map((player) => player.seat);
  for (let i = 0; i < players.length; i += 1) {
    const player = players.find((p) => p.seat === seat);
    if (!player) {
      seat = nextSeat(seat, players.length);
      continue;
    }
    const currentHand = nextHands[player.uid] ?? [];
    while (currentHand.length < targetHandSize && nextDeck.length > 0) {
      currentHand.push(nextDeck.shift() as Card);
    }
    nextHands[player.uid] = currentHand;
    seat = nextSeat(seat, orderedSeats.length);
  }
  return { hands: nextHands, deck: nextDeck };
}

function settleGame(room: RoomState): RoomState {
  const remainPointsByUid: Record<string, number> = {};
  const maxHandCardByUid: Record<string, Card | undefined> = {};
  for (const player of room.players) {
    const hand = room.hands[player.uid] ?? [];
    remainPointsByUid[player.uid] = sumPoints(hand);
    maxHandCardByUid[player.uid] = maxCard(hand);
  }

  const eligiblePlayers = room.players.filter((player) => !player.isBot);
  const rankingPool = eligiblePlayers.length > 0 ? eligiblePlayers : room.players;

  let winnerUid = rankingPool[0]?.uid;
  for (const player of rankingPool) {
    const candidate = maxHandCardByUid[player.uid];
    const current = winnerUid ? maxHandCardByUid[winnerUid] : undefined;
    if (!current) {
      winnerUid = player.uid;
      continue;
    }
    if (candidate && compareCard(candidate, current) > 0) {
      winnerUid = player.uid;
    }
  }

  const bonus = Object.values(remainPointsByUid).reduce(
    (total, value) => total + value,
    0
  );

  const updatedPlayers = room.players.map((player) => {
    if (player.uid !== winnerUid) {
      return player;
    }
    return { ...player, score: player.score + bonus };
  });

  return {
    ...room,
    status: "ended",
    players: updatedPlayers,
    updatedAt: Date.now()
  };
}

const USERS_COLLECTION = "users";

async function getUserDisplayName(uid: string): Promise<string | undefined> {
  const snap = await db.collection(USERS_COLLECTION).doc(uid).get();
  return snap.exists ? snap.data()?.displayName : undefined;
}

async function updateUserScores(room: RoomState): Promise<void> {
  const humanPlayers = room.players.filter((player) => !player.isBot);
  if (humanPlayers.length === 0) {
    return;
  }

  const sorted = [...humanPlayers].sort((a, b) => b.score - a.score);
  const bonuses = [50, 20, 10, 0];

  const batch = db.batch();
  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i];
    const ref = db.collection(USERS_COLLECTION).doc(p.uid);
    const earned = p.score + (bonuses[i] ?? 0);
    batch.set(ref, {
      totalScore: admin.firestore.FieldValue.increment(earned),
      gamesPlayed: admin.firestore.FieldValue.increment(1),
      ...(i === 0 ? { gamesWon: admin.firestore.FieldValue.increment(1) } : {}),
    }, { merge: true });
  }
  try {
    await batch.commit();
  } catch (e) {
    console.error("updateUserScores failed:", e);
  }
}

function generateRoomId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

interface CandidatePlay {
  cards: Card[];
  cardIds: string[];
  value: PlayValue;
  breaksBomb: boolean;
  pointCost: number;
  maxCardStrength: number;
}

type BotDecision =
  | { type: "play"; cardIds: string[] }
  | { type: "pass" };

function getPlayerByUid(room: RoomState, uid: string): Player | undefined {
  return room.players.find((player) => player.uid === uid);
}

function getPlayerBySeat(room: RoomState, seat: number): Player | undefined {
  return room.players.find((player) => player.seat === seat);
}

function getTurnPlayer(room: RoomState): Player | undefined {
  return getPlayerBySeat(room, room.currentTurnSeat);
}

function cardStrength(card: Card): number {
  const suitStrength = card.suit ? SUIT_VALUE[card.suit] : 0;
  return RANK_VALUE[card.rank] * 10 + suitStrength;
}

function getBotTurnKey(room: RoomState): string {
  const currentPlayer = getTurnPlayer(room);
  const currentHandKey = currentPlayer
    ? [...(room.hands[currentPlayer.uid] ?? [])]
        .map((card) => card.id)
        .sort()
        .join(",")
    : "";
  const lastPlayKey = room.trick.lastPlay
    ? `${room.trick.lastPlay.seat}:${room.trick.lastPlay.cards.map((card) => card.id).sort().join(",")}`
    : "lead";
  const playsCount = room.trick.plays?.length ?? 0;
  return [
    room.status,
    room.currentTurnSeat,
    lastPlayKey,
    room.trick.passes,
    playsCount,
    room.deck.length,
    currentHandKey,
  ].join("|");
}

function breaksBombSet(hand: Card[], selected: Card[]): boolean {
  const rankCounts = new Map<string, number>();
  for (const card of hand) {
    rankCounts.set(card.rank, (rankCounts.get(card.rank) ?? 0) + 1);
  }
  for (const [rank, count] of rankCounts.entries()) {
    if (count !== 4) continue;
    const selectedCount = selected.filter((card) => card.rank === rank).length;
    if (selectedCount > 0 && selectedCount < 4) {
      return true;
    }
  }

  const jokerCount = hand.filter((card) => card.rank === "SJ" || card.rank === "BJ").length;
  const selectedJokerCount = selected.filter((card) => card.rank === "SJ" || card.rank === "BJ").length;
  return jokerCount === 2 && selectedJokerCount === 1;
}

function getPlayTypeOrder(type: PlayValue["type"]): number {
  switch (type) {
    case "single":
      return 0;
    case "pair":
      return 1;
    case "triple":
      return 2;
    case "triple_with_single":
      return 3;
    case "triple_with_pair":
      return 4;
    case "straight":
      return 5;
    case "bomb":
      return 6;
    case "joker_bomb":
      return 7;
    default:
      return 99;
  }
}

function listCandidatePlays(hand: Card[]): CandidatePlay[] {
  const orderedHand = [...hand].sort(compareCard);
  const seen = new Set<string>();
  const candidates: CandidatePlay[] = [];

  for (let mask = 1; mask < 1 << orderedHand.length; mask += 1) {
    const cards = orderedHand.filter((_, index) => ((mask >> index) & 1) === 1);
    const value = analyzePlay(cards);
    if (!value) continue;
    const key = cards.map((card) => card.id).sort().join(",");
    if (seen.has(key)) continue;
    seen.add(key);
    candidates.push({
      cards,
      cardIds: cards.map((card) => card.id),
      value,
      breaksBomb: breaksBombSet(orderedHand, cards),
      pointCost: sumPoints(cards),
      maxCardStrength: Math.max(...cards.map(cardStrength)),
    });
  }

  return candidates;
}

function compareLeadCandidates(a: CandidatePlay, b: CandidatePlay): number {
  const bombPenaltyA = a.value.isJokerBomb ? 4000 : a.value.isBomb ? 1500 : 0;
  const bombPenaltyB = b.value.isJokerBomb ? 4000 : b.value.isBomb ? 1500 : 0;
  const splitPenaltyA = a.breaksBomb ? 800 : 0;
  const splitPenaltyB = b.breaksBomb ? 800 : 0;
  const scoreA =
    bombPenaltyA +
    splitPenaltyA +
    a.pointCost * 50 +
    getPlayTypeOrder(a.value.type) * 40 +
    a.value.length * 12 +
    a.value.mainRankValue * 8 +
    a.maxCardStrength;
  const scoreB =
    bombPenaltyB +
    splitPenaltyB +
    b.pointCost * 50 +
    getPlayTypeOrder(b.value.type) * 40 +
    b.value.length * 12 +
    b.value.mainRankValue * 8 +
    b.maxCardStrength;
  return scoreA - scoreB;
}

function compareFollowCandidates(a: CandidatePlay, b: CandidatePlay): number {
  const bombPenaltyA = a.value.isJokerBomb ? 4000 : a.value.isBomb ? 1500 : 0;
  const bombPenaltyB = b.value.isJokerBomb ? 4000 : b.value.isBomb ? 1500 : 0;
  const splitPenaltyA = a.breaksBomb ? 800 : 0;
  const splitPenaltyB = b.breaksBomb ? 800 : 0;
  const scoreA =
    bombPenaltyA +
    splitPenaltyA +
    a.pointCost * 60 +
    a.value.mainRankValue * 12 +
    a.value.length * 8 +
    a.maxCardStrength;
  const scoreB =
    bombPenaltyB +
    splitPenaltyB +
    b.pointCost * 60 +
    b.value.mainRankValue * 12 +
    b.value.length * 8 +
    b.maxCardStrength;
  return scoreA - scoreB;
}

function chooseBotDecision(room: RoomState, botUid: string): BotDecision {
  const player = getPlayerByUid(room, botUid);
  if (!player) {
    throw new HttpsError("failed-precondition", "Bot 不在当前房间。");
  }

  if (player.seat !== room.currentTurnSeat) {
    throw new HttpsError("failed-precondition", "还没轮到该 Bot。");
  }

  if (room.trick.lastPlay && room.trick.lastPlay.seat === player.seat) {
    return { type: "pass" };
  }

  const hand = room.hands[botUid] ?? [];
  const candidates = listCandidatePlays(hand);
  if (!room.trick.lastPlay) {
    const choice = candidates.sort(compareLeadCandidates)[0];
    if (!choice) {
      throw new HttpsError("failed-precondition", "Bot 没有可出的合法牌。");
    }
    return { type: "play", cardIds: choice.cardIds };
  }

  const currentValue = analyzePlay(room.trick.lastPlay.cards);
  if (!currentValue) {
    throw new HttpsError("failed-precondition", "上一手牌型异常。");
  }

  const beatingCandidates = candidates
    .filter((candidate) =>
      canBeatPlay(candidate.value, currentValue, candidate.cards, room.trick.lastPlay?.cards)
    )
    .sort(compareFollowCandidates);

  if (beatingCandidates.length === 0) {
    return { type: "pass" };
  }

  return { type: "play", cardIds: beatingCandidates[0].cardIds };
}

function playCardsForPlayer(room: RoomState, uid: string, cardIds: string[]): RoomState {
  if (room.status !== "playing") {
    throw new HttpsError("failed-precondition", "房间未处于对局中。");
  }

  const player = getPlayerByUid(room, uid);
  if (!player) {
    throw new HttpsError("permission-denied", "你不在该房间。");
  }
  if (player.seat !== room.currentTurnSeat) {
    throw new HttpsError("failed-precondition", "还没轮到你出牌。");
  }

  const hand = room.hands[uid] ?? [];
  const { newHand, removed } = removeCardsFromHand(hand, cardIds);
  const playValue = analyzePlay(removed);
  if (!playValue) {
    throw new HttpsError("invalid-argument", "出牌不符合规则牌型。");
  }

  if (room.trick.lastPlay) {
    const isLeaderBack = Number(room.trick.lastPlay.seat) === Number(player.seat);
    if (!isLeaderBack) {
      const lastValue = analyzePlay(room.trick.lastPlay.cards);
      if (!lastValue) {
        throw new HttpsError("failed-precondition", "上一手牌型异常。");
      }
      if (!canBeatPlay(playValue, lastValue, removed, room.trick.lastPlay.cards)) {
        throw new HttpsError("failed-precondition", "你的牌不能压过上一手。");
      }
    }
  }

  const existingPlays = room.trick.plays ?? [];
  let updatedRoom: RoomState = {
    ...room,
    hands: {
      ...room.hands,
      [uid]: newHand,
    },
    trick: {
      ...room.trick,
      lastPlay: { seat: player.seat, cards: removed },
      passes: 0,
      pile: [...room.trick.pile, ...removed],
      plays: [...existingPlays, { seat: player.seat, cards: removed, type: "play" as const }],
    },
    currentTurnSeat: nextSeat(player.seat, room.players.length),
    updatedAt: Date.now(),
  };

  const anyHandEmpty = updatedRoom.players.some(
    (candidate) => (updatedRoom.hands[candidate.uid] ?? []).length === 0
  );
  const deckEmpty = updatedRoom.deck.length === 0;
  if (anyHandEmpty && deckEmpty) {
    updatedRoom = settleGame(updatedRoom);
  }

  return updatedRoom;
}

function passTurnForPlayer(room: RoomState, uid: string): RoomState {
  if (room.status !== "playing") {
    throw new HttpsError("failed-precondition", "房间未处于对局中。");
  }

  const player = getPlayerByUid(room, uid);
  if (!player) {
    throw new HttpsError("permission-denied", "你不在该房间。");
  }
  if (player.seat !== room.currentTurnSeat) {
    throw new HttpsError("failed-precondition", "还没轮到你操作。");
  }
  if (!room.trick.lastPlay) {
    throw new HttpsError("failed-precondition", "先手不能 Pass。");
  }

  const nextPasses = room.trick.passes + 1;
  const existingPlays = room.trick.plays ?? [];
  let nextRoom: RoomState = {
    ...room,
    trick: {
      ...room.trick,
      passes: nextPasses,
      plays: [...existingPlays, { seat: player.seat, cards: [], type: "pass" as const }],
    },
    currentTurnSeat: nextSeat(player.seat, room.players.length),
    updatedAt: Date.now(),
  };

  if (nextPasses >= room.players.length) {
    const winnerSeat = room.trick.lastPlay.seat;
    const trickPoints = sumPoints(room.trick.pile);
    const updatedPlayers = room.players.map((candidate) =>
      candidate.seat === winnerSeat ? { ...candidate, score: candidate.score + trickPoints } : candidate
    );

    let nextHands = nextRoom.hands;
    let nextDeck = nextRoom.deck;
    const trickResult = {
      winnerSeat,
      points: trickPoints,
      pile: room.trick.pile,
      timestamp: Date.now(),
    };

    if (nextDeck.length > 0) {
      const refill = refillHandsIfNeeded(nextHands, nextDeck, updatedPlayers, winnerSeat, 5);
      nextHands = refill.hands;
      nextDeck = refill.deck;
    }

    nextRoom = {
      ...nextRoom,
      players: updatedPlayers,
      hands: nextHands,
      deck: nextDeck,
      trick: {
        leaderSeat: winnerSeat,
        lastPlay: null,
        passes: 0,
        pile: [],
      },
      currentTurnSeat: winnerSeat,
      lastTrickResult: trickResult,
    };
  }

  const anyHandEmpty = nextRoom.players.some(
    (candidate) => (nextRoom.hands[candidate.uid] ?? []).length === 0
  );
  const deckEmptyAndAllPassed = nextRoom.deck.length === 0 && nextPasses >= room.players.length;
  if (anyHandEmpty || deckEmptyAndAllPassed) {
    nextRoom = settleGame(nextRoom);
  }

  return nextRoom;
}

async function processBotTurns(roomId: string): Promise<void> {
  const roomRef = db.collection(ROOMS_COLLECTION).doc(roomId);

  for (let step = 0; step < 24; step += 1) {
    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(roomRef);
      if (!snap.exists) {
        return { done: true, endedRoom: null as RoomState | null };
      }

      const room = snap.data() as RoomState;
      if (room.status !== "playing") {
        return { done: true, endedRoom: null as RoomState | null };
      }

      const currentPlayer = getTurnPlayer(room);
      if (!currentPlayer?.isBot) {
        return { done: true, endedRoom: null as RoomState | null };
      }

      const turnKey = getBotTurnKey(room);
      if (room.botState?.lastProcessedTurnKey === turnKey) {
        return { done: true, endedRoom: null as RoomState | null };
      }

      const decision = chooseBotDecision(room, currentPlayer.uid);
      const nextRoom = decision.type === "pass"
        ? passTurnForPlayer(room, currentPlayer.uid)
        : playCardsForPlayer(room, currentPlayer.uid, decision.cardIds);

      tx.set(roomRef, {
        ...nextRoom,
        botState: {
          lastProcessedTurnKey: turnKey,
        },
      }, { merge: true });

      const nextTurnPlayer = getTurnPlayer(nextRoom);
      return {
        done: nextRoom.status !== "playing" || !nextTurnPlayer?.isBot,
        endedRoom: nextRoom.status === "ended" ? nextRoom : null,
      };
    });

    if (result.endedRoom) {
      await updateUserScores(result.endedRoom);
    }
    if (result.done) {
      return;
    }
  }
}

export const createRoom = onCall(async (request) => {
  const uid = requireAuth(request);
  const maxPlayers = Number(request.data?.maxPlayers ?? 2);
  if (Number.isNaN(maxPlayers) || maxPlayers < 2 || maxPlayers > 4) {
    throw new HttpsError("invalid-argument", "maxPlayers 需要是 2-4。");
  }

  let roomId = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateRoomId();
    const existing = await db.collection(ROOMS_COLLECTION).doc(candidate).get();
    if (!existing.exists) {
      roomId = candidate;
      break;
    }
  }
  if (!roomId) {
    throw new HttpsError("unavailable", "无法生成房间号，请重试。");
  }

  const now = Date.now();
  const roomRef = db.collection(ROOMS_COLLECTION).doc(roomId);
  const displayName = await getUserDisplayName(uid) || request.auth?.token?.name;
  const host: Player = {
    uid,
    seat: 0,
    score: 0,
    ...(displayName ? { displayName } : {})
  };

  const room: RoomState = {
    roomId,
    status: "lobby",
    maxPlayers,
    createdAt: now,
    updatedAt: now,
    players: [host],
    currentTurnSeat: 0,
    trick: {
      leaderSeat: 0,
      lastPlay: null,
      passes: 0,
      pile: []
    },
    deck: [],
    hands: {},
    discards: [],
    botState: {
      lastProcessedTurnKey: null,
    },
  };

  await roomRef.set(room);

  return { roomId };
});

export const joinRoom = onCall(async (request) => {
  const uid = requireAuth(request);
  const roomId = String(request.data?.roomId ?? "");
  if (!roomId) {
    throw new HttpsError("invalid-argument", "缺少 roomId。");
  }

  const roomRef = db.collection(ROOMS_COLLECTION).doc(roomId);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(roomRef);
    if (!snap.exists) {
      throw new HttpsError("not-found", "房间不存在。");
    }
    const room = snap.data() as RoomState;
    if (room.status !== "lobby") {
      throw new HttpsError("failed-precondition", "房间已开始。");
    }

    const existing = room.players.find((player) => player.uid === uid);
    if (existing) {
      return { roomId, seat: existing.seat };
    }

    if (room.players.length >= room.maxPlayers) {
      throw new HttpsError("failed-precondition", "房间已满。");
    }

    const seat = pickNextSeat(room.players, room.maxPlayers);
    const displayName = await getUserDisplayName(uid) || request.auth?.token?.name;
    const updatedPlayers = [
      ...room.players,
      {
        uid,
        seat,
        score: 0,
        ...(displayName ? { displayName } : {})
      }
    ];

    tx.update(roomRef, {
      players: updatedPlayers,
      updatedAt: Date.now()
    });

    return { roomId, seat };
  });
});

export const addBotToRoom = onCall(async (request) => {
  const uid = requireAuth(request);
  const roomId = String(request.data?.roomId ?? "");
  if (!roomId) {
    throw new HttpsError("invalid-argument", "缺少 roomId。");
  }

  const roomRef = db.collection(ROOMS_COLLECTION).doc(roomId);

  try {
    return await db.runTransaction(async (tx) => {
      const snap = await tx.get(roomRef);
      if (!snap.exists) {
        throw new HttpsError("not-found", "房间不存在。");
      }

      const room = snap.data() as RoomState;
      if (!room.status || !Array.isArray(room.players)) {
        throw new HttpsError("failed-precondition", "房间数据异常，无法添加 Bot。");
      }
      if (room.status !== "lobby") {
        throw new HttpsError("failed-precondition", "只有等待中的房间才能添加 Bot。");
      }

      const host = room.players.find((player) => player.seat === 0);
      if (host?.uid !== uid) {
        throw new HttpsError("permission-denied", "只有房主可以添加 Bot。");
      }

      if (room.players.length >= room.maxPlayers) {
        throw new HttpsError("failed-precondition", "房间已满。");
      }

      const seat = pickNextSeat(room.players, room.maxPlayers);
      const botNumber = room.players.filter((player) => player.isBot).length + 1;
      const botPlayer: Player = {
        uid: `bot-${roomId}-${seat}`,
        seat,
        score: 0,
        displayName: `Bot ${botNumber}`,
        isBot: true,
      };
      const updatedPlayers = [...room.players, botPlayer];

      tx.update(roomRef, {
        players: updatedPlayers,
        updatedAt: Date.now(),
      });

      return {
        roomId,
        seat,
        botCount: updatedPlayers.filter((player) => player.isBot).length,
      };
    });
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    console.error(`addBotToRoom failed for room ${roomId}:`, error);
    throw new HttpsError("internal", "添加 Bot 失败，请稍后重试。");
  }
});

export const startGame = onCall(async (request) => {
  const uid = requireAuth(request);
  const roomId = String(request.data?.roomId ?? "");
  if (!roomId) {
    throw new HttpsError("invalid-argument", "缺少 roomId。");
  }

  const roomRef = db.collection(ROOMS_COLLECTION).doc(roomId);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(roomRef);
    if (!snap.exists) {
      throw new HttpsError("not-found", "房间不存在。");
    }
    const room = snap.data() as RoomState;
    if (room.status !== "lobby") {
      throw new HttpsError("failed-precondition", "房间已开始。");
    }
    if (room.players.length < 2) {
      throw new HttpsError("failed-precondition", "至少 2 人才能开始。");
    }
    const host = room.players.find((player) => player.seat === 0);
    if (host?.uid !== uid) {
      throw new HttpsError("permission-denied", "只有房主可以开始。");
    }

    const shuffled = shuffle(createDeck());
    const { hands, remainingDeck } = dealHands(
      shuffled,
      room.players,
      5
    );

    // 找到持有最小牌的玩家先出
    const firstSeat = findSmallestCardSeat(hands, room.players);

    const updatedRoom: RoomState = {
      ...room,
      status: "playing",
      deck: remainingDeck,
      hands,
      currentTurnSeat: firstSeat,
      trick: {
        leaderSeat: firstSeat,
        lastPlay: null,
        passes: 0,
        pile: []
      },
      botState: {
        lastProcessedTurnKey: null,
      },
      updatedAt: Date.now()
    };

    tx.set(roomRef, updatedRoom, { merge: true });

    return { roomId };
  });
});

export const playCards = onCall(async (request) => {
  const uid = requireAuth(request);
  const roomId = String(request.data?.roomId ?? "");
  const cardIds = request.data?.cardIds as string[] | undefined;
  if (!roomId || !Array.isArray(cardIds) || cardIds.length === 0) {
    throw new HttpsError("invalid-argument", "需要 roomId 与 cardIds。");
  }

  const roomRef = db.collection(ROOMS_COLLECTION).doc(roomId);

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(roomRef);
    if (!snap.exists) {
      throw new HttpsError("not-found", "房间不存在。");
    }
    const room = snap.data() as RoomState;
    const updatedRoom = playCardsForPlayer(room, uid, cardIds);

    tx.set(roomRef, updatedRoom, { merge: true });
    return { roomId, endedRoom: updatedRoom.status === "ended" ? updatedRoom : null as RoomState | null };
  });
  if (result.endedRoom) {
    await updateUserScores(result.endedRoom);
  }
  return { roomId };
});

export const passTurn = onCall(async (request) => {
  const uid = requireAuth(request);
  const roomId = String(request.data?.roomId ?? "");
  if (!roomId) {
    throw new HttpsError("invalid-argument", "缺少 roomId。");
  }

  const roomRef = db.collection(ROOMS_COLLECTION).doc(roomId);

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(roomRef);
    if (!snap.exists) {
      throw new HttpsError("not-found", "房间不存在。");
    }
    const room = snap.data() as RoomState;
    const nextRoom = passTurnForPlayer(room, uid);

    tx.set(roomRef, nextRoom, { merge: true });
    return { roomId, endedRoom: nextRoom.status === "ended" ? nextRoom : null as RoomState | null };
  });
  if (result.endedRoom) {
    await updateUserScores(result.endedRoom);
  }
  return { roomId };
});

export const endTrickIfNeeded = onCall(async (request) => {
  const uid = requireAuth(request);
  const roomId = String(request.data?.roomId ?? "");
  if (!roomId) {
    throw new HttpsError("invalid-argument", "缺少 roomId。");
  }

  const roomRef = db.collection(ROOMS_COLLECTION).doc(roomId);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(roomRef);
    if (!snap.exists) {
      throw new HttpsError("not-found", "房间不存在。");
    }
    const room = snap.data() as RoomState;
    if (room.status !== "playing") {
      throw new HttpsError("failed-precondition", "房间未处于对局中。");
    }
    const player = room.players.find((p) => p.uid === uid);
    if (!player) {
      throw new HttpsError("permission-denied", "你不在该房间。");
    }
    if (!room.trick.lastPlay) {
      return { roomId, ended: false };
    }

    if (room.trick.passes < room.players.length) {
      return { roomId, ended: false };
    }

    const winnerSeat = room.trick.lastPlay.seat;
    const trickPoints = sumPoints(room.trick.pile);
    const updatedPlayers = room.players.map((p) =>
      p.seat === winnerSeat ? { ...p, score: p.score + trickPoints } : p
    );

    let nextHands = room.hands;
    let nextDeck = room.deck;
    if (trickPoints === 0 && nextDeck.length > 0) {
      const refill = refillHandsIfNeeded(
        nextHands,
        nextDeck,
        updatedPlayers,
        winnerSeat,
        5
      );
      nextHands = refill.hands;
      nextDeck = refill.deck;
    }

    const nextRoom: RoomState = {
      ...room,
      players: updatedPlayers,
      hands: nextHands,
      deck: nextDeck,
      trick: {
        leaderSeat: winnerSeat,
        lastPlay: null,
        passes: 0,
        pile: []
      },
      currentTurnSeat: winnerSeat,
      updatedAt: Date.now()
    };

    tx.set(roomRef, nextRoom, { merge: true });
    return { roomId, ended: true };
  });
});

export const autoSettleIfNeeded = onCall(async (request) => {
  const uid = requireAuth(request);
  const roomId = String(request.data?.roomId ?? "");
  if (!roomId) {
    throw new HttpsError("invalid-argument", "缺少 roomId。");
  }

  const roomRef = db.collection(ROOMS_COLLECTION).doc(roomId);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(roomRef);
    if (!snap.exists) {
      throw new HttpsError("not-found", "房间不存在。");
    }
    const room = snap.data() as RoomState;
    if (room.status !== "playing") {
      throw new HttpsError("failed-precondition", "房间未处于对局中。");
    }
    const player = room.players.find((p) => p.uid === uid);
    if (!player) {
      throw new HttpsError("permission-denied", "你不在该房间。");
    }

    if (room.deck.length > 0) {
      return { roomId, settled: false, reason: "deck-not-empty" };
    }

    const allEmpty = room.players.every(
      (p) => (room.hands[p.uid] ?? []).length === 0
    );
    const noProgress =
      room.trick.pile.length === 0 && room.trick.lastPlay === null;
    if (!allEmpty && !noProgress) {
      return { roomId, settled: false, reason: "trick-in-progress" };
    }

    const settledRoom = settleGame(room);
    tx.set(roomRef, settledRoom, { merge: true });

    await updateUserScores(settledRoom);

    return { roomId, settled: true };
  });
});

export const leaveGame = onCall(async (request) => {
  const uid = requireAuth(request);
  const roomId = String(request.data?.roomId ?? "");
  if (!roomId) {
    throw new HttpsError("invalid-argument", "缺少 roomId。");
  }

  const roomRef = db.collection(ROOMS_COLLECTION).doc(roomId);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(roomRef);
    if (!snap.exists) {
      throw new HttpsError("not-found", "房间不存在。");
    }
    const room = snap.data() as RoomState;

    const player = room.players.find((p) => p.uid === uid);
    if (!player) {
      return { roomId, left: true };
    }

    if (room.status !== "playing") {
      const updatedPlayers = room.players.filter((p) => p.uid !== uid);
      if (updatedPlayers.length === 0) {
        tx.delete(roomRef);
      } else {
        tx.update(roomRef, { players: updatedPlayers, updatedAt: Date.now() });
      }
      return { roomId, left: true };
    }

    // Game is active — settle immediately
    const settledRoom = settleGame(room);
    tx.set(roomRef, settledRoom, { merge: true });
    await updateUserScores(settledRoom);
    return { roomId, left: true, settled: true };
  });
});

export const getLeaderboard = onCall(async () => {
  const snap = await db
    .collection(USERS_COLLECTION)
    .orderBy("totalScore", "desc")
    .limit(20)
    .get();

  return snap.docs.map((doc) => ({
    uid: doc.id,
    displayName: doc.data().displayName ?? "???",
    avatar: doc.data().avatar ?? "🎭",
    totalScore: doc.data().totalScore ?? 0,
    gamesWon: doc.data().gamesWon ?? 0,
    gamesPlayed: doc.data().gamesPlayed ?? 0,
  }));
});

export const handleBotTurns = onDocumentUpdated(`${ROOMS_COLLECTION}/{roomId}`, async (event) => {
  const after = event.data?.after.data() as RoomState | undefined;
  if (!after || after.status !== "playing") {
    return;
  }

  const currentPlayer = getTurnPlayer(after);
  if (!currentPlayer?.isBot) {
    return;
  }

  try {
    await processBotTurns(event.params.roomId);
  } catch (error) {
    console.error(`handleBotTurns failed for room ${event.params.roomId}:`, error);
  }
});
