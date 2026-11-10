"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import {
  UploadCloud,
  Image as ImageIcon,
  X,
  Check,
  Sparkles,
  Link as LinkIcon,
  RefreshCw,
  FolderOpen,
} from "lucide-react";

// Curated high-resolution Trend Street Atelier studio assets
const ATELIER_GALLERY_PRESETS = [
  {
    name: "Tokyo Loopback Hoodie (520gsm)",
    url: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1200&auto=format&fit=crop",
    category: "Oversized",
  },
  {
    name: "Mayfair Heavyweight Tee (320gsm)",
    url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1200&auto=format&fit=crop",
    category: "Oversized",
  },
  {
    name: "Milan Poplin Boxy Overshirt",
    url: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1200&auto=format&fit=crop",
    category: "Boxy Fit",
  },
  {
    name: "Kyoto Heavy Mercerized Tee",
    url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1200&auto=format&fit=crop",
    category: "Boxy Fit",
  },
  {
    name: "Tuscan Suede Flight Bomber",
    url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1200&auto=format&fit=crop",
    category: "Jackets",
  },
  {
    name: "Melton Wool Structured Chore",
    url: "https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1200&auto=format&fit=crop",
    category: "Jackets",
  },
];

interface ImageGalleryUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  label?: string;
  helperText?: string;
}

export const ImageGalleryUpload: React.FC<ImageGalleryUploadProps> = ({
  images,
  onChange,
  maxImages = 6,
  label = "Garment Imagery & Gallery",
  helperText = "Upload directly from your device gallery, choose atelier presets, or paste a URL.",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef(images);
  imagesRef.current = images;

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [showPresetGallery, setShowPresetGallery] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Upload single file with network endpoint or local FileReader fallback
  const uploadSingleFile = async (file: File): Promise<string | null> => {
    // 1. Try multipart upload to /api/admin/upload
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) return data.url;
      }
    } catch (e) {
      console.warn("Upload endpoint failed, falling back to local reader:", e);
    }

    // 2. Direct FileReader fallback for zero-network resilience
    return new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve(result || null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  const processFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (!files.length) return;

    setIsUploading(true);
    setUploadError(null);

    let currentImages = [...imagesRef.current];

    for (const file of files) {
      if (currentImages.length >= maxImages) {
        setUploadError(`Maximum of ${maxImages} images allowed per garment.`);
        break;
      }
      try {
        const uploadedUrl = await uploadSingleFile(file);
        if (uploadedUrl) {
          currentImages = [...currentImages, uploadedUrl];
          onChange(currentImages);
        }
      } catch (err) {
        console.error("Failed to upload file:", file.name, err);
      }
    }

    setIsUploading(false);
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    void processFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      void processFiles(files);
    }
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    if (images.length >= maxImages) {
      setUploadError(`Maximum of ${maxImages} images reached.`);
      return;
    }
    onChange([...images, urlInput.trim()]);
    setUrlInput("");
    setUploadError(null);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const next = images.filter((_, idx) => idx !== indexToRemove);
    onChange(next);
  };

  const handleSetPrimary = (indexToPrimary: number) => {
    if (indexToPrimary === 0) return;
    const selected = images[indexToPrimary];
    const rest = images.filter((_, idx) => idx !== indexToPrimary);
    onChange([selected, ...rest]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-espresso">
            {label} ({images.length}/{maxImages})
          </label>
          <p className="text-[10px] text-espresso/60">{helperText}</p>
        </div>

        <button
          type="button"
          onClick={() => setShowPresetGallery(!showPresetGallery)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-burgundy bg-burgundy/10 hover:bg-burgundy/20 rounded-lg transition-colors"
        >
          <Sparkles className="w-3 h-3 text-gold" />
          <span>{showPresetGallery ? "Hide Presets" : "Atelier Presets"}</span>
        </button>
      </div>

      {uploadError && (
        <div className="p-2 text-xs text-crimson bg-crimson/10 border border-crimson/20 rounded-lg">
          {uploadError}
        </div>
      )}

      {/* Preset Gallery Picker Modal/Drawer */}
      {showPresetGallery && (
        <div className="p-3 bg-espresso/5 border border-burgundy/20 rounded-2xl space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-espresso">
              Select Curated Atelier Imagery
            </span>
            <span className="text-[10px] text-espresso/50">Click to add to garment</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ATELIER_GALLERY_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => {
                  if (images.length < maxImages) {
                    onChange([...images, preset.url]);
                  }
                }}
                className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-burgundy/20 hover:border-gold hover:shadow-md transition-all text-left"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preset.url}
                  alt={preset.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-espresso/90 via-espresso/20 to-transparent p-2 flex flex-col justify-end">
                  <span className="text-[9px] font-mono text-gold font-bold">{preset.category}</span>
                  <span className="text-[10px] font-bold text-white leading-tight truncate">{preset.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {images.map((imgUrl, idx) => (
            <div
              key={`${imgUrl}-${idx}`}
              className={`relative aspect-[3/4] rounded-2xl overflow-hidden border ${
                idx === 0 ? "border-gold shadow-xs" : "border-burgundy/20"
              } bg-stone-100 group`}
            >
              {/* Image Preview */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgUrl}
                alt={`Garment image ${idx + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Primary Image Badge */}
              {idx === 0 && (
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-gold text-espresso text-[9px] font-bold uppercase tracking-wider shadow-xs">
                  Primary
                </div>
              )}

              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-espresso/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2 text-white">
                {idx !== 0 && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(idx)}
                    className="px-2 py-1 bg-gold text-espresso text-[10px] font-bold uppercase rounded-md hover:bg-gold-light transition-colors"
                  >
                    Set Primary
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="p-1.5 bg-crimson text-white rounded-full hover:bg-red-700 transition-colors"
                  title="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload & Dropzone Area */}
      {images.length < maxImages && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-4 sm:p-6 text-center transition-all ${
            isDragging
              ? "border-gold bg-gold/5"
              : "border-burgundy/25 bg-ivory/50 hover:border-burgundy/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={onFileInputChange}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-2.5">
            <div className="w-10 h-10 rounded-full bg-burgundy/10 flex items-center justify-center text-burgundy">
              {isUploading ? (
                <RefreshCw className="w-5 h-5 animate-spin text-gold" />
              ) : (
                <UploadCloud className="w-5 h-5" />
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-espresso">
                {isUploading ? "Uploading & Optimizing image..." : "Upload from Device Gallery or Drag & Drop"}
              </p>
              <p className="text-[10px] text-espresso/60 mt-0.5">
                Supports JPG, PNG, WEBP, AVIF up to 8MB
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-burgundy hover:bg-crimson text-gold text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-xs disabled:opacity-50"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Upload from Gallery / Device</span>
              </button>
            </div>
          </div>

          {/* Fallback URL input */}
          <div className="mt-4 pt-3 border-t border-burgundy/10 flex items-center gap-2 max-w-md mx-auto">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-espresso/40" />
              <input
                type="url"
                placeholder="Or paste external image URL (https://...)"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddUrl();
                  }
                }}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-lg border border-burgundy/20 focus:border-burgundy focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleAddUrl}
              className="px-3 py-1.5 text-xs font-bold bg-espresso text-ivory hover:bg-stone-800 rounded-lg transition-colors"
            >
              Add URL
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
