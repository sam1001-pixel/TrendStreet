"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Edit2, Eye, EyeOff, Film, Home, Loader2, Plus, Star, Trash2, X } from "lucide-react";
import { AdminStatusBar } from "@/components/admin/AdminStatusBar";
import { MediaUploader } from "@/components/admin/MediaUploader";

interface AdminReview {
  id: string;
  productId: string | null;
  product: { name: string } | null;
  author: string;
  city: string | null;
  rating: number;
  title: string | null;
  comment: string;
  videoUrl: string | null;
  posterUrl: string | null;
  verified: boolean;
  published: boolean;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
}

type Draft = Omit<AdminReview, "id" | "product" | "createdAt"> & { id?: string };

const EMPTY: Draft = {
  productId: null,
  author: "",
  city: "",
  rating: 5,
  title: "",
  comment: "",
  videoUrl: null,
  posterUrl: null,
  verified: true,
  published: true,
  featured: true,
  sortOrder: 0,
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) window.location.href = `/admin/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

type Filter = "all" | "video" | "home" | "hidden";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, p] = await Promise.all([
        api<{ reviews: AdminReview[] }>("/api/admin/reviews"),
        api<{ products: { id: string; name: string }[] }>("/api/admin/products").catch(() => ({ products: [] })),
      ]);
      setReviews(r.reviews);
      setProducts(p.products.map(({ id, name }) => ({ id, name })));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load reviews.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(
    () => ({
      all: reviews.length,
      video: reviews.filter((r) => r.videoUrl).length,
      home: reviews.filter((r) => r.featured && r.published && r.videoUrl).length,
      hidden: reviews.filter((r) => !r.published).length,
    }),
    [reviews]
  );

  const shown = reviews.filter((r) =>
    filter === "video" ? !!r.videoUrl : filter === "home" ? r.featured && r.published && !!r.videoUrl : filter === "hidden" ? !r.published : true
  );

  const save = async (d: Draft) => {
    setSaving(true);
    setError(null);
    try {
      const body = JSON.stringify(d);
      const { review } = d.id
        ? await api<{ review: AdminReview }>(`/api/admin/reviews/${d.id}`, { method: "PUT", body })
        : await api<{ review: AdminReview }>("/api/admin/reviews", { method: "POST", body });
      setReviews((rs) => (d.id ? rs.map((r) => (r.id === review.id ? review : r)) : [review, ...rs]));
      setDraft(null);
      flash(d.id ? "Review updated on the live site" : "Review published");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  const quickToggle = (r: AdminReview, patch: Partial<Draft>) => save({ ...toDraft(r), ...patch });

  const remove = async (r: AdminReview) => {
    if (!confirm(`Delete the review from ${r.author}?`)) return;
    const alsoMedia = r.videoUrl || r.posterUrl ? confirm("Also delete its video/cover file from storage?\n\nOK = delete the file too · Cancel = keep the file in the media library") : false;
    try {
      await api(`/api/admin/reviews/${r.id}${alsoMedia ? "?deleteMedia=1" : ""}`, { method: "DELETE" });
      setReviews((rs) => rs.filter((x) => x.id !== r.id));
      flash("Review deleted");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete.");
    }
  };

  return (
    <div className="space-y-6">
      <AdminStatusBar loading={loading} error={error} notice={notice} onDismiss={() => setError(null)} />

      <div className="flex flex-col justify-between gap-4 border-b border-burgundy/15 pb-6 sm:flex-row sm:items-end">
        <div>
          <span className="mb-1 block text-xs font-bold uppercase tracking-[0.2em] text-crimson">Social proof</span>
          <h1 className="font-serif text-2xl font-bold text-espresso sm:text-3xl">Reviews ({reviews.length})</h1>
          <p className="mt-1 max-w-xl text-xs text-espresso/70">
            Add customer reviews with or without a video. Videos marked <strong>Homepage</strong> play in the &ldquo;Real fits&rdquo; reel; every
            published review shows on its product page and counts towards the star rating.
          </p>
        </div>
        <button
          onClick={() => setDraft({ ...EMPTY })}
          className="flex min-h-[44px] items-center gap-1.5 self-start rounded-xl bg-espresso px-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-crimson sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Add review
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {(
          [
            ["all", "All"],
            ["video", "With video"],
            ["home", "On homepage"],
            ["hidden", "Hidden"],
          ] as [Filter, string][]
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`min-h-[40px] whitespace-nowrap rounded-full border px-4 text-xs font-semibold ${
              filter === k ? "border-espresso bg-espresso text-white" : "border-burgundy/20 bg-white text-espresso"
            }`}
          >
            {label} ({counts[k]})
          </button>
        ))}
      </div>

      {!loading && shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-burgundy/25 bg-white p-10 text-center">
          <Film className="mx-auto h-8 w-8 text-crimson" />
          <p className="mt-3 font-serif text-lg font-bold text-espresso">No reviews here yet</p>
          <p className="mt-1 text-xs text-espresso/60">Got a customer video on WhatsApp or Instagram? Upload it as a review.</p>
          <button onClick={() => setDraft({ ...EMPTY })} className="mt-4 min-h-[44px] rounded-full bg-crimson px-5 text-xs font-bold uppercase tracking-wider text-white">
            Add the first review
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((r) => (
            <article key={r.id} className={`flex min-w-0 gap-3 rounded-2xl border bg-white p-3 ${r.published ? "border-burgundy/15" : "border-dashed border-stone-300 opacity-70"}`}>
              <div className="relative h-36 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-espresso">
                {r.videoUrl ? (
                  <video src={r.videoUrl} poster={r.posterUrl || undefined} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center font-serif text-3xl font-bold text-white/80">{r.author.slice(0, 1)}</span>
                )}
                {r.videoUrl && (
                  <span className="absolute left-1 top-1 rounded bg-crimson px-1 text-[9px] font-bold uppercase text-white">Video</span>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-espresso">{r.author}</p>
                    <p className="truncate text-[11px] text-espresso/55">
                      {[r.city, r.product?.name || "General review"].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <span className="flex flex-shrink-0 items-center gap-0.5 text-xs font-bold text-espresso">
                    <Star className="h-3.5 w-3.5 fill-gold text-gold" /> {r.rating}
                  </span>
                </div>
                {r.title && <p className="mt-1 line-clamp-1 text-xs font-semibold text-espresso">{r.title}</p>}
                <p className="mt-0.5 line-clamp-2 text-xs text-espresso/70">{r.comment || "—"}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {r.featured && r.videoUrl && <span className="rounded bg-espresso px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">Homepage</span>}
                  {!r.published && <span className="rounded bg-stone-200 px-1.5 py-0.5 text-[9px] font-bold uppercase text-stone-700">Hidden</span>}
                  {r.verified && <span className="rounded bg-green-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-green-800">Verified</span>}
                </div>
                <div className="mt-auto flex items-center gap-1 pt-2">
                  <button onClick={() => setDraft(toDraft(r))} className="flex h-9 w-9 items-center justify-center rounded-lg text-espresso hover:bg-stone-100" aria-label="Edit">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => quickToggle(r, { published: !r.published })}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-espresso hover:bg-stone-100"
                    aria-label={r.published ? "Hide from site" : "Show on site"}
                    title={r.published ? "Hide from site" : "Show on site"}
                  >
                    {r.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  {r.videoUrl && (
                    <button
                      onClick={() => quickToggle(r, { featured: !r.featured })}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg hover:bg-stone-100 ${r.featured ? "text-crimson" : "text-espresso/40"}`}
                      aria-label={r.featured ? "Remove from homepage" : "Show on homepage"}
                      title={r.featured ? "Remove from homepage reel" : "Show in homepage reel"}
                    >
                      <Home className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={() => remove(r)} className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-crimson hover:bg-crimson/10" aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {draft && (
        <ReviewEditor
          draft={draft}
          products={products}
          saving={saving}
          onCancel={() => setDraft(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function toDraft(r: AdminReview): Draft {
  const { product: _p, createdAt: _c, ...rest } = r;
  return rest;
}

function ReviewEditor({
  draft,
  products,
  saving,
  onCancel,
  onSave,
}: {
  draft: Draft;
  products: { id: string; name: string }[];
  saving: boolean;
  onCancel: () => void;
  onSave: (d: Draft) => void;
}) {
  const [d, setD] = useState<Draft>(draft);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const input = "min-h-[44px] w-full rounded-xl border border-burgundy/20 bg-white px-3 text-sm text-espresso focus:border-espresso focus:outline-none";
  const label = "mb-1 block text-xs font-semibold text-espresso";

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <form
        role="dialog"
        aria-modal="true"
        aria-label={d.id ? "Edit review" : "Add review"}
        onSubmit={(e) => {
          e.preventDefault();
          onSave(d);
        }}
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col rounded-t-3xl bg-ivory sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-burgundy/15 px-5 py-3">
          <span className="font-serif text-lg font-bold text-espresso">{d.id ? "Edit review" : "Add review"}</span>
          <button type="button" onClick={onCancel} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-burgundy/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid flex-1 gap-4 overflow-y-auto px-5 py-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <MediaUploader kind="video" max={1} value={d.videoUrl ? [d.videoUrl] : []} onChange={(v) => set("videoUrl", v[0] ?? null)} label="Review video" />
          </div>
          {d.videoUrl && (
            <div className="sm:col-span-2">
              <MediaUploader
                kind="image"
                max={1}
                value={d.posterUrl ? [d.posterUrl] : []}
                onChange={(v) => set("posterUrl", v[0] ?? null)}
                label="Cover image (optional)"
                helperText="Shown before the video plays. Leave empty to use the video's first frame."
              />
            </div>
          )}

          <div>
            <label className={label} htmlFor="rv-author">Customer name *</label>
            <input id="rv-author" required className={input} value={d.author} onChange={(e) => set("author", e.target.value)} placeholder="e.g. Rahul S." />
          </div>
          <div>
            <label className={label} htmlFor="rv-city">City</label>
            <input id="rv-city" className={input} value={d.city || ""} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Jaipur" />
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="rv-product">Product</label>
            <select id="rv-product" className={input} value={d.productId || ""} onChange={(e) => set("productId", e.target.value || null)}>
              <option value="">General review (not about one product)</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <span className={label}>Rating</span>
            <div className="flex gap-1" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={d.rating === n}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  onClick={() => set("rating", n)}
                  className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-white"
                >
                  <Star className={`h-6 w-6 ${n <= d.rating ? "fill-gold text-gold" : "text-stone-300"}`} />
                </button>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="rv-title">Headline</label>
            <input id="rv-title" className={input} value={d.title || ""} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Perfect oversized fit" />
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="rv-comment">Review text {d.videoUrl ? "(optional with a video)" : "*"}</label>
            <textarea
              id="rv-comment"
              rows={3}
              className="w-full rounded-xl border border-burgundy/20 bg-white px-3 py-2 text-sm text-espresso focus:border-espresso focus:outline-none"
              value={d.comment}
              onChange={(e) => set("comment", e.target.value)}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            {(
              [
                ["published", "Show on the site"],
                ["featured", "Play in the homepage video reel (needs a video)"],
                ["verified", "Verified buyer"],
              ] as [keyof Draft, string][]
            ).map(([k, text]) => (
              <label key={k} className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded-xl border border-burgundy/15 bg-white px-4 text-sm text-espresso">
                {text}
                <input type="checkbox" className="h-5 w-5 accent-crimson" checked={!!d[k]} onChange={(e) => set(k, e.target.checked as never)} />
              </label>
            ))}
            <label className="flex min-h-[44px] items-center justify-between gap-3 rounded-xl border border-burgundy/15 bg-white px-4 text-sm text-espresso">
              Position (lower shows first)
              <input type="number" min={0} max={9999} className="w-20 rounded-lg border border-burgundy/20 px-2 py-1 text-right" value={d.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value) || 0)} />
            </label>
          </div>
        </div>

        <div className="flex gap-2 border-t border-burgundy/15 px-5 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
          <button type="button" onClick={onCancel} className="min-h-[48px] rounded-full border border-burgundy/25 px-5 text-xs font-bold uppercase tracking-wider text-espresso">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-espresso text-xs font-bold uppercase tracking-wider text-white hover:bg-crimson disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} {d.id ? "Save changes" : "Publish review"}
          </button>
        </div>
      </form>
    </div>
  );
}
