/**
 * Account-security emails (Resend). Links always use SITE_URL from the environment — never the
 * request's Host header — so a forged Host can't make a reset email point somewhere else.
 * Tokens and passwords are never logged; recipients are masked in logs.
 */
import { SITE_NAME, SITE_URL } from "./site";
import { escapeHtml, getVerifiedSenderAddress, maskEmailForLogs } from "./email";

/** True when transactional email can actually be sent (RESEND_API_KEY is set and isn't a placeholder). */
export function isEmailDeliveryConfigured(): boolean {
  const key = process.env.RESEND_API_KEY || "";
  return key.length > 10 && !/replace_with|placeholder|xxxx/i.test(key);
}

async function send(to: string, subject: string, html: string, text: string): Promise<boolean> {
  if (!isEmailDeliveryConfigured()) {
    console.warn(`[Security email] Not sent to ${maskEmailForLogs(to)}: RESEND_API_KEY is not configured.`);
    return false;
  }
  try {
    let sender = getVerifiedSenderAddress();
    let res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: sender, to: [to], subject, html, text }),
      cache: "no-store",
    });
    let data = await res.json().catch(() => ({}));
    if (
      !res.ok &&
      res.status === 403 &&
      sender !== "OFFVYBE <onboarding@resend.dev>" &&
      (data?.message?.includes("not verified") || data?.message?.includes("domain"))
    ) {
      sender = "OFFVYBE <onboarding@resend.dev>";
      res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: sender, to: [to], subject, html, text }),
        cache: "no-store",
      });
    }
    if (!res.ok) {
      console.warn(`[Security email] Resend rejected mail to ${maskEmailForLogs(to)} (HTTP ${res.status}).`);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[Security email] Could not send to ${maskEmailForLogs(to)}:`, (err as Error).message);
    return false;
  }
}


function layout(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#FDFBF7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1E1B18">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border:1px solid #E5E0D8;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.04)" cellpadding="0" cellspacing="0">
<tr><td style="background:#8B1E3F;padding:24px 32px;text-align:center">
  <p style="margin:0;font-size:18px;font-weight:900;letter-spacing:4px;color:#FDFBF7">OFFVYBE</p>
  <p style="margin:4px 0 0;font-size:10px;letter-spacing:2px;color:#D4AF37;text-transform:uppercase">JODHPUR ATELIER &bull; ACCOUNT SECURITY</p>
</td></tr>
<tr><td style="padding:36px 32px">
<h1 style="margin:0 0 18px;font-size:20px;font-weight:700;color:#1E1B18;letter-spacing:-0.2px">${escapeHtml(title)}</h1>
${bodyHtml}
<hr style="border:none;border-top:1px solid #EFECE6;margin:32px 0 20px 0" />
<p style="margin:0;font-size:12px;line-height:1.6;color:#8C857E">If you didn't initiate this request, you can safely ignore this email &mdash; no changes will be made to your account. For assistance, reach out to <a href="mailto:concierge@offvybe.com" style="color:#8B1E3F;text-decoration:none">concierge@offvybe.com</a>.</p>
</td></tr></table>
</td></tr></table></body></html>`;
}

function button(href: string, label: string): string {
  return `<p style="margin:28px 0"><a href="${escapeHtml(href)}" style="display:inline-block;background:#8B1E3F;color:#ffffff;text-decoration:none;font-weight:600;letter-spacing:0.5px;padding:14px 28px;border-radius:6px;font-size:14px">${escapeHtml(label)}</a></p>
<p style="font-size:12px;color:#8C857E;word-break:break-all;line-height:1.5">Or paste this link into your browser:<br><a href="${escapeHtml(href)}" style="color:#8B1E3F;text-decoration:underline">${escapeHtml(href)}</a></p>`;
}

export function sendPasswordResetEmail(to: string, token: string): Promise<boolean> {
  const link = `${SITE_URL}/reset-password?token=${encodeURIComponent(token)}`;
  return send(
    to,
    `Reset your ${SITE_NAME} password`,
    layout("Reset your password", `<p style="line-height:1.6">Someone asked to reset the password for this email address. The link works once and expires in 30 minutes.</p>${button(link, "Choose a new password")}`),
    `Reset your ${SITE_NAME} password (link works once, expires in 30 minutes):\n${link}\n\nIf you didn't ask for this, ignore this email.`
  );
}

export function sendEmailConfirmation(to: string, token: string): Promise<boolean> {
  const link = `${SITE_URL}/verify-email?token=${encodeURIComponent(token)}`;
  return send(
    to,
    `Confirm your email for ${SITE_NAME}`,
    layout("Confirm your email", `<p style="line-height:1.6">Tap the button to confirm this is your email and finish creating your ${SITE_NAME} account. The link expires in 24 hours.</p>${button(link, "Confirm my email")}`),
    `Confirm your email to finish creating your ${SITE_NAME} account (expires in 24 hours):\n${link}\n\nIf you didn't sign up, ignore this email.`
  );
}

/** Sent when someone tries to register with an email that already has an account. */
export function sendAccountExistsEmail(to: string): Promise<boolean> {
  const login = `${SITE_URL}/login`;
  const reset = `${SITE_URL}/reset-password`;
  return send(
    to,
    `You already have a ${SITE_NAME} account`,
    layout("You already have an account", `<p style="line-height:1.6">Someone tried to create a new account with this email, but you already have one. You can sign in, or reset your password if you've forgotten it.</p>${button(login, "Sign in")}<p style="font-size:13px"><a href="${escapeHtml(reset)}" style="color:#8B1E3F">Forgot your password?</a></p>`),
    `Someone tried to create an account with this email, but you already have one.\nSign in: ${login}\nForgot your password? ${reset}`
  );
}

/** Tells the admin about a sign-in from a browser that hasn't signed in before. */
export function sendAdminNewDeviceAlert(to: string, details: { ip: string; userAgent: string; at: Date }): Promise<boolean> {
  const when = details.at.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  return send(
    to,
    `New admin sign-in to ${SITE_NAME}`,
    layout(
      "New admin sign-in",
      `<p style="line-height:1.6">Your admin account was just signed in from a browser that hasn't been used before.</p>
<p style="font-size:13px;line-height:1.7"><strong>When:</strong> ${escapeHtml(when)} IST<br><strong>IP address:</strong> ${escapeHtml(details.ip)}<br><strong>Browser:</strong> ${escapeHtml(details.userAgent.slice(0, 160))}</p>
<p style="line-height:1.6">If this wasn't you, change ADMIN_PASSWORD_HASH and ADMIN_TOTP_SECRET in your hosting environment settings immediately and use “Sign out all admin devices”.</p>`
    ),
    `New admin sign-in to ${SITE_NAME}\nWhen: ${when} IST\nIP: ${details.ip}\nBrowser: ${details.userAgent.slice(0, 160)}\nIf this wasn't you, rotate the admin password and 2-step secret now.`
  );
}
