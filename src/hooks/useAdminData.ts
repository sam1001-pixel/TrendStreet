"use client";

/**
 * Admin data from the database via /api/admin/*.
 * Mirrors the function names the admin pages used with the old browser-only store,
 * but every change is saved server-side and written to the audit log.
 */
import { useCallback, useEffect, useState } from "react";
import { DEFAULT_SITE_SETTINGS, useStore } from "@/context/StoreContext";
import type { Order, OrderStatus, Product, SiteSettings } from "@/types/store";

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    window.location.href = `/admin/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
  }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

export function useAdminData({ orders: wantOrders = false, products: wantProducts = false } = {}) {
  const store = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };
  const fail = (e: unknown) => setError(e instanceof Error ? e.message : "Something went wrong.");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [o, p] = await Promise.all([
        wantOrders ? api<{ orders: Order[] }>("/api/admin/orders") : null,
        wantProducts ? api<{ products: Product[] }>("/api/admin/products") : null,
      ]);
      if (o) setOrders(o.orders);
      if (p) setProducts(p.products);
    } catch (e) {
      fail(e);
    } finally {
      setLoading(false);
    }
  }, [wantOrders, wantProducts]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const prev = orders;
    setOrders((os) => os.map((o) => (o.id === orderId ? { ...o, status } : o)));
    try {
      const { order } = await api<{ order: Order }>(`/api/admin/orders/${orderId}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setOrders((os) => os.map((o) => (o.id === orderId ? order : o)));
      flash(`Order ${order.orderNumber} → ${status}`);
    } catch (e) {
      setOrders(prev);
      fail(e);
    }
  };

  const updateOrder = async (orderId: string, updates: { status?: OrderStatus; trackingNumber?: string }) => {
    const prev = orders;
    setOrders((os) => os.map((o) => (o.id === orderId ? { ...o, ...updates } : o)));
    try {
      const { order } = await api<{ order: Order }>(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      setOrders((os) => os.map((o) => (o.id === orderId ? order : o)));
      flash(`Order ${order.orderNumber} updated`);
      return order;
    } catch (e) {
      setOrders(prev);
      fail(e);
      throw e;
    }
  };

  const updateOrderTracking = async (orderId: string, trackingNumber: string) => {
    try {
      const { order } = await api<{ order: Order }>(`/api/admin/orders/${orderId}`, { method: "PATCH", body: JSON.stringify({ trackingNumber }) });
      setOrders((os) => os.map((o) => (o.id === orderId ? order : o)));
      flash(`Tracking saved for ${order.orderNumber}`);
    } catch (e) {
      fail(e);
    }
  };

  const addProduct = async (input: Omit<Product, "id" | "rating" | "reviewsCount" | "reviews">) => {
    try {
      const { product } = await api<{ product: Product }>("/api/admin/products", { method: "POST", body: JSON.stringify(input) });
      setProducts((ps) => [product, ...ps]);
      flash(`Added ${product.name}`);
      return product;
    } catch (e) {
      fail(e);
      return null;
    }
  };

  const updateProduct = async (input: Product) => {
    const prev = products;
    setProducts((ps) => ps.map((p) => (p.id === input.id ? input : p)));
    try {
      const { product } = await api<{ product: Product }>(`/api/admin/products/${input.id}`, { method: "PUT", body: JSON.stringify(input) });
      setProducts((ps) => ps.map((p) => (p.id === product.id ? product : p)));
      flash(`Saved ${product.name}`);
    } catch (e) {
      setProducts(prev);
      fail(e);
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      await api(`/api/admin/products/${productId}`, { method: "DELETE" });
      setProducts((ps) => ps.filter((p) => p.id !== productId));
      flash("Product deleted");
    } catch (e) {
      fail(e);
    }
  };

  const updateSiteSettings = async (next: Partial<SiteSettings>) => {
    try {
      await api("/api/admin/settings", { method: "PUT", body: JSON.stringify(next) });
      store.updateSiteSettings(next);
      flash("Settings published to the live store");
      return true;
    } catch (e) {
      fail(e);
      return false;
    }
  };

  const resetSiteSettings = () => updateSiteSettings(DEFAULT_SITE_SETTINGS);

  return {
    orders,
    products,
    siteSettings: store.siteSettings,
    loading,
    error,
    notice,
    clearError: () => setError(null),
    refresh,
    updateOrderStatus,
    updateOrderTracking,
    updateOrder,
    addProduct,
    updateProduct,
    deleteProduct,
    updateSiteSettings,
    resetSiteSettings,
  };
}
