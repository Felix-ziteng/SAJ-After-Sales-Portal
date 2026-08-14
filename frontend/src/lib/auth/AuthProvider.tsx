"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api/client";
import { clearMockUserEmail, setMockUserEmail } from "@/lib/auth/session";
import type { AuthenticatedUser } from "@/lib/types/auth";

interface AuthContextValue {
  user: AuthenticatedUser | null;
  loading: boolean;
  signInAs: (email: string) => Promise<void>;
  signOut: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const me = await apiFetch<AuthenticatedUser>("/api/auth/me");
      setUser(me);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null);
      } else {
        throw err;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetches the current session once on mount. Owns its own state updates (rather than
  // delegating to `refresh`, which is also called imperatively from `signInAs`) so this
  // effect can guard against setting state after unmount.
  useEffect(() => {
    let cancelled = false;

    apiFetch<AuthenticatedUser>("/api/auth/me")
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch((err) => {
        if (cancelled) return;
        if (!(err instanceof ApiError) || err.status !== 401) {
          console.error(err);
        }
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const signInAs = useCallback(
    async (email: string) => {
      setMockUserEmail(email);
      await refresh();
    },
    [refresh],
  );

  const signOut = useCallback(() => {
    clearMockUserEmail();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signInAs, signOut, refresh }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
