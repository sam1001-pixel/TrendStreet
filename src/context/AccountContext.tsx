"use client";

/**
 * Keeps a signed-in shopper's account in step with the server: details, saved addresses, saved items
 * and orders (with live status) load on any device, and changes are saved back. Guests keep using
 * this device's storage exactly as before.
 */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useStore } from "@/context/StoreContext";
import { useUserAuth } from "@/context/UserAuthContext";
import type { Order, UserProfile } from "@/types/store";

type SavedAddress = UserProfile["savedAddresses"][number];
type ServerAddress = SavedAddress & { phone: string; apartment: string; state: string };

interface AccountPayload {
  profile: { name: string; email: string; phone: string; memberSince: string };
  addresses: ServerAddress[];
  wishlist: string[];
  orders: Order[];
}

type Status = "guest" | "loading" | "ready" | "error";
type SaveResult = { ok: true } | { ok: false; error: string };

interface AccountContextType {
  status: Status;
  memberSince: string | null;
  refresh: () => Promise<void>;
  saveDetails: (d: { name: string; phone: string }) => Promise<SaveResult>;
  saveAddress: (a: Partial<ServerAddress>) => Promise<SaveResult>;
  deleteAddress: (id: string) => Promise<SaveResult>;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

async function call<T>(url: string, init: RequestInit = {}): Promise<{ ok: true; data: T } | { ok: false; error: string; status: number }> {
  try {
    const res = await fetch(url, { credentials: "same-origin", ...init, headers: { "Content-Type": "application/json", ...(init.headers || {}) } });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true, data: data as T };
    return { ok: false, error: data?.error || "Something went wrong. Please try again.", status: res.status };
  } catch {
    return { ok: false, error: "You seem to be offline. Please try again.", status: 0 };
  }
}

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const store = useStore();
  const { isAuthenticated, isLoading: authLoading, refreshSession } = useUserAuth();
  const [status, setStatus] = useState<Status>("guest");
  const [memberSince, setMemberSince] = useState<string | null>(null);

  // Latest store values without re-running effects on every render.
  const storeRef = useRef(store);
  storeRef.current = store;
  const syncedWishlist = useRef<string[] | null>(null);
  const wasAuthed = useRef(false);

  const applyAddresses = useCallback((list: ServerAddress[]) => {
    storeRef.current.updateUserProfile({ savedAddresses: list });
  }, []);

  const load = useCallback(async () => {
    setStatus((s) => (s === "ready" ? s : "loading"));
    const res = await call<AccountPayload>("/api/account", { cache: "no-store" });
    if (!res.ok) {
      if (res.status === 401) void refreshSession();
      setStatus("error");
      return;
    }
    const { profile, addresses, wishlist, orders } = res.data;
    const s = storeRef.current;
    setMemberSince(profile.memberSince);

    // Addresses saved on this phone before signing in move into the account once.
    let saved = addresses;
    if (!saved.length && s.user.savedAddresses.length) {
      for (const a of s.user.savedAddresses.slice(0, 5)) {
        const up = await call<{ addresses: ServerAddress[] }>("/api/account/addresses", { method: "POST", body: JSON.stringify(a) });
        if (up.ok) saved = up.data.addresses;
      }
    }
    s.updateUserProfile({ name: profile.name, email: profile.email, phone: profile.phone, savedAddresses: saved });

    // Saved items: this device's + the account's.
    const merged = Array.from(new Set([...wishlist, ...s.wishlist]));
    s.setWishlistIds(merged);
    syncedWishlist.current = wishlist;
    if (!sameSet(merged, wishlist)) {
      const put = await call<{ wishlist: string[] }>("/api/account/wishlist", { method: "PUT", body: JSON.stringify({ productIds: merged }) });
      if (put.ok) syncedWishlist.current = put.data.wishlist;
    }

    s.applyAccountOrders(orders);
    setStatus("ready");
  }, [refreshSession]);

  // Sign-in → load the account. Sign-out → forget it on this device.
  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      wasAuthed.current = true;
      void load();
    } else {
      if (wasAuthed.current) storeRef.current.clearAccountData();
      wasAuthed.current = false;
      syncedWishlist.current = null;
      setStatus("guest");
      setMemberSince(null);
    }
  }, [isAuthenticated, authLoading, load]);

  // Saved items changes are pushed to the account (batched).
  useEffect(() => {
    if (status !== "ready" || !syncedWishlist.current) return;
    if (sameSet(store.wishlist, syncedWishlist.current)) return;
    const ids = store.wishlist;
    const t = window.setTimeout(async () => {
      const put = await call<{ wishlist: string[] }>("/api/account/wishlist", { method: "PUT", body: JSON.stringify({ productIds: ids }) });
      if (put.ok) syncedWishlist.current = put.data.wishlist;
    }, 800);
    return () => window.clearTimeout(t);
  }, [store.wishlist, status]);

  // Coming back to the tab refreshes order status (e.g. "Shipped" while the app was in the background).
  useEffect(() => {
    if (status !== "ready") return;
    let last = Date.now();
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - last > 60_000) {
        last = Date.now();
        void load();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [status, load]);

  const saveDetails = useCallback(async (d: { name: string; phone: string }): Promise<SaveResult> => {
    const res = await call<{ profile: { name: string; phone: string } }>("/api/account", { method: "PATCH", body: JSON.stringify(d) });
    if (!res.ok) return { ok: false, error: res.error };
    storeRef.current.updateUserProfile({ name: res.data.profile.name, phone: res.data.profile.phone });
    return { ok: true };
  }, []);

  const saveAddress = useCallback(
    async (a: Partial<ServerAddress>): Promise<SaveResult> => {
      // Ids made on this device ("addr-…") aren't server ids: save those as new.
      const body = { ...a, id: a.id && !a.id.startsWith("addr-") ? a.id : undefined };
      const res = await call<{ addresses: ServerAddress[] }>("/api/account/addresses", { method: "POST", body: JSON.stringify(body) });
      if (!res.ok) return { ok: false, error: res.error };
      applyAddresses(res.data.addresses);
      return { ok: true };
    },
    [applyAddresses]
  );

  const deleteAddress = useCallback(
    async (id: string): Promise<SaveResult> => {
      const res = await call<{ addresses: ServerAddress[] }>(`/api/account/addresses?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) return { ok: false, error: res.error };
      applyAddresses(res.data.addresses);
      return { ok: true };
    },
    [applyAddresses]
  );

  return (
    <AccountContext.Provider value={{ status, memberSince, refresh: load, saveDetails, saveAddress, deleteAddress }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used inside AccountProvider");
  return ctx;
}
