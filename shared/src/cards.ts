import { Card, Rank, Suit } from "./types";

export const SUITS: Suit[] = ["S", "H", "C", "D"];
export const RANKS: Rank[] = [
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
  "2",
  "3",
  "SJ",
  "BJ"
];

export const RANK_VALUE: Record<Rank, number> = {
  "4": 1,
  "5": 2,
  "6": 3,
  "7": 4,
  "8": 5,
  "9": 6,
  "10": 7,
  J: 8,
  Q: 9,
  K: 10,
  A: 11,
  "2": 12,
  "3": 13,
  SJ: 14,
  BJ: 15
};

export const SUIT_VALUE: Record<Suit, number> = {
  S: 4,
  H: 3,
  C: 2,
  D: 1
};

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const rank of RANKS) {
    if (rank === "SJ") {
      deck.push({ id: "SJ", rank: "SJ" });
      continue;
    }
    if (rank === "BJ") {
      deck.push({ id: "BJ", rank: "BJ" });
      continue;
    }
    for (const suit of SUITS) {
      deck.push({ id: `${rank}${suit}`, rank, suit });
    }
  }
  return deck;
}

export function getRankValue(rank: Rank): number {
  return RANK_VALUE[rank];
}

export function getSuitValue(suit: Suit): number {
  return SUIT_VALUE[suit];
}

export function compareCard(a: Card, b: Card): number {
  const rankDiff = getRankValue(a.rank) - getRankValue(b.rank);
  if (rankDiff !== 0) {
    return rankDiff;
  }
  if (!a.suit || !b.suit) {
    return 0;
  }
  return getSuitValue(a.suit) - getSuitValue(b.suit);
}

export function isPointCard(card: Card): boolean {
  return card.rank === "5" || card.rank === "10" || card.rank === "K";
}

export function pointValue(card: Card): number {
  if (card.rank === "5") {
    return 5;
  }
  if (card.rank === "10" || card.rank === "K") {
    return 10;
  }
  return 0;
}

export function maxCard(cards: Card[]): Card | undefined {
  if (cards.length === 0) {
    return undefined;
  }
  return cards.reduce((max, current) =>
    compareCard(current, max) > 0 ? current : max
  );
}
