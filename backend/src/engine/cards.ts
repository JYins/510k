/**
 * Card utilities and deck management
 */

import { Card, Suit, Rank } from '../types';

// Rank order mapping for comparison
export const RANK_VALUES: Record<Rank, number> = {
  '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15, '3': 16,
  'small': 17, 'big': 18
};

// Suit order for tie-breaking: spade > heart > club > diamond
export const SUIT_VALUES: Record<Suit, number> = {
  'diamond': 1,
  'club': 2,
  'heart': 3,
  'spade': 4,
  'joker': 5
};

// Point values for scoring
export const POINT_VALUES: Partial<Record<Rank, number>> = {
  '5': 5,
  '10': 10,
  'K': 10
};

/**
 * Create a standard 54-card deck (52 + 2 jokers)
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  const suits: Suit[] = ['diamond', 'club', 'heart', 'spade'];
  const ranks: Rank[] = ['4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', '3'];

  // Standard 52 cards
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({
        suit,
        rank,
        value: RANK_VALUES[rank],
        points: POINT_VALUES[rank] || 0
      });
    }
  }

  // Jokers
  deck.push({
    suit: 'joker',
    rank: 'small',
    value: RANK_VALUES['small'],
    points: 0
  });
  deck.push({
    suit: 'joker',
    rank: 'big',
    value: RANK_VALUES['big'],
    points: 0
  });

  return deck;
}

/**
 * Shuffle deck using Fisher-Yates algorithm
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Calculate total points in a set of cards
 */
export function countPoints(cards: Card[]): number {
  return cards.reduce((sum, card) => sum + card.points, 0);
}

/**
 * Sort cards by value (descending) then suit (descending)
 * Useful for displaying hands
 */
export function sortCards(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    if (a.value !== b.value) {
      return b.value - a.value; // Higher value first
    }
    return SUIT_VALUES[b.suit] - SUIT_VALUES[a.suit]; // Higher suit first
  });
}

/**
 * Check if a card is playable in straights/consecutives
 * (2, 3, and jokers cannot be used)
 */
export function isValidForStraight(card: Card): boolean {
  return card.value >= 4 && card.value <= 14; // 4 through Ace only
}

/**
 * Compare two cards for sorting/ordering
 * Returns: negative if a < b, positive if a > b, 0 if equal
 */
export function compareCards(a: Card, b: Card): number {
  if (a.value !== b.value) {
    return a.value - b.value;
  }
  return SUIT_VALUES[a.suit] - SUIT_VALUES[b.suit];
}

/**
 * Check if two cards have the same rank
 */
export function sameRank(a: Card, b: Card): boolean {
  return a.rank === b.rank;
}

/**
 * Find the highest card in a set (by value, then suit)
 */
export function findHighestCard(cards: Card[]): Card {
  return cards.reduce((highest, card) => {
    if (card.value > highest.value) return card;
    if (card.value === highest.value && SUIT_VALUES[card.suit] > SUIT_VALUES[highest.suit]) {
      return card;
    }
    return highest;
  });
}

/**
 * Group cards by rank
 */
export function groupByRank(cards: Card[]): Map<Rank, Card[]> {
  const groups = new Map<Rank, Card[]>();
  for (const card of cards) {
    const existing = groups.get(card.rank) || [];
    existing.push(card);
    groups.set(card.rank, existing);
  }
  return groups;
}

/**
 * Get all valid card indices from a hand
 */
export function validateCardIndices(hand: Card[], indices: number[]): Card[] {
  if (indices.length === 0) {
    throw new Error('No cards selected');
  }
  if (indices.some(i => i < 0 || i >= hand.length)) {
    throw new Error('Invalid card index');
  }
  if (new Set(indices).size !== indices.length) {
    throw new Error('Duplicate card indices');
  }

  return indices.map(i => hand[i]);
}

/**
 * Remove cards from hand by indices
 * Returns new hand without those cards
 */
export function removeCardsFromHand(hand: Card[], indices: number[]): Card[] {
  const sortedIndices = [...indices].sort((a, b) => b - a); // Descending to remove safely
  const newHand = [...hand];
  for (const idx of sortedIndices) {
    newHand.splice(idx, 1);
  }
  return newHand;
}
