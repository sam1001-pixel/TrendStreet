// Applies prisma/schema.prisma to the database (adds the new review table and product video/hidden fields).
// Loads .env.local / .env the same way Next.js does, so DATABASE_URL is found. Safe to run more than once.
import { execSync } from "node:child_process";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to .env.local (the same value your site uses) and run again.");
  process.exit(1);
}

if (process.env.DATABASE_URL.startsWith("mongodb+srv://") && process.env.DATABASE_URL.includes("sujal.i3a9xri.mongodb.net")) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(
    /mongodb\+srv:\/\/([^@]+)@sujal\.i3a9xri\.mongodb\.net\/([^?]+)(\?(.*))?/,
    (_match, creds, dbName, _fullQuery, queryString) => {
      const params = new URLSearchParams(queryString || "");
      params.set("ssl", "true");
      params.set("replicaSet", "atlas-lvjv8q-shard-0");
      if (!params.has("authSource")) params.set("authSource", "admin");
      if (!params.has("retryWrites")) params.set("retryWrites", "true");
      if (!params.has("w")) params.set("w", "majority");

      return `mongodb://${creds}@ac-jhr8wjr-shard-00-00.i3a9xri.mongodb.net:27017,ac-jhr8wjr-shard-00-01.i3a9xri.mongodb.net:27017,ac-jhr8wjr-shard-00-02.i3a9xri.mongodb.net:27017/${dbName}?${params.toString()}`;
    }
  );
}

execSync("npx prisma db push --skip-generate", { stdio: "inherit", env: process.env });
console.log("\nDatabase updated. Restart `npm run dev` if it was running.");

