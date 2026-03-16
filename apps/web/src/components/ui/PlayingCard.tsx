"use client";

import { motion } from "framer-motion";
import { Card, Suit } from "@/types/game";
import { getSuitSymbol, isRedCard, getRankDisplay } from "@/mocks/gameData";

interface PlayingCardProps {
  card: Card;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  faceDown?: boolean;
  className?: string;
  index?: number;
}

const SPRING = { type: "spring" as const, stiffness: 350, damping: 28 };

const SIZES = {
  sm: { w: 48, h: 66, rank: "text-[16px]", suit: "text-[12px]", pad: "p-[5px]", radius: "rounded-lg" },
  md: { w: 56, h: 76, rank: "text-[20px]", suit: "text-[14px]", pad: "p-[6px]", radius: "rounded-xl" },
  lg: { w: 64, h: 88, rank: "text-[24px]", suit: "text-[16px]", pad: "p-[8px]", radius: "rounded-xl" },
};

export function PlayingCard({
  card,
  selected = false,
  disabled = false,
  onClick,
  size = "md",
  faceDown = false,
  className = "",
  index = 0,
}: PlayingCardProps) {
  const s = SIZES[size];
  const isRed = isRedCard(card.suit);
  const isJoker = card.rank === "SJ" || card.rank === "BJ";

  if (faceDown) {
    return (
      <motion.div
        className={`relative select-none ${s.radius} overflow-hidden ${className}`}
        style={{
          width: s.w,
          height: s.h,
          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        }}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...SPRING, delay: index * 0.04 }}
      >
        <div
          className="absolute inset-0 bg-white"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              #d4d4d8 0px,
              #d4d4d8 1px,
              transparent 1px,
              transparent 6px
            )`,
          }}
        />
      </motion.div>
    );
  }

  const color = isJoker
    ? (card.rank === "BJ" ? "#dc2626" : "#1d4ed8")
    : isRed ? "#dc2626" : "#18181b";

  return (
    <motion.div
      className={`
        relative select-none ${s.radius} bg-white overflow-hidden
        ${!disabled ? "cursor-pointer" : ""}
        ${selected ? "ring-2 ring-blue-500 ring-offset-1 ring-offset-black" : ""}
        ${className}
      `}
      style={{
        width: s.w,
        height: s.h,
        boxShadow: selected
          ? "0 4px 16px rgba(59,130,246,0.3), 0 2px 6px rgba(0,0,0,0.15)"
          : "0 2px 8px rgba(0,0,0,0.12)",
      }}
      onClick={!disabled ? onClick : undefined}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={!disabled ? { scale: 0.95 } : undefined}
      transition={{ ...SPRING, delay: index * 0.03 }}
    >
      {isJoker ? (
        <div className={`${s.pad} flex flex-col`}>
          <span className={`${s.rank} font-bold leading-none`} style={{ color }}>
            {card.rank === "BJ" ? "B" : "S"}
          </span>
          <span className={`${s.suit} leading-none mt-0.5`} style={{ color }}>
            {card.rank === "BJ" ? "★" : "☆"}
          </span>
        </div>
      ) : (
        <div className={`${s.pad} flex flex-col`}>
          <span className={`${s.rank} font-bold leading-none`} style={{ color }}>
            {getRankDisplay(card.rank)}
          </span>
          <span className={`${s.suit} leading-none mt-0.5`} style={{ color }}>
            {getSuitSymbol(card.suit)}
          </span>
        </div>
      )}
    </motion.div>
  );
}

export function CardBack({
  size = "md",
  className = "",
  index = 0,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
  index?: number;
}) {
  const s = SIZES[size];
  return (
    <motion.div
      className={`relative select-none ${s.radius} overflow-hidden ${className}`}
      style={{
        width: s.w,
        height: s.h,
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
      }}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ...SPRING, delay: index * 0.04 }}
    >
      <div
        className="absolute inset-0 bg-white"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            #d4d4d8 0px,
            #d4d4d8 1px,
            transparent 1px,
            transparent 6px
          )`,
        }}
      />
    </motion.div>
  );
}
