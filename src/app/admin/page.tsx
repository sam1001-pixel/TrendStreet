"use client";

import React from "react";
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
} from "lucide-react";
import { useAdminData } from "@/hooks/useAdminData";
import { AdminStatusBar } from "@/components/admin/AdminStatusBar";
import { formatPrice } from "@/lib/pricing";
import { useAdminAuth } from "@/context/AdminAuthContext";

export default function AdminDashboardPage() {
  const { products, orders, loading, error, notice, clearError } = useAdminData({ orders: true, products: true });
  const { adminName, accessRegister } = useAdminAuth();

  // Metrics calculation
  // Cancelled orders are not revenue.
  const liveOrders = orders.filter((o) => o.status !== "Cancelled");
  const totalRevenue = liveOrders.reduce((sum, o) => sum + o.total, 0);
  const averageOrderValue = liveOrders.length > 0 ? Math.round(totalRevenue / liveOrders.length) : 0;
  const inStockCount = products.filter((p) => p.inStock).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
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
            Real-time analytics, inventory oversight, order fulfillment, and system access review.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/settings"
            className="py-2.5 px-4 bg-burgundy hover:bg-crimson text-gold text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Site Customizer (Live)</span>
          </Link>

          <Link
            href="/admin/products"
            className="py-2.5 px-4 bg-white border border-burgundy/25 hover:border-burgundy text-burgundy text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Shirt className="w-3.5 h-3.5" />
            <span>Manage Products</span>
          </Link>

          <Link
            href="/admin/access-register"
            className="py-2.5 px-4 bg-white border border-burgundy/25 hover:border-burgundy text-burgundy text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Access Register</span>
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
            Across 12 worldwide luxury territories
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
            Luxury jackets & oversized streetwear outerwear
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
            {inStockCount} active in stock for dispatch
          </p>
        </div>
      </div>

      {/* Recent Orders Overview */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-burgundy/15 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-burgundy/10">
          <div>
            <h3 className="font-serif text-lg font-bold text-espresso">
              Recent Customer Allocations
            </h3>
            <p className="text-xs text-espresso/60">
              Orders placed across storefront channels requiring dispatch or alteration.
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-bold uppercase tracking-wider text-burgundy hover:text-crimson flex items-center gap-1"
          >
            <span>View All Orders</span>
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
                <th className="p-3">Courier</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-burgundy/10">
              {orders.slice(0, 5).map((ord) => (
                <tr key={ord.id} className="hover:bg-ivory/50 transition-colors">
                  <td className="p-3 font-mono font-bold text-burgundy">{ord.orderNumber}</td>
                  <td className="p-3">
                    <span className="font-bold text-espresso block">{ord.customer.fullName}</span>
                    <span className="text-[10px] text-espresso/50">{ord.customer.city}, {ord.customer.country}</span>
                  </td>
                  <td className="p-3">{ord.items.length} items</td>
                  <td className="p-3 font-bold text-espresso">{formatPrice(ord.total)}</td>
                  <td className="p-3 font-mono text-[11px] text-espresso/70">{ord.trackingNumber}</td>
                  <td className="p-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        ord.status === "Delivered"
                          ? "bg-green-100 text-green-800"
                          : "bg-burgundy/10 text-burgundy"
                      }`}
                    >
                      {ord.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      href="/admin/orders"
                      className="text-xs font-bold text-burgundy hover:text-crimson underline"
                    >
                      Manage
                    </Link>
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
