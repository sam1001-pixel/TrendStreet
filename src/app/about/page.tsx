"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Scissors,
  Award,
  Globe,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="space-y-20 pb-20">
      {/* 1. Header Banner */}
      <section className="bg-espresso text-ivory py-20 border-b border-burgundy/40 text-center px-4">
        <div className="max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-gold block">
            Streetwear Architecture & Textile Provenance
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
            The Philosophy of <br />
            <span className="text-gold italic font-normal">Trend Street</span>
          </h1>
          <p className="text-xs sm:text-sm text-ivory/80 leading-relaxed font-light max-w-xl mx-auto">
            Founded with an uncompromising belief that true modern elegance is born from deliberate architectural silhouette, heavy natural textiles, and artisanal loom craft.
          </p>
        </div>
      </section>

      {/* 2. The Dialogue Between Streetwear Volume and Loom Craft */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-crimson block">
              Architectural Silhouette
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-espresso">
              Where Japanese Loom Craft Meets Brutalist Streetwear Architecture
            </h2>
            <p className="text-xs sm:text-base text-espresso/80 leading-relaxed font-light">
              Trend Street was founded to redefine contemporary menswear through uncompromising material density and calculated proportion. We reject disposable fast-fashion and synthetic polyester blends in favor of authentic heirloom construction.
            </p>
            <p className="text-xs sm:text-base text-espresso/80 leading-relaxed font-light">
              Every piece across our four core silhouettes—Oversized, Jeans, Boxy Fit, and Jackets—is engineered from pure natural fibers: custom-milled 520gsm Japanese loopback terry, 14.5oz Okayama redline selvedge denim, 220gsm mercerized poplin, and butter-soft Tuscan lambskin suede. The result is a sculptural drape that holds its presence and patinas beautifully over decades.
            </p>
          </div>

          <div className="lg:col-span-6">
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-burgundy/15">
              <Image
                src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1200&auto=format&fit=crop"
                alt="Trend Street Atelier Workshop"
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. The Three Mill Partners */}
      <section className="bg-white py-16 border-y border-burgundy/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-crimson block">
              Pure Textile Provenance
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-espresso">
              Historic Loom & Knitting Partnerships
            </h2>
            <p className="text-xs text-espresso/70">
              We never blend synthetic elastane or polyester. Every yard originates from master weavers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-ivory rounded-2xl border border-burgundy/15 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-burgundy block">
                Okayama & Kojima, Japan
              </span>
              <h3 className="font-serif text-xl font-bold text-espresso">
                Shinya Looms (Est. 1951)
              </h3>
              <p className="text-xs text-espresso/70 leading-relaxed">
                Woven on vintage low-tension Toyoda shuttle looms using 100% Zimbabwe ring-spun cotton. Delivers signature redline selvedge edges, subtle vertical slub, and high-contrast honeycomb fading.
              </p>
            </div>

            <div className="p-8 bg-ivory rounded-2xl border border-burgundy/15 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-burgundy block">
                Hamamatsu, Japan
              </span>
              <h3 className="font-serif text-xl font-bold text-espresso">
                Slow-Knit Loopback Ateliers
              </h3>
              <p className="text-xs text-espresso/70 leading-relaxed">
                Specialized in dense 520gsm and 320gsm organic loopback French terry and combed jersey. Gives our oversized hoodies and tees their signature structural drape and zero-sag collar.
              </p>
            </div>

            <div className="p-8 bg-ivory rounded-2xl border border-burgundy/15 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-burgundy block">
                Biella & Florence, Italy
              </span>
              <h3 className="font-serif text-xl font-bold text-espresso">
                Tuscan Leather & Merino Mills
              </h3>
              <p className="text-xs text-espresso/70 leading-relaxed">
                Suppliers of full-grain vegetable-tanned cowhide, velvety lambskin suede, and 7-gauge extra-fine merino wool for heirloom flight jackets and cropped boxy knits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Atelier Studio Contact */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-espresso text-ivory p-8 sm:p-12 rounded-3xl border border-burgundy/30 shadow-2xl space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gold block">
              Private Studio Appointments
            </span>
            <h3 className="font-serif text-3xl font-bold text-ivory">
              Trend Street Shoreditch Atelier
            </h3>
            <p className="text-xs text-ivory/80 max-w-md mx-auto">
              Our studio design team is available for silhouette consultations, chain-stitch hemming appointments, and private collection viewings.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-center border-t border-burgundy/30 pt-8">
            <div className="space-y-2">
              <MapPin className="w-5 h-5 text-gold mx-auto" />
              <strong className="block text-ivory font-bold">Studio Headquarters</strong>
              <p className="text-ivory/70">72 Shoreditch High Street<br />Hackney, London E1 6JJ</p>
            </div>

            <div className="space-y-2">
              <Phone className="w-5 h-5 text-gold mx-auto" />
              <strong className="block text-ivory font-bold">Studio Concierge Line</strong>
              <p className="text-ivory/70">+44 20 7946 0912<br />Mon–Sat: 9AM – 7PM GMT</p>
            </div>

            <div className="space-y-2">
              <Mail className="w-5 h-5 text-gold mx-auto" />
              <strong className="block text-ivory font-bold">Client Inquiries</strong>
              <p className="text-ivory/70">concierge@trendstreet.com<br />studio@trendstreet.com</p>
            </div>
          </div>

          <div className="text-center pt-2">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 py-3.5 px-8 bg-burgundy hover:bg-crimson text-gold text-xs font-bold uppercase tracking-[0.2em] rounded-lg transition-colors shadow-lg"
            >
              <span>Explore The 4 Silhouettes</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
