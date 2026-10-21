"use client";

import React, { useEffect, useState } from "react";
import { Download, RefreshCw } from "lucide-react";

interface AuditRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actor: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: unknown;
  createdAt: string;
}

const ACTIONS = [
  "ADMIN_LOGIN",
  "ADMIN_LOGIN_FAILED",
  "ADMIN_LOGOUT",
  "ORDER_STATUS_UPDATE",
  "ORDER_TRACKING_UPDATE",
  "PRODUCT_CREATE",
  "PRODUCT_EDIT",
  "PRODUCT_DELETE",
  "SETTINGS_CHANGE",
  "ORDER_CONFIRMATION_EMAIL_SENT",
];

const csvCell = (v: unknown) => {
  const s = typeof v === "string" ? v : v == null ? "" : JSON.stringify(v);
  // Neutralise spreadsheet formula injection and quote everything.
  return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
};

const summarise = (r: AuditRow) => {
  const m = (r.metadata ?? {}) as Record<string, any>;
  if (m.orderNumber && m.to !== undefined) return `${m.orderNumber}: ${m.from ?? "—"} → ${m.to || "—"}`;
  if (m.changed) return Object.keys(m.changed).join(", ") || "no changes";
  if (m.name) return m.name;
  if (m.attemptedEmail) return `attempted as ${m.attemptedEmail}`;
  return r.entityId ?? "";
};

/** Live, database-backed log of privileged admin actions. */
export function AuditTrail() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/audit${filter ? `?action=${encodeURIComponent(filter)}` : ""}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load the audit log.");
      setRows(data.logs);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const exportCsv = () => {
    const header = ["Timestamp (UTC)", "Action", "Actor", "Entity", "Entity ID", "Summary", "IP", "User agent", "Details"];
    const lines = rows.map((r) =>
      [r.createdAt, r.action, r.actor, r.entityType, r.entityId, summarise(r), r.ipAddress, r.userAgent, r.metadata].map(csvCell).join(",")
    );
    const blob = new Blob([[header.map(csvCell).join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `trend-street-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <section className="space-y-4 rounded-2xl border border-burgundy/15 bg-white p-5 shadow-xs sm:p-6" aria-labelledby="audit-heading">
      <div className="flex flex-col justify-between gap-3 border-b border-burgundy/10 pb-3 sm:flex-row sm:items-end">
        <div>
          <h2 id="audit-heading" className="font-serif text-lg font-bold text-espresso">
            Live audit trail
          </h2>
          <p className="text-xs text-espresso/60">Every admin sign-in, order change, product edit and settings change, recorded server-side.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="audit-filter" className="sr-only">
            Filter by action
          </label>
          <select
            id="audit-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-burgundy/20 bg-white px-2.5 py-2 text-xs text-espresso"
          >
            <option value="">All actions</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a.replace(/_/g, " ").toLowerCase()}
              </option>
            ))}
          </select>
          <button onClick={load} className="flex items-center gap-1.5 rounded-lg border border-burgundy/20 px-3 py-2 text-xs font-semibold text-burgundy hover:bg-burgundy/5">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            onClick={exportCsv}
            disabled={!rows.length}
            className="flex items-center gap-1.5 rounded-lg bg-burgundy px-3 py-2 text-xs font-semibold text-white hover:bg-crimson disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-xs text-red-800">
          {error}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="text-[10px] uppercase tracking-wider text-espresso/50">
            <tr>
              <th className="p-2.5">When</th>
              <th className="p-2.5">Action</th>
              <th className="p-2.5">Who</th>
              <th className="p-2.5">What</th>
              <th className="p-2.5">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-burgundy/10">
            {rows.map((r) => (
              <tr key={r.id} className={r.action === "ADMIN_LOGIN_FAILED" ? "bg-red-50/60" : ""}>
                <td className="whitespace-nowrap p-2.5 font-mono text-[11px] text-espresso/70">{new Date(r.createdAt).toLocaleString("en-IN")}</td>
                <td className="p-2.5 font-semibold text-burgundy">{r.action.replace(/_/g, " ").toLowerCase()}</td>
                <td className="p-2.5 text-espresso">{r.actor}</td>
                <td className="max-w-[280px] truncate p-2.5 text-espresso/80" title={summarise(r)}>
                  {summarise(r)}
                </td>
                <td className="p-2.5 font-mono text-[11px] text-espresso/60">{r.ipAddress ?? "—"}</td>
              </tr>
            ))}
            {!loading && !rows.length && !error && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-espresso/50">
                  No entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
