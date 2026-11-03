import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { refreshStorefront } from "@/lib/catalog";
import { ReviewInputError, validateReview } from "@/lib/admin-reviews";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.authorized) return auth.response;
  try {
    const reviews = await prisma.review.findMany({
      include: { product: { select: { name: true } } },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ reviews });
  } catch (err) {
    console.error("[Admin reviews list]:", err);
    return NextResponse.json({ error: "Database unavailable — reviews can't be loaded right now." }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminSession(req);
  if (!auth.authorized) return auth.response;
  try {
    const data = validateReview(await req.json());
    if (data.productId && !(await prisma.product.findUnique({ where: { id: data.productId }, select: { id: true } }))) {
      throw new ReviewInputError("That product no longer exists.");
    }
    const review = await prisma.review.create({ data, include: { product: { select: { name: true } } } });
    refreshStorefront();
    await writeAudit(req, { action: "REVIEW_CREATE", entityType: "Review", entityId: review.id, metadata: { author: review.author, video: !!review.videoUrl } });
    return NextResponse.json({ review });
  } catch (err) {
    if (err instanceof ReviewInputError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("[Admin review create]:", err);
    return NextResponse.json({ error: "Could not save the review." }, { status: 503 });
  }
}
