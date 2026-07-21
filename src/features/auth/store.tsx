"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
}

interface AuthValue {
  user: AppUser | null;
  ready: boolean;
  isAdmin: boolean;
  login: (email: string) => AppUser;
  loginGoogle: () => AppUser;
  loginDemo: () => AppUser;
  logout: () => void;
  updateUser: (patch: Partial<Pick<AppUser, "name" | "email">>) => void;
}

const STORAGE_KEY = "tripmind.user.v1";
const AuthContext = createContext<AuthValue | null>(null);

/** Emails that get the admin role in demo mode. */
const ADMIN_HINTS = ["admin@tripmind.app", "141nw9@gmail.com"];

function makeUser(email: string, name?: string): AppUser {
  const role: AppUser["role"] =
    ADMIN_HINTS.includes(email.toLowerCase()) || email.toLowerCase().startsWith("admin")
      ? "admin"
      : "user";
  return {
    id: `usr-${email.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || "guest"}`,
    email,
    name: name ?? email.split("@")[0] ?? "مسافر",
    role,
  };
}

/**
 * Mock auth provider. Persists a demo user in localStorage. Structured so the
 * real Supabase Auth session can drop in behind the same interface later.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw) as AppUser);
    } catch {
      /* ignore */
    } finally {
      setReady(true);
    }
  }, []);

  const persist = useCallback((next: AppUser | null) => {
    setUser(next);
    try {
      if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const login = useCallback((email: string) => {
    const u = makeUser(email);
    persist(u);
    return u;
  }, [persist]);

  const loginGoogle = useCallback(() => {
    const u = makeUser("guest@gmail.com", "مستخدم جوجل");
    persist(u);
    return u;
  }, [persist]);

  const loginDemo = useCallback(() => {
    const u = makeUser("demo@tripmind.app", "ضيف تجريبي");
    persist(u);
    return u;
  }, [persist]);

  const logout = useCallback(() => persist(null), [persist]);

  const updateUser = useCallback<AuthValue["updateUser"]>(
    (patch) => setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    }),
    [],
  );

  const value = useMemo<AuthValue>(
    () => ({ user, ready, isAdmin: user?.role === "admin", login, loginGoogle, loginDemo, logout, updateUser }),
    [user, ready, login, loginGoogle, loginDemo, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
