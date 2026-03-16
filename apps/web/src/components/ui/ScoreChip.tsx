"use client";

import { motion } from "framer-motion";
import { Trophy, TrendingUp, TrendingDown } from "lucide-react";

interface ScoreChipProps {
  score: number;
  change?: number;
  size?: "sm" | "md" | "lg";
  isWinner?: boolean;
}

export function ScoreChip({
  score,
  change,
  size = "md",
  isWinner = false,
}: ScoreChipProps) {
  const sizes = {
    sm: {
      container: "px-2 py-1 gap-1",
      icon: "w-3 h-3",
      score: "text-sm",
      change: "text-xs",
    },
    md: {
      container: "px-3 py-1.5 gap-1.5",
      icon: "w-4 h-4",
      score: "text-base",
      change: "text-sm",
    },
    lg: {
      container: "px-4 py-2 gap-2",
      icon: "w-5 h-5",
      score: "text-xl",
      change: "text-base",
    },
  };

  const s = sizes[size];

  return (
    <motion.div
      className={`
        inline-flex items-center rounded-full
        ${isWinner
          ? "bg-warning/20 text-warning ring-1 ring-warning/30"
          : "bg-surface text-text-primary"
        }
        ${s.container}
      `}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400 }}
    >
      {isWinner ? (
        <Trophy className={s.icon} />
      ) : change !== undefined ? (
        change > 0 ? (
          <TrendingUp className={`${s.icon} text-success`} />
        ) : change < 0 ? (
          <TrendingDown className={`${s.icon} text-error`} />
        ) : null
      ) : null}

      <span className={`${s.score} font-bold`}>
        {score}
      </span>

      {change !== undefined && change !== 0 && (
        <span className={`${s.change} ${change > 0 ? "text-success" : "text-error"}`}>
          {change > 0 ? "+" : ""}{change}
        </span>
      )}
    </motion.div>
  );
}
