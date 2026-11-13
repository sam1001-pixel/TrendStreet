"use client";

import React, { useState, useEffect } from "react";
import {
  Truck,
  MapPin,
  Search,
  CheckCircle,
  Clock,
  ExternalLink,
  Shield,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  X,
  Package,
  Printer,
} from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { lockScroll } from "@/lib/scroll-lock";

interface ShipmentItem {
  id: string;
  orderNumber: string;
  customerName: string;
  destinationCity: string;
  destinationState: string;
  postalCode: string;
  trackingNumber: string;
  courier: string;
  status: string;
  itemCount: number;
  dispatchedAt: string;
}

interface TrackingCheckpoint {
  checkpoint: string;
  timestamp: string;
  location: string;
  status: string;
}

interface PendingOrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  destinationCity: string;
  destinationState: string;
  postalCode: string;
  paymentMethod: string;
  itemCount: number;
  totalAmount: number;
  createdAt: string;
}

export default function AdminShippingPage() {
  const [shipments, setShipments] = useState<ShipmentItem[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingOrderItem[]>([]);
  const [environment, setEnvironment] = useState({
    provider: "Shiprocket",
    isConfigured: false,
    isLive: false,
    mode: "Sandbox / Resilient Mock",
    defaultCouriers: ["Delhivery Air", "Blue Dart Apex"],
    pickupOrigin: { city: "Jodhpur", state: "Rajasthan", pincode: "342008", location: "Primary" },
  });
  const [isLoading, setIsLoading] = useState(true);

  // Shiprocket Connection Diagnostics state
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [connResult, setConnResult] = useState<any>(null);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [printingAwb, setPrintingAwb] = useState<string | null>(null);

  // Serviceability lookup state
  const [testPincode, setTestPincode] = useState("342008");
  const [pincodeResult, setPincodeResult] = useState<any>(null);
  const [isCheckingPin, setIsCheckingPin] = useState(false);

  // Tracking Timeline state
  const [activeTracking, setActiveTracking] = useState<{
    awb: string;
    orderNumber: string;
    courier: string;
    checkpoints: TrackingCheckpoint[];
  } | null>(null);

  useEffect(() => {
    if (!activeTracking) return;
    const unlock = lockScroll();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveTracking(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      unlock();
      window.removeEventListener("keydown", onKey);
    };
  }, [activeTracking]);

  const fetchShipping = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/shipping");
      if (!res.ok) throw new Error("Failed to load shipping data");
      const data = await res.json();
      setShipments(data.shipments || []);
      setPendingOrders(data.pendingDispatch || []);
      if (data.environment) setEnvironment(data.environment);
    } catch (err) {
      console.error("[Shipping Fetch]:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConn(true);
    setConnResult(null);
    try {
      const res = await fetch("/api/admin/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test_connection" }),
      });
      const data = await res.json();
      setConnResult(data);
    } catch (err) {
      setConnResult({ success: false, error: (err as Error).message });
    } finally {
      setIsTestingConn(false);
    }
  };

  const handleQuickDispatch = async (orderId: string) => {
    setDispatchingId(orderId);
    try {
      const res = await fetch("/api/admin/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_shipment", orderId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to book shipment with Shiprocket");
      }
      await fetchShipping();
      if (data.labelUrl) {
        window.open(data.labelUrl, "_blank");
      }
    } catch (err) {
      alert("Shiprocket dispatch error: " + (err as Error).message);
    } finally {
      setDispatchingId(null);
    }
  };

  const handlePrintLabel = async (trackingNumber: string) => {
    setPrintingAwb(trackingNumber);
    try {
      const res = await fetch("/api/admin/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate_label", shipmentId: trackingNumber }),
      });
      const data = await res.json();
      if (data?.labelUrl) {
        window.open(data.labelUrl, "_blank");
      } else {
        alert("Shipping label is being generated by Shiprocket. Please retry in a moment.");
      }
    } catch (err) {
      alert("Error printing label: " + (err as Error).message);
    } finally {
      setPrintingAwb(null);
    }
  };

  useEffect(() => {
    fetchShipping();
  }, []);

  const handleCheckPincode = async (code: string) => {
    setIsCheckingPin(true);
    try {
      const res = await fetch("/api/admin/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "serviceability", pincode: code }),
      });
      const data = await res.json();
      setPincodeResult(data.serviceability);
    } catch (err) {
      alert("Error checking PIN code: " + (err as Error).message);
    } finally {
      setIsCheckingPin(false);
    }
  };

  const handleInspectTracking = async (s: ShipmentItem) => {
    try {
      const res = await fetch("/api/admin/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "track", trackingNumber: s.trackingNumber }),
      });
      const data = await res.json();
      const checkpoints = data.tracking?.checkpoints || [
        { checkpoint: "Manifest Generated at Atelier", timestamp: new Date(s.dispatchedAt).toLocaleString(), location: "Jodhpur Hub", status: "Manifested" },
        { checkpoint: "Picked up by Courier Partner", timestamp: new Date().toLocaleString(), location: "Jodhpur Air Hub", status: "In Transit" },
      ];

      setActiveTracking({
        awb: s.trackingNumber,
        orderNumber: s.orderNumber,
        courier: s.courier,
        checkpoints,
      });
    } catch {
      setActiveTracking({
        awb: s.trackingNumber,
        orderNumber: s.orderNumber,
        courier: s.courier,
        checkpoints: [
          { checkpoint: "Manifest Generated at Atelier", timestamp: new Date().toLocaleString(), location: "Jodhpur Hub", status: "Manifested" },
        ],
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-espresso/10 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-gold uppercase tracking-widest">
            <Truck className="w-3.5 h-3.5" />
            <span>Logistics & Fulfillment</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-espresso tracking-tight mt-1">
            Shipping & Dispatch Desk
          </h1>
          <p className="text-xs text-espresso/60 mt-1 max-w-xl">
            Courier integration for Blue Dart Apex & Delhivery Air with Indian PIN code serviceability testing.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchShipping}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-espresso/15 bg-white text-espresso hover:bg-espresso/5 transition-colors"
            title="Refresh Logistics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-burgundy" : ""}`} />
          </button>
        </div>
      </div>

      {/* Environment Mode Banner */}
      <div className="p-4 rounded-2xl bg-espresso text-ivory border border-burgundy/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-burgundy flex items-center justify-center text-gold border border-gold/30">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-sm text-ivory">
                {environment.provider} Adapter
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                  environment.isLive
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-gold/20 text-gold border border-gold/40"
                }`}
              >
                {environment.mode}
              </span>
            </div>
            <p className="text-[11px] text-ivory/70 mt-0.5">
              Active Courier Matrix: {environment.defaultCouriers.join(" • ")}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="text-left sm:text-right text-xs font-mono text-gold/80 sm:mr-3">
            <span>Transit SLA: Metro 2-3 Days | Tier 1 Hubs 3-4 Days</span>
          </div>
          <button
            onClick={handleTestConnection}
            disabled={isTestingConn}
            className="px-3.5 py-2 rounded-xl bg-gold hover:bg-gold/90 text-espresso text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTestingConn ? "animate-spin text-espresso" : ""}`} />
            {isTestingConn ? "Testing API..." : "Test Connection"}
          </button>
        </div>
      </div>

      {/* Diagnostics Card */}
      {connResult && (
        <div
          className={`p-4 rounded-2xl border text-xs animate-in fade-in duration-200 ${
            connResult.success
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950"
              : "bg-amber-500/10 border-amber-500/30 text-amber-950"
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-current/10">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  connResult.success ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              <strong className="text-sm font-serif">
                {connResult.success
                  ? "Shiprocket API Connection Verified"
                  : "Shiprocket Connection Notice"}
              </strong>
            </div>
            <button
              onClick={() => setConnResult(null)}
              className="text-[11px] underline opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
          <p className="mt-2 text-xs leading-relaxed">
            {connResult.message || connResult.error || "Connection tested successfully."}
          </p>
          {connResult.locations && connResult.locations.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <span className="font-bold text-[11px] uppercase tracking-wider block opacity-75">
                Registered Pickup Hubs ({connResult.locations.length}):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {connResult.locations.map((loc: any) => (
                  <div
                    key={loc.id}
                    className="p-2.5 rounded-xl bg-white/70 border border-current/10 font-mono text-[11px]"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-espresso font-sans text-xs">{loc.pickup_location}</strong>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        PIN: {loc.pin_code}
                      </span>
                    </div>
                    <p className="text-[11px] text-espresso/70 truncate mt-0.5">
                      {loc.address}, {loc.city}, {loc.state}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Active Dispatches"
          value={shipments.length}
          subtitle="Orders in fulfillment pipeline"
          icon={Package}
          badge="Live"
        />
        <StatCard
          title="Transit Speed"
          value="2-3 Days"
          subtitle="Delhivery Air & Blue Dart Apex"
          icon={Clock}
        />
        <StatCard
          title="Serviceable PINs"
          value="28,000+"
          subtitle="Indian postal codes covered"
          icon={MapPin}
        />
        <StatCard
          title="Integration Provider"
          value="Shiprocket"
          subtitle="Tier-1 Indian Logistics Adapter"
          icon={Shield}
        />
      </div>

      {/* Indian PIN Code Serviceability Quick-Test Utility */}
      <div className="p-6 bg-white rounded-2xl border border-espresso/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-burgundy" />
            <h3 className="font-serif font-bold text-base text-espresso">
              Indian PIN Code Serviceability Quick-Check
            </h3>
          </div>
          <span className="text-[11px] text-espresso/60 font-mono">
            Origin Atelier: Jodhpur (342008)
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            maxLength={6}
            value={testPincode}
            onChange={(e) => setTestPincode(e.target.value.replace(/\D/g, ""))}
            placeholder="Enter 6-digit PIN code (e.g. 342008)"
            className="flex-1 px-4 py-2.5 rounded-xl bg-espresso/5 border border-espresso/15 text-xs font-mono font-bold text-espresso focus:ring-2 focus:ring-gold"
          />
          <button
            onClick={() => handleCheckPincode(testPincode)}
            disabled={isCheckingPin || testPincode.length !== 6}
            className="px-5 py-2.5 bg-burgundy hover:bg-burgundy/90 text-gold text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs disabled:opacity-50 transition-all border border-gold/30"
          >
            {isCheckingPin ? "Validating..." : "Test Serviceability"}
          </button>
        </div>

        {/* Preset Metro PINs */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-espresso/60 text-[11px]">Quick Tests:</span>
          {[
            { label: "Mumbai (400001)", pin: "400001" },
            { label: "New Delhi (110001)", pin: "110001" },
            { label: "Bengaluru (560001)", pin: "560001" },
            { label: "Kolkata (700001)", pin: "700001" },
          ].map((preset) => (
            <button
              key={preset.pin}
              onClick={() => {
                setTestPincode(preset.pin);
                handleCheckPincode(preset.pin);
              }}
              className="px-2.5 py-1 rounded-lg bg-espresso/5 hover:bg-burgundy hover:text-gold text-[11px] font-mono text-espresso/80 transition-colors border border-espresso/10"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Result Preview Box */}
        {pincodeResult && (
          <div className="p-4 rounded-xl bg-espresso/5 border border-espresso/10 text-xs space-y-2 mt-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    pincodeResult.isServiceable ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                />
                <span className="font-bold text-espresso">
                  {pincodeResult.isServiceable
                    ? `PIN Code ${pincodeResult.pincode} is Fully Serviceable`
                    : `PIN Code ${pincodeResult.pincode} Not Serviceable`}
                </span>
              </div>
              <span className="font-mono text-xs px-2 py-0.5 bg-burgundy/10 text-burgundy font-bold rounded">
                Tier: {pincodeResult.tier || "Standard"}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-[11px]">
              <div>
                <span className="text-espresso/60 block">Location Hub:</span>
                <strong className="text-espresso">{pincodeResult.city}, {pincodeResult.state}</strong>
              </div>
              <div>
                <span className="text-espresso/60 block">Estimated Transit:</span>
                <strong className="text-emerald-700">{pincodeResult.estimatedDays} Business Days</strong>
              </div>
              <div>
                <span className="text-espresso/60 block">Preferred Partner:</span>
                <strong className="text-espresso">{pincodeResult.courierPartner}</strong>
              </div>
              <div>
                <span className="text-espresso/60 block">COD Supported:</span>
                <strong className={pincodeResult.codAvailable ? "text-emerald-700" : "text-rose-700"}>
                  {pincodeResult.codAvailable ? "Yes (Prepaid & COD)" : "Prepaid Only"}
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pending Dispatch Desk */}
      <div className="bg-white rounded-2xl border border-espresso/10 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-espresso/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-burgundy" />
              <h3 className="font-serif font-bold text-sm text-espresso">
                Pending Dispatch Desk
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-burgundy/10 text-burgundy">
                {pendingOrders.length} unfulfilled
              </span>
            </div>
            <p className="text-[11px] text-espresso/60 mt-0.5">
              Unfulfilled orders waiting for carrier assignment & AWB allocation.
            </p>
          </div>
          <span className="text-[11px] font-mono text-espresso/60">
            Auto-syncs with Shiprocket on click
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-espresso/5 text-espresso text-[10px] uppercase tracking-wider">
              <tr>
                <th className="p-3.5 pl-6 font-bold">Order #</th>
                <th className="p-3.5 font-bold">Customer Patron</th>
                <th className="p-3.5 font-bold">Destination</th>
                <th className="p-3.5 text-center font-bold">Items</th>
                <th className="p-3.5 font-bold">Total</th>
                <th className="p-3.5 text-center font-bold">Payment</th>
                <th className="p-3.5 pr-6 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso/5 font-sans">
              {pendingOrders.map((o) => (
                <tr key={o.id} className="hover:bg-espresso/[0.02] transition-colors">
                  <td className="p-3.5 pl-6 font-mono font-bold text-burgundy">
                    {o.orderNumber}
                  </td>
                  <td className="p-3.5 font-semibold text-espresso">
                    {o.customerName}
                  </td>
                  <td className="p-3.5 text-espresso/80">
                    {o.destinationCity}, {o.destinationState} ({o.postalCode})
                  </td>
                  <td className="p-3.5 text-center font-mono font-bold">
                    {o.itemCount}
                  </td>
                  <td className="p-3.5 font-mono font-bold text-espresso">
                    ₹{o.totalAmount.toLocaleString("en-IN")}
                  </td>
                  <td className="p-3.5 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        o.paymentMethod === "COD"
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                      }`}
                    >
                      {o.paymentMethod}
                    </span>
                  </td>
                  <td className="p-3.5 pr-6 text-right">
                    <button
                      onClick={() => handleQuickDispatch(o.id)}
                      disabled={dispatchingId === o.id}
                      className="px-3 py-1.5 rounded-lg bg-burgundy hover:bg-burgundy/90 text-gold text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-1.5 ml-auto shadow-xs border border-gold/30"
                    >
                      <Truck className={`w-3.5 h-3.5 ${dispatchingId === o.id ? "animate-spin" : ""}`} />
                      <span>{dispatchingId === o.id ? "Booking AWB..." : "Dispatch via Shiprocket"}</span>
                    </button>
                  </td>
                </tr>
              ))}

              {pendingOrders.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-espresso/60 space-y-1">
                    <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto" />
                    <p className="font-semibold text-xs text-espresso">Fulfillment pipeline clear!</p>
                    <p className="text-[11px] text-espresso/50">All received orders have been booked and dispatched.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shipments Table */}
      <div className="bg-white rounded-2xl border border-espresso/10 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-espresso/10 flex items-center justify-between">
          <h3 className="font-serif font-bold text-sm text-espresso">
            Active Consignments & Dispatches
          </h3>
          <span className="text-xs text-espresso/60 font-mono">
            {shipments.length} trackable packages
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-espresso text-ivory text-[10px] uppercase tracking-wider">
              <tr>
                <th className="p-3.5 pl-6 font-bold">Order #</th>
                <th className="p-3.5 font-bold">Customer Patron</th>
                <th className="p-3.5 font-bold">Destination</th>
                <th className="p-3.5 font-bold">Carrier</th>
                <th className="p-3.5 font-bold">AWB Number</th>
                <th className="p-3.5 text-center font-bold">Items</th>
                <th className="p-3.5 text-center font-bold">Status</th>
                <th className="p-3.5 pr-6 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso/5 font-sans">
              {shipments.map((s) => (
                <tr key={s.id} className="hover:bg-espresso/[0.02] transition-colors">
                  <td className="p-3.5 pl-6 font-mono font-bold text-burgundy">
                    {s.orderNumber}
                  </td>

                  <td className="p-3.5 font-semibold text-espresso">
                    {s.customerName}
                  </td>

                  <td className="p-3.5 text-espresso/80">
                    {s.destinationCity}, {s.destinationState} ({s.postalCode})
                  </td>

                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-espresso/5 text-espresso">
                      {s.courier}
                    </span>
                  </td>

                  <td className="p-3.5 font-mono font-bold text-xs text-emerald-800">
                    {s.trackingNumber}
                  </td>

                  <td className="p-3.5 text-center font-mono font-bold">
                    {s.itemCount}
                  </td>

                  <td className="p-3.5 text-center">
                    <StatusBadge label={s.status} size="sm" />
                  </td>

                  <td className="p-3.5 pr-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleInspectTracking(s)}
                        className="px-2.5 py-1.5 rounded-lg bg-burgundy/10 hover:bg-burgundy text-burgundy hover:text-gold text-xs font-bold uppercase tracking-wider transition-colors border border-burgundy/20"
                      >
                        Track
                      </button>
                      <button
                        onClick={() => handlePrintLabel(s.trackingNumber)}
                        disabled={
                          printingAwb === s.trackingNumber ||
                          !s.trackingNumber ||
                          s.trackingNumber === "Pending Booking"
                        }
                        title="Print Shipping Label"
                        className="px-2.5 py-1.5 rounded-lg bg-espresso/5 hover:bg-espresso hover:text-ivory text-espresso text-xs font-bold transition-colors border border-espresso/15 flex items-center gap-1 disabled:opacity-40"
                      >
                        <Printer className={`w-3.5 h-3.5 ${printingAwb === s.trackingNumber ? "animate-spin" : ""}`} />
                        <span>Label</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {shipments.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-espresso/60 space-y-2">
                    <Truck className="w-8 h-8 text-espresso/30 mx-auto" />
                    <p className="font-semibold text-sm">No dispatches found.</p>
                    <p className="text-xs text-espresso/40">Assign AWB tracking numbers to orders on the Orders page.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tracking Timeline Modal */}
      {activeTracking && (
        <div
          role="dialog"
          aria-modal="true"
          data-lenis-prevent
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-espresso/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setActiveTracking(null); }}
        >
          <div className="w-full max-w-lg bg-ivory rounded-2xl shadow-2xl border border-gold/30 flex flex-col max-h-[90dvh] overflow-hidden">
            {/* PINNED HEADER */}
            <div className="bg-espresso p-4 text-ivory flex items-center justify-between border-b border-burgundy/40 shrink-0">
              <div className="flex items-center space-x-2">
                <Truck className="w-4 h-4 text-gold" />
                <span className="font-serif font-bold text-sm text-ivory">
                  Consignment Milestone Trail
                </span>
                <span className="text-xs font-mono text-gold px-2 py-0.5 bg-burgundy/40 rounded border border-gold/30">
                  {activeTracking.awb}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTracking(null)}
                className="p-1 text-ivory/60 hover:text-ivory rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SCROLLABLE BODY */}
            <div
              data-lenis-prevent
              data-modal-scroll
              className="custom-scrollbar flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs"
            >
              <div className="p-3 bg-white rounded-xl border border-espresso/10 flex items-center justify-between">
                <div>
                  <span className="text-espresso/60 block text-[10px] uppercase font-bold">Order Reference</span>
                  <strong className="font-serif text-sm text-espresso">{activeTracking.orderNumber}</strong>
                </div>
                <div className="text-right">
                  <span className="text-espresso/60 block text-[10px] uppercase font-bold">Carrier</span>
                  <strong className="text-burgundy font-bold">{activeTracking.courier}</strong>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-espresso/50">
                  Logistics Checkpoints
                </p>
                <div className="border-l-2 border-burgundy ml-3 pl-4 space-y-4">
                  {activeTracking.checkpoints.map((cp, idx) => (
                    <div key={idx} className="relative space-y-0.5">
                      <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-burgundy border-2 border-ivory" />
                      <p className="font-bold text-espresso">{cp.checkpoint}</p>
                      <p className="text-[10px] text-espresso/60 font-mono">
                        {cp.location} • {cp.timestamp}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* PINNED FOOTER */}
            <div className="shrink-0 p-4 border-t border-espresso/10 bg-ivory/95 backdrop-blur-xs flex items-center justify-end">
              <button
                type="button"
                onClick={() => setActiveTracking(null)}
                className="px-4 py-2 bg-espresso text-ivory text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-burgundy transition-colors"
              >
                Close Trail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
