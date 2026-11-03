"use client";
/**
 * Browser-side upload helper for the admin. With Vercel Blob connected, files go straight from the browser
 * to Blob storage (videos up to 200 MB); otherwise they are posted to /api/admin/upload.
 */
import { upload } from "@vercel/blob/client";

export type UploadKind = "image" | "video";

interface UploadConfig {
  blob: boolean;
  maxImageBytes: number;
  maxVideoBytes: number;
  maxServerBytes: number;
}

let configPromise: Promise<UploadConfig> | null = null;
function getConfig(): Promise<UploadConfig> {
  if (!configPromise) {
    configPromise = fetch("/api/admin/upload", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Not signed in."))))
      .catch((e) => {
        configPromise = null;
        throw e;
      });
  }
  return configPromise;
}

const IMAGE_MIME = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
const VIDEO_MIME = ["video/mp4", "video/webm", "video/quicktime"];

export const ACCEPT: Record<UploadKind, string> = {
  image: IMAGE_MIME.join(","),
  video: VIDEO_MIME.join(","),
};

export const mb = (bytes: number) => `${Math.round(bytes / 1024 / 1024)} MB`;

/** Uploads one file and resolves to its public URL. `onProgress` gets 0–100. */
export async function uploadMedia(file: File, kind: UploadKind, onProgress?: (pct: number) => void): Promise<string> {
  const mime = (file.type || "").toLowerCase();
  if (!(kind === "image" ? IMAGE_MIME : VIDEO_MIME).includes(mime)) {
    throw new Error(kind === "image" ? "Use a JPG, PNG, WEBP, AVIF or GIF photo." : "Use an MP4, WEBM or MOV video.");
  }
  const cfg = await getConfig();
  const max = kind === "image" ? cfg.maxImageBytes : cfg.maxVideoBytes;
  if (file.size > max) throw new Error(`${file.name} is too big (max ${mb(max)}).`);

  if (cfg.blob) {
    const ext = (file.name.match(/\.[a-z0-9]+$/i)?.[0] || "").toLowerCase();
    const base = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40) || kind;
    const blob = await upload(`media/${base}${ext}`, file, {
      access: "public",
      handleUploadUrl: "/api/admin/upload/blob",
      contentType: mime,
      multipart: file.size > 20 * 1024 * 1024,
      onUploadProgress: ({ percentage }) => onProgress?.(Math.round(percentage)),
    });
    return blob.url;
  }

  if (file.size > cfg.maxServerBytes) {
    throw new Error(`Files over ${mb(cfg.maxServerBytes)} need Vercel Blob storage connected to the project.`);
  }

  // XHR (not fetch) so we can show upload progress.
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/upload");
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let data: { url?: string; error?: string } = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        /* ignore */
      }
      if (xhr.status >= 200 && xhr.status < 300 && data.url) resolve(data.url);
      else reject(new Error(data.error || `Upload failed (${xhr.status}).`));
    };
    xhr.onerror = () => reject(new Error("Network error — check your connection and try again."));
    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}

export const isVideoUrl = (url: string) => /\.(mp4|webm|mov)(\?|#|$)/i.test(url);
