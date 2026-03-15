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
}

const SIZE_CONFIG = {
  sm: {
    width: "w-10",
    height: "h-14",
    fontSize: "text-sm",
    suitSize: "text-xs",
    cornerPadding: "p-1",
    radius: "rounded-lg",
  },
  md: {
    width: "w-14",
    height: "h-20",
    fontSize: "text-lg",
    suitSize: "text-sm",
    cornerPadding: "p-1.5",
    radius: "rounded-xl",
  },
  lg: {
    width: "w-20",
    height: "h-28",
    fontSize: "text-2xl",
    suitSize: "text-lg",
    cornerPadding: "p-2",
    radius: "rounded-2xl",
  },
};

export function PlayingCard({
  card,
  selected = false,
  disabled = false,
  onClick,
  size = "md",
  faceDown = false,
  className = "",
}: PlayingCardProps) {
  const config = SIZE_CONFIG[size];
  const isRed = isRedCard(card.suit);
  const isJoker = card.rank === "SJ" || card.rank === "BJ";

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  // Face down card (deck/back)
  if (faceDown) {
    return (
      <motion.div
        className={`
          ${config.width} ${config.height} ${config.radius}
          relative cursor-default select-none
          bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800
          shadow-card border border-white/10
          flex items-center justify-center
          ${className}
        `}
        whileHover={!disabled ? { y: -2 } : undefined}
      >
        {/* Pattern overlay */}
        <div
          className="absolute inset-1 rounded-lg opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 3px,
              rgba(255,255,255,0.1) 3px,
              rgba(255,255,255,0.1) 6px
            )`,
          }}
        />
        {/* Center logo */}
        <div className="relative w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
          <span className="text-[8px] font-bold text-white/60">510K</span>
        </div>
      </motion.div>
    );
  }

  // Card content
  const renderContent = () => {
    if (isJoker) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <span className={`${size === "lg" ? "text-4xl" : size === "md" ? "text-3xl" : "text-2xl"}`}>
            {card.rank === "BJ" ? "🃏" : "🃟"}
          </span>
          <span className={`${config.suitSize} text-text-secondary mt-1 font-medium`}>
            {card.rank === "BJ" ? "大王" : "小王"}
          </span>
        </div>
      );
    }

    return (
      <>
        {/* Top left corner */}
        <div className={`absolute ${config.cornerPadding} top-0 left-0 flex flex-col items-center leading-tight`}>
          <span className={`${config.fontSize} font-bold`}>{getRankDisplay(card.rank)}</span>
          <span className={config.suitSize}>{getSuitSymbol(card.suit)}</span>
        </div>

        {/* Center suit watermark */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`${size === "lg" ? "text-6xl" : size === "md" ? "text-4xl" : "text-3xl"} opacity-10`}
            style={{ color: isRed ? "#FF453A" : "#FFFFFF" }}
          >
            {getSuitSymbol(card.suit)}
          </span>
        </div>

        {/* Bottom right corner (rotated) */}
        <div className={`absolute ${config.cornerPadding} bottom-0 right-0 flex flex-col items-center leading-tight rotate-180`}>
          <span className={`${config.fontSize} font-bold`}>{getRankDisplay(card.rank)}</span>
          <span className={config.suitSize}>{getSuitSymbol(card.suit)}</span>
        </div>
      </>
    );
  };

  return (
    <motion.div
      className={`
        ${config.width} ${config.height} ${config.radius}
        relative cursor-pointer select-none
        transition-all duration-200 ease-out
        ${selected
          ? "bg-surface-hover ring-2 ring-accent shadow-glow -translate-y-3 scale-105 z-10"
          : "bg-surface shadow-card hover:-translate-y-1 hover:shadow-card-hover"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        border border-white/5
        ${className}
      `}
      style={{
        color: isJoker ? "#FFD700" : isRed ? "#FF453A" : "#FFFFFF",
      }}
      onClick={handleClick}
      whileTap={!disabled ? { scale: 0.95 } : undefined}
      initial={{ opacity: 0, y: 20, rotateZ: -3 }}
      animate={{ opacity: 1, y: 0, rotateZ: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {renderContent()}
    </motion.div>
  );
}

// Compact version for table display
export function TableCard({
  card,
  size = "sm",
}: {
  card: Card;
  size?: "sm" | "md";
}) {
  const isRed = isRedCard(card.suit);
  const isJoker = card.rank === "SJ" || card.rank === "BJ";

  const sizes = {
    sm: { width: "w-10", height: "h-14", font: "text-sm" },
    md: { width: "w-12", height: "h-17", font: "text-base" },
  };

  const s = sizes[size];

  return (
    <motion.div
      className={`
        ${s.width} ${s.height}
        rounded-lg relative
        bg-surface shadow-card
        flex flex-col items-center justify-center
        border border-white/5
      `}
      style={{
        color: isJoker ? "#FFD700" : isRed ? "#FF453A" : "#FFFFFF",
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      {isJoker ? (
        <span className="text-2xl">{card.rank === "BJ" ? "🃏" : "🃟"}</span>
      ) : (
        <>
          <span className={`${s.font} font-bold`}>{getRankDisplay(card.rank)}</span>
          <span className="text-xs">{getSuitSymbol(card.suit)}</span>
        </>
      )}
    </motion.div>
  );
}

// Card back with count badge
export function DeckPile({
  count,
  size = "md",
}: {
  count: number;
  size?: "sm" | "md";
}) {
  const sizes = {
    sm: { width: "w-10", height: "h-14" },
    md: { width: "w-14", height: "h-20" },
  };

  const s = sizes[size];

  return (
    <div className="relative">
      <motion.div
        className={`
          ${s.width} ${s.height}
          rounded-xl relative
          bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800
          shadow-card border border-white/10
          flex items-center justify-center
        `}
        whileHover={{ y: -2 }}
      >
        <div
          className="absolute inset-1 rounded-lg opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 3px,
              rgba(255,255,255,0.1) 3px,
              rgba(255,255,255,0.1) 6px
            )`,
          }}
        />
        <span className="text-[10px] font-bold text-white/40">510K</span>
      </motion.div>
      {count > 0 && (
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-white shadow-lg">
          {count}
        </div>
      )}
    </div>
  );
}
