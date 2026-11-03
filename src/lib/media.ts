/**
 * OFFVYBE — media storage for admin uploads (product photos, product videos, video reviews).
 *
 * Production: Vercel Blob (set BLOB_READ_WRITE_TOKEN — create a Blob store in the Vercel dashboard
 * and connect it to the project; Vercel adds the token automatically). Large videos are uploaded
 * straight from the admin's browser to Blob (see /api/admin/upload/blob), so they never hit the
 * 4.5 MB serverless request limit.
 *
 * Development (no token): files are written to public/uploads on this machine.
 */
import fs from "fs";
import path from "path";
import { del, list, put } from "@vercel/blob";

export const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/gif": ".gif",
};

export const VIDEO_TYPES: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
export const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200 MB
/** Uploads that pass through our own server are capped by the hosting request limit (≈4.5 MB on Vercel). */
export const MAX_SERVER_UPLOAD_BYTES = 4 * 1024 * 1024;

const UPLOAD_PREFIX = "media/";
const LOCAL_DIR = path.join(process.cwd(), "public", "uploads");

export class MediaError extends Error {}

export const blobEnabled = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export type MediaKind = "image" | "video";

export function kindOf(mime: string): MediaKind | null {
  const m = mime.toLowerCase();
  if (IMAGE_TYPES[m]) return "image";
  if (VIDEO_TYPES[m]) return "video";
  return null;
}

export function kindFromUrl(url: string): MediaKind {
  return /\.(mp4|webm|mov)(\?|#|$)/i.test(url) ? "video" : "image";
}

/** Checks the first bytes so an HTML/script file can't be uploaded as an image or video. */
export function hasValidMagicBytes(buf: Buffer, mime: string): boolean {
  if (buf.length < 12) return false;
  const m = mime.toLowerCase();
  const ascii = (a: number, b: number) => buf.toString("ascii", a, b);
  if (m === "image/jpeg" || m === "image/jpg") return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (m === "image/png") return buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (m === "image/gif") return ascii(0, 4) === "GIF8";
  if (m === "image/webp") return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
  if (m === "image/avif" || m === "video/mp4" || m === "video/quicktime") return ascii(4, 8) === "ftyp";
  if (m === "video/webm") return buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3;
  return false;
}

export function safeFileName(original: string, ext: string) {
  const base = path.basename(original || "file", path.extname(original || "")).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40) || "file";
  return `${Date.now().toString(36)}_${base}${ext}`;
}

/** Stores an already-validated file. Returns its public URL. */
export async function storeFile(buffer: Buffer, originalName: string, mime: string): Promise<{ url: string; storage: "blob" | "local" }> {
  const ext = IMAGE_TYPES[mime] || VIDEO_TYPES[mime];
  if (!ext) throw new MediaError("Unsupported file type.");
  const name = safeFileName(originalName, ext);

  if (blobEnabled()) {
    const blob = await put(`${UPLOAD_PREFIX}${name}`, buffer, { access: "public", contentType: mime, addRandomSuffix: true });
    return { url: blob.url, storage: "blob" };
  }

  try {
    fs.mkdirSync(LOCAL_DIR, { recursive: true });
    fs.writeFileSync(path.join(LOCAL_DIR, name), buffer);
    return { url: `/uploads/${name}`, storage: "local" };
  } catch {
    throw new MediaError(
      "File storage isn't set up on this server. In Vercel, open Storage → Create → Blob, connect it to this project and redeploy."
    );
  }
}

export interface MediaItem {
  url: string;
  name: string;
  kind: MediaKind;
  size: number;
  uploadedAt: string;
}

export async function listMedia(): Promise<MediaItem[]> {
  if (blobEnabled()) {
    const items: MediaItem[] = [];
    let cursor: string | undefined;
    do {
      const page = await list({ prefix: UPLOAD_PREFIX, cursor, limit: 1000 });
      for (const b of page.blobs) {
        items.push({
          url: b.url,
          name: b.pathname.slice(UPLOAD_PREFIX.length),
          kind: kindFromUrl(b.pathname),
          size: b.size,
          uploadedAt: new Date(b.uploadedAt).toISOString(),
        });
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor && items.length < 5000);
    return items.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  }

  if (!fs.existsSync(LOCAL_DIR)) return [];
  return fs
    .readdirSync(LOCAL_DIR)
    .filter((f) => !f.startsWith("."))
    .map((f) => {
      const st = fs.statSync(path.join(LOCAL_DIR, f));
      return { url: `/uploads/${f}`, name: f, kind: kindFromUrl(f), size: st.size, uploadedAt: st.mtime.toISOString() };
    })
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

const isBlobUrl = (url: string) => /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(url);

/** Deletes a file this shop uploaded. URLs from elsewhere (e.g. Unsplash) are ignored. */
export async function deleteMedia(url: string): Promise<boolean> {
  if (isBlobUrl(url)) {
    if (!blobEnabled()) throw new MediaError("Blob storage token missing — can't delete this file.");
    await del(url);
    return true;
  }
  const m = /^\/uploads\/([A-Za-z0-9._-]+)$/.exec(url);
  if (m) {
    const file = path.join(LOCAL_DIR, m[1]);
    if (fs.existsSync(file)) fs.unlinkSync(file);
    return true;
  }
  return false;
}

/** True for URLs the storefront may show as product/review media. */
export function isAllowedMediaUrl(u: string, kind: MediaKind) {
  if (!/^(https:\/\/|\/(?![\/\\]))/.test(u)) return kind === "image" && /^data:image\//.test(u);
  return true;
}
