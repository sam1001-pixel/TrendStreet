"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Boxes,
  AlertTriangle,
  Search,
  Download,
  RefreshCw,
  Plus,
  History,
  CheckCircle,
  SlidersHorizontal,
  Shirt,
  X,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  StockAdjustmentModal,
  StockAdjustmentTarget,
} from "@/components/admin/StockAdjustmentModal";

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

  // Modals state
  const [adjustTarget, setAdjustTarget] = useState<StockAdjustmentTarget | null>(null);
  const [historyTarget, setHistoryTarget] = useState<InventoryItem | null>(null);
  const [isExporting, setIsExporting] = useState(false);

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
      a.download = `trendstreet-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
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
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-espresso/10 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-gold uppercase tracking-widest">
            <Boxes className="w-3.5 h-3.5" />
            <span>Warehouse & Atelier Stock</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-espresso tracking-tight mt-1">
            Inventory Management
          </h1>
          <p className="text-xs text-espresso/60 mt-1 max-w-xl">
            Variant-level SKU stock control with mandatory reason logging,
            transactional balance tracking, and formula-injection-safe CSV reporting.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchInventory()}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-espresso/15 bg-white text-espresso hover:bg-espresso/5 transition-colors disabled:opacity-50"
            title="Refresh Stock Counts"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-burgundy" : ""}`} />
          </button>

          <button
            onClick={handleExportCsv}
            disabled={isExporting || items.length === 0}
            className="px-4 py-2.5 bg-white border border-espresso/20 hover:border-gold text-espresso text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs hover:shadow-sm transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-burgundy" />
            <span>{isExporting ? "Exporting..." : "Export Safe CSV"}</span>
          </button>
        </div>
      </div>

      {/* Operational Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Active SKUs"
          value={metrics.totalSkus}
          subtitle="Distinct garment variants"
          icon={Boxes}
          badge="Catalog"
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
      <div className="bg-white/80 p-4 rounded-2xl border border-espresso/10 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-espresso/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, SKU, size, or color..."
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

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 border border-espresso/10 p-1 rounded-xl bg-espresso/5 self-start md:self-auto">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === "all"
                ? "bg-burgundy text-gold shadow-xs"
                : "text-espresso/70 hover:text-espresso"
            }`}
          >
            All SKUs ({metrics.totalSkus})
          </button>
          <button
            onClick={() => setFilter("low")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === "low"
                ? "bg-burgundy text-gold shadow-xs"
                : "text-espresso/70 hover:text-espresso"
            }`}
          >
            Low Stock ({metrics.lowStockCount})
          </button>
          <button
            onClick={() => setFilter("out")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === "out"
                ? "bg-burgundy text-gold shadow-xs"
                : "text-espresso/70 hover:text-espresso"
            }`}
          >
            Out of Stock ({metrics.outOfStockCount})
          </button>
        </div>
      </div>

      {/* Main Inventory Variant Table */}
      <div className="bg-white rounded-2xl border border-espresso/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-espresso text-ivory text-[10px] uppercase tracking-wider">
              <tr>
                <th className="p-3.5 pl-6 font-bold">Garment Product</th>
                <th className="p-3.5 font-bold">Silhouette</th>
                <th className="p-3.5 font-bold">Variant & SKU</th>
                <th className="p-3.5 text-center font-bold">Color</th>
                <th className="p-3.5 text-right font-bold">Stock</th>
                <th className="p-3.5 text-right font-bold">Reserved</th>
                <th className="p-3.5 text-right font-bold">Available</th>
                <th className="p-3.5 text-center font-bold">Health</th>
                <th className="p-3.5 pr-6 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso/5 font-sans">
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-espresso/[0.02] transition-colors group"
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
                        className="w-3 h-3 rounded-full border border-espresso/20 shadow-xs"
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
                            currentQuantity: item.quantity,
                            reservedQty: item.reservedQty,
                          })
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-burgundy/10 hover:bg-burgundy text-burgundy hover:text-gold text-xs font-bold uppercase tracking-wider transition-colors border border-burgundy/20"
                      >
                        Adjust
                      </button>

                      <button
                        onClick={() => setHistoryTarget(item)}
                        className="p-1.5 rounded-lg text-espresso/50 hover:text-espresso hover:bg-espresso/10 transition-colors"
                        title="View Movement Ledger"
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

      {/* Reason-enforced Stock Adjustment Modal */}
      <StockAdjustmentModal
        target={adjustTarget}
        onClose={() => setAdjustTarget(null)}
        onSuccess={() => fetchInventory()}
      />

      {/* Movement History Drawer Modal */}
      {historyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-ivory rounded-2xl shadow-2xl border border-gold/30 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-espresso p-4 text-ivory flex items-center justify-between border-b border-burgundy/40">
              <div className="flex items-center space-x-2">
                <History className="w-4 h-4 text-gold" />
                <span className="font-serif font-bold text-sm text-ivory">
                  Stock Movement Ledger
                </span>
                <span className="text-xs font-mono text-gold px-2 py-0.5 bg-burgundy/40 rounded border border-gold/30">
                  {historyTarget.sku}
                </span>
              </div>
              <button
                onClick={() => setHistoryTarget(null)}
                className="p-1 text-ivory/60 hover:text-ivory rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="p-3 bg-espresso/5 rounded-xl border border-espresso/10 text-xs">
                <p className="font-bold text-espresso">{historyTarget.productName}</p>
                <p className="text-espresso/60 mt-0.5">
                  Size: {historyTarget.size} • Color: {historyTarget.colorName} • Current Units:{" "}
                  <strong className="text-emerald-700 font-bold">{historyTarget.quantity}</strong>
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-espresso/60">
                  Immutable Movement History
                </p>
                {historyTarget.recentMovements.length > 0 ? (
                  <div className="divide-y divide-espresso/10 border border-espresso/10 rounded-xl bg-white overflow-hidden text-xs">
                    {historyTarget.recentMovements.map((mov) => (
                      <div key={mov.id} className="p-3 hover:bg-espresso/[0.02] flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono font-bold text-xs ${
                                mov.changeQty > 0 ? "text-emerald-700" : "text-rose-700"
                              }`}
                            >
                              {mov.changeQty > 0 ? `+${mov.changeQty}` : mov.changeQty} units
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-espresso/5 text-espresso/80 border border-espresso/10">
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
                        <div className="text-right font-mono text-[11px]">
                          <span className="text-espresso/50">{mov.balanceBefore}</span>
                          <span className="text-espresso/40 mx-1">→</span>
                          <span className="font-bold text-espresso">{mov.balanceAfter}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-espresso/50 p-4 text-center bg-white rounded-xl border border-espresso/10">
                    No adjustment movements recorded yet. Initial catalog import stock is active.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
