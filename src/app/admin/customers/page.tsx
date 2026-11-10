"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Download,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  X,
  Shield,
} from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatPrice } from "@/lib/pricing";

interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  postalCode: string;
  orderCount: number;
  lifetimeSpend: number;
  memberSince: string;
  lastOrderDate: string | null;
  status: string;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [metrics, setMetrics] = useState({
    totalCustomers: 0,
    totalRevenue: 0,
    avgLifetimeValue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/customers?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load customers");
      const data = await res.json();
      setCustomers(data.customers || []);
      if (data.metrics) setMetrics(data.metrics);
    } catch (err) {
      console.error("[Customers Fetch]:", err);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("export", "csv");

      const res = await fetch(`/api/admin/customers?${params.toString()}`);
      if (!res.ok) throw new Error("CSV Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trendstreet-customers-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Could not export customers CSV: " + (err as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-espresso/10 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-gold uppercase tracking-widest">
            <Users className="w-3.5 h-3.5" />
            <span>Patron Directory & CRM</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-espresso tracking-tight mt-1">
            Customer Relations
          </h1>
          <p className="text-xs text-espresso/60 mt-1 max-w-xl">
            Directory of patrons, order frequencies, lifetime spend in INR, and formula-injection-safe export.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchCustomers()}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-espresso/15 bg-white text-espresso hover:bg-espresso/5 transition-colors disabled:opacity-50"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-burgundy" : ""}`} />
          </button>

          <button
            onClick={handleExportCsv}
            disabled={isExporting || customers.length === 0}
            className="px-4 py-2.5 bg-white border border-espresso/20 hover:border-gold text-espresso text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs hover:shadow-sm transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-burgundy" />
            <span>{isExporting ? "Exporting..." : "Export Safe CSV"}</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatCard
          title="Total Patrons"
          value={metrics.totalCustomers}
          subtitle="Registered & guest purchasers"
          icon={Users}
          badge="Patrons"
        />
        <StatCard
          title="Lifetime Revenue"
          value={formatPrice(metrics.totalRevenue)}
          subtitle="Total realized sales in INR"
          icon={DollarSign}
        />
        <StatCard
          title="Average Order Value / LTV"
          value={formatPrice(metrics.avgLifetimeValue)}
          subtitle="Mean lifetime value per patron"
          icon={TrendingUp}
        />
      </div>

      {/* Search Input Bar */}
      <div className="bg-white/80 p-4 rounded-2xl border border-espresso/10 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-espresso/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patron name, email address, phone, or city..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-espresso/5 border border-espresso/10 text-xs font-semibold text-espresso focus:outline-none focus:ring-2 focus:ring-gold"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-espresso/40 hover:text-espresso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-espresso/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-espresso text-ivory text-[10px] uppercase tracking-wider">
              <tr>
                <th className="p-3.5 pl-6 font-bold">Patron Name</th>
                <th className="p-3.5 font-bold">Contact Coordinates</th>
                <th className="p-3.5 font-bold">Location</th>
                <th className="p-3.5 text-center font-bold">Orders</th>
                <th className="p-3.5 text-right font-bold">Lifetime Spend</th>
                <th className="p-3.5 text-center font-bold">First Order</th>
                <th className="p-3.5 text-center font-bold">Status</th>
                <th className="p-3.5 pr-6 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso/5 font-sans">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-espresso/[0.02] transition-colors group">
                  <td className="p-3.5 pl-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-burgundy/10 text-burgundy font-bold flex items-center justify-center text-xs shrink-0 border border-burgundy/20">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-espresso block">{c.name}</span>
                        <span className="text-[10px] text-espresso/50 font-mono">
                          ID: {c.id.slice(0, 10)}...
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="p-3.5">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-espresso/80">
                        <Mail className="w-3 h-3 text-burgundy" />
                        <span className="font-mono text-[11px]">{c.email}</span>
                      </div>
                      {c.phone && c.phone !== "—" && (
                        <div className="flex items-center gap-1.5 text-espresso/60">
                          <Phone className="w-3 h-3 text-gold" />
                          <span className="font-mono text-[10px]">{c.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="p-3.5">
                    <div className="flex items-center gap-1.5 text-espresso/80">
                      <MapPin className="w-3 h-3 text-espresso/40 shrink-0" />
                      <span>
                        {c.city}
                        {c.state !== "—" ? `, ${c.state}` : ""}
                      </span>
                    </div>
                  </td>

                  <td className="p-3.5 text-center">
                    <span className="px-2 py-0.5 rounded-lg bg-espresso/5 text-espresso font-mono font-bold text-xs">
                      {c.orderCount}
                    </span>
                  </td>

                  <td className="p-3.5 text-right font-mono font-bold text-sm text-espresso">
                    {formatPrice(c.lifetimeSpend)}
                  </td>

                  <td className="p-3.5 text-center text-espresso/60 font-mono text-[11px]">
                    {c.memberSince}
                  </td>

                  <td className="p-3.5 text-center">
                    <StatusBadge label={c.status} size="sm" />
                  </td>

                  <td className="p-3.5 pr-6 text-right">
                    <button
                      onClick={() => setSelectedCustomer(c)}
                      className="px-2.5 py-1.5 rounded-lg bg-espresso/5 hover:bg-burgundy text-espresso hover:text-gold text-xs font-bold uppercase tracking-wider transition-colors border border-espresso/10"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}

              {customers.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-espresso/60 space-y-2">
                    <Users className="w-8 h-8 text-espresso/30 mx-auto" />
                    <p className="font-semibold text-sm">No patrons found matching your query.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Profile Inspection Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-ivory rounded-2xl shadow-2xl border border-gold/30 overflow-hidden flex flex-col">
            <div className="bg-espresso p-4 text-ivory flex items-center justify-between border-b border-burgundy/40">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gold" />
                <span className="font-serif font-bold text-sm text-ivory">
                  Patron Dossier
                </span>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 text-ivory/60 hover:text-ivory rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center space-x-3 pb-4 border-b border-espresso/10">
                <div className="w-12 h-12 rounded-2xl bg-burgundy text-gold font-serif font-bold flex items-center justify-center text-lg border border-gold/30">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-espresso">
                    {selectedCustomer.name}
                  </h3>
                  <p className="text-[11px] text-espresso/60 font-mono">
                    {selectedCustomer.email}
                  </p>
                  <StatusBadge label={selectedCustomer.status} size="sm" className="mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-xl border border-espresso/10 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-espresso/50">Total Orders</span>
                  <p className="font-mono font-bold text-base text-espresso">{selectedCustomer.orderCount}</p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-espresso/10 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-espresso/50">Lifetime Spend</span>
                  <p className="font-mono font-bold text-base text-emerald-700">{formatPrice(selectedCustomer.lifetimeSpend)}</p>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-espresso/10 space-y-2">
                <p className="text-[10px] uppercase font-bold text-espresso/50 tracking-wider">Shipping & Contact Details</p>
                <p><span className="text-espresso/60">Phone:</span> <strong>{selectedCustomer.phone}</strong></p>
                <p><span className="text-espresso/60">Address:</span> <strong>{selectedCustomer.city}, {selectedCustomer.state} ({selectedCustomer.postalCode})</strong></p>
                <p><span className="text-espresso/60">Member Since:</span> <strong>{selectedCustomer.memberSince}</strong></p>
                <p><span className="text-espresso/60">Last Transaction:</span> <strong>{selectedCustomer.lastOrderDate || "—"}</strong></p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="px-4 py-2 bg-espresso text-ivory text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-burgundy transition-colors"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
