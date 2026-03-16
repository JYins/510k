"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface LeaderEntry {
  uid: string;
  displayName: string;
  avatar: string;
  totalScore: number;
  gamesWon: number;
  gamesPlayed: number;
}

export function ScoreBoard() {
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchLeaderboard() {
      try {
        const { db } = await import("@/lib/firebase");
        const { collection, query, orderBy, limit, getDocs } = await import("firebase/firestore");
        const q = query(
          collection(db, "users"),
          orderBy("totalScore", "desc"),
          limit(10)
        );
        const snap = await getDocs(q);
        if (cancelled) return;
        const entries: LeaderEntry[] = snap.docs.map((doc) => ({
          uid: doc.id,
          displayName: doc.data().displayName ?? "???",
          avatar: doc.data().avatar ?? "🎭",
          totalScore: doc.data().totalScore ?? 0,
          gamesWon: doc.data().gamesWon ?? 0,
          gamesPlayed: doc.data().gamesPlayed ?? 0,
        }));
        setLeaders(entries);
      } catch {
        // Firebase not configured yet or no data
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchLeaderboard();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="bg-ios-gray-500/40 backdrop-blur-ios rounded-2xl p-5 border border-white/5 shadow-ios">
      <h3 className="text-[15px] font-semibold text-white mb-3">
        排行榜
      </h3>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <motion.div
            className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      ) : leaders.length === 0 ? (
        <p className="text-[13px] text-white/40 text-center py-4">
          暂无数据，快来成为第一名
        </p>
      ) : (
        <div className="space-y-2">
          {leaders.map((entry, i) => (
            <motion.div
              key={entry.uid}
              className="flex items-center gap-3 py-2 px-3 rounded-xl bg-ios-gray-600/30"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 25 }}
            >
              <span className="text-[13px] font-bold text-white/40 w-5 text-center tabular-nums">
                {i + 1}
              </span>
              <span className="text-[20px] leading-none select-none">{entry.avatar}</span>
              <div className="flex-1 min-w-0">
                <span className="text-[14px] font-medium text-white truncate block">
                  {entry.displayName}
                </span>
                <span className="text-[11px] text-white/40">
                  {entry.gamesWon}胜 / {entry.gamesPlayed}局
                </span>
              </div>
              <span className="text-[15px] font-semibold text-white tabular-nums">
                {entry.totalScore}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
