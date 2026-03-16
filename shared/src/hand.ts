import { Card, Rank } from "./types";
import { RANK_VALUE } from "./cards";

export type PlayType =
  | "single"
  | "pair"
  | "triple"
  | "triple_with_single"
  | "triple_with_pair"
  | "straight"
  | "bomb"
  | "joker_bomb";

export interface PlayValue {
  type: PlayType;
  length: number;
  mainRank: Rank;
  mainRankValue: number;
  isBomb: boolean;
  isJokerBomb: boolean;
}

const INVALID_SEQUENCE_RANKS = new Set<Rank>(["2", "3", "SJ", "BJ"]);

function getRankValue(rank: Rank): number {
  return RANK_VALUE[rank];
}

function rankCounts(cards: Card[]): Map<Rank, number> {
  const counts = new Map<Rank, number>();
  for (const card of cards) {
    counts.set(card.rank, (counts.get(card.rank) ?? 0) + 1);
  }
  return counts;
}

function sortedRanks(counts: Map<Rank, number>): Rank[] {
  return Array.from(counts.keys()).sort(
    (a, b) => getRankValue(a) - getRankValue(b)
  );
}

function isConsecutiveRanks(ranks: Rank[]): boolean {
  for (let i = 1; i < ranks.length; i += 1) {
    const prev = getRankValue(ranks[i - 1]);
    const current = getRankValue(ranks[i]);
    if (current !== prev + 1) {
      return false;
    }
  }
  return true;
}

function isSequenceAllowed(ranks: Rank[]): boolean {
  return ranks.every((rank) => !INVALID_SEQUENCE_RANKS.has(rank));
}

export function analyzePlay(cards: Card[]): PlayValue | null {
  if (cards.length === 0) {
    return null;
  }

  if (
    cards.length === 2 &&
    cards.some((card) => card.rank === "SJ") &&
    cards.some((card) => card.rank === "BJ")
  ) {
    return {
      type: "joker_bomb",
      length: 2,
      mainRank: "BJ",
      mainRankValue: getRankValue("BJ"),
      isBomb: true,
      isJokerBomb: true
    };
  }

  const counts = rankCounts(cards);
  const ranks = sortedRanks(counts);
  const countValues = Array.from(counts.values()).sort((a, b) => b - a);
  const total = cards.length;

  if (counts.size === 1) {
    const rank = ranks[0];
    if (total === 1) {
      return {
        type: "single",
        length: 1,
        mainRank: rank,
        mainRankValue: getRankValue(rank),
        isBomb: false,
        isJokerBomb: false
      };
    }
    if (total === 2) {
      return {
        type: "pair",
        length: 2,
        mainRank: rank,
        mainRankValue: getRankValue(rank),
        isBomb: false,
        isJokerBomb: false
      };
    }
    if (total === 3) {
      return {
        type: "triple",
        length: 3,
        mainRank: rank,
        mainRankValue: getRankValue(rank),
        isBomb: false,
        isJokerBomb: false
      };
    }
    if (total === 4) {
      return {
        type: "bomb",
        length: 4,
        mainRank: rank,
        mainRankValue: getRankValue(rank),
        isBomb: true,
        isJokerBomb: false
      };
    }
  }

  if (total === 4 && counts.size === 2 && countValues[0] === 3) {
    const mainRank = ranks.find((rank) => counts.get(rank) === 3) as Rank;
    return {
      type: "triple_with_single",
      length: 4,
      mainRank,
      mainRankValue: getRankValue(mainRank),
      isBomb: false,
      isJokerBomb: false
    };
  }

  if (total === 5 && counts.size === 2 && countValues[0] === 3) {
    const mainRank = ranks.find((rank) => counts.get(rank) === 3) as Rank;
    return {
      type: "triple_with_pair",
      length: 5,
      mainRank,
      mainRankValue: getRankValue(mainRank),
      isBomb: false,
      isJokerBomb: false
    };
  }

  if (total >= 5 && counts.size === total) {
    if (isSequenceAllowed(ranks) && isConsecutiveRanks(ranks)) {
      const maxRank = ranks[ranks.length - 1];
      return {
        type: "straight",
        length: total,
        mainRank: maxRank,
        mainRankValue: getRankValue(maxRank),
        isBomb: false,
        isJokerBomb: false
      };
    }
  }

  // 手牌上限为 5 张，因此不支持连对与飞机系列牌型。

  return null;
}

export function canBeatPlay(
  challenger: PlayValue,
  current: PlayValue
): boolean {
  if (challenger.isJokerBomb) {
    return true;
  }
  if (current.isJokerBomb) {
    return false;
  }
  if (challenger.isBomb && !current.isBomb) {
    return true;
  }
  if (!challenger.isBomb && current.isBomb) {
    return false;
  }
  if (challenger.type !== current.type) {
    return false;
  }
  if (challenger.length !== current.length) {
    return false;
  }
  return challenger.mainRankValue > current.mainRankValue;
}
