"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RefreshCw, RotateCcw, Truck, CheckCircle2, MessageCircle, Phone, Download, Loader2 } from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { generateSafeCsv, getSafeExportFilename } from "@/lib/csv-security";

type Status = "REQUESTED" | "APPROVED" | "PICKED_UP" | "COMPLETED" | "REJECTED";

interface ReturnItem {
  orderItemId: string;
  productName: string;
  size: string;
  quantity: number;
  exchangeSize: string | null;
}

interface Request {
  id: string;
  kind: "EXCHANGE" | "RETURN";
  status: Status;
  reason: string;
  note: string | null;
  adminNote: string | null;
  items: ReturnItem[];
  createdAt: string;
  updatedAt: string;
  order: { id: string; orderNumber: string; total: number; paidOnline: boolean; customerName: string; email: string; phone: string; address: string };
}

const LABEL: Record<Status, string> = {
  REQUESTED: "New",
  APPROVED: "Approved",
  PICKED_UP: "Picked up",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
};
const STYLE: Record<Status, string> = {
  REQUESTED: "bg-amber-100 text-amber-900",
  APPROVED: "bg-blue-100 text-blue-900",
  PICKED_UP: "bg-indigo-100 text-indigo-900",
  COMPLETED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};
/** The next step offered for each status. */
const NEXT: Record<Status, Status[]> = {
  REQUESTED: ["APPROVED", "REJECTED"],
  APPROVED: ["PICKED_UP", "REJECTED"],
  PICKED_UP: ["COMPLETED"],
  COMPLETED: [],
  REJECTED: ["REQUESTED"],
};
const ACTION: Record<Status, string> = {
  REQUESTED: "Re-open",
  APPROVED: "Approve",
  PICKED_UP: "Mark picked up",
  COMPLETED: "Mark completed",
  REJECTED: "Reject",
};

const fmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default function AdminReturnsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [filter, setFilter] = useState<"open" | "all">("open");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/returns", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load requests.");
      setRequests(data.requests);
    } catch (err) {
      setMessage({ tone: "error", text: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const update = async (r: Request, body: { status?: Status; adminNote?: string }) => {
    setBusy(r.id);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/returns", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r.id, ...body }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "That didn't work.");
      setRequests((list) => list.map((x) => (x.id === r.id ? { ...x, status: data.status, adminNote: data.adminNote } : x)));
      setMessage({ tone: "ok", text: body.status ? `${r.order.orderNumber}: ${LABEL[body.status as Status]}. The customer sees this on their order.` : "Note saved — the customer sees it on their order." });
    } catch (err) {
      setMessage({ tone: "error", text: (err as Error).message });
    } finally {
      setBusy(null);
    }
  };

  const open = requests.filter((r) => ["REQUESTED", "APPROVED", "PICKED_UP"].includes(r.status));
  const visible = filter === "open" ? open : requests;
  const reasons = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of requests) m.set(r.reason, (m.get(r.reason) ?? 0) + 1);
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [requests]);

  const exportCsv = () => {
    const csv = generateSafeCsv(
      ["Order", "Type", "Status", "Reason", "Items", "Customer", "Phone", "Email", "Address", "Requested", "Note", "Our note"],
      requests.map((r) => [
        r.order.orderNumber,
        r.kind,
        LABEL[r.status],
        r.reason,
        r.items.map((i) => `${i.productName} ${i.size} x${i.quantity}${i.exchangeSize ? ` -> ${i.exchangeSize}` : ""}`).join("; "),
        r.order.customerName,
        r.order.phone,
        r.order.email,
        r.order.address,
        r.createdAt,
        r.note ?? "",
        r.adminNote ?? "",
      ])
    );
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = getSafeExportFilename("exchanges-returns");
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-espresso">Exchanges &amp; returns</h1>
          <p className="text-sm text-espresso/70">
            Requests customers raise from their account or the track-order page (delivered orders, within 30 days). Each step you set and any note
            you add shows on the customer&apos;s order.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void load()} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-burgundy/20 bg-white px-3 text-xs font-semibold text-espresso">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <button onClick={exportCsv} disabled={!requests.length} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-burgundy/20 bg-white px-3 text-xs font-semibold text-espresso disabled:opacity-50">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {message && (
        <p role="status" className={`rounded-xl p-3 text-sm font-semibold ${message.tone === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
          {message.text}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="New requests" value={requests.filter((r) => r.status === "REQUESTED").length} subtitle="Need a decision" icon={RotateCcw} />
        <StatCard title="Pickups in progress" value={requests.filter((r) => r.status === "APPROVED" || r.status === "PICKED_UP").length} subtitle="Approved or collected" icon={Truck} />
        <StatCard title="Completed" value={requests.filter((r) => r.status === "COMPLETED").length} subtitle={reasons[0] ? `Top reason: ${reasons[0][0]}` : "—"} icon={CheckCircle2} />
      </div>

      <div className="flex gap-2">
        {(["open", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f} className={`min-h-[36px] rounded-full px-4 text-xs font-bold ${filter === f ? "bg-espresso text-ivory" : "bg-white text-espresso ring-1 ring-burgundy/15"}`}>
            {f === "open" ? `Open (${open.length})` : `All (${requests.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-espresso/60"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-sm text-espresso/60 ring-1 ring-burgundy/10">
          {filter === "open" ? "No open requests. 🎉" : "No exchange or return requests yet."}
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((r) => {
            const phone = r.order.phone.replace(/\D/g, "").slice(-10);
            const wa = phone
              ? `https://wa.me/91${phone}?text=${encodeURIComponent(`Hi ${r.order.customerName.split(" ")[0]}, this is OFFVYBE about your ${r.kind === "EXCHANGE" ? "exchange" : "return"} for order ${r.order.orderNumber}.`)}`
              : null;
            return (
              <li key={r.id} className="rounded-2xl bg-white p-4 ring-1 ring-burgundy/10 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${STYLE[r.status]}`}>{LABEL[r.status]}</span>
                      <span className="text-sm font-bold text-espresso">{r.kind === "EXCHANGE" ? "Exchange" : "Return / refund"}</span>
                      <Link href={`/admin/orders?q=${encodeURIComponent(r.order.orderNumber)}`} className="font-mono text-xs font-bold text-burgundy underline">
                        {r.order.orderNumber}
                      </Link>
                    </p>
                    <p className="mt-1 text-xs text-espresso/60">
                      {fmt.format(new Date(r.createdAt))} · {r.reason} · {r.order.paidOnline ? "Paid online" : "Cash on delivery"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {wa && (
                      <a href={wa} target="_blank" rel="noreferrer" className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-green-50 px-3 text-xs font-semibold text-green-800">
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                      </a>
                    )}
                    {phone && (
                      <a href={`tel:+91${phone}`} className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-ivory px-3 text-xs font-semibold text-espresso">
                        <Phone className="h-3.5 w-3.5" /> Call
                      </a>
                    )}
                  </div>
                </div>

                <ul className="mt-3 space-y-1 rounded-xl bg-ivory p-3 text-sm">
                  {r.items.map((i) => (
                    <li key={i.orderItemId}>
                      <span className="font-semibold">{i.productName}</span> · size {i.size} × {i.quantity}
                      {i.exchangeSize && <span className="font-bold text-burgundy"> → size {i.exchangeSize}</span>}
                    </li>
                  ))}
                </ul>
                {r.note && <p className="mt-2 text-xs text-espresso/80"><span className="font-semibold">Customer note:</span> {r.note}</p>}
                <p className="mt-2 text-xs text-espresso/60">
                  Pickup: {r.order.customerName}, {r.order.address}
                  {r.order.email ? ` · ${r.order.email}` : ""}
                </p>

                <div className="mt-3 flex flex-col gap-2 border-t border-burgundy/10 pt-3 sm:flex-row sm:items-center">
                  <input
                    aria-label="Note for the customer"
                    placeholder="Note for the customer (e.g. pickup on Friday)"
                    value={notes[r.id] ?? r.adminNote ?? ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                    maxLength={300}
                    className="min-h-[40px] flex-1 rounded-lg border border-burgundy/20 px-3 text-sm focus:border-burgundy focus:outline-none"
                  />
                  <button
                    disabled={busy === r.id || (notes[r.id] ?? r.adminNote ?? "") === (r.adminNote ?? "")}
                    onClick={() => update(r, { adminNote: notes[r.id] ?? "" })}
                    className="min-h-[40px] rounded-lg border border-burgundy/20 px-3 text-xs font-semibold text-espresso disabled:opacity-40"
                  >
                    Save note
                  </button>
                  {NEXT[r.status].map((s) => (
                    <button
                      key={s}
                      disabled={busy === r.id}
                      onClick={() => update(r, { status: s, ...(notes[r.id] !== undefined ? { adminNote: notes[r.id] } : {}) })}
                      className={`min-h-[40px] rounded-lg px-4 text-xs font-bold disabled:opacity-50 ${s === "REJECTED" ? "text-red-700 ring-1 ring-red-200" : "bg-espresso text-ivory"}`}
                    >
                      {ACTION[s]}
                    </button>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
