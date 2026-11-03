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
    shortTag: "520gsm Loopback Hoodies & Dropped Tees",
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1400&auto=format&fit=crop",
    copy: "Heavyweight loopback hoodies and 320gsm drop-shoulder tees engineered with relaxed architectural drape.",
  },
  {
    name: "Jeans",
    href: "/shop?category=Jeans",
    no: "02",
    shortTag: "Baggy, Carpenter & Selvedge Denim",
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1400&auto=format&fit=crop",
    copy: "Relaxed baggy and carpenter cuts in heavyweight denim, made to stack and wear in over years.",
  },
  {
    name: "Boxy Fit",
    href: "/boxy-fit",
    no: "03",
    shortTag: "Cropped Waist & Wide-Body Knits",
    image: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1400&auto=format&fit=crop",
    copy: "Cropped, wide-body knits and structured flannel overshirts that sit precisely at the natural beltline.",
  },
  {
    name: "Jackets",
    href: "/jackets",
    no: "04",
    shortTag: "Handcrafted Flight Bombers & Shells",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1400&auto=format&fit=crop",
    copy: "Suede flight bombers, Melton overcoats, and Japanese duck canvas chores built for generational longevity.",
  },
];

/** Four silhouettes: 2 × 2 tiles on phones and tablets, an expanding accordion on desktop. */
export function SilhouetteAccordion() {
  const [open, setOpen] = useState(0);

  return (
    <section className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-3 sm:py-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-crimson block mb-1">
            Architectural Foundations
          </span>
          <h2 className="font-display text-3xl font-black uppercase leading-[0.85] text-stone-950 sm:text-6xl lg:text-7xl">
            Four cuts.
            <br />
            <span className="text-outline text-burgundy">Nothing else.</span>
          </h2>
        </div>
        <p className="max-w-xs text-xs sm:text-sm leading-relaxed text-stone-600 font-light">
          No suits, no formal shoes. Every piece belongs to one of four silhouettes.
        </p>
      </div>

      {/* Grid: 1 col on mobile, 2 cols on tablet, expanding flex row on desktop */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:flex lg:h-[580px] lg:flex-row lg:gap-5">
        {PANELS.map((p, i) => {
          const isOpen = open === i;
          return (
            <Link
              key={p.name}
              href={p.href}
              onMouseEnter={() => setOpen(i)}
              onFocus={() => setOpen(i)}
              className={`group relative overflow-hidden rounded-xl sm:rounded-2xl bg-stone-900 aspect-[4/5] sm:aspect-[4/3] lg:aspect-auto lg:h-auto lg:transition-[flex-grow] lg:duration-700 lg:ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isOpen ? "lg:flex-[3.5]" : "lg:flex-[1]"
              }`}
            >
              {/* Background Product Image */}
              <Image
                src={p.image}
                alt={`${p.name} collection`}
                fill
                sizes="(max-width: 1024px) 50vw, 40vw"
                className={`object-cover transition-all duration-700 ${
                  isOpen ? "scale-105 grayscale-0" : "scale-100 lg:grayscale"
                }`}
              />

              {/* Protective multi-stop scrim gradient for maximum contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/15 transition-opacity duration-500 group-hover:from-black/95 group-hover:via-black/55" />

              {/* Card Content Overlay */}
              <div className="relative z-10 flex h-full flex-col justify-between p-3 sm:p-5 lg:p-7">
                {/* Top Row: Number Tag & Corner Arrow */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 backdrop-blur-md px-2.5 py-0.5 border border-white/15 text-gold font-mono text-[11px] sm:text-[11px] font-bold tracking-wider">
                    <span>{p.no}</span>
                    <span className="text-white/30">•</span>
                    <span className="text-white/80 uppercase">Cut</span>
                  </span>
                  <span className="flex h-8 w-8 sm:h-9 sm:w-9 lg:h-11 lg:w-11 items-center justify-center rounded-full bg-white/95 text-stone-950 shadow-md transition-all duration-300 group-hover:rotate-45 group-hover:bg-gold hover:text-white">
                    <ArrowUpRight className="h-4 w-4 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                  </span>
                </div>

                {/* Bottom Body: Title & Short Content */}
                <div>
                  <h3 className="font-display text-[1.6rem] sm:text-3xl lg:text-5xl font-black uppercase text-white leading-none tracking-tight">
                    {p.name}
                  </h3>

                  {/* Short 1-line tag for mobile & tablet */}
                  <p className="mt-1 text-[11px] sm:text-[13px] text-white/80 font-medium line-clamp-2 lg:hidden">
                    {p.shortTag}
                  </p>

                  {/* Detailed copy for desktop when expanded */}
                  <p
                    className={`hidden lg:block text-xs sm:text-sm text-stone-200/90 leading-relaxed max-w-md font-light pt-1.5 transition-opacity duration-300 ${
                      isOpen ? "lg:opacity-100" : "lg:opacity-0 lg:h-0 lg:overflow-hidden"
                    }`}
                  >
                    {p.copy}
                  </p>

                  {/* Desktop explore link */}
                  <div className="hidden lg:flex pt-2 items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-white/90 group-hover:text-gold transition-colors">
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
