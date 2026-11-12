"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Boxes,
  AlertTriangle,
  Search,
  Download,
  RefreshCw,
  History,
  Shirt,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  StockAdjustmentModal,
  StockAdjustmentTarget,
} from "@/components/admin/StockAdjustmentModal";
import { lockScroll } from "@/lib/scroll-lock";

interface InventoryItem {
  id: string;
  inventoryId: string;
  variantId: string;
  productId: string;
  productName: string;
  category: string;
  size: string;
  colorName: string;
  colorHex: string;
  sku: string;
  quantity: number;
  reservedQty: number;
  available: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  updatedAt: string;
  recentMovements: Array<{
    id: string;
    changeQty: number;
    balanceBefore: number;
    balanceAfter: number;
    reason: string;
    notes: string | null;
    performedBy: string | null;
    createdAt: string;
  }>;
}

export default function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [metrics, setMetrics] = useState({
    totalSkus: 0,
    totalUnits: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [mounted, setMounted] = useState(false);

  // Modals state
  const [adjustTarget, setAdjustTarget] = useState<StockAdjustmentTarget | null>(null);
  const [historyTarget, setHistoryTarget] = useState<InventoryItem | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!historyTarget) return;
    const unlock = lockScroll();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setHistoryTarget(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      unlock();
      window.removeEventListener("keydown", onKey);
    };
  }, [historyTarget]);

  const fetchInventory = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filter !== "all") params.set("filter", filter);

      const res = await fetch(`/api/admin/inventory?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load inventory data");
      const data = await res.json();
      setItems(data.items || []);
      if (data.metrics) setMetrics(data.metrics);
    } catch (err) {
      console.error("[Inventory Fetch]:", err);
    } finally {
      setIsLoading(false);
    }
  }, [search, filter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInventory();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchInventory]);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filter !== "all") params.set("filter", filter);
      params.set("export", "csv");

      const res = await fetch(`/api/admin/inventory?${params.toString()}`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `offvybe-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Could not export inventory CSV: " + (err as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-burgundy/15 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-[0.2em] text-crimson">
            <Boxes className="w-3.5 h-3.5" />
            <span>Warehouse & Atelier Stock</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-espresso tracking-tight mt-1">
            Inventory Management
          </h1>
          <p className="text-xs text-espresso/70 mt-1 max-w-xl">
            Variant-level SKU stock control with mandatory reason logging,
            transactional balance tracking, and formula-injection-safe CSV reporting.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 self-start sm:self-auto">
          <button
            onClick={() => fetchInventory()}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-burgundy/15 bg-white text-espresso hover:bg-espresso/5 transition-colors disabled:opacity-50"
            title="Refresh Stock Counts"
            aria-label="Refresh Stock Counts"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-burgundy" : ""}`} />
          </button>

          <button
            onClick={handleExportCsv}
            disabled={isExporting || items.length === 0}
            className="px-4 py-2.5 bg-white border border-burgundy/20 hover:border-burgundy text-espresso text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs hover:shadow-sm transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-burgundy" />
            <span>{isExporting ? "Exporting..." : "Export Safe CSV"}</span>
          </button>
        </div>
      </div>

      {/* Operational Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatCard
          title="Active SKUs"
          value={metrics.totalSkus}
          subtitle="Distinct garment variants"
          icon={Boxes}
          badge="Catalog"
          onClick={() => setFilter("all")}
        />
        <StatCard
          title="Total Stock Units"
          value={metrics.totalUnits}
          subtitle="Physical atelier units"
          icon={Shirt}
        />
        <StatCard
          title="Low Stock Alert"
          value={metrics.lowStockCount}
          subtitle="Units remaining <= 5"
          icon={AlertTriangle}
          onClick={() => setFilter("low")}
          badge={metrics.lowStockCount > 0 ? "Action Required" : "Healthy"}
        />
        <StatCard
          title="Out of Stock"
          value={metrics.outOfStockCount}
          subtitle="Depleted variants (0 units)"
          icon={Boxes}
          onClick={() => setFilter("out")}
          badge={metrics.outOfStockCount > 0 ? "Depleted" : "Zero"}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-burgundy/15 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-espresso/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product name, SKU, size, or colour..."
            className="w-full pl-10 pr-9 py-2 rounded-xl bg-ivory border border-burgundy/20 text-xs font-medium text-espresso placeholder:text-espresso/40 focus:outline-none focus:border-espresso focus:ring-1 focus:ring-espresso/20"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-espresso/40 hover:text-espresso"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills with Horizontal Scrolling on Mobile */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              filter === "all"
                ? "bg-espresso text-white shadow-xs"
                : "bg-ivory text-espresso/80 hover:text-espresso hover:bg-ivory-dark"
            }`}
          >
            All SKUs ({metrics.totalSkus})
          </button>
          <button
            onClick={() => setFilter("low")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              filter === "low"
                ? "bg-espresso text-white shadow-xs"
                : "bg-ivory text-espresso/80 hover:text-espresso hover:bg-ivory-dark"
            }`}
          >
            Low Stock ({metrics.lowStockCount})
          </button>
          <button
            onClick={() => setFilter("out")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              filter === "out"
                ? "bg-espresso text-white shadow-xs"
                : "bg-ivory text-espresso/80 hover:text-espresso hover:bg-ivory-dark"
            }`}
          >
            Out of Stock ({metrics.outOfStockCount})
          </button>
        </div>
      </div>

      {/* Main Inventory: Responsive Desktop Table + Mobile Card View */}

      {/* 1. DESKTOP VIEW (hidden md:block) */}
      <div className="hidden md:block bg-white rounded-2xl border border-burgundy/15 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-ivory text-espresso/80 border-b border-burgundy/15 uppercase font-bold text-[10px] tracking-wider">
                <th className="p-3.5 pl-6 font-bold">Garment Product</th>
                <th className="p-3.5 font-bold">Silhouette</th>
                <th className="p-3.5 font-bold">Variant & SKU</th>
                <th className="p-3.5 text-center font-bold">Colour</th>
                <th className="p-3.5 text-right font-bold">Total Stock</th>
                <th className="p-3.5 text-right font-bold">Reserved</th>
                <th className="p-3.5 text-right font-bold">Available</th>
                <th className="p-3.5 text-center font-bold">Status</th>
                <th className="p-3.5 pr-6 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-burgundy/10 font-sans">
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-ivory/50 transition-colors group"
                >
                  <td className="p-3.5 pl-6">
                    <span className="font-bold text-espresso block text-xs">
                      {item.productName}
                    </span>
                    <span className="text-[10px] text-espresso/50 font-mono">
                      ID: {item.productId.slice(0, 10)}...
                    </span>
                  </td>

                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-espresso/5 text-espresso/80 border border-espresso/10">
                      {item.category}
                    </span>
                  </td>

                  <td className="p-3.5">
                    <div className="space-y-0.5">
                      <span className="font-bold text-espresso font-mono">
                        Size: {item.size}
                      </span>
                      <span className="block text-[10px] font-mono text-espresso/60">
                        {item.sku}
                      </span>
                    </div>
                  </td>

                  <td className="p-3.5 text-center">
                    <div className="inline-flex items-center gap-1.5">
                      <span
                        className="w-3 h-3 rounded-full border border-espresso/20 shadow-xs shrink-0"
                        style={{ backgroundColor: item.colorHex }}
                      />
                      <span className="text-[11px] font-semibold text-espresso">
                        {item.colorName}
                      </span>
                    </div>
                  </td>

                  <td className="p-3.5 text-right font-mono font-bold text-sm text-espresso">
                    {item.quantity}
                  </td>

                  <td className="p-3.5 text-right font-mono text-espresso/60">
                    {item.reservedQty}
                  </td>

                  <td className="p-3.5 text-right font-mono font-bold text-sm">
                    <span
                      className={
                        item.available === 0
                          ? "text-rose-600"
                          : item.available <= 5
                          ? "text-amber-600"
                          : "text-emerald-700"
                      }
                    >
                      {item.available}
                    </span>
                  </td>

                  <td className="p-3.5 text-center">
                    <StatusBadge label={item.status} size="sm" />
                  </td>

                  <td className="p-3.5 pr-6 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() =>
                          setAdjustTarget({
                            inventoryId: item.inventoryId,
                            variantId: item.variantId,
                            productName: item.productName,
                            sku: item.sku,
                            size: item.size,
                            colorName: item.colorName,
                            colorHex: item.colorHex,
                            category: item.category,
                            currentQuantity: item.quantity,
                            reservedQty: item.reservedQty,
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-espresso hover:bg-crimson text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs"
                      >
                        Adjust
                      </button>

                      <button
                        onClick={() => setHistoryTarget(item)}
                        className="p-1.5 rounded-lg border border-espresso/15 text-espresso/60 hover:text-espresso hover:bg-espresso/5 transition-colors"
                        title="View Movement Ledger"
                        aria-label="View Movement Ledger"
                      >
                        <History className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {items.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-espresso/60 space-y-2">
                    <Boxes className="w-8 h-8 text-espresso/30 mx-auto" />
                    <p className="font-semibold text-sm">No inventory variants match your criteria.</p>
                    <p className="text-xs text-espresso/40">Try adjusting your search terms or filter pills.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. MOBILE CARD VIEW (block md:hidden) */}
      <div className="block md:hidden space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-burgundy/15 p-4 shadow-xs space-y-3"
          >
            {/* Top row: Title, Category, Color */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="font-serif font-bold text-sm text-espresso block truncate">
                  {item.productName}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-espresso/5 text-espresso/80 border border-espresso/10">
                    {item.category}
                  </span>
                  <div className="inline-flex items-center gap-1 text-[11px] text-espresso/70">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-espresso/20 inline-block shrink-0"
                      style={{ backgroundColor: item.colorHex }}
                    />
                    <span>{item.colorName}</span>
                  </div>
                </div>
              </div>
              <StatusBadge label={item.status} size="sm" />
            </div>

            {/* SKU and Size specs */}
            <div className="flex items-center justify-between text-xs bg-ivory p-2.5 rounded-xl border border-burgundy/10">
              <span className="font-bold text-espresso">
                Size: <strong className="font-mono">{item.size}</strong>
              </span>
              <span className="font-mono text-[10px] text-espresso/60 font-semibold truncate max-w-[180px]">
                {item.sku}
              </span>
            </div>

            {/* 3-Part Stock Grid */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-espresso/5 border border-espresso/10">
                <span className="text-[10px] uppercase tracking-wider text-espresso/50 font-bold block">
                  Total
                </span>
                <span className="font-mono font-bold text-sm text-espresso">
                  {item.quantity}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-espresso/5 border border-espresso/10">
                <span className="text-[10px] uppercase tracking-wider text-espresso/50 font-bold block">
                  Reserved
                </span>
                <span className="font-mono text-sm text-espresso/70">
                  {item.reservedQty}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] uppercase tracking-wider text-emerald-800 font-bold block">
                  Available
                </span>
                <span
                  className={`font-mono font-bold text-sm ${
                    item.available === 0
                      ? "text-rose-600"
                      : item.available <= 5
                      ? "text-amber-600"
                      : "text-emerald-700"
                  }`}
                >
                  {item.available}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-1 border-t border-espresso/5">
              <button
                type="button"
                onClick={() =>
                  setAdjustTarget({
                    inventoryId: item.inventoryId,
                    variantId: item.variantId,
                    productName: item.productName,
                    sku: item.sku,
                    size: item.size,
                    colorName: item.colorName,
                    colorHex: item.colorHex,
                    category: item.category,
                    currentQuantity: item.quantity,
                    reservedQty: item.reservedQty,
                  })
                }
                className="flex-1 py-2.5 bg-espresso hover:bg-crimson text-white text-xs font-bold uppercase tracking-wider rounded-xl text-center transition-colors shadow-2xs"
              >
                Adjust Stock
              </button>

              <button
                type="button"
                onClick={() => setHistoryTarget(item)}
                className="p-2.5 rounded-xl border border-espresso/20 text-espresso/70 hover:text-espresso hover:bg-espresso/5 transition-colors flex items-center justify-center shrink-0"
                title="View Movement Ledger"
                aria-label="View Movement Ledger"
              >
                <History className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {items.length === 0 && !isLoading && (
          <div className="p-8 text-center bg-white rounded-2xl border border-burgundy/15 text-espresso/60 space-y-2">
            <Boxes className="w-8 h-8 text-espresso/30 mx-auto" />
            <p className="font-semibold text-sm">No inventory variants found.</p>
            <p className="text-xs text-espresso/40">Try adjusting your filters or search criteria.</p>
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        target={adjustTarget}
        onClose={() => setAdjustTarget(null)}
        onSuccess={() => fetchInventory()}
      />

      {/* Movement History Drawer Modal */}
      {mounted && historyTarget && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="movement-ledger-title"
          data-lenis-prevent
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-xs overscroll-contain animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setHistoryTarget(null);
          }}
        >
          <div className="w-full max-w-xl bg-ivory rounded-t-3xl sm:rounded-2xl border border-burgundy/20 shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-white px-5 sm:px-6 py-4 border-b border-burgundy/10 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-espresso/5 border border-espresso/10 flex items-center justify-center text-espresso shrink-0">
                  <History className="w-4 h-4 text-burgundy" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3
                      id="movement-ledger-title"
                      className="font-serif font-bold text-base text-espresso truncate"
                    >
                      Stock Movement Ledger
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-burgundy/10 text-burgundy rounded border border-burgundy/20 font-bold shrink-0">
                      {historyTarget.sku}
                    </span>
                  </div>
                  <p className="text-[11px] text-espresso/60 uppercase tracking-wider font-semibold">
                    Immutable Transaction History
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHistoryTarget(null)}
                className="p-1.5 text-espresso/50 hover:text-espresso rounded-xl hover:bg-espresso/5 transition-colors shrink-0 ml-2"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div
              data-lenis-prevent
              data-modal-scroll
              className="custom-scrollbar flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
            >
              <div className="p-3.5 bg-white rounded-xl border border-burgundy/15 text-xs shadow-2xs">
                <p className="font-serif font-bold text-espresso text-sm">{historyTarget.productName}</p>
                <p className="text-espresso/70 mt-1 flex flex-wrap items-center gap-2">
                  <span>Size: <strong className="font-mono text-espresso">{historyTarget.size}</strong></span>
                  <span>•</span>
                  <span>Colour: <strong className="text-espresso">{historyTarget.colorName}</strong></span>
                  <span>•</span>
                  <span>
                    Current Physical Units:{" "}
                    <strong className="text-emerald-700 font-bold font-mono">{historyTarget.quantity}</strong>
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-espresso/60">
                  Audit Log Entries
                </p>
                {historyTarget.recentMovements.length > 0 ? (
                  <div className="divide-y divide-burgundy/10 border border-burgundy/15 rounded-xl bg-white overflow-hidden text-xs shadow-2xs">
                    {historyTarget.recentMovements.map((mov) => (
                      <div key={mov.id} className="p-3.5 hover:bg-ivory/50 flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`font-mono font-bold text-xs ${
                                mov.changeQty > 0 ? "text-emerald-700" : "text-rose-700"
                              }`}
                            >
                              {mov.changeQty > 0 ? `+${mov.changeQty}` : mov.changeQty} units
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-espresso/5 text-espresso/80 border border-espresso/10">
                              {mov.reason}
                            </span>
                          </div>
                          {mov.notes && (
                            <p className="text-[11px] text-espresso/70 italic">&ldquo;{mov.notes}&rdquo;</p>
                          )}
                          <p className="text-[10px] text-espresso/50 font-mono">
                            By: {mov.performedBy || "System"} • {new Date(mov.createdAt).toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div className="text-right font-mono text-[11px] shrink-0 pt-0.5">
                          <span className="text-espresso/50">{mov.balanceBefore}</span>
                          <span className="text-espresso/30 mx-1">→</span>
                          <span className="font-bold text-espresso">{mov.balanceAfter}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-espresso/50 p-6 text-center bg-white rounded-xl border border-burgundy/15">
                    No adjustment movements recorded yet. Initial catalog import stock is active.
                  </p>
                )}
              </div>
            </div>

            {/* Pinned Footer */}
            <div className="shrink-0 p-4 border-t border-burgundy/10 bg-white flex items-center justify-end">
              <button
                type="button"
                onClick={() => setHistoryTarget(null)}
                className="w-full sm:w-auto px-5 py-2.5 bg-espresso text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-crimson transition-colors text-center"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
