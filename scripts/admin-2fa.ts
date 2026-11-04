/**
 * Turns on two-step login for the admin (6-digit codes from an authenticator app).
 * Usage: npm run admin:2fa
 * Prints a setup key: add it in Google Authenticator / Microsoft Authenticator / Authy
 * (“Enter a setup key”, time-based), then add ADMIN_TOTP_SECRET to .env.local and to Vercel.
 */
import { generateTotpSecret, otpauthUrl, totpCode } from "../src/lib/totp";

const account = (process.env.ADMIN_EMAIL || process.argv[2] || "admin").toLowerCase();
const secret = generateTotpSecret();

console.log("\nOFFVYBE — two-step admin login\n");
console.log("1. In your authenticator app choose “Enter a setup key” and type:");
console.log(`     Account: ${account}`);
console.log(`     Key:     ${secret.match(/.{1,4}/g)!.join(" ")}`);
console.log("     Type:    Time based\n");
console.log("   (or open this link on the phone that has the app):");
console.log(`     ${otpauthUrl(secret, account)}\n`);
console.log(`2. The app should now show a 6-digit code (right now it is ${totpCode(secret)}).\n`);
console.log("3. Add this line to .env.local AND to Vercel → Settings → Environment Variables, then redeploy:");
console.log(`     ADMIN_TOTP_SECRET="${secret}"\n`);
console.log("From then on the admin login asks for the code. Keep the key private; anyone with it can make codes.\n");
