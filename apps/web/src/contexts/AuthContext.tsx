"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface UserProfile {
  uid: string;
  displayName: string;
  avatar: string;
  email: string;
  totalScore: number;
  gamesPlayed: number;
  gamesWon: number;
  createdAt: number;
}

interface AuthContextValue {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string, avatar: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const googleProvider = new GoogleAuthProvider();

const AuthContext = createContext<AuthContextValue>({
  user: null,
  userProfile: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

async function fetchProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { uid, ...snap.data() } as UserProfile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const profile = await fetchProfile(firebaseUser.uid).catch(() => null);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, displayName: string, avatar: string) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const profile: Omit<UserProfile, "uid"> = {
        displayName,
        avatar,
        email,
        totalScore: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        createdAt: Date.now(),
      };
      await setDoc(doc(db, "users", cred.user.uid), profile);
      setUserProfile({ uid: cred.user.uid, ...profile });
    },
    []
  );

  const signIn = useCallback(async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const profile = await fetchProfile(cred.user.uid);
    setUserProfile(profile);
  }, []);

  const signInWithGoogleFn = useCallback(async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    const existing = await fetchProfile(cred.user.uid).catch(() => null);
    if (!existing) {
      const randomAvatars = ["😎", "🤠", "🧑‍💻", "🦊", "🐱", "🐼", "🦄", "🐸", "🤖", "👻"];
      const profile: Omit<UserProfile, "uid"> = {
        displayName: cred.user.displayName || "玩家",
        avatar: randomAvatars[Math.floor(Math.random() * randomAvatars.length)],
        email: cred.user.email || "",
        totalScore: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        createdAt: Date.now(),
      };
      await setDoc(doc(db, "users", cred.user.uid), profile);
      setUserProfile({ uid: cred.user.uid, ...profile });
    } else {
      setUserProfile(existing);
    }
  }, []);

  const signOutFn = useCallback(async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setUserProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, userProfile, loading, signUp, signIn, signInWithGoogle: signInWithGoogleFn, signOut: signOutFn }}
    >
      {children}
    </AuthContext.Provider>
  );
}
