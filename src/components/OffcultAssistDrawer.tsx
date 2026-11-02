"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  X,
  Ruler,
  Truck,
  ArrowRight,
} from "lucide-react";

interface OffcultAssistDrawerProps {
  onOpenTracker?: () => void;
  /** Hide the floating trigger pill (e.g. while another modal owns the screen). */
  hideTrigger?: boolean;
}

export const OffcultAssistDrawer: React.FC<OffcultAssistDrawerProps> = ({
  onOpenTracker,
  hideTrigger = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"quiz" | "concierge">("quiz");

  // Fit Quiz State
  const [heightCm, setHeightCm] = useState(178);
  const [weightKg, setWeightKg] = useState(74);
  const [calculatedResult, setCalculatedResult] = useState<{
    oversized: string;
    boxyFit: string;
    jeans: string;
    jacket: string;
  } | null>(null);

  // Keyboard Escape listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
      oversized: `${teeSize} (Dropped Boxy Drape)`,
      boxyFit: `${teeSize} (Cropped Waistline)`,
      jeans: `${waistSize} (Generous Ankle Break)`,
      jacket: `${jacketSize} (Layered Flight Cut)`,
    });
  };

  // Safe Imperial conversion avoiding 5'12"
  const totalInches = Math.round(heightCm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;

  return (
    <>
      {/* Floating Trigger Pill (Bottom Right) */}
      {!hideTrigger && (
        <div
          className={`fixed bottom-[84px] sm:bottom-6 right-3 sm:right-6 z-40 transition-opacity duration-200 ${
            isOpen ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-label="Open Fit Concierge"
            title="Fit Concierge"
            className="flex h-12 w-12 items-center justify-center gap-2 rounded-full bg-espresso text-ivory border border-gold/40 shadow-xl hover:bg-burgundy transition-colors group active:scale-[0.98] motion-reduce:active:scale-100 sm:h-auto sm:w-auto sm:pl-3 sm:pr-4 sm:py-2.5"
          >
            <span className="relative flex h-5 w-5 items-center justify-center">
              <MessageSquare className="w-4 h-4 text-gold transition-transform group-hover:rotate-6 motion-reduce:transition-none motion-reduce:group-hover:rotate-0" />
              <span className="pointer-events-none absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-crimson opacity-70 animate-ping motion-reduce:hidden" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-crimson ring-2 ring-espresso" />
              </span>
            </span>
            {/* Label only on larger screens: on phones the round icon keeps it off the content. */}
            <span className="hidden text-xs font-bold uppercase tracking-wider sm:inline">
              Fit Concierge
            </span>
          </button>
        </div>
      )}

      {/* Slide-Up Concierge Card */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Fit Concierge Window"
          className="fixed bottom-24 sm:bottom-20 right-3 sm:right-6 z-50 w-[calc(100vw-24px)] sm:w-96 bg-white rounded-2xl shadow-2xl border border-burgundy/20 overflow-hidden animate-in slide-in-from-bottom-5 duration-200"
        >
          {/* Header */}
          <div className="p-4 bg-espresso text-ivory flex items-center justify-between border-b border-burgundy/30">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-burgundy flex items-center justify-center text-gold">
                <Ruler className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-serif text-sm font-bold">Atelier Concierge</h4>
                <span className="text-[10px] text-gold font-mono uppercase block">
                  Bandra West Studio
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-ivory/60 hover:text-gold"
              aria-label="Close concierge"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="grid grid-cols-2 p-1.5 bg-ivory-dark border-b border-burgundy/10 text-xs font-bold uppercase tracking-wider">
            <button
              type="button"
              onClick={() => setActiveTab("quiz")}
              className={`py-1.5 rounded-md transition-all ${
                activeTab === "quiz"
                  ? "bg-burgundy text-gold shadow-sm"
                  : "text-espresso/60 hover:text-espresso"
              }`}
            >
              Size Calculator
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("concierge")}
              className={`py-1.5 rounded-md transition-all ${
                activeTab === "concierge"
                  ? "bg-burgundy text-gold shadow-sm"
                  : "text-espresso/60 hover:text-espresso"
              }`}
            >
              Direct Stylist
            </button>
          </div>

          {/* Content Body */}
          <div className="p-4 max-h-[65vh] overflow-y-auto space-y-4">
            {activeTab === "quiz" ? (
              <div className="space-y-4">
                <p className="text-xs text-espresso/70 leading-relaxed">
                  Enter your body metrics to calculate exact sizing for our 4 silhouettes without guessing.
                </p>

                {/* Height Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-espresso/70">Your Height:</span>
                    <span className="font-mono font-bold text-burgundy">
                      {heightCm} cm ({feet}&apos;{inches}&quot;)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={160}
                    max={200}
                    value={heightCm}
                    aria-label="Height in centimeters"
                    onChange={(e) => {
                      setHeightCm(Number(e.target.value));
                      setCalculatedResult(null);
                    }}
                    className="w-full accent-burgundy cursor-pointer"
                  />
                </div>

                {/* Weight Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-espresso/70">Your Weight:</span>
                    <span className="font-mono font-bold text-burgundy">{weightKg} kg</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={110}
                    value={weightKg}
                    aria-label="Weight in kilograms"
                    onChange={(e) => {
                      setWeightKg(Number(e.target.value));
                      setCalculatedResult(null);
                    }}
                    className="w-full accent-burgundy cursor-pointer"
                  />
                </div>

                <button
                  type="button"
                  onClick={calculateFit}
                  className="w-full py-2.5 px-4 bg-burgundy hover:bg-crimson text-ivory text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm"
                >
                  Calculate My Silhouette Sizes
                </button>

                {calculatedResult && (
                  <div className="p-3 rounded-xl bg-ivory border border-burgundy/15 space-y-2 animate-in fade-in duration-300">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-burgundy block">
                      Recommended Streetwear Specs:
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 bg-white rounded border border-burgundy/10">
                        <span className="text-espresso/50 block text-[9px] uppercase">Oversized Tops</span>
                        <strong className="text-espresso font-mono">{calculatedResult.oversized}</strong>
                      </div>
                      <div className="p-2 bg-white rounded border border-burgundy/10">
                        <span className="text-espresso/50 block text-[9px] uppercase">Boxy Fit</span>
                        <strong className="text-espresso font-mono">{calculatedResult.boxyFit}</strong>
                      </div>
                      <div className="p-2 bg-white rounded border border-burgundy/10">
                        <span className="text-espresso/50 block text-[9px] uppercase">Selvedge Jeans</span>
                        <strong className="text-espresso font-mono">{calculatedResult.jeans}</strong>
                      </div>
                      <div className="p-2 bg-white rounded border border-burgundy/10">
                        <span className="text-espresso/50 block text-[9px] uppercase">Outerwear</span>
                        <strong className="text-espresso font-mono">{calculatedResult.jacket}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3.5">
                <p className="text-xs text-espresso/70 leading-relaxed font-light">
                  Speak directly with a Mumbai atelier stylist for custom sizing, tailoring inseams, or bulk studio curation.
                </p>

                <a
                  href="https://wa.me/919820012345?text=Hello%20Trend%20Street%20Concierge,%20I%20need%20styling%20and%20fit%20advice"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-green-700 hover:bg-green-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat on WhatsApp (+91 98200 12345)</span>
                </a>

                {onOpenTracker && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenTracker();
                    }}
                    className="w-full py-2.5 px-4 bg-ivory hover:bg-ivory-dark text-espresso text-xs font-bold uppercase tracking-wider rounded-xl border border-burgundy/20 transition-colors flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-burgundy" />
                      <span>Track Live Blue Dart Delivery</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-espresso/40" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
