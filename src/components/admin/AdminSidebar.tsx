"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Shirt,
  Boxes,
  Users,
  Tag,
  Truck,
  BarChart3,
  Palette,
  Sliders,
  UserCheck,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LogOut,
  Shield,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAdminAuth } from "@/context/AdminAuthContext";

interface AdminSidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const ADMIN_NAV_ITEMS = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard, badge: null },
  { label: "Orders", href: "/admin/orders", icon: Package, badge: "Live" },
  { label: "Products", href: "/admin/products", icon: Shirt, badge: null },
  { label: "Inventory", href: "/admin/inventory", icon: Boxes, badge: "Stock" },
  { label: "Customers", href: "/admin/customers", icon: Users, badge: null },
  { label: "Discounts & Coupons", href: "/admin/discounts", icon: Tag, badge: null },
  { label: "Shipping & Returns", href: "/admin/shipping", icon: Truck, badge: "Track" },
  { label: "Analytics & Reports", href: "/admin/analytics", icon: BarChart3, badge: null },
  { label: "Storefront & Content", href: "/admin/content", icon: Palette, badge: null },
  { label: "Settings", href: "/admin/settings", icon: Sliders, badge: null },
  { label: "Staff & Permissions", href: "/admin/staff", icon: UserCheck, badge: null },
  { label: "Audit Log", href: "/admin/audit", icon: ShieldAlert, badge: null },
];

export function AdminSidebar({
  mobileOpen,
  onMobileClose,
  collapsed,
  onToggleCollapse,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { adminName, adminEmail, logout } = useAdminAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-espresso/80 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-espresso text-ivory flex flex-col justify-between border-r border-burgundy/40 transition-all duration-300 ease-in-out md:static ${
          collapsed ? "w-[76px]" : "w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Top Brand Identity */}
          <div className="p-4 border-b border-burgundy/40 flex items-center justify-between min-h-[64px]">
            {!collapsed ? (
              <div className="flex flex-col space-y-1">
                <Logo variant="ivory" size="sm" showTagline={false} href="/admin" />
                <div className="flex items-center space-x-1.5 text-[10px] font-bold text-gold uppercase tracking-wider">
                  <Shield className="w-3 h-3 text-gold" />
                  <span>Admin Control Center</span>
                </div>
              </div>
            ) : (
              <div className="mx-auto flex items-center justify-center w-8 h-8 rounded-lg bg-burgundy text-gold font-serif font-bold text-sm border border-gold/40">
                TS
              </div>
            )}

            {/* Desktop Collapse Toggle */}
            <button
              onClick={onToggleCollapse}
              className="hidden md:flex p-1.5 rounded-lg text-gold/80 hover:text-gold hover:bg-burgundy/40 transition-colors"
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation Items (12 Real Protected Routes) */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-none">
            {ADMIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onMobileClose}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    collapsed
                      ? "justify-center p-3"
                      : "justify-between px-3 py-2.5"
                  } ${
                    isActive
                      ? "bg-burgundy text-gold font-bold shadow-md border border-gold/30"
                      : "text-ivory/80 hover:bg-burgundy/40 hover:text-ivory"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!collapsed && item.badge && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-espresso/80 text-gold border border-gold/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Admin Profile & Actions */}
        <div className="p-3 border-t border-burgundy/40 space-y-2">
          {!collapsed ? (
            <div className="p-2.5 bg-burgundy/30 rounded-xl border border-burgundy/50 flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-burgundy text-gold font-bold flex items-center justify-center border border-gold/40 text-xs shrink-0">
                {adminName ? adminName.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="truncate">
                <span className="font-bold text-ivory block truncate text-xs">
                  {adminName || "Atelier Admin"}
                </span>
                <span className="text-[10px] text-gold font-mono truncate block">
                  {adminEmail || "admin@trendstreet.in"}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-burgundy text-gold font-bold flex items-center justify-center border border-gold/40 text-xs">
                {adminName ? adminName.charAt(0).toUpperCase() : "A"}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <Link
              href="/"
              target="_blank"
              title={collapsed ? "Open Public Storefront" : undefined}
              className={`flex items-center rounded-lg text-ivory/70 hover:text-gold hover:bg-burgundy/30 transition-colors text-xs ${
                collapsed ? "justify-center p-2.5" : "px-3 py-2 space-x-2"
              }`}
            >
              <ExternalLink className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Storefront</span>}
            </Link>

            <button
              onClick={() => logout()}
              type="button"
              title={collapsed ? "Log Out Administrator" : undefined}
              className={`w-full flex items-center rounded-lg text-red-400 hover:text-red-300 hover:bg-burgundy/30 transition-colors text-xs ${
                collapsed ? "justify-center p-2.5" : "px-3 py-2 space-x-2"
              }`}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Log Out</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
