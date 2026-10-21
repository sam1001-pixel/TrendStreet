"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sliders,
  Sparkles,
  Save,
  RotateCcw,
  ExternalLink,
  Tag,
  Phone,
  Layout,
  Layers,
  Percent,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAdminData } from "@/hooks/useAdminData";
import { AdminStatusBar } from "@/components/admin/AdminStatusBar";
import { SiteSettings } from "@/types/store";

export default function AdminSettingsPage() {
  const { siteSettings, updateSiteSettings, resetSiteSettings, error, notice, clearError } = useAdminData();
  const [formData, setFormData] = useState<SiteSettings>(siteSettings);
  // Pick up the live database values once they load (and after each save).
  useEffect(() => setFormData(siteSettings), [siteSettings]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const [activeTab, setActiveTab] = useState<
    "hero" | "announcement" | "categories" | "marquee" | "promos" | "contact"
  >("hero");
  const [newPromoCode, setNewPromoCode] = useState({
    code: "",
    discountPercent: 15,
    description: "",
  });
  const [newMarqueeText, setNewMarqueeText] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(await updateSiteSettings(formData))) return;
    setSaveStatus("saved");
    setTimeout(() => {
      setSaveStatus("idle");
    }, 3000);
  };

  const handleReset = () => {
    if (
      window.confirm(
        "Are you sure you want to restore the default settings for Trend Street? All custom hero headlines, announcement bar, and promotional codes will be reset."
      )
    ) {
      void resetSiteSettings();
    }
  };

  const addPromoCode = () => {
    if (!newPromoCode.code.trim()) return;
    const updated = [
      ...formData.promoCodes,
      {
        code: newPromoCode.code.trim().toUpperCase(),
        discountPercent: Number(newPromoCode.discountPercent) || 10,
        description: newPromoCode.description.trim() || "Promotional Discount",
      },
    ];
    setFormData({ ...formData, promoCodes: updated });
    setNewPromoCode({ code: "", discountPercent: 15, description: "" });
  };

  const removePromoCode = (codeToRemove: string) => {
    const updated = formData.promoCodes.filter((p) => p.code !== codeToRemove);
    setFormData({ ...formData, promoCodes: updated });
  };

  const addMarqueePhrase = () => {
    if (!newMarqueeText.trim()) return;
    setFormData({
      ...formData,
      marqueePhrases: [...formData.marqueePhrases, newMarqueeText.trim()],
    });
    setNewMarqueeText("");
  };

  const removeMarqueePhrase = (indexToRemove: number) => {
    setFormData({
      ...formData,
      marqueePhrases: formData.marqueePhrases.filter((_, idx) => idx !== indexToRemove),
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-burgundy/15 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-[0.2em] text-crimson mb-1">
            <Sliders className="w-3.5 h-3.5" />
            <span>Storefront Dynamic CMS</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-espresso">
            Site Customizer & Live Controls
          </h1>
          <p className="text-xs text-espresso/70 mt-0.5">
            Modify any storefront banner, hero headlines, category taglines, promo codes, and contact info live with instant browser sync.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/"
            target="_blank"
            className="py-2.5 px-3.5 bg-white border border-burgundy/25 hover:border-burgundy text-burgundy text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Preview Storefront</span>
          </Link>

          <button
            type="button"
            onClick={handleReset}
            className="py-2.5 px-3.5 bg-white border border-red-200 hover:border-red-400 text-red-600 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="py-2.5 px-4 bg-burgundy hover:bg-crimson text-gold text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Apply Live Changes</span>
          </button>
        </div>
      </div>

      {saveStatus === "saved" && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between gap-3 text-green-900 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-2.5 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span>
              <strong>Success!</strong> All changes were written to live store state. Open the storefront in any tab to see updates immediately.
            </span>
          </div>
          <Link
            href="/"
            target="_blank"
            className="text-[11px] font-bold underline uppercase tracking-wider text-green-800 hover:text-green-900"
          >
            View Live
          </Link>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="flex overflow-x-auto border-b border-burgundy/15 gap-2 no-scrollbar">
        {[
          { id: "hero", label: "Hero & Headlines", icon: Layout },
          { id: "announcement", label: "Announcement Bar", icon: Sparkles },
          { id: "categories", label: "Category Taglines", icon: Layers },
          { id: "marquee", label: "Marquee Ticker", icon: Tag },
          { id: "promos", label: "Promo Codes", icon: Percent },
          { id: "contact", label: "Concierge & Atelier", icon: Phone },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2.5 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? "border-burgundy text-burgundy bg-burgundy/5"
                  : "border-transparent text-espresso/60 hover:text-espresso"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Settings Form Body */}
      <AdminStatusBar error={error} notice={notice} onDismiss={clearError} />
      <form onSubmit={handleSave} className="space-y-6">
        {/* Tab 1: Hero & Headlines */}
        {activeTab === "hero" && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-burgundy/15 shadow-xs space-y-6">
            <div className="border-b border-burgundy/10 pb-3">
              <h2 className="font-serif text-lg font-bold text-espresso">
                Storefront Hero Presentation
              </h2>
              <p className="text-xs text-espresso/60">
                Configure the primary headline, hero badge, descriptive copy, and CTA links.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
                  Hero Top Badge
                </label>
                <input
                  type="text"
                  value={formData.hero.badgeText}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hero: { ...formData.hero, badgeText: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
                  Headline Line 1
                </label>
                <input
                  type="text"
                  value={formData.hero.titleLine1}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hero: { ...formData.hero, titleLine1: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none font-serif text-base"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
                  Headline Line 2 (Highlighted)
                </label>
                <input
                  type="text"
                  value={formData.hero.titleLine2}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hero: { ...formData.hero, titleLine2: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none font-serif text-base"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
                  Subtitle Description
                </label>
                <textarea
                  rows={2}
                  value={formData.hero.subtitle}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hero: { ...formData.hero, subtitle: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
                  Primary CTA Label
                </label>
                <input
                  type="text"
                  value={formData.hero.primaryBtnText}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hero: { ...formData.hero, primaryBtnText: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
                  Primary CTA Destination URL
                </label>
                <input
                  type="text"
                  value={formData.hero.primaryBtnLink}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hero: { ...formData.hero, primaryBtnLink: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
                  Secondary CTA Label
                </label>
                <input
                  type="text"
                  value={formData.hero.secondaryBtnText}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hero: { ...formData.hero, secondaryBtnText: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
                  Secondary CTA Destination URL
                </label>
                <input
                  type="text"
                  value={formData.hero.secondaryBtnLink}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hero: { ...formData.hero, secondaryBtnLink: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none"
                />
              </div>
            </div>

            {/* Three Live Stats */}
            <div className="pt-4 border-t border-burgundy/10">
              <h3 className="text-xs font-bold uppercase tracking-wider text-espresso mb-3">
                Hero Metrics & Trust Counters
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-ivory rounded-xl border border-burgundy/15 space-y-2">
                  <span className="text-[10px] font-bold text-espresso/60 uppercase">Stat #1</span>
                  <input
                    type="text"
                    placeholder="Value (e.g. 520gsm)"
                    value={formData.hero.stat1Value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hero: { ...formData.hero, stat1Value: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-white rounded border border-burgundy/20 font-bold"
                  />
                  <input
                    type="text"
                    placeholder="Label (e.g. Heavyweight Loopback)"
                    value={formData.hero.stat1Label}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hero: { ...formData.hero, stat1Label: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-white rounded border border-burgundy/20 text-espresso/70"
                  />
                </div>

                <div className="p-3 bg-ivory rounded-xl border border-burgundy/15 space-y-2">
                  <span className="text-[10px] font-bold text-espresso/60 uppercase">Stat #2</span>
                  <input
                    type="text"
                    placeholder="Value (e.g. 14oz)"
                    value={formData.hero.stat2Value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hero: { ...formData.hero, stat2Value: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-white rounded border border-burgundy/20 font-bold"
                  />
                  <input
                    type="text"
                    placeholder="Label (e.g. Okayama Selvedge Denim)"
                    value={formData.hero.stat2Label}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hero: { ...formData.hero, stat2Label: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-white rounded border border-burgundy/20 text-espresso/70"
                  />
                </div>

                <div className="p-3 bg-ivory rounded-xl border border-burgundy/15 space-y-2">
                  <span className="text-[10px] font-bold text-espresso/60 uppercase">Stat #3</span>
                  <input
                    type="text"
                    placeholder="Value (e.g. Boxy Cut)"
                    value={formData.hero.stat3Value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hero: { ...formData.hero, stat3Value: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-white rounded border border-burgundy/20 font-bold"
                  />
                  <input
                    type="text"
                    placeholder="Label (e.g. Dropped-Shoulder Geometry)"
                    value={formData.hero.stat3Label}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hero: { ...formData.hero, stat3Label: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-white rounded border border-burgundy/20 text-espresso/70"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Top Announcement Bar */}
        {activeTab === "announcement" && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-burgundy/15 shadow-xs space-y-6">
            <div className="border-b border-burgundy/10 pb-3 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-lg font-bold text-espresso">
                  Top Header Announcement Banner
                </h2>
                <p className="text-xs text-espresso/60">
                  Controls the top-most bar that alerts customers to sales, drops, or shipping guarantees.
                </p>
              </div>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.topAnnouncement.enabled}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      topAnnouncement: {
                        ...formData.topAnnouncement,
                        enabled: e.target.checked,
                      },
                    })
                  }
                  className="rounded text-burgundy focus:ring-burgundy w-4 h-4"
                />
                <span className="text-xs font-bold uppercase tracking-wider text-espresso">
                  {formData.topAnnouncement.enabled ? "Active" : "Disabled"}
                </span>
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
                  Announcement Message
                </label>
                <input
                  type="text"
                  value={formData.topAnnouncement.text}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      topAnnouncement: {
                        ...formData.topAnnouncement,
                        text: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none"
                  placeholder="e.g. COMPLIMENTARY COURIER ON ALL OVERSIZED & JACKET PIECES"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
                    Action Link Text (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.topAnnouncement.linkText}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        topAnnouncement: {
                          ...formData.topAnnouncement,
                          linkText: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none"
                    placeholder="e.g. CLAIM CODE: STREET20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
                    Link Destination URL
                  </label>
                  <input
                    type="text"
                    value={formData.topAnnouncement.linkUrl}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        topAnnouncement: {
                          ...formData.topAnnouncement,
                          linkUrl: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none"
                    placeholder="/shop"
                  />
                </div>
              </div>

              {/* Live Preview */}
              <div className="mt-4 p-4 bg-espresso text-ivory rounded-xl border border-burgundy/30 text-center">
                <span className="text-[10px] text-gold/80 block uppercase tracking-widest font-mono mb-1">
                  Live Banner Preview
                </span>
                <p className="text-xs font-medium tracking-wide">
                  {formData.topAnnouncement.text}{" "}
                  {formData.topAnnouncement.linkText && (
                    <span className="text-gold underline font-bold ml-1">
                      {formData.topAnnouncement.linkText} →
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Category Taglines */}
        {activeTab === "categories" && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-burgundy/15 shadow-xs space-y-6">
            <p role="note" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
              Category taglines are not stored in the database yet, so changes here only affect this browser.
            </p>
            <div className="border-b border-burgundy/10 pb-3">
              <h2 className="font-serif text-lg font-bold text-espresso">
                4 Core Silhouette Category Taglines
              </h2>
              <p className="text-xs text-espresso/60">
                Fine-tune the brand copy for Oversized, Jeans, Boxy Fit, and Jackets across homepage cards and landing banners.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
                  Oversized Silhouette Tagline
                </label>
                <input
                  type="text"
                  value={formData.categoryTaglines.Oversized}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      categoryTaglines: {
                        ...formData.categoryTaglines,
                        Oversized: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
                  Jeans Silhouette Tagline
                </label>
                <input
                  type="text"
                  value={formData.categoryTaglines.Jeans}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      categoryTaglines: {
                        ...formData.categoryTaglines,
                        Jeans: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
                  Boxy Fit Silhouette Tagline
                </label>
                <input
                  type="text"
                  value={formData.categoryTaglines["Boxy Fit"]}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      categoryTaglines: {
                        ...formData.categoryTaglines,
                        "Boxy Fit": e.target.value,
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
                  Jackets Silhouette Tagline
                </label>
                <input
                  type="text"
                  value={formData.categoryTaglines.Jackets}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      categoryTaglines: {
                        ...formData.categoryTaglines,
                        Jackets: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Marquee Ticker */}
        {activeTab === "marquee" && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-burgundy/15 shadow-xs space-y-6">
            <div className="border-b border-burgundy/10 pb-3">
              <h2 className="font-serif text-lg font-bold text-espresso">
                Animated Marquee Ticker
              </h2>
              <p className="text-xs text-espresso/60">
                Manage the horizontal scrolling ticker phrases between the hero and trending collections.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider">
                Current Ticker Items ({formData.marqueePhrases.length})
              </label>

              <div className="space-y-2">
                {formData.marqueePhrases.map((phrase, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-ivory rounded-lg border border-burgundy/15 text-xs"
                  >
                    <span className="font-medium text-espresso">{phrase}</span>
                    <button
                      type="button"
                      onClick={() => removeMarqueePhrase(idx)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  value={newMarqueeText}
                  onChange={(e) => setNewMarqueeText(e.target.value)}
                  placeholder="Enter new marquee message..."
                  className="flex-1 px-3.5 py-2.5 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addMarqueePhrase}
                  className="py-2.5 px-4 bg-burgundy hover:bg-crimson text-gold text-xs font-bold uppercase rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Phrase</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Promo Codes */}
        {activeTab === "promos" && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-burgundy/15 shadow-xs space-y-6">
            <p role="note" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
              Checkout only honours the codes defined in <code>src/lib/pricing.ts</code> (TREND10, STREET20, BUNDLE15, VIP15, FREESHIP). Codes added here are not applied at checkout yet.
            </p>
            <div className="border-b border-burgundy/10 pb-3">
              <h2 className="font-serif text-lg font-bold text-espresso">
                Active Promo Codes & Discounts
              </h2>
              <p className="text-xs text-espresso/60">
                Define valid discount codes that customers can apply at checkout and in the shopping bag.
              </p>
            </div>

            {/* Existing Promo Codes Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-ivory text-espresso/80 border-b border-burgundy/15 uppercase font-bold text-[10px] tracking-wider">
                    <th className="p-3">Code</th>
                    <th className="p-3">Discount</th>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-burgundy/10">
                  {formData.promoCodes.map((promo) => (
                    <tr key={promo.code} className="hover:bg-ivory/50">
                      <td className="p-3 font-mono font-bold text-burgundy">{promo.code}</td>
                      <td className="p-3 font-bold text-espresso">{promo.discountPercent}% OFF</td>
                      <td className="p-3 text-espresso/70">{promo.description}</td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => removePromoCode(promo.code)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add New Promo Code */}
            <div className="p-4 bg-ivory rounded-xl border border-burgundy/15 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-espresso">
                Create New Promo Code
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <input
                    type="text"
                    placeholder="CODE (e.g. VIP25)"
                    value={newPromoCode.code}
                    onChange={(e) =>
                      setNewPromoCode({ ...newPromoCode, code: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 text-xs bg-white rounded border border-burgundy/20 font-mono font-bold uppercase"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="Discount % (e.g. 25)"
                    value={newPromoCode.discountPercent}
                    onChange={(e) =>
                      setNewPromoCode({
                        ...newPromoCode,
                        discountPercent: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-white rounded border border-burgundy/20"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Description (e.g. Spring Sale)"
                    value={newPromoCode.description}
                    onChange={(e) =>
                      setNewPromoCode({ ...newPromoCode, description: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-white rounded border border-burgundy/20"
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={addPromoCode}
                    className="w-full py-2 bg-burgundy hover:bg-crimson text-gold text-xs font-bold uppercase rounded transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Code</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Concierge & Atelier Contact */}
        {activeTab === "contact" && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-burgundy/15 shadow-xs space-y-6">
            <div className="border-b border-burgundy/10 pb-3">
              <h2 className="font-serif text-lg font-bold text-espresso">
                Store Concierge & Atelier Details
              </h2>
              <p className="text-xs text-espresso/60">
                Updates client concierge contact numbers, support email, operating hours, and flagship showroom address in the footer.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
                  Concierge Support Email
                </label>
                <input
                  type="email"
                  value={formData.contactInfo.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactInfo: {
                        ...formData.contactInfo,
                        email: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
                  Concierge Phone Line
                </label>
                <input
                  type="text"
                  value={formData.contactInfo.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactInfo: {
                        ...formData.contactInfo,
                        phone: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
                  Operating Hours & Availability
                </label>
                <input
                  type="text"
                  value={formData.contactInfo.hours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactInfo: {
                        ...formData.contactInfo,
                        hours: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-espresso uppercase tracking-wider mb-1">
                  Atelier Flagship Address
                </label>
                <input
                  type="text"
                  value={formData.contactInfo.address}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactInfo: {
                        ...formData.contactInfo,
                        address: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-ivory rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Bottom Save Bar */}
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-burgundy/15 shadow-xs">
          <div className="flex items-center space-x-2 text-xs text-espresso/70">
            <AlertCircle className="w-4 h-4 text-burgundy" />
            <span>Changes take effect immediately across all storefront visitor sessions.</span>
          </div>

          <button
            type="submit"
            className="py-3 px-6 bg-burgundy hover:bg-crimson text-gold text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save & Apply Live to Store</span>
          </button>
        </div>
      </form>
    </div>
  );
}
