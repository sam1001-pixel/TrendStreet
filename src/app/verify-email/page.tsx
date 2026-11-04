"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthAlert, AuthCard, authButtonClass } from "@/components/AuthCard";

function VerifyEmailInner() {
  const token = useSearchParams().get("token");
  const [state, setState] = useState<{ kind: "working" | "ok" | "error"; message: string }>({ kind: "working", message: "Confirming your email…" });
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (!token) {
      setState({ kind: "error", message: "This link is missing its code. Please open the link from your email again." });
      return;
    }
    window.history.replaceState(null, "", "/verify-email");
    fetch("/api/auth/customer/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (r) => ({ ok: r.ok, d: await r.json().catch(() => ({})) }))
      .then(({ ok, d }) => {
        if (ok) {
          setState({ kind: "ok", message: d.message || "Email confirmed." });
          setTimeout(() => (window.location.href = "/profile"), 1200);
        } else {
          setState({ kind: "error", message: d.message || "We couldn't confirm your email." });
        }
      })
      .catch(() => setState({ kind: "error", message: "Network error. Please open the link again." }));
  }, [token]);

  return (
    <AuthCard title="Confirm your email">
      {state.kind === "working" ? (
        <p className="text-center text-xs text-espresso/70">{state.message}</p>
      ) : (
        <AuthAlert kind={state.kind === "ok" ? "success" : "error"}>{state.message}</AuthAlert>
      )}
      {state.kind === "error" && (
        <Link href="/login" className={authButtonClass}>
          Go to sign in
        </Link>
      )}
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  );
}
