import { test } from "node:test";
import assert from "node:assert/strict";
import { hasValidMagicBytes, kindOf, kindFromUrl } from "../../src/lib/media";
import { ReviewInputError, validateReview } from "../../src/lib/admin-reviews";

test("media: only real images and videos pass the signature check", () => {
  const mp4 = Buffer.concat([Buffer.from([0, 0, 0, 0x20]), Buffer.from("ftypisom"), Buffer.alloc(8)]);
  const webm = Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.alloc(12)]);
  const html = Buffer.from("<html><script>alert(1)</script></html>");
  assert.equal(hasValidMagicBytes(mp4, "video/mp4"), true);
  assert.equal(hasValidMagicBytes(mp4, "video/quicktime"), true);
  assert.equal(hasValidMagicBytes(webm, "video/webm"), true);
  assert.equal(hasValidMagicBytes(html, "video/mp4"), false);
  assert.equal(hasValidMagicBytes(html, "image/png"), false);
  assert.equal(kindOf("video/mp4"), "video");
  assert.equal(kindOf("image/webp"), "image");
  assert.equal(kindOf("text/html"), null);
  assert.equal(kindFromUrl("https://x.public.blob.vercel-storage.com/media/a-123.mp4"), "video");
  assert.equal(kindFromUrl("/uploads/a.jpg"), "image");
});

test("reviews: validation requires a name and text or video, and clamps fields", () => {
  assert.throws(() => validateReview({ author: "", comment: "Nice" }), ReviewInputError);
  assert.throws(() => validateReview({ author: "Rahul", comment: "" }), ReviewInputError);
  assert.throws(() => validateReview({ author: "Rahul", comment: "ok", rating: 9 }), ReviewInputError);
  const v = validateReview({ author: " Rahul ", rating: 5, videoUrl: "https://x.public.blob.vercel-storage.com/media/r.mp4", comment: "" });
  assert.equal(v.author, "Rahul");
  assert.equal(v.published, true);
  assert.equal(v.featured, false);
  // Unsafe URLs are dropped.
  const bad = validateReview({ author: "Rahul", rating: 4, comment: "Good", videoUrl: "javascript:alert(1)", posterUrl: "//evil.com/x.jpg" });
  assert.equal(bad.videoUrl, null);
  assert.equal(bad.posterUrl, null);
});
