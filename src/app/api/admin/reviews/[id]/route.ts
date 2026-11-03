import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { refreshStorefront } from "@/lib/catalog";
import { ReviewInputError, validateReview } from "@/lib/admin-reviews";
import { deleteMedia } from "@/lib/media";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdminSession(req);
  if (!auth.authorized) return auth.response;
  try {
    const data = validateReview(await req.json());
    const exists = await prisma.review.findUnique({ where: { id: params.id }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: "Review not found." }, { status: 404 });
    const review = await prisma.review.update({ where: { id: params.id }, data, include: { product: { select: { name: true } } } });
    refreshStorefront();
    await writeAudit(req, { action: "REVIEW_EDIT", entityType: "Review", entityId: review.id, metadata: { author: review.author, published: review.published } });
    return NextResponse.json({ review });
  } catch (err) {
    if (err instanceof ReviewInputError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("[Admin review update]:", err);
    return NextResponse.json({ error: "Could not save the review." }, { status: 503 });
  }
}

/** Deletes the review. `?deleteMedia=1` also removes its video and cover from storage. */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdminSession(req);
  if (!auth.authorized) return auth.response;
  try {
    const review = await prisma.review.findUnique({ where: { id: params.id } });
    if (!review) return NextResponse.json({ error: "Review not found." }, { status: 404 });
    await prisma.review.delete({ where: { id: params.id } });
    if (req.nextUrl.searchParams.get("deleteMedia") === "1") {
      for (const url of [review.videoUrl, review.posterUrl]) {
        if (url) await deleteMedia(url).catch((e) => console.error("[Review media delete]:", e));
      }
    }
    refreshStorefront();
    await writeAudit(req, { action: "REVIEW_DELETE", entityType: "Review", entityId: review.id, metadata: { author: review.author } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Admin review delete]:", err);
    return NextResponse.json({ error: "Could not delete the review." }, { status: 503 });
  }
}
