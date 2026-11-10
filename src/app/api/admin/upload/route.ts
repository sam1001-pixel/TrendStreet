import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-guard";
import { checkDistributedRateLimit, RATE_LIMIT_CONFIG } from "@/lib/rate-limit";
import {
  MAX_IMAGE_BYTES,
  MAX_SERVER_UPLOAD_BYTES,
  MAX_VIDEO_BYTES,
  MediaError,
  blobEnabled,
  hasValidMagicBytes,
  kindOf,
  storeFile,
} from "@/lib/media";

export const dynamic = "force-dynamic";

/** Tells the admin UI how to upload: straight to Blob from the browser, or through this route. */
export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.authorized) return auth.response;
  return NextResponse.json({
    blob: blobEnabled(),
    maxImageBytes: MAX_IMAGE_BYTES,
    maxVideoBytes: MAX_VIDEO_BYTES,
    // Without Blob, files go through this server: local dev has no body limit worth worrying about.
    maxServerBytes: blobEnabled() ? MAX_SERVER_UPLOAD_BYTES : MAX_VIDEO_BYTES,
  });
}

/** Multipart upload of one image or video ("file" field). Used in development, or for small images. */
export async function POST(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.authorized) return auth.response;

  const limit = await checkDistributedRateLimit(`admin-upload:${auth.session.email}`, RATE_LIMIT_CONFIG.ADMIN_UPLOAD);
  if (!limit.allowed) return NextResponse.json({ error: "Too many uploads at once. Please wait a few minutes." }, { status: 429 });
  // Refuse oversized bodies before reading them into memory.
  const declared = Number(req.headers.get("content-length") || 0);
  if (declared > (blobEnabled() ? MAX_SERVER_UPLOAD_BYTES : MAX_VIDEO_BYTES) + 1024 * 1024) {
    return NextResponse.json({ error: "File is too big for this upload method." }, { status: 413 });
  }

  try {
    if (!(req.headers.get("content-type") || "").includes("multipart/form-data")) {
      return NextResponse.json({ error: "Send the file as multipart form data." }, { status: 415 });
    }
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file received." }, { status: 400 });

    let mime = (file.type || "").toLowerCase();
    if (!kindOf(mime)) {
      const ext = (file.name.match(/\.[a-z0-9]+$/i)?.[0] || "").toLowerCase();
      if (ext === ".jpg" || ext === ".jpeg") mime = "image/jpeg";
      else if (ext === ".png") mime = "image/png";
      else if (ext === ".webp") mime = "image/webp";
      else if (ext === ".gif") mime = "image/gif";
      else if (ext === ".avif") mime = "image/avif";
      else if (ext === ".mp4") mime = "video/mp4";
      else if (ext === ".webm") mime = "video/webm";
      else if (ext === ".mov") mime = "video/quicktime";
    }
    const kind = kindOf(mime);
    if (!kind) {
      return NextResponse.json({ error: "Use a JPG, PNG, WEBP, AVIF or GIF image, or an MP4, WEBM or MOV video." }, { status: 400 });
    }
    const limit = kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > limit) {
      return NextResponse.json({ error: `File is too big (max ${Math.round(limit / 1024 / 1024)} MB).` }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!hasValidMagicBytes(buffer, mime)) {
      return NextResponse.json({ error: "That file doesn't look like a real image or video." }, { status: 400 });
    }

    const stored = await storeFile(buffer, file.name, mime);
    return NextResponse.json({ success: true, url: stored.url, kind, size: file.size, storage: stored.storage });
  } catch (err) {
    if (err instanceof MediaError) return NextResponse.json({ error: err.message }, { status: 503 });
    console.error("[Admin upload]:", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
