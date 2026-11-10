"use client";

import React, { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Film, ImageIcon, Library, Link2, Loader2, Play, Trash2, UploadCloud, X } from "lucide-react";
import { ACCEPT, UploadKind, isVideoUrl, uploadMedia } from "@/lib/upload-client";
import { lockScroll } from "@/lib/scroll-lock";

interface MediaUploaderProps {
  kind: UploadKind;
  value: string[];
  onChange: (urls: string[]) => void;
  /** Maximum number of files (1 = single file picker). */
  max?: number;
  label?: string;
  helperText?: string;
}

interface Pending {
  id: number;
  name: string;
  pct: number;
}

interface LibraryItem {
  url: string;
  name: string;
  kind: UploadKind;
  size: number;
  usedBy: string[];
}

let nextId = 1;

/** Upload, reorder and remove product photos/videos or a review video. */
export function MediaUploader({ kind, value, onChange, max = 12, label, helperText }: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [library, setLibrary] = useState<LibraryItem[] | null>(null);
  const [libraryError, setLibraryError] = useState<string | null>(null);

  React.useEffect(() => {
    if (libraryOpen) {
      const unlock = lockScroll();
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setLibraryOpen(false);
      };
      window.addEventListener("keydown", onKeyDown);
      return () => {
        unlock();
        window.removeEventListener("keydown", onKeyDown);
      };
    }
  }, [libraryOpen]);

  // Latest list, so parallel uploads all land even though onChange is async.
  const valueRef = useRef(value);
  valueRef.current = value;

  const single = max === 1;
  const room = Math.max(0, max - value.length - pending.length);
  const Icon = kind === "video" ? Film : ImageIcon;
  const noun = kind === "video" ? "video" : "photo";

  const add = (urls: string[]) => {
    const merged = single ? urls.slice(-1) : [...valueRef.current, ...urls].slice(0, max);
    valueRef.current = merged;
    onChange(merged);
  };

  const handleFiles = async (files: FileList | File[]) => {
    setError(null);
    const list = Array.from(files).slice(0, single ? 1 : room);
    if (!list.length) {
      setError(`You can add up to ${max} ${noun}${max === 1 ? "" : "s"}. Remove one first.`);
      return;
    }
    await Promise.all(
      list.map(async (file) => {
        const id = nextId++;
        setPending((p) => [...p, { id, name: file.name, pct: 0 }]);
        try {
          const url = await uploadMedia(file, kind, (pct) => setPending((p) => p.map((x) => (x.id === id ? { ...x, pct } : x))));
          add([url]);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Upload failed.");
        } finally {
          setPending((p) => p.filter((x) => x.id !== id));
        }
      })
    );
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const remove = (i: number) => onChange(value.filter((_, k) => k !== i));

  const addUrl = () => {
    const u = urlInput.trim();
    if (!/^(https:\/\/|\/(?![\/\\]))/.test(u)) {
      setError("Paste a full https:// link.");
      return;
    }
    add([u]);
    setUrlInput("");
    setError(null);
  };

  const openLibrary = async () => {
    setLibraryOpen(true);
    setLibraryError(null);
    try {
      const res = await fetch("/api/admin/media", { credentials: "same-origin" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load the library.");
      setLibrary((data.items as LibraryItem[]).filter((m) => m.kind === kind));
    } catch (e) {
      setLibraryError(e instanceof Error ? e.message : "Could not load the library.");
    }
  };

  return (
    <div className="space-y-3">
      {label && (
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-espresso">
            <Icon className="h-4 w-4 text-crimson" /> {label}
          </span>
          <div className="flex items-center gap-3">
            {value.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-[11px] font-bold text-crimson hover:text-burgundy flex items-center gap-1 transition-colors"
                title={`Remove all ${value.length} ${noun}s`}
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove All ({value.length})
              </button>
            )}
            {!single && (
              <span className="text-[11px] text-espresso/50">
                {value.length}/{max}
              </span>
            )}
          </div>
        </div>
      )}

      {(value.length > 0 || pending.length > 0) && (
        <div className={`grid gap-2.5 ${kind === "video" ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-4"}`}>
          {value.map((url, i) => (
            <div key={`${url}-${i}`} className="group relative overflow-hidden rounded-xl border-2 border-burgundy/15 bg-espresso/5 shadow-sm hover:border-burgundy/40 transition-all">
              <div className={kind === "video" ? "aspect-[9/16] max-h-56 w-full" : "aspect-[4/5] w-full"}>
                {kind === "video" || isVideoUrl(url) ? (
                  <video src={url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt={`Upload ${i + 1}`} className="h-full w-full object-cover" />
                )}
              </div>
              {kind === "video" && (
                <span className="pointer-events-none absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white">
                  <Play className="h-4 w-4 fill-white" />
                </span>
              )}
              {i === 0 && !single && kind === "image" && (
                <span className="absolute left-1.5 top-1.5 rounded-md bg-crimson px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md z-10">
                  Cover Photo
                </span>
              )}

              {/* Prominent top-right Quick-Remove (X) badge button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(i);
                }}
                aria-label={`Remove ${noun} ${i + 1}`}
                title={`Remove this ${noun}`}
                className="absolute right-1.5 top-1.5 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-crimson text-white shadow-lg transition-transform hover:scale-110 active:scale-95 hover:bg-black"
              >
                <X className="h-4 w-4 stroke-[2.5]" />
              </button>

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-2">
                {!single ? (
                  <span className="flex gap-1">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move earlier" title="Move earlier" className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-espresso hover:bg-white disabled:opacity-30">
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label="Move later" title="Move later" className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-espresso hover:bg-white disabled:opacity-30">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label={`Remove ${noun}`}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-crimson hover:bg-black text-white text-[11px] font-bold transition-colors shadow-sm"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ))}
          {pending.map((p) => (
            <div key={p.id} className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-burgundy/25 bg-white p-2 text-center ${kind === "video" ? "aspect-[9/16] max-h-56" : "aspect-[4/5]"}`}>
              <Loader2 className="h-5 w-5 animate-spin text-crimson" />
              <span className="line-clamp-2 break-all text-[10px] text-espresso/60">{p.name}</span>
              <span className="h-1.5 w-full overflow-hidden rounded-full bg-burgundy/10">
                <span className="block h-full bg-crimson transition-all" style={{ width: `${p.pct}%` }} />
              </span>
              <span className="text-[10px] font-bold text-espresso">{p.pct}%</span>
            </div>
          ))}
        </div>
      )}

      {(room > 0 || single) && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
          }}
          className={`rounded-xl border-2 border-dashed p-4 text-center transition-colors ${dragging ? "border-crimson bg-crimson/5" : "border-burgundy/20 bg-white"}`}
        >
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mx-auto flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-espresso px-5 text-xs font-bold uppercase tracking-wider text-white hover:bg-crimson"
          >
            <UploadCloud className="h-4 w-4" />
            {single && value.length ? `Replace ${noun}` : `Upload ${noun}${single ? "" : "s"}`}
          </button>
          <p className="mt-2 text-[11px] text-espresso/55">
            {helperText || (kind === "video" ? "MP4, WEBM or MOV · up to 200 MB · vertical 9:16 looks best on phones" : "JPG, PNG or WEBP · up to 8 MB · 4:5 portrait looks best")}
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT[kind]}
            multiple={!single}
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-burgundy/15 bg-white px-3">
          <Link2 className="h-4 w-4 flex-shrink-0 text-espresso/40" />
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrl();
              }
            }}
            placeholder={`…or paste a ${noun} link`}
            className="min-h-[44px] w-full bg-transparent text-sm text-espresso outline-none"
          />
          <button type="button" onClick={addUrl} className="text-xs font-bold uppercase text-crimson">
            Add
          </button>
        </div>
        <button
          type="button"
          onClick={openLibrary}
          className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-burgundy/20 bg-white px-4 text-xs font-bold uppercase tracking-wider text-espresso hover:border-espresso"
        >
          <Library className="h-4 w-4" /> From library
        </button>
      </div>

      {error && <p className="rounded-lg bg-crimson/10 px-3 py-2 text-xs font-medium text-crimson">{error}</p>}

      {libraryOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="media-library-title"
          data-lenis-prevent
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 sm:items-center sm:p-4 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => e.target === e.currentTarget && setLibraryOpen(false)}
        >
          <div className="flex max-h-[85dvh] w-full max-w-3xl flex-col rounded-t-3xl bg-ivory sm:rounded-2xl border border-gold/30 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-burgundy/15 px-5 py-3 shrink-0 bg-espresso text-ivory">
              <span id="media-library-title" className="text-sm font-bold uppercase tracking-wider text-ivory">Choose {noun}s</span>
              <button
                type="button"
                onClick={() => setLibraryOpen(false)}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full text-ivory/60 hover:text-ivory hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
              {libraryError ? (
                <p className="text-sm text-crimson">{libraryError}</p>
              ) : library === null ? (
                <p className="flex items-center justify-center gap-2 py-8 text-sm text-espresso/60">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </p>
              ) : library.length === 0 ? (
                <p className="py-8 text-center text-sm text-espresso/60">No uploaded {noun}s yet.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {library.map((m) => {
                    const chosen = value.includes(m.url);
                    return (
                      <button
                        key={m.url}
                        type="button"
                        disabled={chosen}
                        onClick={() => {
                          add([m.url]);
                          if (single) setLibraryOpen(false);
                        }}
                        className={`relative overflow-hidden rounded-lg border ${chosen ? "border-crimson opacity-50" : "border-burgundy/15 hover:border-espresso"}`}
                        title={m.name}
                      >
                        <div className={kind === "video" ? "aspect-[9/16]" : "aspect-square"}>
                          {kind === "video" ? (
                            <video src={m.url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                          )}
                        </div>
                        {chosen && <span className="absolute right-1 top-1 rounded bg-crimson px-1 text-[9px] font-bold text-white">ADDED</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="p-3 bg-espresso/5 border-t border-espresso/10 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setLibraryOpen(false)}
                className="px-4 py-2 bg-espresso text-ivory text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-burgundy transition-colors shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
