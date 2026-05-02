"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("user");
    if (!stored) return null;
    try {
      return JSON.parse(stored) as User;
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });
  const isLoading = false;

  const login = useCallback((user: User) => {
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  const updateUser = useCallback((user: User) => {
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
