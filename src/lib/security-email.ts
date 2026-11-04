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
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: getVerifiedSenderAddress(), to: [to], subject, html, text }),
      cache: "no-store",
    });
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
  return `<!doctype html><html><body style="margin:0;background:#F5F5F5;font-family:Arial,Helvetica,sans-serif;color:#0A0A0A">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;padding:32px" cellpadding="0" cellspacing="0"><tr><td>
<p style="margin:0 0 24px;font-weight:900;letter-spacing:2px;font-size:18px">${SITE_NAME}</p>
<h1 style="margin:0 0 16px;font-size:20px">${escapeHtml(title)}</h1>
${bodyHtml}
<p style="margin:32px 0 0;font-size:12px;color:#6B6B6B">If you didn't ask for this, you can ignore this email — nothing changes on your account.</p>
</td></tr></table></td></tr></table></body></html>`;
}

function button(href: string, label: string): string {
  return `<p style="margin:24px 0"><a href="${escapeHtml(href)}" style="display:inline-block;background:#0A0A0A;color:#ffffff;text-decoration:none;font-weight:bold;padding:14px 24px;border-radius:999px">${escapeHtml(label)}</a></p>
<p style="font-size:12px;color:#6B6B6B;word-break:break-all">Or paste this link into your browser:<br>${escapeHtml(href)}</p>`;
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
    layout("You already have an account", `<p style="line-height:1.6">Someone tried to create a new account with this email, but you already have one. You can sign in, or reset your password if you've forgotten it.</p>${button(login, "Sign in")}<p style="font-size:13px"><a href="${escapeHtml(reset)}">Forgot your password?</a></p>`),
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
<p style="line-height:1.6">If this wasn't you, change ADMIN_PASSWORD_HASH and ADMIN_TOTP_SECRET in Vercel straight away and use “Sign out all admin devices”.</p>`
    ),
    `New admin sign-in to ${SITE_NAME}\nWhen: ${when} IST\nIP: ${details.ip}\nBrowser: ${details.userAgent.slice(0, 160)}\nIf this wasn't you, rotate the admin password and 2-step secret now.`
  );
}
