"use client";

import { motion, AnimatePresence } from "framer-motion";
import { DeckPile, TableCard } from "@/components/ui/PlayingCard";
import { Trick, Player, calculatePoints } from "@/types/game";
import { getPlayerById } from "@/mocks/gameData";

interface TrickAreaProps {
  trick: Trick | null;
  players: Player[];
  currentTurnId: string;
  currentTurnSeat: number;
  mySeat: number;
  deckCount: number;
  roundPoints: number;
}

export function TrickArea({
  trick,
  players,
  currentTurnId,
  currentTurnSeat,
  mySeat,
  deckCount,
  roundPoints,
}: TrickAreaProps) {
  const currentPlayer = getPlayerById(players, currentTurnId);
  const isMyTurn = currentTurnSeat === mySeat;

  // Calculate relative position based on seat
  const getRelativePosition = (seat: number): string => {
    const diff = (seat - mySeat + 4) % 4;
    switch (diff) {
      case 0: return "self";
      case 1: return "right";
      case 2: return "opposite";
      case 3: return "left";
      default: return "";
    }
  };

  return (
    <div className="relative w-full aspect-[4/3] max-w-sm mx-auto">
      {/* Table felt background */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-bg-elevated to-bg-tertiary border border-white/5 shadow-elevated overflow-hidden">
        {/* Felt texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        {/* Inner border */}
        <div className="absolute inset-3 rounded-2xl border border-white/[0.03]" />
      </div>

      {/* Deck pile - top left */}
      <div className="absolute top-4 left-4">
        <DeckPile count={deckCount} size="sm" />
      </div>

      {/* Round points - top right */}
      <div className="absolute top-4 right-4">
        <div className="px-3 py-1.5 rounded-xl bg-surface/80 backdrop-blur-sm border border-white/5">
          <span className="text-xs text-text-tertiary block">本轮积分</span>
          <span className="text-lg font-bold text-warning">{roundPoints}</span>
        </div>
      </div>

      {/* Turn indicator */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2">
        <motion.div
          className={`
            px-4 py-1.5 rounded-full text-sm font-medium
            flex items-center gap-2
            ${isMyTurn
              ? "bg-success/20 text-success border border-success/30"
              : "bg-surface/80 text-text-secondary border border-white/5"
            }
          `}
          animate={isMyTurn ? {
            boxShadow: [
              "0 0 0 0 rgba(52, 199, 89, 0.2)",
              "0 0 0 8px rgba(52, 199, 89, 0)",
            ],
          } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className={`w-2 h-2 rounded-full ${isMyTurn ? "bg-success" : "bg-text-tertiary"}`} />
          <span>{isMyTurn ? "你的回合" : `${currentPlayer?.name || "玩家"}的回合`}</span>
        </motion.div>
      </div>

      {/* Center play area */}
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {trick?.lastPlay ? (
            <motion.div
              key={trick.lastPlay.playerId}
              className="flex flex-col items-center gap-3"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              {/* Player name */}
              <div className="px-3 py-1 rounded-full bg-accent/15 text-accent text-xs font-medium border border-accent/20">
                {getPlayerById(players, trick.lastPlay.playerId)?.name || "玩家"} 出牌
              </div>

              {/* Cards */}
              <div className="flex items-center justify-center gap-1">
                {trick.lastPlay.cards.map((card, index) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 20, rotateZ: -8 }}
                    animate={{ opacity: 1, y: 0, rotateZ: 0 }}
                    transition={{ delay: index * 0.05, type: "spring", stiffness: 400 }}
                  >
                    <TableCard card={card} size="md" />
                  </motion.div>
                ))}
              </div>

              {/* Play type hint */}
              <span className="text-xs text-text-tertiary">
                {getPlayTypeLabel(trick.lastPlay.playType)}
              </span>
            </motion.div>
          ) : (
            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {trick?.leaderSeat === mySeat ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center border border-accent/20">
                    <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="text-sm text-text-secondary">你是先手，请出牌</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center">
                    <svg className="w-8 h-8 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm text-text-secondary">
                    等待 {getPlayerById(players, trick?.leaderId || "")?.name || "玩家"} 出牌
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Player positions */}
      {players.filter(p => p.seat !== mySeat).map(player => {
        const position = getRelativePosition(player.seat);
        const positionClasses: Record<string, string> = {
          right: "top-1/2 right-2 -translate-y-1/2",
          opposite: "top-4 left-1/2 -translate-x-1/2",
          left: "top-1/2 left-2 -translate-y-1/2",
        };

        return (
          <motion.div
            key={player.id}
            className={`absolute ${positionClasses[position]}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div
              className={`
                flex flex-col items-center gap-1 px-3 py-2 rounded-xl
                ${currentTurnId === player.id
                  ? "bg-success/20 ring-1 ring-success/40"
                  : "bg-surface/80"
                }
                backdrop-blur-sm border border-white/5
              `}
            >
              <span className="text-xs font-medium text-text-primary">
                {player.name}
              </span>
              {currentTurnId === player.id && (
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function getPlayTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    single: "单张",
    pair: "对子",
    triple: "三张",
    straight: "顺子",
    bomb: "炸弹",
    pass: "跳过",
  };
  return labels[type] || type;
}
