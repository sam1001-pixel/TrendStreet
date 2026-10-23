"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Star,
  CheckCircle,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Ruler,
} from "lucide-react";
import { formatPrice } from "@/lib/pricing";

interface CustomerReview {
  id: string;
  author: string;
  location: string;
  rating: number;
  date: string;
  productName: string;
  productId: string;
  category: "Oversized" | "Jeans" | "Boxy Fit" | "Jackets";
  price: number;
  photoUrl: string;
  sizeBought: string;
  heightWeight: string;
  fitAssessment: "True Oversized" | "Perfect Stacking" | "Boxy & Structured" | "Cropped & Dropped";
  reviewTitle: string;
  reviewComment: string;
}

const CUSTOMER_REVIEWS: CustomerReview[] = [
  {
    id: "cr-1",
    author: "Aarav Sharma",
    location: "Bandra West, Mumbai",
    rating: 5,
    date: "October 16, 2026",
    productName: "The Mayfair Heavyweight Tee",
    productId: "ts-001",
    category: "Oversized",
    price: 2499,
    photoUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1200&auto=format&fit=crop",
    sizeBought: "Size L",
    heightWeight: "5'11\" (180 cm) · 74 kg",
    fitAssessment: "True Oversized",
    reviewTitle: "The collar doesn't sag after 8 machine washes",
    reviewComment: "The 320gsm combed cotton has an unbelievable hand-feel. It hangs straight down off the shoulders and maintains that structured boxy silhouette all day in Mumbai humidity.",
  },
  {
    id: "cr-2",
    author: "Kabir Mehta",
    location: "Indiranagar, Bengaluru",
    rating: 5,
    date: "October 12, 2026",
    productName: "The Shibuya Carpenter Selvedge",
    productId: "ts-004",
    category: "Jeans",
    price: 5499,
    photoUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1200&auto=format&fit=crop",
    sizeBought: "Size 32",
    heightWeight: "6'1\" (185 cm) · 78 kg",
    fitAssessment: "Perfect Stacking",
    reviewTitle: "Immaculate puddle break over my sneakers",
    reviewComment: "Genuine vintage Toyoda loom selvedge. The redline ticker on the turn-up cuff is crisp, and the leg opening puddles over low Dunks without dragging on the floor.",
  },
  {
    id: "cr-3",
    author: "Rohan Varma",
    location: "Vasant Vihar, New Delhi",
    rating: 5,
    date: "October 08, 2026",
    productName: "The Tokyo Drop-Shoulder Hoodie",
    productId: "ts-002",
    category: "Oversized",
    price: 4999,
    photoUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop",
    sizeBought: "Size XL",
    heightWeight: "6'2\" (188 cm) · 85 kg",
    fitAssessment: "True Oversized",
    reviewTitle: "The hood actually stays upright",
    reviewComment: "Weighs over 1.4kg in French terry. The double-layered standing hood doesn't collapse at all. By far the heaviest and most luxurious hoodie in India.",
  },
  {
    id: "cr-4",
    author: "Ishan Patel",
    location: "Koregaon Park, Pune",
    rating: 5,
    date: "October 02, 2026",
    productName: "The Tuscan Suede Flight Bomber",
    productId: "ts-010",
    category: "Jackets",
    price: 9999,
    photoUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1200&auto=format&fit=crop",
    sizeBought: "Size M",
    heightWeight: "5'9\" (175 cm) · 70 kg",
    fitAssessment: "Cropped & Dropped",
    reviewTitle: "Italian split suede is breathtaking",
    reviewComment: "The dropped shoulder volume with a cropped waistband makes your legs look miles longer. RiRi antique hardware glides like butter.",
  },
];

export const CustomerReviewGallery: React.FC = () => {
  const [filterSilhouette, setFilterSilhouette] = useState<string>("All");

  const filteredReviews = filterSilhouette === "All"
    ? CUSTOMER_REVIEWS
    : CUSTOMER_REVIEWS.filter((r) => r.category === filterSilhouette);

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 pb-3 border-b border-stone-200 gap-3">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-burgundy/10 text-burgundy text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-crimson" />
            <span>Verified Customer Fit Checks</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-stone-950">
            Worn Across The Streets of India
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-xl font-light">
            Real photos, height/weight metrics, and drape assessments from verified Trend Street collectors.
          </p>
        </div>

        {/* Silhouette Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {["All", "Oversized", "Jeans", "Jackets"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterSilhouette(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                filterSilhouette === cat
                  ? "bg-burgundy text-white shadow-xs"
                  : "bg-white text-stone-600 border border-stone-200 hover:border-stone-400"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Review Cards Grid with Authentic Photos */}
      <div className="no-scrollbar -mx-3 flex snap-x snap-mandatory gap-4 overflow-x-auto px-3 pb-2 sm:gap-6 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-4">
        {filteredReviews.map((review) => (
          <div
            key={review.id}
            data-reveal
            className="group w-[80%] flex-shrink-0 snap-start rounded-2xl bg-white border border-stone-200 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between md:w-auto"
          >
            {/* Real Customer Styling Photo */}
            <div className="relative aspect-[4/5] bg-stone-100 overflow-hidden">
              <Image
                src={review.photoUrl}
                alt={`${review.author} wearing ${review.productName}`}
                fill
                sizes="(max-width: 768px) 80vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />

              {/* Scrim Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />

              {/* Top Verified Pill */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-bold text-stone-900 flex items-center gap-1 shadow-xs">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span>Verified Fit</span>
                </span>
                <span className="px-2.5 py-1 rounded-full bg-burgundy/90 backdrop-blur-sm text-[9px] font-mono font-bold text-white uppercase shadow-xs">
                  {review.fitAssessment}
                </span>
              </div>

              {/* Bottom In-Image Metric Bar */}
              <div className="absolute bottom-3 left-3 right-3 z-10 text-white space-y-0.5">
                <span className="text-[10px] font-mono text-stone-200 block">
                  {review.heightWeight} · {review.sizeBought}
                </span>
                <span className="text-xs font-bold text-white block">
                  {review.author} · {review.location}
                </span>
              </div>
            </div>

            {/* Review Testimonial Details */}
            <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between bg-white space-y-3">
              <div className="space-y-2">
                {/* 5-Star Rating */}
                <div className="flex items-center space-x-1">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-gold text-gold" />
                  ))}
                  <span className="text-[10px] font-mono text-stone-400 pl-1">
                    {review.date}
                  </span>
                </div>

                {/* Review Headline & Body */}
                <h4 className="font-serif text-sm sm:text-base font-bold text-stone-950 leading-snug">
                  &ldquo;{review.reviewTitle}&rdquo;
                </h4>

                <p className="text-xs text-stone-600 leading-relaxed font-light line-clamp-3">
                  {review.reviewComment}
                </p>
              </div>

              {/* Reviewed Item Anchor */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase font-mono text-stone-400 block">
                    Reviewed Garment:
                  </span>
                  <Link
                    href={`/product/${review.productId}`}
                    className="text-xs font-bold text-burgundy hover:underline line-clamp-1 block"
                  >
                    {review.productName}
                  </Link>
                </div>
                <span className="text-xs font-serif font-bold text-stone-900">
                  {formatPrice(review.price)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
