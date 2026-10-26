"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAdminAuth();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // If on /admin/login, bypass layout wrapper
  const isLoginPage = pathname === "/admin/login";

  // Hydrate collapsed state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ts_admin_sidebar_collapsed");
      if (saved !== null) {
        setCollapsed(saved === "true");
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("ts_admin_sidebar_collapsed", String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  useEffect(() => {
    if (!isLoginPage && !isLoading && !isAuthenticated) {
      router.push("/admin/login");
    }
  }, [isAuthenticated, isLoading, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  // Display luxury preloader while verifying credentials to prevent flickering
  if (isLoading) {
    return (
      <div className="min-h-screen bg-espresso flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-[0.25em] text-gold font-bold">
            Verifying Atelier Privileges...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-espresso flex items-center justify-center p-4">
        <div className="bg-ivory p-8 rounded-2xl text-center space-y-4 max-w-sm">
          <Shield className="w-10 h-10 text-burgundy mx-auto" />
          <h2 className="font-serif text-xl font-bold text-espresso">
            Admin Authentication Required
          </h2>
          <p className="text-xs text-espresso/70">
            Please log in with your administrative credentials to access this portal.
          </p>
          <Link
            href="/admin/login"
            className="block w-full py-2.5 bg-burgundy text-gold text-xs font-bold uppercase rounded-lg"
          >
            Go to Admin Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory flex flex-row font-sans text-espresso antialiased">
      {/* 12-route Collapsible Sidebar */}
      <AdminSidebar
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main Working Canvas & Header */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Dynamic Top Header with Breadcrumbs & ⌘K */}
        <AdminHeader onMobileMenuOpen={() => setMobileNavOpen(true)} />

        {/* Scrollable Working Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
