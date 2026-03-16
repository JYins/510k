/**
 * Pattern recognition and validation engine
 * Determines if a set of cards forms a valid play pattern
 */

import { Card, ParsedPlay, PlayPattern } from '../types';
import {
  RANK_VALUES,
  groupByRank,
  isValidForStraight,
  findHighestCard,
  sortCards
} from './cards';

/**
 * Parse and validate a play pattern from selected cards
 * Returns null if invalid pattern
 */
export function parsePlay(cards: Card[]): ParsedPlay | null {
  if (cards.length === 0) return null;

  const sorted = sortCards(cards);
  const byRank = groupByRank(cards);

  // Single card
  if (cards.length === 1) {
    return {
      pattern: 'single',
      cards: sorted,
      primaryValue: cards[0].value,
      isJokerBomb: false
    };
  }

  // Check for joker bomb (both jokers)
  if (cards.length === 2) {
    const hasSmall = cards.some(c => c.rank === 'small');
    const hasBig = cards.some(c => c.rank === 'big');
    if (hasSmall && hasBig) {
      return {
        pattern: 'joker-bomb',
        cards: sorted,
        primaryValue: RANK_VALUES['big'],
        isJokerBomb: true
      };
    }
  }

  // Pair
  if (cards.length === 2) {
    if (sameRank(cards[0], cards[1])) {
      return {
        pattern: 'pair',
        cards: sorted,
        primaryValue: cards[0].value,
        isJokerBomb: false
      };
    }
    return null;
  }

  // Three of a kind checks
  if (cards.length === 3) {
    // Triplet
    if (byRank.size === 1) {
      return {
        pattern: 'triplet',
        cards: sorted,
        primaryValue: cards[0].value,
        isJokerBomb: false
      };
    }
    return null;
  }

  // Four cards
  if (cards.length === 4) {
    // Bomb (four of a kind)
    if (byRank.size === 1) {
      return {
        pattern: 'bomb',
        cards: sorted,
        primaryValue: cards[0].value,
        isJokerBomb: false
      };
    }
    return null;
  }

  // Four cards: triplet + single
  if (cards.length === 4) {
    const counts = Array.from(byRank.values()).map(c => c.length).sort((a, b) => b - a);
    if (counts[0] === 3 && counts[1] === 1) {
      const tripletRank = Array.from(byRank.entries()).find(([_, cs]) => cs.length === 3)![0];
      const kickerRank = Array.from(byRank.entries()).find(([_, cs]) => cs.length === 1)![0];
      return {
        pattern: 'triplet+single',
        cards: sorted,
        primaryValue: RANK_VALUES[tripletRank],
        kickerValue: RANK_VALUES[kickerRank],
        isJokerBomb: false
      };
    }
  }

  // Five cards: triplet + pair
  if (cards.length === 5) {
    const counts = Array.from(byRank.values()).map(c => c.length).sort((a, b) => b - a);
    if (counts[0] === 3 && counts[1] === 2) {
      const tripletRank = Array.from(byRank.entries()).find(([_, cs]) => cs.length === 3)![0];
      const pairRank = Array.from(byRank.entries()).find(([_, cs]) => cs.length === 2)![0];
      return {
        pattern: 'triplet+pair',
        cards: sorted,
        primaryValue: RANK_VALUES[tripletRank],
        kickerValue: RANK_VALUES[pairRank],
        isJokerBomb: false
      };
    }
  }

  // Straight (5+ consecutive single cards)
  if (cards.length >= 5) {
    const straight = parseStraight(cards);
    if (straight) return straight;
  }

  // Consecutive pairs (3+ consecutive pairs)
  if (cards.length >= 6 && cards.length % 2 === 0) {
    const consecutivePairs = parseConsecutivePairs(cards);
    if (consecutivePairs) return consecutivePairs;
  }

  // Airplane (2+ consecutive triplets)
  if (cards.length >= 6 && cards.length % 3 === 0) {
    const airplane = parseAirplane(cards);
    if (airplane) return airplane;
  }

  return null;
}

/**
 * Parse straight pattern (5+ consecutive ranks)
 */
function parseStraight(cards: Card[]): ParsedPlay | null {
  // All cards must be valid for straights (no 2, 3, jokers)
  if (!cards.every(isValidForStraight)) return null;

  // Must all be different ranks
  const ranks = new Set(cards.map(c => c.value));
  if (ranks.size !== cards.length) return null;

  // Sort by value and check consecutive
  const sorted = [...cards].sort((a, b) => a.value - b.value);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].value !== sorted[i - 1].value + 1) {
      return null;
    }
  }

  return {
    pattern: 'straight',
    cards: sortCards(cards),
    primaryValue: sorted[sorted.length - 1].value,
    length: cards.length,
    isJokerBomb: false
  };
}

/**
 * Parse consecutive pairs (3+ consecutive ranks, each as pair)
 * Example: 4-4-5-5-6-6
 */
function parseConsecutivePairs(cards: Card[]): ParsedPlay | null {
  const byRank = groupByRank(cards);

  // Each rank must appear exactly twice
  for (const [_rank, cs] of byRank) {
    if (cs.length !== 2) return null;
    // No 2, 3, or jokers allowed
    if (!isValidForStraight(cs[0])) return null;
  }

  // Must have 3+ pairs
  if (byRank.size < 3) return null;

  // Check consecutive ranks
  const rankValues = Array.from(byRank.keys())
    .map(r => RANK_VALUES[r])
    .sort((a, b) => a - b);

  for (let i = 1; i < rankValues.length; i++) {
    if (rankValues[i] !== rankValues[i - 1] + 1) {
      return null;
    }
  }

  return {
    pattern: 'consecutive-pairs',
    cards: sortCards(cards),
    primaryValue: rankValues[rankValues.length - 1],
    length: byRank.size,
    isJokerBomb: false
  };
}

/**
 * Parse airplane (2+ consecutive triplets)
 * Example: 4-4-4-5-5-5
 */
function parseAirplane(cards: Card[]): ParsedPlay | null {
  const byRank = groupByRank(cards);

  // Each rank must appear exactly 3 times
  for (const [_rank, cs] of byRank) {
    if (cs.length !== 3) return null;
    // No 2, 3, or jokers allowed
    if (!isValidForStraight(cs[0])) return null;
  }

  // Must have 2+ triplets
  if (byRank.size < 2) return null;

  // Check consecutive ranks
  const rankValues = Array.from(byRank.keys())
    .map(r => RANK_VALUES[r])
    .sort((a, b) => a - b);

  for (let i = 1; i < rankValues.length; i++) {
    if (rankValues[i] !== rankValues[i - 1] + 1) {
      return null;
    }
  }

  return {
    pattern: 'airplane',
    cards: sortCards(cards),
    primaryValue: rankValues[rankValues.length - 1],
    length: byRank.size,
    isJokerBomb: false
  };
}

/**
 * Check if two cards have the same rank
 */
function sameRank(a: Card, b: Card): boolean {
  return a.rank === b.rank;
}

/**
 * Check if a play can beat another play
 * Rules:
 * 1. Must be same pattern type (unless bomb)
 * 2. Same length (for straights/consecutive/airplane)
 * 3. Higher primary value
 * 4. Bombs beat non-bombs
 * 5. Joker bomb beats regular bomb
 */
export function canBeat(play: ParsedPlay, current: ParsedPlay): boolean {
  // Joker bomb is highest
  if (current.isJokerBomb) return false;
  if (play.isJokerBomb) return true;

  // Regular bomb beats non-bomb
  if (current.pattern === 'bomb') {
    return play.pattern === 'bomb' && play.primaryValue > current.primaryValue;
  }
  if (play.pattern === 'bomb') return true;

  // Must be same pattern
  if (play.pattern !== current.pattern) return false;

  // Must be same length for variable-length patterns
  if (play.length !== undefined && play.length !== current.length) {
    return false;
  }

  // Higher primary value wins
  if (play.primaryValue > current.primaryValue) return true;
  if (play.primaryValue < current.primaryValue) return false;

  // Same primary value - compare by suit of highest card
  const playHigh = findHighestCard(play.cards);
  const currentHigh = findHighestCard(current.cards);

  // Higher suit wins (spade > heart > club > diamond)
  const SUIT_ORDER = { 'spade': 4, 'heart': 3, 'club': 2, 'diamond': 1, 'joker': 0 };
  return SUIT_ORDER[playHigh.suit] > SUIT_ORDER[currentHigh.suit];
}

/**
 * Check if a pattern type can be played as first move of trick
 */
export function isValidLeadPattern(pattern: PlayPattern): boolean {
  // All patterns are valid to lead
  return true;
}

/**
 * Get a human-readable description of a play
 */
export function describePlay(play: ParsedPlay): string {
  const patternNames: Record<PlayPattern, string> = {
    'single': 'Single',
    'pair': 'Pair',
    'triplet': 'Triplet',
    'triplet+single': 'Triplet with Single',
    'triplet+pair': 'Triplet with Pair',
    'straight': `Straight (${play.length} cards)`,
    'consecutive-pairs': `Consecutive Pairs (${play.length} pairs)`,
    'airplane': `Airplane (${play.length} triplets)`,
    'bomb': 'Bomb',
    'joker-bomb': 'Joker Bomb'
  };
  return patternNames[play.pattern] || play.pattern;
}
