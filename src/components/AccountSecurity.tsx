"use client";

import React, { useState } from "react";
import Link from "next/link";
import { KeyRound, LogOut } from "lucide-react";

const input =
  "h-12 w-full rounded-xl border border-burgundy/20 bg-white px-3 text-sm text-espresso placeholder:text-espresso/60 focus:border-burgundy focus:outline-none";
const label = "mb-1 block text-[11px] font-bold uppercase tracking-wider text-espresso/60";

/** Profile → Details: change password and sign out of every device. Shown only when signed in. */
export function AccountSecurity({ onSignedOutEverywhere }: { onSignedOutEverywhere: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState<"pw" | "all" | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("pw");
    setMsg(null);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setCurrent("");
        setNext("");
        setMsg({ kind: "ok", text: d.message });
      } else setMsg({ kind: "err", text: d.error || "Couldn't change your password." });
    } catch {
      setMsg({ kind: "err", text: "Network error. Please try again." });
    } finally {
      setBusy(null);
    }
  };

  const signOutEverywhere = async () => {
    setBusy("all");
    setMsg(null);
    try {
      const res = await fetch("/api/auth/customer/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ everywhere: true }),
      });
      if (res.ok) onSignedOutEverywhere();
      else setMsg({ kind: "err", text: "Couldn't sign out other devices. Please try again." });
    } catch {
      setMsg({ kind: "err", text: "Network error. Please try again." });
    } finally {
      setBusy(null);
    }
  };

  return (
    <section aria-labelledby="security-h" className="mt-4 rounded-2xl border border-burgundy/15 bg-white p-5 sm:p-6">
      <h2 id="security-h" className="flex items-center gap-2 font-serif text-base font-bold text-espresso">
        <KeyRound className="h-4 w-4 text-burgundy" /> Password & sign-in
      </h2>
      {msg && (
        <p role={msg.kind === "err" ? "alert" : "status"} className={`mt-3 rounded-xl p-3 text-xs ${msg.kind === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
          {msg.text}
        </p>
      )}
      <form onSubmit={changePassword} className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="sec-current" className={label}>Current password</label>
          <input id="sec-current" type="password" required autoComplete="current-password" maxLength={200} value={current} onChange={(e) => setCurrent(e.target.value)} className={input} />
        </div>
        <div>
          <label htmlFor="sec-new" className={label}>New password</label>
          <input id="sec-new" type="password" required minLength={8} maxLength={200} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={input} />
        </div>
        <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
          <button disabled={busy !== null} className="min-h-[48px] rounded-lg bg-burgundy px-6 py-3 text-xs font-bold uppercase tracking-wider text-ivory hover:bg-crimson disabled:opacity-60">
            {busy === "pw" ? "Saving…" : "Change password"}
          </button>
          <Link href="/reset-password" className="py-2 text-xs font-semibold text-burgundy underline">
            Forgot your current password?
          </Link>
        </div>
      </form>
      <div className="mt-5 border-t border-burgundy/10 pt-4">
        <p className="text-xs text-espresso/70">Lost a phone, or signed in on a shared computer? Sign out everywhere, including here.</p>
        <button
          type="button"
          onClick={signOutEverywhere}
          disabled={busy !== null}
          className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-lg px-4 text-xs font-bold uppercase tracking-wider text-espresso ring-1 ring-burgundy/20 hover:ring-burgundy/50 disabled:opacity-60"
        >
          <LogOut className="h-4 w-4 text-crimson" /> {busy === "all" ? "Signing out…" : "Sign out of all devices"}
        </button>
      </div>
    </section>
  );
}
