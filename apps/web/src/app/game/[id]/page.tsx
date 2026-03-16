"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useGameActions } from "@/hooks/useGameActions";
import { PlayerBadge } from "@/components/ui/PlayerBadge";
import { TrickArea } from "@/components/game/TrickArea";
import { ActionBar } from "@/components/game/ActionBar";
import { CardGroup, HandInfo } from "@/components/game/CardGroup";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Card, Player } from "@/types/game";

interface FirebaseTrickPlay {
  seat: number;
  cards: Array<{ id: string; rank: string; suit?: string }>;
  type: "play" | "pass";
}

interface FirebaseRoom {
  roomId: string;
  status: string;
  maxPlayers: number;
  players: Array<{ uid: string; seat: number; displayName?: string; score: number }>;
  currentTurnSeat: number;
  trick: {
    leaderSeat: number;
    lastPlay?: { seat: number; cards: Array<{ id: string; rank: string; suit?: string }> } | null;
    passes: number;
    pile: Array<{ id: string; rank: string; suit?: string }>;
    plays?: FirebaseTrickPlay[];
  };
  deck: Array<{ id: string; rank: string; suit?: string }>;
  hands: Record<string, Array<{ id: string; rank: string; suit?: string }>>;
  lastTrickResult?: {
    winnerSeat: number;
    points: number;
    pile: Array<{ id: string; rank: string; suit?: string }>;
    timestamp: number;
  };
}

const RANK_VALUE: Record<string, number> = {
  "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10,
  J: 11, Q: 12, K: 13, A: 14, "2": 15, "3": 16, SJ: 17, BJ: 18,
};

function toCard(c: { id: string; rank: string; suit?: string }): Card {
  return {
    id: c.id,
    rank: c.rank as Card["rank"],
    suit: (c.suit ?? null) as Card["suit"],
    value: RANK_VALUE[c.rank] ?? 0,
  };
}

function toPlayer(p: { uid: string; seat: number; displayName?: string; score: number }, index: number): Player {
  return {
    id: p.uid, uid: p.uid,
    name: p.displayName ?? `玩家${index + 1}`,
    seat: p.seat, score: p.score,
    isHost: index === 0, isReady: true, cardCount: 0,
    emoji: ["😎", "🤠", "🧑‍💻", "🦊", "🐱"][index % 5],
    isOnline: true, joinedAt: 0,
  };
}

export default function GamePage() {
  const params = useParams();
  const roomId = params.id as string;
  const router = useRouter();
  const { user, userProfile } = useAuth();

  const [fbRoom, setFbRoom] = useState<FirebaseRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showTrickEnd, setShowTrickEnd] = useState(false);
  const lastTrickTimestamp = useRef(0);

  useEffect(() => {
    if (!roomId) return;
    const unsub = onSnapshot(
      doc(db, "rooms", roomId),
      (snap) => {
        if (snap.exists()) setFbRoom(snap.data() as FirebaseRoom);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [roomId]);

  // Detect trick end for animation
  useEffect(() => {
    if (!fbRoom?.lastTrickResult) return;
    const ts = fbRoom.lastTrickResult.timestamp;
    if (ts > lastTrickTimestamp.current) {
      lastTrickTimestamp.current = ts;
      setShowTrickEnd(true);
      const timer = setTimeout(() => setShowTrickEnd(false), 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [fbRoom?.lastTrickResult]);

  // Navigate to result when game ends
  useEffect(() => {
    if (fbRoom?.status === "ended") {
      const timer = setTimeout(() => router.push(`/game/${roomId}/result`), 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [fbRoom?.status, roomId, router]);

  const myUid = user?.uid ?? "";

  const players = useMemo(() =>
    (fbRoom?.players ?? []).map((p, i) => {
      const mapped = toPlayer(p, i);
      if (p.uid === myUid && userProfile) {
        mapped.name = userProfile.displayName;
        mapped.emoji = userProfile.avatar;
      }
      mapped.cardCount = (fbRoom?.hands?.[p.uid] ?? []).length;
      return mapped;
    }), [fbRoom, myUid, userProfile]);

  const playerNames = useMemo(() => {
    const map: Record<number, string> = {};
    players.forEach((p) => { map[p.seat] = p.name; });
    return map;
  }, [players]);

  const currentTurnUid = useMemo(() => {
    if (!fbRoom) return "";
    return fbRoom.players.find((p) => p.seat === fbRoom.currentTurnSeat)?.uid ?? "";
  }, [fbRoom]);

  const isMyTurn = currentTurnUid === myUid;
  const myHand = useMemo(() =>
    (fbRoom?.hands?.[myUid] ?? []).map(toCard), [fbRoom, myUid]);

  const trickPlays = useMemo(() => {
    if (!fbRoom?.trick?.plays) return [];
    return fbRoom.trick.plays.map((p) => ({
      seat: p.seat,
      cards: p.cards.map(toCard),
      type: p.type,
    }));
  }, [fbRoom]);

  const trickResult = useMemo(() => {
    if (!showTrickEnd || !fbRoom?.lastTrickResult) return null;
    return {
      winnerSeat: fbRoom.lastTrickResult.winnerSeat,
      points: fbRoom.lastTrickResult.points,
    };
  }, [showTrickEnd, fbRoom?.lastTrickResult]);

  const deckCount = fbRoom?.deck?.length ?? 0;

  const myPlayer = players.find((p) => p.uid === myUid) ?? {
    id: myUid, uid: myUid, name: userProfile?.displayName ?? "我",
    seat: 0, score: 0, isHost: false, isReady: true, cardCount: 0,
    emoji: userProfile?.avatar ?? "😎", isOnline: true, joinedAt: 0,
  };

  const {
    selectedCards, isLoading, error, toggleCard, playCards, pass, leaveGame,
  } = useGameActions({ roomId });

  const selectedCardObjects = useMemo(
    () => myHand.filter((c) => selectedCards.includes(c.id)),
    [myHand, selectedCards]
  );

  const detectedPlayType = useMemo(() => {
    const n = selectedCardObjects.length;
    if (n === 0) return undefined;
    if (n === 1) return "single";
    if (n === 2 && selectedCardObjects[0].rank === selectedCardObjects[1].rank) return "pair";
    if (n === 3) {
      const ranks = selectedCardObjects.map((c) => c.rank);
      if (ranks.every((r) => r === ranks[0])) return "triple";
    }
    if (n === 4) {
      const ranks = selectedCardObjects.map((c) => c.rank);
      if (ranks.every((r) => r === ranks[0])) return "bomb";
    }
    if (n >= 5) return "straight";
    return undefined;
  }, [selectedCardObjects]);

  const handleExitConfirm = useCallback(async () => {
    setShowExitDialog(false);
    try {
      await leaveGame();
    } catch {
      // best-effort
    }
    router.push("/");
  }, [router, leaveGame]);

  if (loading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-black">
        <motion.div
          className="w-8 h-8 border-2 border-white/20 border-t-white/70 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  if (!fbRoom || fbRoom.status !== "playing") {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-black gap-4">
        <p className="text-white/50 text-[17px]">游戏未开始</p>
        <button className="text-ios-blue text-[15px]" onClick={() => router.push("/")}>
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-black text-white overflow-hidden select-none">
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-5 flex-shrink-0"
        style={{ height: 48, paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <motion.button
          className="w-9 h-9 rounded-full flex items-center justify-center text-white/60"
          onClick={() => setShowExitDialog(true)}
          whileTap={{ scale: 0.88 }}
        >
          <ArrowLeft className="w-[20px] h-[20px]" strokeWidth={2} />
        </motion.button>

        <span className="text-[13px] text-white/40 font-medium">
          {roomId}
        </span>

        <div className="w-9" />
      </div>

      {/* Player badges */}
      <div className="flex justify-center items-start gap-4 px-3 pt-1 pb-3 flex-shrink-0">
        {players.map((player, i) => (
          <div key={player.id} className="flex flex-col items-center gap-0.5">
            <PlayerBadge
              player={player}
              isCurrentTurn={player.uid === currentTurnUid}
              isMe={player.uid === myUid}
              index={i}
            />
            <span className="text-[11px] text-white/30 tabular-nums">
              {player.cardCount}张
            </span>
          </div>
        ))}
      </div>

      {/* Main trick area */}
      <div className="flex-1 flex items-center justify-center px-4 min-h-0 relative">
        <TrickArea
          plays={trickPlays}
          deckCount={deckCount}
          trickResult={trickResult}
          playerNames={playerNames}
        />
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="mx-6 mb-2 px-4 py-2.5 rounded-2xl bg-red-500/15 border border-red-500/20"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            <span className="text-[13px] text-red-400">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action bar */}
      <div className="px-5 py-2 flex-shrink-0">
        <ActionBar
          onPlay={playCards}
          onPass={pass}
          canPlay={isMyTurn && selectedCards.length > 0}
          canPass={isMyTurn && !!fbRoom.trick.lastPlay}
          selectedCount={selectedCards.length}
          isLoading={isLoading}
          isMyTurn={isMyTurn}
        />
      </div>

      {/* My hand */}
      <div className="flex-shrink-0 px-2 pb-2" style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)" }}>
        <AnimatePresence>
          {selectedCardObjects.length > 0 && (
            <motion.div
              className="px-3 pb-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <HandInfo
                selectedCards={selectedCardObjects}
                playType={detectedPlayType}
                player={myPlayer}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <CardGroup
          cards={myHand}
          selectedCards={selectedCards}
          onToggleCard={toggleCard}
          isMyTurn={isMyTurn}
        />
      </div>

      {/* Exit confirmation dialog */}
      <AnimatePresence>
        {showExitDialog && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowExitDialog(false)}
          >
            <motion.div
              className="bg-[#1c1c1e] rounded-3xl p-6 mx-6 max-w-sm w-full border border-white/10 shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-5">
                <LogOut className="w-10 h-10 text-ios-red mx-auto mb-3" />
                <h3 className="text-[18px] font-bold text-white">退出对局？</h3>
                <p className="text-[14px] text-white/50 mt-2">
                  你目前的得分是 <span className="text-white font-semibold">{myPlayer.score} 分</span>。
                  退出后分数仍会结算到总榜单。
                </p>
              </div>

              <div className="space-y-2">
                <motion.button
                  className="w-full py-3.5 rounded-2xl bg-ios-red text-white font-semibold text-[15px]"
                  onClick={handleExitConfirm}
                  whileTap={{ scale: 0.97 }}
                >
                  确认退出
                </motion.button>
                <motion.button
                  className="w-full py-3.5 rounded-2xl bg-white/10 text-white font-medium text-[15px]"
                  onClick={() => setShowExitDialog(false)}
                  whileTap={{ scale: 0.97 }}
                >
                  继续游戏
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
