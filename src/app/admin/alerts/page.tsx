"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, BellRing, Mail, MessageCircle, Check, Trash2, Download, RefreshCw, Send, Loader2, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { generateSafeCsv, getSafeExportFilename } from "@/lib/csv-security";

interface Alert {
  id: string;
  kind: "RESTOCK" | "DROP";
  productId: string | null;
  productName: string | null;
  size: string | null;
  email: string | null;
  phone: string | null;
  notifiedAt: string | null;
  createdAt: string;
}

const fmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/** WhatsApp chat with the message already typed — one tap to send from the admin's phone. */
function waLink(a: Alert, origin: string) {
  const text =
    a.kind === "DROP"
      ? `Hi! The new Trend Street drop you asked about is live now: ${origin}/shop?sort=newest`
      : `Hi! ${a.productName ?? "The piece you asked about"}${a.size ? ` (size ${a.size})` : ""} is back in stock at Trend Street: ${origin}/product/${a.productId}`;
  return `https://wa.me/91${a.phone}?text=${encodeURIComponent(text)}`;
}

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [origin, setOrigin] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/alerts");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load alerts.");
      setAlerts(data.alerts);
      setEmailEnabled(data.emailEnabled);
    } catch (err) {
      setMessage({ tone: "error", text: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setOrigin(window.location.origin);
    void load();
  }, [load]);

  const act = async (key: string, body: Record<string, unknown>, success: (d: any) => string) => {
    setBusy(key);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/alerts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "That didn't work.");
      setMessage({ tone: "ok", text: success(data) });
      await load();
    } catch (err) {
      setMessage({ tone: "error", text: (err as Error).message });
    } finally {
      setBusy(null);
    }
  };

  const pending = alerts.filter((a) => !a.notifiedAt);
  const restockGroups = useMemo(() => {
    const map = new Map<string, { productId: string; name: string; items: Alert[] }>();
    for (const a of pending) {
      if (a.kind !== "RESTOCK" || !a.productId) continue;
      const g = map.get(a.productId) ?? { productId: a.productId, name: a.productName ?? a.productId, items: [] };
      g.items.push(a);
      map.set(a.productId, g);
    }
    return Array.from(map.values()).sort((x, y) => y.items.length - x.items.length);
  }, [pending]);
  const dropPending = pending.filter((a) => a.kind === "DROP");
  const visible = showDone ? alerts : pending;

  const exportCsv = () => {
    const csv = generateSafeCsv(
      ["Type", "Product", "Size", "Email", "WhatsApp", "Signed up", "Contacted"],
      alerts.map((a) => [a.kind === "DROP" ? "Next drop" : "Restock", a.productName ?? "", a.size ?? "", a.email ?? "", a.phone ?? "", a.createdAt, a.notifiedAt ?? ""])
    );
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = getSafeExportFilename("drop-alerts");
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-espresso">Drop alerts</h1>
          <p className="text-sm text-espresso/70">
            Shoppers who tapped &ldquo;Notify me&rdquo; on a sold-out piece or &ldquo;Remind me&rdquo; on the next-drop countdown. Adding stock in
            Inventory or Products emails the restock list automatically.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void load()} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-burgundy/20 bg-white px-3 text-xs font-semibold text-espresso">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <button onClick={exportCsv} disabled={!alerts.length} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-burgundy/20 bg-white px-3 text-xs font-semibold text-espresso disabled:opacity-50">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {!emailEnabled && (
        <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          Emails are off because RESEND_API_KEY isn&apos;t set. Sign-ups are still saved; use the WhatsApp links or export the list.
        </p>
      )}
      {message && (
        <p role="status" className={`rounded-xl p-3 text-sm font-semibold ${message.tone === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
          {message.text}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Waiting for restock" value={pending.filter((a) => a.kind === "RESTOCK").length} subtitle={`${restockGroups.length} products`} icon={Bell} />
        <StatCard title="Waiting for next drop" value={dropPending.length} subtitle="Remind me sign-ups" icon={BellRing} />
        <StatCard title="Already contacted" value={alerts.length - pending.length} subtitle="Emailed or marked done" icon={Check} />
      </div>

      {/* Next drop */}
      <section className="rounded-2xl border border-burgundy/15 bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-espresso">Next drop reminders</h2>
            <p className="text-xs text-espresso/70">When the drop goes live, email everyone on this list in one go.</p>
          </div>
          <button
            disabled={!dropPending.some((a) => a.email) || busy !== null || !emailEnabled}
            onClick={() =>
              window.confirm(`Email ${dropPending.filter((a) => a.email).length} people that the drop is live?`) &&
              void act("drop", { action: "notify-drop" }, (d) => `Sent ${d.sent} emails.${d.waiting ? ` ${d.waiting} WhatsApp-only sign-ups are still in the list below.` : ""}`)
            }
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-espresso px-4 text-xs font-bold uppercase tracking-wider text-ivory disabled:opacity-40"
          >
            {busy === "drop" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Email: the drop is live
          </button>
        </div>
      </section>

      {/* Restock by product */}
      <section className="rounded-2xl border border-burgundy/15 bg-white p-5">
        <h2 className="font-serif text-lg font-bold text-espresso">Waiting for restock</h2>
        {restockGroups.length === 0 ? (
          <p className="mt-2 text-sm text-espresso/60">{loading ? "Loading…" : "Nobody is waiting right now."}</p>
        ) : (
          <ul className="mt-3 divide-y divide-burgundy/10">
            {restockGroups.map((g) => {
              const sizes = Array.from(new Set(g.items.map((a) => a.size ?? "any"))).join(", ");
              return (
                <li key={g.productId} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-espresso">{g.name}</p>
                    <p className="text-xs text-espresso/70">
                      {g.items.length} waiting · sizes: {sizes}
                    </p>
                  </div>
                  <button
                    disabled={busy !== null || !emailEnabled || !g.items.some((a) => a.email)}
                    onClick={() =>
                      void act(`p-${g.productId}`, { action: "notify-restock", productId: g.productId }, (d) =>
                        d.sent ? `Emailed ${d.sent} people about ${g.name}.` : `Nothing sent — the waiting sizes of ${g.name} aren't in stock yet (or only WhatsApp numbers are left).`
                      )
                    }
                    className="inline-flex min-h-[40px] flex-shrink-0 items-center gap-1.5 rounded-lg border border-burgundy/20 px-3 text-xs font-semibold text-espresso disabled:opacity-40"
                  >
                    {busy === `p-${g.productId}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />} Email if back in stock
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Everyone */}
      <section className="rounded-2xl border border-burgundy/15 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-lg font-bold text-espresso">{showDone ? "All sign-ups" : "Still to contact"}</h2>
          <label className="flex items-center gap-2 text-xs text-espresso/70">
            <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} className="h-4 w-4 accent-burgundy" /> Show contacted
          </label>
        </div>
        {visible.length === 0 ? (
          <p className="mt-2 text-sm text-espresso/60">{loading ? "Loading…" : "No sign-ups yet."}</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-espresso/60">
                <tr>
                  <th className="py-2 pr-3">For</th>
                  <th className="py-2 pr-3">Contact</th>
                  <th className="py-2 pr-3">Signed up</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-burgundy/10">
                {visible.map((a) => (
                  <tr key={a.id} className={a.notifiedAt ? "opacity-60" : ""}>
                    <td className="py-2.5 pr-3">
                      <span className="font-semibold text-espresso">{a.kind === "DROP" ? "Next drop" : a.productName ?? "Removed product"}</span>
                      {a.size && <span className="ml-1 text-xs text-espresso/70">· {a.size}</span>}
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-espresso/80">
                      {a.email && <div>{a.email}</div>}
                      {a.phone && <div>+91 {a.phone}</div>}
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-espresso/70">
                      {fmt.format(new Date(a.createdAt))}
                      {a.notifiedAt && <div className="text-green-800">Contacted {fmt.format(new Date(a.notifiedAt))}</div>}
                    </td>
                    <td className="py-2.5">
                      <div className="flex justify-end gap-1.5">
                        {a.phone && !a.notifiedAt && (
                          <a href={waLink(a, origin)} target="_blank" rel="noreferrer" className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-green-700 px-2.5 text-xs font-semibold text-white">
                            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                          </a>
                        )}
                        {!a.notifiedAt && (
                          <button
                            disabled={busy !== null}
                            onClick={() => void act(`m-${a.id}`, { action: "mark", ids: [a.id] }, () => "Marked as contacted.")}
                            className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-burgundy/20 px-2.5 text-xs font-semibold text-espresso"
                          >
                            <Check className="h-3.5 w-3.5" /> Done
                          </button>
                        )}
                        <button
                          disabled={busy !== null}
                          onClick={() => window.confirm("Delete this sign-up?") && void act(`d-${a.id}`, { action: "delete", ids: [a.id] }, () => "Deleted.")}
                          aria-label="Delete sign-up"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-espresso/60 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
