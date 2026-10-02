"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { api } from "@/lib/api";
import type { User, AuthTokens, UserRole, ApiResponse } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<User>;
  // Register does not sign the user in (backend mints no tokens on this path,
  // so an existing email is indistinguishable from a new one). Resolves on
  // success; the caller routes to the login page.
  register: (data: RegisterData) => Promise<void>;
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
}

interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuth = useCallback(() => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem("auth_tokens");
    localStorage.removeItem("auth_user");
  }, []);

  const setAuth = useCallback((newUser: User, newTokens: AuthTokens) => {
    setUser(newUser);
    setTokens(newTokens);
    localStorage.setItem("auth_user", JSON.stringify(newUser));
    localStorage.setItem("auth_tokens", JSON.stringify(newTokens));
  }, []);

  const refreshTokens = useCallback(async (refreshToken: string): Promise<boolean> => {
    try {
      const response = await api.refreshToken(refreshToken) as ApiResponse<AuthTokens>;
      if (response.success && response.data) {
        if (user) {
          setAuth(user, response.data);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [user, setAuth]);

  useEffect(() => {
    const initAuth = async () => {
      const storedTokens = localStorage.getItem("auth_tokens");
      const storedUser = localStorage.getItem("auth_user");

      if (storedTokens && storedUser) {
        try {
          const parsedTokens = JSON.parse(storedTokens) as AuthTokens;
          const parsedUser = JSON.parse(storedUser) as User;
          const accessTokenExpiry = parsedTokens.accessTokenExpiry
            ? new Date(parsedTokens.accessTokenExpiry).getTime()
            : 0;

          if (Date.now() < accessTokenExpiry) {
            setAuth(parsedUser, parsedTokens);
          } else if (parsedTokens.refreshToken) {
            const response = await api.refreshToken(parsedTokens.refreshToken) as ApiResponse<AuthTokens>;
            if (response.success && response.data) {
              setAuth(parsedUser, response.data);
            } else {
              clearAuth();
            }
          } else {
            clearAuth();
          }
        } catch {
          clearAuth();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [clearAuth, setAuth]);

  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    const response = await api.login({ email, password, rememberMe }) as ApiResponse<AuthResponse>;
    
    if (response.success && response.data) {
      setAuth(response.data.user, response.data.tokens);
      return response.data.user;
    } else {
      throw new Error(response.error || "ورود ناموفق بود");
    }
  }, [setAuth]);

  const register = useCallback(async (data: RegisterData) => {
    const payload = {
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
    };
    // No tokens are minted on register (anti-enumeration) — do NOT set auth
    // here. The caller routes the user to the login page instead.
    const response = await api.register(payload);

    if (response.success) {
      return;
    }
    throw new Error(response.error || "ثبت‌نام ناموفق بود");
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    api.logout().catch(() => {});
  }, [clearAuth]);

  const refreshAccessToken = useCallback(async () => {
    if (!tokens?.refreshToken) return false;
    return refreshTokens(tokens.refreshToken);
  }, [tokens, refreshTokens]);

  const updateUser = useCallback((userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem("auth_user", JSON.stringify(updatedUser));
    }
  }, [user]);

  const hasRole = useCallback((roles: UserRole[]) => {
    return user ? roles.includes(user.role) : false;
  }, [user]);

  const isAuthenticated = !!user && !!tokens;

  return (
    <AuthContext.Provider
      value={{
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
      }}
    >
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
