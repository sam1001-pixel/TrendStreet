import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-guard";
import { writeAudit } from "@/lib/audit";
import { MediaError, blobEnabled, deleteMedia, listMedia } from "@/lib/media";

export const dynamic = "force-dynamic";

/** Where each uploaded file is used, so the admin can't delete a photo a live product still shows. */
async function usageMap() {
  const used = new Map<string, string[]>();
  const add = (url: string | null | undefined, label: string) => {
    if (!url) return;
    used.set(url, [...(used.get(url) || []), label]);
  };
  const [products, reviews, settings] = await Promise.all([
    prisma.product.findMany({ select: { name: true, videos: true, images: { select: { url: true } } } }),
    prisma.review.findMany({ select: { author: true, videoUrl: true, posterUrl: true } }),
    prisma.siteSettings.findUnique({ where: { id: "global" } }),
  ]);
  for (const p of products) {
    p.images.forEach((i) => add(i.url, `Product photo · ${p.name}`));
    p.videos.forEach((v) => add(v, `Product video · ${p.name}`));
  }
  for (const r of reviews) {
    add(r.videoUrl, `Review video · ${r.author}`);
    add(r.posterUrl, `Review cover · ${r.author}`);
  }
  // Any uploaded URL mentioned in the CMS settings (hero images etc.).
  const settingsText = JSON.stringify(settings ?? {});
  return { used, settingsText };
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.authorized) return auth.response;

  try {
    const [items, { used, settingsText }] = await Promise.all([listMedia(), usageMap()]);
    return NextResponse.json({
      storage: blobEnabled() ? "blob" : "local",
      items: items.map((m) => ({
        ...m,
        usedBy: [...(used.get(m.url) || []), ...(settingsText.includes(m.url) ? ["Site settings"] : [])],
      })),
    });
  } catch (err) {
    console.error("[Admin media list]:", err);
    return NextResponse.json({ error: "Could not load the media library." }, { status: 503 });
  }
}

/** Body: { urls: string[] }. Files still used by a product, review or the site settings are skipped. */
export async function DELETE(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json().catch(() => ({}));
    const urls: string[] = Array.isArray(body?.urls) ? body.urls.filter((u: unknown) => typeof u === "string").slice(0, 200) : [];
    if (!urls.length) return NextResponse.json({ error: "Choose at least one file." }, { status: 400 });

    const { used, settingsText } = await usageMap();
    const deleted: string[] = [];
    const skipped: { url: string; reason: string }[] = [];
    for (const url of urls) {
      const usedBy = [...(used.get(url) || []), ...(settingsText.includes(url) ? ["Site settings"] : [])];
      if (usedBy.length) {
        skipped.push({ url, reason: `Still used: ${usedBy.join(", ")}` });
        continue;
      }
      if (await deleteMedia(url)) deleted.push(url);
      else skipped.push({ url, reason: "Not a file uploaded to this shop." });
    }
    if (deleted.length) {
      await writeAudit(req, { action: "MEDIA_DELETE", entityType: "Media", entityId: deleted[0], metadata: { deleted, skipped: skipped.length } });
    }
    return NextResponse.json({ deleted, skipped });
  } catch (err) {
    if (err instanceof MediaError) return NextResponse.json({ error: err.message }, { status: 503 });
    console.error("[Admin media delete]:", err);
    return NextResponse.json({ error: "Could not delete the files." }, { status: 503 });
  }
}
