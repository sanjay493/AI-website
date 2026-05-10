"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getApiUrl } from "@/lib/api-base";
import { fetchMe, logoutRemote, refreshTokens } from "@/lib/auth-session";
import {
  clearTokens,
  getStoredAccess,
  getStoredRefresh,
  persistTokens,
} from "@/lib/auth-tokens";
import type { AuthUser } from "@/lib/auth-types";

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: {
    email: string;
    password: string;
    full_name?: string | null;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

async function bootstrapFromStorage(
  setUser: (u: AuthUser | null) => void,
  setAccess: (t: string | null) => void,
  setRefresh: (t: string | null) => void,
) {
  if (!getApiUrl()) {
    setUser(null);
    setAccess(null);
    setRefresh(null);
    return;
  }

  const access = getStoredAccess();
  const refresh = getStoredRefresh();
  if (!access && !refresh) {
    setUser(null);
    setAccess(null);
    setRefresh(null);
    return;
  }

  if (access) {
    try {
      const me = await fetchMe(access);
      setUser(me);
      setAccess(access);
      setRefresh(refresh);
      return;
    } catch {
      /* fallthrough to refresh */
    }
  }

  if (!refresh) {
    clearTokens();
    setUser(null);
    setAccess(null);
    setRefresh(null);
    return;
  }

  try {
    const pair = await refreshTokens(refresh);
    persistTokens(pair.access_token, pair.refresh_token);
    const me = await fetchMe(pair.access_token);
    setUser(me);
    setAccess(pair.access_token);
    setRefresh(pair.refresh_token);
  } catch {
    clearTokens();
    setUser(null);
    setAccess(null);
    setRefresh(null);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [refreshToken, setRefreshTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await bootstrapFromStorage(
        (u) => {
          if (!cancelled) setUser(u);
        },
        (a) => {
          if (!cancelled) setAccessTokenState(a);
        },
        (r) => {
          if (!cancelled) setRefreshTokenState(r);
        },
      );
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { loginAccount } = await import("@/lib/auth-credentials");
    const pair = await loginAccount({ email, password });
    persistTokens(pair.access_token, pair.refresh_token);
    const me = await fetchMe(pair.access_token);
    setAccessTokenState(pair.access_token);
    setRefreshTokenState(pair.refresh_token);
    setUser(me);
  }, []);

  const signUp = useCallback(
    async (input: {
      email: string;
      password: string;
      full_name?: string | null;
    }) => {
      const { registerAccount } = await import("@/lib/auth-credentials");
      const pair = await registerAccount(input);
      persistTokens(pair.access_token, pair.refresh_token);
      const me = await fetchMe(pair.access_token);
      setAccessTokenState(pair.access_token);
      setRefreshTokenState(pair.refresh_token);
      setUser(me);
    },
    [],
  );

  const signOut = useCallback(async () => {
    const access = accessToken ?? getStoredAccess();
    const refresh = refreshToken ?? getStoredRefresh();
    await logoutRemote(refresh ?? null, access);
    clearTokens();
    setAccessTokenState(null);
    setRefreshTokenState(null);
    setUser(null);
  }, [accessToken, refreshToken]);

  const refreshSession = useCallback(async () => {
    const refresh = refreshToken ?? getStoredRefresh();
    if (!refresh) {
      clearTokens();
      setAccessTokenState(null);
      setRefreshTokenState(null);
      setUser(null);
      return;
    }
    const pair = await refreshTokens(refresh);
    persistTokens(pair.access_token, pair.refresh_token);
    const me = await fetchMe(pair.access_token);
    setAccessTokenState(pair.access_token);
    setRefreshTokenState(pair.refresh_token);
    setUser(me);
  }, [refreshToken]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      accessToken,
      refreshToken,
      loading,
      signIn,
      signUp,
      signOut,
      refreshSession,
    }),
    [user, accessToken, refreshToken, loading, signIn, signUp, signOut, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
