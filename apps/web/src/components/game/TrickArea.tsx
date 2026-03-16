"use client";

import { motion, AnimatePresence } from "framer-motion";
import { PlayingCard, CardBack } from "@/components/ui/PlayingCard";
import { Trick, Card } from "@/types/game";

interface TrickAreaProps {
  trick: Trick | null;
  deckCount: number;
  totalSlots?: number;
}

const SPRING = { type: "spring" as const, stiffness: 300, damping: 25 };

export function TrickArea({
  trick,
  deckCount,
  totalSlots = 5,
}: TrickAreaProps) {
  const pileCards = trick?.pile || [];
  const points = trick?.points || 0;
  const faceDownCount = Math.max(0, totalSlots - pileCards.length);

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Card row */}
      <div className="flex items-center gap-[6px]">
        <AnimatePresence mode="popLayout">
          {pileCards.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, scale: 0.7, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ ...SPRING, delay: i * 0.06 }}
            >
              <PlayingCard card={card} size="lg" disabled index={i} />
            </motion.div>
          ))}
        </AnimatePresence>

        {Array.from({ length: faceDownCount }).map((_, i) => (
          <CardBack
            key={`back-${i}`}
            size="lg"
            index={pileCards.length + i}
          />
        ))}
      </div>

      {/* Points display */}
      <motion.div
        className="mt-3 self-end mr-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <span className="text-[16px] font-medium text-white/50 tabular-nums">
          {points}
        </span>
      </motion.div>
    </div>
  );
}
