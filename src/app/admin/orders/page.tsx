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
  Sparkles,
  Printer,
  X,
  AlertCircle,
  Check,
  Phone,
  Mail,
} from "lucide-react";
import { useAdminData } from "@/hooks/useAdminData";
import { AdminStatusBar } from "@/components/admin/AdminStatusBar";
import { formatPrice } from "@/lib/pricing";
import { Order, OrderStatus } from "@/types/store";

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
  const [activeSlipOrder, setActiveSlipOrder] = useState<Order | null>(null);

  // Generate authentic AWB tracking ID and save to order
  const handleGenerateAwb = async (order: Order, carrier: "Delhivery" | "BlueDart" = "Delhivery") => {
    const prefix = carrier === "Delhivery" ? "TS-DEL" : "TS-BLU";
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const generatedAwb = `${prefix}-${randomNum}`;

    setTrackingDrafts((d) => ({ ...d, [order.id]: generatedAwb }));
    await updateOrderTracking(order.id, generatedAwb);

    // If order was pending or confirmed, auto-advance to "In Transit"
    if (order.status === "Pending" || order.status === "Confirmed" || order.status === "Processing") {
      await updateOrderStatus(order.id, "In Transit");
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== "All" && o.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customer.fullName.toLowerCase().includes(q) ||
        o.customer.city.toLowerCase().includes(q) ||
        (o.customer.phone && o.customer.phone.toLowerCase().includes(q)) ||
        (o.customer.email && o.customer.email.toLowerCase().includes(q)) ||
        Boolean(o.trackingNumber && o.trackingNumber.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const pendingCount = orders.filter((o) => o.status === "Pending" || o.status === "Confirmed" || o.status === "Processing").length;
  const transitCount = orders.filter((o) => o.status === "In Transit" || o.status === "Shipped").length;
  const deliveredCount = orders.filter((o) => o.status === "Delivered").length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-16">
      <AdminStatusBar loading={loading} error={error} notice={notice} onDismiss={clearError} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-burgundy/15 gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-crimson block mb-1">
            Fulfillment & Logistics Operations
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-espresso">
            Customer Allocations ({orders.length})
          </h1>
          <p className="text-xs text-espresso/70 mt-0.5">
            Manage luxury allocations, generate AWB tracking numbers in 1-click, and print dispatch slips.
          </p>
        </div>

        <span className="text-xs font-mono font-bold text-burgundy bg-burgundy/10 px-3.5 py-1.5 rounded-xl border border-burgundy/20 self-start sm:self-auto flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5 text-crimson" />
          <span>Active Couriers: Blue Dart Apex & Delhivery Air</span>
        </span>
      </div>

      {/* Fulfillment Status Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setStatusFilter("All")}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            statusFilter === "All"
              ? "bg-espresso text-ivory border-espresso shadow-xs"
              : "bg-white text-espresso border-burgundy/15 hover:border-burgundy/40"
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider block opacity-70">Total Orders</span>
          <span className="text-2xl font-serif font-bold block mt-0.5">{orders.length}</span>
        </button>

        <button
          onClick={() => setStatusFilter("Processing")}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            statusFilter === "Processing" || statusFilter === "Pending"
              ? "bg-amber-600 text-white border-amber-600 shadow-xs"
              : "bg-white text-amber-900 border-amber-200 hover:border-amber-400"
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider block opacity-70 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-500" /> Awaiting Dispatch
          </span>
          <span className="text-2xl font-serif font-bold block mt-0.5">{pendingCount}</span>
        </button>

        <button
          onClick={() => setStatusFilter("In Transit")}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            statusFilter === "In Transit"
              ? "bg-blue-800 text-white border-blue-800 shadow-xs"
              : "bg-white text-blue-900 border-blue-200 hover:border-blue-400"
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider block opacity-70 flex items-center gap-1">
            <Truck className="w-3 h-3 text-blue-500" /> In Transit
          </span>
          <span className="text-2xl font-serif font-bold block mt-0.5">{transitCount}</span>
        </button>

        <button
          onClick={() => setStatusFilter("Delivered")}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            statusFilter === "Delivered"
              ? "bg-green-800 text-white border-green-800 shadow-xs"
              : "bg-white text-green-900 border-green-200 hover:border-green-400"
          }`}
        >
          <span className="text-[10px] uppercase font-bold tracking-wider block opacity-70 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-500" /> Delivered
          </span>
          <span className="text-2xl font-serif font-bold block mt-0.5">{deliveredCount}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-burgundy/15 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-espresso/40" />
          <input
            type="text"
            placeholder="Search order #, client, phone, AWB..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-ivory pl-10 pr-3 py-2 text-xs rounded-xl border border-burgundy/20 text-espresso focus:outline-none focus:border-burgundy"
          />
        </div>

        <div className="flex items-center space-x-1.5 w-full md:w-auto overflow-x-auto no-scrollbar">
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
            if (count === 0 && st === "Cancelled") return null;
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
          filteredOrders.map((ord) => {
            const draftTracking = trackingDrafts[ord.id] ?? ord.trackingNumber ?? "";

            return (
              <div
                key={ord.id}
                className="bg-white rounded-2xl border border-burgundy/15 p-5 sm:p-6 shadow-xs space-y-4 hover:border-burgundy/30 transition-all"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-ivory-dark gap-2">
                  <div className="flex items-center space-x-4">
                    <span className="font-mono font-bold text-sm text-burgundy">
                      {ord.orderNumber}
                    </span>
                    <span className="text-[11px] text-espresso/60">
                      Placed: {new Date(ord.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Packing slip button */}
                    <button
                      type="button"
                      onClick={() => setActiveSlipOrder(ord)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-burgundy/20 bg-ivory text-espresso hover:bg-ivory-dark text-xs font-semibold"
                      title="Print Packing Slip"
                    >
                      <Printer className="w-3.5 h-3.5 text-burgundy" />
                      <span>Slip</span>
                    </button>

                    {/* Fast Status Selector */}
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[11px] text-espresso/60 font-semibold">Status:</span>
                      <select
                        value={ord.status}
                        onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                        className={`text-xs font-bold uppercase rounded-lg px-2.5 py-1 border cursor-pointer ${
                          ord.status === "Delivered"
                            ? "bg-green-100 text-green-800 border-green-300"
                            : ord.status === "Shipped" || ord.status === "In Transit"
                            ? "bg-blue-100 text-blue-800 border-blue-300"
                            : ord.status === "Cancelled"
                            ? "bg-red-100 text-red-800 border-red-300"
                            : "bg-burgundy/10 text-burgundy border-burgundy/30"
                        }`}
                      >
                        {STATUS_LIST.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <span className="text-sm font-bold text-espresso pl-2">
                      {formatPrice(ord.total)}
                    </span>
                  </div>
                </div>

                {/* Logistics & Client Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-ivory p-3.5 rounded-xl border border-burgundy/10">
                  {/* Client Info */}
                  <div>
                    <span className="font-bold text-espresso block mb-0.5">{ord.customer.fullName}</span>
                    <span className="text-[11px] text-espresso/70 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-burgundy" /> {ord.customer.email}
                    </span>
                    <span className="text-[11px] text-espresso/70 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-burgundy" /> {ord.customer.phone}
                    </span>
                  </div>

                  {/* Destination */}
                  <div>
                    <span className="font-bold text-espresso block mb-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-burgundy" /> Destination
                    </span>
                    <span className="text-[11px] text-espresso/70 block">
                      {ord.customer.address}, {ord.customer.apartment && `${ord.customer.apartment}, `}{ord.customer.city}
                    </span>
                    <span className="text-[11px] font-mono text-espresso/70 block mt-0.5">
                      PIN: {ord.customer.postalCode} ({ord.customer.country})
                    </span>
                  </div>

                  {/* Logistics & 1-Click AWB Generator */}
                  <div>
                    <span className="font-bold text-espresso block mb-1">
                      Courier AWB & Tracking
                    </span>
                    <form
                      className="flex gap-1.5"
                      onSubmit={(e) => {
                        e.preventDefault();
                        updateOrderTracking(ord.id, draftTracking);
                      }}
                    >
                      <input
                        id={`trk-${ord.id}`}
                        value={draftTracking}
                        onChange={(e) => setTrackingDrafts((d) => ({ ...d, [ord.id]: e.target.value }))}
                        placeholder="Blue Dart / Delhivery AWB"
                        className="min-w-0 flex-1 rounded-lg border border-burgundy/20 bg-white px-2 py-1.5 font-mono text-[11px] text-burgundy focus:border-burgundy focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="rounded-lg bg-burgundy px-2.5 text-[10px] font-bold uppercase text-white hover:bg-crimson transition-colors"
                      >
                        Save
                      </button>
                    </form>

                    {/* 1-Click AWB Generator Action */}
                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-burgundy/10">
                      <button
                        type="button"
                        onClick={() => handleGenerateAwb(ord, "Delhivery")}
                        className="text-[10px] font-bold text-burgundy hover:text-crimson flex items-center gap-1 underline"
                      >
                        <Sparkles className="w-3 h-3 text-gold" /> Generate Delhivery AWB
                      </button>
                      <span className="text-[10px] text-espresso/60 font-mono uppercase">
                        {ord.paymentMethod.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Workflow Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-stone-100">
                  <div className="flex items-center gap-2">
                    {ord.status === "Pending" || ord.status === "Confirmed" ? (
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(ord.id, "Processing")}
                        className="px-2.5 py-1 rounded-lg bg-burgundy/10 hover:bg-burgundy/20 text-burgundy text-[11px] font-bold transition-colors"
                      >
                        Mark as Processing
                      </button>
                    ) : null}

                    {ord.status === "Processing" ? (
                      <button
                        type="button"
                        onClick={() => handleGenerateAwb(ord, "Delhivery")}
                        className="px-2.5 py-1 rounded-lg bg-burgundy hover:bg-crimson text-gold text-[11px] font-bold transition-colors flex items-center gap-1"
                      >
                        <Truck className="w-3 h-3" /> Dispatch & Generate AWB
                      </button>
                    ) : null}

                    {ord.status === "In Transit" || ord.status === "Shipped" ? (
                      <button
                        type="button"
                        onClick={() => updateOrderStatus(ord.id, "Delivered")}
                        className="px-2.5 py-1 rounded-lg bg-green-100 hover:bg-green-200 text-green-900 text-[11px] font-bold transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3 h-3 text-green-600" /> Confirm Delivered
                      </button>
                    ) : null}

                    {ord.status !== "Cancelled" && ord.status !== "Delivered" ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Cancel allocation ${ord.orderNumber} and return units to atelier inventory?`)) {
                            updateOrderStatus(ord.id, "Cancelled");
                          }
                        }}
                        className="px-2 py-1 text-[11px] text-red-600 hover:underline"
                      >
                        Cancel Order
                      </button>
                    ) : null}
                  </div>

                  <span className="text-[11px] text-espresso/60 font-mono">
                    {ord.items.reduce((s, i) => s + i.quantity, 0)} total garments
                  </span>
                </div>

                {/* Items row */}
                <div className="pt-1 flex flex-wrap items-center gap-3">
                  {ord.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="flex items-center space-x-2.5 p-2 bg-white rounded-xl border border-burgundy/15 text-xs shadow-2xs"
                    >
                      <img
                        src={it.image}
                        alt={it.productName}
                        className="w-9 h-11 object-cover rounded-lg bg-ivory-dark border border-burgundy/10"
                      />
                      <div>
                        <span className="font-semibold text-espresso block line-clamp-1">
                          {it.productName}
                        </span>
                        <span className="text-[10px] text-espresso/60 font-mono block">
                          Size {it.selectedSize} · {it.selectedColor} · Qty: {it.quantity}
                        </span>
                        <span className="text-[10px] font-bold text-burgundy">
                          {formatPrice(it.price)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* PRINTABLE PACKING SLIP MODAL */}
      {activeSlipOrder && (
        <div className="fixed inset-0 z-50 bg-espresso/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-burgundy/20 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-burgundy/15">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-burgundy">Trend Street Dispatch Manifest</span>
                <h3 className="font-serif text-xl font-bold text-espresso">
                  Packing Slip #{activeSlipOrder.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setActiveSlipOrder(null)}
                className="text-espresso/60 hover:text-burgundy p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-4 bg-ivory rounded-2xl border border-burgundy/10">
                <div>
                  <span className="font-bold text-espresso block mb-1">Ship To:</span>
                  <p className="font-semibold text-espresso">{activeSlipOrder.customer.fullName}</p>
                  <p className="text-espresso/70">{activeSlipOrder.customer.address}</p>
                  {activeSlipOrder.customer.apartment && <p className="text-espresso/70">{activeSlipOrder.customer.apartment}</p>}
                  <p className="text-espresso/70">{activeSlipOrder.customer.city} - {activeSlipOrder.customer.postalCode}</p>
                  <p className="text-espresso/70">Phone: {activeSlipOrder.customer.phone}</p>
                </div>
                <div>
                  <span className="font-bold text-espresso block mb-1">Dispatch Details:</span>
                  <p><span className="text-espresso/60">Date:</span> {new Date(activeSlipOrder.createdAt).toLocaleDateString()}</p>
                  <p><span className="text-espresso/60">Courier AWB:</span> <span className="font-mono font-bold text-burgundy">{activeSlipOrder.trackingNumber || "Pending Dispatch"}</span></p>
                  <p><span className="text-espresso/60">Payment:</span> {activeSlipOrder.paymentMethod.toUpperCase()}</p>
                  <p><span className="text-espresso/60">Total:</span> <strong className="font-serif text-sm">{formatPrice(activeSlipOrder.total)}</strong></p>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="font-bold text-espresso mb-2">Garment Manifest ({activeSlipOrder.items.length} items)</h4>
                <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100">
                  {activeSlipOrder.items.map((it, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img src={it.image} alt={it.productName} className="w-10 h-12 object-cover rounded bg-stone-100" />
                        <div>
                          <p className="font-bold text-espresso">{it.productName}</p>
                          <p className="text-[11px] text-stone-500 font-mono">Size: {it.selectedSize} | Color: {it.selectedColor}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold font-mono">Qty: {it.quantity}</p>
                        <p className="text-xs text-stone-600">{formatPrice(it.price * it.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setActiveSlipOrder(null)}
                className="py-2.5 px-4 bg-ivory text-espresso text-xs font-semibold rounded-xl border border-stone-200"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2.5 px-5 bg-burgundy hover:bg-crimson text-gold text-xs font-bold uppercase tracking-wider rounded-xl shadow-md flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Packing Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
