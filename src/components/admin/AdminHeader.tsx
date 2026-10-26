"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Bell,
  Menu,
  ChevronRight,
  Shield,
  X,
  Package,
  Boxes,
  AlertTriangle,
  Shirt,
  Users,
} from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { ADMIN_NAV_ITEMS } from "./AdminSidebar";

interface AdminHeaderProps {
  onMobileMenuOpen: () => void;
}

export function AdminHeader({ onMobileMenuOpen }: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { adminName, adminEmail } = useAdminAuth();

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Generate dynamic breadcrumb segments
  const pathParts = pathname.split("/").filter(Boolean);
  const breadcrumbs = pathParts.map((part, index) => {
    const url = "/" + pathParts.slice(0, index + 1).join("/");
    const navMatch = ADMIN_NAV_ITEMS.find((n) => n.href === url);
    const label = navMatch ? navMatch.label : part.charAt(0).toUpperCase() + part.slice(1);
    return { label, url, isLast: index === pathParts.length - 1 };
  });

  // Global ⌘K keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setSearchModalOpen(false);
        setNotificationsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredNav = ADMIN_NAV_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const notifications = [
    {
      id: "1",
      title: "Low Stock Alert",
      desc: "Boxy Heavyweight Tee (M) has 2 units remaining",
      icon: Boxes,
      time: "10m ago",
      href: "/admin/inventory?filter=low",
      type: "warning",
    },
    {
      id: "2",
      title: "New Order Confirmed",
      desc: "Order TS-2026-0914 awaiting packing & AWB generation",
      icon: Package,
      time: "24m ago",
      href: "/admin/orders",
      type: "info",
    },
    {
      id: "3",
      title: "Storefront Live Sync",
      desc: "Announcement bar updated in Postgres site settings",
      icon: Shield,
      time: "1h ago",
      href: "/admin/settings",
      type: "success",
    },
  ];

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-espresso/10 sticky top-0 z-30 px-4 sm:px-8 py-3 flex items-center justify-between min-h-[64px]">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onMobileMenuOpen}
          className="md:hidden p-2 rounded-xl text-espresso hover:bg-espresso/5 transition-colors"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center space-x-1.5 text-xs text-espresso/60">
          <Link href="/admin" className="hover:text-espresso font-semibold transition-colors">
            Admin
          </Link>
          {breadcrumbs.slice(1).map((b) => (
            <React.Fragment key={b.url}>
              <ChevronRight className="w-3.5 h-3.5 text-espresso/40" />
              {b.isLast ? (
                <span className="font-bold text-burgundy">{b.label}</span>
              ) : (
                <Link href={b.url} className="hover:text-espresso font-semibold transition-colors">
                  {b.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right: Search, Notifications, Profile Pill */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Search Trigger Button */}
        <button
          onClick={() => setSearchModalOpen(true)}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-espresso/5 hover:bg-espresso/10 border border-espresso/10 text-xs text-espresso/70 transition-all"
        >
          <Search className="w-3.5 h-3.5 text-burgundy" />
          <span className="hidden sm:inline">Search controls...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white rounded border border-espresso/20 text-espresso/60 shadow-xs">
            ⌘K
          </kbd>
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-xl text-espresso/70 hover:text-espresso hover:bg-espresso/5 relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-burgundy border-2 border-white" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-espresso/15 p-4 z-50 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-espresso/10">
                <span className="font-serif font-bold text-sm text-espresso">
                  Atelier Notifications
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gold px-2 py-0.5 bg-espresso rounded">
                  3 New
                </span>
              </div>

              <div className="divide-y divide-espresso/5 mt-2 max-h-72 overflow-y-auto">
                {notifications.map((n) => {
                  const Icon = n.icon;
                  return (
                    <Link
                      key={n.id}
                      href={n.href}
                      onClick={() => setNotificationsOpen(false)}
                      className="p-2.5 flex items-start space-x-3 hover:bg-espresso/5 rounded-xl transition-colors block text-xs"
                    >
                      <div className="p-2 rounded-lg bg-burgundy/10 text-burgundy shrink-0 mt-0.5">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-espresso truncate">{n.title}</p>
                          <span className="text-[10px] text-espresso/50 font-mono">{n.time}</span>
                        </div>
                        <p className="text-espresso/70 text-[11px] mt-0.5">{n.desc}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile Pill */}
        <div className="flex items-center space-x-2 pl-2 border-l border-espresso/10">
          <div className="w-8 h-8 rounded-full bg-burgundy text-gold font-bold flex items-center justify-center text-xs border border-gold/30">
            {adminName ? adminName.charAt(0).toUpperCase() : "A"}
          </div>
          <div className="hidden lg:block text-left text-xs leading-tight">
            <span className="font-bold text-espresso block">{adminName || "Admin"}</span>
            <span className="text-[10px] font-mono text-gold bg-espresso px-1.5 py-0.2 rounded font-semibold inline-block">
              Owner/Admin
            </span>
          </div>
        </div>
      </div>

      {/* ⌘K Global Command Palette Modal */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-espresso/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-espresso/20 overflow-hidden flex flex-col">
            <div className="p-3 border-b border-espresso/10 flex items-center space-x-3">
              <Search className="w-5 h-5 text-burgundy" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Jump to route or search admin modules..."
                className="w-full text-sm font-semibold text-espresso focus:outline-none bg-transparent"
              />
              <button
                onClick={() => setSearchModalOpen(false)}
                className="p-1 rounded-lg text-espresso/50 hover:text-espresso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2 max-h-80 overflow-y-auto space-y-1">
              <p className="px-3 py-1.5 text-[10px] font-bold text-espresso/40 uppercase tracking-wider">
                Admin Navigation Routes
              </p>
              {filteredNav.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.href}
                    onClick={() => {
                      router.push(item.href);
                      setSearchModalOpen(false);
                      setSearchQuery("");
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-espresso/5 text-xs text-espresso font-semibold transition-colors text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-4 h-4 text-burgundy" />
                      <span>{item.label}</span>
                    </div>
                    <span className="text-[10px] font-mono text-espresso/40">
                      {item.href}
                    </span>
                  </button>
                );
              })}
              {filteredNav.length === 0 && (
                <div className="p-6 text-center text-xs text-espresso/60">
                  No modules match &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
