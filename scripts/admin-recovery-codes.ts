/**
 * One-time recovery codes for the admin two-step sign-in (use one if you lose the authenticator phone).
 * Usage: npm run admin:recovery-codes
 * Prints 10 codes (save them somewhere safe and offline) and the ADMIN_RECOVERY_CODE_HASHES line for
 * Vercel. Only the hashes go on the server; each code works once. Running this again makes new codes —
 * replace the Vercel variable to cancel the old ones.
 */
import { generateRecoveryCodes, hashRecoveryCode } from "../src/lib/admin-mfa";

const codes = generateRecoveryCodes(10);
console.log("\nOFFVYBE — admin recovery codes (each works once)\n");
codes.forEach((c, i) => console.log(`  ${String(i + 1).padStart(2, " ")}. ${c}`));
console.log("\nSave these somewhere safe (password manager or printed). They are NOT stored anywhere else.\n");
console.log("Add this to Vercel → Settings → Environment Variables (Production), then redeploy:\n");
console.log(`ADMIN_RECOVERY_CODE_HASHES="${codes.map(hashRecoveryCode).join(",")}"\n`);
