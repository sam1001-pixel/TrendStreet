"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Loader2 } from "lucide-react";

const CONTACT_KEY = "ts_alert_contact";

/**
 * One field — email or WhatsApp number — for "Notify me" (restock) and "Remind me" (next drop).
 * One field instead of two keeps it a single thumb-tap on phones; the contact is remembered for next time.
 */
export function AlertSignup({
  kind,
  productId,
  size,
  tone = "light",
  cta = "Notify me",
  doneText = "Done — we'll tell you the moment it's back.",
}: {
  kind: "RESTOCK" | "DROP";
  productId?: string;
  size?: string;
  tone?: "light" | "dark";
  cta?: string;
  doneText?: string;
}) {
  const [contact, setContact] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setContact(localStorage.getItem(CONTACT_KEY) || "");
    } catch {
      /* storage blocked */
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = contact.trim();
    const isEmail = value.includes("@");
    if (!value) return setError("Enter your email or WhatsApp number.");
    setState("busy");
    setError(null);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, productId, size, ...(isEmail ? { email: value } : { phone: value }) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Couldn't save that. Please try again.");
      try {
        localStorage.setItem(CONTACT_KEY, value);
      } catch {
        /* ignore */
      }
      setState("done");
    } catch (err) {
      setError((err as Error).message);
      setState("idle");
    }
  };

  const dark = tone === "dark";

  if (state === "done") {
    return (
      <p role="status" className={`flex min-h-[48px] items-center gap-2 rounded-xl px-4 text-sm font-semibold ${dark ? "bg-white/10 text-ivory" : "bg-green-50 text-green-800 ring-1 ring-green-700/20"}`}>
        <Check className="h-4 w-4 flex-shrink-0" /> {doneText}
      </p>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-1.5">
      <div className="flex gap-2">
        <label htmlFor={`alert-${kind}-${productId ?? "drop"}`} className="sr-only">
          Email or WhatsApp number
        </label>
        <input
          id={`alert-${kind}-${productId ?? "drop"}`}
          type="text"
          autoComplete="email"
          enterKeyHint="send"
          placeholder="Email or WhatsApp number"
          value={contact}
          onChange={(e) => {
            setContact(e.target.value);
            if (error) setError(null);
          }}
          aria-invalid={!!error}
          className={`h-12 min-w-0 flex-1 rounded-xl border px-3.5 text-sm focus:outline-none ${
            dark
              ? "border-white/20 bg-white/10 text-ivory placeholder:text-ivory/60 focus:border-gold-light"
              : "border-burgundy/20 bg-white text-espresso placeholder:text-espresso/60 focus:border-burgundy"
          }`}
        />
        <button
          type="submit"
          disabled={state === "busy"}
          className={`flex h-12 flex-shrink-0 items-center gap-1.5 rounded-xl px-4 text-xs font-bold uppercase tracking-wider disabled:opacity-60 ${
            dark ? "bg-white text-espresso" : "bg-espresso text-ivory"
          }`}
        >
          {state === "busy" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
          {cta}
        </button>
      </div>
      {error && (
        <p role="alert" className={`text-xs font-semibold ${dark ? "text-gold-light" : "text-crimson"}`}>
          {error}
        </p>
      )}
    </form>
  );
}
