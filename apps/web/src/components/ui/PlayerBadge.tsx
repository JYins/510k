"use client";

import { motion } from "framer-motion";
import { Player } from "@/types/game";

interface PlayerBadgeProps {
  player: Player;
  isCurrentTurn: boolean;
  isMe: boolean;
  betAmount?: number;
  index?: number;
}

const SPRING = { type: "spring" as const, stiffness: 400, damping: 28 };

export function PlayerBadge({
  player,
  isCurrentTurn,
  isMe,
  betAmount,
  index = 0,
}: PlayerBadgeProps) {
  return (
    <motion.div
      className="flex flex-col items-center gap-0.5 relative"
      style={{ minWidth: 52 }}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay: index * 0.05 }}
    >
      {/* Emoji avatar */}
      <div className="relative">
        <div className="w-[44px] h-[44px] flex items-center justify-center">
          <span className="text-[36px] leading-none select-none">{player.emoji}</span>
        </div>

        {/* Dealer badge */}
        {player.isDealer && (
          <motion.div
            className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] rounded-full bg-white/90 flex items-center justify-center shadow-sm"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={SPRING}
          >
            <span className="text-[9px] font-bold text-black leading-none">D</span>
          </motion.div>
        )}

        {/* Active turn indicator dot */}
        {isCurrentTurn && (
          <motion.div
            className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-[6px] h-[6px] rounded-full bg-green-500"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>

      {/* Name */}
      <div className="mt-1 flex items-center gap-1">
        <span className="text-[12px] font-medium tracking-tight text-white/70 leading-none">
          {player.name}
        </span>
        {player.isBot && (
          <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold leading-none text-white/45">
            BOT
          </span>
        )}
      </div>

      {/* Score */}
      <span className="text-[13px] font-semibold text-white leading-none">
        {player.score}
      </span>

      {/* Bet/stake chip badge */}
      {betAmount !== undefined && betAmount > 0 && (
        <motion.div
          className="mt-0.5 px-[8px] py-[2px] rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(58,58,60,0.85)" }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={SPRING}
        >
          <span className="text-[11px] font-semibold text-white leading-none">
            {betAmount}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
