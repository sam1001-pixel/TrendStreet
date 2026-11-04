-- OFFVYBE security hardening — database changes (2026-11-05)
--
-- Preferred way to apply: `npm run db:push` (runs `prisma db push`, which makes exactly these
-- additive changes from prisma/schema.prisma). This file is the same change written out as SQL so
-- you can review it, or run it by hand in the Neon/Supabase SQL editor if you prefer.
--
-- Everything here is ADDITIVE: new tables, new nullable columns, new columns with defaults.
-- No existing column, row or index is changed or dropped. Take a backup/branch first anyway.

-- users: session versions (sign out everywhere) and email confirmation time
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "sessionVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(3);

-- coupons: per-customer rules
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "firstOrderOnly" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "perCustomerLimit" INTEGER;

-- site_settings: "sign out all admin devices"
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "adminSessionsRevokedAt" TIMESTAMP(3);

-- one-time email links (password reset, email confirmation) — only SHA-256 hashes are stored
DO $$ BEGIN
  CREATE TYPE "AuthTokenPurpose" AS ENUM ('PASSWORD_RESET', 'EMAIL_VERIFY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "auth_tokens" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "purpose"   "AuthTokenPurpose" NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "payload"   JSONB,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt"    TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "auth_tokens_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "auth_tokens_tokenHash_key" ON "auth_tokens"("tokenHash");
CREATE INDEX IF NOT EXISTS "auth_tokens_userId_purpose_idx" ON "auth_tokens"("userId", "purpose");
DO $$ BEGIN
  ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- shared rate-limit counters (used when Upstash isn't configured)
CREATE TABLE IF NOT EXISTS "rate_limit_buckets" (
  "key"      TEXT NOT NULL,
  "count"    INTEGER NOT NULL,
  "reset_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("key")
);
CREATE INDEX IF NOT EXISTS "rate_limit_buckets_reset_at_idx" ON "rate_limit_buckets"("reset_at");

-- "first time only" markers: used TOTP codes, used recovery codes, processed webhooks, revoked admin sessions
CREATE TABLE IF NOT EXISTS "security_markers" (
  "key"        TEXT NOT NULL,
  "expires_at" TIMESTAMPTZ(3) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "security_markers_pkey" PRIMARY KEY ("key")
);
CREATE INDEX IF NOT EXISTS "security_markers_expires_at_idx" ON "security_markers"("expires_at");

-- ROLLBACK (only if you roll the code back too; the old code ignores all of this, so leaving it is harmless):
-- DROP TABLE IF EXISTS "security_markers"; DROP TABLE IF EXISTS "rate_limit_buckets"; DROP TABLE IF EXISTS "auth_tokens";
-- DROP TYPE IF EXISTS "AuthTokenPurpose";
-- ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "adminSessionsRevokedAt";
-- ALTER TABLE "coupons" DROP COLUMN IF EXISTS "perCustomerLimit", DROP COLUMN IF EXISTS "firstOrderOnly";
-- ALTER TABLE "users" DROP COLUMN IF EXISTS "emailVerifiedAt", DROP COLUMN IF EXISTS "sessionVersion";
