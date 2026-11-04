"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Logo } from "@/components/Logo";

/** Shared shell for the small account pages (reset password, confirm email) — same look as /login. */
export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-ivory flex flex-col items-center px-4 pt-8 pb-12 sm:justify-center sm:py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex justify-center">
            <Logo variant="burgundy" size="lg" showTagline={true} href="/" />
          </div>
          <div className="pt-2">
            <h1 className="text-xs uppercase tracking-[0.2em] font-bold text-burgundy">{title}</h1>
            {subtitle && <p className="text-xs text-espresso/70 mt-1">{subtitle}</p>}
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-burgundy/15 shadow-xl space-y-5">{children}</div>
        <div className="text-center">
          <Link href="/login" className="text-xs text-espresso/60 hover:text-burgundy transition-colors inline-flex min-h-[44px] items-center gap-1 px-3 font-medium">
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export function AuthAlert({ kind, children }: { kind: "error" | "success"; children: React.ReactNode }) {
  return kind === "error" ? (
    <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
      <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
      <span>{children}</span>
    </div>
  ) : (
    <div role="status" className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 flex items-center gap-2">
      <CheckCircle className="w-4 h-4 flex-shrink-0 text-green-600" />
      <span>{children}</span>
    </div>
  );
}

export const authInputClass =
  "w-full bg-ivory/50 px-3.5 py-3 rounded-xl border border-burgundy/20 text-sm font-medium text-espresso focus:outline-none focus:border-burgundy focus:bg-white";
export const authLabelClass = "block text-[11px] font-bold uppercase tracking-wider text-espresso/80 mb-1";
export const authButtonClass =
  "w-full min-h-[48px] py-3.5 bg-burgundy hover:bg-crimson text-ivory text-xs font-bold uppercase tracking-[0.2em] rounded-xl transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-60";
