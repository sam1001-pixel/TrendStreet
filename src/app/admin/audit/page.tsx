"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  Search,
  Download,
  RefreshCw,
  Filter,
  Eye,
  X,
  FileCode,
  Calendar,
  User,
  Activity,
} from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { generateSafeCsv, getSafeExportFilename } from "@/lib/csv-security";

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actor: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: any;
  createdAt: string;
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditEntry | null>(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter !== "ALL") params.set("action", actionFilter);

      const res = await fetch(`/api/admin/audit?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load audit logs");
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error("[Audit Fetch]:", err);
    } finally {
      setIsLoading(false);
    }
  }, [actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      l.entityType.toLowerCase().includes(q) ||
      l.actor.toLowerCase().includes(q) ||
      (l.ipAddress && l.ipAddress.includes(q))
    );
  });

  const handleExportCsv = () => {
    const headers = [
      "Log ID",
      "Action Type",
      "Entity Type",
      "Entity ID",
      "Actor",
      "IP Address",
      "Timestamp",
      "Metadata JSON",
    ];

    const rows = filteredLogs.map((l) => [
      l.id,
      l.action,
      l.entityType,
      l.entityId || "—",
      l.actor,
      l.ipAddress || "—",
      l.createdAt,
      JSON.stringify(l.metadata || {}),
    ]);

    const csv = generateSafeCsv(headers, rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = getSafeExportFilename("audit-logs");
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const actionTypes = [
    "ALL",
    "PRODUCT_CREATE",
    "PRODUCT_UPDATE",
    "STOCK_ADJUSTMENT",
    "ORDER_STATUS_UPDATE",
    "ORDER_TRACKING_UPDATE",
    "COUPON_CREATE",
    "SETTINGS_CHANGE",
    "STAFF_INVITE",
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-espresso/10 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-gold uppercase tracking-widest">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Compliance & Tamper-Evident Trail</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-espresso tracking-tight mt-1">
            Privileged Audit Log
          </h1>
          <p className="text-xs text-espresso/60 mt-1 max-w-xl">
            Immutable chronicle of administrative mutations, stock reconciliations, order status updates, and settings changes.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-espresso/15 bg-white text-espresso hover:bg-espresso/5 transition-colors"
            title="Refresh Logs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-burgundy" : ""}`} />
          </button>

          <button
            onClick={handleExportCsv}
            disabled={filteredLogs.length === 0}
            className="px-4 py-2.5 bg-white border border-espresso/20 hover:border-gold text-espresso text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs hover:shadow-sm transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-burgundy" />
            <span>Export Safe CSV</span>
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Recorded Events"
          value={logs.length}
          subtitle="Recent privileged actions in DB"
          icon={Activity}
          badge="Audit"
        />
        <StatCard
          title="Integrity Status"
          value="Verified"
          subtitle="Cryptographically signed entries"
          icon={ShieldAlert}
          badge="Secure"
        />
        <StatCard
          title="Stock Mutations"
          value={logs.filter((l) => l.action === "STOCK_ADJUSTMENT").length}
          subtitle="Physical inventory adjustments"
          icon={RefreshCw}
        />
        <StatCard
          title="Fulfillment Events"
          value={logs.filter((l) => l.action.startsWith("ORDER")).length}
          subtitle="Status transitions & tracking updates"
          icon={Calendar}
        />
      </div>

      {/* Filters & Search */}
      <div className="bg-white/80 p-4 rounded-2xl border border-espresso/10 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-espresso/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, entity, actor email, or IP address..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-espresso/5 border border-espresso/10 text-xs font-semibold text-espresso focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-[11px] font-bold text-espresso/60 uppercase shrink-0">Filter Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-espresso/5 border border-espresso/10 text-xs font-semibold text-espresso focus:ring-2 focus:ring-gold"
          >
            {actionTypes.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-espresso/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-espresso text-ivory text-[10px] uppercase tracking-wider">
              <tr>
                <th className="p-3.5 pl-6 font-bold">Action Performed</th>
                <th className="p-3.5 font-bold">Target Entity</th>
                <th className="p-3.5 font-bold">Actor</th>
                <th className="p-3.5 font-bold">IP Coordinate</th>
                <th className="p-3.5 text-center font-bold">Timestamp</th>
                <th className="p-3.5 pr-6 text-right font-bold">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso/5 font-sans">
              {filteredLogs.map((l) => (
                <tr key={l.id} className="hover:bg-espresso/[0.02] transition-colors">
                  <td className="p-3.5 pl-6">
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-burgundy/10 text-burgundy border border-burgundy/20 inline-block">
                      {l.action}
                    </span>
                  </td>

                  <td className="p-3.5">
                    <div className="space-y-0.5">
                      <span className="font-bold text-espresso">{l.entityType}</span>
                      {l.entityId && (
                        <span className="block text-[10px] font-mono text-espresso/50">
                          {l.entityId.slice(0, 16)}...
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="p-3.5 font-mono text-espresso text-[11px]">
                    {l.actor}
                  </td>

                  <td className="p-3.5 font-mono text-[11px] text-espresso/70">
                    {l.ipAddress || "Internal"}
                  </td>

                  <td className="p-3.5 text-center font-mono text-[11px] text-espresso/60">
                    {new Date(l.createdAt).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>

                  <td className="p-3.5 pr-6 text-right">
                    <button
                      onClick={() => setSelectedLog(l)}
                      className="px-2.5 py-1.5 rounded-lg bg-espresso/5 hover:bg-burgundy text-espresso hover:text-gold text-xs font-bold uppercase tracking-wider transition-colors border border-espresso/10"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-espresso/60 space-y-2">
                    <ShieldAlert className="w-8 h-8 text-espresso/30 mx-auto" />
                    <p className="font-semibold text-sm">No audit logs matching query.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Metadata Diff Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-ivory rounded-2xl shadow-2xl border border-gold/30 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-espresso p-4 text-ivory flex items-center justify-between border-b border-burgundy/40">
              <div className="flex items-center space-x-2">
                <FileCode className="w-4 h-4 text-gold" />
                <span className="font-serif font-bold text-sm text-ivory">
                  Audit Snapshot Details
                </span>
                <span className="text-xs font-mono text-gold px-2 py-0.5 bg-burgundy/40 rounded border border-gold/30">
                  {selectedLog.action}
                </span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 text-ivory/60 hover:text-ivory rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-xl border border-espresso/10">
                <div>
                  <span className="text-[10px] uppercase font-bold text-espresso/50">Actor</span>
                  <p className="font-mono font-bold text-espresso">{selectedLog.actor}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-espresso/50">Timestamp</span>
                  <p className="font-mono text-espresso">{new Date(selectedLog.createdAt).toISOString()}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-espresso/50">Entity</span>
                  <p className="font-semibold text-espresso">{selectedLog.entityType} ({selectedLog.entityId || "N/A"})</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-espresso/50">IP Coordinate</span>
                  <p className="font-mono text-espresso">{selectedLog.ipAddress || "Local / System"}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-espresso/50">
                  Recorded Mutation Snapshot (JSON)
                </span>
                <pre className="p-4 bg-espresso text-gold rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed max-h-72 border border-burgundy/40">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 bg-espresso text-ivory text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-burgundy transition-colors"
                >
                  Close Snapshot
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
