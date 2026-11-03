import test from "node:test";
import assert from "node:assert/strict";
import { normaliseEmail, normalisePhone } from "../../src/lib/alert-contact";
import { settingsToDb } from "../../src/lib/site-settings";

test("normalisePhone - accepts Indian mobiles in common formats", () => {
  assert.equal(normalisePhone("9876543210"), "9876543210");
  assert.equal(normalisePhone("+91 98765 43210"), "9876543210");
  assert.equal(normalisePhone("09876543210"), "9876543210");
  assert.equal(normalisePhone("91-98765-43210"), "9876543210");
});

test("normalisePhone - rejects landlines, short and junk numbers", () => {
  assert.equal(normalisePhone("1234567890"), null);
  assert.equal(normalisePhone("98765"), null);
  assert.equal(normalisePhone("abc"), null);
  assert.equal(normalisePhone(undefined), null);
});

test("normaliseEmail - lower-cases valid emails and rejects bad ones", () => {
  assert.equal(normaliseEmail("  Rahul@Example.COM "), "rahul@example.com");
  assert.equal(normaliseEmail("not-an-email"), null);
  assert.equal(normaliseEmail("a@b"), null);
});

test("settingsToDb - next drop date is saved, cleared, or ignored when unreadable", () => {
  const at = "2026-12-01T12:30:00.000Z";
  assert.deepEqual(settingsToDb({ nextDrop: { at, title: "Drop 05" } } as any).nextDropAt, new Date(at));
  assert.equal(settingsToDb({ nextDrop: { at: null, title: "" } } as any).nextDropAt, null);
  assert.equal(settingsToDb({ nextDrop: { at: "garbage", title: "x" } } as any).nextDropAt, undefined);
  assert.equal(settingsToDb({} as any).nextDropAt, undefined);
});
