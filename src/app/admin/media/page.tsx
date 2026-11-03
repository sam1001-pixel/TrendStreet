"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, Film, ImageIcon, Loader2, Trash2 } from "lucide-react";
import { AdminStatusBar } from "@/components/admin/AdminStatusBar";
import { MediaUploader } from "@/components/admin/MediaUploader";

interface MediaItem {
  url: string;
  name: string;
  kind: "image" | "video";
  size: number;
  uploadedAt: string;
  usedBy: string[];
}

type Filter = "all" | "image" | "video" | "unused";

const size = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export default function AdminMediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [storage, setStorage] = useState<"blob" | "local" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [fresh, setFresh] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/media");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load the media library.");
      setItems(data.items);
      setStorage(data.storage);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the media library.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(
    () => items.filter((m) => (filter === "unused" ? m.usedBy.length === 0 : filter === "all" ? true : m.kind === filter)),
    [items, filter]
  );
  const totalSize = items.reduce((n, m) => n + m.size, 0);

  const toggle = (url: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(url)) n.delete(url);
      else n.add(url);
      return n;
    });

  const deleteSelected = async (urls: string[]) => {
    if (!urls.length) return;
    if (!confirm(`Delete ${urls.length} file${urls.length > 1 ? "s" : ""} permanently? This can't be undone.`)) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/media", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ urls }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete.");
      setItems((xs) => xs.filter((m) => !data.deleted.includes(m.url)));
      setSelected(new Set());
      if (data.skipped.length) setError(`${data.skipped.length} file(s) kept because they're still in use: ${data.skipped.map((s: { reason: string }) => s.reason).join("; ")}`);
      if (data.deleted.length) {
        setNotice(`Deleted ${data.deleted.length} file${data.deleted.length > 1 ? "s" : ""}`);
        setTimeout(() => setNotice(null), 3000);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete.");
    } finally {
      setDeleting(false);
    }
  };

  const copy = async (url: string) => {
    const full = url.startsWith("/") ? `${window.location.origin}${url}` : url;
    try {
      await navigator.clipboard.writeText(full);
      setCopied(url);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="space-y-6">
      <AdminStatusBar loading={loading} error={error} notice={notice} onDismiss={() => setError(null)} />

      <div className="border-b border-burgundy/15 pb-6">
        <span className="mb-1 block text-xs font-bold uppercase tracking-[0.2em] text-crimson">Uploads</span>
        <h1 className="font-serif text-2xl font-bold text-espresso sm:text-3xl">Media library ({items.length})</h1>
        <p className="mt-1 max-w-2xl text-xs text-espresso/70">
          Every photo and video uploaded for products and reviews · {size(totalSize)} used.{" "}
          {storage === "local" && (
            <strong className="text-crimson">
              Files are being saved on this computer only. Connect Vercel Blob storage before going live so uploads work on the hosted site.
            </strong>
          )}
        </p>
      </div>

      <section className="grid gap-4 rounded-2xl border border-burgundy/15 bg-white p-4 sm:grid-cols-2">
        <MediaUploader kind="image" value={fresh.filter((u) => !/\.(mp4|webm|mov)/i.test(u))} onChange={(u) => { setFresh((f) => [...f.filter((x) => /\.(mp4|webm|mov)/i.test(x)), ...u]); load(); }} label="Upload photos" max={50} />
        <MediaUploader kind="video" value={fresh.filter((u) => /\.(mp4|webm|mov)/i.test(u))} onChange={(u) => { setFresh((f) => [...f.filter((x) => !/\.(mp4|webm|mov)/i.test(x)), ...u]); load(); }} label="Upload videos" max={20} />
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {(
            [
              ["all", "All"],
              ["image", "Photos"],
              ["video", "Videos"],
              ["unused", "Not used"],
            ] as [Filter, string][]
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`min-h-[40px] whitespace-nowrap rounded-full border px-4 text-xs font-semibold ${
                filter === k ? "border-espresso bg-espresso text-white" : "border-burgundy/20 bg-white text-espresso"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {filter === "unused" && shown.length > 0 && (
            <button
              onClick={() => deleteSelected(shown.map((m) => m.url))}
              disabled={deleting}
              className="min-h-[40px] rounded-full border border-crimson px-4 text-xs font-bold uppercase text-crimson disabled:opacity-50"
            >
              Delete all unused
            </button>
          )}
          <button
            onClick={() => deleteSelected(Array.from(selected))}
            disabled={!selected.size || deleting}
            className="flex min-h-[40px] items-center gap-1.5 rounded-full bg-crimson px-4 text-xs font-bold uppercase text-white disabled:opacity-40"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete selected ({selected.size})
          </button>
        </div>
      </div>

      {!loading && shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-burgundy/25 bg-white p-10 text-center text-sm text-espresso/60">Nothing here.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {shown.map((m) => {
            const isSel = selected.has(m.url);
            return (
              <div key={m.url} className={`overflow-hidden rounded-xl border bg-white ${isSel ? "border-crimson ring-2 ring-crimson" : "border-burgundy/15"}`}>
                <button type="button" onClick={() => toggle(m.url)} className="relative block w-full" aria-pressed={isSel} aria-label={`Select ${m.name}`}>
                  <div className="aspect-square bg-espresso/5">
                    {m.kind === "video" ? (
                      <video src={m.url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <span className={`absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-md border-2 ${isSel ? "border-crimson bg-crimson text-white" : "border-white bg-black/30"}`}>
                    {isSel && <Check className="h-4 w-4" />}
                  </span>
                  <span className="absolute right-2 top-2 rounded bg-black/60 p-1 text-white">
                    {m.kind === "video" ? <Film className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
                  </span>
                </button>
                <div className="space-y-1 p-2">
                  <p className="truncate text-[11px] font-semibold text-espresso" title={m.name}>{m.name}</p>
                  <p className="text-[10px] text-espresso/50">{size(m.size)}</p>
                  <p className={`line-clamp-2 text-[10px] ${m.usedBy.length ? "text-green-800" : "text-espresso/40"}`} title={m.usedBy.join("\n")}>
                    {m.usedBy.length ? `Used: ${m.usedBy.join(", ")}` : "Not used"}
                  </p>
                  <button onClick={() => copy(m.url)} className="flex min-h-[32px] items-center gap-1 text-[11px] font-bold text-crimson">
                    {copied === m.url ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied === m.url ? "Copied" : "Copy link"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
