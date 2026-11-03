import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireAdminSession } from "@/lib/auth";
import { IMAGE_TYPES, MAX_VIDEO_BYTES, VIDEO_TYPES, blobEnabled } from "@/lib/media";

export const dynamic = "force-dynamic";

/**
 * Issues short-lived tokens so the admin's browser can upload large files (videos) straight to Vercel Blob.
 * Only signed-in admins get a token; files are limited to images and MP4/WEBM/MOV videos under 200 MB.
 */
export async function POST(req: NextRequest) {
  if (!blobEnabled()) {
    return NextResponse.json({ error: "Vercel Blob storage isn't connected to this project." }, { status: 503 });
  }
  const auth = await requireAdminSession(req);
  if (!auth.authorized) return auth.response;

  try {
    const body = (await req.json()) as HandleUploadBody;
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("media/") || pathname.includes("..")) throw new Error("Invalid upload path.");
        return {
          allowedContentTypes: [...Object.keys(IMAGE_TYPES), ...Object.keys(VIDEO_TYPES)],
          maximumSizeInBytes: MAX_VIDEO_BYTES,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[Admin blob upload]:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed." }, { status: 400 });
  }
}
