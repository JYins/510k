"use client";

import { motion } from "framer-motion";
import { Timer, Zap } from "lucide-react";

interface TurnIndicatorProps {
  isMyTurn: boolean;
  playerName?: string;
  timeLeft?: number;
}

export function TurnIndicator({
  isMyTurn,
  playerName,
  timeLeft,
}: TurnIndicatorProps) {
  if (isMyTurn) {
    return (
      <motion.div
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-success/15 border border-success/30"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        <motion.div
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(52, 199, 89, 0.4)",
              "0 0 0 8px rgba(52, 199, 89, 0)",
            ],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-2.5 h-2.5 rounded-full bg-success"
        />
        <Zap className="w-4 h-4 text-success" />
        <span className="text-sm font-semibold text-success">你的回合</span>

        {timeLeft !== undefined && (
          <span className="text-xs text-success/70 ml-1">
            {timeLeft}s
          </span>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-white/5"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <Timer className="w-4 h-4 text-text-tertiary" />
      <span className="text-sm text-text-secondary">
        等待 {playerName || "其他玩家"}...
      </span>
    </motion.div>
  );
}
