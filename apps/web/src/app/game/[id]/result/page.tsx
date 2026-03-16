"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ResultPage() {
  const params = useParams();
  const roomId = params.id as string;
  const router = useRouter();
  const [players, setPlayers] = useState<Array<{ uid: string; displayName?: string; score: number; seat: number }>>([]);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, "rooms", roomId));
        if (snap.exists()) {
          const data = snap.data();
          setPlayers(
            [...(data.players ?? [])].sort((a: { score: number }, b: { score: number }) => b.score - a.score)
          );
        }
      } catch {
        // ignore
      }
    }
    load();
  }, [roomId]);

  const medals = ["🥇", "🥈", "🥉", "4th"];

  return (
    <div className="min-h-screen bg-black flex flex-col overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-ios-purple/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-ios-blue/20 rounded-full blur-[120px]" />
      </div>

      <div className="flex-1 flex flex-col max-w-md mx-auto w-full px-6 relative z-10 pt-16">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-[28px] font-bold text-white">游戏结束</h1>
        </motion.div>

        <div className="space-y-3 mb-8">
          {players.map((p, i) => (
            <motion.div
              key={p.uid}
              className="bg-ios-gray-500/40 backdrop-blur-ios rounded-2xl p-4 border border-white/5 flex items-center gap-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <span className="text-[24px] w-10 text-center">{medals[i] ?? ""}</span>
              <div className="flex-1">
                <span className="text-white font-semibold">{p.displayName ?? `玩家${i + 1}`}</span>
              </div>
              <span className="text-[20px] font-bold text-white tabular-nums">{p.score}</span>
            </motion.div>
          ))}
        </div>

        <div className="space-y-3">
          <motion.button
            className="w-full py-4 rounded-2xl bg-ios-blue text-white font-semibold text-[17px]"
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push(`/room/${roomId}`)}
          >
            再来一局
          </motion.button>
          <motion.button
            className="w-full py-3 rounded-2xl bg-ios-gray-500/40 text-white/60 font-medium border border-white/5"
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/")}
          >
            返回首页
          </motion.button>
        </div>
      </div>
    </div>
  );
}
