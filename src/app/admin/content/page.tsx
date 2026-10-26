"use client";

import React, { useState, useEffect } from "react";
import {
  Palette,
  Sparkles,
  Megaphone,
  Save,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Eye,
  Sliders,
} from "lucide-react";
import { useAdminData } from "@/hooks/useAdminData";
import { ImageGalleryUpload } from "@/components/admin/ImageGalleryUpload";

export default function AdminContentPage() {
  const { siteSettings, updateSiteSettings, loading, error, notice, clearError } = useAdminData();

  const [announcementText, setAnnouncementText] = useState("");
  const [announcementLink, setAnnouncementLink] = useState("/shop");
  const [announcementEnabled, setAnnouncementEnabled] = useState(true);

  const [heroTitle1, setHeroTitle1] = useState("Oversized Silhouettes.");
  const [heroTitle2, setHeroTitle2] = useState("Modern Distinction.");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroBadge, setHeroBadge] = useState("Autumn / Winter 2026 Drops");
  const [heroPrimaryCta, setHeroPrimaryCta] = useState("/shop");
  const [heroSecondaryCta, setHeroSecondaryCta] = useState("/lookbook");

  const [marqueeText, setMarqueeText] = useState("HEAVYWEIGHT COMBED COTTON • 520GSM FLEECE • BESPOKE BOXY CUTS • CRAFTED IN MUMBAI");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Gallery uploads state
  const [uploadedGalleryImages, setUploadedGalleryImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop",
  ]);

  useEffect(() => {
    if (siteSettings) {
      if (siteSettings.topAnnouncement) {
        setAnnouncementText(siteSettings.topAnnouncement.text || "");
        setAnnouncementLink(siteSettings.topAnnouncement.linkUrl || "/shop");
        setAnnouncementEnabled(siteSettings.topAnnouncement.enabled ?? true);
      }
      if (siteSettings.hero) {
        setHeroTitle1(siteSettings.hero.titleLine1 || "Oversized Silhouettes.");
        setHeroTitle2(siteSettings.hero.titleLine2 || "Modern Distinction.");
        setHeroSubtitle(siteSettings.hero.subtitle || "");
        setHeroBadge(siteSettings.hero.badgeText || "Autumn / Winter 2026 Drops");
        setHeroPrimaryCta(siteSettings.hero.primaryBtnLink || "/shop");
        setHeroSecondaryCta(siteSettings.hero.secondaryBtnLink || "/lookbook");
      }
    }
  }, [siteSettings]);

  const handleSaveAllContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await updateSiteSettings({
        ...siteSettings,
        topAnnouncement: {
          enabled: announcementEnabled,
          text: announcementText,
          linkUrl: announcementLink,
          linkText: "SHOP NOW",
        },
        hero: {
          ...(siteSettings?.hero || {
            stat1Value: "520",
            stat1Label: "GSM FLEECE",
            stat2Value: "3",
            stat2Label: "CORE CUTS",
            stat3Value: "100%",
            stat3Label: "COMBED COTTON",
            primaryBtnText: "EXPLORE COLLECTION",
            secondaryBtnText: "VIEW LOOKBOOK",
          }),
          titleLine1: heroTitle1,
          titleLine2: heroTitle2,
          subtitle: heroSubtitle,
          badgeText: heroBadge,
          primaryBtnLink: heroPrimaryCta,
          secondaryBtnLink: heroSecondaryCta,
        },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert("Error saving storefront settings: " + (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-espresso/10 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-gold uppercase tracking-widest">
            <Palette className="w-3.5 h-3.5" />
            <span>Storefront CMS & Merchandising</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-espresso tracking-tight mt-1">
            Storefront Content & Media
          </h1>
          <p className="text-xs text-espresso/60 mt-1 max-w-xl">
            Live headline controls, announcement banners, marquee messaging, and atelier photo gallery uploads.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-white border border-espresso/15 text-espresso text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-espresso/5 transition-colors"
          >
            <Eye className="w-4 h-4 text-burgundy" />
            <span>Preview Storefront</span>
          </a>

          <button
            onClick={handleSaveAllContent}
            disabled={isSaving}
            className="px-5 py-2.5 bg-burgundy hover:bg-burgundy/90 text-gold text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center space-x-2 border border-gold/30 disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? "Publishing..." : saveSuccess ? "Published to DB!" : "Publish to Live Site"}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSaveAllContent} className="space-y-8">
        {/* 1. Announcement Bar Manager */}
        <div className="p-6 bg-white rounded-2xl border border-espresso/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Megaphone className="w-4 h-4 text-burgundy" />
              <h3 className="font-serif font-bold text-base text-espresso">
                Top Announcement Bar
              </h3>
            </div>

            <label className="flex items-center space-x-2 cursor-pointer">
              <span className="text-xs font-bold text-espresso/70">Display on Storefront:</span>
              <input
                type="checkbox"
                checked={announcementEnabled}
                onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                className="w-4 h-4 accent-burgundy rounded"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-espresso/70">
                Announcement Message
              </label>
              <input
                type="text"
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="e.g. COMPLIMENTARY EXPRESS DELIVERY ON ORDERS OVER ₹1,999"
                className="w-full px-3.5 py-2.5 rounded-xl bg-espresso/5 border border-espresso/15 text-xs font-semibold text-espresso focus:ring-2 focus:ring-gold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-espresso/70">
                Action Destination Link
              </label>
              <input
                type="text"
                value={announcementLink}
                onChange={(e) => setAnnouncementLink(e.target.value)}
                placeholder="/shop"
                className="w-full px-3.5 py-2.5 rounded-xl bg-espresso/5 border border-espresso/15 text-xs font-mono text-espresso focus:ring-2 focus:ring-gold"
              />
            </div>
          </div>
        </div>

        {/* 2. Hero Section Headlines */}
        <div className="p-6 bg-white rounded-2xl border border-espresso/10 shadow-xs space-y-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-burgundy" />
            <h3 className="font-serif font-bold text-base text-espresso">
              Hero Section Merchandising & Copy
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-espresso/70">
                Hero Primary Headline
              </label>
              <input
                type="text"
                value={heroTitle1}
                onChange={(e) => setHeroTitle1(e.target.value)}
                placeholder="Oversized Silhouettes."
                className="w-full px-3.5 py-2.5 rounded-xl bg-espresso/5 border border-espresso/15 text-xs font-serif font-bold text-espresso focus:ring-2 focus:ring-gold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-espresso/70">
                Badge Headline Tag
              </label>
              <input
                type="text"
                value={heroBadge}
                onChange={(e) => setHeroBadge(e.target.value)}
                placeholder="Autumn / Winter 2026 Drops"
                className="w-full px-3.5 py-2.5 rounded-xl bg-espresso/5 border border-espresso/15 text-xs font-semibold text-espresso focus:ring-2 focus:ring-gold"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-espresso/70">
                Hero Subtitle Copy
              </label>
              <textarea
                rows={2}
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                placeholder="Heavyweight combed cotton, refined drape, and structured geometry engineered for modern Indian luxury."
                className="w-full px-3.5 py-2 rounded-xl bg-espresso/5 border border-espresso/15 text-xs text-espresso focus:ring-2 focus:ring-gold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-espresso/70">
                Primary Call To Action URL
              </label>
              <input
                type="text"
                value={heroPrimaryCta}
                onChange={(e) => setHeroPrimaryCta(e.target.value)}
                placeholder="/shop"
                className="w-full px-3.5 py-2 rounded-xl bg-espresso/5 border border-espresso/15 text-xs font-mono text-espresso focus:ring-2 focus:ring-gold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-espresso/70">
                Secondary Call To Action URL
              </label>
              <input
                type="text"
                value={heroSecondaryCta}
                onChange={(e) => setHeroSecondaryCta(e.target.value)}
                placeholder="/lookbook"
                className="w-full px-3.5 py-2 rounded-xl bg-espresso/5 border border-espresso/15 text-xs font-mono text-espresso focus:ring-2 focus:ring-gold"
              />
            </div>
          </div>
        </div>

        {/* 3. Marquee Ticker */}
        <div className="p-6 bg-white rounded-2xl border border-espresso/10 shadow-xs space-y-4">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-burgundy" />
            <h3 className="font-serif font-bold text-base text-espresso">
              Running Marquee Ticker Text
            </h3>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-espresso/70">
              Ticker Phrases (separated by •)
            </label>
            <input
              type="text"
              value={marqueeText}
              onChange={(e) => setMarqueeText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-espresso/5 border border-espresso/15 text-xs font-mono text-espresso focus:ring-2 focus:ring-gold"
            />
          </div>
        </div>

        {/* 4. Atelier Media Gallery & Quick Device Upload Desk */}
        <div className="p-6 bg-white rounded-2xl border border-espresso/10 shadow-xs space-y-4">
          <div className="flex items-center space-x-2">
            <ImageIcon className="w-4 h-4 text-burgundy" />
            <h3 className="font-serif font-bold text-base text-espresso">
              Atelier Media Gallery & Asset Upload Desk
            </h3>
          </div>
          <p className="text-xs text-espresso/60">
            Upload campaign photos directly from your device gallery, mobile camera, or pick from luxury presets.
          </p>

          <ImageGalleryUpload
            images={uploadedGalleryImages}
            onChange={(imgs) => setUploadedGalleryImages(imgs)}
            maxImages={8}
          />
        </div>

        {/* Bottom Save Bar */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-burgundy hover:bg-burgundy/90 text-gold text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center space-x-2 border border-gold/30 disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? "Saving..." : "Save Storefront Changes"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
