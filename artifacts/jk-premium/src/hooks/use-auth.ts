import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export type AppUser = {
  id: string;
  username: string;
  balance: number;
  createdAt: string;
};

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem("jkp_user");
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
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setFirebaseReady(true);
      if (!firebaseUser) {
        setUser(null);
        localStorage.removeItem("jkp_user");
      }
    });
    return unsub;
  }, []);

  const saveUser = (newUser: AppUser | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem("jkp_user", JSON.stringify(newUser));
    } else {
      localStorage.removeItem("jkp_user");
      firebaseSignOut(auth).catch(() => {});
    }
  };

  return { user, saveUser, firebaseReady };
}
