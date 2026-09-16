import nodemailer from "nodemailer";
import { Post } from "@/db/schema";
import { getMailConfig } from "@/lib/settings";
import { articleUrl, resolveSiteUrl } from "@/lib/siteUrl";

/**
 * Newsletter delivery via the owner's own Gmail account using an App Password.
 * Config lives in the admin Settings page (app_settings table). Environment
 * variables MAIL_FROM / MAIL_USER / MAIL_APP_PASSWORD remain as a fallback.
 *
 * The HTML is deliberately built with tables + inline styles — that is the only
 * markup Gmail/Outlook render consistently. Tested against Gmail dark mode:
 * the card always keeps its light "print" background so text stays readable.
 */

const SITE_NAME = "The EWU Express";
const BRAND_NAVY = "#0f2a5c";
const BRAND_GOLD = "#c9a227";
const ACCENT = "#b91c1c";
const CARD_BG = "#fffdf8";
const PAGE_BG = "#f3efe7";

export async function isMailerConfigured(): Promise<boolean> {
  return Boolean(await getMailConfig());
}

function getTransport(user: string, appPassword: string) {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user,
      pass: appPassword,
    },
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/** Branded post-preview email: masthead, category, caption teaser, CTA. */
export function buildPostEmail(
  post: Post,
  siteUrlOverride?: string,
  categoryName?: string
): { subject: string; html: string; text: string } {
  // Subject stays clean — a bare headline reads like real journalism; emoji
  // trip spam filters and look unprofessional in a news context.
  const subject = `${SITE_NAME} · ${post.title}`;
  const url = articleUrl(post, siteUrlOverride);
  const previewText = post.caption || stripHtml(post.content).slice(0, 180);
  const year = new Date().getFullYear();

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${escapeHtml(post.title)}</title>
  </head>
  <body style="margin:0;padding:0;background:${PAGE_BG};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(previewText)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PAGE_BG};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:${CARD_BG};border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(28,25,23,0.08);">
            <!-- Masthead -->
            <tr>
              <td style="background:${BRAND_NAVY};padding:22px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:700;letter-spacing:0.04em;color:#f5efe0;">
                      THE EWU EXPRESS
                    </td>
                    <td align="right" style="font-family:Georgia,serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${BRAND_GOLD};">
                      Newsletter
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Story image (blocked images degrade gracefully via alt text) -->
            <tr>
              <td style="padding:0;">
                <img src="${post.coverImage}" alt="${escapeHtml(post.title)}" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;text-decoration:none;" />
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:36px 32px 8px 32px;font-family:Georgia,serif;">
                <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:${BRAND_GOLD};">
                  ${categoryName ? escapeHtml(categoryName) : "New story"}
                </p>
                <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;font-weight:700;color:#1c1917;">
                  ${escapeHtml(post.title)}
                </h1>
                <p style="margin:0 0 28px;font-size:16px;line-height:1.65;color:#57534e;">
                  ${escapeHtml(previewText)}
                </p>
                <!-- CTA button (bulletproof VML-free version: padded link) -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="background:${ACCENT};border-radius:8px;">
                      <a href="${url}" style="display:inline-block;padding:14px 30px;font-family:Georgia,serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">
                        Read the full story &rarr;
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#a8a29e;word-break:break-all;">
                  Or copy this link: <a href="${url}" style="color:${ACCENT};text-decoration:underline;">${url}</a>
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:32px 32px 28px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #e7e0d2;">
                  <tr>
                    <td style="padding-top:18px;font-family:Georgia,serif;font-size:12px;line-height:1.6;color:#a8a29e;">
                      You are receiving this because you subscribed at
                      <a href="${resolveSiteUrl(siteUrlOverride)}" style="color:#57534e;text-decoration:underline;">${SITE_NAME}</a>, the student news publication of East West University.
                      <br />&copy; ${year} ${SITE_NAME} &middot; East West University, Dhaka
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <!--[if mso]></td></tr></table><![endif]-->
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `${post.title}\n\n${previewText}\n\nRead: ${url}\n\nYou're receiving this because you subscribed at ${SITE_NAME}.`;

  return { subject, html, text };
}

/** Sends the new-post email to one recipient. Returns true on success. */
export async function sendPostEmail(
  to: string,
  post: Post,
  siteUrl?: string,
  categoryName?: string
): Promise<boolean> {
  try {
    const config = await getMailConfig();
    if (!config) {
      console.error("Post email skipped: mailer not configured.");
      return false;
    }

    const { subject, html, text } = buildPostEmail(post, siteUrl, categoryName);
    await getTransport(config.user, config.appPassword).sendMail({
      from: `"${config.fromName}" <${config.user}>`,
      to,
      subject,
      html,
      text,
    });
    return true;
  } catch (error) {
    console.error(`Failed to send post email to ${to}:`, error);
    return false;
  }
}
