/**
 * Prints an ADMIN_PASSWORD_HASH value for .env.local / Vercel.
 * Usage: npm run hash-password -- "your long admin password"
 */
import { hashPassword } from "../src/lib/customer-auth";

const password = process.argv[2];
if (!password || password.length < 12) {
  console.error('Usage: npm run hash-password -- "a password of at least 12 characters"');
  process.exit(1);
}
console.log(`ADMIN_PASSWORD_HASH="${hashPassword(password).combined}"`);
