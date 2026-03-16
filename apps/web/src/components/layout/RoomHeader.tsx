"use client";

import { motion } from "framer-motion";
import { ChevronLeft, Share2, Settings, Users } from "lucide-react";
import { RoomStatus } from "@/types/game";

interface RoomHeaderProps {
  roomId: string;
  status: RoomStatus;
  playerCount?: number;
  maxPlayers?: number;
  onBack?: () => void;
  onShare?: () => void;
  onSettings?: () => void;
}

const STATUS_LABELS: Record<RoomStatus, string> = {
  waiting: "等待中",
  playing: "进行中",
  finished: "已结束",
  closed: "已关闭",
};

const STATUS_COLORS: Record<RoomStatus, string> = {
  waiting: "text-warning bg-warning/10 border-warning/20",
  playing: "text-success bg-success/10 border-success/20",
  finished: "text-text-secondary bg-surface border-white/5",
  closed: "text-text-tertiary bg-surface border-white/5",
};

export function RoomHeader({
  roomId,
  status,
  playerCount,
  maxPlayers,
  onBack,
  onShare,
  onSettings,
}: RoomHeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-bg-secondary/80 backdrop-blur-md border-b border-white/5">
      {/* Back button */}
      <motion.button
        className="p-2 -ml-2 rounded-xl hover:bg-surface transition-colors"
        onClick={onBack}
        whileTap={{ scale: 0.9 }}
      >
        <ChevronLeft className="w-6 h-6 text-text-secondary" />
      </motion.button>

      {/* Center: Room info */}
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary tracking-wide">
            {roomId}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[status]}`}>
            {STATUS_LABELS[status]}
          </span>
        </div>

        {playerCount !== undefined && maxPlayers !== undefined && (
          <div className="flex items-center gap-1 mt-0.5">
            <Users className="w-3 h-3 text-text-tertiary" />
            <span className="text-xs text-text-tertiary">
              {playerCount}/{maxPlayers} 玩家
            </span>
          </div>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {onShare && (
          <motion.button
            className="p-2 rounded-xl hover:bg-surface transition-colors"
            onClick={onShare}
            whileTap={{ scale: 0.9 }}
          >
            <Share2 className="w-5 h-5 text-text-secondary" />
          </motion.button>
        )}

        {onSettings && (
          <motion.button
            className="p-2 -mr-2 rounded-xl hover:bg-surface transition-colors"
            onClick={onSettings}
            whileTap={{ scale: 0.9 }}
          >
            <Settings className="w-5 h-5 text-text-secondary" />
          </motion.button>
        )}
      </div>
    </header>
  );
}
