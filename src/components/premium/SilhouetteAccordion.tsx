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
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1400&auto=format&fit=crop",
    copy: "Heavyweight loopback hoodies and 320gsm drop-shoulder tees.",
  },
  {
    name: "Boxy Fit",
    href: "/boxy-fit",
    no: "02",
    image: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1400&auto=format&fit=crop",
    copy: "Cropped, wide-body knits and structured flannel layers.",
  },
  {
    name: "Jackets",
    href: "/jackets",
    no: "03",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1400&auto=format&fit=crop",
    copy: "Suede flight bombers, Melton overcoats, duck canvas chores.",
  },
];

/** Three silhouettes as expanding panels on desktop, a stacked list on mobile. */
export function SilhouetteAccordion() {
  const [open, setOpen] = useState(0);

  return (
    <section className="mx-auto max-w-[1600px] px-3 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-end justify-between gap-4 sm:mb-10">
        <h2 className="font-display text-4xl font-black uppercase leading-[0.85] text-stone-950 sm:text-7xl lg:text-8xl">
          Three cuts.
          <br />
          <span className="text-outline text-burgundy">Nothing else.</span>
        </h2>
        <p className="hidden max-w-xs text-sm leading-relaxed text-stone-600 md:block">
          No suits, no formal shoes. Every piece in the store belongs to one of three silhouettes.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 lg:flex lg:h-[620px] lg:flex-row">
        {PANELS.map((p, i) => {
          const isOpen = open === i;
          return (
            <Link
              key={p.name}
              href={p.href}
              onMouseEnter={() => setOpen(i)}
              onFocus={() => setOpen(i)}
              className={`group relative aspect-[4/5] overflow-hidden rounded-2xl bg-stone-900 sm:aspect-[4/3] lg:aspect-auto lg:h-auto lg:transition-[flex-grow] lg:duration-700 lg:ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isOpen ? "lg:flex-[4]" : "lg:flex-[1]"
              }`}
            >
              <Image
                src={p.image}
                alt={`${p.name} collection`}
                fill
                sizes="(max-width: 1024px) 50vw, 60vw"
                className={`object-cover transition-all duration-700 ${
                  isOpen ? "scale-100 grayscale-0" : "scale-110 lg:grayscale"
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 text-white sm:gap-4 sm:p-7">
                <div className="min-w-0">
                  <span className="font-mono text-xs text-gold">{p.no}</span>
                  <h3 className="font-display text-2xl font-black uppercase leading-none sm:text-5xl lg:whitespace-nowrap">
                    {p.name}
                  </h3>
                  <p
                    className={`mt-2 hidden max-w-sm text-sm text-white/80 transition-opacity sm:block duration-300 ${
                      isOpen ? "lg:opacity-100 lg:delay-300" : "lg:opacity-0"
                    }`}
                  >
                    {p.copy}
                  </p>
                </div>
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white text-stone-950 transition-transform duration-200 group-hover:rotate-45 sm:h-12 sm:w-12">
                  <ArrowUpRight className="h-5 w-5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
