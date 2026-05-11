import { useState } from "react";

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

  const saveUser = (newUser: AppUser | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem("jkp_user", JSON.stringify(newUser));
    } else {
      localStorage.removeItem("jkp_user");
    }
  };

  return { user, saveUser, firebaseReady: true };
}
