"use client";

import React, { useState, useEffect } from "react";
import {
  Tag,
  Plus,
  Percent,
  Calendar,
  CheckCircle,
  XCircle,
  Trash2,
  RefreshCw,
  X,
  AlertTriangle,
  Gift,
  Shield,
} from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatPrice } from "@/lib/pricing";

interface Coupon {
  id: string;
  code: string;
  discountPercent: number;
  description: string | null;
  active: boolean;
  minSpend: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
}

export default function AdminDiscountsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    discountPercent: 15,
    description: "",
    minSpend: 1999,
    maxUses: 100,
    expiresAt: "",
  });

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/discounts");
      if (!res.ok) throw new Error("Failed to load coupons");
      const data = await res.json();
      setCoupons(data.coupons || []);
    } catch (err) {
      console.error("[Discounts Fetch]:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create coupon");

      setModalOpen(false);
      setFormData({
        code: "",
        discountPercent: 15,
        description: "",
        minSpend: 1999,
        maxUses: 100,
        expiresAt: "",
      });
      fetchCoupons();
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const res = await fetch("/api/admin/discounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: coupon.id, active: !coupon.active }),
      });
      if (!res.ok) throw new Error("Failed to toggle coupon status");
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, active: !c.active } : c))
      );
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete coupon '${code}'?`)) return;
    try {
      const res = await fetch(`/api/admin/discounts?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete coupon");
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const activeCount = coupons.filter((c) => c.active).length;
  const totalRedemptions = coupons.reduce((acc, c) => acc + c.usedCount, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-espresso/10 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-gold uppercase tracking-widest">
            <Tag className="w-3.5 h-3.5" />
            <span>Marketing & Promotions</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-espresso tracking-tight mt-1">
            Discounts & Coupons
          </h1>
          <p className="text-xs text-espresso/60 mt-1 max-w-xl">
            Configure percentage promo codes, minimum spend thresholds, usage limits, and expiration dates.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchCoupons}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-espresso/15 bg-white text-espresso hover:bg-espresso/5 transition-colors"
            title="Refresh Promotions"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-burgundy" : ""}`} />
          </button>

          <button
            onClick={() => {
              setErrorMsg(null);
              setModalOpen(true);
            }}
            className="px-4 py-2.5 bg-burgundy hover:bg-burgundy/90 text-gold text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center space-x-2 border border-gold/30"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Coupon</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatCard
          title="Active Promotions"
          value={activeCount}
          subtitle="Currently claimable at checkout"
          icon={Tag}
          badge="Live"
        />
        <StatCard
          title="Total Redemptions"
          value={totalRedemptions}
          subtitle="Customer checkouts using codes"
          icon={CheckCircle}
        />
        <StatCard
          title="Catalog Codes"
          value={coupons.length}
          subtitle="Total promo rules created"
          icon={Gift}
        />
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-2xl border border-espresso/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-espresso text-ivory text-[10px] uppercase tracking-wider">
              <tr>
                <th className="p-3.5 pl-6 font-bold">Promo Code</th>
                <th className="p-3.5 font-bold">Discount Rate</th>
                <th className="p-3.5 font-bold">Minimum Spend</th>
                <th className="p-3.5 text-center font-bold">Usage / Limit</th>
                <th className="p-3.5 text-center font-bold">Expiration</th>
                <th className="p-3.5 text-center font-bold">Status</th>
                <th className="p-3.5 pr-6 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso/5 font-sans">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-espresso/[0.02] transition-colors">
                  <td className="p-3.5 pl-6">
                    <div className="space-y-0.5">
                      <span className="font-mono font-bold text-sm text-burgundy bg-burgundy/10 px-2 py-0.5 rounded border border-burgundy/20 inline-block">
                        {c.code}
                      </span>
                      {c.description && (
                        <p className="text-[11px] text-espresso/60 italic">{c.description}</p>
                      )}
                    </div>
                  </td>

                  <td className="p-3.5 font-bold font-mono text-sm text-espresso">
                    {c.discountPercent}% OFF
                  </td>

                  <td className="p-3.5 font-mono text-espresso font-semibold">
                    {c.minSpend > 0 ? formatPrice(c.minSpend) : "No Minimum"}
                  </td>

                  <td className="p-3.5 text-center">
                    <span className="font-mono text-xs font-bold text-espresso">
                      {c.usedCount}
                    </span>
                    <span className="text-espresso/50 font-mono text-[10px]">
                      {" "}
                      / {c.maxUses ? c.maxUses : "∞"}
                    </span>
                  </td>

                  <td className="p-3.5 text-center font-mono text-espresso/70 text-[11px]">
                    {c.expiresAt ? c.expiresAt : "Perpetual"}
                  </td>

                  <td className="p-3.5 text-center">
                    <StatusBadge label={c.active ? "Active" : "Inactive"} size="sm" />
                  </td>

                  <td className="p-3.5 pr-6 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleToggleActive(c)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors border ${
                          c.active
                            ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                        }`}
                      >
                        {c.active ? "Deactivate" : "Activate"}
                      </button>

                      <button
                        onClick={() => handleDeleteCoupon(c.id, c.code)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {coupons.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-espresso/60 space-y-2">
                    <Tag className="w-8 h-8 text-espresso/30 mx-auto" />
                    <p className="font-semibold text-sm">No promotional codes found.</p>
                    <p className="text-xs text-espresso/40">Create your first coupon using the button above.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Coupon Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-ivory rounded-2xl shadow-2xl border border-gold/30 overflow-hidden flex flex-col">
            <div className="bg-espresso p-4 text-ivory flex items-center justify-between border-b border-burgundy/40">
              <div className="flex items-center space-x-2">
                <Tag className="w-4 h-4 text-gold" />
                <span className="font-serif font-bold text-sm text-ivory">
                  Create Promotional Code
                </span>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-ivory/60 hover:text-ivory rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-espresso/80">
                  Promo Code (e.g. LUXURY20)
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="BUNDLE15"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-espresso/20 text-espresso font-mono font-bold text-sm uppercase focus:ring-2 focus:ring-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-espresso/80">
                    Discount Rate (%)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    required
                    value={formData.discountPercent}
                    onChange={(e) => setFormData({ ...formData, discountPercent: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-espresso/20 text-espresso font-mono font-bold focus:ring-2 focus:ring-gold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-espresso/80">
                    Min Spend (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.minSpend}
                    onChange={(e) => setFormData({ ...formData, minSpend: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-espresso/20 text-espresso font-mono font-bold focus:ring-2 focus:ring-gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-espresso/80">
                    Max Redemptions
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value, 10) || 100 })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-espresso/20 text-espresso font-mono focus:ring-2 focus:ring-gold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-espresso/80">
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-espresso/20 text-espresso font-mono focus:ring-2 focus:ring-gold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-espresso/80">
                  Description / Campaign Target
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Autumn / Winter VIP Launch Discount"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-espresso/20 text-espresso focus:ring-2 focus:ring-gold"
                />
              </div>

              <div className="pt-3 border-t border-espresso/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 font-bold text-espresso/70 hover:text-espresso"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-burgundy hover:bg-burgundy/90 text-gold font-bold uppercase tracking-wider rounded-xl shadow-md border border-gold/30"
                >
                  Publish Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
