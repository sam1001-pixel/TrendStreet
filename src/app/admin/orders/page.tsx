"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  MapPin,
  Calendar,
} from "lucide-react";
import { useAdminData } from "@/hooks/useAdminData";
import { AdminStatusBar } from "@/components/admin/AdminStatusBar";
import { formatPrice } from "@/lib/pricing";
import { OrderStatus } from "@/types/store";

const STATUS_LIST: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Processing",
  "In Transit",
  "Shipped",
  "Delivered",
  "Cancelled",
];

export default function AdminOrdersPage() {
  const { orders, updateOrderStatus, updateOrderTracking, loading, error, notice, clearError } = useAdminData({ orders: true });
  const [trackingDrafts, setTrackingDrafts] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [search, setSearch] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== "All" && o.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customer.fullName.toLowerCase().includes(q) ||
        o.customer.city.toLowerCase().includes(q) ||
        o.trackingNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <AdminStatusBar loading={loading} error={error} notice={notice} onDismiss={clearError} />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-burgundy/15 gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-crimson block mb-1">
            Fulfillment & Delivery Operations
          </span>
          <h1 className="font-serif text-3xl font-bold text-espresso">
            Customer Allocations ({orders.length})
          </h1>
          <p className="text-xs text-espresso/70 mt-0.5">
            Track luxury orders, update courier statuses, and inspect custom hem & silhouette notes.
          </p>
        </div>

        <span className="text-xs font-mono font-bold text-burgundy bg-burgundy/10 px-3.5 py-1.5 rounded-xl border border-burgundy/20 self-start sm:self-auto">
          Active Courier: DHL VIP Express & FedEx Priority
        </span>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-burgundy/15 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-espresso/40" />
          <input
            type="text"
            placeholder="Search order #, client name, tracking..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-ivory pl-10 pr-3 py-2 text-xs rounded-xl border border-burgundy/20 text-espresso focus:outline-none focus:border-burgundy"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setStatusFilter("All")}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === "All"
                ? "bg-burgundy text-gold font-bold"
                : "bg-ivory text-espresso hover:bg-ivory-dark"
            }`}
          >
            All Orders ({orders.length})
          </button>
          {STATUS_LIST.map((st) => {
            const count = orders.filter((o) => o.status === st).length;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === st
                    ? "bg-burgundy text-gold font-bold"
                    : "bg-ivory text-espresso hover:bg-ivory-dark"
                }`}
              >
                {st} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="p-12 bg-white rounded-2xl border border-burgundy/15 text-center text-xs text-espresso/60">
            No allocations found matching this criteria.
          </div>
        ) : (
          filteredOrders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white rounded-2xl border border-burgundy/15 p-6 shadow-xs space-y-4 hover:border-burgundy/30 transition-all"
            >
              {/* Header line */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-ivory-dark gap-2">
                <div className="flex items-center space-x-4">
                  <span className="font-mono font-bold text-sm text-burgundy">
                    {ord.orderNumber}
                  </span>
                  <span className="text-[11px] text-espresso/60">
                    Placed: {new Date(ord.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Status update dropdown */}
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-espresso/60 font-semibold">Status:</span>
                    <select
                      value={ord.status}
                      onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                      className={`text-xs font-bold uppercase rounded-lg px-2.5 py-1 border cursor-pointer ${
                        ord.status === "Delivered"
                          ? "bg-green-100 text-green-800 border-green-300"
                          : ord.status === "Shipped"
                          ? "bg-blue-100 text-blue-800 border-blue-300"
                          : "bg-burgundy/10 text-burgundy border-burgundy/30"
                      }`}
                    >
                      {STATUS_LIST.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <span className="text-sm font-bold text-espresso">
                    {formatPrice(ord.total)}
                  </span>
                </div>
              </div>

              {/* Customer and Logistics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-ivory p-3.5 rounded-xl border border-burgundy/10">
                <div>
                  <span className="font-bold text-espresso block">{ord.customer.fullName}</span>
                  <span className="text-[11px] text-espresso/60 block">{ord.customer.email}</span>
                  <span className="text-[11px] text-espresso/60 block">{ord.customer.phone}</span>
                </div>

                <div>
                  <span className="font-bold text-espresso block">Destination</span>
                  <span className="text-[11px] text-espresso/70 block">
                    {ord.customer.address}, {ord.customer.apartment && `${ord.customer.apartment}, `}{ord.customer.city}
                  </span>
                  <span className="text-[11px] text-espresso/70 block">
                    {ord.customer.postalCode}, {ord.customer.country}
                  </span>
                </div>

                <div>
                  <span className="font-bold text-espresso block">Logistics & Courier</span>
                  <form
                    className="mt-1 flex gap-1.5"
                    onSubmit={(e) => {
                      e.preventDefault();
                      updateOrderTracking(ord.id, trackingDrafts[ord.id] ?? ord.trackingNumber);
                    }}
                  >
                    <label htmlFor={`trk-${ord.id}`} className="sr-only">Courier tracking number</label>
                    <input
                      id={`trk-${ord.id}`}
                      value={trackingDrafts[ord.id] ?? ord.trackingNumber}
                      onChange={(e) => setTrackingDrafts((d) => ({ ...d, [ord.id]: e.target.value }))}
                      placeholder="Blue Dart / Delhivery AWB"
                      className="min-w-0 flex-1 rounded-lg border border-burgundy/20 bg-white px-2 py-1.5 font-mono text-[11px] text-burgundy focus:border-burgundy focus:outline-none"
                    />
                    <button type="submit" className="rounded-lg bg-burgundy px-2.5 text-[10px] font-bold uppercase text-white hover:bg-crimson">
                      Save
                    </button>
                  </form>
                  <span className="text-[10px] text-espresso/60 uppercase block">
                    Payment: {ord.paymentMethod.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Items row */}
              <div className="pt-1 flex flex-wrap items-center gap-3">
                {ord.items.map((it, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-burgundy/15 text-xs"
                  >
                    <img
                      src={it.image}
                      alt={it.productName}
                      className="w-8 h-10 object-cover rounded bg-ivory-dark"
                    />
                    <div>
                      <span className="font-semibold text-espresso block line-clamp-1">
                        {it.productName}
                      </span>
                      <span className="text-[10px] text-espresso/60">
                        {it.selectedSize} • {it.selectedColor} (Qty: {it.quantity})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
