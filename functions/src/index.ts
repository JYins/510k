import * as admin from "firebase-admin";
import { HttpsError, onCall, CallableRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import {
  Card,
  Player,
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

  let winnerUid = room.players[0]?.uid;
  for (const player of room.players) {
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
  const sorted = [...room.players].sort((a, b) => b.score - a.score);
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
    discards: []
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
      const lastValue = analyzePlay(room.trick.lastPlay.cards);
      if (!lastValue) {
        throw new HttpsError("failed-precondition", "上一手牌型异常。");
      }
      if (!canBeatPlay(playValue, lastValue, removed, room.trick.lastPlay.cards)) {
        throw new HttpsError("failed-precondition", "你的牌不能压过上一手。");
      }
    }

    const existingPlays = room.trick.plays ?? [];
    const nextTrick = {
      ...room.trick,
      lastPlay: { seat: player.seat, cards: removed },
      passes: 0,
      pile: [...room.trick.pile, ...removed],
      plays: [...existingPlays, { seat: player.seat, cards: removed, type: "play" as const }]
    };

    let updatedRoom: RoomState = {
      ...room,
      hands: {
        ...room.hands,
        [uid]: newHand
      },
      trick: nextTrick,
      currentTurnSeat: nextSeat(player.seat, room.players.length),
      updatedAt: Date.now()
    };

    const anyHandEmpty = updatedRoom.players.some(
      (p) => (updatedRoom.hands[p.uid] ?? []).length === 0
    );
    if (anyHandEmpty) {
      updatedRoom = settleGame(updatedRoom);
    }

    tx.set(roomRef, updatedRoom, { merge: true });

    if (updatedRoom.status === "ended") {
      await updateUserScores(updatedRoom);
    }

    return { roomId };
  });
});

export const passTurn = onCall(async (request) => {
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
        plays: [...existingPlays, { seat: player.seat, cards: [], type: "pass" as const }]
      },
      currentTurnSeat: nextSeat(player.seat, room.players.length),
      updatedAt: Date.now()
    };

    if (nextPasses >= room.players.length) {
      const winnerSeat = room.trick.lastPlay.seat;
      const trickPoints = sumPoints(room.trick.pile);
      const updatedPlayers = room.players.map((p) =>
        p.seat === winnerSeat ? { ...p, score: p.score + trickPoints } : p
      );

      let nextHands = nextRoom.hands;
      let nextDeck = nextRoom.deck;

      // Record trick result for UI
      const trickResult = {
        winnerSeat,
        points: trickPoints,
        pile: room.trick.pile,
        timestamp: Date.now()
      };

      if (nextDeck.length > 0) {
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

      nextRoom = {
        ...nextRoom,
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
        lastTrickResult: trickResult
      };
    }

    const anyHandEmpty = nextRoom.players.some(
      (p) => (nextRoom.hands[p.uid] ?? []).length === 0
    );
    const deckEmptyAndAllPassed = nextRoom.deck.length === 0 && nextPasses >= room.players.length;
    const shouldEnd = anyHandEmpty || deckEmptyAndAllPassed;
    if (shouldEnd) {
      nextRoom = settleGame(nextRoom);
    }

    tx.set(roomRef, nextRoom, { merge: true });

    if (nextRoom.status === "ended") {
      await updateUserScores(nextRoom);
    }

    return { roomId };
  });
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
