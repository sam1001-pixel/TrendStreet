// Applies prisma/schema.prisma to the database (adds the new review table and product video/hidden fields).
// Loads .env.local / .env the same way Next.js does, so DATABASE_URL is found. Safe to run more than once.
import { execSync } from "node:child_process";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to .env.local (the same value your site uses) and run again.");
  process.exit(1);
}
execSync("npx prisma db push --skip-generate", { stdio: "inherit", env: process.env });
console.log("\nDatabase updated. Restart `npm run dev` if it was running.");
