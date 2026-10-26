"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  Package,
  Shirt,
  CreditCard,
  RefreshCw,
  AlertCircle,
  PieChart,
} from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { formatPrice } from "@/lib/pricing";

interface AnalyticsData {
  summary: {
    grossSales: number;
    netSales: number;
    refundedAmount: number;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    aov: number;
    unitsSold: number;
  };
  silhouettes: Array<{
    name: string;
    units: number;
    revenue: number;
    percentage: number;
  }>;
  paymentMethods: {
    razorpay: { count: number; revenue: number };
    cod: { count: number; revenue: number };
  };
  dailyTrends: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
}

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState<"today" | "7d" | "30d" | "90d">("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?range=${range}`);
      if (!res.ok) throw new Error("Failed to load analytics");
      const resData = await res.json();
      setData(resData);
    } catch (err) {
      console.error("[Analytics Fetch]:", err);
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`/api/admin/analytics?range=${range}&export=csv`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trendstreet-report-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error exporting CSV: " + (err as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  const summary = data?.summary || {
    grossSales: 0,
    netSales: 0,
    refundedAmount: 0,
    totalOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    aov: 0,
    unitsSold: 0,
  };

  // Find max revenue for chart scaling
  const maxRevenue = data?.dailyTrends?.reduce((max, d) => Math.max(max, d.revenue), 1) || 1;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-espresso/10 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-gold uppercase tracking-widest">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Commerce Intelligence & Financials</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-espresso tracking-tight mt-1">
            Analytics & Reports
          </h1>
          <p className="text-xs text-espresso/60 mt-1 max-w-xl">
            Real-time financial performance, silhouette distribution, and payment gateway reconciliation.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Date Range Selector */}
          <div className="flex items-center space-x-1 bg-white border border-espresso/15 p-1 rounded-xl shadow-xs">
            {(["today", "7d", "30d", "90d"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase ${
                  range === r
                    ? "bg-burgundy text-gold shadow-xs"
                    : "text-espresso/70 hover:text-espresso"
                }`}
              >
                {r === "today" ? "Today" : r.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-espresso/15 bg-white text-espresso hover:bg-espresso/5 transition-colors"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-burgundy" : ""}`} />
          </button>

          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className="px-4 py-2.5 bg-burgundy hover:bg-burgundy/90 text-gold text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center space-x-2 border border-gold/30 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? "Exporting..." : "Safe CSV Report"}</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Net Realized Sales"
          value={formatPrice(summary.netSales)}
          subtitle="Excludes cancelled & refunded"
          icon={DollarSign}
          badge="Net"
        />
        <StatCard
          title="Gross Sales Value"
          value={formatPrice(summary.grossSales)}
          subtitle={`${summary.totalOrders} total order submissions`}
          icon={TrendingUp}
        />
        <StatCard
          title="Average Order Value"
          value={formatPrice(summary.aov)}
          subtitle="Mean cart size at checkout"
          icon={CreditCard}
        />
        <StatCard
          title="Garments Sold"
          value={`${summary.unitsSold} pcs`}
          subtitle={`${summary.completedOrders} fulfilled shipments`}
          icon={Shirt}
        />
      </div>

      {/* Daily Sales Trend SVG Bar Chart */}
      <div className="p-6 bg-white rounded-2xl border border-espresso/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-burgundy" />
            <h3 className="font-serif font-bold text-base text-espresso">
              Daily Revenue Trajectory ({range.toUpperCase()})
            </h3>
          </div>
          <span className="text-xs font-mono text-espresso/60">
            Total Volume: <strong>{formatPrice(summary.netSales)}</strong>
          </span>
        </div>

        {data?.dailyTrends && data.dailyTrends.length > 0 ? (
          <div className="pt-6">
            <div className="h-48 flex items-end gap-2 sm:gap-3 border-b border-espresso/15 pb-2 overflow-x-auto">
              {data.dailyTrends.map((d) => {
                const heightPercent = Math.max(8, Math.round((d.revenue / maxRevenue) * 100));
                return (
                  <div
                    key={d.date}
                    className="flex-1 flex flex-col items-center min-w-[28px] group relative"
                  >
                    {/* Tooltip on Hover */}
                    <div className="absolute -top-10 bg-espresso text-ivory text-[10px] py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-md">
                      {d.date}: {formatPrice(d.revenue)} ({d.orders} orders)
                    </div>
                    {/* Bar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full rounded-t-md bg-gradient-to-t from-burgundy to-crimson group-hover:from-crimson group-hover:to-gold transition-all cursor-pointer shadow-xs"
                    />
                    {/* Date label */}
                    <span className="text-[9px] font-mono text-espresso/50 mt-2 truncate w-full text-center">
                      {d.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-espresso/50 text-xs">
            No daily transactions recorded in the selected date window.
          </div>
        )}
      </div>

      {/* Silhouette Breakdown & Payment Providers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Silhouette Performance */}
        <div className="p-6 bg-white rounded-2xl border border-espresso/10 shadow-xs space-y-4">
          <div className="flex items-center space-x-2">
            <Shirt className="w-4 h-4 text-burgundy" />
            <h3 className="font-serif font-bold text-base text-espresso">
              Silhouette Category Distribution
            </h3>
          </div>

          <div className="space-y-4">
            {data?.silhouettes.map((s) => (
              <div key={s.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-espresso">{s.name}</span>
                  <div className="space-x-2">
                    <span className="font-mono text-espresso/60">{s.units} units</span>
                    <span className="font-bold text-burgundy">{formatPrice(s.revenue)}</span>
                    <span className="font-mono text-[10px] text-gold bg-espresso px-1.5 py-0.2 rounded font-semibold">
                      {s.percentage}%
                    </span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-espresso/5 overflow-hidden">
                  <div
                    style={{ width: `${s.percentage}%` }}
                    className="h-full bg-gradient-to-r from-burgundy to-gold rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Gateways Matrix */}
        <div className="p-6 bg-white rounded-2xl border border-espresso/10 shadow-xs space-y-4">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-burgundy" />
            <h3 className="font-serif font-bold text-base text-espresso">
              Payment Gateway Settlement Matrix
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Razorpay */}
            <div className="p-4 bg-espresso/5 rounded-2xl border border-espresso/10 space-y-2">
              <span className="text-[10px] uppercase font-bold text-burgundy tracking-wider block">
                Razorpay (Prepaid)
              </span>
              <p className="font-serif font-bold text-xl text-espresso">
                {formatPrice(data?.paymentMethods.razorpay.revenue || 0)}
              </p>
              <p className="text-[11px] text-espresso/60 font-mono">
                {data?.paymentMethods.razorpay.count || 0} successful checkouts
              </p>
            </div>

            {/* COD */}
            <div className="p-4 bg-espresso/5 rounded-2xl border border-espresso/10 space-y-2">
              <span className="text-[10px] uppercase font-bold text-gold tracking-wider block">
                Cash On Delivery
              </span>
              <p className="font-serif font-bold text-xl text-espresso">
                {formatPrice(data?.paymentMethods.cod.revenue || 0)}
              </p>
              <p className="text-[11px] text-espresso/60 font-mono">
                {data?.paymentMethods.cod.count || 0} destination collections
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-ivory border border-espresso/10 text-xs text-espresso/70 space-y-1">
            <p className="font-bold text-espresso">Reconciliation Notes:</p>
            <p className="text-[11px]">
              Razorpay captures are verified via HMAC-SHA256 signatures with integer paise arithmetic.
              COD orders settle upon delivery verification by courier partner.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
