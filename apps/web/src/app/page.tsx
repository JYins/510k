"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useRoom } from "@/hooks/useRoom";

export default function HomePage() {
  const router = useRouter();
  const [maxPlayers, setMaxPlayers] = useState<2 | 3 | 4>(4);
  const [roomIdInput, setRoomIdInput] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const { createRoom } = useRoom({ roomId: "", enableMock: true });

  const handleCreateRoom = async () => {
    setIsCreating(true);
    try {
      const result = await createRoom(maxPlayers);
      router.push(`/room/${result.roomId}`);
    } catch (error) {
      console.error("Failed to create room:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = () => {
    if (roomIdInput.trim()) {
      router.push(`/room/${roomIdInput.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col overflow-hidden">
      {/* iOS Dynamic Island / Status Bar Area */}
      <div className="h-12 w-full flex items-center justify-center pt-2">
        <div className="w-28 h-7 bg-black rounded-full flex items-center justify-center gap-2">
          <span className="text-[10px] text-white/60 font-medium">510K</span>
          <div className="w-16 h-4 bg-black rounded-full border border-white/10" />
        </div>
      </div>

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-ios-purple/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-ios-blue/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-ios-indigo/10 rounded-full blur-[100px]" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full px-6 relative z-10">
        {/* Header with Large Title */}
        <motion.div
          className="pt-8 pb-6 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: "spring" }}
        >
          {/* App Icon */}
          <motion.div
            className="mx-auto mb-6 w-28 h-28 rounded-[28px] overflow-hidden shadow-ios-xl"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          >
            <div className="w-full h-full bg-gradient-to-br from-ios-purple via-ios-indigo to-ios-blue flex items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <span className="text-6xl relative z-10 drop-shadow-lg">🃏</span>
            </div>
          </motion.div>

          <motion.h1
            className="text-[34px] font-bold text-white tracking-tight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            510K
          </motion.h1>
          <motion.p
            className="text-[17px] text-white/50 mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            经典扑克牌游戏 ♠️♥️♣️♦️
          </motion.p>
        </motion.div>

        {/* Segmented Control */}
        <motion.div
          className="bg-ios-gray-500/50 backdrop-blur-ios rounded-xl p-1 mb-6"
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
              ✨ 创建房间
            </button>
            <button
              className={`flex-1 py-2.5 text-[15px] font-semibold rounded-lg relative z-10 transition-colors duration-200 ${
                activeTab === "join" ? "text-white" : "text-white/50"
              }`}
              onClick={() => setActiveTab("join")}
            >
              🔑 加入房间
            </button>
          </div>
        </motion.div>

        {/* Content Cards */}
        <motion.div
          className="flex-1"
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
                    👥 选择玩家人数
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
                        <span className="text-2xl">
                          {num === 2 ? "👥" : num === 3 ? "👨‍👩‍👧" : "👨‍👩‍👧‍👦"}
                        </span>
                        <span>{num}人</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Game Info Card */}
                <div className="bg-ios-gray-500/40 backdrop-blur-ios rounded-2xl p-5 border border-white/5 shadow-ios">
                  <h3 className="text-[15px] font-semibold text-white mb-3 flex items-center gap-2">
                    <span>🎮</span> 游戏特色
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-ios-gray-600/50 rounded-xl p-3 text-center">
                      <span className="text-2xl mb-1 block">⚡</span>
                      <span className="text-[13px] text-white/70">实时对战</span>
                    </div>
                    <div className="bg-ios-gray-600/50 rounded-xl p-3 text-center">
                      <span className="text-2xl mb-1 block">🎯</span>
                      <span className="text-[13px] text-white/70">计分系统</span>
                    </div>
                    <div className="bg-ios-gray-600/50 rounded-xl p-3 text-center">
                      <span className="text-2xl mb-1 block">🏆</span>
                      <span className="text-[13px] text-white/70">排行榜</span>
                    </div>
                    <div className="bg-ios-gray-600/50 rounded-xl p-3 text-center">
                      <span className="text-2xl mb-1 block">💎</span>
                      <span className="text-[13px] text-white/70">精美界面</span>
                    </div>
                  </div>
                </div>

                {/* Create Button - iOS Style Floating */}
                <motion.button
                  className="w-full py-4 rounded-2xl bg-ios-blue text-white font-semibold text-[17px] shadow-float flex items-center justify-center gap-2 mt-6 active:scale-[0.98] transition-all"
                  onClick={handleCreateRoom}
                  disabled={isCreating}
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ scale: 1.01 }}
                >
                  {isCreating ? (
                    <motion.div
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  ) : (
                    <>
                      <span className="text-xl">✨</span>
                      <span>创建房间</span>
                    </>
                  )}
                </motion.button>
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
                  <h3 className="text-[15px] font-semibold text-white mb-4 flex items-center gap-2">
                    <span>🔑</span> 输入房间号
                  </h3>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="ABC123"
                      value={roomIdInput}
                      onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                      className="w-full h-16 bg-ios-gray-600/70 rounded-2xl text-white text-center text-[28px] font-bold tracking-[0.15em] placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-ios-blue/50 border border-white/5 transition-all"
                      maxLength={6}
                    />
                    <div className="absolute inset-0 pointer-events-none rounded-2xl shadow-inner" />
                  </div>

                  <p className="text-[13px] text-white/40 text-center mt-3">
                    请输入6位房间号
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="bg-ios-gray-500/40 backdrop-blur-ios rounded-2xl p-5 border border-white/5 shadow-ios">
                  <h3 className="text-[15px] font-semibold text-white mb-3 flex items-center gap-2">
                    <span>📋</span> 最近加入
                  </h3>
                  <div className="space-y-2">
                    {["A1B2C3", "X9Y8Z7"].map((id) => (
                      <motion.button
                        key={id}
                        className="w-full py-3 px-4 bg-ios-gray-600/50 rounded-xl flex items-center justify-between text-left hover:bg-ios-gray-600 transition-colors"
                        onClick={() => setRoomIdInput(id)}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🏠</span>
                          <div>
                            <span className="text-white font-semibold tracking-wider">{id}</span>
                            <p className="text-[12px] text-white/40">2分钟前</p>
                          </div>
                        </div>
                        <span className="text-ios-blue text-[15px]">加入</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Join Button */}
                <motion.button
                  className={`w-full py-4 rounded-2xl font-semibold text-[17px] flex items-center justify-center gap-2 mt-6 transition-all ${
                    roomIdInput.trim()
                      ? "bg-ios-green text-white shadow-glow-green active:scale-[0.98]"
                      : "bg-ios-gray-400/50 text-white/30 cursor-not-allowed"
                  }`}
                  onClick={handleJoinRoom}
                  disabled={!roomIdInput.trim()}
                  whileTap={roomIdInput.trim() ? { scale: 0.98 } : undefined}
                >
                  <span className="text-xl">🚀</span>
                  <span>加入游戏</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <motion.footer
          className="py-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-[13px] text-white/30">
            Made with <span className="text-red-500">❤️</span> for card game lovers
          </p>
          <div className="flex items-center justify-center gap-4 mt-3 text-lg">
            <span>♠️</span>
            <span className="text-ios-red">♥️</span>
            <span className="text-white/60">♣️</span>
            <span className="text-ios-red">♦️</span>
          </div>
        </motion.footer>
      </div>
    </div>
  );
}
