"use client";

import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useRoom, useGameActions, useAuth } from "@/hooks";
import { MOCK_ROOM_PLAYING_MY_TURN, MOCK_HANDS, getPlayerById } from "@/mocks/gameData";

export default function GamePage() {
  const params = useParams();
  const roomId = params.id as string;
  const router = useRouter();
  const { user } = useAuth(true);

  const room = MOCK_ROOM_PLAYING_MY_TURN;
  const myPlayerId = "player-1";
  const myPlayer = getPlayerById(room.players, myPlayerId)!;
  const isMyTurn = room.currentTurn === myPlayerId;

  const {
    selectedCards,
    isLoading,
    error,
    toggleCard,
    playCards,
    pass,
  } = useGameActions({
    roomId,
    playerId: myPlayerId,
    enableMock: true,
  });

  const myHand = MOCK_HANDS[myPlayerId] || [];

  const trickPoints = room.trick?.pile.reduce((sum, card) => {
    if (card.rank === "5") return sum + 5;
    if (card.rank === "10") return sum + 10;
    if (card.rank === "K") return sum + 10;
    return sum;
  }, 0) || 0;

  return (
    <div className="min-h-screen bg-black flex flex-col overflow-hidden">
      {/* iOS Status Bar */}
      <div className="h-12 w-full flex items-center justify-between px-6 pt-2">
        <button
          onClick={() => router.push(`/room/${roomId}`)}
          className="w-8 h-8 rounded-full bg-ios-gray-500/50 flex items-center justify-center text-white/70 hover:bg-ios-gray-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-[15px] font-semibold text-white">游戏中</span>
        <div className="w-8" /> {/* Spacer */}
      </div>

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-ios-green/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-ios-purple/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-ios-blue/10 rounded-full blur-[100px]" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 relative z-10">
        {/* Players Row */}
        <motion.div
          className="flex justify-center gap-3 px-2 py-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {room.players.map((player, idx) => (
            <motion.div
              key={player.id}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all ${
                room.currentTurn === player.id
                  ? "bg-ios-green/20 border border-ios-green/30"
                  : "bg-ios-gray-500/30 border border-transparent"
              }`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${
                room.currentTurn === player.id
                  ? "bg-gradient-to-br from-ios-green to-ios-teal"
                  : "bg-gradient-to-br from-ios-gray-400 to-ios-gray-500"
              }`}>
                {player.name.slice(0, 1)}
              </div>
              <span className="text-[11px] text-white/60">{player.name}</span>
              {room.currentTurn === player.id && (
                <motion.span
                  className="text-[10px] text-ios-green"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  出牌中...
                </motion.span>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Turn Indicator */}
        <div className="flex justify-center mb-4">
          <motion.div
            className={`px-4 py-2 rounded-full flex items-center gap-2 ${
              isMyTurn
                ? "bg-ios-green/20 text-ios-green border border-ios-green/30"
                : "bg-ios-gray-500/30 text-white/50"
            }`}
            animate={isMyTurn ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-lg">{isMyTurn ? "🎯" : "⏳"}</span>
            <span className="text-[13px] font-medium">
              {isMyTurn ? "该你出牌了" : `${getPlayerById(room.players, room.currentTurn)?.name} 思考中...`}
            </span>
          </motion.div>
        </div>

        {/* Game Table */}
        <div className="flex-1 relative">
          {/* Table Center */}
          <motion.div
            className="absolute inset-x-4 top-0 bottom-32 bg-ios-gray-500/20 backdrop-blur-ios rounded-3xl border border-white/5 flex flex-col items-center justify-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {room.trick?.pile.length ? (
              <div className="flex flex-wrap justify-center gap-2 p-4">
                {room.trick.pile.map((card, idx) => (
                  <motion.div
                    key={idx}
                    className="w-14 h-20 bg-white rounded-xl shadow-ios flex flex-col items-center justify-center"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: idx * 0.05, type: "spring" }}
                  >
                    <span className={`text-lg ${(card.suit as string) === 'hearts' || (card.suit as string) === 'diamonds' ? 'text-ios-red' : 'text-black'}`}>
                      {card.rank}
                    </span>
                    <span className="text-xl">
                      {(card.suit as string) === 'hearts' ? '♥️' : (card.suit as string) === 'diamonds' ? '♦️' : (card.suit as string) === 'spades' ? '♠️' : '♣️'}
                    </span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center">
                <span className="text-4xl mb-2 block">🎴</span>
                <span className="text-[13px] text-white/30">等待出牌...</span>
              </div>
            )}

            {/* Trick Points */}
            {trickPoints > 0 && (
              <motion.div
                className="absolute top-4 right-4 px-3 py-1.5 bg-ios-yellow/20 rounded-full border border-ios-yellow/30"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <span className="text-[13px] text-ios-yellow font-semibold">
                  💎 {trickPoints}分
                </span>
              </motion.div>
            )}

            {/* Deck Count */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-ios-gray-600/50 rounded-full">
              <span className="text-lg">🎴</span>
              <span className="text-[13px] text-white/60">剩 {room.deckCount} 张</span>
            </div>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              className="absolute top-4 left-4 right-4 px-4 py-3 bg-ios-red/20 rounded-xl border border-ios-red/30 flex items-center gap-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle className="w-4 h-4 text-ios-red flex-shrink-0" />
              <span className="text-[13px] text-ios-red">{error}</span>
            </motion.div>
          )}
        </div>

        {/* My Hand */}
        <motion.div
          className="py-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex justify-center gap-[-8px] mb-4 overflow-x-auto pb-2 scrollbar-hide">
            {myHand.map((card, idx) => (
              <motion.button
                key={`${card.suit}-${card.rank}-${idx}`}
                className={`relative flex-shrink-0 w-16 h-24 rounded-xl shadow-ios transition-all ${
                  selectedCards.includes(idx.toString())
                    ? "bg-white -translate-y-4 ring-2 ring-ios-blue shadow-glow"
                    : "bg-white hover:-translate-y-1"
                }`}
                onClick={() => isMyTurn && toggleCard(idx.toString())}
                disabled={!isMyTurn}
                whileTap={{ scale: 0.95 }}
                style={{ marginLeft: idx > 0 ? "-20px" : "0" }}
              >
                <div className="absolute top-1.5 left-1.5 text-[11px] font-bold text-black">
                  {card.rank}
                </div>
                <div className={`absolute inset-0 flex items-center justify-center text-2xl ${
                  (card.suit as string) === 'hearts' || (card.suit as string) === 'diamonds' ? 'text-ios-red' : 'text-black'
                }`}>
                  {(card.suit as string) === 'hearts' ? '♥️' : (card.suit as string) === 'diamonds' ? '♦️' : (card.suit as string) === 'spades' ? '♠️' : '♣️'}
                </div>
                <div className="absolute bottom-1.5 right-1.5 text-[11px] font-bold text-black rotate-180">
                  {card.rank}
                </div>
              </motion.button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <motion.button
              className={`flex-1 py-4 rounded-2xl font-semibold text-[17px] flex items-center justify-center gap-2 transition-all ${
                isMyTurn && selectedCards.length > 0
                  ? "bg-ios-blue text-white shadow-float"
                  : "bg-ios-gray-500/50 text-white/30 cursor-not-allowed"
              }`}
              onClick={playCards}
              disabled={!isMyTurn || selectedCards.length === 0 || isLoading}
              whileTap={isMyTurn && selectedCards.length > 0 ? { scale: 0.98 } : undefined}
            >
              <span className="text-xl">🎯</span>
              <span>出牌</span>
              {selectedCards.length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-[13px]">
                  {selectedCards.length}
                </span>
              )}
            </motion.button>

            <motion.button
              className={`flex-1 py-4 rounded-2xl font-semibold text-[17px] flex items-center justify-center gap-2 transition-all ${
                isMyTurn && room.trick?.lastPlay
                  ? "bg-ios-gray-500/70 text-white border border-white/10"
                  : "bg-ios-gray-500/30 text-white/30 cursor-not-allowed"
              }`}
              onClick={pass}
              disabled={!isMyTurn || !room.trick?.lastPlay || isLoading}
              whileTap={isMyTurn && room.trick?.lastPlay ? { scale: 0.98 } : undefined}
            >
              <span className="text-xl">⏭️</span>
              <span>跳过</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
