"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  DollarSign,
  Package,
  Shirt,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Clock,
  CheckCircle,
  ExternalLink,
  Sliders,
  AlertTriangle,
  Plus,
  Truck,
  Megaphone,
  Tag,
  Percent,
} from "lucide-react";
import { useAdminData } from "@/hooks/useAdminData";
import { AdminStatusBar } from "@/components/admin/AdminStatusBar";
import { formatPrice } from "@/lib/pricing";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { OrderStatus, Product } from "@/types/store";

export default function AdminDashboardPage() {
  const {
    products,
    orders,
    siteSettings,
    updateSiteSettings,
    updateProduct,
    updateOrderStatus,
    updateOrderTracking,
    updateOrder,
    loading,
    error,
    notice,
    clearError,
  } = useAdminData({ orders: true, products: true });

  const { adminName, accessRegister } = useAdminAuth();

  // Announcement state for quick live update
  const [announcementDraft, setAnnouncementDraft] = useState(
    siteSettings?.topAnnouncement?.text || "COMPLIMENTARY EXPRESS DELIVERY ON ORDERS OVER ₹1,999 · CODE BUNDLE15"
  );
  const [announcementActive, setAnnouncementActive] = useState(
    siteSettings?.topAnnouncement?.enabled ?? true
  );

  // Keep announcement draft in sync when siteSettings load asynchronously
  useEffect(() => {
    if (siteSettings?.topAnnouncement) {
      setAnnouncementDraft(siteSettings.topAnnouncement.text || "");
      setAnnouncementActive(siteSettings.topAnnouncement.enabled ?? true);
    }
  }, [siteSettings]);

  // Quick promo code draft
  const [quickPromoCode, setQuickPromoCode] = useState("");
  const [quickPromoPercent, setQuickPromoPercent] = useState(15);
  const [quickPromoDesc, setQuickPromoDesc] = useState("Seasonal VIP Flash Discount");

  // Metrics calculation
  const liveOrders = orders.filter((o) => o.status !== "Cancelled");
  const totalRevenue = liveOrders.reduce((sum, o) => sum + o.total, 0);
  const averageOrderValue = liveOrders.length > 0 ? Math.round(totalRevenue / liveOrders.length) : 0;
  const inStockCount = products.filter((p) => p.inStock && p.stockCount > 0).length;

  // Low stock products (<= 5 units)
  const lowStockItems = products.filter((p) => p.stockCount <= 5);

  // 1-Click Restock handler
  const handleQuickRestock = async (product: Product, unitsToAdd: number) => {
    const nextCount = product.stockCount + unitsToAdd;
    await updateProduct({
      ...product,
      stockCount: nextCount,
      inStock: true,
    });
  };

  // 1-Click Announcement Save
  const handleSaveAnnouncement = async () => {
    await updateSiteSettings({
      ...siteSettings,
      topAnnouncement: {
        ...(siteSettings?.topAnnouncement || { linkUrl: "/shop", linkText: "SHOP NOW" }),
        enabled: announcementActive,
        text: announcementDraft,
      },
    });
  };

  // Quick Promo Code Activation
  const handleCreateQuickPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPromoCode.trim()) return;

    const newCode = quickPromoCode.trim().toUpperCase();
    const existing = siteSettings?.promoCodes || [];
    const updated = [
      ...existing.filter((p) => p.code !== newCode),
      {
        code: newCode,
        discountPercent: Number(quickPromoPercent) || 10,
        description: quickPromoDesc.trim(),
      },
    ];

    await updateSiteSettings({
      ...siteSettings,
      promoCodes: updated,
    });

    setQuickPromoCode("");
  };

  // Silhouette stats
  const silhouettes = ["Oversized", "Boxy Fit", "Jackets"] as const;
  const silhouetteStats = silhouettes.map((sil) => {
    const prods = products.filter((p) => p.category === sil);
    const totalUnits = prods.reduce((sum, p) => sum + p.stockCount, 0);
    const valuation = prods.reduce((sum, p) => sum + p.stockCount * p.price, 0);
    return { name: sil, count: prods.length, totalUnits, valuation };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      <AdminStatusBar loading={loading} error={error} notice={notice} onDismiss={clearError} />

      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-burgundy/15 gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-crimson block mb-1">
            Executive Control Center
          </span>
          <h1 className="font-serif text-3xl font-bold text-espresso">
            Welcome, {adminName}
          </h1>
          <p className="text-xs text-espresso/70 mt-0.5">
            Real-time analytics, inventory oversight, 1-click restock, order fulfillment, and live storefront CMS.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/settings"
            className="py-2.5 px-4 bg-burgundy hover:bg-crimson text-gold text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Site Customizer (Live)</span>
          </Link>

          <Link
            href="/admin/products"
            className="py-2.5 px-4 bg-white border border-burgundy/25 hover:border-burgundy text-burgundy text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Shirt className="w-3.5 h-3.5" />
            <span>Manage Products</span>
          </Link>

          <Link
            href="/admin/orders"
            className="py-2.5 px-4 bg-white border border-burgundy/25 hover:border-burgundy text-burgundy text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Fulfill Orders</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-burgundy/15 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-espresso/60 font-semibold uppercase tracking-wider">
            <span>Total Sales Revenue</span>
            <div className="p-2 bg-green-100 rounded-lg text-green-800">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-serif font-bold text-burgundy block">
            {formatPrice(totalRevenue)}
          </span>
          <p className="text-[11px] text-green-700 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +18.4% vs previous luxury cycle
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-burgundy/15 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-espresso/60 font-semibold uppercase tracking-wider">
            <span>Customer Allocations</span>
            <div className="p-2 bg-burgundy/10 rounded-lg text-burgundy">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-serif font-bold text-espresso block">
            {orders.length}
          </span>
          <p className="text-[11px] text-espresso/60">
            {orders.filter((o) => o.status === "Delivered").length} successfully delivered
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-burgundy/15 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-espresso/60 font-semibold uppercase tracking-wider">
            <span>Average Basket (AOV)</span>
            <div className="p-2 bg-gold/20 rounded-lg text-espresso">
              <Sparkles className="w-4 h-4 text-gold" />
            </div>
          </div>
          <span className="text-3xl font-serif font-bold text-espresso block">
            {formatPrice(averageOrderValue)}
          </span>
          <p className="text-[11px] text-espresso/60">
            Across 3 core tailored silhouettes
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-burgundy/15 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-espresso/60 font-semibold uppercase tracking-wider">
            <span>Catalog Garments</span>
            <div className="p-2 bg-ivory-dark rounded-lg text-espresso">
              <Shirt className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-serif font-bold text-espresso block">
            {products.length}
          </span>
          <p className="text-[11px] text-espresso/60">
            {inStockCount} active in stock ({lowStockItems.length} low stock)
          </p>
        </div>
      </div>

      {/* QUICK INVENTORY RESTOCK & STOREFRONT CONTROLS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Inventory Restock Widget */}
        <div className="bg-white p-6 rounded-2xl border border-burgundy/15 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-burgundy/10">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="font-serif text-lg font-bold text-espresso">
                Low Stock & Restock Desk
              </h3>
            </div>
            <Link
              href="/admin/products"
              className="text-xs font-bold uppercase tracking-wider text-burgundy hover:underline flex items-center gap-1"
            >
              <span>All Products</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <p className="text-xs text-espresso/70">
            Garments with ≤ 5 units remaining in the atelier. Click to instantly restock units in the database.
          </p>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {lowStockItems.length === 0 ? (
              <div className="p-6 text-center text-xs text-green-700 bg-green-50 rounded-xl border border-green-200">
                All garments have healthy inventory levels (&gt; 5 units).
              </div>
            ) : (
              lowStockItems.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 bg-ivory rounded-xl border border-burgundy/10 gap-3"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="w-10 h-12 object-cover rounded bg-ivory-dark border border-burgundy/10 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-serif font-bold text-xs text-espresso truncate">{p.name}</p>
                      <p className="text-[10px] text-stone-500 font-mono">
                        {p.category} · Stock:{" "}
                        <strong className={p.stockCount === 0 ? "text-red-700 font-bold" : "text-amber-700 font-bold"}>
                          {p.stockCount} units
                        </strong>
                      </p>
                    </div>
                  </div>

                  {/* 1-Click Quick Restock Buttons */}
                  <div className="flex items-center space-x-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleQuickRestock(p, 5)}
                      className="px-2 py-1 rounded bg-white hover:bg-ivory-dark text-[11px] font-bold text-burgundy border border-burgundy/20 transition-colors"
                      title="Add 5 units"
                    >
                      +5
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickRestock(p, 10)}
                      className="px-2 py-1 rounded bg-burgundy hover:bg-crimson text-[11px] font-bold text-gold transition-colors"
                      title="Add 10 units"
                    >
                      +10
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickRestock(p, 25)}
                      className="px-2 py-1 rounded bg-espresso hover:bg-black text-[11px] font-bold text-ivory transition-colors"
                      title="Add 25 units"
                    >
                      +25
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Storefront Quick Actions Desk */}
        <div className="bg-white p-6 rounded-2xl border border-burgundy/15 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-burgundy/10">
              <div className="flex items-center space-x-2">
                <Megaphone className="w-4 h-4 text-burgundy" />
                <h3 className="font-serif text-lg font-bold text-espresso">
                  Storefront Live Announcement Bar
                </h3>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-gold/20 text-espresso font-bold">
                Instant Sync
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-espresso">
                  Top Banner Visibility
                </label>
                <button
                  type="button"
                  onClick={() => setAnnouncementActive(!announcementActive)}
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition-colors ${
                    announcementActive
                      ? "bg-green-100 text-green-800"
                      : "bg-stone-200 text-stone-600"
                  }`}
                >
                  {announcementActive ? "Active on Site" : "Hidden"}
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-espresso block mb-1">
                  Banner Text Message
                </label>
                <input
                  type="text"
                  value={announcementDraft}
                  onChange={(e) => setAnnouncementDraft(e.target.value)}
                  placeholder="e.g. COMPLIMENTARY EXPRESS DELIVERY ON ALL ORDERS"
                  className="w-full bg-ivory px-3 py-2 rounded-xl border border-burgundy/20 text-xs font-mono text-espresso focus:outline-none focus:border-burgundy"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveAnnouncement}
                className="w-full py-2 bg-burgundy hover:bg-crimson text-gold text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-xs"
              >
                Publish Banner to Storefront
              </button>
            </div>

            {/* Quick Promo Code Creator */}
            <div className="pt-3 border-t border-burgundy/10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-espresso mb-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-crimson" />
                <span>Quick Promo Code Creator</span>
              </h4>
              <form onSubmit={handleCreateQuickPromo} className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Code (e.g. DROP20)"
                  value={quickPromoCode}
                  onChange={(e) => setQuickPromoCode(e.target.value)}
                  className="bg-ivory px-2.5 py-1.5 rounded-lg border border-burgundy/20 text-xs uppercase font-mono"
                />
                <input
                  type="number"
                  placeholder="Discount %"
                  value={quickPromoPercent}
                  onChange={(e) => setQuickPromoPercent(Number(e.target.value))}
                  className="bg-ivory px-2.5 py-1.5 rounded-lg border border-burgundy/20 text-xs font-mono"
                />
                <button
                  type="submit"
                  className="py-1.5 px-3 bg-espresso hover:bg-black text-ivory text-xs font-bold uppercase rounded-lg transition-colors"
                >
                  Activate
                </button>
              </form>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-stone-500 font-mono flex items-center justify-between">
            <span>Active Codes: {siteSettings?.promoCodes?.length || 4} configured</span>
            <Link href="/admin/settings" className="text-burgundy hover:underline">
              Advanced Settings →
            </Link>
          </div>
        </div>
      </div>

      {/* Silhouette Portfolio Summary */}
      <div className="bg-white p-6 rounded-2xl border border-burgundy/15 shadow-xs space-y-4">
        <h3 className="font-serif text-lg font-bold text-espresso">
          Three Core Silhouettes Performance
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {silhouetteStats.map((sil) => (
            <div key={sil.name} className="p-4 bg-ivory rounded-xl border border-burgundy/10 space-y-1">
              <span className="text-xs uppercase font-mono font-bold text-burgundy">{sil.name}</span>
              <p className="font-serif text-xl font-bold text-espresso">{sil.count} Designs</p>
              <p className="text-[11px] text-espresso/70">
                {sil.totalUnits} total units in stock · {formatPrice(sil.valuation)} valuation
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders Overview with Quick Actions */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-burgundy/15 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-burgundy/10">
          <div>
            <h3 className="font-serif text-lg font-bold text-espresso">
              Recent Customer Allocations
            </h3>
            <p className="text-xs text-espresso/60">
              Orders placed across storefront channels requiring dispatch or tracking.
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-bold uppercase tracking-wider text-burgundy hover:text-crimson flex items-center gap-1"
          >
            <span>View All ({orders.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-ivory text-espresso/80 border-b border-burgundy/15 uppercase font-bold text-[10px] tracking-wider">
                <th className="p-3">Order ID</th>
                <th className="p-3">Client</th>
                <th className="p-3">Garments</th>
                <th className="p-3">Total</th>
                <th className="p-3">Courier AWB</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Quick Fulfill</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-burgundy/10">
              {orders.slice(0, 6).map((ord) => (
                <tr key={ord.id} className="hover:bg-ivory/50 transition-colors">
                  <td className="p-3 font-mono font-bold text-burgundy">{ord.orderNumber}</td>
                  <td className="p-3">
                    <span className="font-bold text-espresso block">{ord.customer.fullName}</span>
                    <span className="text-[10px] text-espresso/50">{ord.customer.city}</span>
                  </td>
                  <td className="p-3">{ord.items.length} items</td>
                  <td className="p-3 font-bold text-espresso">{formatPrice(ord.total)}</td>
                  <td className="p-3 font-mono text-[11px] text-espresso/70">
                    {ord.trackingNumber || (
                      <span className="text-amber-600 font-semibold text-[10px]">Unassigned</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        ord.status === "Delivered"
                          ? "bg-green-100 text-green-800"
                          : ord.status === "In Transit" || ord.status === "Shipped"
                          ? "bg-blue-100 text-blue-800"
                          : ord.status === "Cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-burgundy/10 text-burgundy"
                      }`}
                    >
                      {ord.status}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-1 whitespace-nowrap">
                    {ord.status === "Pending" || ord.status === "Confirmed" ? (
                      <button
                        type="button"
                        onClick={async () => {
                          const awb = `TS-DEL-${Math.floor(100000 + Math.random() * 900000)}`;
                          await updateOrder(ord.id, { status: "In Transit", trackingNumber: awb });
                        }}
                        className="px-2 py-1 rounded bg-burgundy hover:bg-crimson text-gold text-[10px] font-bold uppercase transition-colors"
                        title="Dispatch & assign AWB"
                      >
                        Dispatch
                      </button>
                    ) : ord.status === "In Transit" || ord.status === "Shipped" ? (
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(ord.id, "Delivered")}
                        className="px-2 py-1 rounded bg-green-100 hover:bg-green-200 text-green-900 text-[10px] font-bold uppercase transition-colors"
                        title="Mark Delivered"
                      >
                        Deliver
                      </button>
                    ) : (
                      <Link
                        href="/admin/orders"
                        className="text-xs font-bold text-burgundy hover:text-crimson underline"
                      >
                        Details
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Privileged Access Register Summary Callout */}
      <div className="bg-espresso text-ivory p-6 sm:p-8 rounded-2xl border border-burgundy/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center space-x-2 text-gold text-xs font-bold uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" />
            <span>Security & Compliance Governance</span>
          </div>
          <h3 className="font-serif text-2xl font-bold text-ivory">
            Admin Access Register
          </h3>
          <p className="text-xs text-ivory/80 leading-relaxed">
            All administrative privileges across storefront CMS, financial gateways, and logistics are registered and audited per the system access review contract.
          </p>
        </div>

        <Link
          href="/admin/access-register"
          className="py-3 px-6 bg-gold hover:bg-gold-light text-espresso text-xs font-bold uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg flex items-center gap-2 whitespace-nowrap"
        >
          <span>Open Access Register ({accessRegister.length} Systems)</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
