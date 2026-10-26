"use client";

import React, { useState } from "react";
import { AlertTriangle, Check, RefreshCw, X, ShieldCheck } from "lucide-react";
import { VALID_STOCK_REASONS, StockAdjustmentReason } from "@/lib/stock-movements";

export interface StockAdjustmentTarget {
  inventoryId: string;
  variantId: string;
  productName: string;
  sku: string;
  size: string;
  colorName: string;
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

  if (!target) return null;

  const currentQty = target.currentQuantity;
  const newQty = currentQty + (Number(changeQty) || 0);
  const isValid = changeQty !== 0 && newQty >= 0 && Boolean(reason);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-ivory rounded-2xl shadow-2xl border border-gold/30 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-espresso p-5 text-ivory flex items-center justify-between border-b border-burgundy/40">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-burgundy flex items-center justify-center text-gold border border-gold/30">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-ivory">
                Adjust Inventory Stock
              </h3>
              <p className="text-[11px] text-gold font-mono uppercase tracking-wider">
                Transactional Movement Ledger
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-ivory/60 hover:text-ivory hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Variant Context */}
          <div className="p-4 bg-espresso/5 rounded-xl border border-espresso/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-espresso">
                {target.productName}
              </span>
              <span className="text-xs font-mono px-2 py-0.5 bg-burgundy/10 text-burgundy rounded border border-burgundy/20 font-bold">
                {target.sku}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-espresso/70">
              <span>
                Size: <strong className="text-espresso">{target.size}</strong>
              </span>
              <span>•</span>
              <span>
                Colour: <strong className="text-espresso">{target.colorName}</strong>
              </span>
              <span>•</span>
              <span>
                Current Available:{" "}
                <strong className="text-emerald-700 font-bold">{currentQty}</strong>
              </span>
            </div>
          </div>

          {/* Quantity Adjustment */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-espresso/80">
              Stock Adjustment Count (+ to restock, - to deduct)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={changeQty === 0 ? "" : changeQty}
                onChange={(e) => setChangeQty(parseInt(e.target.value, 10) || 0)}
                placeholder="e.g. +10 or -3"
                className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-espresso/20 text-espresso font-mono font-bold text-base focus:outline-none focus:ring-2 focus:ring-gold"
                required
              />
              <div className="flex items-center gap-1.5">
                {[5, 10, 25, -1, -5].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setChangeQty((prev) => prev + preset)}
                    className="px-2 py-1 text-xs font-mono font-bold rounded-lg bg-espresso/5 hover:bg-burgundy hover:text-gold border border-espresso/10 transition-colors"
                  >
                    {preset > 0 ? `+${preset}` : preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Balance Preview */}
            <div className="mt-2 p-2.5 rounded-lg bg-white border border-espresso/10 flex items-center justify-between text-xs">
              <span className="text-espresso/70">Projected Balance:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-espresso/60">{currentQty}</span>
                <span className="text-espresso/40">→</span>
                <span
                  className={`font-mono font-bold text-sm ${
                    newQty < 0
                      ? "text-rose-600"
                      : newQty <= 5
                      ? "text-amber-600"
                      : "text-emerald-700"
                  }`}
                >
                  {newQty} units
                </span>
                {newQty < 0 && (
                  <span className="text-[10px] text-rose-600 font-bold">
                    (Cannot be negative)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Mandatory Reason Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-espresso/80">
              Mandatory Audit Reason <span className="text-rose-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as StockAdjustmentReason)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-espresso/20 text-espresso text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-gold"
              required
            >
              {VALID_STOCK_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r} — {REASON_LABELS[r]}
                </option>
              ))}
            </select>
          </div>

          {/* Optional Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-espresso/80">
              Audit Notes / Purchase Order Reference
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. PO-2026-DEL-04 or damaged during fabric inspection"
              rows={2}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-espresso/20 text-espresso text-xs focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-espresso/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-espresso/70 hover:text-espresso rounded-xl hover:bg-espresso/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="px-5 py-2.5 bg-burgundy hover:bg-burgundy/90 text-gold text-xs font-bold uppercase tracking-wider rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 border border-gold/30"
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
}
