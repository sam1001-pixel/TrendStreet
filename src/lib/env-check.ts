/**
 * Production configuration check, run once at server start (src/instrumentation.ts).
 * It never prints secret values — only which settings are missing or too weak.
 * Code paths already fail closed on their own (no AUTH_SECRET → no sessions, no webhook secret →
 * webhooks rejected, no CRON_SECRET → cron refused); this makes the reason visible in the logs.
 */
export type EnvFinding = { level: "error" | "warn"; key: string; message: string };

const isPlaceholder = (v: string | undefined) => !v || /replace_with|changeme|placeholder|xxxx/i.test(v);

export function checkProductionEnv(env: NodeJS.ProcessEnv = process.env): EnvFinding[] {
  const out: EnvFinding[] = [];
  const need = (key: string, message: string, ok = !isPlaceholder(env[key])) => {
    if (!ok) out.push({ level: "error", key, message });
  };
  const want = (key: string, message: string, ok = !isPlaceholder(env[key])) => {
    if (!ok) out.push({ level: "warn", key, message });
  };

  const authSecret = env.AUTH_SECRET || env.SESSION_SECRET || env.NEXTAUTH_SECRET;
  need("AUTH_SECRET", "missing or shorter than 32 characters — every sign-in is refused", !isPlaceholder(authSecret) && (authSecret || "").length >= 32);
  need("DATABASE_URL", "missing — orders, accounts and rate limits can't be stored");
  need("ADMIN_EMAIL", "missing — admin sign-in is disabled");
  need("ADMIN_PASSWORD_HASH", "missing — set a PBKDF2 hash (npm run hash-password)", !isPlaceholder(env.ADMIN_PASSWORD_HASH) || (env.ADMIN_PASSWORD || "").length >= 12);
  need("RAZORPAY_KEY_SECRET", "missing — online payments can't start");
  need("RAZORPAY_WEBHOOK_SECRET", "missing — Razorpay webhooks are rejected, so missed payments aren't confirmed", !isPlaceholder(env.RAZORPAY_WEBHOOK_SECRET) || !isPlaceholder(env.PAYMENT_WEBHOOK_SECRET));
  need("CRON_SECRET", "missing — the stock-release job is refused");

  if (env.ADMIN_PASSWORD && !env.ADMIN_PASSWORD_HASH) want("ADMIN_PASSWORD", "plain-text admin password in use; prefer ADMIN_PASSWORD_HASH");
  want("ADMIN_TOTP_SECRET", "admin two-step sign-in is off (npm run admin:2fa)", (env.ADMIN_TOTP_SECRET || "").length >= 16);
  if (env.ADMIN_TOTP_SECRET && !env.ADMIN_RECOVERY_CODE_HASHES) want("ADMIN_RECOVERY_CODE_HASHES", "no recovery codes — losing the authenticator phone locks the admin out (npm run admin:recovery-codes)");
  want("RESEND_API_KEY", "email is off: no order emails, no password reset, and sign-up email confirmation is off");
  if (!env.UPSTASH_REDIS_REST_URL) want("UPSTASH_REDIS_REST_URL", "rate limits use the PostgreSQL table (fine); Upstash is faster if you add it");
  want("BLOB_PUBLIC_HOSTNAME", "images from any Vercel Blob store are allowed; set your store's hostname to restrict it", Boolean(env.BLOB_PUBLIC_HOSTNAME));
  // NEXT_PUBLIC_ values are built into the JavaScript every visitor downloads.
  for (const k of Object.keys(env)) {
    if (k.startsWith("NEXT_PUBLIC_") && /SECRET|PASSWORD|PRIVATE|TOKEN/i.test(k)) {
      out.push({ level: "error", key: k, message: "looks like a secret but NEXT_PUBLIC_ values are sent to every browser — rename it and rotate the value" });
    }
  }
  return out;
}

export function reportProductionEnv() {
  if (process.env.NODE_ENV !== "production") return;
  for (const f of checkProductionEnv()) {
    const line = `[Config ${f.level === "error" ? "ERROR" : "warning"}] ${f.key}: ${f.message}`;
    if (f.level === "error") console.error(line);
    else console.warn(line);
  }
}
