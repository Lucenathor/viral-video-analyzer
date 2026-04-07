import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

type AuthUser = {
  id: number;
  name: string | null;
  email: string | null;
  role: string;
  openId: string;
};

function parseAuthUser(data: unknown): AuthUser | null {
  if (!data || typeof data !== "object") return null;

  if ("user" in data) {
    const nestedUser = (data as { user?: unknown }).user;
    return parseAuthUser(nestedUser);
  }

  if (!("id" in data)) return null;

  const candidate = data as Partial<AuthUser>;
  if (typeof candidate.id !== "number") return null;

  return {
    id: candidate.id,
    name: typeof candidate.name === "string" ? candidate.name : null,
    email: typeof candidate.email === "string" ? candidate.email : null,
    role: typeof candidate.role === "string" ? candidate.role : "user",
    openId: typeof candidate.openId === "string" ? candidate.openId : "",
  };
}

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

// Simple auth hook that uses direct /api/auth/* endpoints instead of tRPC
// This avoids the tRPC streaming issue where cookies can't be set
export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/login" } =
    options ?? {};
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [fetchCount, setFetchCount] = useState(0);

  // Fetch current user on mount and when fetchCount changes
  useEffect(() => {
    let cancelled = false;
    
    async function fetchMe() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });
        if (!response.ok) {
          setUser(null);
          localStorage.removeItem("manus-runtime-user-info");
          return;
        }
        const data = await response.json();
        if (!cancelled) {
          const u = parseAuthUser(data);
          setUser(u);
          if (u) {
            localStorage.setItem("manus-runtime-user-info", JSON.stringify(u));
          } else {
            localStorage.removeItem("manus-runtime-user-info");
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err);
          setUser(null);
          localStorage.removeItem("manus-runtime-user-info");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchMe();
    return () => { cancelled = true; };
  }, [fetchCount]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore errors during logout
    } finally {
      setUser(null);
      localStorage.removeItem("manus-runtime-user-info");
      window.location.href = "/login";
    }
  }, []);

  const refresh = useCallback(() => {
    setFetchCount(c => c + 1);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleWindowFocus = () => {
      setFetchCount(c => c + 1);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      setFetchCount(c => c + 1);
    };

    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("pageshow", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("pageshow", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const state = useMemo(() => ({
    user,
    loading,
    error,
    isAuthenticated: Boolean(user && user.id),
  }), [user, loading, error]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (loading) return;
    if (user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === "/login") return;

    setLocation(redirectPath);
  }, [redirectOnUnauthenticated, redirectPath, loading, user, setLocation]);

  return {
    ...state,
    refresh,
    logout,
  };
}
