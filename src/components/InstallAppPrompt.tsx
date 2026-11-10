"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { X, Share, PlusSquare } from "lucide-react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const VISITS_KEY = "ts_visits";
const DISMISSED_KEY = "ts_install_dismissed_at";
const SNOOZE_DAYS = 21;

const read = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* storage blocked */
  }
};

/**
 * Registers the service worker and, for returning phone visitors, offers
 * "Add Trend Street to your home screen". Android/Chrome gets the real install button;
 * iPhone Safari (which has no install button) gets the two-step Share → Add to Home Screen hint.
 * Shown from the 2nd visit, never on product/checkout pages, and snoozed for 3 weeks when closed.
 */
export function InstallAppPrompt() {
  const pathname = usePathname();
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);
  const [mode, setMode] = useState<"android" | "ios" | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    const phone = window.matchMedia("(max-width: 767px)").matches;
    if (standalone || !phone) return;

    // Count visits (one per browser session).
    let visits = Number(read(VISITS_KEY) || "0");
    try {
      if (!sessionStorage.getItem("ts_visit_counted")) {
        sessionStorage.setItem("ts_visit_counted", "1");
        visits += 1;
        write(VISITS_KEY, String(visits));
      }
    } catch {
      /* ignore */
    }
    const dismissedAt = Number(read(DISMISSED_KEY) || "0");
    const snoozed = Date.now() - dismissedAt < SNOOZE_DAYS * 864e5;
    if (visits < 2 || snoozed) return;

    const ua = navigator.userAgent;
    const iosSafari = /iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|Instagram|FBAN|FBAV/.test(ua);
    if (iosSafari) {
      const t = window.setTimeout(() => setMode("ios"), 6000);
      return () => window.clearTimeout(t);
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallEvent);
      window.setTimeout(() => setMode("android"), 6000);
    };
    const onInstalled = () => setMode(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const hiddenHere = ["/product/", "/checkout", "/admin", "/login", "/bag"].some((p) => pathname.startsWith(p));
  if (!mode || hiddenHere) return null;

  const close = () => {
    write(DISMISSED_KEY, String(Date.now()));
    setMode(null);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome !== "accepted") write(DISMISSED_KEY, String(Date.now()));
    setDeferred(null);
    setMode(null);
  };

  return (
    <div
      role="dialog"
      aria-label="Add Trend Street to your home screen"
      className="fixed inset-x-3 bottom-[calc(64px+env(safe-area-inset-bottom))] z-[45] animate-in fade-in slide-in-from-bottom-4 duration-300 md:hidden"
    >
      <div className="flex items-center gap-3 rounded-2xl bg-espresso p-3 text-ivory shadow-2xl ring-1 ring-white/10">
        <Image src="/icons/icon-192.png" alt="" width={44} height={44} className="h-11 w-11 flex-shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold">Get the Trend Street app</p>
          {mode === "android" ? (
            <p className="text-xs text-ivory/75">One tap from your home screen. First to know about drops.</p>
          ) : (
            <p className="text-xs text-ivory/75">
              Tap <Share className="inline h-3.5 w-3.5 align-[-2px]" /> Share, then <PlusSquare className="inline h-3.5 w-3.5 align-[-2px]" />{" "}
              <b>Add to Home Screen</b>.
            </p>
          )}
        </div>
        {mode === "android" && (
          <button type="button" onClick={install} className="min-h-[44px] flex-shrink-0 rounded-xl bg-white px-4 text-xs font-bold uppercase tracking-wider text-espresso">
            Install
          </button>
        )}
        <button type="button" onClick={close} aria-label="Not now" className="-ml-1 flex h-11 w-9 flex-shrink-0 items-center justify-center text-ivory/60">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
