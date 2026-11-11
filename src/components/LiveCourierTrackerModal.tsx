"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Truck,
  CheckCircle2,
  MapPin,
  Search,
  ArrowRight,
  Phone,
  MessageSquare,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { lockScroll } from "@/lib/scroll-lock";

interface LiveCourierTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

interface TrackingMilestone {
  title: string;
  location: string;
  timestamp: string;
  completed: boolean;
  current: boolean;
  description: string;
}

export const LiveCourierTrackerModal: React.FC<LiveCourierTrackerModalProps> = ({
  isOpen,
  onClose,
  initialQuery = "",
}) => {
  const { orders } = useStore();
  const [identifier, setIdentifier] = useState(initialQuery);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [smsSubscribed, setSmsSubscribed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initialQuery) {
      setIdentifier(initialQuery);
    }
  }, [initialQuery]);

  // Keyboard Escape listener + body scroll lock for modal dismissal
  useEffect(() => {
    if (!isOpen) return;

    const unlock = lockScroll();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      unlock();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  // Guard query logic: strictly require input and at least 5 digits for phone match
  const cleanId = identifier.trim().toLowerCase();
  const digitsOnly = cleanId.replace(/\D/g, "");
  const foundOrder = cleanId
    ? orders.find(
        (o) =>
          o.orderNumber.toLowerCase() === cleanId ||
          o.id.toLowerCase() === cleanId ||
          o.trackingNumber.toLowerCase() === cleanId ||
          (digitsOnly.length >= 5 && o.customer.phone.replace(/\D/g, "").includes(digitsOnly))
      )
    : undefined;

  // Fallback demo tracking data if custom query entered
  const defaultMilestones: TrackingMilestone[] = [
    {
      title: "Atelier Order Placed & Confirmed",
      location: "Mumbai Flagship Atelier, Bandra West",
      timestamp: "Oct 19, 2026 • 14:32 IST",
      completed: true,
      current: false,
      description: "Order verified and reserved from batch inventory.",
    },
    {
      title: "Hand-Inspected & Sealed in Custom Garment Bag",
      location: "Quality Inspection Desk, Mumbai Atelier",
      timestamp: "Oct 19, 2026 • 17:45 IST",
      completed: true,
      current: false,
      description:
        "Fabric GSM weight checked, seams inspected, sealed with security tamper-tape.",
    },
    {
      title: "Dispatched via Blue Dart Apex Air Priority",
      location: "BOM Airport Cargo Hub, Mumbai",
      timestamp: "Oct 20, 2026 • 02:15 IST",
      completed: true,
      current: false,
      description: "Sorted for overnight express air transit under priority AWB #BD-892184.",
    },
    {
      title: "Arrived at Destination Transit Hub",
      location: foundOrder?.customer.city
        ? `${foundOrder.customer.city} Main Logistics Center`
        : "Regional Express Sorting Facility",
      timestamp: "Today • 08:30 IST",
      completed: true,
      current: true,
      description: "Package received and assigned to local delivery courier van.",
    },
    {
      title: "Out for Delivery & Doorstep OTP Handover",
      location: foundOrder?.customer.address || "Destination Address",
      timestamp: "Expected Today by 19:00 IST",
      completed: false,
      current: false,
      description: "Rider will verify 4-digit OTP at doorstep upon handover.",
    },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
    }, 400);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="No-Login Live Courier Tracker"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden my-0"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-espresso/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-burgundy/20 overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] sm:max-h-[88vh] my-auto">
        {/* Header */}
        <div className="shrink-0 p-4 sm:p-5 bg-espresso text-ivory flex items-center justify-between border-b border-burgundy/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-burgundy flex items-center justify-center text-gold border border-gold/30">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-gold block">
                Self-Service Express Logistics
              </span>
              <h3 className="font-serif text-lg sm:text-xl font-bold">
                Live Courier Tracker
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-ivory/60 hover:text-gold rounded-lg transition-colors"
            aria-label="Close tracking modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Section */}
        <div className="shrink-0 p-4 sm:p-5 bg-ivory border-b border-burgundy/10">
          <form onSubmit={handleSearch} className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-espresso block">
              Enter 10-Digit Mobile, Order ID, or AWB
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-burgundy/50" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter order number or mobile number"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-burgundy/20 rounded-lg text-sm text-espresso placeholder-espresso/40 focus:outline-none focus:border-burgundy"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !identifier.trim()}
                className="px-5 py-2.5 bg-burgundy hover:bg-crimson disabled:opacity-50 text-ivory text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
              >
                {isSubmitting ? (
                  <span>Checking...</span>
                ) : (
                  <>
                    <span>Track</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-espresso/60 pt-1">
              <span>Live tracking across Blue Dart, Delhivery & Bluedart Air</span>
              <span className="text-espresso/40">No login required</span>
            </div>
          </form>
        </div>

        {/* Results Area */}
        <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-5 overscroll-contain">
          {/* Active Waybill Summary Card */}
          <div className="p-4 rounded-xl bg-white border border-burgundy/15 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-burgundy/10">
              <div>
                <span className="text-[10px] text-espresso/60 uppercase font-mono tracking-wider block">
                  Air Waybill Number
                </span>
                <span className="font-mono text-sm font-bold text-burgundy">
                  {foundOrder?.trackingNumber || "—"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-800 text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
                  <span>In Transit • On Schedule</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-espresso/70">
              <div>
                <span className="text-[10px] text-espresso/50 block">Carrier Service:</span>
                <span className="font-semibold text-espresso">Blue Dart Apex Priority Air</span>
              </div>
              <div>
                <span className="text-[10px] text-espresso/50 block">Estimated Handover:</span>
                <span className="font-semibold text-burgundy">Today by 7:00 PM</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[10px] text-espresso/50 block">Destination:</span>
                <span className="font-semibold text-espresso">
                  {foundOrder ? `${foundOrder.customer.city} (${foundOrder.customer.postalCode})` : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* 5-Step Visual Timeline */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-espresso mb-4">
              Milestone Progress Timeline
            </h4>
            <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-burgundy/20">
              {defaultMilestones.map((step, idx) => (
                <div key={idx} className="relative group">
                  {/* Status Circle */}
                  <div
                    className={`absolute -left-6 top-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      step.completed
                        ? "bg-green-700 border-green-700 text-white"
                        : step.current
                        ? "bg-gold border-burgundy ring-4 ring-gold/20"
                        : "bg-white border-burgundy/30"
                    }`}
                  >
                    {step.completed && <CheckCircle2 className="w-3 h-3" />}
                  </div>

                  {/* Step Body */}
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold ${
                          step.current ? "text-burgundy" : "text-espresso"
                        }`}
                      >
                        {step.title}
                      </span>
                      <span className="text-[10px] font-mono text-espresso/50">
                        {step.timestamp}
                      </span>
                    </div>
                    <span className="text-[11px] text-espresso/70 flex items-center gap-1 font-medium">
                      <MapPin className="w-3 h-3 text-burgundy/60" />
                      <span>{step.location}</span>
                    </span>
                    <p className="text-[11px] text-espresso/60 font-light pt-0.5">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* WhatsApp & SMS Notification Opt-in */}
          <div className="p-4 rounded-xl bg-ivory-dark/70 border border-burgundy/15 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="space-y-0.5 text-center sm:text-left">
              <span className="text-xs font-bold text-espresso block flex items-center justify-center sm:justify-start gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-green-700" />
                <span>Instant WhatsApp Dispatch Alerts</span>
              </span>
              <p className="text-[11px] text-espresso/60 font-light">
                Receive live rider phone number and 4-digit OTP directly on WhatsApp.
              </p>
            </div>
            <button
              onClick={() => setSmsSubscribed(!smsSubscribed)}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-colors whitespace-nowrap ${
                smsSubscribed
                  ? "bg-green-700 text-white"
                  : "bg-burgundy text-gold hover:bg-crimson"
              }`}
            >
              {smsSubscribed ? "Alerts Enabled ✓" : "Enable Alerts"}
            </button>
          </div>
        </div>

        {/* Footer Support Hotline */}
        <div className="shrink-0 p-3.5 sm:p-4 bg-white border-t border-burgundy/10 flex items-center justify-between text-xs text-espresso/60">
          <div className="flex items-center space-x-2">
            <Phone className="w-3.5 h-3.5 text-burgundy" />
            <span>Atelier Logistics Hotline: <strong className="text-espresso">+91 98200 12345</strong></span>
          </div>
          <span className="text-[10px] text-espresso/40">Mon–Sat • 10:00 to 20:00 IST</span>
        </div>
      </div>
    </div>,
    document.body
  );
};
