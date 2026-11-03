import test from "node:test";
import assert from "node:assert/strict";
import { safeRedirectPath, safeHref } from "../../src/lib/safe-redirect";

test("safeRedirectPath - keeps pages on this site", () => {
  assert.equal(safeRedirectPath("/profile"), "/profile");
  assert.equal(safeRedirectPath("/checkout?step=2#pay"), "/checkout?step=2#pay");
  assert.equal(safeRedirectPath(null, "/x"), "/x");
});

test("safeRedirectPath - blocks scripts and other websites", () => {
  for (const bad of [
    "javascript:alert(1)",
    " JavaScript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "https://evil.example",
    "//evil.example/login",
    "/\\evil.example",
    "\\\\evil.example",
    "/%0a/evil",
    "/\t/evil.example",
  ]) {
    const out = safeRedirectPath(bad, "/profile");
    assert.ok(out.startsWith("/") && !out.startsWith("//"), `${bad} → ${out}`);
    assert.ok(!/evil|javascript|data:/i.test(out) || out === "/%0a/evil", `${bad} → ${out}`);
  }
});

test("safeHref - CMS links allow site paths and https only", () => {
  assert.equal(safeHref("/shop?sort=newest"), "/shop?sort=newest");
  assert.equal(safeHref("https://instagram.com/offvybe"), "https://instagram.com/offvybe");
  assert.equal(safeHref(""), "");
  assert.equal(safeHref("javascript:alert(1)", "/shop"), "/shop");
  assert.equal(safeHref("http://insecure.example", "/shop"), "/shop");
});
