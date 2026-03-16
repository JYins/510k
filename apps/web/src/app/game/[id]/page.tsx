"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useGameActions } from "@/hooks/useGameActions";
import { PlayerBadge } from "@/components/ui/PlayerBadge";
import { TrickArea } from "@/components/game/TrickArea";
import { ActionBar } from "@/components/game/ActionBar";
import { CardGroup, HandInfo } from "@/components/game/CardGroup";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Card, Player } from "@/types/game";

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
  };
  deck: Array<{ id: string; rank: string; suit?: string }>;
  hands: Record<string, Array<{ id: string; rank: string; suit?: string }>>;
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
    id: p.uid,
    uid: p.uid,
    name: p.displayName ?? `玩家${index + 1}`,
    seat: p.seat,
    score: p.score,
    isHost: index === 0,
    isReady: true,
    cardCount: 0,
    emoji: ["😎", "🤠", "🧑‍💻", "🦊", "🐱"][index % 5],
    isOnline: true,
    joinedAt: 0,
  };
}

export default function GamePage() {
  const params = useParams();
  const roomId = params.id as string;
  const router = useRouter();
  const { user, userProfile } = useAuth();

  const [fbRoom, setFbRoom] = useState<FirebaseRoom | null>(null);
  const [loading, setLoading] = useState(true);

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

  const myUid = user?.uid ?? "";

  const players = useMemo(() =>
    (fbRoom?.players ?? []).map((p, i) => {
      const mapped = toPlayer(p, i);
      if (p.uid === myUid && userProfile) {
        mapped.name = userProfile.displayName;
        mapped.emoji = userProfile.avatar;
      }
      return mapped;
    }), [fbRoom, myUid, userProfile]);

  const currentTurnUid = useMemo(() => {
    if (!fbRoom) return "";
    const p = fbRoom.players.find((p) => p.seat === fbRoom.currentTurnSeat);
    return p?.uid ?? "";
  }, [fbRoom]);

  const isMyTurn = currentTurnUid === myUid;
  const myHand = useMemo(() =>
    (fbRoom?.hands?.[myUid] ?? []).map(toCard), [fbRoom, myUid]);

  const trickForUI = useMemo(() => {
    if (!fbRoom?.trick) return null;
    const t = fbRoom.trick;
    return {
      leaderId: fbRoom.players.find((p) => p.seat === t.leaderSeat)?.uid ?? "",
      leaderSeat: t.leaderSeat,
      plays: [],
      lastPlay: t.lastPlay ? {
        playerId: fbRoom.players.find((p) => p.seat === t.lastPlay!.seat)?.uid ?? "",
        seat: t.lastPlay.seat,
        cards: t.lastPlay.cards.map(toCard),
        timestamp: 0,
        playType: "single" as const,
      } : null,
      passes: t.passes,
      points: 0,
      pile: t.pile.map(toCard),
    };
  }, [fbRoom]);

  const deckCount = fbRoom?.deck?.length ?? 0;

  const myPlayer = players.find((p) => p.uid === myUid) ?? {
    id: myUid, uid: myUid, name: userProfile?.displayName ?? "我",
    seat: 0, score: 0, isHost: false, isReady: true, cardCount: 0,
    emoji: userProfile?.avatar ?? "😎", isOnline: true, joinedAt: 0,
  };

  const {
    selectedCards, isLoading, error, toggleCard, playCards, pass,
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
      <div
        className="flex items-center px-5 flex-shrink-0"
        style={{ height: 48, paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <motion.button
          className="w-9 h-9 rounded-full flex items-center justify-center text-white/60"
          onClick={() => router.push("/")}
          whileTap={{ scale: 0.88 }}
        >
          <ArrowLeft className="w-[20px] h-[20px]" strokeWidth={2} />
        </motion.button>
      </div>

      <div className="flex justify-center items-start gap-5 px-4 pt-2 pb-4 flex-shrink-0">
        {players.map((player, i) => (
          <PlayerBadge
            key={player.id}
            player={player}
            isCurrentTurn={player.uid === currentTurnUid}
            isMe={player.uid === myUid}
            index={i}
          />
        ))}
      </div>

      <div className="flex-1 flex items-center justify-center px-4 min-h-0">
        <TrickArea
          trick={trickForUI}
          deckCount={deckCount}
          totalSlots={5}
        />
      </div>

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

      <div className="px-5 py-2 flex-shrink-0">
        <ActionBar
          onPlay={playCards}
          onPass={pass}
          canPlay={isMyTurn && selectedCards.length > 0}
          canPass={isMyTurn && !!trickForUI?.lastPlay}
          selectedCount={selectedCards.length}
          isLoading={isLoading}
          isMyTurn={isMyTurn}
        />
      </div>

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
    </div>
  );
}
