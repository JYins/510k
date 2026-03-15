"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/types/game";
import { PlayingCard } from "@/components/ui/PlayingCard";

interface CardGroupProps {
  cards: Card[];
  selectedCards: string[];
  onToggleCard: (cardId: string) => void;
  isMyTurn: boolean;
  maxWidth?: number;
}

export function CardGroup({
  cards,
  selectedCards,
  onToggleCard,
  isMyTurn,
  maxWidth = 380,
}: CardGroupProps) {
  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center h-28">
        <span className="text-text-tertiary text-sm">等待发牌...</span>
      </div>
    );
  }

  // Calculate fan overlap
  const cardWidth = 56; // w-14 = 3.5rem = 56px
  const overlap = cards.length > 1
    ? Math.min((maxWidth - cardWidth) / (cards.length - 1), cardWidth * 0.65)
    : 0;
  const totalWidth = cardWidth + (cards.length - 1) * overlap;

  return (
    <div className="relative w-full" style={{ height: "100px" }}>
      <div
        className="absolute left-1/2 flex"
        style={{ transform: `translateX(-${totalWidth / 2}px)` }}
      >
        <AnimatePresence mode="popLayout">
          {cards.map((card, index) => {
            const isSelected = selectedCards.includes(card.id);
            const offset = index * overlap;

            return (
              <motion.div
                key={card.id}
                className="absolute"
                style={{
                  left: offset,
                  zIndex: isSelected ? 50 + index : index,
                }}
                initial={{ opacity: 0, y: 50, rotateZ: -5 }}
                animate={{
                  opacity: 1,
                  y: isSelected ? -20 : 0,
                  rotateZ: 0,
                  scale: isSelected ? 1.05 : 1,
                }}
                exit={{ opacity: 0, y: 30, scale: 0.9 }}
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 25,
                  delay: index * 0.02,
                }}
                whileHover={isMyTurn ? { y: -10 } : undefined}
                onClick={() => isMyTurn && onToggleCard(card.id)}
              >
                <PlayingCard
                  card={card}
                  selected={isSelected}
                  size="md"
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Selection hint */}
      <AnimatePresence>
        {isMyTurn && selectedCards.length > 0 && (
          <motion.div
            className="absolute -top-2 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <span className="px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-medium border border-accent/30">
              已选 {selectedCards.length} 张牌
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Horizontal scroll version for mobile
export function CardGroupScroll({
  cards,
  selectedCards,
  onToggleCard,
  isMyTurn,
}: CardGroupProps) {
  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-text-tertiary text-sm">等待发牌...</span>
      </div>
    );
  }

  return (
    <div className="flex gap-1 overflow-x-auto pb-4 px-2 scrollbar-hide">
      <AnimatePresence>
        {cards.map((card, index) => {
          const isSelected = selectedCards.includes(card.id);

          return (
            <motion.div
              key={card.id}
              className="flex-shrink-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{
                opacity: 1,
                x: 0,
                y: isSelected ? -12 : 0,
                scale: isSelected ? 1.05 : 1,
              }}
              exit={{ opacity: 0, x: -20 }}
              transition={{
                type: "spring",
                stiffness: 350,
                damping: 25,
                delay: index * 0.03,
              }}
              onClick={() => isMyTurn && onToggleCard(card.id)}
            >
              <PlayingCard
                card={card}
                selected={isSelected}
                size="sm"
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
