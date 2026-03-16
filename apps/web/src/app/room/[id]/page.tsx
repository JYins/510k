"use client";

import { useState, useEffect, useRef } from "react";
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

const SPRING = { type: "spring" as const, stiffness: 350, damping: 28 };

export default function RoomPage() {
  const params = useParams();
  const roomId = params.id as string;
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { room, isLoading, joinRoom, startGame } = useRoom({ roomId });

  const [copied, setCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [joinError, setJoinError] = useState("");
  const hasJoined = useRef(false);
  const hasAutoStarted = useRef(false);

  const players = room?.players ?? [];
  const isHost = user && room ? room.players[0]?.uid === user.uid : false;
  const maxPlayers = room?.maxPlayers ?? 4;
  const isFull = players.length >= maxPlayers;

  // Auto-join when entering the room
  useEffect(() => {
    if (!user || !room || hasJoined.current) return;
    if (room.status !== "lobby") return;
    const alreadyIn = room.players.some((p) => p.uid === user.uid);
    if (alreadyIn) {
      hasJoined.current = true;
      return;
    }
    if (room.players.length >= room.maxPlayers) return;

    hasJoined.current = true;
    joinRoom().catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : "加入房间失败";
      setJoinError(msg);
    });
  }, [user, room, joinRoom]);

  // Navigate to game when status changes to "playing"
  useEffect(() => {
    if (room?.status === "playing") {
      router.push(`/game/${roomId}`);
    }
  }, [room?.status, roomId, router]);

  // Auto-start when room is full (host only)
  useEffect(() => {
    if (!isHost || !isFull || hasAutoStarted.current) return;
    if (room?.status !== "lobby") return;

    hasAutoStarted.current = true;
    setIsStarting(true);
    startGame()
      .catch((err: unknown) => {
        console.error("Auto-start failed:", err);
        hasAutoStarted.current = false;
      })
      .finally(() => setIsStarting(false));
  }, [isHost, isFull, room?.status, startGame]);

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
          text: `来和我一起打 510K！房间号: ${roomId}`,
          url: window.location.href,
        });
      } catch {
        // cancelled
      }
    } else {
      handleCopyRoomId();
    }
  };

  const handleManualStart = async () => {
    setIsStarting(true);
    try {
      await startGame();
    } catch (error) {
      console.error("Failed to start game:", error);
    } finally {
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-black flex items-center justify-center">
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
      <div className="min-h-[100dvh] bg-black flex flex-col items-center justify-center gap-4">
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
  const progressPercent = (players.length / maxPlayers) * 100;

  return (
    <div className="min-h-[100dvh] bg-black flex flex-col">
      {/* Top Bar */}
      <div className="h-12 w-full flex items-center justify-between px-6 pt-2 shrink-0">
        <button
          onClick={() => router.push("/")}
          className="w-8 h-8 rounded-full bg-ios-gray-500/50 flex items-center justify-center text-white/70"
        >
          <span className="text-lg">←</span>
        </button>
        <span className="text-[15px] font-semibold text-white">房间大厅</span>
        <button
          onClick={handleShare}
          className="w-8 h-8 rounded-full bg-ios-blue/20 flex items-center justify-center text-ios-blue"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* BG */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-72 h-72 bg-ios-purple/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-0 w-72 h-72 bg-ios-blue/15 rounded-full blur-[100px]" />
      </div>

      <div className="flex-1 flex flex-col max-w-md mx-auto w-full px-6 relative z-10 overflow-y-auto">
        {/* Room ID Card */}
        <motion.div
          className="mt-4 mb-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING}
        >
          <div className="bg-ios-gray-500/40 backdrop-blur-ios rounded-3xl p-5 border border-white/5 shadow-ios">
            <p className="text-[13px] text-white/40 text-center mb-1.5 uppercase tracking-wider">
              房间号
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-[36px] font-bold text-white tracking-[0.12em] font-mono">
                {roomId.slice(0, 8).toUpperCase()}
              </span>
              <motion.button
                className="w-9 h-9 rounded-full bg-ios-gray-400/50 flex items-center justify-center text-white/60"
                onClick={handleCopyRoomId}
                whileTap={{ scale: 0.9 }}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-ios-green" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Progress Ring */}
        <motion.div
          className="flex flex-col items-center mb-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...SPRING, delay: 0.1 }}
        >
          <div className="relative w-28 h-28">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="6"
              />
              <motion.circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke={isFull ? "#30D158" : "#0A84FF"}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                animate={{
                  strokeDashoffset: 2 * Math.PI * 42 * (1 - progressPercent / 100),
                }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[28px] font-bold text-white">
                {players.length}/{maxPlayers}
              </span>
              <span className="text-[11px] text-white/40">玩家</span>
            </div>
          </div>

          <motion.p
            className="mt-3 text-[15px] font-medium"
            animate={{
              color: isFull ? "#30D158" : "rgba(255,255,255,0.5)",
            }}
          >
            {isFull ? "人齐了，即将开始..." : "等待玩家加入..."}
          </motion.p>

          {!isFull && (
            <motion.div
              className="flex items-center gap-1.5 mt-2"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-ios-blue" />
              <div className="w-1.5 h-1.5 rounded-full bg-ios-blue" />
              <div className="w-1.5 h-1.5 rounded-full bg-ios-blue" />
            </motion.div>
          )}
        </motion.div>

        {/* Players List */}
        <motion.div
          className="flex-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {players.map((player, index) => (
                <motion.div
                  key={player.uid}
                  className="bg-ios-gray-500/40 backdrop-blur-ios rounded-2xl p-4 border border-white/5 flex items-center gap-4"
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ ...SPRING, delay: index * 0.06 }}
                  layout
                >
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${AVATAR_COLORS[index % AVATAR_COLORS.length]} flex items-center justify-center text-white font-bold text-lg shadow-ios`}
                  >
                    {(player.displayName ?? "?").slice(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white truncate">
                        {player.displayName ?? "玩家"}
                      </span>
                      {index === 0 && (
                        <span className="text-[11px] text-ios-yellow bg-ios-yellow/20 px-2 py-0.5 rounded-full shrink-0">
                          房主
                        </span>
                      )}
                      {user && player.uid === user.uid && (
                        <span className="text-[11px] text-ios-blue bg-ios-blue/20 px-2 py-0.5 rounded-full shrink-0">
                          我
                        </span>
                      )}
                    </div>
                    <span className="text-[12px] text-white/40">
                      座位 #{player.seat + 1}
                    </span>
                  </div>
                  <motion.div
                    className="w-3 h-3 rounded-full bg-ios-green"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
              ))}

              {Array.from({ length: maxPlayers - players.length }).map((_, i) => (
                <motion.div
                  key={`empty-${i}`}
                  className="bg-ios-gray-600/30 rounded-2xl p-4 border border-dashed border-white/10 flex items-center gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                >
                  <div className="w-12 h-12 rounded-2xl bg-ios-gray-600/50 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-white/20" />
                  </div>
                  <span className="text-[15px] text-white/25">
                    等待玩家...
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Error */}
        {joinError && (
          <p className="text-[13px] text-red-400 text-center mt-3">{joinError}</p>
        )}

        {/* Actions */}
        <motion.div
          className="py-5 space-y-3 shrink-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          {isHost && !isFull && (
            <motion.button
              className={`w-full py-4 rounded-2xl font-semibold text-[17px] flex items-center justify-center gap-2 transition-all ${
                canStart
                  ? "bg-ios-green text-white shadow-glow-green active:scale-[0.98]"
                  : "bg-ios-gray-400/50 text-white/30 cursor-not-allowed"
              }`}
              onClick={handleManualStart}
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
                    ? "提前开始游戏"
                    : `至少需要 2 人`}
                </span>
              )}
            </motion.button>
          )}

          {isHost && isFull && (
            <div className="bg-ios-green/10 rounded-2xl p-4 text-center border border-ios-green/20">
              <motion.span
                className="text-[15px] text-ios-green font-medium"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                房间已满，正在自动开始...
              </motion.span>
            </div>
          )}

          {!isHost && (
            <div className="bg-ios-gray-500/40 rounded-2xl p-4 text-center border border-white/5">
              <span className="text-[15px] text-white/50">
                {isFull ? "即将开始游戏..." : "等待房主开始游戏..."}
              </span>
            </div>
          )}

          <motion.button
            className="w-full py-3 rounded-2xl bg-ios-gray-500/30 text-white/50 font-medium flex items-center justify-center gap-2 border border-white/5 active:scale-[0.98] transition-all"
            onClick={() => router.push("/")}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut className="w-4 h-4" />
            <span>离开房间</span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
