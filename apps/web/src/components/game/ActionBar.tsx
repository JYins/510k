"use client";

import { motion } from "framer-motion";
import { Play, SkipForward, Lightbulb, Loader2 } from "lucide-react";

interface ActionBarProps {
  onPlay: () => void;
  onPass: () => void;
  onHint?: () => void;
  canPlay: boolean;
  canPass: boolean;
  selectedCount: number;
  isLoading?: boolean;
  isMyTurn: boolean;
}

export function ActionBar({
  onPlay,
  onPass,
  onHint,
  canPlay,
  canPass,
  selectedCount,
  isLoading = false,
  isMyTurn,
}: ActionBarProps) {
  if (!isMyTurn) {
    return (
      <motion.div
        className="p-4 rounded-2xl bg-surface/50 border border-white/5 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="text-body text-text-secondary">
          等待其他玩家出牌...
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex gap-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {/* Hint button */}
      {onHint && (
        <motion.button
          className="flex-shrink-0 w-14 h-14 rounded-xl bg-surface hover:bg-surface-hover
                     flex items-center justify-center text-text-secondary
                     transition-colors border border-white/5"
          onClick={onHint}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
        >
          <Lightbulb className="w-5 h-5" />
        </motion.button>
      )}

      {/* Pass button */}
      <motion.button
        className={`
          flex-1 h-14 rounded-xl font-semibold text-base
          flex items-center justify-center gap-2
          transition-all duration-200
          ${canPass && !isLoading
            ? "bg-surface text-text-primary hover:bg-surface-hover border border-white/10"
            : "bg-surface/50 text-text-tertiary cursor-not-allowed"
          }
        `}
        onClick={onPass}
        disabled={!canPass || isLoading}
        whileTap={canPass && !isLoading ? { scale: 0.98 } : undefined}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <SkipForward className="w-5 h-5" />
            <span>跳过</span>
          </>
        )}
      </motion.button>

      {/* Play button */}
      <motion.button
        className={`
          flex-[2] h-14 rounded-xl font-semibold text-base
          flex items-center justify-center gap-2
          transition-all duration-200
          ${canPlay && !isLoading
            ? "bg-accent text-white shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:brightness-110"
            : "bg-accent/30 text-white/50 cursor-not-allowed"
          }
        `}
        onClick={onPlay}
        disabled={!canPlay || isLoading}
        whileTap={canPlay && !isLoading ? { scale: 0.98 } : undefined}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Play className="w-5 h-5" />
            <span>
              {selectedCount > 0 ? `出牌 (${selectedCount})` : "出牌"}
            </span>
          </>
        )}
      </motion.button>
    </motion.div>
  );
}
