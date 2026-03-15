/**
 * Auth Hook
 *
 * Handles anonymous authentication for the game.
 * Firebase Auth is used to create persistent player sessions.
 */

"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  uid: string;
  isAnonymous: boolean;
}

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for anonymous authentication
 *
 * TODO: Replace with Firebase Auth:
 * 1. Import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'
 * 2. Initialize auth and sign in anonymously
 * 3. Listen to auth state changes
 */
export function useAuth(enableMock = true): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (enableMock) {
      // Mock auth - simulate anonymous user
      const timer = setTimeout(() => {
        setUser({
          id: "player-1",
          uid: "mock-uid-" + Math.random().toString(36).substr(2, 9),
          isAnonymous: true,
        });
        setIsLoading(false);
      }, 300);

      return () => clearTimeout(timer);
    }

    // TODO: Firebase Auth implementation
    /*
    import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          isAnonymous: firebaseUser.isAnonymous,
        });
      } else {
        // Sign in anonymously if not authenticated
        signInAnonymously(auth).catch((err) => {
          setError(err.message);
        });
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
    */

    return undefined;
  }, [enableMock]);

  return { user, isLoading, error };
}
