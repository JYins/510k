"use client";

import { motion } from "framer-motion";
import { Trophy, Crown, Medal, RotateCcw, Home } from "lucide-react";
import { Player } from "@/types/game";
import { ScoreChip } from "@/components/ui/ScoreChip";

interface ResultPanelProps {
  players: Player[];
  onPlayAgain?: () => void;
  onHome?: () => void;
}

export function ResultPanel({ players, onPlayAgain, onHome }: ResultPanelProps) {
  // Sort by score descending
  const rankedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = rankedPlayers[0];

  const rankIcons = [
    <Crown key="1" className="w-5 h-5 text-yellow-500" />,
    <Medal key="2" className="w-5 h-5 text-gray-400" />,
    <Medal key="3" className="w-5 h-5 text-orange-600" />,
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Winner highlight */}
      <motion.div
        className="flex flex-col items-center py-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="relative">
          {/* Crown animation */}
          <motion.div
            className="absolute -top-8 left-1/2 -translate-x-1/2"
            animate={{ y: [0, -4, 0], rotate: [-5, 5, -5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Crown className="w-10 h-10 text-yellow-500" />
          </motion.div>

          {/* Winner avatar */}
          <motion.div
            className={`
              w-24 h-24 rounded-3xl flex items-center justify-center
              bg-gradient-to-br ${winner.avatarColor || "from-yellow-500 to-amber-600"}
              shadow-2xl shadow-yellow-500/20
              border-2 border-yellow-500/30
            `}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <span className="text-3xl font-bold text-white">
              {winner.name.slice(0, 2).toUpperCase()}
            </span>
          </motion.div>

          {/* Winner badge */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-xs font-bold text-white shadow-lg">
            冠军
          </div>
        </div>

        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-title font-bold text-text-primary">{winner.name}</h2>
          <div className="mt-2 flex items-center justify-center gap-2">
            <ScoreChip score={winner.score} isWinner size="lg" />
          </div>
        </motion.div>
      </motion.div>

      {/* Rankings */}
      <motion.div
        className="bg-surface rounded-2xl p-4 border border-white/5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-subhead-emphasized text-text-primary mb-4 px-2">
          最终排名
        </h3>

        <div className="space-y-2">
          {rankedPlayers.map((player, index) => (
            <motion.div
              key={player.id}
              className={`
                flex items-center gap-3 p-3 rounded-xl
                ${index === 0
                  ? "bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20"
                  : "bg-bg-elevated"
                }
              `}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              {/* Rank */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-surface">
                {index < 3 ? (
                  rankIcons[index]
                ) : (
                  <span className="text-lg font-bold text-text-tertiary">{index + 1}</span>
                )}
              </div>

              {/* Avatar */}
              <div
                className={`
                  w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm
                  bg-gradient-to-br ${player.avatarColor || "from-gray-500 to-gray-600"}
                `}
              >
                {player.name.slice(0, 2).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text-primary truncate">
                    {player.name}
                  </span>
                  {player.isHost && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/20 text-warning">
                      房主
                    </span>
                  )}
                </div>
                <span className="text-xs text-text-secondary">座位 {player.seat}</span>
              </div>

              {/* Score */}
              <ScoreChip
                score={player.score}
                change={index === 0 ? undefined : player.score - winner.score}
                isWinner={index === 0}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        className="flex gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <motion.button
          className="flex-1 h-14 rounded-xl bg-accent text-white font-semibold
                     flex items-center justify-center gap-2
                     shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:brightness-110
                     transition-all"
          onClick={onPlayAgain}
          whileTap={{ scale: 0.98 }}
        >
          <RotateCcw className="w-5 h-5" />
          再来一局
        </motion.button>

        <motion.button
          className="flex-1 h-14 rounded-xl bg-surface text-text-primary font-semibold
                     flex items-center justify-center gap-2
                     hover:bg-surface-hover transition-colors border border-white/5"
          onClick={onHome}
          whileTap={{ scale: 0.98 }}
        >
          <Home className="w-5 h-5" />
          返回大厅
        </motion.button>
      </motion.div>
    </div>
  );
}
