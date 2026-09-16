import nodemailer from "nodemailer";
import { Post } from "@/db/schema";
import { getMailConfig } from "@/lib/settings";

/**
 * Newsletter delivery via the owner's own Gmail account using an App Password.
 * Config lives in the admin Settings page (app_settings table). Environment
 * variables MAIL_FROM / MAIL_USER / MAIL_APP_PASSWORD remain as a fallback.
 */

const SITE_NAME = "The EWU Express";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://theewuexpress.vercel.app";

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

/** Branded post-preview email: category chip, caption teaser, big CTA button. */
export function buildPostEmail(post: Post, siteUrl = SITE_URL): { subject: string; html: string; text: string } {
  const subject = `📰 ${post.title}`;
  const url = `${siteUrl}/article/${post.slug}`;
  const previewText = post.caption || stripHtml(post.content).slice(0, 160);

  const html = `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f5;">
    <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(previewText)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:#08216e;padding:20px 28px;">
                <span style="color:#ffdb57;font-weight:800;font-size:15px;letter-spacing:0.5px;">${SITE_NAME}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 14px;color:#a3a3a3;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">New story just dropped</p>
                <h1 style="margin:0 0 12px;color:#111;font-size:24px;line-height:1.25;">${escapeHtml(post.title)}</h1>
                <p style="margin:0 0 24px;color:#525252;font-size:15px;line-height:1.6;">${escapeHtml(previewText)}</p>
                <a href="${url}" style="display:inline-block;background:#e11d48;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 28px;border-radius:12px;">Read the full story →</a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e4e4e7;">
                  <tr>
                    <td style="padding-top:16px;color:#a3a3a3;font-size:12px;line-height:1.5;">
                      You're receiving this because you subscribed at ${SITE_NAME}.
                      <br />© ${new Date().getFullYear()} ${SITE_NAME} · East West University
                    </td>
                  </tr>
                </table>
              </td>
              </tr>
          </table>
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
  siteUrl?: string
): Promise<boolean> {
  try {
    const config = await getMailConfig();
    if (!config) {
      console.error("Post email skipped: mailer not configured.");
      return false;
    }

    const { subject, html, text } = buildPostEmail(post, siteUrl);
    await getTransport(config.user, config.appPassword).sendMail({
      from: `${config.fromName} <${config.user}>`,
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
