"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, RefreshCw, X, ShieldCheck, Shirt } from "lucide-react";
import { VALID_STOCK_REASONS, StockAdjustmentReason } from "@/lib/stock-movements";
import { lockScroll } from "@/lib/scroll-lock";

export interface StockAdjustmentTarget {
  inventoryId: string;
  variantId: string;
  productName: string;
  sku: string;
  size: string;
  colorName: string;
  colorHex?: string;
  category?: string;
  currentQuantity: number;
  reservedQty?: number;
}

interface StockAdjustmentModalProps {
  target: StockAdjustmentTarget | null;
  onClose: () => void;
  onSuccess: () => void;
}

const REASON_LABELS: Record<StockAdjustmentReason, string> = {
  RESTOCK: "Restock / Factory Delivery Received",
  DAMAGE: "Damaged in Atelier / Transit Write-off",
  RETURN: "Customer Return Inspected & Restocked",
  CORRECTION: "Cycle Count Discrepancy Correction",
  AUDIT_RECONCILIATION: "Quarterly Comprehensive Physical Audit",
  PROMOTION: "Editorial / Showroom / Press Allocation",
};

export function StockAdjustmentModal({
  target,
  onClose,
  onSuccess,
}: StockAdjustmentModalProps) {
  const [changeQty, setChangeQty] = useState<number>(0);
  const [reason, setReason] = useState<StockAdjustmentReason>("RESTOCK");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset local state when target changes
  useEffect(() => {
    if (target) {
      setChangeQty(0);
      setReason("RESTOCK");
      setNotes("");
      setErrorMsg(null);
    }
  }, [target]);

  useEffect(() => {
    if (!target) return;
    const unlock = lockScroll();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      unlock();
      window.removeEventListener("keydown", onKey);
    };
  }, [target, onClose]);

  if (!target || !mounted) return null;

  const currentQty = target.currentQuantity;
  const reservedQty = target.reservedQty || 0;
  const availableQty = Math.max(0, currentQty - reservedQty);
  const newQty = currentQty + (Number(changeQty) || 0);
  const newAvailable = Math.max(0, newQty - reservedQty);
  const isNegative = newQty < 0 || newQty < reservedQty;
  const isValid = changeQty !== 0 && !isNegative && Boolean(reason);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryId: target.inventoryId,
          changeQty: Number(changeQty),
          reason,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record stock adjustment");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="stock-adjust-title"
      data-lenis-prevent
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-xs overscroll-contain animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-ivory rounded-t-3xl sm:rounded-2xl border border-burgundy/20 shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden">
        {/* Cohesive Luxury Header */}
        <div className="bg-white px-5 sm:px-6 py-4 border-b border-burgundy/10 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-espresso/5 border border-espresso/10 flex items-center justify-center text-espresso shrink-0">
              <RefreshCw className="w-4 h-4 text-burgundy" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3
                  id="stock-adjust-title"
                  className="font-serif font-bold text-base text-espresso truncate"
                >
                  Adjust Inventory Stock
                </h3>
              </div>
              <p className="text-[11px] text-espresso/60 uppercase tracking-wider font-semibold">
                Transactional Movement Ledger
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-espresso/50 hover:text-espresso rounded-xl hover:bg-espresso/5 transition-colors shrink-0 ml-2"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden min-h-0 text-xs"
        >
          <div
            data-lenis-prevent
            data-modal-scroll
            className="custom-scrollbar flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
          >
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Garment Variant Context Card */}
            <div className="p-4 bg-white rounded-xl border border-burgundy/15 shadow-2xs space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-espresso/50 block">
                    Garment Variant
                  </span>
                  <h4 className="font-serif font-bold text-sm text-espresso leading-snug truncate">
                    {target.productName}
                  </h4>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-burgundy/10 text-burgundy rounded border border-burgundy/20 font-bold shrink-0">
                  {target.sku}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs pt-2 border-t border-espresso/5">
                <span className="inline-flex items-center gap-1.5 font-medium text-espresso/80">
                  Size: <strong className="font-bold text-espresso">{target.size}</strong>
                </span>
                <span className="text-espresso/30">•</span>
                <span className="inline-flex items-center gap-1.5 font-medium text-espresso/80">
                  Colour:{" "}
                  {target.colorHex && (
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-espresso/20 inline-block"
                      style={{ backgroundColor: target.colorHex }}
                    />
                  )}
                  <strong className="font-bold text-espresso">{target.colorName}</strong>
                </span>
              </div>

              {/* 3-part stock breakdown grid */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2 rounded-lg bg-espresso/5 border border-espresso/10">
                  <span className="text-[10px] uppercase tracking-wider text-espresso/50 font-bold block">
                    On Hand
                  </span>
                  <span className="font-mono font-bold text-sm text-espresso">
                    {currentQty}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-espresso/5 border border-espresso/10">
                  <span className="text-[10px] uppercase tracking-wider text-espresso/50 font-bold block">
                    Reserved
                  </span>
                  <span className="font-mono text-sm text-espresso/70">
                    {reservedQty}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] uppercase tracking-wider text-emerald-800 font-bold block">
                    Available
                  </span>
                  <span className="font-mono font-bold text-sm text-emerald-700">
                    {availableQty}
                  </span>
                </div>
              </div>
            </div>

            {/* Quantity Adjustment Input & Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-espresso/80">
                  Stock Adjustment Count <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-espresso/50">
                  (+) Restock &nbsp;|&nbsp; (-) Deduct
                </span>
              </div>

              <div className="relative">
                <input
                  type="number"
                  value={changeQty === 0 ? "" : changeQty}
                  onChange={(e) => setChangeQty(parseInt(e.target.value, 10) || 0)}
                  placeholder="e.g. +10 or -3"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-burgundy/20 text-espresso font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-espresso/20"
                  required
                />
                {changeQty !== 0 && (
                  <button
                    type="button"
                    onClick={() => setChangeQty(0)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-espresso/50 hover:text-espresso px-2 py-0.5 rounded bg-espresso/5 hover:bg-espresso/10 transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Mobile-Friendly Preset Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] font-bold text-espresso/40 uppercase mr-1">
                  Quick:
                </span>
                {[
                  { label: "-5", val: -5, deduct: true },
                  { label: "-1", val: -1, deduct: true },
                  { label: "+5", val: 5, deduct: false },
                  { label: "+10", val: 10, deduct: false },
                  { label: "+25", val: 25, deduct: false },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setChangeQty((prev) => prev + preset.val)}
                    className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-colors ${
                      preset.deduct
                        ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
                        : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Live Projected Balance Preview */}
              <div className="p-3 rounded-xl bg-white border border-burgundy/15 flex items-center justify-between text-xs mt-2">
                <span className="text-espresso/70 font-medium">Projected Available:</span>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-espresso/50">{availableQty}</span>
                  <span className="text-espresso/30">→</span>
                  {changeQty === 0 ? (
                    <span className="text-espresso/60 italic text-xs">
                      No change entered
                    </span>
                  ) : (
                    <span
                      className={`font-bold text-sm ${
                        isNegative
                          ? "text-rose-600"
                          : newAvailable <= 5
                          ? "text-amber-600"
                          : "text-emerald-700"
                      }`}
                    >
                      {newAvailable} units
                      <span className="text-[10px] font-normal ml-1">
                        ({changeQty > 0 ? `+${changeQty}` : changeQty})
                      </span>
                    </span>
                  )}
                </div>
              </div>

              {isNegative && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Cannot reduce stock below reserved checkout units ({reservedQty} units).
                  </span>
                </div>
              )}
            </div>

            {/* Mandatory Reason Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-espresso/80">
                Mandatory Audit Reason <span className="text-rose-500">*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as StockAdjustmentReason)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-burgundy/20 text-espresso text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-espresso/20"
                required
              >
                {VALID_STOCK_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r} — {REASON_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>

            {/* Optional Audit Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-espresso/80">
                Audit Notes / Purchase Order Reference
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. PO-2026-DEL-04 or damaged during fabric inspection"
                rows={2}
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-burgundy/20 text-espresso text-xs focus:outline-none focus:ring-2 focus:ring-espresso/20"
              />
            </div>
          </div>

          {/* Pinned Action Controls */}
          <div className="shrink-0 p-4 border-t border-burgundy/10 bg-white flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-espresso/70 hover:text-espresso rounded-xl hover:bg-espresso/5 transition-colors text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="px-5 py-2.5 bg-espresso hover:bg-crimson disabled:bg-espresso/20 text-white disabled:text-espresso/40 text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Recording Transaction...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Commit Stock Adjustment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
