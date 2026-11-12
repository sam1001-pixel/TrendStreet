import test from "node:test";
import assert from "node:assert/strict";
import { normalizeDatabaseUrl } from "../../src/lib/prisma";

test("normalizeDatabaseUrl - leaves undefined / empty URL untouched", () => {
  assert.equal(normalizeDatabaseUrl(""), undefined);
  assert.equal(normalizeDatabaseUrl(undefined), process.env.DATABASE_URL ? normalizeDatabaseUrl(process.env.DATABASE_URL) : undefined);
});


test("normalizeDatabaseUrl - converts sujal MongoDB Atlas SRV URL to direct replica-set string", () => {
  const srvUrl = "mongodb+srv://sujalsolanki200410_db_user:tffoI8audrGBS9wO@sujal.i3a9xri.mongodb.net/trendstreet?retryWrites=true&w=majority";
  const normalized = normalizeDatabaseUrl(srvUrl);

  assert.ok(normalized?.startsWith("mongodb://"), "Should convert to standard direct mongodb:// scheme");
  assert.ok(normalized?.includes("ac-jhr8wjr-shard-00-00.i3a9xri.mongodb.net:27017"));
  assert.ok(normalized?.includes("ac-jhr8wjr-shard-00-01.i3a9xri.mongodb.net:27017"));
  assert.ok(normalized?.includes("ac-jhr8wjr-shard-00-02.i3a9xri.mongodb.net:27017"));
  assert.ok(normalized?.includes("replicaSet=atlas-lvjv8q-shard-0"));
  assert.ok(normalized?.includes("authSource=admin"));
  assert.ok(normalized?.includes("ssl=true"));
  assert.ok(normalized?.includes("/trendstreet"));
});

test("normalizeDatabaseUrl - leaves non-Atlas or other URLs unchanged", () => {
  const directUrl = "mongodb://user:pass@host:27017/db";
  assert.equal(normalizeDatabaseUrl(directUrl), directUrl);

  const postgresUrl = "postgresql://user:pass@localhost:5432/db";
  assert.equal(normalizeDatabaseUrl(postgresUrl), postgresUrl);
});
