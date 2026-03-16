"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { Copy, Check, Share2, LogOut, UserPlus } from "lucide-react";
import { useRoom } from "@/hooks/useRoom";
import { useAuth } from "@/contexts/AuthContext";

const AVATAR_COLORS = [
  "from-ios-red to-ios-pink",
  "from-ios-blue to-ios-teal",
  "from-ios-green to-ios-teal",
  "from-ios-purple to-ios-pink",
  "from-ios-orange to-ios-yellow",
];

export default function RoomPage() {
  const params = useParams();
  const roomId = params.id as string;
  const router = useRouter();
  const { user } = useAuth();
  const { room, isLoading, startGame } = useRoom({ roomId });

  const [copied, setCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const players = room?.players ?? [];
  const isHost = user && room ? room.players[0]?.uid === user.uid : false;
  const maxPlayers = room?.maxPlayers ?? 4;

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "加入 510K 游戏",
          text: `房间号: ${roomId}`,
          url: window.location.href,
        });
      } catch {
        // cancelled
      }
    } else {
      handleCopyRoomId();
    }
  };

  const handleStartGame = async () => {
    setIsStarting(true);
    try {
      await startGame();
      router.push(`/game/${roomId}`);
    } catch (error) {
      console.error("Failed to start game:", error);
    } finally {
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          className="w-8 h-8 border-2 border-white/20 border-t-white/70 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <p className="text-white/50 text-[17px]">房间不存在</p>
        <button
          className="text-ios-blue text-[15px]"
          onClick={() => router.push("/")}
        >
          返回首页
        </button>
      </div>
    );
  }

  const canStart = players.length >= 2;

  return (
    <div className="min-h-screen bg-black flex flex-col overflow-hidden">
      <div className="h-12 w-full flex items-center justify-between px-6 pt-2">
        <button
          onClick={() => router.push("/")}
          className="w-8 h-8 rounded-full bg-ios-gray-500/50 flex items-center justify-center text-white/70"
        >
          <span className="text-lg">←</span>
        </button>
        <span className="text-[15px] font-semibold text-white">房间</span>
        <button
          onClick={handleShare}
          className="w-8 h-8 rounded-full bg-ios-blue/20 flex items-center justify-center text-ios-blue"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-72 h-72 bg-ios-purple/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-0 w-72 h-72 bg-ios-blue/15 rounded-full blur-[100px]" />
      </div>

      <div className="flex-1 flex flex-col max-w-md mx-auto w-full px-6 relative z-10">
        {/* Room ID Card */}
        <motion.div
          className="mt-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-ios-gray-500/40 backdrop-blur-ios rounded-3xl p-6 border border-white/5 shadow-ios">
            <p className="text-[13px] text-white/40 text-center mb-2 uppercase tracking-wider">
              房间号
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-[40px] font-bold text-white tracking-[0.12em]">
                {roomId.slice(0, 6).toUpperCase()}
              </span>
              <motion.button
                className="w-10 h-10 rounded-full bg-ios-gray-400/50 flex items-center justify-center text-white/60"
                onClick={handleCopyRoomId}
                whileTap={{ scale: 0.9 }}
              >
                {copied ? (
                  <Check className="w-5 h-5 text-ios-green" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Players Section */}
        <motion.div
          className="flex-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-[17px] font-semibold text-white">
              玩家 ({players.length}/{maxPlayers})
            </h2>
            <span className="text-[13px] text-white/40">
              {room.status === "lobby" ? "等待加入..." : "游戏中"}
            </span>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {players.map((player, index) => (
                <motion.div
                  key={player.uid}
                  className="bg-ios-gray-500/40 backdrop-blur-ios rounded-2xl p-4 border border-white/5 flex items-center gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${AVATAR_COLORS[index % AVATAR_COLORS.length]} flex items-center justify-center text-white font-bold text-lg shadow-ios`}
                  >
                    {(player.displayName ?? "?").slice(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">
                        {player.displayName ?? "玩家"}
                      </span>
                      {index === 0 && (
                        <span className="text-[11px] text-ios-yellow bg-ios-yellow/20 px-2 py-0.5 rounded-full">
                          房主
                        </span>
                      )}
                      {user && player.uid === user.uid && (
                        <span className="text-[11px] text-ios-blue bg-ios-blue/20 px-2 py-0.5 rounded-full">
                          我
                        </span>
                      )}
                    </div>
                    <span className="text-[12px] text-white/40">
                      座位 #{player.seat}
                    </span>
                  </div>
                </motion.div>
              ))}

              {Array.from({ length: maxPlayers - players.length }).map((_, i) => (
                <motion.div
                  key={`empty-${i}`}
                  className="bg-ios-gray-600/30 rounded-2xl p-4 border border-dashed border-white/10 flex items-center gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="w-12 h-12 rounded-2xl bg-ios-gray-600/50 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-white/30" />
                  </div>
                  <span className="text-[15px] text-white/30">
                    等待玩家加入...
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          className="py-6 space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isHost ? (
            <>
              <motion.button
                className={`w-full py-4 rounded-2xl font-semibold text-[17px] flex items-center justify-center gap-2 transition-all ${
                  canStart
                    ? "bg-ios-green text-white shadow-glow-green active:scale-[0.98]"
                    : "bg-ios-gray-400/50 text-white/30 cursor-not-allowed"
                }`}
                onClick={handleStartGame}
                disabled={!canStart || isStarting}
                whileTap={canStart ? { scale: 0.98 } : undefined}
              >
                {isStarting ? (
                  <motion.div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <span>
                    {canStart
                      ? "开始游戏"
                      : `等待更多玩家 (${players.length}/${maxPlayers})`}
                  </span>
                )}
              </motion.button>

              <motion.button
                className="w-full py-3 rounded-2xl bg-ios-gray-500/40 text-white/60 font-medium flex items-center justify-center gap-2 border border-white/5 active:scale-[0.98] transition-all"
                onClick={() => router.push("/")}
                whileTap={{ scale: 0.98 }}
              >
                <LogOut className="w-4 h-4" />
                <span>解散房间</span>
              </motion.button>
            </>
          ) : (
            <div className="bg-ios-gray-500/40 rounded-2xl p-5 text-center border border-white/5">
              <span className="text-[15px] text-white/50">
                等待房主开始游戏...
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
