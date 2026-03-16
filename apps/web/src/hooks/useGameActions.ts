"use client";

import { useState, useCallback } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

interface UseGameActionsOptions {
  roomId: string;
}

interface UseGameActionsReturn {
  selectedCards: string[];
  isLoading: boolean;
  error: string | null;
  toggleCard: (cardId: string) => void;
  clearSelection: () => void;
  selectCards: (cardIds: string[]) => void;
  playCards: () => Promise<void>;
  pass: () => Promise<void>;
}

export function useGameActions({ roomId }: UseGameActionsOptions): UseGameActionsReturn {
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCard = useCallback((cardId: string) => {
    setSelectedCards((prev) =>
      prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : [...prev, cardId]
    );
  }, []);

  const clearSelection = useCallback(() => setSelectedCards([]), []);
  const selectCards = useCallback((ids: string[]) => setSelectedCards(ids), []);

  const playCards = useCallback(async () => {
    if (selectedCards.length === 0) return;
    setIsLoading(true);
    setError(null);
    try {
      const fn = httpsCallable(functions, "play");
      await fn({ roomId, cardIds: selectedCards });
      setSelectedCards([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "出牌失败");
    } finally {
      setIsLoading(false);
    }
  }, [roomId, selectedCards]);

  const pass = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fn = httpsCallable(functions, "pass");
      await fn({ roomId });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  return {
    selectedCards,
    isLoading,
    error,
    toggleCard,
    clearSelection,
    selectCards,
    playCards,
    pass,
  };
}
