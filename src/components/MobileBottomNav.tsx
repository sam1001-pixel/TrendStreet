"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Heart, ShoppingBag, User } from "lucide-react";
import { useStore } from "@/context/StoreContext";

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const { wishlist, cartItemsCount, setIsCartOpen } = useStore();

  // If inside admin portal, checkout, or product detail pages, do not render bottom nav
  // Product pages have their own sticky bottom CTA bar which would overlap
  if (pathname.startsWith("/admin") || pathname.startsWith("/checkout") || pathname.startsWith("/product/") || pathname.startsWith("/complete-the-fit") || pathname.startsWith("/login")) {
    return null;
  }

  const navItems = [
    {
      label: "Home",
      href: "/",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      label: "Shop",
      href: "/shop",
      icon: Compass,
      isActive:
        pathname === "/shop" ||
        pathname === "/shop-your-way" ||
        pathname === "/oversized" ||
        pathname === "/jeans" ||
        pathname === "/boxy-fit" ||
        pathname === "/jackets",
    },
    {
      label: "Saved",
      href: "/saved",
      icon: Heart,
      badge: wishlist.length,
      isActive: pathname === "/saved",
    },
    {
      label: "Bag",
      action: () => setIsCartOpen(true),
      icon: ShoppingBag,
      badge: cartItemsCount,
      isActive: false,
    },
    {
      label: "Account",
      href: "/profile",
      icon: User,
      isActive: pathname === "/profile" || pathname === "/track",
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-ivory/95 backdrop-blur-lg border-t border-burgundy/15 shadow-[0_-4px_20px_rgba(43,8,10,0.06)] px-2 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] select-none"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const content = (
            <div
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[46px] px-2 py-1 rounded-xl transition-all relative ${
                item.isActive
                  ? "text-burgundy font-bold"
                  : "text-espresso/60 hover:text-burgundy"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${item.isActive ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-crimson text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-in zoom-in-50 duration-200">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 font-medium">{item.label}</span>
              {item.isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-crimson absolute bottom-0.5" />
              )}
            </div>
          );

          if (item.action) {
            return (
              <button
                key={item.label}
                onClick={item.action}
                aria-label={`Open ${item.label}`}
                className="focus:outline-none focus:ring-1 focus:ring-burgundy/30 rounded-xl"
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href!}
              aria-label={item.label}
              className="focus:outline-none focus:ring-1 focus:ring-burgundy/30 rounded-xl"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
