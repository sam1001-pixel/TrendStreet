"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { CustomerUser } from "@/lib/customer-auth";
import { useStore } from "@/context/StoreContext";

interface UserAuthContextType {
  user: CustomerUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; message: string }>;
  register: (data: {
    name: string;
    email: string;
    phone?: string;
    password: string;
  }) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

export const UserAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Hook into StoreContext to sync profile
  const store = useStore();

  const syncStoreProfile = useCallback(
    (customerUser: CustomerUser | null) => {
      if (!store || !store.updateUserProfile) return;
      if (customerUser) {
        store.updateUserProfile({
          name: customerUser.name,
          email: customerUser.email,
          phone: customerUser.phone || "",
        });
      }
    },
    [store]
  );

  // 1. Optimistic hydration from localStorage to eliminate route bouncing
  useEffect(() => {
    try {
      const cachedAuth = localStorage.getItem("ts_customer_authenticated");
      const cachedUserStr = localStorage.getItem("ts_customer_user");
      if (cachedAuth === "true" && cachedUserStr) {
        const parsed = JSON.parse(cachedUserStr);
        setUser(parsed);
        setIsAuthenticated(true);
        syncStoreProfile(parsed);
      }
    } catch (_) {}
  }, [syncStoreProfile]);

  const checkSession = useCallback(async () => {
    try {
      const cachedToken = typeof window !== "undefined" ? localStorage.getItem("ts_customer_token") : null;
      const headers: Record<string, string> = {};
      if (cachedToken) {
        headers["Authorization"] = `Bearer ${cachedToken}`;
        headers["x-customer-token"] = cachedToken;
      }

      const res = await fetch("/api/auth/customer/session", { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          setIsAuthenticated(true);
          syncStoreProfile(data.user);
          try {
            localStorage.setItem("ts_customer_authenticated", "true");
            localStorage.setItem("ts_customer_user", JSON.stringify(data.user));
          } catch (_) {}
          return;
        }
      }

      // If server explicitly confirms no session and no token exists
      if (!cachedToken) {
        setUser(null);
        setIsAuthenticated(false);
        try {
          localStorage.removeItem("ts_customer_authenticated");
          localStorage.removeItem("ts_customer_user");
        } catch (_) {}
      }
    } catch (err) {
      console.error("[UserAuth] Session verification error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [syncStoreProfile]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (email: string, pass: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch("/api/auth/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        syncStoreProfile(data.user);
        try {
          localStorage.setItem("ts_customer_authenticated", "true");
          localStorage.setItem("ts_customer_user", JSON.stringify(data.user));
          if (data.token) {
            localStorage.setItem("ts_customer_token", data.token);
          }
        } catch (_) {}
        return {
          success: true,
          message: data.message || "Welcome back to Trend Street.",
        };
      }

      return {
        success: false,
        message: data.message || "Invalid credentials provided.",
      };
    } catch (err) {
      console.error("[UserAuth] Login error:", err);
      return {
        success: false,
        message: "Network error. Unable to contact authentication service.",
      };
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    phone?: string;
    password: string;
  }): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch("/api/auth/customer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await res.json();

      if (res.ok && resData.success && resData.user) {
        setUser(resData.user);
        setIsAuthenticated(true);
        syncStoreProfile(resData.user);
        try {
          localStorage.setItem("ts_customer_authenticated", "true");
          localStorage.setItem("ts_customer_user", JSON.stringify(resData.user));
          if (resData.token) {
            localStorage.setItem("ts_customer_token", resData.token);
          }
        } catch (_) {}
        return {
          success: true,
          message: resData.message || "Account created successfully.",
        };
      }

      return {
        success: false,
        message: resData.message || "Registration failed.",
      };
    } catch (err) {
      console.error("[UserAuth] Register error:", err);
      return {
        success: false,
        message: "Network error. Unable to contact registration service.",
      };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/customer/logout", { method: "POST" });
    } catch (err) {
      console.error("[UserAuth] Logout error:", err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      try {
        localStorage.removeItem("ts_customer_authenticated");
        localStorage.removeItem("ts_customer_user");
        localStorage.removeItem("ts_customer_token");
      } catch (_) {}
      if (store && store.updateUserProfile) {
        store.updateUserProfile({
          name: "",
          email: "",
          phone: "",
        });
      }
    }
  };

  return (
    <UserAuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        refreshSession: checkSession,
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
};

export const useUserAuth = () => {
  const context = useContext(UserAuthContext);
  if (!context) {
    throw new Error("useUserAuth must be used within a UserAuthProvider");
  }
  return context;
};
