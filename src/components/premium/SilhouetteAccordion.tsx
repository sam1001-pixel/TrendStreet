"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

const PANELS = [
  {
    name: "Oversized",
    href: "/oversized",
    no: "01",
    subtitle: "Dropped Shoulders & 520gsm Drape",
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1400&auto=format&fit=crop",
    copy: "Heavyweight loopback hoodies and 320gsm drop-shoulder tees engineered with relaxed architectural drape.",
  },
  {
    name: "Boxy Fit",
    href: "/boxy-fit",
    no: "02",
    subtitle: "Cropped Waist & Square Geometry",
    image: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1400&auto=format&fit=crop",
    copy: "Cropped, wide-body knits and structured flannel overshirts that sit precisely at the natural beltline.",
  },
  {
    name: "Jackets",
    href: "/jackets",
    no: "03",
    subtitle: "Handcrafted Flight & Outerwear",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1400&auto=format&fit=crop",
    copy: "Suede flight bombers, Melton overcoats, and Japanese duck canvas chores built for generational longevity.",
  },
];

/** Three silhouettes: 1 card/row on mobile, 2 cards/row on tablet, expanding accordion on desktop. */
export function SilhouetteAccordion() {
  const [open, setOpen] = useState(0);

  return (
    <section className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:mb-10">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-crimson block mb-1">
            Architectural Foundations
          </span>
          <h2 className="font-display text-4xl font-black uppercase leading-[0.85] text-stone-950 sm:text-7xl lg:text-8xl">
            Three cuts.
            <br />
            <span className="text-outline text-burgundy">Nothing else.</span>
          </h2>
        </div>
        <p className="max-w-xs text-xs sm:text-sm leading-relaxed text-stone-600 font-light">
          No suits, no formal shoes. Every garment in the atelier belongs exclusively to one of three architectural silhouettes.
        </p>
      </div>

      {/* Grid: 1 col on mobile, 2 cols on tablet, expanding flex row on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:h-[620px] lg:flex-row gap-4 sm:gap-6">
        {PANELS.map((p, i) => {
          const isOpen = open === i;
          return (
            <Link
              key={p.name}
              href={p.href}
              onMouseEnter={() => setOpen(i)}
              onFocus={() => setOpen(i)}
              className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl bg-stone-900 aspect-[4/5] sm:aspect-[4/5] lg:aspect-auto lg:h-auto lg:transition-[flex-grow] lg:duration-700 lg:ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isOpen ? "lg:flex-[3.5]" : "lg:flex-[1]"
              } ${i === 2 ? "sm:col-span-2 sm:max-w-lg sm:mx-auto w-full lg:col-span-1 lg:max-w-none" : ""}`}
            >
              {/* Background Product Image */}
              <Image
                src={p.image}
                alt={`${p.name} collection`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
                className={`object-cover transition-all duration-700 ${
                  isOpen ? "scale-105 grayscale-0" : "scale-100 lg:grayscale"
                }`}
              />

              {/* Protective multi-stop scrim gradient for maximum contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/20 transition-opacity duration-500 group-hover:from-black/95 group-hover:via-black/60" />

              {/* Card Content Overlay */}
              <div className="relative z-10 flex h-full flex-col justify-between p-5 sm:p-7">
                {/* Top Bar: Number Tag & Corner Arrow */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-md px-3 py-1 border border-white/15 text-gold font-mono text-[11px] font-bold tracking-wider">
                    <span>{p.no}</span>
                    <span className="text-white/30">•</span>
                    <span className="text-white/80 uppercase">Silhouette</span>
                  </span>
                  <span className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/95 text-stone-950 shadow-md transition-transform duration-300 group-hover:rotate-45 group-hover:bg-gold">
                    <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                </div>

                {/* Bottom Body: Subtitle, Large Title, Full Copy & CTA */}
                <div className="space-y-2 pt-8">
                  <span className="block text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-gold/90">
                    {p.subtitle}
                  </span>
                  <h3 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black uppercase text-white leading-none tracking-tight">
                    {p.name}
                  </h3>
                  <p
                    className={`text-xs sm:text-sm text-stone-200/90 leading-relaxed max-w-md font-light pt-1 transition-opacity duration-300 ${
                      isOpen ? "lg:opacity-100" : "lg:opacity-0 lg:h-0 lg:overflow-hidden"
                    }`}
                  >
                    {p.copy}
                  </p>

                  {/* Explore Collection Link */}
                  <div className="pt-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-white/90 group-hover:text-gold transition-colors">
                    <span>Explore Collection</span>
                    <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
