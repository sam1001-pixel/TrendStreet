/** Validation for reviews edited in Admin → Reviews. */
export class ReviewInputError extends Error {}

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const mediaUrl = (v: unknown) => {
  const u = text(v, 2000);
  return /^(https:\/\/|\/(?![\/\\]))/.test(u) ? u : null;
};

export function validateReview(body: Record<string, unknown>) {
  const author = text(body.author, 80);
  if (author.length < 2) throw new ReviewInputError("Add the customer's name.");
  const comment = text(body.comment, 3000);
  const videoUrl = mediaUrl(body.videoUrl);
  if (!comment && !videoUrl) throw new ReviewInputError("Add the review text or a video.");
  const rating = Math.round(Number(body.rating));
  if (!(rating >= 1 && rating <= 5)) throw new ReviewInputError("Rating must be 1 to 5 stars.");
  const productId = text(body.productId, 60) || null;

  return {
    author,
    city: text(body.city, 60) || null,
    rating,
    title: text(body.title, 120) || null,
    comment,
    videoUrl,
    posterUrl: mediaUrl(body.posterUrl),
    productId,
    verified: body.verified !== false,
    published: body.published !== false,
    featured: !!body.featured,
    sortOrder: Math.max(0, Math.min(9999, Math.floor(Number(body.sortOrder) || 0))),
  };
}
