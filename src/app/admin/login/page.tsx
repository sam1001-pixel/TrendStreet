"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, Lock, Mail, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAdminAuth } from "@/context/AdminAuthContext";

export default function AdminLoginPage() {
  const { login, isAuthenticated, isLoading } = useAdminAuth();

  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  // Ask for the authenticator code only when two-step login is switched on.
  useEffect(() => {
    fetch("/api/auth/login")
      .then((r) => r.json())
      .then((d) => setTwoFactor(Boolean(d?.twoFactor)))
      .catch(() => {});
  }, []);

  // If already authenticated, redirect safely once session check finishes
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      window.location.href = "/admin";
    }
  }, [isAuthenticated, isLoading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(adminId, password, twoFactor ? code : undefined);
    if (res.success) {
      window.location.href = "/admin";
    } else {
      setError(res.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-espresso flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex justify-center">
            <Logo variant="ivory" size="lg" showTagline={true} href="/" />
          </div>
          <div className="pt-2">
            <span className="text-xs uppercase tracking-[0.25em] font-bold text-gold flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-gold" /> Atelier Administrator Portal
            </span>
            <p className="text-xs text-ivory/60 mt-1">
              Restricted executive access for OFFVYBE operations & access register
            </p>
          </div>
        </div>

        {/* Login Box */}
        <div className="bg-ivory rounded-3xl p-8 border border-burgundy/30 shadow-2xl space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-xs text-red-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Admin ID */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">
                Admin ID / Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-espresso/40" />
                <input
                  type="text"
                  required
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  placeholder="Admin email"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full bg-white pl-10 pr-3 py-2.5 rounded-xl border border-burgundy/20 text-xs font-medium text-espresso focus:outline-none focus:border-burgundy"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-espresso mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-espresso/40" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  autoComplete="current-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full bg-white pl-10 pr-11 py-2.5 rounded-xl border border-burgundy/20 text-xs font-medium text-espresso focus:outline-none focus:border-burgundy"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2 p-1 text-espresso/50 hover:text-burgundy transition-colors focus:outline-none rounded-lg hover:bg-espresso/5"
                  aria-label={showPassword ? "Hide password" : "Show password (seen password)"}
                  title={showPassword ? "Hide password" : "Show password (seen password)"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-burgundy" />
                  ) : (
                    <Eye className="w-4 h-4 text-espresso/60" />
                  )}
                </button>
              </div>
            </div>

            {twoFactor && (
              <div className="space-y-1.5">
                <label htmlFor="admin-code" className="text-xs font-bold uppercase tracking-wider text-espresso/70">
                  Authenticator code
                </label>
                {useRecovery ? (
                  <input
                    id="admin-code"
                    required
                    autoComplete="off"
                    autoCapitalize="characters"
                    maxLength={19}
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 19))}
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-burgundy/20 text-sm font-mono tracking-[0.15em] text-espresso focus:outline-none focus:border-burgundy"
                  />
                ) : (
                  <input
                    id="admin-code"
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="6-digit code"
                    className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-burgundy/20 text-sm font-mono tracking-[0.4em] text-espresso focus:outline-none focus:border-burgundy"
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setUseRecovery(!useRecovery);
                    setCode("");
                  }}
                  className="min-h-[40px] text-[11px] font-semibold text-burgundy underline"
                >
                  {useRecovery ? "Use the 6-digit code instead" : "Lost your phone? Use a recovery code"}
                </button>
              </div>
            )}

            <p className="pt-1 text-[11px] text-espresso/60">For your safety you&apos;re signed out after 8 hours.</p>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-burgundy hover:bg-crimson text-gold text-xs font-bold uppercase tracking-[0.2em] rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
            >
              {loading ? (
                <span>Authenticating Privileges...</span>
              ) : (
                <>
                  <Shield className="w-4 h-4 text-gold" />
                  <span>Authenticate Session</span>
                </>
              )}
            </button>
          </form>

        </div>

        {/* Back to store */}
        <div className="text-center">
          <Link
            href="/"
            className="text-xs text-ivory/60 hover:text-gold transition-colors inline-flex items-center gap-1"
          >
            ← Return to Public Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
