"use client";

import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";

interface ActionBarProps {
  onPlay: () => void;
  onPass: () => void;
  onSort?: () => void;
  canPlay: boolean;
  canPass: boolean;
  selectedCount: number;
  isLoading?: boolean;
  isMyTurn: boolean;
}

const PILL = "rounded-full font-medium text-[15px] flex items-center justify-center transition-opacity";

export function ActionBar({
  onPlay,
  onPass,
  onSort,
  canPlay,
  canPass,
  selectedCount,
  isLoading = false,
  isMyTurn,
}: ActionBarProps) {
  if (!isMyTurn) {
    return (
      <motion.div
        className="flex items-center justify-center h-[48px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <span className="text-[14px] text-white/30 font-medium">
          等待其他玩家...
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex items-center gap-2"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
    >
      {/* Play button */}
      <motion.button
        className={`${PILL} flex-1 h-[48px] ${
          canPlay && !isLoading
            ? "bg-[#2c2c2e] text-white"
            : "bg-[#2c2c2e]/60 text-white/30"
        }`}
        onClick={onPlay}
        disabled={!canPlay || isLoading}
        whileTap={canPlay ? { scale: 0.96 } : undefined}
      >
        {selectedCount > 0 ? `出牌 ${selectedCount}` : "出牌"}
      </motion.button>

      {/* Pass button */}
      <motion.button
        className={`${PILL} flex-1 h-[48px] ${
          canPass && !isLoading
            ? "bg-[#2c2c2e] text-white"
            : "bg-[#2c2c2e]/60 text-white/30"
        }`}
        onClick={onPass}
        disabled={!canPass || isLoading}
        whileTap={canPass ? { scale: 0.96 } : undefined}
      >
        跳过
      </motion.button>

      {/* Sort / utility button */}
      <motion.button
        className={`${PILL} w-[48px] h-[48px] bg-[#2c2c2e] text-white/70 flex-shrink-0`}
        onClick={onSort}
        whileTap={{ scale: 0.92 }}
      >
        <ArrowUp className="w-[18px] h-[18px]" strokeWidth={2.5} />
      </motion.button>
    </motion.div>
  );
}
