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

    const res = await login(adminId, password);
    if (res.success) {
      window.location.href = "/admin";
    } else {
      setError(res.message);
      setLoading(false);
    }
  };

  const handleQuickAdminLogin = async (id = "admin@trendstreet.in", pass = "TrendStreetAdmin2026!") => {
    setAdminId(id);
    setPassword(pass);
    setError(null);
    setLoading(true);

    const res = await login(id, pass);
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
              Restricted executive access for Trend Street operations & access register
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
                  placeholder="admin@trendstreet.in or admin"
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

            <div className="flex items-center justify-between text-xs text-espresso/70 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-3.5 h-3.5 text-burgundy rounded border-burgundy/30"
                />
                <span>Remember Session</span>
              </label>
            </div>

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

          {/* Development Fast Track Demo Admin Sign-In (Stripped in Production) */}
          {process.env.NODE_ENV !== "production" && (
            <div className="pt-4 border-t border-burgundy/15 space-y-2">
              <button
                type="button"
                onClick={() => handleQuickAdminLogin("admin@trendstreet.in", "TrendStreetAdmin2026!")}
                disabled={loading}
                className="w-full py-2.5 px-3 rounded-xl bg-gold/15 hover:bg-gold/25 border border-gold/40 text-espresso text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-60"
              >
                <Shield className="w-3.5 h-3.5 text-burgundy" />
                <span>Instant 1-Click Administrator Sign-In</span>
              </button>

              <div className="p-2.5 bg-white/70 rounded-xl border border-burgundy/10 text-[11px] text-espresso/70 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-burgundy">Local Admin:</span>
                  <code className="bg-ivory px-1.5 py-0.5 rounded font-mono text-[10px]">admin@trendstreet.in</code>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-burgundy">Password:</span>
                  <code className="bg-ivory px-1.5 py-0.5 rounded font-mono text-[10px]">TrendStreetAdmin2026!</code>
                </div>
                <p className="text-[10px] text-espresso/50 italic pt-1">
                  Development environment helper (hidden in production builds).
                </p>
              </div>
            </div>
          )}
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
