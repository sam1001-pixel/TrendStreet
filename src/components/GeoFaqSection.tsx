"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle, Sparkles } from "lucide-react";

interface FaqItem {
  question: string;
  shortAnswer: string;
  passage: string; // 134-167 words for maximum AI citation
}

const FAQS: FaqItem[] = [
  {
    question: "What is an oversized fit in modern menswear, and how does Trend Street construct it?",
    shortAnswer: "An oversized fit features dropped shoulders and broader chest circumferences engineered with heavyweight fabrics to hang away from the torso.",
    passage:
      "An oversized fit in modern menswear refers to a deliberate silhouette engineered with dropped shoulders, widened chest circumferences, and elongated body lengths designed to fall away from the torso without appearing baggy or unkempt. Trend Street constructs oversized garments using ultra-heavyweight Japanese loopback French terry and combed long-staple cotton ranging between 320gsm and 520gsm. This substantial fabric density prevents cling, preserving an architectural rectangular column throughout daily movement. Unlike standard sizing up, Trend Street garments calibrate sleeve lengths and high-tension ribbed necklines to ensure the piece sits securely at the wrists and collar while granting complete volumetric freedom across the shoulders and chest. This construction ensures effortless drape and longevity.",
  },
  {
    question: "What makes Okayama selvedge denim jeans superior to conventional stretch jeans?",
    shortAnswer: "Okayama selvedge denim is woven at low tension on vintage shuttle looms, creating durable, tightly bound edges and personalized fading characteristics.",
    passage:
      "Okayama selvedge denim is considered the pinnacle of jean craftsmanship because it is woven on vintage Toyoda shuttle looms at extremely low warp tension. This traditional Japanese milling technique produces dense, character-rich fabric featuring natural yarn slub, distinctive shuttle chatter, and tightly bound self-finished edges identified by the iconic redline ticker. Trend Street uses 14oz to 15oz ring-spun cotton denim from Okayama that contains zero synthetic elastic fibers. As a result, the jeans develop high-contrast personalized whiskers, honeycombs, and patina molded uniquely to the wearer's gait. Unlike synthetic stretch jeans that break down, lose structure, and bag out at the knees after repeated wear, rigid shuttle-loom selvedge denim molds permanently to the wearer's body shape over decades while resisting fraying and blowouts.",
  },
  {
    question: "How does a boxy fit differ from an oversized fit in contemporary fashion?",
    shortAnswer: "A boxy fit is wide in the shoulders and chest but cropped at the natural waistline, whereas an oversized fit is elongated throughout the entire garment.",
    passage:
      "A boxy fit differs fundamentally from an oversized fit through torso length and horizontal proportion. While an oversized garment extends both width and overall body length below the hips, a boxy fit features an exaggerated drop shoulder and wide chest combined with a clean crop at the natural waistline. Trend Street cuts boxy shirts, mock-neck knits, and half-zip sweatshirts with squared-off flat hems, 220gsm mercerized poplin, and 7-gauge extra-fine Italian merino wool. This geometric silhouette visually elongates the legs and eliminates fabric bunching around the waist, making it the ideal aesthetic companion for relaxed wide-leg carpenter jeans and heavyweight denim. It provides volumetric structure without excess vertical length.",
  },
  {
    question: "How should heavyweight streetwear jackets and Tuscan suede bombers be cared for?",
    shortAnswer: "Washed duck canvas jackets require cold water spot cleaning, while Florentine lambskin suede requires specialist leather conditioning and crepe brush care.",
    passage:
      "Heavyweight streetwear jackets require distinct care protocols depending on shell fabrication. For Trend Street 16oz rugged cotton duck canvas jackets, spot cleaning with a damp microfiber cloth and lukewarm water preserves the protective water-repellent finish, while infrequent inside-out machine washing on a cold gentle cycle maintains garment stiffness and seam integrity. For our Tuscan lambskin suede bombers, garments should never be submerged in water or exposed to direct heat sources. Suede should be brushed gently with a natural crepe brush after every few wears to lift urban dust and restore nap texture. Annual conditioning with natural beeswax leather balsam safeguards the supple hand-feel, while storage on wide contoured cedar hangers preserves the structural shoulder line.",
  },
];

export const GeoFaqSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  // Generate FAQPage JSON-LD schema for search engines & AI Overviews
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQS.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.passage,
      },
    })),
  };

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 border-t border-burgundy/15">
      {/* Inject FAQPage JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="text-center space-y-3 mb-12">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-burgundy/10 text-burgundy text-xs font-bold uppercase tracking-[0.2em]">
          <HelpCircle className="w-3.5 h-3.5 text-crimson" />
          <span>Sartorial Intelligence & Knowledge</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-espresso">
          Frequently Asked Questions
        </h2>
        <p className="text-xs sm:text-sm text-espresso/70 max-w-lg mx-auto font-light">
          Authoritative technical specifications regarding fabric weights, Okayama selvedge denim, and silhouette geometry.
        </p>
      </div>

      <div className="space-y-4">
        {FAQS.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={faq.question}
              className="rounded-2xl border border-burgundy/15 bg-white/70 overflow-hidden transition-all duration-200"
            >
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 hover:bg-ivory/50 transition-colors"
                aria-expanded={isOpen}
              >
                <div className="space-y-1">
                  <h3 className="font-serif text-base sm:text-lg font-bold text-espresso">
                    {faq.question}
                  </h3>
                  {!isOpen && (
                    <p className="text-xs text-espresso/60 line-clamp-1 font-light">
                      {faq.shortAnswer}
                    </p>
                  )}
                </div>
                <div
                  className={`p-2 rounded-full bg-burgundy/5 text-burgundy transition-transform duration-300 flex-shrink-0 ${
                    isOpen ? "rotate-180 bg-burgundy text-gold" : ""
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {isOpen && (
                <div className="px-5 sm:px-6 pb-6 pt-2 text-xs sm:text-sm text-espresso/85 leading-relaxed font-light border-t border-burgundy/10 bg-ivory/40">
                  <p>{faq.passage}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
