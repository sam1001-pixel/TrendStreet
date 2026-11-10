/**
 * Sets the admin login for this computer (.env.local) and prints the values to copy into Vercel.
 * Usage: npm run admin:set
 */
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { hashPassword } from "../src/lib/customer-auth";

// One shared prompt (so pasted or piped answers aren't lost between questions).
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
let hideTyping = false;
const out = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
const write = out._writeToOutput.bind(rl);
// Show * instead of the typed password characters.
out._writeToOutput = (s: string) => {
  if (!hideTyping || /[:]\s*$/.test(s) || s === "\r\n" || s === "\n") write(s);
  else write("*".repeat(s.replace(/\x1b\[[0-9;]*[A-Za-z]/g, "").length));
};

const lines = rl[Symbol.asyncIterator]();

async function ask(question: string, hidden = false): Promise<string> {
  hideTyping = false;
  process.stdout.write(question);
  hideTyping = hidden;
  const { value } = await lines.next();
  hideTyping = false;
  if (hidden && !process.stdin.isTTY) process.stdout.write("\n");
  return String(value ?? "").trim();
}

async function main() {
  console.log("\nOFFVYBE — set the admin login\n");
  const email = (await ask("Admin email: ")).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("That doesn't look like an email address.");
  const password = await ask("New admin password (12+ characters): ", true);
  if (password.length < 12) throw new Error("The password must be at least 12 characters.");
  const again = await ask("Type the password again: ", true);
  if (again !== password) throw new Error("The two passwords don't match.");

  const hash = hashPassword(password).combined;
  const file = path.join(process.cwd(), ".env.local");
  const lines = fs.existsSync(file) ? fs.readFileSync(file, "utf8").split(/\r?\n/) : [];
  const kept = lines.filter((l) => !/^\s*(ADMIN_EMAIL|ADMIN_PASSWORD|ADMIN_PASSWORD_HASH)\s*=/.test(l));
  while (kept.length && kept[kept.length - 1] === "") kept.pop();
  kept.push("", "# Admin login (set with npm run admin:set)", `ADMIN_EMAIL="${email}"`, `ADMIN_PASSWORD_HASH="${hash}"`, "");
  fs.writeFileSync(file, kept.join("\n"));

  console.log("\nSaved to .env.local. Restart `npm run dev`, then sign in at /admin/login with:");
  console.log(`  Admin ID: ${email}`);
  console.log("  Password: the one you just typed\n");
  console.log("For the live site, add these two in Vercel → Project → Settings → Environment Variables, then redeploy:");
  console.log(`  ADMIN_EMAIL = ${email}`);
  console.log(`  ADMIN_PASSWORD_HASH = ${hash}`);
  console.log("  (and delete ADMIN_PASSWORD there if it exists)\n");
  rl.close();
}

main().catch((e) => {
  rl.close();
  console.error(`\n${e instanceof Error ? e.message : e}\n`);
  process.exit(1);
});
