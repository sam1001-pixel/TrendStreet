"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { MessageSquare, X, Ruler, Truck, ArrowRight } from "lucide-react";
import { useStore } from "@/context/StoreContext";

interface OffcultAssistDrawerProps {
  onOpenTracker?: () => void;
  /** Hide the floating trigger pill (e.g. while another modal owns the screen). */
  hideTrigger?: boolean;
}

/**
 * Fit Concierge: size calculator + WhatsApp stylist.
 * Phones: a full-width bottom sheet over a dimmed backdrop (tap outside or swipe the handle area to close).
 * Tablet/desktop: a floating card in the bottom-right corner.
 */
export const OffcultAssistDrawer: React.FC<OffcultAssistDrawerProps> = ({ onOpenTracker, hideTrigger = false }) => {
  const { siteSettings } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"quiz" | "concierge">("quiz");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // The sheet is rendered straight into <body> so page spacing or transforms can't shift it.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [heightCm, setHeightCm] = useState(178);
  const [weightKg, setWeightKg] = useState(74);
  const [calculatedResult, setCalculatedResult] = useState<{
    oversized: string;
    boxyFit: string;
    jeans: string;
    jacket: string;
  } | null>(null);

  // Escape closes; focus moves into the sheet and back to the button afterwards.
  // On phones the page behind is locked so swiping the sheet doesn't scroll the homepage.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    const isPhone = window.matchMedia("(max-width: 639px)").matches;
    const prevOverflow = document.body.style.overflow;
    if (isPhone) document.body.style.overflow = "hidden";
    const trigger = triggerRef.current;
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      trigger?.focus();
    };
  }, [isOpen]);

  const calculateFit = () => {
    let teeSize = "M";
    let jacketSize = "M";
    let waistSize = "32W";

    if (weightKg < 65) {
      teeSize = "S";
      jacketSize = "S";
      waistSize = "30W";
    } else if (weightKg <= 76) {
      teeSize = heightCm > 180 ? "L" : "M";
      jacketSize = heightCm > 180 ? "L" : "M";
      waistSize = "32W";
    } else if (weightKg <= 86) {
      teeSize = "L";
      jacketSize = "L";
      waistSize = "34W";
    } else {
      teeSize = "XL";
      jacketSize = "XL";
      waistSize = "36W";
    }

    setCalculatedResult({
      oversized: teeSize,
      boxyFit: teeSize,
      jeans: waistSize,
      jacket: jacketSize,
    });
  };

  const totalInches = Math.round(heightCm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;

  // WhatsApp goes to the store's own number (Admin → Settings → contact phone).
  const phone = siteSettings.contactInfo?.phone || "";
  const waDigits = phone.replace(/\D/g, "");
  const waHref = waDigits
    ? `https://wa.me/${waDigits}?text=${encodeURIComponent("Hello Trend Street, I need help with sizing and fit.")}`
    : null;

  const tabClass = (active: boolean) =>
    `min-h-[44px] rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
      active ? "bg-burgundy text-gold shadow-sm" : "text-espresso/65 active:bg-white/60"
    }`;

  return (
    <>
      {!hideTrigger && (
        <div
          className={`fixed bottom-[calc(72px+env(safe-area-inset-bottom))] right-3 z-40 transition-opacity duration-200 sm:bottom-6 sm:right-6 ${
            isOpen ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setIsOpen(true)}
            aria-expanded={isOpen}
            aria-haspopup="dialog"
            aria-label="Open Fit Concierge"
            title="Fit Concierge"
            className="group flex h-12 w-12 items-center justify-center gap-2 rounded-full border border-gold/40 bg-espresso text-ivory shadow-xl transition-colors hover:bg-burgundy active:scale-95 motion-reduce:active:scale-100 sm:h-auto sm:w-auto sm:py-2.5 sm:pl-3 sm:pr-4"
          >
            <span className="relative flex h-5 w-5 items-center justify-center">
              <Ruler className="h-[18px] w-[18px] text-gold" />
              <span className="pointer-events-none absolute -right-1 -top-1 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-crimson opacity-70 motion-reduce:hidden" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-crimson ring-2 ring-espresso" />
              </span>
            </span>
            <span className="hidden text-xs font-bold uppercase tracking-wider sm:inline">Fit Concierge</span>
          </button>
        </div>
      )}

      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[60] sm:pointer-events-none">
          {/* Backdrop — phones only; tap to close */}
          <button
            type="button"
            aria-label="Close Fit Concierge"
            tabIndex={-1}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-espresso/45 backdrop-blur-[2px] animate-[fadeIn_.2s_ease-out] sm:hidden"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="concierge-title"
            className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col overflow-hidden rounded-t-3xl border-t border-burgundy/20 bg-white shadow-2xl animate-[sheetUp_.28s_cubic-bezier(.22,1,.36,1)] sm:pointer-events-auto sm:inset-x-auto sm:bottom-6 sm:right-6 sm:max-h-[min(640px,calc(100dvh-48px))] sm:w-96 sm:rounded-2xl sm:border"
          >
            {/* Grab handle (phones) */}
            <div className="flex justify-center bg-espresso pt-2 sm:hidden" aria-hidden>
              <span className="h-1 w-10 rounded-full bg-ivory/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between gap-3 bg-espresso px-4 pb-3 pt-2 text-ivory sm:pt-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-burgundy text-gold">
                  <Ruler className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h2 id="concierge-title" className="truncate font-serif text-base font-bold leading-tight">
                    Fit Concierge
                  </h2>
                  <span className="block truncate text-[11px] text-ivory/60">Find your size in 10 seconds</span>
                </div>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setIsOpen(false)}
                className="-mr-2 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-ivory/70 hover:bg-white/10 hover:text-gold"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div role="tablist" aria-label="Concierge options" className="grid grid-cols-2 gap-1 border-b border-burgundy/10 bg-ivory-dark p-1.5">
              <button type="button" role="tab" aria-selected={activeTab === "quiz"} onClick={() => setActiveTab("quiz")} className={tabClass(activeTab === "quiz")}>
                Size calculator
              </button>
              <button type="button" role="tab" aria-selected={activeTab === "concierge"} onClick={() => setActiveTab("concierge")} className={tabClass(activeTab === "concierge")}>
                Talk to a stylist
              </button>
            </div>

            {/* Body (scrolls inside the sheet) */}
            <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
              {activeTab === "quiz" ? (
                <>
                  <p className="text-sm leading-relaxed text-espresso/70">
                    Set your height and weight to get your size in all four fits.
                  </p>

                  <label className="block space-y-2">
                    <span className="flex items-baseline justify-between text-sm">
                      <span className="font-medium text-espresso/75">Height</span>
                      <span className="font-mono font-bold tabular-nums text-burgundy">
                        {heightCm} cm · {feet}&apos;{inches}&quot;
                      </span>
                    </span>
                    <input
                      type="range"
                      min={150}
                      max={200}
                      value={heightCm}
                      onChange={(e) => {
                        setHeightCm(Number(e.target.value));
                        setCalculatedResult(null);
                      }}
                      className="h-8 w-full cursor-pointer accent-burgundy"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="flex items-baseline justify-between text-sm">
                      <span className="font-medium text-espresso/75">Weight</span>
                      <span className="font-mono font-bold tabular-nums text-burgundy">{weightKg} kg</span>
                    </span>
                    <input
                      type="range"
                      min={45}
                      max={120}
                      value={weightKg}
                      onChange={(e) => {
                        setWeightKg(Number(e.target.value));
                        setCalculatedResult(null);
                      }}
                      className="h-8 w-full cursor-pointer accent-burgundy"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={calculateFit}
                    className="min-h-[48px] w-full rounded-xl bg-burgundy px-4 text-sm font-bold uppercase tracking-wider text-ivory shadow-sm transition-colors hover:bg-crimson active:bg-crimson"
                  >
                    Show my sizes
                  </button>

                  {calculatedResult && (
                    <div className="space-y-2 rounded-xl border border-burgundy/15 bg-ivory p-3" aria-live="polite">
                      <span className="block text-[11px] font-bold uppercase tracking-widest text-burgundy">Your sizes</span>
                      <dl className="grid grid-cols-2 gap-2">
                        {[
                          ["Oversized", calculatedResult.oversized],
                          ["Boxy fit", calculatedResult.boxyFit],
                          ["Jeans", calculatedResult.jeans],
                          ["Jackets", calculatedResult.jacket],
                        ].map(([label, size]) => (
                          <div key={label} className="rounded-lg border border-burgundy/10 bg-white p-2.5">
                            <dt className="text-[11px] uppercase tracking-wide text-espresso/55">{label}</dt>
                            <dd className="font-mono text-lg font-bold text-espresso">{size}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm leading-relaxed text-espresso/70">
                    Chat with our team about sizing, alterations or bulk orders.
                  </p>

                  {waHref && (
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-green-800"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Chat on WhatsApp
                    </a>
                  )}

                  {onOpenTracker && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onOpenTracker();
                      }}
                      className="flex min-h-[48px] w-full items-center justify-between rounded-xl border border-burgundy/20 bg-ivory px-4 text-sm font-bold text-espresso transition-colors hover:bg-ivory-dark"
                    >
                      <span className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-burgundy" />
                        Track my order
                      </span>
                      <ArrowRight className="h-4 w-4 text-espresso/40" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
