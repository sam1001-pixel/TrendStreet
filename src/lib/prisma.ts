import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Normalizes MongoDB Atlas SRV URLs to direct shard replica-set URLs.
 *
 * WHY THIS IS CRITICAL:
 * Prisma's query engine is a native Rust binary that uses Hickory-DNS to parse
 * the host OS `/etc/resolv.conf` during DNS SRV lookups (used by `mongodb+srv://`).
 * On modern Linux environments (such as Hostinger VPS, systemd-resolved, and Docker containers),
 * `/etc/resolv.conf` contains configuration flags like "options edns0 trust-ad".
 * The strict Rust parser throws:
 * "Error parsing resolv.conf: option at line 5 is not recognized"
 * and fails all database queries.
 *
 * Converting to the standard direct replica-set connection format completely
 * bypasses `/etc/resolv.conf` SRV resolution and connects directly to the Atlas shards.
 */
export function normalizeDatabaseUrl(rawUrl?: string): string | undefined {
  const url = rawUrl ?? process.env.DATABASE_URL;
  if (!url) return undefined;

  if (url.startsWith("mongodb+srv://") && url.includes("sujal.i3a9xri.mongodb.net")) {
    return url.replace(
      /mongodb\+srv:\/\/([^@]+)@sujal\.i3a9xri\.mongodb\.net\/([^?]+)(\?.*)?/,
      (_match, creds, dbName) => {
        return `mongodb://${creds}@ac-jhr8wjr-shard-00-00.i3a9xri.mongodb.net:27017,ac-jhr8wjr-shard-00-01.i3a9xri.mongodb.net:27017,ac-jhr8wjr-shard-00-02.i3a9xri.mongodb.net:27017/${dbName}?ssl=true&replicaSet=atlas-lvjv8q-shard-0&authSource=admin&retryWrites=true&w=majority`;
      }
    );
  }

  return url;
}

const activeUrl = normalizeDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: activeUrl ? { db: { url: activeUrl } } : undefined,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

globalForPrisma.prisma = prisma;

