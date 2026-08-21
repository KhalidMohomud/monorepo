"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { apiRequest } from "@/lib/api";
import type { AuthUser } from "@/lib/types";

const TOKEN_STORAGE_KEY = "merhaba-access-token";

type AuthContextValue = {
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  status: "loading" | "authenticated" | "unauthenticated";
  token: string | null;
  user: AuthUser | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] =
    useState<AuthContextValue["status"]>("loading");

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  useEffect(() => {
    const storedToken = sessionStorage.getItem(TOKEN_STORAGE_KEY);

    if (!storedToken) {
      queueMicrotask(() => setStatus("unauthenticated"));
      return;
    }

    apiRequest<{ data: { user: AuthUser } }>("/auth/me", {
      token: storedToken,
    })
      .then((response) => {
        setToken(storedToken);
        setUser(response.data.user);
        setStatus("authenticated");
      })
      .catch(logout);
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiRequest<{
      data: { accessToken: string; user: AuthUser };
    }>("/V1/auth/login", {
      method: "POST",
      body: { email, password },
    });

    sessionStorage.setItem(TOKEN_STORAGE_KEY, response.data.accessToken);
    setToken(response.data.accessToken);
    setUser(response.data.user);
    setStatus("authenticated");
    return response.data.user;
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) {
      return;
    }

    const response = await apiRequest<{ data: { user: AuthUser } }>(
      "/auth/me",
      { token },
    );
    setUser(response.data.user);
  }, [token]);

  const value = useMemo(
    () => ({ login, logout, refreshUser, status, token, user }),
    [login, logout, refreshUser, status, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
