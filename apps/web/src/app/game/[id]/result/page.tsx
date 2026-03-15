"use client";

import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ResultPanel } from "@/components/game/ResultPanel";
import { RoomHeader } from "@/components/layout/RoomHeader";
import { MOCK_ROOM_FINISHED } from "@/mocks/gameData";

export default function ResultPage() {
  const params = useParams();
  const roomId = params.id as string;
  const router = useRouter();

  // Mock data - replace with actual room data
  const room = MOCK_ROOM_FINISHED;

  const handlePlayAgain = () => {
    // Reset game and go back to room
    router.push(`/room/${roomId}`);
  };

  const handleHome = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <div className="fixed inset-0 bg-gradient-to-b from-bg-primary via-bg-secondary to-bg-tertiary -z-10" />

      <RoomHeader
        roomId={roomId}
        status="finished"
        onBack={() => router.push("/")}
      />

      <div className="flex-1 flex flex-col max-w-md mx-auto w-full px-4 py-6">
        {/* Page title */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-display text-text-primary">游戏结束</h1>
        </motion.div>

        {/* Result panel */}
        <ResultPanel
          players={room.players}
          onPlayAgain={handlePlayAgain}
          onHome={handleHome}
        />
      </div>
    </div>
  );
}
