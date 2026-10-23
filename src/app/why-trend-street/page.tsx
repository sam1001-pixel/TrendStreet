import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Scale, Scissors, Droplets, SearchCheck, Truck } from "lucide-react";
import { ManifestoReveal } from "@/components/premium/ManifestoReveal";
import { TrustStrip } from "@/components/premium/TrustStrip";
import { CountUp } from "@/components/premium/CountUp";

export const metadata: Metadata = {
  title: "Why Trend Street | Four Silhouettes, Made Heavy",
  description:
    "Why Trend Street makes only four things — oversized, jeans, boxy fit and jackets — in heavyweight fabric built to last. Our mills, our process and our promises.",
  alternates: { canonical: "/why-trend-street" },
};

const PILLARS = [
  {
    name: "Oversized",
    href: "/oversized",
    spec: "320–520 gsm",
    line: "Loopback and combed jersey heavy enough to hang off the shoulder instead of clinging to it.",
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=900&auto=format&fit=crop",
  },
  {
    name: "Jeans",
    href: "/jeans",
    spec: "14–15 oz",
    line: "Okayama and Kurabo selvedge that starts rigid and fades into a record of how you live.",
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=900&auto=format&fit=crop",
  },
  {
    name: "Boxy Fit",
    href: "/boxy-fit",
    spec: "+12 cm body",
    line: "Cropped hems, wide bodies and a 3 cm collar that stands off the neck. Square on purpose.",
    image: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=900&auto=format&fit=crop",
  },
  {
    name: "Jackets",
    href: "/jackets",
    spec: "10-year build",
    line: "Suede bombers, duck canvas and full-grain moto jackets made to outlast trends.",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=900&auto=format&fit=crop",
  },
];

const PROCESS = [
  { icon: Scale, title: "Weighed at the mill", line: "Every fabric roll is weighed per square metre before we accept it." },
  { icon: Scissors, title: "Cut in small batches", line: "Patterns graded for Indian body proportions, cut 200 pieces at a time." },
  { icon: Droplets, title: "Washed before you wear it", line: "Garment-dyed and pre-shrunk, so the size you buy is the size you keep." },
  { icon: SearchCheck, title: "Inspected by hand", line: "Seams, collars and hems checked at our Mumbai atelier before packing." },
  { icon: Truck, title: "Shipped in 24 hours", line: "Blue Dart and Delhivery air to 19,000+ PIN codes, free over ₹1,999." },
];

const STATS = [
  { value: 4, suffix: "", label: "Silhouettes. Nothing else." },
  { value: 520, suffix: "gsm", label: "Heaviest loopback we cut" },
  { value: 19000, suffix: "+", label: "PIN codes we deliver to" },
  { value: 30, suffix: " days", label: "Doorstep exchange window" },
];

export default function WhyTrendStreetPage() {
  return (
    <div className="space-y-16 pb-16 sm:space-y-24 sm:pb-24">
      {/* Hero */}
      <section className="relative overflow-hidden bg-espresso text-ivory">
        <Image
          src="https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=2000&auto=format&fit=crop"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso via-espresso/60 to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-24 sm:px-8 sm:pb-20 sm:pt-36">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-gold">Why Trend Street</p>
          <h1 className="mt-3 font-display text-5xl font-black uppercase leading-[0.85] sm:text-7xl lg:text-8xl">
            Four things.
            <br />
            <span className="text-gold">Made heavy.</span>
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-ivory/80 sm:text-base">
            Most brands make everything. We make oversized tops, jeans, boxy fits and jackets — and we make them in fabric
            heavy enough to hold a shape for years.
          </p>
        </div>
      </section>

      {/* Manifesto (word-by-word scroll reveal) */}
      <ManifestoReveal />

      {/* Numbers */}
      <section className="mx-auto max-w-6xl px-4 sm:px-8" aria-label="Trend Street in numbers">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-burgundy/15 bg-burgundy/15 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="bg-ivory-light p-5 sm:p-8">
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-display text-4xl font-black text-burgundy sm:text-6xl">
                <CountUp to={s.value} suffix={s.suffix} />
              </dd>
              <p className="mt-1 text-xs text-espresso/70 sm:text-sm">{s.label}</p>
            </div>
          ))}
        </dl>
      </section>

      {/* The four */}
      <section className="mx-auto max-w-6xl px-4 sm:px-8" aria-labelledby="four-heading">
        <h2 id="four-heading" className="font-display text-4xl font-black uppercase leading-none text-espresso sm:text-6xl">
          The four we make
        </h2>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {PILLARS.map((p) => (
            <li key={p.name}>
              <Link href={p.href} className="group block overflow-hidden rounded-2xl bg-white ring-1 ring-burgundy/10 transition-shadow hover:shadow-xl">
                <span className="relative block aspect-[4/5] overflow-hidden bg-ivory-dark">
                  <Image src={p.image} alt={p.name} fill sizes="(max-width:1024px) 50vw, 25vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  <span className="absolute left-2 top-2 rounded-full bg-espresso/85 px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-gold">{p.spec}</span>
                </span>
                <span className="block p-3 sm:p-5">
                  <span className="flex items-center justify-between font-serif text-lg font-bold text-espresso sm:text-xl">
                    {p.name}
                    <ArrowRight className="h-4 w-4 text-crimson transition-transform group-hover:translate-x-1" />
                  </span>
                  <span className="mt-1 hidden text-xs leading-relaxed text-espresso/70 sm:block">{p.line}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Process */}
      <section className="mx-auto max-w-6xl px-4 sm:px-8" aria-labelledby="process-heading">
        <div className="rounded-3xl bg-burgundy p-6 text-ivory sm:p-12">
          <h2 id="process-heading" className="font-display text-4xl font-black uppercase leading-none sm:text-6xl">
            From mill to doorstep
          </h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
            {PROCESS.map(({ icon: Icon, title, line }, i) => (
              <li key={title} className="relative flex gap-4 lg:block">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gold text-espresso">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="lg:mt-4 lg:block">
                  <span className="font-mono text-[10px] text-gold">0{i + 1}</span>
                  <span className="block font-semibold">{title}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-ivory/70">{line}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <TrustStrip />

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 text-center sm:px-8">
        <h2 className="font-serif text-3xl font-bold text-espresso sm:text-4xl">Feel the weight for yourself.</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-espresso/70">Free delivery over ₹1,999 and a 30-day doorstep exchange if the size isn&apos;t right.</p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/shop" className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-burgundy px-8 text-xs font-bold uppercase tracking-[0.2em] text-ivory hover:bg-crimson sm:w-auto">
            Shop all drops <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/complete-the-fit" className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-burgundy px-8 text-xs font-bold uppercase tracking-[0.2em] text-burgundy hover:bg-burgundy/5 sm:w-auto">
            Shop a complete fit
          </Link>
        </div>
      </section>
    </div>
  );
}
