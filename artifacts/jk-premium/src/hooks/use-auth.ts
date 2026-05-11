import { useState } from "react";

type User = {
  id: string;
  username: string;
  balance: number;
  createdAt: string;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("jkp_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const saveUser = (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem("jkp_user", JSON.stringify(newUser));
    } else {
      localStorage.removeItem("jkp_user");
    }
  };

  return { user, saveUser };
}
