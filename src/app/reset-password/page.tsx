"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthAlert, AuthCard, authButtonClass, authInputClass, authLabelClass } from "@/components/AuthCard";

function ResetPasswordInner() {
  const token = useSearchParams().get("token");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    // Keep the token out of the address bar (and browser history) once it's been read.
    window.history.replaceState(null, "", "/reset-password");
    fetch(`/api/auth/customer/password-reset/confirm?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => setTokenValid(Boolean(d.valid)))
      .catch(() => setTokenValid(false));
  }, [token]);

  const requestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/customer/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) setDone(d.message);
      else setError(d.message || "Something went wrong. Please try again.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const setNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/customer/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) setDone(d.message);
      else setError(d.message || "Something went wrong. Please try again.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <AuthCard title="Reset password">
        <AuthAlert kind="success">{done}</AuthAlert>
        {token && (
          <Link href="/login" className={authButtonClass}>
            Sign in
          </Link>
        )}
      </AuthCard>
    );
  }

  if (token) {
    return (
      <AuthCard title="Choose a new password" subtitle="At least 8 characters. Every device will be signed out.">
        {tokenValid === false && (
          <>
            <AuthAlert kind="error">This reset link has expired or was already used.</AuthAlert>
            <Link href="/reset-password" className={authButtonClass}>
              Get a new link
            </Link>
          </>
        )}
        {tokenValid !== false && (
          <form onSubmit={setNewPassword} className="space-y-4">
            {error && <AuthAlert kind="error">{error}</AuthAlert>}
            <div>
              <label htmlFor="new-password" className={authLabelClass}>New password</label>
              <input id="new-password" type="password" required minLength={8} maxLength={200} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={authInputClass} />
            </div>
            <div>
              <label htmlFor="confirm-password" className={authLabelClass}>Type it again</label>
              <input id="confirm-password" type="password" required minLength={8} maxLength={200} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={authInputClass} />
            </div>
            <button type="submit" disabled={busy || tokenValid === null} className={authButtonClass}>
              {busy ? "Saving…" : "Save new password"}
            </button>
          </form>
        )}
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Forgot your password?" subtitle="We'll email you a link to choose a new one.">
      <form onSubmit={requestLink} className="space-y-4">
        {error && <AuthAlert kind="error">{error}</AuthAlert>}
        <div>
          <label htmlFor="reset-email" className={authLabelClass}>Email address</label>
          <input id="reset-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@domain.com" className={authInputClass} />
        </div>
        <button type="submit" disabled={busy} className={authButtonClass}>
          {busy ? "Sending…" : "Email me a reset link"}
        </button>
      </form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}
