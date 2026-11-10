"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Sparkles,
  Layers,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  ImageIcon,
  Link2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { StoreConfig, HeroLook, SilhouettePanel } from "@/lib/store-config";
import { MediaUploader } from "@/components/admin/MediaUploader";

interface PanelProps {
  config: StoreConfig;
  onChange: (next: StoreConfig) => void;
}

/**
 * Admin Panel for configuring the Cinematic Hero:
 * - Rotating looks/slides (images, titles, taglines, links)
 * - Kinetic large wordmark (e.g. OFFVYBE) with live preview
 * - Top live badge
 * - Secondary CTA button and destination link
 */
export function HeroConfigPanel({ config, onChange }: PanelProps) {
  const hero = config.hero;
  const looks = hero.looks || [];
  const [expandedLook, setExpandedLook] = useState<number | null>(0);

  const updateHero = (partial: Partial<StoreConfig["hero"]>) => {
    onChange({
      ...config,
      hero: {
        ...hero,
        ...partial,
      },
    });
  };

  const updateLook = (index: number, patch: Partial<HeroLook>) => {
    const nextLooks = [...looks];
    nextLooks[index] = { ...nextLooks[index], ...patch };
    updateHero({ looks: nextLooks });
  };

  const moveLook = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= looks.length) return;
    const nextLooks = [...looks];
    const temp = nextLooks[index];
    nextLooks[index] = nextLooks[target];
    nextLooks[target] = temp;
    updateHero({ looks: nextLooks });
    setExpandedLook(target);
  };

  const removeLook = (index: number) => {
    if (looks.length <= 1) {
      alert("At least one hero look slide is required.");
      return;
    }
    const nextLooks = looks.filter((_, i) => i !== index);
    updateHero({ looks: nextLooks });
    setExpandedLook(0);
  };

  const addLook = () => {
    if (looks.length >= 8) {
      alert("Maximum 8 hero looks allowed to ensure optimal page performance.");
      return;
    }
    const newLook: HeroLook = {
      key: `Silhouette ${looks.length + 1}`,
      line: "Architectural drape engineered for effortless presence.",
      href: "/shop",
      image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=2000&auto=format&fit=crop",
    };
    updateHero({ looks: [...looks, newLook] });
    setExpandedLook(looks.length);
  };

  const wordmarkChars = (hero.wordmark || "OFFVYBE").split("");
  const highlightIdx = (() => {
    const vIdx = wordmarkChars.findIndex((c) => c.toUpperCase() === "V");
    if (vIdx >= 0) return vIdx;
    return Math.floor(wordmarkChars.length / 2);
  })();

  return (
    <div className="space-y-6">
      {/* General Hero Settings */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-burgundy/15 shadow-xs space-y-6">
        <div className="border-b border-burgundy/10 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold" />
            <h2 className="font-serif text-lg font-bold text-espresso">
              Hero Brand & Live Presentation
            </h2>
          </div>
          <p className="text-xs text-espresso/60 mt-1">
            Configure the kinetic wordmark typography, live drop badge, and action buttons shown on the storefront hero.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Wordmark */}
          <div>
            <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
              Kinetic Hero Wordmark
            </label>
            <input
              type="text"
              value={hero.wordmark}
              onChange={(e) => updateHero({ wordmark: e.target.value })}
              placeholder="OFFVYBE"
              maxLength={20}
              className="w-full px-3.5 py-2.5 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none uppercase font-black tracking-widest"
            />
            {/* Real-time wordmark visual preview */}
            <div className="mt-2.5 p-3 rounded-xl bg-stone-950 flex items-center justify-center gap-1">
              <span className="text-[10px] text-stone-400 mr-2 uppercase tracking-wider">Preview:</span>
              <span className="font-display font-black text-xl tracking-tight uppercase text-white">
                {wordmarkChars.map((ch, i) => (
                  <span key={i} className={i === highlightIdx ? "text-gold" : "text-white"}>
                    {ch}
                  </span>
                ))}
              </span>
            </div>
          </div>

          {/* Top Live Badge */}
          <div>
            <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
              Top Live Badge
            </label>
            <input
              type="text"
              value={hero.badgeText}
              onChange={(e) => updateHero({ badgeText: e.target.value })}
              placeholder="Drop 04 — live now"
              maxLength={60}
              className="w-full px-3.5 py-2.5 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none"
            />
            <p className="text-[11px] text-espresso/60 mt-1">
              Appears with the pulsing gold beacon above the hero caption.
            </p>
          </div>

          {/* Secondary CTA Button */}
          <div>
            <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
              Secondary Button Label
            </label>
            <input
              type="text"
              value={hero.secondaryCtaText}
              onChange={(e) => updateHero({ secondaryCtaText: e.target.value })}
              placeholder="Shop all"
              maxLength={30}
              className="w-full px-3.5 py-2.5 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
              Secondary Button Link
            </label>
            <input
              type="text"
              value={hero.secondaryCtaLink}
              onChange={(e) => updateHero({ secondaryCtaLink: e.target.value })}
              placeholder="/shop"
              className="w-full px-3.5 py-2.5 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Rotating Hero Looks & Images Manager */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-burgundy/15 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-burgundy/10 pb-4">
          <div>
            <h2 className="font-serif text-lg font-bold text-espresso">
              Hero Rotating Silhouettes & Images
            </h2>
            <p className="text-xs text-espresso/60 mt-0.5">
              Each slide displays a high-resolution background image, silhouette title, editorial tagline, and a dedicated shop button.
            </p>
          </div>
          <button
            type="button"
            onClick={addLook}
            className="self-start sm:self-auto py-2 px-3.5 bg-burgundy hover:bg-crimson text-gold text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Slide</span>
          </button>
        </div>

        <div className="space-y-4">
          {looks.map((look, i) => {
            const isExpanded = expandedLook === i;
            return (
              <div
                key={i}
                className="rounded-xl border border-burgundy/20 bg-ivory overflow-hidden transition-all shadow-2xs"
              >
                {/* Accordion Header */}
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-burgundy/5 transition-colors"
                  onClick={() => setExpandedLook(isExpanded ? null : i)}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-burgundy/10 text-burgundy font-mono text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-stone-900 border border-burgundy/20 flex-shrink-0">
                      {look.image ? (
                        <Image
                          src={look.image}
                          alt={look.key}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/40">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-espresso uppercase tracking-wider">
                        {look.key || `Slide ${i + 1}`}
                      </h3>
                      <p className="text-[11px] text-espresso/60 truncate max-w-xs sm:max-w-md">
                        {look.line}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      disabled={i === 0}
                      onClick={() => moveLook(i, -1)}
                      title="Move Up"
                      className="p-1.5 text-espresso/60 hover:text-espresso disabled:opacity-30 disabled:hover:text-espresso/60 rounded"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={i === looks.length - 1}
                      onClick={() => moveLook(i, 1)}
                      title="Move Down"
                      className="p-1.5 text-espresso/60 hover:text-espresso disabled:opacity-30 disabled:hover:text-espresso/60 rounded"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeLook(i)}
                      title="Remove Slide"
                      className="p-1.5 text-red-500 hover:text-red-700 rounded ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedLook(isExpanded ? null : i)}
                      className="p-1.5 text-espresso/60 hover:text-espresso rounded"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Form Fields */}
                {isExpanded && (
                  <div className="p-4 sm:p-6 bg-white border-t border-burgundy/15 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
                          Silhouette / Cut Title
                        </label>
                        <input
                          type="text"
                          value={look.key}
                          onChange={(e) => updateLook(i, { key: e.target.value })}
                          placeholder="e.g. Oversized, Boxy Fit, Jackets"
                          className="w-full px-3.5 py-2 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
                          Collection Destination Link
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={look.href}
                            onChange={(e) => updateLook(i, { href: e.target.value })}
                            placeholder="/oversized or /shop?category=..."
                            className="w-full pl-8 pr-3.5 py-2 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none"
                          />
                          <Link2 className="w-3.5 h-3.5 text-espresso/50 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
                          Editorial Tagline (Hero Display Line)
                        </label>
                        <input
                          type="text"
                          value={look.line}
                          onChange={(e) => updateLook(i, { line: e.target.value })}
                          placeholder="e.g. 520gsm loopback. Built to hang, not cling."
                          maxLength={140}
                          className="w-full px-3.5 py-2 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none"
                        />
                      </div>

                      {/* Image Settings */}
                      <div className="sm:col-span-2 space-y-2">
                        <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider">
                          Hero Slide Background Image
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                          <div className="relative aspect-[16/9] md:aspect-[4/3] rounded-xl overflow-hidden bg-stone-900 border border-burgundy/20 shadow-xs">
                            {look.image ? (
                              <Image
                                src={look.image}
                                alt={look.key}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-white/40 gap-1">
                                <ImageIcon className="w-6 h-6" />
                                <span className="text-[10px]">No image selected</span>
                              </div>
                            )}
                          </div>

                          <div className="md:col-span-2 space-y-3">
                            <div>
                              <span className="block text-[10px] font-semibold text-espresso/70 uppercase mb-1">
                                Image URL (Direct paste or CDN link)
                              </span>
                              <input
                                type="text"
                                value={look.image}
                                onChange={(e) => updateLook(i, { image: e.target.value })}
                                placeholder="https://..."
                                className="w-full px-3 py-2 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none"
                              />
                            </div>

                            <div>
                              <span className="block text-[10px] font-semibold text-espresso/70 uppercase mb-1">
                                Or Upload / Choose from Media Library:
                              </span>
                              <MediaUploader
                                kind="image"
                                max={1}
                                value={look.image ? [look.image] : []}
                                onChange={(urls) => updateLook(i, { image: urls[0] || look.image })}
                                label="Upload New Photo"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Admin Panel for configuring the Architectural Four Cuts / Silhouettes Section:
 * - Section Eyebrow, Headline 1 & 2, and Subtitle Copy
 * - 4 Silhouettes Panels / Cards (Number, Name, Link, Short Tag, Detailed Copy, and Image)
 */
export function SilhouettesConfigPanel({ config, onChange }: PanelProps) {
  const sil = config.silhouettes;
  const panels = sil.panels || [];
  const [expandedPanel, setExpandedPanel] = useState<number | null>(0);

  const updateSilhouettes = (partial: Partial<StoreConfig["silhouettes"]>) => {
    onChange({
      ...config,
      silhouettes: {
        ...sil,
        ...partial,
      },
    });
  };

  const updatePanel = (index: number, patch: Partial<SilhouettePanel>) => {
    const nextPanels = [...panels];
    nextPanels[index] = { ...nextPanels[index], ...patch };
    updateSilhouettes({ panels: nextPanels });
  };

  const movePanel = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= panels.length) return;
    const nextPanels = [...panels];
    const temp = nextPanels[index];
    nextPanels[index] = nextPanels[target];
    nextPanels[target] = temp;
    updateSilhouettes({ panels: nextPanels });
    setExpandedPanel(target);
  };

  const removePanel = (index: number) => {
    if (panels.length <= 1) {
      alert("At least one silhouette cut is required.");
      return;
    }
    const nextPanels = panels.filter((_, i) => i !== index);
    updateSilhouettes({ panels: nextPanels });
    setExpandedPanel(0);
  };

  const addPanel = () => {
    if (panels.length >= 8) {
      alert("Maximum 8 silhouettes allowed to preserve grid aesthetics.");
      return;
    }
    const nextNo = String(panels.length + 1).padStart(2, "0");
    const newPanel: SilhouettePanel = {
      no: nextNo,
      name: `Cut ${panels.length + 1}`,
      href: "/shop",
      shortTag: "Contemporary Streetwear Silhouette",
      copy: "Crafted with precision tailoring and heavyweight fabric for exceptional drape.",
      image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1400&auto=format&fit=crop",
    };
    updateSilhouettes({ panels: [...panels, newPanel] });
    setExpandedPanel(panels.length);
  };

  return (
    <div className="space-y-6">
      {/* Section Typography & Editorial Copy */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-burgundy/15 shadow-xs space-y-6">
        <div className="border-b border-burgundy/10 pb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-burgundy" />
            <h2 className="font-serif text-lg font-bold text-espresso">
              Four Cuts Section Presentation
            </h2>
          </div>
          <p className="text-xs text-espresso/60 mt-1">
            Configure the section title, eyebrow category, and editorial introduction displayed above the silhouettes accordion.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
              Section Eyebrow Badge
            </label>
            <input
              type="text"
              value={sil.eyebrow}
              onChange={(e) => updateSilhouettes({ eyebrow: e.target.value })}
              placeholder="Architectural Foundations"
              maxLength={60}
              className="w-full px-3.5 py-2.5 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
              Headline Line 1
            </label>
            <input
              type="text"
              value={sil.titleLine1}
              onChange={(e) => updateSilhouettes({ titleLine1: e.target.value })}
              placeholder="Four cuts."
              maxLength={50}
              className="w-full px-3.5 py-2.5 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none font-bold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
              Headline Line 2 (Highlighted Outline)
            </label>
            <input
              type="text"
              value={sil.titleLine2}
              onChange={(e) => updateSilhouettes({ titleLine2: e.target.value })}
              placeholder="Nothing else."
              maxLength={50}
              className="w-full px-3.5 py-2.5 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none font-bold text-burgundy"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
              Editorial Subtitle
            </label>
            <textarea
              rows={2}
              value={sil.subtitle}
              onChange={(e) => updateSilhouettes({ subtitle: e.target.value })}
              placeholder="No suits, no formal shoes. Every piece belongs to one of four silhouettes."
              maxLength={250}
              className="w-full px-3.5 py-2.5 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Silhouettes Cards / Panels Manager */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-burgundy/15 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-burgundy/10 pb-4">
          <div>
            <h2 className="font-serif text-lg font-bold text-espresso">
              Silhouettes & Cuts Cards
            </h2>
            <p className="text-xs text-espresso/60 mt-0.5">
              Customize the images, titles, cut numbers, mobile tags, and desktop expanded copy for each silhouette.
            </p>
          </div>
          <button
            type="button"
            onClick={addPanel}
            className="self-start sm:self-auto py-2 px-3.5 bg-burgundy hover:bg-crimson text-gold text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Silhouette</span>
          </button>
        </div>

        <div className="space-y-4">
          {panels.map((p, i) => {
            const isExpanded = expandedPanel === i;
            return (
              <div
                key={i}
                className="rounded-xl border border-burgundy/20 bg-ivory overflow-hidden transition-all shadow-2xs"
              >
                {/* Accordion Header */}
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-burgundy/5 transition-colors"
                  onClick={() => setExpandedPanel(isExpanded ? null : i)}
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-black/80 text-gold font-mono text-xs font-bold">
                      {p.no || `0${i + 1}`}
                    </span>
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-stone-900 border border-burgundy/20 flex-shrink-0">
                      {p.image ? (
                        <Image
                          src={p.image}
                          alt={p.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/40">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-espresso uppercase tracking-wider">
                        {p.name}
                      </h3>
                      <p className="text-[11px] text-espresso/60 truncate max-w-xs sm:max-w-md">
                        {p.shortTag || p.copy}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      disabled={i === 0}
                      onClick={() => movePanel(i, -1)}
                      title="Move Up"
                      className="p-1.5 text-espresso/60 hover:text-espresso disabled:opacity-30 disabled:hover:text-espresso/60 rounded"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={i === panels.length - 1}
                      onClick={() => movePanel(i, 1)}
                      title="Move Down"
                      className="p-1.5 text-espresso/60 hover:text-espresso disabled:opacity-30 disabled:hover:text-espresso/60 rounded"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removePanel(i)}
                      title="Remove Cut"
                      className="p-1.5 text-red-500 hover:text-red-700 rounded ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedPanel(isExpanded ? null : i)}
                      className="p-1.5 text-espresso/60 hover:text-espresso rounded"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Form Fields */}
                {isExpanded && (
                  <div className="p-4 sm:p-6 bg-white border-t border-burgundy/15 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
                          Cut Number / Badge
                        </label>
                        <input
                          type="text"
                          value={p.no}
                          onChange={(e) => updatePanel(i, { no: e.target.value })}
                          placeholder="01"
                          maxLength={6}
                          className="w-full px-3.5 py-2 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
                          Silhouette Name
                        </label>
                        <input
                          type="text"
                          value={p.name}
                          onChange={(e) => updatePanel(i, { name: e.target.value })}
                          placeholder="Oversized"
                          maxLength={40}
                          className="w-full px-3.5 py-2 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none font-bold uppercase"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
                          Collection Link
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={p.href}
                            onChange={(e) => updatePanel(i, { href: e.target.value })}
                            placeholder="/oversized or /shop?category=..."
                            className="w-full pl-8 pr-3.5 py-2 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none"
                          />
                          <Link2 className="w-3.5 h-3.5 text-espresso/50 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
                          Short Tagline (Mobile & Tablet View)
                        </label>
                        <input
                          type="text"
                          value={p.shortTag}
                          onChange={(e) => updatePanel(i, { shortTag: e.target.value })}
                          placeholder="e.g. 520gsm Loopback Hoodies & Dropped Tees"
                          maxLength={100}
                          className="w-full px-3.5 py-2 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
                          Detailed Editorial Copy (Desktop Expanded View)
                        </label>
                        <textarea
                          rows={2}
                          value={p.copy}
                          onChange={(e) => updatePanel(i, { copy: e.target.value })}
                          placeholder="Heavyweight loopback hoodies and 320gsm drop-shoulder tees engineered with relaxed architectural drape."
                          maxLength={300}
                          className="w-full px-3.5 py-2 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none"
                        />
                      </div>

                      {/* Cut Image */}
                      <div className="sm:col-span-3 space-y-2">
                        <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider">
                          Silhouette Card Image
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                          <div className="relative aspect-[3/4] md:aspect-[4/5] rounded-xl overflow-hidden bg-stone-900 border border-burgundy/20 shadow-xs">
                            {p.image ? (
                              <Image
                                src={p.image}
                                alt={p.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-white/40 gap-1">
                                <ImageIcon className="w-6 h-6" />
                                <span className="text-[10px]">No image selected</span>
                              </div>
                            )}
                          </div>

                          <div className="md:col-span-2 space-y-3">
                            <div>
                              <span className="block text-[10px] font-semibold text-espresso/70 uppercase mb-1">
                                Image URL (Direct paste or CDN link)
                              </span>
                              <input
                                type="text"
                                value={p.image}
                                onChange={(e) => updatePanel(i, { image: e.target.value })}
                                placeholder="https://..."
                                className="w-full px-3 py-2 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none"
                              />
                            </div>

                            <div>
                              <span className="block text-[10px] font-semibold text-espresso/70 uppercase mb-1">
                                Or Upload / Choose from Media Library:
                              </span>
                              <MediaUploader
                                kind="image"
                                max={1}
                                value={p.image ? [p.image] : []}
                                onChange={(urls) => updatePanel(i, { image: urls[0] || p.image })}
                                label="Upload Silhouette Photo"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
