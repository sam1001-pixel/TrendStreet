"use client";

import React from "react";
import Link from "next/link";
import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  badge?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  href,
  onClick,
  badge,
}: StatCardProps) {
  const content = (
    <div className="relative p-5 rounded-2xl bg-white/70 border border-espresso/10 hover:border-gold/50 shadow-sm hover:shadow-md transition-all group overflow-hidden">
      {/* Background Accent Gradient */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-gold/10 via-burgundy/5 to-transparent rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-espresso/60 uppercase tracking-wider">
              {title}
            </span>
            {badge && (
              <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider bg-burgundy/10 text-burgundy rounded border border-burgundy/20">
                {badge}
              </span>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-espresso tracking-tight">
            {value}
          </div>
        </div>

        <div className="w-10 h-10 rounded-xl bg-espresso/5 border border-espresso/10 flex items-center justify-center text-burgundy group-hover:bg-burgundy group-hover:text-gold transition-colors">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-espresso/5">
        {trend && (
          <div
            className={`inline-flex items-center gap-1 font-semibold ${
              trend.isPositive ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {trend.isPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5" />
            )}
            <span>{trend.value}</span>
          </div>
        )}

        {subtitle && (
          <span className="text-espresso/60 text-[11px] truncate">{subtitle}</span>
        )}

        {href && (
          <span className="text-gold font-bold text-[10px] uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 ml-auto">
            View <ArrowUpRight className="w-3 h-3" />
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus:outline-none focus:ring-2 focus:ring-gold rounded-2xl">
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        onClick={onClick}
        type="button"
        className="w-full text-left focus:outline-none focus:ring-2 focus:ring-gold rounded-2xl"
      >
        {content}
      </button>
    );
  }

  return content;
}
