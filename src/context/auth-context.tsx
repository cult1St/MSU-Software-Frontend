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
import type { AuthUser } from "@src/dto/auth";
import authService from "@src/services/auth.service";
import { isUuid } from "@src/utils/staff";
import { normalizeStaffRole } from "@src/utils/roles";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  role: string | null;
  staffId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  setSessionUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setSessionUser = useCallback((nextUser: AuthUser | null) => {
    setUser(nextUser);
    if (typeof window === "undefined") return;
    if (nextUser) {
      sessionStorage.setItem("authUser", JSON.stringify(nextUser));
    } else {
      sessionStorage.removeItem("authUser");
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (typeof window === "undefined") return;
    setIsLoading(true);

    const storedToken = sessionStorage.getItem("authToken");
    setToken(storedToken);

    const cached = authService.getStoredUser();
    setUser(cached);

    setIsLoading(false);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setToken(null);
    if (typeof window !== "undefined") {
      window.location.href = "/sign-in";
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const role = useMemo(
    () => normalizeStaffRole(user?.role) || user?.role || null,
    [user?.role]
  );
  const staffId = useMemo(() => {
    const id = user?.id != null ? String(user.id) : "";
    return isUuid(id) ? id : null;
  }, [user?.id]);

  const value = useMemo(
    () => ({
      user,
      token,
      role,
      staffId,
      isLoading,
      isAuthenticated: Boolean(token),
      refreshUser,
      setSessionUser,
      logout,
    }),
    [user, token, role, staffId, isLoading, refreshUser, setSessionUser, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
