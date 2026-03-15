"use client";

import { motion } from "framer-motion";
import { Crown, Wifi, WifiOff } from "lucide-react";
import { Player } from "@/types/game";

interface PlayerBadgeProps {
  player: Player;
  isCurrentTurn: boolean;
  isMe: boolean;
  cardCount?: number;
  size?: "sm" | "md" | "lg";
}

export function PlayerBadge({
  player,
  isCurrentTurn,
  isMe,
  cardCount,
  size = "md",
}: PlayerBadgeProps) {
  const sizes = {
    sm: {
      container: "px-2 py-1.5 gap-1.5",
      avatar: "w-7 h-7 text-xs",
      name: "text-xs",
      score: "text-[10px]",
    },
    md: {
      container: "px-3 py-2 gap-2",
      avatar: "w-9 h-9 text-sm",
      name: "text-sm",
      score: "text-xs",
    },
    lg: {
      container: "px-4 py-3 gap-3",
      avatar: "w-12 h-12 text-base",
      name: "text-base",
      score: "text-sm",
    },
  };

  const s = sizes[size];
  const initials = player.name.slice(0, 2).toUpperCase();

  return (
    <motion.div
      className={`
        relative flex items-center gap-2 rounded-xl
        transition-all duration-300
        ${isCurrentTurn
          ? "bg-success/15 ring-1 ring-success/50 shadow-[0_0_12px_rgba(52,199,89,0.2)]"
          : "bg-surface hover:bg-surface-hover"
        }
        ${s.container}
      `}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* Turn indicator pulse */}
      {isCurrentTurn && (
        <motion.div
          className="absolute inset-0 rounded-xl bg-success/10"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Avatar */}
      <div
        className={`
          ${s.avatar}
          rounded-xl flex items-center justify-center font-bold text-white
          bg-gradient-to-br ${player.avatarColor || "from-gray-500 to-gray-600"}
          shadow-md
          relative z-10
        `}
      >
        {initials}
      </div>

      {/* Info */}
      <div className="flex flex-col min-w-0 relative z-10">
        <div className="flex items-center gap-1">
          <span className={`${s.name} font-medium text-text-primary truncate max-w-[80px]`}>
            {isMe ? "我" : player.name}
          </span>
          {player.isHost && (
            <Crown className="w-3 h-3 text-warning flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`${s.score} text-text-secondary`}>
            {player.score}分
          </span>
          {cardCount !== undefined && (
            <span className={`${s.score} text-text-tertiary`}>
              {cardCount}张
            </span>
          )}
        </div>
      </div>

      {/* Online status */}
      <div className="relative z-10">
        {player.isOnline ? (
          <Wifi className="w-3 h-3 text-success" />
        ) : (
          <WifiOff className="w-3 h-3 text-text-tertiary" />
        )}
      </div>
    </motion.div>
  );
}
