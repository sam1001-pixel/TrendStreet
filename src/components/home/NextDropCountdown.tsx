"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { AlertSignup } from "@/components/AlertSignup";

const LIVE_FOR_MS = 48 * 3600 * 1000; // after the drop time, show "live now" for 2 days, then hide

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

/**
 * Countdown to the next drop (date and name set in Admin → Settings → Next drop), with "Remind me".
 * Hidden when no date is set. For two days after the date it turns into a "Live now" link.
 */
export function NextDropCountdown() {
  const { siteSettings } = useStore();
  const at = siteSettings.nextDrop?.at ? new Date(siteSettings.nextDrop.at).getTime() : NaN;
  const title = siteSettings.nextDrop?.title?.trim() || "The next drop";
  // Rendered only in the browser, so the server and phone clocks can't disagree.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (Number.isNaN(at)) return;
    setNow(Date.now());
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [at]);

  if (Number.isNaN(at) || now === null) return null;
  const left = at - now;
  if (left < -LIVE_FOR_MS) return null;

  if (left <= 0) {
    return (
      <section className="mx-auto max-w-[1600px] px-3 sm:px-6 lg:px-8">
        <Link href="/shop?sort=newest" className="flex items-center justify-between gap-3 rounded-3xl bg-crimson p-5 text-white sm:p-8">
          <span>
            <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              Live now
            </span>
            <span className="mt-1 block font-display text-4xl font-black uppercase leading-none sm:text-6xl">{title}</span>
          </span>
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white text-crimson">
            <ArrowRight className="h-5 w-5" />
          </span>
        </Link>
      </section>
    );
  }

  const { d, h, m, s } = parts(left);
  const units: [number, string][] = [
    [d, "days"],
    [h, "hrs"],
    [m, "min"],
    [s, "sec"],
  ];
  const when = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(at);

  return (
    <section className="mx-auto max-w-[1600px] px-3 sm:px-6 lg:px-8" aria-labelledby="next-drop-heading">
      <div className="overflow-hidden rounded-3xl bg-espresso p-5 text-ivory sm:grid sm:grid-cols-2 sm:items-center sm:gap-10 sm:p-10">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold-light">Next drop · {when}</p>
          <h2 id="next-drop-heading" className="mt-1 font-display text-4xl font-black uppercase leading-[0.9] sm:text-6xl">
            {title}
          </h2>
          <div className="mt-4 grid grid-cols-4 gap-2 sm:max-w-sm" role="timer" aria-label={`${d} days ${h} hours ${m} minutes left`}>
            {units.map(([n, label]) => (
              <div key={label} className="rounded-2xl bg-white/10 py-2.5 text-center">
                <span className="block font-display text-3xl font-black tabular-nums leading-none sm:text-4xl">{String(n).padStart(2, "0")}</span>
                <span className="mt-1 block text-[11px] uppercase tracking-wider text-ivory/70">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-5 space-y-2 sm:mt-0">
          <p className="text-sm text-ivory/80">Limited pieces, best sizes go first. Get a reminder the moment it drops.</p>
          <AlertSignup kind="DROP" tone="dark" cta="Remind me" doneText="You're on the list — we'll remind you when it drops." />
        </div>
      </div>
    </section>
  );
}
