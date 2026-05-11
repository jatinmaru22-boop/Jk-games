import { useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type AppUser = {
  uid: string;
  id: string;
  username: string;
  balance: number;
  jkId: string;
  createdAt: string;
  isGuest?: boolean;
};

function generateJKId(uid: string): string {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = (hash * 31 + uid.charCodeAt(i)) & 0xffff;
  }
  return "JK-" + String((hash % 9000) + 1000);
}

const GUEST_KEY = "jkp_guest_user";

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem(GUEST_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [firebaseReady, setFirebaseReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        localStorage.removeItem(GUEST_KEY);
        try {
          const snap = await getDoc(doc(db, "users", firebaseUser.uid));
          if (snap.exists()) {
            const data = snap.data();
            setUser({
              uid: firebaseUser.uid,
              id: firebaseUser.uid,
              username: data.username,
              balance: data.balance,
              jkId: data.jkId,
              createdAt: data.createdAt,
              isGuest: false,
            });
          }
        } catch (e) {
          console.error("Failed to load user from Firestore", e);
        }
      } else {
        const saved = localStorage.getItem(GUEST_KEY);
        if (saved) {
          try {
            setUser(JSON.parse(saved));
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setFirebaseReady(true);
    });
    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;
    const jkId = generateJKId(uid);
    const userData = {
      username,
      balance: 50,
      jkId,
      email,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "users", uid), userData);
    setUser({ uid, id: uid, ...userData, isGuest: false });
  };

  const signIn = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, "users", cred.user.uid));
    if (snap.exists()) {
      const data = snap.data();
      setUser({
        uid: cred.user.uid,
        id: cred.user.uid,
        username: data.username,
        balance: data.balance,
        jkId: data.jkId,
        createdAt: data.createdAt,
        isGuest: false,
      });
    }
  };

  const logout = async () => {
    if (user?.isGuest) {
      localStorage.removeItem(GUEST_KEY);
      setUser(null);
    } else {
      await signOut(auth);
      setUser(null);
    }
  };

  const saveUser = (newUser: AppUser | null) => {
    setUser(newUser);
    if (newUser?.isGuest) {
      localStorage.setItem(GUEST_KEY, JSON.stringify(newUser));
    }
  };

  const updateLocalBalance = (delta: number) => {
    setUser((prev) => {
      if (!prev) return prev;
      const newBalance = Math.max(0, prev.balance + delta);
      if (!prev.isGuest) {
        updateDoc(doc(db, "users", prev.uid), { balance: newBalance }).catch(
          (e) => console.error("Firestore balance update failed", e)
        );
      } else {
        const updated = { ...prev, balance: newBalance };
        localStorage.setItem(GUEST_KEY, JSON.stringify(updated));
      }
      return { ...prev, balance: newBalance };
    });
  };

  return {
    user,
    firebaseReady,
    signUp,
    signIn,
    logout,
    saveUser,
    updateLocalBalance,
  };
}
