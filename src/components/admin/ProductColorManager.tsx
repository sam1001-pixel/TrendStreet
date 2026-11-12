"use client";

import React, { useState } from "react";
import { Plus, Trash2, Palette, ArrowUp, Sparkles, Check } from "lucide-react";

export interface ProductColor {
  name: string;
  hex: string;
}

interface ProductColorManagerProps {
  colors: ProductColor[];
  onChange: (colors: ProductColor[]) => void;
}

const BRAND_PRESETS: { name: string; hex: string }[] = [
  { name: "Washed Black", hex: "#0A0A0A" },
  { name: "Off-White Ivory", hex: "#F5F5F0" },
  { name: "Oxblood Burgundy", hex: "#4A0E17" },
  { name: "Crimson Red", hex: "#B30015" },
  { name: "Charcoal Grey", hex: "#2B2B2B" },
  { name: "Heather Grey", hex: "#8A8A8A" },
  { name: "Olive Drab", hex: "#3B4434" },
  { name: "Midnight Navy", hex: "#1B2432" },
  { name: "Vintage Brown", hex: "#3E2723" },
  { name: "Earthy Taupe", hex: "#8D7B68" },
];

export function ProductColorManager({ colors = [], onChange }: ProductColorManagerProps) {
  const [newName, setNewName] = useState("");
  const [newHex, setNewHex] = useState("#0A0A0A");

  const handleAddColor = () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      alert("Please enter a colour name (e.g. Washed Black or Forest Green).");
      return;
    }
    const cleanHex = newHex.startsWith("#") ? newHex : `#${newHex}`;
    const next = [...colors, { name: trimmed, hex: cleanHex }];
    onChange(next);
    setNewName("");
  };

  const handleAddPreset = (preset: { name: string; hex: string }) => {
    const exists = colors.some(
      (c) => c.name.toLowerCase() === preset.name.toLowerCase() || c.hex.toLowerCase() === preset.hex.toLowerCase()
    );
    if (exists) {
      setNewName(preset.name);
      setNewHex(preset.hex);
      return;
    }
    onChange([...colors, preset]);
  };

  const handleUpdate = (index: number, updates: Partial<ProductColor>) => {
    const next = colors.map((c, i) => (i === index ? { ...c, ...updates } : c));
    onChange(next);
  };

  const handleRemove = (index: number) => {
    if (colors.length <= 1) {
      alert("Garments must have at least one available colour.");
      return;
    }
    onChange(colors.filter((_, i) => i !== index));
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    const item = colors[index];
    const remaining = colors.filter((_, i) => i !== index);
    onChange([item, ...remaining]);
  };

  return (
    <div className="rounded-2xl border-2 border-burgundy/15 bg-white p-4 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-burgundy/10 pb-3 gap-2">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-espresso flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-burgundy" />
            Available Garment Colours ({colors.length})
          </h4>
          <p className="text-[11px] text-espresso/60 mt-0.5">
            Manage the colorways customers can choose on the product page. First colour is the default.
          </p>
        </div>
        <span className="text-[10px] font-mono text-espresso/50">
          {colors.length} {colors.length === 1 ? "colourway active" : "colourways active"}
        </span>
      </div>

      {/* Active Colours List */}
      <div className="space-y-2">
        {colors.length === 0 ? (
          <div className="py-4 text-center rounded-xl border border-dashed border-burgundy/20 bg-ivory/40">
            <p className="text-xs text-crimson font-medium">No colours added yet.</p>
            <p className="text-[11px] text-espresso/50 mt-0.5">Add at least one colour below.</p>
          </div>
        ) : (
          colors.map((color, idx) => (
            <div
              key={`${color.name}-${idx}`}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-xl border border-burgundy/15 bg-ivory/30 hover:bg-white transition-colors gap-3"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Swatch & Native Color Picker */}
                <div className="relative group shrink-0">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-black/20 shadow-xs transition-transform group-hover:scale-105"
                    style={{ backgroundColor: color.hex }}
                    title={`Click to pick hex: ${color.hex}`}
                  />
                  <input
                    type="color"
                    value={color.hex}
                    onChange={(e) => handleUpdate(idx, { hex: e.target.value })}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    title="Change color"
                  />
                </div>

                {/* Editable Colour Name */}
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={color.name}
                    onChange={(e) => handleUpdate(idx, { name: e.target.value })}
                    placeholder="Colour name (e.g. Washed Black)"
                    className="w-full bg-white px-2.5 py-1.5 rounded-lg border border-burgundy/20 text-xs font-semibold text-espresso focus:outline-none focus:border-burgundy"
                  />
                </div>

                {/* Editable Hex Code */}
                <div className="w-24 shrink-0">
                  <input
                    type="text"
                    value={color.hex}
                    onChange={(e) => handleUpdate(idx, { hex: e.target.value })}
                    placeholder="#000000"
                    className="w-full bg-white px-2 py-1.5 rounded-lg border border-burgundy/20 font-mono text-[11px] text-espresso text-center uppercase focus:outline-none focus:border-burgundy"
                  />
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                {idx === 0 ? (
                  <span className="px-2 py-1 bg-burgundy/10 text-burgundy font-bold text-[9px] uppercase tracking-wider rounded-md border border-burgundy/20">
                    Primary / Cover
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(idx)}
                    className="px-2 py-1 bg-white hover:bg-ivory text-espresso/70 hover:text-burgundy font-medium text-[10px] rounded-md border border-burgundy/20 transition-colors flex items-center gap-1"
                    title="Move this colour to default primary"
                  >
                    <ArrowUp className="w-3 h-3" /> Make Primary
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  disabled={colors.length <= 1}
                  className="p-1.5 text-crimson hover:bg-crimson/10 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors"
                  title={colors.length <= 1 ? "At least 1 colour required" : "Remove this colour"}
                  aria-label={`Remove colour ${color.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add New Colour Row */}
      <div className="p-3 bg-ivory/60 rounded-xl border border-burgundy/15 space-y-3">
        <span className="text-[11px] font-bold text-espresso uppercase tracking-wider block">
          Add Another Colourway
        </span>
        <div className="flex flex-col sm:flex-row items-center gap-2">
          {/* Color picker preview */}
          <div className="relative group shrink-0 self-start sm:self-auto">
            <div
              className="w-9 h-9 rounded-lg border-2 border-burgundy/20 shadow-xs flex items-center justify-center cursor-pointer transition-transform group-hover:scale-105"
              style={{ backgroundColor: newHex }}
              title="Click to pick hex code"
            />
            <input
              type="color"
              value={newHex}
              onChange={(e) => setNewHex(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              title="Pick color"
            />
          </div>

          {/* Hex Input */}
          <input
            type="text"
            value={newHex}
            onChange={(e) => setNewHex(e.target.value)}
            placeholder="#0A0A0A"
            className="w-full sm:w-28 bg-white px-3 py-2 rounded-xl border border-burgundy/20 font-mono text-xs text-espresso text-center uppercase"
          />

          {/* Colour Name Input */}
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Oxblood Burgundy, Olive Drab..."
            className="w-full sm:flex-1 bg-white px-3 py-2 rounded-xl border border-burgundy/20 text-xs text-espresso"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddColor();
              }
            }}
          />

          {/* Add Button */}
          <button
            type="button"
            onClick={handleAddColor}
            className="w-full sm:w-auto px-4 py-2 bg-burgundy hover:bg-crimson text-gold text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Colour</span>
          </button>
        </div>

        {/* Quick Brand Presets */}
        <div className="pt-2 border-t border-burgundy/10">
          <span className="text-[10px] text-espresso/60 font-semibold block mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-gold" /> Quick-add signature atelier palette:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {BRAND_PRESETS.map((preset) => {
              const isAdded = colors.some(
                (c) => c.name.toLowerCase() === preset.name.toLowerCase() || c.hex.toLowerCase() === preset.hex.toLowerCase()
              );
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleAddPreset(preset)}
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-all border ${
                    isAdded
                      ? "bg-stone-100 text-stone-500 border-stone-200 opacity-60"
                      : "bg-white text-espresso border-burgundy/15 hover:border-burgundy hover:bg-ivory shadow-2xs"
                  }`}
                  title={isAdded ? `${preset.name} is already added` : `Click to add ${preset.name} (${preset.hex})`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                    style={{ backgroundColor: preset.hex }}
                  />
                  <span>{preset.name}</span>
                  {isAdded && <Check className="w-2.5 h-2.5 text-stone-500" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
