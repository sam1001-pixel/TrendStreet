import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

// Strict server-enforced MIME to safe extension mapping
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/gif": ".gif",
};

// 4MB limit to strictly respect Vercel edge/serverless 4.5MB request payload ceiling
const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024;

/**
 * Verify image magic bytes so arbitrary HTML/scripts cannot masquerade as images
 */
function hasValidImageMagicBytes(buf: Buffer, mime: string): boolean {
  if (buf.length < 12) return false;
  if (mime === "image/jpeg" || mime === "image/jpg") {
    return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  }
  if (mime === "image/png") {
    return (
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47 &&
      buf[4] === 0x0d &&
      buf[5] === 0x0a &&
      buf[6] === 0x1a &&
      buf[7] === 0x0a
    );
  }
  if (mime === "image/gif") {
    return (
      buf[0] === 0x47 &&
      buf[1] === 0x49 &&
      buf[2] === 0x46 &&
      buf[3] === 0x38
    );
  }
  if (mime === "image/webp") {
    return (
      buf.toString("ascii", 0, 4) === "RIFF" &&
      buf.toString("ascii", 8, 12) === "WEBP"
    );
  }
  if (mime === "image/avif") {
    return buf.toString("ascii", 4, 8) === "ftyp";
  }
  return false;
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.authorized) return auth.response;

  try {
    const contentType = req.headers.get("content-type") || "";

    // 1. Multipart Form Data (Direct file input upload)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No image file provided in upload." }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json({ error: "File exceeds maximum size limit (4MB)." }, { status: 400 });
      }

      const mimeType = file.type.toLowerCase();
      const ext = MIME_TO_EXT[mimeType];
      if (!ext) {
        return NextResponse.json({ error: "Invalid image format. Supported formats: JPEG, PNG, WEBP, AVIF, GIF." }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      if (!hasValidImageMagicBytes(buffer, mimeType)) {
        return NextResponse.json({ error: "File contents do not match valid image signature." }, { status: 400 });
      }

      // Safe clean filename with server-derived extension only
      const rawBase = path.basename(file.name, path.extname(file.name));
      const cleanBase = rawBase.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30) || "garment";
      const safeName = `atelier_${Date.now()}_${cleanBase}${ext}`;

      // Try local storage first
      try {
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const filePath = path.join(uploadsDir, safeName);
        fs.writeFileSync(filePath, buffer);

        return NextResponse.json({
          success: true,
          url: `/uploads/${safeName}`,
          filename: safeName,
          size: file.size,
          mimeType,
        });
      } catch (fsErr) {
        // Read-only serverless runtime (e.g. Vercel) fallback to Base64 data URL
        const base64 = buffer.toString("base64");
        const dataUrl = `data:${mimeType};base64,${base64}`;
        return NextResponse.json({
          success: true,
          url: dataUrl,
          filename: safeName,
          size: file.size,
          mimeType,
          storage: "in-memory-data-url",
        });
      }
    }

    // 2. JSON Base64 Payload
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const { dataUrl, filename } = body;

      if (!dataUrl || typeof dataUrl !== "string") {
        return NextResponse.json({ error: "Missing dataUrl in request body." }, { status: 400 });
      }

      // Check dataUrl format
      const match = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (!match) {
        return NextResponse.json({ error: "Invalid base64 Data URL format." }, { status: 400 });
      }

      const mimeType = match[1].toLowerCase();
      const ext = MIME_TO_EXT[mimeType];
      if (!ext) {
        return NextResponse.json({ error: "Unsupported image MIME type." }, { status: 400 });
      }

      const buffer = Buffer.from(match[2], "base64");
      if (buffer.length > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json({ error: "File exceeds 4MB size limit." }, { status: 400 });
      }

      if (!hasValidImageMagicBytes(buffer, mimeType)) {
        return NextResponse.json({ error: "Payload contents do not match valid image signature." }, { status: 400 });
      }

      const rawBase = path.basename(filename || "upload", path.extname(filename || "upload"));
      const cleanBase = rawBase.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30) || "garment";
      const cleanName = `atelier_${Date.now()}_${cleanBase}${ext}`;

      try {
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const filePath = path.join(uploadsDir, cleanName);
        fs.writeFileSync(filePath, buffer);

        return NextResponse.json({
          success: true,
          url: `/uploads/${cleanName}`,
          filename: cleanName,
          size: buffer.length,
          mimeType,
        });
      } catch (fsErr) {
        return NextResponse.json({
          success: true,
          url: dataUrl,
          filename: cleanName,
          size: buffer.length,
          mimeType,
          storage: "in-memory-data-url",
        });
      }
    }

    return NextResponse.json({ error: "Unsupported media content type." }, { status: 415 });
  } catch (err: unknown) {
    console.error("[Admin Media Upload Error]:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Media upload processing failed." },
      { status: 500 }
    );
  }
}
