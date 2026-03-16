"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ScoreBoard } from "@/components/home/ScoreBoard";

export default function HomePage() {
  const router = useRouter();
  const { user, userProfile, loading, signOut } = useAuth();
  const [maxPlayers, setMaxPlayers] = useState<2 | 3 | 4>(4);
  const [roomIdInput, setRoomIdInput] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [errorMsg, setErrorMsg] = useState("");

  if (loading) {
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

  const handleCreateRoom = async () => {
    if (!user) {
      router.push("/auth");
      return;
    }
    setIsCreating(true);
    setErrorMsg("");
    try {
      const { httpsCallable } = await import("firebase/functions");
      const { functions } = await import("@/lib/firebase");
      const createRoomFn = httpsCallable(functions, "createRoom");
      const result = await createRoomFn({ maxPlayers });
      const data = result.data as { roomId: string };
      router.push(`/room/${data.roomId}`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "创建房间失败";
      setErrorMsg(msg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = () => {
    if (!user) {
      router.push("/auth");
      return;
    }
    if (roomIdInput.trim()) {
      router.push(`/room/${roomIdInput.trim()}`);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-black flex flex-col overflow-y-auto">
      {/* Top bar with user button */}
      <div className="h-12 w-full flex items-center justify-between px-5 pt-2 relative z-20 shrink-0">
        <div className="w-10" />
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/60 font-medium">510K</span>
        </div>
        {user ? (
          <motion.button
            className="h-10 rounded-full flex items-center gap-2 bg-ios-gray-500/60 backdrop-blur-ios px-1.5 pr-3"
            whileTap={{ scale: 0.95 }}
            onClick={() => signOut()}
          >
            <span className="w-7 h-7 rounded-full bg-ios-gray-400 flex items-center justify-center text-[16px] leading-none select-none">
              {userProfile?.avatar || "👤"}
            </span>
            <span className="text-[13px] text-white/80 font-medium max-w-[80px] truncate">
              {userProfile?.displayName || "用户"}
            </span>
          </motion.button>
        ) : (
          <motion.button
            className="w-10 h-10 rounded-full flex items-center justify-center bg-ios-gray-500/60 backdrop-blur-ios"
            whileTap={{ scale: 0.92 }}
            onClick={() => router.push("/auth")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/70">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </motion.button>
        )}
      </div>

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-ios-purple/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-ios-blue/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-ios-indigo/10 rounded-full blur-[100px]" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full px-6 relative z-10 pb-2">
        {/* Header with Large Title */}
        <motion.div
          className="pt-4 pb-5 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: "spring" }}
        >
          <motion.div
            className="mx-auto mb-4 w-24 h-24 rounded-[22px] overflow-hidden shadow-ios-xl"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          >
            <div className="w-full h-full bg-gradient-to-br from-ios-purple via-ios-indigo to-ios-blue flex items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <span className="text-5xl relative z-10 drop-shadow-lg">🃏</span>
            </div>
          </motion.div>

          <motion.h1
            className="text-[30px] font-bold text-white tracking-tight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            510K
          </motion.h1>
          <motion.p
            className="text-[15px] text-white/50 mt-0.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            经典扑克牌游戏
          </motion.p>
        </motion.div>

        {/* Segmented Control */}
        <motion.div
          className="bg-ios-gray-500/50 backdrop-blur-ios rounded-xl p-1 mb-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="flex relative">
            <motion.div
              className="absolute inset-y-1 bg-ios-gray-400 rounded-lg shadow-ios"
              layoutId="activeTab"
              style={{
                width: "50%",
                left: activeTab === "create" ? "0%" : "50%",
              }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
            <button
              className={`flex-1 py-2.5 text-[15px] font-semibold rounded-lg relative z-10 transition-colors duration-200 ${
                activeTab === "create" ? "text-white" : "text-white/50"
              }`}
              onClick={() => setActiveTab("create")}
            >
              创建房间
            </button>
            <button
              className={`flex-1 py-2.5 text-[15px] font-semibold rounded-lg relative z-10 transition-colors duration-200 ${
                activeTab === "join" ? "text-white" : "text-white/50"
              }`}
              onClick={() => setActiveTab("join")}
            >
              加入房间
            </button>
          </div>
        </motion.div>

        {/* Content Cards */}
        <motion.div
          className="flex-1 overflow-y-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <AnimatePresence mode="wait">
            {activeTab === "create" ? (
              <motion.div
                key="create"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Player Count Card */}
                <div className="bg-ios-gray-500/40 backdrop-blur-ios rounded-2xl p-5 border border-white/5 shadow-ios">
                  <h3 className="text-[15px] font-semibold text-white mb-4">
                    选择玩家人数
                  </h3>
                  <div className="flex gap-3">
                    {[2, 3, 4].map((num) => (
                      <motion.button
                        key={num}
                        className={`flex-1 py-4 rounded-xl font-semibold text-[17px] transition-all duration-200 flex flex-col items-center gap-1.5 border ${
                          maxPlayers === num
                            ? "bg-ios-blue text-white border-ios-blue shadow-float"
                            : "bg-ios-gray-400/50 text-white/70 border-transparent hover:bg-ios-gray-400"
                        }`}
                        onClick={() => setMaxPlayers(num as 2 | 3 | 4)}
                        whileTap={{ scale: 0.96 }}
                      >
                        <span>{num}人</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Scoreboard replaces "游戏特色" */}
                <ScoreBoard />

                {/* Create Button */}
                <motion.button
                  className="w-full py-4 rounded-2xl bg-ios-blue text-white font-semibold text-[17px] shadow-float flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                  onClick={handleCreateRoom}
                  disabled={isCreating}
                  whileTap={{ scale: 0.98 }}
                >
                  {isCreating ? (
                    <motion.div
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  ) : (
                    <span>创建房间</span>
                  )}
                </motion.button>

                {errorMsg && (
                  <p className="text-[13px] text-red-400 text-center mt-2">{errorMsg}</p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="join"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Room ID Input Card */}
                <div className="bg-ios-gray-500/40 backdrop-blur-ios rounded-2xl p-5 border border-white/5 shadow-ios">
                  <h3 className="text-[15px] font-semibold text-white mb-4">
                    输入房间号
                  </h3>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="粘贴房间号"
                      value={roomIdInput}
                      onChange={(e) => setRoomIdInput(e.target.value)}
                      className="w-full h-16 bg-ios-gray-600/70 rounded-2xl text-white text-center text-[28px] font-bold tracking-[0.15em] placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-ios-blue/50 border border-white/5 transition-all"
                      maxLength={20}
                    />
                  </div>
                  <p className="text-[13px] text-white/40 text-center mt-3">
                    请输入房间号
                  </p>
                </div>

                {/* Scoreboard */}
                <ScoreBoard />

                {/* Join Button */}
                <motion.button
                  className={`w-full py-4 rounded-2xl font-semibold text-[17px] flex items-center justify-center gap-2 transition-all ${
                    roomIdInput.trim()
                      ? "bg-ios-green text-white shadow-glow-green active:scale-[0.98]"
                      : "bg-ios-gray-400/50 text-white/30 cursor-not-allowed"
                  }`}
                  onClick={handleJoinRoom}
                  disabled={!roomIdInput.trim()}
                  whileTap={roomIdInput.trim() ? { scale: 0.98 } : undefined}
                >
                  <span>加入游戏</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <motion.footer
          className="py-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-[13px] text-white/30">
            此游戏致敬yp小姐 不过输了还是要大冒险
          </p>
        </motion.footer>
      </div>
    </div>
  );
}
