import type { Metadata } from "next";
import Link from "next/link";
import { Shirt, Ruler, RefreshCw } from "lucide-react";
import { CompleteTheFit } from "@/components/CompleteTheFit";
import { BUNDLE_PERCENT } from "@/data/looks";

export const metadata: Metadata = {
  title: "Complete the Fit | Styled Outfits — Trend Street",
  description: `Head-to-toe outfits styled by Trend Street. Pick your sizes once and save ${BUNDLE_PERCENT}% when you buy two or more pieces from a look.`,
  alternates: { canonical: "/complete-the-fit" },
};

const HOW = [
  { icon: Shirt, title: "Pick a look", line: "Six outfits styled around one occasion each." },
  { icon: Ruler, title: "Choose sizes & colours", line: "Your saved sizes are filled in for you." },
  { icon: RefreshCw, title: `Save ${BUNDLE_PERCENT}%`, line: "On 2+ pieces. Exchange any piece on its own." },
];

export default function CompleteTheFitPage({ searchParams }: { searchParams?: { look?: string } }) {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-32 pt-6 sm:space-y-12 sm:px-6 sm:pb-20 sm:pt-12 lg:px-8">
      <nav aria-label="Breadcrumb" className="text-xs text-espresso/60">
        <Link href="/" className="hover:text-burgundy">Home</Link> <span aria-hidden>/</span>{" "}
        <span className="font-semibold text-espresso">Complete the Fit</span>
      </nav>

      <header className="grid gap-6 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-crimson">Styled outfits</p>
          <h1 className="mt-1 font-display text-5xl font-black uppercase leading-[0.85] text-espresso sm:text-7xl">
            Complete
            <br />
            the fit
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-espresso/70">
            Proportion is the hard part of streetwear. These looks are already balanced — top, layer and bottom — so all you
            choose is the size.
          </p>
        </div>
        <ol className="grid grid-cols-3 gap-2 lg:col-span-5">
          {HOW.map(({ icon: Icon, title, line }, i) => (
            <li key={title} className="rounded-2xl bg-white p-3 ring-1 ring-burgundy/10 sm:p-4">
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-crimson" />
                <span className="font-mono text-[10px] text-espresso/50">0{i + 1}</span>
              </span>
              <span className="mt-2 block text-xs font-bold text-espresso sm:text-sm">{title}</span>
              <span className="mt-0.5 hidden text-[11px] leading-snug text-espresso/60 sm:block">{line}</span>
            </li>
          ))}
        </ol>
      </header>

      <CompleteTheFit initialLookId={searchParams?.look} />
    </div>
  );
}
