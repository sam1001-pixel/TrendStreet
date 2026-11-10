"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, CheckCircle } from "lucide-react";

interface CustomerReview {
  id: string;
  author: string;
  location: string;
  rating: number;
  date: string;
  productName: string;
  productId: string;
  category: "Oversized" | "Boxy Fit" | "Jackets";
  price: number;
  photoUrl: string;
  sizeBought: string;
  heightWeight: string;
  fitAssessment: "True Oversized" | "Boxy & Structured" | "Cropped & Dropped";
  reviewTitle: string;
  reviewComment: string;
}

const CUSTOMER_REVIEWS: CustomerReview[] = [
  {
    id: "cr-1",
    author: "Aarav Sharma",
    location: "Mumbai",
    rating: 5,
    date: "Oct 16, 2026",
    productName: "Mayfair Heavyweight Tee",
    productId: "ts-001",
    category: "Oversized",
    price: 2499,
    photoUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=400&auto=format&fit=crop",
    sizeBought: "Size L",
    heightWeight: "5'11\" · 74 kg",
    fitAssessment: "True Oversized",
    reviewTitle: "Collar maintains shape after 8 machine washes",
    reviewComment: "The 320gsm combed cotton has an unbelievable hand-feel. Hangs straight down off shoulders with zero cling.",
  },
  {
    id: "cr-2",
    author: "Kabir Mehta",
    location: "Bengaluru",
    rating: 5,
    date: "Oct 12, 2026",
    productName: "Florence Boxy Mohair Knit",
    productId: "ts-003",
    category: "Boxy Fit",
    price: 6499,
    photoUrl: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=400&auto=format&fit=crop",
    sizeBought: "Size M",
    heightWeight: "6'0\" · 76 kg",
    fitAssessment: "Boxy & Structured",
    reviewTitle: "The cropped torso line is cut to perfection",
    reviewComment: "Square 1:1 torso ratio hits right at belt line. Brushed mohair yarn holds structured volume without shedding.",
  },
  {
    id: "cr-3",
    author: "Rohan Varma",
    location: "New Delhi",
    rating: 5,
    date: "Oct 08, 2026",
    productName: "Tokyo Drop-Shoulder Hoodie",
    productId: "ts-002",
    category: "Oversized",
    price: 4999,
    photoUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=400&auto=format&fit=crop",
    sizeBought: "Size XL",
    heightWeight: "6'2\" · 85 kg",
    fitAssessment: "True Oversized",
    reviewTitle: "The double-walled hood stays upright all day",
    reviewComment: "1.4kg pure loopback terry. The 2-ply hood frames the face cleanly without collapsing or sagging backward.",
  },
  {
    id: "cr-4",
    author: "Ishan Patel",
    location: "Pune",
    rating: 5,
    date: "Oct 02, 2026",
    productName: "Tuscan Suede Flight Bomber",
    productId: "ts-010",
    category: "Jackets",
    price: 9999,
    photoUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=400&auto=format&fit=crop",
    sizeBought: "Size M",
    heightWeight: "5'9\" · 70 kg",
    fitAssessment: "Cropped & Dropped",
    reviewTitle: "Italian split suede is breathtakingly soft",
    reviewComment: "Dropped shoulders with cropped rib waist makes legs look longer. Antique nickel hardware glides effortlessly.",
  },
];

export const CustomerReviewGallery: React.FC = () => {
  const [filterSilhouette, setFilterSilhouette] = useState<string>("All");

  const filteredReviews = filterSilhouette === "All"
    ? CUSTOMER_REVIEWS
    : CUSTOMER_REVIEWS.filter((r) => r.category === filterSilhouette);

  return (
    <section className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8">
      {/* Compact Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 sm:mb-6 pb-2.5 border-b border-burgundy/10 gap-3">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-crimson mb-1">
            <CheckCircle className="w-3.5 h-3.5 text-crimson" />
            <span>Verified Fit Checks</span>
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-espresso">
            Worn Across India
          </h2>
          <p className="text-xs text-stone-600 mt-0.5 font-light">
            Real customer height, weight, and silhouette drape assessments.
          </p>
        </div>

        {/* Silhouette Filter Buttons (min 44px touch target) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {["All", "Oversized", "Boxy Fit", "Jackets"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterSilhouette(cat)}
              className={`min-h-[44px] px-3.5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                filterSilhouette === cat
                  ? "bg-espresso text-ivory shadow-xs"
                  : "bg-white text-espresso/70 border border-burgundy/15 hover:border-burgundy/40"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* High-Density Compact Review Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {filteredReviews.map((review) => (
          <div
            key={review.id}
            className="group rounded-xl bg-white border border-burgundy/15 p-4 shadow-xs hover:border-burgundy/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
          >
            {/* Top Row: Stars, Verified Pill & Fit Assessment */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center space-x-0.5">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-gold text-gold" />
                  ))}
                  <span className="text-[10px] font-mono text-stone-400 pl-1">
                    {review.date}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-burgundy/10 text-[9px] font-mono font-bold text-burgundy uppercase">
                  {review.fitAssessment}
                </span>
              </div>

              {/* Title & Comment in compact typography */}
              <div>
                <h4 className="font-serif text-xs sm:text-sm font-bold text-espresso leading-snug line-clamp-1 group-hover:text-burgundy transition-colors">
                  &ldquo;{review.reviewTitle}&rdquo;
                </h4>
                <p className="text-[11px] text-stone-600 leading-relaxed font-light line-clamp-2 mt-1">
                  {review.reviewComment}
                </p>
              </div>
            </div>

            {/* Bottom Row: Customer Avatar + Garment Link */}
            <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-stone-100 border border-burgundy/15 flex-shrink-0">
                  <Image
                    src={review.photoUrl}
                    alt={review.author}
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-espresso block truncate">
                    {review.author}
                  </span>
                  <span className="text-[10px] font-mono text-stone-400 block truncate">
                    {review.location} · {review.sizeBought}
                  </span>
                </div>
              </div>

              <Link
                href={`/product/${review.productId}`}
                className="text-[10px] font-bold text-burgundy hover:text-crimson hover:underline truncate max-w-[90px] text-right flex-shrink-0"
                title={review.productName}
              >
                {review.productName.split(" ").slice(0, 2).join(" ")}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
