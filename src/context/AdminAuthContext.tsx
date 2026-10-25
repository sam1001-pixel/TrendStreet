"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { AdminAccessRecord } from "@/types/store";

interface AdminAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  adminEmail: string | null;
  adminName: string;
  login: (id: string, pass: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  accessRegister: AdminAccessRecord[];
  updateAccessRecord: (record: AdminAccessRecord) => void;
  addAccessRecord: (record: Omit<AdminAccessRecord, "adminId">) => void;
  deleteAccessRecord: (adminId: number) => void;
}

const INITIAL_ACCESS_REGISTER: AdminAccessRecord[] = [
  {
    adminId: 1,
    systemOrTool: "Trend Street Core Storefront & CMS",
    category: "Operations",
    mainAdmin: "Sujal Solanki",
    backupAdmin: "Radha Solanki",
    department: "Executive & Commerce",
    accessLevel: "Full",
    numberOfAdminUsers: 2,
    billingOwner: "Sujal Solanki",
    plan: "Enterprise Atelier Tier",
    seats: 5,
    renewalDate: "2027-01-15",
    companyOwnedAccount: true,
    sharedLogin: false,
    passwordManagerEntry: "1Password Atelier Vault / Trend Street Root",
    twoFactorOn: true,
    lastAccessReview: "2026-10-01",
    nextAccessReview: "2027-01-01",
    offboardingChecklistItem: "Revoke master tokens, cycle API credentials, invalidate active sessions",
    riskLevel: "Low",
    status: "Provisioned",
    notes: "Primary root administrator credentials. Multi-factor authenticated with hardware passkey.",
  },
  {
    adminId: 2,
    systemOrTool: "Logistics & Global Courier Fulfillment",
    category: "Operations",
    mainAdmin: "Sujal Solanki",
    backupAdmin: "Operations Dispatch Lead",
    department: "Supply Chain",
    accessLevel: "Full",
    numberOfAdminUsers: 3,
    billingOwner: "Trend Street Atelier Ltd",
    plan: "Global Freight Pro",
    seats: 6,
    renewalDate: "2027-03-30",
    companyOwnedAccount: true,
    sharedLogin: false,
    passwordManagerEntry: "1Password Atelier Vault / Courier API",
    twoFactorOn: true,
    lastAccessReview: "2026-09-15",
    nextAccessReview: "2026-12-15",
    offboardingChecklistItem: "Revoke carrier dispatch rights, cancel handheld API keys",
    riskLevel: "Low",
    status: "Provisioned",
    notes: "Connected to worldwide carbon-neutral express courier services.",
  },
  {
    adminId: 3,
    systemOrTool: "Stripe & Merchant Banking Gateway",
    category: "Finance",
    mainAdmin: "Sujal Solanki",
    backupAdmin: "Chief Financial Officer",
    department: "Finance",
    accessLevel: "Full",
    numberOfAdminUsers: 2,
    billingOwner: "Sujal Solanki",
    plan: "Merchant Tier 1",
    seats: 2,
    renewalDate: "2027-06-01",
    companyOwnedAccount: true,
    sharedLogin: false,
    passwordManagerEntry: "Hardware YubiKey Vault",
    twoFactorOn: true,
    lastAccessReview: "2026-10-10",
    nextAccessReview: "2027-01-10",
    offboardingChecklistItem: "Immediate payout block, revoke API secret keys, mandate biometric re-auth",
    riskLevel: "Critical",
    status: "Provisioned",
    notes: "Handles high-value luxury card processing, multi-currency settlements, and fraud shielding.",
  },
];

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [accessRegister, setAccessRegister] = useState<AdminAccessRecord[]>(INITIAL_ACCESS_REGISTER);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Synchronize authentication status with server-side HTTP-only session cookie
  useEffect(() => {
    // 1. Instant optimistic check from localStorage to eliminate route bouncing
    try {
      const cachedAuth = localStorage.getItem("ts_admin_authenticated");
      const cachedEmail = localStorage.getItem("ts_admin_email");
      if (cachedAuth === "true") {
        setIsAuthenticated(true);
        if (cachedEmail) setAdminEmail(cachedEmail);
      }
    } catch (_) {}

    // 2. Authoritative check with server
    const checkServerSession = async () => {
      try {
        const cachedToken = typeof window !== "undefined" ? localStorage.getItem("ts_admin_token") : null;
        const headers: Record<string, string> = {};
        if (cachedToken) {
          headers["Authorization"] = `Bearer ${cachedToken}`;
          headers["x-admin-token"] = cachedToken;
        }

        const res = await fetch("/api/auth/session", { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.email) {
            setIsAuthenticated(true);
            setAdminEmail(data.email);
            try {
              localStorage.setItem("ts_admin_authenticated", "true");
              localStorage.setItem("ts_admin_email", data.email);
            } catch (_) {}
            return;
          }
        }

        // If server explicitly said not authenticated and no token was present
        if (!cachedToken) {
          setIsAuthenticated(false);
          setAdminEmail(null);
          try {
            localStorage.removeItem("ts_admin_authenticated");
            localStorage.removeItem("ts_admin_email");
          } catch (_) {}
        }
      } catch (err) {
        console.error("Session verification error:", err);
      } finally {
        setIsLoading(false);
        setIsHydrated(true);
      }
    };

    checkServerSession();

    try {
      const storedRegister = localStorage.getItem("ts_access_register");
      if (storedRegister) {
        setAccessRegister(JSON.parse(storedRegister));
      }
    } catch (e) {
      console.error("Failed to load access register:", e);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem("ts_access_register", JSON.stringify(accessRegister));
    } catch (e) {
      console.error("Failed to persist access register:", e);
    }
  }, [accessRegister, isHydrated]);

  // Server-authoritative login via /api/auth/login
  const login = async (id: string, pass: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: id, password: pass }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setAdminEmail(data.email);
        try {
          localStorage.setItem("ts_admin_authenticated", "true");
          localStorage.setItem("ts_admin_email", data.email || "");
          if (data.token) {
            localStorage.setItem("ts_admin_token", data.token);
          }
        } catch (_) {}
        return {
          success: true,
          message: data.message || "Authentication successful.",
        };
      }

      return {
        success: false,
        message: data.message || "Invalid administrative credentials.",
      };
    } catch (error) {
      console.error("Login submission error:", error);
      return {
        success: false,
        message: "Authentication service currently unreachable.",
      };
    }
  };

  // Server-authoritative logout clearing HTTP-only cookie and local token
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout request error:", err);
    } finally {
      setIsAuthenticated(false);
      setAdminEmail(null);
      try {
        localStorage.removeItem("ts_admin_authenticated");
        localStorage.removeItem("ts_admin_email");
        localStorage.removeItem("ts_admin_token");
      } catch (_) {}
    }
  };

  const updateAccessRecord = (record: AdminAccessRecord) => {
    setAccessRegister((prev) =>
      prev.map((r) => (r.adminId === record.adminId ? record : r))
    );
  };

  const addAccessRecord = (recordInput: Omit<AdminAccessRecord, "adminId">) => {
    const newRecord: AdminAccessRecord = {
      ...recordInput,
      adminId: Date.now(),
    };
    setAccessRegister((prev) => [...prev, newRecord]);
  };

  const deleteAccessRecord = (adminId: number) => {
    setAccessRegister((prev) => prev.filter((r) => r.adminId !== adminId));
  };

  return (
    <AdminAuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        adminEmail,
        adminName: "Sujal Solanki",
        login,
        logout,
        accessRegister,
        updateAccessRecord,
        addAccessRecord,
        deleteAccessRecord,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};
