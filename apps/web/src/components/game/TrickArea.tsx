"use client";

import { motion, AnimatePresence } from "framer-motion";
import { PlayingCard } from "@/components/ui/PlayingCard";
import { Card } from "@/types/game";

interface TrickPlay {
  seat: number;
  cards: Card[];
  type: "play" | "pass";
  playerName?: string;
}

interface TrickResult {
  winnerSeat: number;
  points: number;
}

interface TrickAreaProps {
  plays: TrickPlay[];
  deckCount: number;
  trickResult: TrickResult | null;
  playerNames: Record<number, string>;
}

const SPRING = { type: "spring" as const, stiffness: 300, damping: 25 };

export function TrickArea({
  plays,
  deckCount,
  trickResult,
  playerNames,
}: TrickAreaProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full gap-3">
      {/* Deck indicator */}
      <div className="flex items-center gap-2 mb-1">
        <div className="relative w-8 h-10">
          {deckCount > 0 && (
            <>
              <div className="absolute inset-0 rounded-md bg-white/5 border border-white/10" style={{ transform: "translate(2px, 2px)" }} />
              <div className="absolute inset-0 rounded-md bg-white/8 border border-white/10" style={{ transform: "translate(1px, 1px)" }} />
              <div className="absolute inset-0 rounded-md bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-white/15 flex items-center justify-center">
                <span className="text-[11px] font-bold text-white/80">{deckCount}</span>
              </div>
            </>
          )}
          {deckCount === 0 && (
            <div className="absolute inset-0 rounded-md border border-dashed border-white/10 flex items-center justify-center">
              <span className="text-[9px] text-white/20">空</span>
            </div>
          )}
        </div>
        <span className="text-[12px] text-white/40">
          {deckCount > 0 ? `剩余 ${deckCount} 张` : "牌堆已空"}
        </span>
      </div>

      {/* Trick result overlay */}
      <AnimatePresence>
        {trickResult && (
          <motion.div
            className="absolute z-20 bg-black/80 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10 text-center"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={SPRING}
          >
            <p className="text-[13px] text-white/50">本墩结束</p>
            <p className="text-[20px] font-bold text-white mt-1">
              {playerNames[trickResult.winnerSeat] ?? `座位${trickResult.winnerSeat + 1}`} 赢得本墩
            </p>
            {trickResult.points > 0 && (
              <p className="text-[16px] text-ios-green font-semibold mt-1">
                +{trickResult.points} 分
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play rows - each player's action is one row */}
      <div className="w-full space-y-2 max-h-[200px] overflow-y-auto px-2">
        {plays.length === 0 && (
          <div className="flex items-center justify-center py-6">
            <span className="text-[13px] text-white/20">等待出牌...</span>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {plays.map((play, i) => (
            <motion.div
              key={`play-${i}`}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl bg-white/[0.03]"
              initial={{ opacity: 0, x: -15, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ ...SPRING, delay: i * 0.04 }}
              layout
            >
              {/* Player tag */}
              <span className="text-[12px] font-medium text-white/50 w-12 shrink-0 truncate">
                {playerNames[play.seat] ?? `P${play.seat + 1}`}
              </span>

              {play.type === "pass" ? (
                <span className="text-[13px] text-white/25 italic">跳过</span>
              ) : (
                <div className="flex items-center gap-[3px] flex-wrap">
                  {play.cards.map((card, j) => (
                    <PlayingCard
                      key={card.id}
                      card={card}
                      size="sm"
                      disabled
                      index={j}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
