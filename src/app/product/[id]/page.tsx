"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Heart,
  ShoppingBag,
  Star,
  Check,
  ChevronDown,
  ChevronUp,
  Truck,
  RotateCcw,
  ShieldCheck,
  Ruler,
  Sparkles,
  ArrowRight,
  Eye,
  Share2,
  Copy,
  CheckCircle2,
  MapPin,
  Clock,
  Layers,
  ArrowLeft,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { ProductCard } from "@/components/ProductCard";
import { formatPrice } from "@/lib/pricing";
import { checkPincodeServiceability } from "@/lib/pincode";
import { SITE_URL } from "@/lib/site";

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { products, addToCart, toggleWishlist, isInWishlist } = useStore();

  const product = products.find((p) => p.id === id);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [chartUnit, setChartUnit] = useState<"cm" | "in">("cm");
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Delivery Pincode checker state
  const [pincode, setPincode] = useState("");
  const [deliveryResult, setDeliveryResult] = useState<string | null>(null);
  const [isCheckingPincode, setIsCheckingPincode] = useState(false);

  // Accordion tabs state
  const [openSection, setOpenSection] = useState<string | null>("details");

  // Swipeable photo gallery (phones) kept in sync with the thumbnails (larger screens).
  const galleryRef = useRef<HTMLDivElement>(null);

  // The phone add-to-bag bar only appears once the main Add to bag button has scrolled away.
  const mainCtaRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  useEffect(() => {
    let frame = 0;
    const check = () => {
      frame = 0;
      const el = mainCtaRef.current;
      setShowStickyBar(!!el && el.getBoundingClientRect().bottom < 0);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [product?.id]);

  useEffect(() => {
    if (product) {
      if (product.sizes?.length && !selectedSize) {
        setSelectedSize(product.sizes[0]);
      }
      if (product.colors?.length && !selectedColor) {
        setSelectedColor(product.colors[0].name);
      }
    }
  }, [product, selectedSize, selectedColor]);

  if (!product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-28 text-center space-y-6">
        <h1 className="text-3xl font-serif font-bold text-espresso">Silhouette Piece Not Found</h1>
        <p className="text-espresso/70 text-sm max-w-md mx-auto">
          The requested garment may have been archived or is temporarily out of season. Explore our ongoing collections across Oversized, Jeans, Boxy Fit, and Jackets.
        </p>
        <div className="pt-2">
          <Link
            href="/shop"
            className="px-8 py-3 bg-burgundy text-ivory text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-crimson transition-colors inline-block"
          >
            Explore All 4 Silhouettes
          </Link>
        </div>
      </div>
    );
  }

  const isFavorited = isInWishlist(product.id);

  const handleAddToCart = () => {
    addToCart(product, selectedSize || product.sizes[0], selectedColor || product.colors[0]?.name, quantity);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2000);
  };

  const handleShareCopy = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  const handleCheckDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || pincode.trim().length === 0) return;
    setIsCheckingPincode(true);
    setTimeout(() => {
      setIsCheckingPincode(false);
      const res = checkPincodeServiceability(pincode);
      setDeliveryResult(res.message);
    }, 400);
  };

  const onGalleryScroll = () => {
    const el = galleryRef.current;
    if (!el || !el.clientWidth) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== activeImageIndex) setActiveImageIndex(i);
  };

  const showImage = (i: number) => {
    setActiveImageIndex(i);
    const el = galleryRef.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  // Discount calculation
  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-12 sm:space-y-16 pb-24 md:pb-16">
      {/* 1. BREADCRUMB NAVIGATION */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-espresso/60 overflow-x-auto no-scrollbar whitespace-nowrap">
        <Link href="/" className="hover:text-burgundy transition-colors">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-burgundy transition-colors">Men</Link>
        <span>/</span>
        <Link
          href={`/${product.category.toLowerCase().replace(/\s+/g, "-")}`}
          className="hover:text-burgundy font-medium transition-colors"
        >
          {product.category}
        </Link>
        <span>/</span>
        <span className="font-semibold text-espresso truncate max-w-xs">{product.name}</span>
      </nav>

      {/* 2. MAIN DUAL-COLUMN PDP LAYOUT (Sticky Gallery + Sticky Purchasing Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* LEFT COLUMN: Media Gallery & 3D Interactive WebGL (col-span-7) */}
        <div className="lg:col-span-7 lg:sticky lg:top-24 space-y-4">
          {/* Photos: swipe on phones, thumbnails on larger screens */}
          <div className="relative -mx-4 sm:mx-0">
            <div
              ref={galleryRef}
              onScroll={onGalleryScroll}
              className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain bg-ivory-dark sm:overflow-hidden sm:rounded-2xl sm:border sm:border-burgundy/15 sm:shadow-md"
              aria-label="Product photos"
            >
              {product.images.map((img, idx) => (
                <div key={img} className="relative aspect-[4/5] w-full flex-shrink-0 snap-center sm:aspect-[3/4]">
                  <Image
                    src={img}
                    alt={idx === 0 ? product.name : `${product.name}, photo ${idx + 1}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    className="object-cover object-center"
                    priority={idx === 0}
                  />
                </div>
              ))}
            </div>

            {/* Badges */}
            <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-col items-start gap-2">
              {product.isNew && (
                <span className="rounded bg-espresso px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-ivory shadow-sm">New drop</span>
              )}
              {product.isBestSeller && (
                <span className="rounded bg-burgundy px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-gold shadow-sm">Best seller</span>
              )}
            </div>

            {product.images.length > 1 && (
              <>
                {/* Photo counter + dots (phones) */}
                <span className="pointer-events-none absolute right-4 top-4 z-10 rounded-full bg-espresso/70 px-2.5 py-1 font-mono text-[11px] font-bold text-ivory backdrop-blur sm:hidden">
                  {activeImageIndex + 1} / {product.images.length}
                </span>
                <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5 sm:hidden" aria-hidden>
                  {product.images.map((img, idx) => (
                    <span
                      key={img}
                      className={`h-1.5 rounded-full transition-all ${idx === activeImageIndex ? "w-5 bg-white" : "w-1.5 bg-white/55"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Thumbnails (tablet and up) */}
          {product.images.length > 1 && (
            <div className="hidden grid-cols-4 gap-3 sm:grid">
              {product.images.map((img, idx) => (
                <button
                  key={img}
                  onClick={() => showImage(idx)}
                  className={`relative aspect-[3/4] overflow-hidden rounded-xl border-2 transition-all ${
                    activeImageIndex === idx ? "border-burgundy ring-2 ring-burgundy/30 shadow-sm" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                  aria-label={`Show photo ${idx + 1}`}
                  aria-current={activeImageIndex === idx}
                >
                  <Image src={img} alt="" fill sizes="15vw" className="object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Quick Textile Provenance Callout */}
          <div className="p-3.5 bg-ivory rounded-xl border border-burgundy/15 flex items-center justify-between gap-3 text-xs text-espresso/80">
            <div className="flex min-w-0 items-center gap-2">
              <Layers className="w-4 h-4 text-burgundy flex-shrink-0" />
              <span><strong>Pure Textile:</strong> {product.fabric}</span>
            </div>
            <span className="flex-shrink-0 text-[11px] font-mono text-gold bg-espresso px-2 py-0.5 rounded font-bold">
              Zero Synthetics
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: Product Info & Purchasing Sidebar (col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Header & Product Identity */}
          <div className="space-y-1.5 pb-4 border-b border-burgundy/15">
            <div className="flex items-center justify-between text-xs text-espresso/70">
              <Link
                href={`/${product.category.toLowerCase().replace(/\s+/g, "-")}`}
                className="font-bold uppercase tracking-[0.2em] text-crimson hover:underline"
              >
                {product.category}
              </Link>
              {product.reviewsCount > 0 ? (
                <div className="flex items-center space-x-1.5 bg-ivory px-2.5 py-1 rounded-full border border-burgundy/15">
                  <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                  <span className="font-bold text-espresso text-xs">{product.rating}</span>
                  <span className="text-espresso/50 text-[11px]">({product.reviewsCount} reviews)</span>
                </div>
              ) : (
                <span className="rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-gold-dark">New drop</span>
              )}
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-espresso leading-tight">
              {product.name}
            </h1>
            <p className="text-xs text-espresso/70 italic">{product.subtitle}</p>

            {/* Price Box with MRP & Taxes Transparency */}
            <div className="pt-2 flex flex-wrap items-baseline gap-2.5">
              <span className="text-2xl sm:text-3xl font-bold text-burgundy">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-sm sm:text-base text-espresso/40 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
              {discountPercent && (
                <span className="text-xs font-bold text-gold bg-burgundy px-2.5 py-0.5 rounded-full">
                  {discountPercent}% OFF
                </span>
              )}
              <span className="text-[11px] text-espresso/60 block w-full">
                Inclusive of GST • Free delivery over ₹1,999
              </span>
            </div>
          </div>

          {/* Offer banner — only when this piece alone meets the code's ₹1,999 minimum */}
          {product.price >= 1999 && (
          <div className="p-3.5 bg-burgundy/10 rounded-xl border border-burgundy/25 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold flex-shrink-0" />
              <span className="text-espresso font-medium">
                Get it for <strong className="text-burgundy font-bold">{formatPrice(Math.round(product.price * 0.9))}</strong> with code <strong className="font-mono text-crimson">TREND10</strong>
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase text-burgundy bg-white px-2 py-0.5 rounded border border-burgundy/20 flex-shrink-0">
              Save 10%
            </span>
          </div>
          )}

          {/* Color Variant Picker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-espresso">
              <span>Color: <span className="font-semibold text-burgundy">{selectedColor || product.colors[0]?.name}</span></span>
              <span className="text-[11px] text-espresso/50 font-normal">{product.colors.length} Variants</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {product.colors.map((color) => {
                const isSelected = (selectedColor || product.colors[0]?.name) === color.name;
                return (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? "border-burgundy ring-2 ring-burgundy/30 scale-110 shadow-xs"
                        : "border-black/20 hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                    aria-label={`Select color ${color.name}`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Selector with Oval Buttons & Size Chart */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between text-xs font-bold text-espresso">
              <span>Please select a size.</span>
              <button
                onClick={() => setIsSizeGuideOpen(true)}
                className="-my-2 -mr-2 flex min-h-[44px] items-center gap-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-burgundy hover:underline"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>Size Chart</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => {
                const isSelected = (selectedSize || product.sizes[0]) === size;
                return (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[52px] h-11 px-3 text-xs font-bold rounded-full border transition-all flex items-center justify-center ${
                      isSelected
                        ? "bg-burgundy text-gold border-burgundy shadow-sm scale-105"
                        : "bg-white text-espresso border-burgundy/20 hover:border-burgundy"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>

            {/* Dynamic Stock Scarcity Status */}
            <p className="text-xs text-espresso/65 flex items-center gap-1.5 pt-0.5">
              <span className={`w-2 h-2 rounded-full ${!product.inStock ? "bg-crimson" : product.stockCount < 10 ? "bg-gold" : "bg-green-700"}`} />
              <span>
                {!product.inStock
                  ? "Sold out"
                  : product.stockCount < 10
                    ? `Only ${product.stockCount} left — ships within 24 hours`
                    : "In stock — ships within 24 hours"}
              </span>
            </p>
          </div>

          {/* Quantity + Add to bag + Save */}
          <div ref={mainCtaRef} className="space-y-3 pt-2">
            <div className="flex items-stretch gap-2.5">
              <div className="flex flex-shrink-0 items-center rounded-xl border border-burgundy/30 bg-white">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="flex h-12 w-11 items-center justify-center text-lg font-bold text-espresso/70 hover:text-burgundy disabled:opacity-30"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm font-bold tabular-nums text-espresso" aria-live="polite" aria-label={`Quantity ${quantity}`}>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(10, quantity + 1))}
                  disabled={quantity >= 10}
                  className="flex h-12 w-11 items-center justify-center text-lg font-bold text-espresso/70 hover:text-burgundy disabled:opacity-30"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className={`flex min-h-[48px] min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 text-sm font-bold uppercase tracking-wider shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:tracking-[0.15em] ${
                  addedAnimation ? "bg-green-800 text-white" : "bg-burgundy text-gold hover:bg-crimson"
                }`}
              >
                {addedAnimation ? (
                  <>
                    <Check className="h-4 w-4" /> Added
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4 flex-shrink-0" />
                    {product.inStock ? "Add to bag" : "Sold out"}
                    <span className="hidden font-semibold normal-case tracking-normal sm:inline">· {formatPrice(product.price * quantity)}</span>
                  </>
                )}
              </button>

              <button
                onClick={() => toggleWishlist(product.id)}
                className={`flex w-12 flex-shrink-0 items-center justify-center rounded-xl border transition-colors ${
                  isFavorited ? "border-crimson bg-crimson text-ivory shadow-xs" : "border-burgundy/20 bg-white text-espresso hover:text-crimson"
                }`}
                aria-label={isFavorited ? "Remove from saved" : "Save for later"}
                aria-pressed={isFavorited}
              >
                <Heart className={`h-5 w-5 ${isFavorited ? "fill-current" : ""}`} />
              </button>
            </div>

            {product.inStock && (
              <Link
                href="/checkout"
                onClick={() => addToCart(product, selectedSize || product.sizes[0], selectedColor || product.colors[0]?.name, quantity)}
                className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-espresso text-sm font-bold uppercase tracking-[0.15em] text-ivory shadow-md transition-colors hover:bg-black"
              >
                Buy it now
              </Link>
            )}
          </div>

          {/* Share */}
          <div className="flex flex-wrap items-center gap-2 border-y border-burgundy/10 py-3 text-xs text-espresso/70">
            <span className="mr-auto font-semibold">Share</span>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Check out ${product.name} on Trend Street: ${SITE_URL}/product/${product.id}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[40px] items-center rounded-lg border border-burgundy/15 bg-ivory px-3 text-xs font-bold hover:text-burgundy"
            >
              WhatsApp
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${product.name} from Trend Street`)}&url=${encodeURIComponent(`${SITE_URL}/product/${product.id}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[40px] items-center rounded-lg border border-burgundy/15 bg-ivory px-3 text-xs font-bold hover:text-burgundy"
              aria-label="Share on X"
            >
              X
            </a>
            <button
              onClick={handleShareCopy}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-burgundy/15 bg-ivory px-3 text-xs font-bold hover:text-burgundy"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-green-700" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedLink ? "Copied" : "Copy link"}
            </button>
          </div>

          {/* Delivery & Postal Code Checker */}
          <div className="p-4 bg-white rounded-xl border border-burgundy/15 shadow-2xs space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-espresso">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-burgundy" />
                <span>Delivery & Shipping Estimate</span>
              </div>
              <span className="text-[11px] text-espresso/50 font-normal">Across India</span>
            </div>

            <form onSubmit={handleCheckDelivery} className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                aria-label="PIN code"
                placeholder="6-digit PIN code"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                className="min-h-[44px] min-w-0 flex-1 rounded-lg border border-burgundy/20 bg-ivory px-3 text-sm focus:border-burgundy focus:outline-none"
              />
              <button
                type="submit"
                disabled={isCheckingPincode || pincode.length !== 6}
                className="min-h-[44px] rounded-lg bg-espresso px-4 text-xs font-bold uppercase tracking-wider text-ivory transition-colors hover:bg-black disabled:opacity-50"
              >
                {isCheckingPincode ? "Checking…" : "Check"}
              </button>
            </form>

            {deliveryResult ? (
              <p className="text-[11px] text-green-800 bg-green-50 p-2.5 rounded border border-green-200 leading-relaxed animate-in fade-in">
                {deliveryResult}
              </p>
            ) : (
              <p className="text-[11px] text-espresso/60 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gold" />
                <span>Orders dispatched within 24 hours from Mumbai Bandra West Atelier.</span>
              </p>
            )}
          </div>

          {/* 30-Day Hassle-Free Returns Trust Box */}
          <div className="p-3.5 bg-ivory rounded-xl border border-burgundy/15 flex items-start gap-3 text-xs text-espresso/80">
            <RotateCcw className="w-5 h-5 text-burgundy flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block text-espresso font-bold">Complimentary 30-Day Returns & Exchanges</strong>
              <p className="text-[11px] text-espresso/70 leading-relaxed mt-0.5">
                Eligible for seamless return or size exchange under our 30-day policy. Complimentary doorstep collection arranged with zero hassle.
              </p>
            </div>
          </div>

          {/* Key Menswear Specification Chips */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-espresso/80 pt-1">
            <div className="p-2.5 bg-white rounded-lg border border-burgundy/15 flex items-center gap-2">
              <Truck className="w-4 h-4 text-gold flex-shrink-0" />
              <span>Free Courier Over ₹1,999</span>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-burgundy/15 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-gold flex-shrink-0" />
              <span>Certified Seam Integrity</span>
            </div>
          </div>

          {/* Expandable Accordion Tabs (Details, Fabric, Care) */}
          <div className="pt-2 divide-y divide-burgundy/15 border-t border-burgundy/15">
            {/* Accordion 1: Details & Construction */}
            <div className="py-1">
              <button
                onClick={() => toggleSection("details")}
                className="w-full min-h-[48px] flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-wider text-espresso text-left"
              >
                <span>Details & fit</span>
                {openSection === "details" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openSection === "details" && (
                <ul className="mt-3 space-y-1.5 text-xs text-espresso/75 pl-4 list-disc animate-in fade-in">
                  {product.details.map((det, i) => (
                    <li key={i}>{det}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* Accordion 2: Fabric & Mill Provenance */}
            <div className="py-1">
              <button
                onClick={() => toggleSection("fabric")}
                className="w-full min-h-[48px] flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-wider text-espresso text-left"
              >
                <span>Fabric & origin</span>
                {openSection === "fabric" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openSection === "fabric" && (
                <div className="mt-3 space-y-2 text-xs text-espresso/75 animate-in fade-in leading-relaxed">
                  <p className="font-semibold text-burgundy">{product.fabric}</p>
                  <p>
                    Woven and knitted on low-tension shuttle looms in Okayama and Hamamatsu, Japan, and finished in Biella and Florence, Italy. We reject synthetic polyester and elastane blends to ensure natural breathability and long-term silhouette memory.
                  </p>
                </div>
              )}
            </div>

            {/* Accordion 3: Garment Care */}
            <div className="py-1">
              <button
                onClick={() => toggleSection("care")}
                className="w-full min-h-[48px] flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-wider text-espresso text-left"
              >
                <span>Care</span>
                {openSection === "care" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openSection === "care" && (
                <ul className="mt-3 space-y-1.5 text-xs text-espresso/75 pl-4 list-disc animate-in fade-in">
                  {product.careInstructions.map((inst, i) => (
                    <li key={i}>{inst}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. PHONE ADD-TO-BAG BAR — slides up once the main button has scrolled out of view */}
      <div
        className={`md:hidden fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-burgundy/20 bg-white/95 px-4 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-md transition-transform duration-300 ${
          showStickyBar ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
        aria-hidden={!showStickyBar}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <Image
            src={product.images[activeImageIndex] || product.images[0]}
            alt=""
            width={40}
            height={48}
            className="h-12 w-10 flex-shrink-0 rounded-md border border-burgundy/15 object-cover"
          />
          <div className="min-w-0">
            <span className="block truncate text-xs font-bold text-espresso">{product.name}</span>
            <span className="text-xs text-espresso/60">
              <strong className="font-serif text-burgundy">{formatPrice(product.price)}</strong> · Size {selectedSize || product.sizes[0]}
            </span>
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={!product.inStock}
          tabIndex={showStickyBar ? 0 : -1}
          className={`flex min-h-[44px] flex-shrink-0 items-center gap-1.5 rounded-xl px-4 text-xs font-bold uppercase tracking-wider shadow-md transition-colors disabled:opacity-50 ${
            addedAnimation ? "bg-green-800 text-white" : "bg-burgundy text-gold hover:bg-crimson"
          }`}
        >
          {addedAnimation ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
          <span>{addedAnimation ? "Added" : product.inStock ? "Add to bag" : "Sold out"}</span>
        </button>
      </div>

      {/* 4. OTHERS ALSO BOUGHT / COMPLETE THE LOOK */}
      {relatedProducts.length > 0 && (
        <section className="pt-8 border-t border-burgundy/15 space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-crimson block mb-0.5">
                Complete The Silhouette
              </span>
              <h2 className="font-serif text-2xl font-bold text-espresso">
                Others Also Bought
              </h2>
            </div>
            <Link
              href={`/${product.category.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-xs font-bold uppercase tracking-wider text-burgundy hover:text-crimson flex items-center gap-1"
            >
              <span>View All {product.category}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* 5. VERIFIED CUSTOMER REVIEWS & FIT RATING */}
      <section className="bg-white rounded-2xl border border-burgundy/15 p-6 sm:p-10 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-burgundy/10 gap-4">
          <div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-espresso">
              Client Feedback & Fit Verification
            </h3>
            <p className="text-xs text-espresso/60 mt-0.5">
              Certified reviews from verified Trend Street collectors.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="block font-serif text-2xl font-bold text-espresso">
                {product.reviewsCount > 0 ? `${product.rating} / 5.0` : "No reviews yet"}
              </span>
            </div>
            <div className="p-3 bg-burgundy/10 text-burgundy rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Existing Reviews */}
        {product.reviews && product.reviews.length > 0 ? (
          <div className="space-y-4">
            {product.reviews.map((rev) => (
              <div key={rev.id} className="p-4 bg-ivory rounded-xl border border-burgundy/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-espresso">{rev.author}</span>
                    {rev.verified && (
                      <span className="text-[10px] text-green-800 bg-green-100 px-2 py-0.5 rounded font-semibold">
                        Verified Buyer
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-espresso/50">{rev.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-gold text-gold" />
                  ))}
                </div>
                <h4 className="font-semibold text-xs text-espresso">{rev.title}</h4>
                <p className="text-xs text-espresso/75 leading-relaxed">{rev.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-espresso/60 italic">
            This limited silhouette drop has just been released. Be the first to submit client feedback following delivery.
          </p>
        )}
      </section>

      {/* 6. SIZE CHART — bottom sheet on phones, centred dialog on larger screens */}
      {isSizeGuideOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-espresso/60 backdrop-blur-[2px] sm:items-center sm:p-4"
          onClick={(e) => e.target === e.currentTarget && setIsSizeGuideOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="size-guide-title"
            className="max-h-[88dvh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-t-3xl border border-burgundy/20 bg-ivory px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl animate-[sheetUp_.28s_cubic-bezier(.22,1,.36,1)] sm:rounded-2xl sm:p-8"
          >
            <div className="flex items-center justify-between gap-3 border-b border-burgundy/15 pb-3">
              <div className="flex min-w-0 items-center gap-2">
                <Ruler className="h-5 w-5 flex-shrink-0 text-burgundy" />
                <h3 id="size-guide-title" className="truncate font-serif text-lg font-bold text-espresso sm:text-xl">
                  {product.category} size guide
                </h3>
              </div>
              <button
                onClick={() => setIsSizeGuideOpen(false)}
                className="-mr-2 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-espresso/60 hover:bg-burgundy/5 hover:text-burgundy"
                aria-label="Close size guide"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs leading-relaxed text-espresso/75">
                Garment measurements. Take your usual size for the intended loose fit, or one size down for closer.
              </p>
              <div className="flex flex-shrink-0 rounded-full bg-ivory-dark p-1 text-xs font-bold" role="group" aria-label="Units">
                {(["cm", "in"] as const).map((u) => (
                  <button
                    key={u}
                    onClick={() => setChartUnit(u)}
                    aria-pressed={chartUnit === u}
                    className={`min-h-[36px] min-w-[44px] rounded-full px-3 ${chartUnit === u ? "bg-burgundy text-gold" : "text-espresso/60"}`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            {(() => {
              const cm = (v: number) => (chartUnit === "cm" ? `${v}` : `${Math.round((v / 2.54) * 2) / 2}`);
              const isJeans = product.category === "Jeans";
              const headers = isJeans ? ["Waist", "Waist", "Inseam", "Thigh", "Opening"] : ["Size", "Chest", "Length", "Shoulder drop", "Sleeve"];
              const rows: (string | number)[][] = isJeans
                ? [
                    ["30", 76, 81, 61, 46],
                    ["32", 81, 81, 64, 48],
                    ["34", 86, 86, 66, 51],
                    ["36", 91, 86, 69, 53],
                  ]
                : [
                    ["S", 107, 68, 8, 84],
                    ["M", 114, 71, 10, 86],
                    ["L", 122, 74, 12, 89],
                    ["XL", 130, 76, 14, 91],
                    ["XXL", 137, 79, 16, 94],
                  ];
              return (
                <table className="w-full border-collapse overflow-hidden rounded-xl text-left text-sm">
                  <thead>
                    <tr className="bg-burgundy text-gold">
                      {headers.map((h, i) => (
                        <th key={i} className="px-2 py-2.5 text-[11px] font-bold uppercase tracking-wide first:pl-3">
                          {h}
                          {i > 0 && <span className="block text-[10px] font-normal normal-case tracking-normal text-gold/70">{chartUnit}</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-burgundy/15 bg-white">
                    {rows.map((r) => (
                      <tr key={String(r[0])} className={String(r[0]) === (selectedSize || "") ? "bg-gold/10" : undefined}>
                        <td className="px-2 py-3 pl-3 font-bold">{r[0]}</td>
                        {r.slice(1).map((v, k) => (
                          <td key={k} className="px-2 py-3 tabular-nums">
                            {!isJeans && k === 2 ? `+${cm(v as number)}` : cm(v as number)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}

            <button
              onClick={() => setIsSizeGuideOpen(false)}
              className="min-h-[48px] w-full rounded-xl bg-burgundy text-sm font-bold uppercase tracking-wider text-ivory transition-colors hover:bg-crimson"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
