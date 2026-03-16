"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Card, Player } from "@/types/game";
import { PlayingCard } from "@/components/ui/PlayingCard";
import { useLocale } from "@/contexts/LocaleContext";
import type { TranslationKey } from "@/i18n/translations";

// ============================================
// Hand display (fan overlap)
// ============================================

interface CardGroupProps {
  cards: Card[];
  selectedCards: string[];
  onToggleCard: (cardId: string) => void;
  isMyTurn: boolean;
  maxWidth?: number;
}

const SPRING = { type: "spring" as const, stiffness: 350, damping: 25 };

function getPlayTypeKey(type: string): string {
  const map: Record<string, string> = {
    single: "playTypeSingle",
    pair: "playTypePair",
    triple: "playTypeTriple",
    straight: "playTypeStraight",
    bomb: "playTypeBomb",
    pass: "playTypePass",
  };
  return map[type] ?? "selectCards";
}

export function CardGroup({
  cards,
  selectedCards,
  onToggleCard,
  isMyTurn,
  maxWidth = 360,
}: CardGroupProps) {
  const { t } = useLocale();
  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center h-20">
        <span className="text-[13px] text-white/25">{t("waitingForCards")}</span>
      </div>
    );
  }

  const cardW = 48;
  const overlap = cards.length > 1
    ? Math.min((maxWidth - cardW) / (cards.length - 1), cardW * 0.7)
    : 0;
  const totalWidth = cardW + (cards.length - 1) * overlap;

  return (
    <div className="relative w-full" style={{ height: 80 }}>
      <div
        className="absolute left-1/2 flex"
        style={{ transform: `translateX(-${totalWidth / 2}px)` }}
      >
        <AnimatePresence mode="popLayout">
          {cards.map((card, i) => {
            const isSelected = selectedCards.includes(card.id);
            return (
              <motion.div
                key={card.id}
                className="absolute"
                style={{
                  left: i * overlap,
                  zIndex: isSelected ? 50 + i : i,
                }}
                initial={{ opacity: 0, y: 40 }}
                animate={{
                  opacity: 1,
                  y: isSelected ? -14 : 0,
                  scale: isSelected ? 1.04 : 1,
                }}
                exit={{ opacity: 0, y: 30, scale: 0.9 }}
                transition={{ ...SPRING, delay: i * 0.02 }}
                whileHover={isMyTurn ? { y: -6 } : undefined}
                onClick={() => isMyTurn && onToggleCard(card.id)}
              >
                <PlayingCard
                  card={card}
                  selected={isSelected}
                  size="sm"
                  disabled={!isMyTurn}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============================================
// Bottom bar: selected hand preview + info card
// ============================================

interface HandInfoProps {
  selectedCards: Card[];
  playType?: string;
  player: Player;
}

export function HandInfo({ selectedCards, playType, player }: HandInfoProps) {
  const { t } = useLocale();
  if (selectedCards.length === 0) return null;

  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={SPRING}
    >
      {/* Selected cards preview (large) */}
      <div className="flex items-center gap-[3px]">
        {selectedCards.slice(0, 4).map((card, i) => (
          <PlayingCard key={card.id} card={card} size="md" disabled index={i} />
        ))}
        {selectedCards.length > 4 && (
          <span className="text-[12px] text-white/40 ml-1">
            +{selectedCards.length - 4}
          </span>
        )}
      </div>

      {/* Hand type info card */}
      <div
        className="flex flex-col items-center justify-center px-4 py-2 rounded-2xl min-w-[80px]"
        style={{ backgroundColor: "rgba(28,28,30,0.9)" }}
      >
        <span className="text-[11px] text-white/50 font-medium leading-none">
          {playType ? t(getPlayTypeKey(playType) as TranslationKey) : t("selectCards")}
        </span>
        <span className="text-[24px] leading-none mt-1 select-none">{player.emoji}</span>
        <span className="text-[13px] text-white font-semibold leading-none mt-1">
          {player.score}
        </span>
      </div>
    </motion.div>
  );
}
