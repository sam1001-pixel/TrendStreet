"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  User,
  Lock,
  Mail,
  Phone,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { useUserAuth } from "@/context/UserAuthContext";
import { safeRedirectPath } from "@/lib/safe-redirect";

function LoginForm() {
  const searchParams = useSearchParams();
  // Only ever redirect to a page on this site (blocks javascript: links and phishing redirects).
  const callbackUrl = safeRedirectPath(searchParams.get("callbackUrl"), "/profile");

  const { login, register, isAuthenticated, isLoading } = useUserAuth();

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      window.location.href = callbackUrl;
    }
  }, [isAuthenticated, isLoading, callbackUrl]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      setSuccessMsg("Signed in successfully. Redirecting to your atelier dashboard...");
      setTimeout(() => {
        window.location.href = callbackUrl;
      }, 500);
    } else {
      setError(res.message);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    const res = await register({
      name,
      email,
      phone,
      password,
    });
    setLoading(false);

    if (res.success && res.pendingConfirmation) {
      setSuccessMsg(res.message);
      setPassword("");
    } else if (res.success) {
      setSuccessMsg("Account created — welcome to OFFVYBE!");
      setTimeout(() => {
        window.location.href = callbackUrl;
      }, 500);
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex justify-center">
          <Logo variant="burgundy" size="lg" showTagline={true} href="/" />
        </div>
        <div className="pt-2">
          <h1 className="text-xs uppercase tracking-[0.2em] font-bold text-burgundy flex items-center justify-center gap-1.5">
            <User className="w-3.5 h-3.5 text-gold" /> Your account
          </h1>
          <p className="text-xs text-espresso/70 mt-1">
            Track orders, save your sizes and wishlist, check out faster
          </p>
        </div>
      </div>

      {/* Auth Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-burgundy/15 shadow-xl space-y-6">
        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-ivory rounded-2xl border border-burgundy/10">
          <button
            type="button"
            onClick={() => {
              setActiveTab("login");
              setError(null);
            }}
            className={`min-h-[44px] py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
              activeTab === "login"
                ? "bg-espresso text-ivory shadow-sm"
                : "text-espresso/60 hover:text-espresso"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("register");
              setError(null);
            }}
            className={`min-h-[44px] py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
              activeTab === "register"
                ? "bg-espresso text-ivory shadow-sm"
                : "text-espresso/60 hover:text-espresso"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0 text-green-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Sign In Form */}
        {activeTab === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-espresso/80 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-espresso/60" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full bg-ivory/50 pl-10 pr-3 py-3 rounded-xl border border-burgundy/20 text-xs font-medium text-espresso focus:outline-none focus:border-burgundy focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-espresso/80 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-espresso/60" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full bg-ivory/50 pl-10 pr-11 py-3 rounded-xl border border-burgundy/20 text-xs font-medium text-espresso focus:outline-none focus:border-burgundy focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-xl text-espresso/60 hover:text-burgundy transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="mt-1.5 text-right">
                <a href="/reset-password" className="inline-block py-2 text-[11px] font-semibold text-burgundy underline-offset-2 hover:underline">
                  Forgot password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-burgundy hover:bg-crimson text-ivory text-xs font-bold uppercase tracking-[0.2em] rounded-xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-60"
            >
              {loading ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="w-4 h-4 text-gold" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Register Form */}
        {activeTab === "register" && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-espresso/80 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-espresso/60" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className="w-full bg-ivory/50 pl-10 pr-3 py-3 rounded-xl border border-burgundy/20 text-xs font-medium text-espresso focus:outline-none focus:border-burgundy focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-espresso/80 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-espresso/60" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full bg-ivory/50 pl-10 pr-3 py-3 rounded-xl border border-burgundy/20 text-xs font-medium text-espresso focus:outline-none focus:border-burgundy focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-espresso/80 mb-1">
                Mobile Number (For Express Delivery)
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-espresso/60" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  className="w-full bg-ivory/50 pl-10 pr-3 py-3 rounded-xl border border-burgundy/20 text-xs font-medium text-espresso focus:outline-none focus:border-burgundy focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-espresso/80 mb-1">
                Create Password (Min. 8 characters)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-espresso/60" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full bg-ivory/50 pl-10 pr-11 py-3 rounded-xl border border-burgundy/20 text-xs font-medium text-espresso focus:outline-none focus:border-burgundy focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-xl text-espresso/60 hover:text-burgundy transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-burgundy hover:bg-crimson text-ivory text-xs font-bold uppercase tracking-[0.2em] rounded-xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-60"
            >
              {loading ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>Create account</span>
                  <ArrowRight className="w-4 h-4 text-gold" />
                </>
              )}
            </button>
          </form>
        )}

      </div>

      {/* Return to Public Storefront */}
      <div className="text-center">
        <Link
          href="/"
          className="text-xs text-espresso/60 hover:text-burgundy transition-colors inline-flex min-h-[44px] items-center gap-1 px-3 font-medium"
        >
          ← Back to shop
        </Link>
      </div>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <div className="min-h-[100dvh] bg-ivory flex flex-col items-center px-4 pt-8 pb-12 sm:justify-center sm:py-12">
      <Suspense
        fallback={
          <div className="w-full max-w-md p-8 rounded-3xl bg-white border border-burgundy/10 text-center text-xs text-espresso/60">
            Loading…
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
