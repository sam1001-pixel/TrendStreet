"use client";

import { usePathname } from "next/navigation";

/** Storefront header/footer/drawers stay out of the admin panel, which has its own navigation. */
export function HideOnAdmin({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return null;
  return <>{children}</>;
}
