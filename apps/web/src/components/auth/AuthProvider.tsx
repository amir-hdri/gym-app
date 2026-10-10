"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { USE_MOCK, mockService } from "@/hooks/api-source";
import type { User, AuthTokens, UserRole, ApiResponse } from "@/lib/types";
import { isValidStoredUser } from "./auth-helpers";

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>;
  updateUser: (user: Partial<User>) => void;
  hasRole: (roles: UserRole[]) => boolean;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  branchId?: string;
}

interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKENS_KEY = "auth_tokens";
const USER_KEY = "auth_user";

type StoreKind = "local" | "session";

function storeFor(kind: StoreKind): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

/** Reads persisted auth from local first, then session (short-lived sign-in). */
function readStored(): { user: User; tokens: AuthTokens; store: StoreKind } | null {
  for (const kind of ["local", "session"] as const) {
    const store = storeFor(kind);
    if (!store) continue;
    try {
      const rawTokens = store.getItem(TOKENS_KEY);
      const rawUser = store.getItem(USER_KEY);
      if (!rawTokens || !rawUser) continue;
      const tokens = JSON.parse(rawTokens) as AuthTokens;
      const user = JSON.parse(rawUser) as User;
      if (!isValidStoredUser(user)) continue;
      return { user, tokens, store: kind };
    } catch {
      continue;
    }
  }
  return null;
}

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Which store holds this session ("remember me" → local, else session).
  // A ref — never state — so token refresh never captures a stale closure.
  const storeRef = useRef<StoreKind>("local");
  const userRef = useRef<User | null>(null);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const clearAuth = useCallback(() => {
    queryClient.clear();
    setUser(null);
    setTokens(null);
    storeFor("local")?.removeItem(TOKENS_KEY);
    storeFor("local")?.removeItem(USER_KEY);
    storeFor("session")?.removeItem(TOKENS_KEY);
    storeFor("session")?.removeItem(USER_KEY);
  }, [queryClient]);

  const setAuth = useCallback((newUser: User, newTokens: AuthTokens, store: StoreKind) => {
    storeRef.current = store;
    setUser(newUser);
    setTokens(newTokens);
    // Never leave a stale copy in the other store: two sources of truth
    // would resurrect a signed-out session on the next restore.
    const other = store === "local" ? "session" : "local";
    storeFor(other)?.removeItem(TOKENS_KEY);
    storeFor(other)?.removeItem(USER_KEY);
    const target = storeFor(store);
    target?.setItem(USER_KEY, JSON.stringify(newUser));
    target?.setItem(TOKENS_KEY, JSON.stringify(newTokens));
  }, []);

  const refreshTokens = useCallback(async (refreshToken: string): Promise<boolean> => {
    try {
      const response = (USE_MOCK
        ? await mockService.refreshToken(refreshToken)
        : await api.refreshToken(refreshToken)) as ApiResponse<AuthTokens>;
      if (!response.success || !response.data) return false;
      // The state `user` may be null here (expired session restored before
      // any render set it) — fall back to the persisted copy instead of
      // reporting success while storing nothing.
      const current = userRef.current ?? readStored()?.user ?? null;
      if (!current) return false;
      setAuth(current, response.data, storeRef.current);
      return true;
    } catch {
      return false;
    }
  }, [setAuth]);

  useEffect(() => {
    const initAuth = async () => {
      const stored = readStored();
      if (!stored) {
        setIsLoading(false);
        return;
      }
      const accessTokenExpiry = stored.tokens.accessTokenExpiry
        ? new Date(stored.tokens.accessTokenExpiry).getTime()
        : 0;
      const refreshTokenExpiry = stored.tokens.refreshTokenExpiry
        ? new Date(stored.tokens.refreshTokenExpiry).getTime()
        : 0;

      if (Date.now() >= refreshTokenExpiry) {
        // Both legs dead — skip the doomed refresh round trip entirely.
        clearAuth();
      } else if (Date.now() < accessTokenExpiry) {
        setAuth(stored.user, stored.tokens, stored.store);
        // Revalidate in the background: a role suspension or profile edit
        // made elsewhere must not haunt this session until the next login.
        try {
          const fresh = (USE_MOCK
            ? await mockService.getProfile(stored.user.id)
            : await api.getProfile()) as ApiResponse<User>;
          if (fresh.success && fresh.data && isValidStoredUser(fresh.data)) {
            if (JSON.stringify(fresh.data) !== JSON.stringify(stored.user)) {
              setAuth(fresh.data, stored.tokens, stored.store);
            }
          }
        } catch {
          // Offline or momentarily unreachable — the stored session stands.
        }
      } else if (stored.tokens.refreshToken) {
        const ok = await refreshTokens(stored.tokens.refreshToken);
        if (!ok) clearAuth();
        else {
          // Restore into state even when setAuth ran with a stored user only.
          const current = readStored();
          if (current) {
            setUser(current.user);
            setTokens(current.tokens);
          }
        }
      } else {
        clearAuth();
      }
      setIsLoading(false);
    };

    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    const store: StoreKind = rememberMe ? "local" : "session";
    const response = (USE_MOCK
      ? await mockService.login(email, password)
      : await api.login({ email, password, rememberMe })) as ApiResponse<AuthResponse>;

    if (response.success && response.data) {
      setAuth(response.data.user, response.data.tokens, store);
      return response.data.user;
    } else {
      throw new Error(response.error || "ورود ناموفق بود");
    }
  }, [setAuth]);

  const register = useCallback(async (data: RegisterData) => {
    // Branch is optional — only send it when the caller picked one, so the
    // payload stays clean for both the real API and the mock service.
    const payload = {
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      ...(data.branchId ? { branchId: data.branchId } : {}),
    };
    const response = (USE_MOCK
      ? await mockService.register(payload)
      : await api.register(payload)) as ApiResponse<AuthResponse>;

    if (response.success && response.data) {
      // A fresh signup stays signed in on this device.
      setAuth(response.data.user, response.data.tokens, "local");
      return response.data.user;
    } else {
      throw new Error(response.error || "ثبت‌نام ناموفق بود");
    }
  }, [setAuth]);

  const logout = useCallback(() => {
    clearAuth();
    if (!USE_MOCK) api.logout().catch(() => {});
  }, [clearAuth]);

  const refreshAccessToken = useCallback(async () => {
    if (!tokens?.refreshToken) return false;
    return refreshTokens(tokens.refreshToken);
  }, [tokens, refreshTokens]);

  const updateUser = useCallback((userData: Partial<User>) => {
    const current = userRef.current;
    if (current) {
      const updatedUser = { ...current, ...userData };
      setUser(updatedUser);
      storeFor(storeRef.current)?.setItem(USER_KEY, JSON.stringify(updatedUser));
    }
  }, []);

  const hasRole = useCallback((roles: UserRole[]) => {
    return user ? roles.includes(user.role) : false;
  }, [user]);

  const isAuthenticated = !!user && !!tokens;

  // Memoized so consumers don't re-render on every provider render when
  // nothing they read changed (the object identity was previously new each
  // render, invalidating the whole app subtree on any auth state touch).
  const value = useMemo<AuthContextType>(
    () => ({
      user,
      tokens,
      isLoading,
      isAuthenticated,
      login,
      register,
      logout,
      refreshAccessToken,
      updateUser,
      hasRole,
    }),
    [user, tokens, isLoading, isAuthenticated, login, register, logout, refreshAccessToken, updateUser, hasRole]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
