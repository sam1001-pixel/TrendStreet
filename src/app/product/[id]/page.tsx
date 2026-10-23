"use client";

import React, { useState, useEffect } from "react";
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
  Box,
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
  const [show3DPreview, setShow3DPreview] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Delivery Pincode checker state
  const [pincode, setPincode] = useState("");
  const [deliveryResult, setDeliveryResult] = useState<string | null>(null);
  const [isCheckingPincode, setIsCheckingPincode] = useState(false);

  // Accordion tabs state
  const [openSection, setOpenSection] = useState<string | null>("details");

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
          {/* Main Visual Display */}
          <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-ivory-dark border border-burgundy/15 shadow-md">
            {show3DPreview ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-espresso text-ivory p-8 text-center space-y-4">
                <Box className="w-16 h-16 text-gold animate-bounce" />
                <span className="text-xs font-bold uppercase tracking-widest text-gold">
                  3D Interactive Streetwear Architecture
                </span>
                <p className="text-xs text-ivory/80 max-w-sm leading-relaxed">
                  360-degree interactive silhouette simulation. Inspect the dropped shoulder volume, calculated drape, and pure {product.fabric} weave.
                </p>
                <div className="p-3 bg-burgundy/40 rounded-xl border border-gold/30 text-[11px] text-gold font-semibold">
                  ✦ Low-Tension Warp Texture & Seam Integrity Verified
                </div>
              </div>
            ) : (
              <Image
                src={product.images[activeImageIndex] || product.images[0]}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="w-full h-full object-cover object-center transition-all duration-300"
                priority
              />
            )}

            {/* Badges */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
              {product.isNew && (
                <span className="bg-espresso text-ivory text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded shadow-sm">
                  New Drop
                </span>
              )}
              {product.isBestSeller && (
                <span className="bg-burgundy text-gold text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded shadow-sm">
                  Signature Silhouette
                </span>
              )}
            </div>

            {/* Photography vs 3D Interactive Mode Switcher */}
            <div className="absolute top-4 right-4 z-10 flex items-center bg-espresso/85 backdrop-blur-md rounded-full p-1 border border-gold/30 shadow-md">
              <button
                onClick={() => setShow3DPreview(false)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                  !show3DPreview ? "bg-burgundy text-gold shadow-xs" : "text-ivory/70 hover:text-ivory"
                }`}
              >
                Photography
              </button>
              <button
                onClick={() => setShow3DPreview(true)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                  show3DPreview ? "bg-burgundy text-gold shadow-xs" : "text-ivory/70 hover:text-ivory"
                }`}
              >
                <Box className="w-3 h-3 text-gold" />
                <span>3D View</span>
              </button>
            </div>
          </div>

          {/* Thumbnail Gallery Strip */}
          {!show3DPreview && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={img}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all relative ${
                    activeImageIndex === idx
                      ? "border-burgundy ring-2 ring-burgundy/30 shadow-sm scale-[1.02]"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                  aria-label={`View garment image ${idx + 1}`}
                >
                  <Image src={img} alt={`${product.name} view ${idx + 1}`} fill sizes="25vw" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Quick Textile Provenance Callout */}
          <div className="p-4 bg-ivory rounded-xl border border-burgundy/15 flex items-center justify-between text-xs text-espresso/80">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-burgundy flex-shrink-0" />
              <span><strong>Pure Textile:</strong> {product.fabric}</span>
            </div>
            <span className="text-[11px] font-mono text-gold bg-espresso px-2 py-0.5 rounded font-bold">
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
                Price inclusive of all taxes (GST 12%) • Free delivery on orders over ₹1,999
              </span>
            </div>
          </div>

          {/* VIP Atelier Offer Banner */}
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

          {/* Color Variant Picker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-espresso">
              <span>Color: <span className="font-semibold text-burgundy">{selectedColor || product.colors[0]?.name}</span></span>
              <span className="text-[11px] text-espresso/50 font-normal">{product.colors.length} Variants</span>
            </div>
            <div className="flex items-center space-x-2.5">
              {product.colors.map((color) => {
                const isSelected = (selectedColor || product.colors[0]?.name) === color.name;
                return (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
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
                className="text-burgundy flex items-center gap-1 hover:underline text-[11px] uppercase tracking-wider font-semibold"
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
            <p className="text-[11px] text-espresso/60 flex items-center gap-1.5 pt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-700 animate-pulse" />
              <span>In Stock — Ready for priority express dispatch</span>
            </p>
          </div>

          {/* Quantity Selector & Main Action Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center space-x-3">
              {/* Quantity Stepper */}
              <div className="flex items-center border border-burgundy/30 rounded-lg bg-white px-2.5 py-2.5 shadow-2xs">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="text-espresso/70 hover:text-burgundy font-bold px-2 text-sm"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="px-2 text-xs font-bold text-espresso">{quantity < 10 ? `0${quantity}` : quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="text-espresso/70 hover:text-burgundy font-bold px-2 text-sm"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              {/* Primary ADD TO CART / ADD TO BAG */}
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className={`flex-1 py-3.5 px-6 rounded-lg text-xs font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-lg ${
                  addedAnimation
                    ? "bg-green-800 text-white"
                    : "bg-burgundy hover:bg-crimson text-gold"
                }`}
              >
                {addedAnimation ? (
                  <>
                    <Check className="w-4 h-4" /> Added to Bag
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" /> Add to Bag — {formatPrice(product.price * quantity)}
                  </>
                )}
              </button>

              {/* Secondary WISHLIST Button */}
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`p-3.5 rounded-lg border transition-colors ${
                  isFavorited
                    ? "bg-crimson text-ivory border-crimson shadow-xs"
                    : "bg-white text-espresso border-burgundy/20 hover:text-crimson"
                }`}
                aria-label="Save to Wishlist"
              >
                <Heart className={`w-5 h-5 ${isFavorited ? "fill-current" : ""}`} />
              </button>
            </div>

            {/* Instant Express Checkout Link */}
            <Link
              href="/checkout"
              onClick={() => addToCart(product, selectedSize || product.sizes[0], selectedColor || product.colors[0]?.name, quantity)}
              className="w-full block text-center py-3 bg-espresso hover:bg-black text-ivory text-xs font-bold uppercase tracking-[0.18em] rounded-lg transition-colors shadow-md"
            >
              Instant Express Checkout
            </Link>
          </div>

          {/* Social Share & Copy Link */}
          <div className="flex items-center justify-between pt-2 pb-2 text-xs text-espresso/70 border-y border-burgundy/10">
            <span className="font-semibold">Share Silhouette:</span>
            <div className="flex items-center gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Check out ${product.name} on Trend Street: https://trendstreet.com/product/${product.id}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 bg-ivory rounded-md border border-burgundy/15 hover:text-burgundy text-[11px] font-bold"
                aria-label="Share on WhatsApp"
              >
                WhatsApp
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Elevated streetwear: ${product.name} from Trend Street`)}&url=${encodeURIComponent(`https://trendstreet.com/product/${product.id}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 bg-ivory rounded-md border border-burgundy/15 hover:text-burgundy text-[11px] font-bold"
                aria-label="Share on Twitter"
              >
                X / Twitter
              </a>
              <button
                onClick={handleShareCopy}
                className="p-1.5 bg-ivory rounded-md border border-burgundy/15 hover:text-burgundy text-[11px] font-bold flex items-center gap-1"
                aria-label="Copy link"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-green-700" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? "Copied" : "Copy Link"}</span>
              </button>
            </div>
          </div>

          {/* Delivery & Postal Code Checker */}
          <div className="p-4 bg-white rounded-xl border border-burgundy/15 shadow-2xs space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-espresso">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-burgundy" />
                <span>Delivery & Shipping Estimate</span>
              </div>
              <span className="text-[11px] text-espresso/50 font-normal">Global Courier</span>
            </div>

            <form onSubmit={handleCheckDelivery} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Postal / Pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                maxLength={8}
                className="flex-1 px-3 py-2 text-xs border border-burgundy/20 rounded-md focus:outline-none focus:border-burgundy bg-ivory"
              />
              <button
                type="submit"
                disabled={isCheckingPincode || !pincode.trim()}
                className="px-4 py-2 bg-espresso hover:bg-black text-ivory text-xs font-bold uppercase tracking-wider rounded-md transition-colors disabled:opacity-50"
              >
                {isCheckingPincode ? "Checking..." : "CHECK"}
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
            <div className="py-3">
              <button
                onClick={() => toggleSection("details")}
                className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-espresso text-left"
              >
                <span>Garment Architecture & Construction</span>
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
            <div className="py-3">
              <button
                onClick={() => toggleSection("fabric")}
                className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-espresso text-left"
              >
                <span>Textile & Loom Provenance</span>
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
            <div className="py-3">
              <button
                onClick={() => toggleSection("care")}
                className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-espresso text-left"
              >
                <span>Care & Longevity Protocol</span>
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

      {/* 3. MOBILE STICKY BOTTOM ACTION BAR (Appears on small screens for 1-tap add to bag) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-burgundy/20 px-4 py-3 flex items-center justify-between gap-3 shadow-2xl">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <Image
            src={product.images[0]}
            alt={product.name}
            width={40}
            height={48}
            className="w-10 h-12 object-cover rounded-md flex-shrink-0 border border-burgundy/15"
          />
          <div className="truncate">
            <span className="block text-xs font-bold text-espresso truncate">{product.name}</span>
            <span className="text-xs font-serif font-bold text-burgundy">{formatPrice(product.price)}</span>
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          className="py-2.5 px-5 bg-burgundy hover:bg-crimson text-gold text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 shadow-md flex-shrink-0"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>{addedAnimation ? "Added" : "Add to Bag"}</span>
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

      {/* 6. SIZE CHART MODAL */}
      {isSizeGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-ivory rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-burgundy/20 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-burgundy/15 pb-4">
              <div className="flex items-center space-x-2">
                <Ruler className="w-5 h-5 text-burgundy" />
                <h3 className="font-serif text-xl font-bold text-espresso">
                  {product.category} Dimension Guide
                </h3>
              </div>
              <button
                onClick={() => setIsSizeGuideOpen(false)}
                className="text-espresso/60 hover:text-burgundy text-lg font-bold"
                aria-label="Close fit guide"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-espresso/80 leading-relaxed">
              Trend Street garments are engineered with calculated drape and dropped proportions. Choose your standard size for the intended streetwear runway volume, or size down one unit for a closer fit.
            </p>

            <div className="overflow-x-auto">
              {product.category === "Jeans" ? (
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-burgundy text-gold">
                      <th className="p-2.5">Waist Size</th>
                      <th className="p-2.5">Waist (in / cm)</th>
                      <th className="p-2.5">Inseam (in / cm)</th>
                      <th className="p-2.5">Thigh Width</th>
                      <th className="p-2.5">Leg Opening / Flare</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-burgundy/15 bg-white">
                    <tr>
                      <td className="p-2.5 font-bold">30</td>
                      <td className="p-2.5">30 in / 76 cm</td>
                      <td className="p-2.5">32 in / 81 cm</td>
                      <td className="p-2.5">24 in / 61 cm</td>
                      <td className="p-2.5">18 in / 46 cm</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">32</td>
                      <td className="p-2.5">32 in / 81 cm</td>
                      <td className="p-2.5">32 in / 81 cm</td>
                      <td className="p-2.5">25 in / 64 cm</td>
                      <td className="p-2.5">19 in / 48 cm</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">34</td>
                      <td className="p-2.5">34 in / 86 cm</td>
                      <td className="p-2.5">34 in / 86 cm</td>
                      <td className="p-2.5">26 in / 66 cm</td>
                      <td className="p-2.5">20 in / 51 cm</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">36</td>
                      <td className="p-2.5">36 in / 91 cm</td>
                      <td className="p-2.5">34 in / 86 cm</td>
                      <td className="p-2.5">27 in / 69 cm</td>
                      <td className="p-2.5">21 in / 53 cm</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-burgundy text-gold">
                      <th className="p-2.5">Size</th>
                      <th className="p-2.5">Chest (in / cm)</th>
                      <th className="p-2.5">Length (in / cm)</th>
                      <th className="p-2.5">Shoulder Drop</th>
                      <th className="p-2.5">Sleeve</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-burgundy/15 bg-white">
                    <tr>
                      <td className="p-2.5 font-bold">S</td>
                      <td className="p-2.5">42 in / 107 cm</td>
                      <td className="p-2.5">27 in / 68 cm</td>
                      <td className="p-2.5">+8 cm drop</td>
                      <td className="p-2.5">33 in / 84 cm</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">M</td>
                      <td className="p-2.5">45 in / 114 cm</td>
                      <td className="p-2.5">28 in / 71 cm</td>
                      <td className="p-2.5">+10 cm drop</td>
                      <td className="p-2.5">34 in / 86 cm</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">L</td>
                      <td className="p-2.5">48 in / 122 cm</td>
                      <td className="p-2.5">29 in / 74 cm</td>
                      <td className="p-2.5">+12 cm drop</td>
                      <td className="p-2.5">35 in / 89 cm</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">XL</td>
                      <td className="p-2.5">51 in / 130 cm</td>
                      <td className="p-2.5">30 in / 76 cm</td>
                      <td className="p-2.5">+14 cm drop</td>
                      <td className="p-2.5">36 in / 91 cm</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">XXL</td>
                      <td className="p-2.5">54 in / 137 cm</td>
                      <td className="p-2.5">31 in / 79 cm</td>
                      <td className="p-2.5">+16 cm drop</td>
                      <td className="p-2.5">37 in / 94 cm</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            <button
              onClick={() => setIsSizeGuideOpen(false)}
              className="w-full py-3 bg-burgundy hover:bg-crimson text-ivory text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
            >
              Close Dimension Guide
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
