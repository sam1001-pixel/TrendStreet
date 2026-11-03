"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BadgeCheck, ChevronLeft, ChevronRight, Play, Star, X } from "lucide-react";
import { createPortal } from "react-dom";
import type { Review } from "@/types/store";
import { ProductVideo } from "@/components/ProductVideo";

export function Stars({ rating, className = "h-3.5 w-3.5" }: { rating: number; className?: string }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${className} ${n <= Math.round(rating) ? "fill-gold text-gold" : "fill-transparent text-current opacity-30"}`} />
      ))}
    </span>
  );
}

/** Muted looping preview: loads when close to the screen, plays only while mostly visible. */
function PreviewVideo({ src, poster }: { src: string; poster?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setNear(true);
        setInView(e.intersectionRatio > 0.6);
      },
      { threshold: [0, 0.6, 1], rootMargin: "300px 300px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !near) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (inView && !reduce) el.play().catch(() => undefined);
    else el.pause();
  }, [near, inView]);

  return (
    <video
      ref={ref}
      src={near ? src : undefined}
      poster={poster}
      muted
      loop
      playsInline
      preload={near ? "metadata" : "none"}
      aria-hidden
      className="h-full w-full object-cover"
    />
  );
}

export function VideoReviewCard({ review, onOpen, showProduct = true }: { review: Review; onOpen: () => void; showProduct?: boolean }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative aspect-[9/16] w-[62vw] max-w-[240px] flex-shrink-0 snap-start overflow-hidden rounded-2xl bg-espresso text-left shadow-lg sm:w-56"
      aria-label={`Watch ${review.author}'s review${review.productName ? ` of ${review.productName}` : ""}`}
    >
      {review.videoUrl && <PreviewVideo src={review.videoUrl} poster={review.posterUrl} />}
      <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/20" />
      <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition-transform group-hover:scale-110">
        <Play className="ml-0.5 h-4 w-4 fill-white" />
      </span>
      <span className="absolute inset-x-0 bottom-0 space-y-1 p-3 text-white">
        <span className="text-white">
          <Stars rating={review.rating} className="h-3 w-3" />
        </span>
        {review.title && <span className="line-clamp-2 block text-sm font-bold leading-snug">{review.title}</span>}
        <span className="flex items-center gap-1 text-[11px] font-semibold text-white/85">
          {review.author}
          {review.verified && <BadgeCheck className="h-3.5 w-3.5 text-gold" aria-label="Verified buyer" />}
          {review.city && <span className="font-normal text-white/60">· {review.city}</span>}
        </span>
        {showProduct && review.productName && <span className="line-clamp-1 block text-[10px] uppercase tracking-wider text-white/55">{review.productName}</span>}
      </span>
    </button>
  );
}

/** Full-screen, swipeable viewer with sound. */
export function VideoReviewViewer({ reviews, index, onClose }: { reviews: Review[]; index: number; onClose: () => void }) {
  const [i, setI] = useState(index);
  const r = reviews[i];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setI((x) => Math.min(reviews.length - 1, x + 1));
      if (e.key === "ArrowLeft") setI((x) => Math.max(0, x - 1));
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, reviews.length]);

  // Swipe left/right to change review.
  const touchX = useRef<number | null>(null);

  if (!r?.videoUrl || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${r.author}'s video review`}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black animate-[fadeIn_0.2s_ease-out]"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (dx < -60) setI((x) => Math.min(reviews.length - 1, x + 1));
        if (dx > 60) setI((x) => Math.max(0, x - 1));
        touchX.current = null;
      }}
    >
      <div className="relative h-full w-full max-w-[480px] sm:h-[92dvh] sm:overflow-hidden sm:rounded-3xl">
        <ProductVideo
          key={r.id}
          src={r.videoUrl}
          poster={r.posterUrl}
          startMuted={false}
          label={`${r.author}'s review`}
          controlsClassName="right-3 top-[calc(max(0.75rem,env(safe-area-inset-top))+3.5rem)] flex-col"
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-10">
          {reviews.length > 1 && (
            <div className="mb-3 flex gap-1" aria-hidden>
              {reviews.map((x, k) => (
                <span key={x.id} className={`h-0.5 flex-1 rounded-full ${k === i ? "bg-white" : "bg-white/35"}`} />
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 pr-12 text-white">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-crimson text-sm font-bold">{r.author.slice(0, 1)}</span>
            <div className="min-w-0">
              <p className="flex items-center gap-1 truncate text-sm font-bold">
                {r.author} {r.verified && <BadgeCheck className="h-4 w-4 flex-shrink-0 text-gold" aria-label="Verified buyer" />}
              </p>
              <p className="truncate text-[11px] text-white/70">{[r.city, r.date].filter(Boolean).join(" · ")}</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 space-y-2 bg-gradient-to-t from-black/85 to-transparent px-4 pt-12 pb-[max(4.5rem,calc(env(safe-area-inset-bottom)+4rem))] text-white">
          <Stars rating={r.rating} className="h-4 w-4" />
          {r.title && <p className="text-base font-bold">{r.title}</p>}
          {r.comment && <p className="line-clamp-3 text-sm text-white/85">{r.comment}</p>}
          {r.productId && r.productName && (
            <Link
              href={`/product/${r.productId}`}
              onClick={onClose}
              className="pointer-events-auto mt-1 inline-flex min-h-[40px] items-center gap-1 rounded-full bg-white px-4 text-xs font-bold uppercase tracking-wider text-espresso"
            >
              Shop {r.productName.length > 26 ? "this piece" : r.productName} <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {i > 0 && (
          <button
            type="button"
            onClick={() => setI(i - 1)}
            aria-label="Previous review"
            className="absolute left-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white sm:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        {i < reviews.length - 1 && (
          <button
            type="button"
            onClick={() => setI(i + 1)}
            aria-label="Next review"
            className="absolute right-2 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white sm:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}

/** Homepage section: horizontally scrolling video reviews. Renders nothing until reviews with videos exist. */
export function VideoReviewsReel({ reviews }: { reviews: Review[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const withVideo = reviews.filter((r) => r.videoUrl);
  if (!withVideo.length) return null;

  const avg = withVideo.reduce((n, r) => n + r.rating, 0) / withVideo.length;
  const scrollBy = (dir: 1 | -1) => scroller.current?.scrollBy({ left: dir * 260, behavior: "smooth" });

  return (
    <section className="bg-espresso py-10 text-white sm:py-16" aria-labelledby="video-reviews-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-gold">Real fits · real people</p>
            <h2 id="video-reviews-title" className="mt-2 font-serif text-2xl font-extrabold uppercase tracking-tight sm:text-4xl">
              Worn by you
            </h2>
            <p className="mt-2 flex items-center gap-2 text-xs text-white/70">
              <Stars rating={avg} /> {avg.toFixed(1)} from {withVideo.length} video review{withVideo.length > 1 ? "s" : ""}
            </p>
          </div>
          <div className="hidden gap-2 sm:flex">
            <button type="button" onClick={() => scrollBy(-1)} aria-label="Scroll left" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 hover:bg-white hover:text-espresso">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => scrollBy(1)} aria-label="Scroll right" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 hover:bg-white hover:text-espresso">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      <div
        ref={scroller}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-px-4 px-4 sm:scroll-px-6 sm:px-6 lg:px-[max(2rem,calc((100vw-80rem)/2+2rem))]"
      >
        {withVideo.map((r, k) => (
          <VideoReviewCard key={r.id} review={r} onOpen={() => setOpen(k)} />
        ))}
      </div>
      {open !== null && <VideoReviewViewer reviews={withVideo} index={open} onClose={() => setOpen(null)} />}
    </section>
  );
}

/** Product page reviews: video strip plus written reviews. */
export function ProductReviews({ reviews, rating, productName }: { reviews: Review[]; rating: number; productName: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const videos = reviews.filter((r) => r.videoUrl);
  const [showAll, setShowAll] = useState(false);
  const written = reviews.filter((r) => r.comment || r.title);
  const visible = showAll ? written : written.slice(0, 4);

  return (
    <section className="space-y-5 rounded-2xl border border-burgundy/15 bg-white p-4 sm:p-8" aria-labelledby="reviews-title">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-burgundy/10 pb-4">
        <div>
          <h3 id="reviews-title" className="font-serif text-xl font-extrabold uppercase tracking-tight text-espresso sm:text-2xl">
            Reviews
          </h3>
          <p className="mt-0.5 text-xs text-espresso/60">From customers who bought {productName}.</p>
        </div>
        {reviews.length > 0 ? (
          <div className="flex items-center gap-2 text-espresso">
            <span className="text-3xl font-extrabold">{rating.toFixed(1)}</span>
            <div>
              <Stars rating={rating} className="h-4 w-4" />
              <span className="text-[11px] text-espresso/60">
                {reviews.length} review{reviews.length > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-xs font-semibold text-espresso/60">No reviews yet</span>
        )}
      </div>

      {videos.length > 0 && (
        <div className="-mx-4 sm:mx-0">
          <p className="mb-2 px-4 text-[11px] font-bold uppercase tracking-[0.2em] text-crimson sm:px-0">Video reviews</p>
          <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 sm:px-0">
            {videos.map((r, k) => (
              <VideoReviewCard key={r.id} review={r} showProduct={false} onOpen={() => setOpen(k)} />
            ))}
          </div>
        </div>
      )}

      {visible.length > 0 ? (
        <div className="space-y-3">
          {visible.map((rev) => (
            <article key={rev.id} className="space-y-1.5 rounded-xl border border-burgundy/10 bg-ivory p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5 text-xs font-bold text-espresso">
                  <span className="truncate">{rev.author}</span>
                  {rev.verified && (
                    <span className="flex flex-shrink-0 items-center gap-0.5 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-800">
                      <BadgeCheck className="h-3 w-3" /> Verified buyer
                    </span>
                  )}
                </span>
                <span className="flex-shrink-0 text-[11px] text-espresso/50">{rev.date}</span>
              </div>
              <span className="text-espresso">
                <Stars rating={rev.rating} />
              </span>
              {rev.title && <h4 className="text-sm font-semibold text-espresso">{rev.title}</h4>}
              {rev.comment && <p className="text-sm leading-relaxed text-espresso/75">{rev.comment}</p>}
              {rev.videoUrl && (
                <button type="button" onClick={() => setOpen(videos.findIndex((v) => v.id === rev.id))} className="flex min-h-[36px] items-center gap-1 text-xs font-bold text-crimson">
                  <Play className="h-3.5 w-3.5 fill-current" /> Watch video
                </button>
              )}
            </article>
          ))}
          {written.length > 4 && !showAll && (
            <button type="button" onClick={() => setShowAll(true)} className="min-h-[44px] w-full rounded-full border border-burgundy/20 text-xs font-bold uppercase tracking-wider text-espresso">
              Show all {written.length} reviews
            </button>
          )}
        </div>
      ) : (
        videos.length === 0 && <p className="text-sm text-espresso/60">Be the first to review this piece after your order arrives.</p>
      )}

      {open !== null && open >= 0 && <VideoReviewViewer reviews={videos} index={open} onClose={() => setOpen(null)} />}
    </section>
  );
}
