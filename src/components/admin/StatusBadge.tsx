"use client";

import React from "react";

export type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "gold";

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({
  label,
  variant = "neutral",
  size = "sm",
  className = "",
}: StatusBadgeProps) {
  // Determine variant automatically from label if variant is default
  let resolvedVariant = variant;
  const lower = label.toLowerCase();

  if (variant === "neutral") {
    if (
      lower.includes("delivered") ||
      lower.includes("captured") ||
      lower.includes("in stock") ||
      lower.includes("active") ||
      lower.includes("provisioned") ||
      lower.includes("confirmed")
    ) {
      resolvedVariant = "success";
    } else if (
      lower.includes("pending") ||
      lower.includes("processing") ||
      lower.includes("packed") ||
      lower.includes("in transit") ||
      lower.includes("low stock") ||
      lower.includes("awaiting")
    ) {
      resolvedVariant = "warning";
    } else if (
      lower.includes("cancelled") ||
      lower.includes("refunded") ||
      lower.includes("failed") ||
      lower.includes("out of stock") ||
      lower.includes("inactive") ||
      lower.includes("critical")
    ) {
      resolvedVariant = "danger";
    } else if (
      lower.includes("shipped") ||
      lower.includes("info") ||
      lower.includes("analyst")
    ) {
      resolvedVariant = "info";
    } else if (
      lower.includes("owner") ||
      lower.includes("admin") ||
      lower.includes("featured")
    ) {
      resolvedVariant = "gold";
    }
  }

  const variantStyles: Record<BadgeVariant, string> = {
    success: "bg-emerald-950/60 text-emerald-300 border-emerald-800/60",
    warning: "bg-amber-950/60 text-amber-300 border-amber-800/60",
    danger: "bg-rose-950/60 text-rose-300 border-rose-800/60",
    info: "bg-sky-950/60 text-sky-300 border-sky-800/60",
    gold: "bg-burgundy text-gold border-gold/40",
    neutral: "bg-espresso/80 text-ivory/80 border-espresso/40",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px] tracking-wider uppercase font-semibold",
    md: "px-2.5 py-1 text-xs tracking-wide uppercase font-bold",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${variantStyles[resolvedVariant]} ${sizeStyles[size]} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          resolvedVariant === "success"
            ? "bg-emerald-400"
            : resolvedVariant === "warning"
            ? "bg-amber-400 animate-pulse"
            : resolvedVariant === "danger"
            ? "bg-rose-400"
            : resolvedVariant === "info"
            ? "bg-sky-400"
            : resolvedVariant === "gold"
            ? "bg-gold"
            : "bg-ivory/40"
        }`}
      />
      {label}
    </span>
  );
}
