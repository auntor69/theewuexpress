import nodemailer, { type Transporter } from "nodemailer";
import { Post } from "@/db/schema";
import {
  DEFAULT_MAIL_ADDRESS,
  getMailConfig,
  getNewsletterIdentity,
  MailConfig,
} from "@/lib/settings";
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

/**
 * The story fields an email actually needs. Keeping this narrow lets the
 * delivery queue store a snapshot and still render exactly the same email.
 */
export interface NewsletterStory {
  title: string;
  slug: string;
  /** One/two sentence teaser under the headline. */
  preview: string;
  coverImage: string;
  categoryName?: string;
}

export interface PostEmailOptions {
  siteUrl?: string;
  /** Absolute one-click unsubscribe URL for this recipient. */
  unsubscribeUrl?: string;
  /**
   * Valid physical postal address, printed in the footer. Required on every
   * commercial email (CAN-SPAM §7704(a)(5)(A)(iii)); a reader must be able to
   * see who is mailing them and where that sender actually is.
   */
  mailingAddress?: string;
}

export async function isMailerConfigured(): Promise<boolean> {
  return Boolean(await getMailConfig());
}

/**
 * One SMTP connection pool per set of credentials, reused for every recipient.
 *
 * The previous version opened a fresh connection (TCP + TLS + auth) for each
 * email, which is slow enough that a 200-person list could not finish inside a
 * serverless request — and Gmail throttles repeated logins.
 */
let cached: { key: string; transport: Transporter } | null = null;

/**
 * The SMTP endpoint. Gmail is the default because it is the mailbox the
 * publication already owns, but the host is overridable (MAIL_HOST /
 * MAIL_PORT / MAIL_SECURE) so the list can later be moved to a dedicated
 * sending provider — with bounce handling and a real sending domain — without
 * another code change.
 */
function smtpEndpoint(): { host: string; port: number; secure: boolean } {
  const host = process.env.MAIL_HOST?.trim() || "smtp.gmail.com";
  const port = Number(process.env.MAIL_PORT ?? 465) || 465;
  const secure = process.env.MAIL_SECURE
    ? process.env.MAIL_SECURE !== "false"
    : port === 465;
  return { host, port, secure };
}

function getTransport(config: MailConfig): Transporter {
  const { host, port, secure } = smtpEndpoint();
  const key = `${host}\u0000${port}\u0000${config.user}\u0000${config.appPassword}`;
  if (cached?.key === key) return cached.transport;

  const transport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: config.user,
      pass: config.appPassword,
    },
    pool: true,
    maxConnections: 4,
    maxMessages: 100,
    // A stalled SMTP handshake must fail quickly: the whole dispatch has to fit
    // inside the serverless function's lifetime.
    connectionTimeout: 10000,
    greetingTimeout: 8000,
    socketTimeout: 20000,
  });

  cached = { key, transport };
  return transport;
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

/** Builds the email story from a post row (caption first, then the body text). */
export function storyFromPost(post: Post, categoryName?: string): NewsletterStory {
  const preview =
    post.caption?.trim() || stripHtml(post.content ?? "").slice(0, 180);
  return {
    title: post.title,
    slug: post.slug,
    preview,
    coverImage: post.coverImage,
    categoryName,
  };
}

/** Branded post-preview email: masthead, category, teaser, CTA, opt-out. */
export function buildPostEmail(
  story: NewsletterStory,
  options: PostEmailOptions = {}
): { subject: string; html: string; text: string } {
  // Subject stays clean — a bare headline reads like real journalism; emoji
  // trip spam filters and look unprofessional in a news context.
  const subject = `${SITE_NAME} · ${story.title}`;
  const url = articleUrl(story, options.siteUrl);
  const siteUrl = resolveSiteUrl(options.siteUrl);
  const previewText = story.preview;
  const year = new Date().getFullYear();
  const unsubscribe = options.unsubscribeUrl;
  const privacyUrl = `${siteUrl}/privacy`;
  const mailingAddress = options.mailingAddress ?? DEFAULT_MAIL_ADDRESS;

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${escapeHtml(story.title)}</title>
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
                <img src="${escapeHtml(story.coverImage)}" alt="${escapeHtml(story.title)}" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;text-decoration:none;" />
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:36px 32px 8px 32px;font-family:Georgia,serif;">
                <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:${BRAND_GOLD};">
                  ${story.categoryName ? escapeHtml(story.categoryName) : "New story"}
                </p>
                <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;font-weight:700;color:#1c1917;">
                  ${escapeHtml(story.title)}
                </h1>
                <p style="margin:0 0 28px;font-size:16px;line-height:1.65;color:#57534e;">
                  ${escapeHtml(previewText)}
                </p>
                <!-- CTA button (bulletproof VML-free version: padded link) -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="background:${ACCENT};border-radius:8px;">
                      <a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 30px;font-family:Georgia,serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">
                        Read the full story &rarr;
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#a8a29e;word-break:break-all;">
                  Or copy this link: <a href="${escapeHtml(url)}" style="color:${ACCENT};text-decoration:underline;">${escapeHtml(url)}</a>
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:32px 32px 28px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #e7e0d2;">
                  <tr>
                    <td style="padding-top:18px;font-family:Georgia,serif;font-size:12px;line-height:1.6;color:#a8a29e;">
                      You are receiving this email because you confirmed your address for
                      <a href="${escapeHtml(siteUrl)}" style="color:#57534e;text-decoration:underline;">${SITE_NAME}</a>,
                      the student news publication of East West University.
                      <br />
                      <a href="${escapeHtml(privacyUrl)}" style="color:#57534e;text-decoration:underline;">Privacy &amp; your data</a>${
                        unsubscribe
                          ? ` &middot; <a href="${escapeHtml(unsubscribe)}" style="color:#57534e;text-decoration:underline;">Unsubscribe</a>`
                          : ""
                      }
                      <br />&copy; ${year} ${escapeHtml(SITE_NAME)}
                      <br />${escapeHtml(mailingAddress)}
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

  const text =
    `${story.title}\n\n${previewText}\n\nRead: ${url}\n\n` +
    `You're receiving this email because you confirmed your address for ${SITE_NAME},\n` +
    `the student news publication of East West University.\n\n` +
    `Privacy & your data: ${privacyUrl}` +
    (unsubscribe ? `\nUnsubscribe: ${unsubscribe}` : "") +
    `\n\n${SITE_NAME}\n${mailingAddress}`;

  return { subject, html, text };
}

/**
 * Sends the newsletter email to one recipient. Returns true on success, or a
 * failure reason so the delivery log can record why a send was dropped.
 */
export async function sendPostEmail(
  to: string,
  story: NewsletterStory,
  options: PostEmailOptions = {}
): Promise<{ ok: true } | { ok: false; error: string }> {
  const config = await getMailConfig();
  if (!config) {
    return { ok: false, error: "Mailer not configured" };
  }

  try {
    // The postal address arrives in `options` from the dispatcher, which
    // resolves it once per run — deliberately no settings lookup here, because
    // this function is called once per recipient and must stay cheap.
    const { subject, html, text } = buildPostEmail(story, options);
    await getTransport(config).sendMail({
      from: `"${config.fromName}" <${config.user}>`,
      to,
      subject,
      html,
      text,
      // One-click opt-out: required by Gmail/Yahoo bulk-sender rules and the
      // reason mailbox providers trust the sending domain.
      headers: options.unsubscribeUrl
        ? {
            "List-Unsubscribe": `<${options.unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            Precedence: "bulk",
          }
        : undefined,
    });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Send failed";
    console.error(`Failed to send post email to ${to}:`, message);
    return { ok: false, error: message.slice(0, 300) };
  }
}

/** Confirmation email the admin can send to themselves to verify the setup. */
export async function sendTestEmail(
  to: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const config = await getMailConfig();
  if (!config) return { ok: false, error: "Mailer not configured" };

  const identity = await getNewsletterIdentity();
  const siteUrl = resolveSiteUrl(config.siteUrl);
  const privacyUrl = `${siteUrl}/privacy`;
  const year = new Date().getFullYear();
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:${PAGE_BG};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PAGE_BG};">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:${CARD_BG};border-radius:12px;overflow:hidden;">
        <tr><td style="background:${BRAND_NAVY};padding:20px 28px;font-family:Georgia,serif;font-size:18px;font-weight:700;letter-spacing:0.04em;color:#f5efe0;">THE EWU EXPRESS</td></tr>
        <tr><td style="padding:28px;font-family:Georgia,serif;">
          <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:${BRAND_GOLD};">Delivery check</p>
          <h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;color:#1c1917;">Your newsletter is connected</h1>
          <p style="margin:0 0 10px;font-size:15px;line-height:1.65;color:#57534e;">
            This is a test message from ${SITE_NAME}. Stories published from now on reach your subscribers
            as an email like this one, with the story image, a short preview and a direct link.
          </p>
          <p style="margin:0;font-size:15px;line-height:1.65;color:#57534e;">
            Sent from <strong>${escapeHtml(config.fromName)}</strong> &lt;${escapeHtml(config.user)}&gt; at
            ${new Date().toUTCString()}.
          </p>
        </td></tr>
        <tr><td style="padding:0 28px 24px;font-family:Georgia,serif;font-size:12px;line-height:1.6;color:#a8a29e;">
          Test message sent from ${escapeHtml(config.user)}.
          <br />(Real story emails also carry a one-click unsubscribe link.)
          <br />&copy; ${year} ${escapeHtml(SITE_NAME)} &middot;
          <a href="${escapeHtml(privacyUrl)}" style="color:#57534e;text-decoration:underline;">Privacy &amp; your data</a>
          <br />${escapeHtml(identity.postalAddress)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  try {
    await getTransport(config).sendMail({
      from: `"${config.fromName}" <${config.user}>`,
      to,
      subject: `${SITE_NAME} — newsletter delivery test`,
      html,
      text:
        `${SITE_NAME} newsletter test: sending works from ${config.user}.\n\n` +
        `Privacy & your data: ${privacyUrl}\n` +
        `${SITE_NAME}\n${identity.postalAddress}`,
    });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Test email failed";
    console.error("Test email failed:", message);
    return { ok: false, error: message };
  }
}

/**
 * Double opt-in confirmation. Sent the moment someone types their address in;
 * until they click the link they are not on the list and receive nothing else.
 */
export async function sendConfirmationEmail(
  to: string,
  confirmUrl: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const config = await getMailConfig();
  if (!config) return { ok: false, error: "Mailer not configured" };

  const identity = await getNewsletterIdentity();
  const siteUrl = resolveSiteUrl(config.siteUrl);
  const privacyUrl = `${siteUrl}/privacy`;
  const year = new Date().getFullYear();

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Confirm your subscription</title>
  </head>
  <body style="margin:0;padding:0;background:${PAGE_BG};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PAGE_BG};">
      <tr><td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:${CARD_BG};border-radius:12px;overflow:hidden;">
          <tr><td style="background:${BRAND_NAVY};padding:20px 28px;font-family:Georgia,serif;font-size:18px;font-weight:700;letter-spacing:0.04em;color:#f5efe0;">THE EWU EXPRESS</td></tr>
          <tr><td style="padding:28px 28px 8px;font-family:Georgia,serif;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:${BRAND_GOLD};">One step left</p>
            <h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;color:#1c1917;">Confirm your subscription</h1>
            <p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:#57534e;">
              Someone (hopefully you) asked to receive ${SITE_NAME} stories by email at
              <strong>${escapeHtml(to)}</strong>. Click below to confirm — we will not send
              anything else to this address until you do.
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="background:${ACCENT};border-radius:8px;">
                <a href="${escapeHtml(confirmUrl)}" style="display:inline-block;padding:14px 30px;font-family:Georgia,serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">
                  Confirm subscription
                </a>
              </td></tr>
            </table>
            <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#a8a29e;word-break:break-all;">
              Or copy this link: <a href="${escapeHtml(confirmUrl)}" style="color:${ACCENT};text-decoration:underline;">${escapeHtml(confirmUrl)}</a>
            </p>
            <p style="margin:14px 0 0;font-size:13px;line-height:1.6;color:#a8a29e;">
              If you did not ask for this, ignore this email — no subscription exists and
              nothing further will be sent. The link stops working after 7 days.
            </p>
          </td></tr>
          <tr><td style="padding:0 28px 24px;font-family:Georgia,serif;font-size:12px;line-height:1.6;color:#a8a29e;">
            &copy; ${year} ${escapeHtml(SITE_NAME)} &middot;
            <a href="${escapeHtml(privacyUrl)}" style="color:#57534e;text-decoration:underline;">Privacy &amp; your data</a>
            <br />${escapeHtml(identity.postalAddress)}
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const text =
    `Confirm your ${SITE_NAME} subscription\n\n` +
    `Someone asked to receive ${SITE_NAME} stories at ${to}.\n` +
    `Confirm here: ${confirmUrl}\n\n` +
    `If you did not ask for this, ignore this email — no subscription exists and\n` +
    `nothing further will be sent. The link stops working after 7 days.\n\n` +
    `Privacy & your data: ${privacyUrl}\n` +
    `${SITE_NAME}\n${identity.postalAddress}`;

  try {
    await getTransport(config).sendMail({
      from: `"${config.fromName}" <${config.user}>`,
      to,
      subject: `Confirm your ${SITE_NAME} subscription`,
      html,
      text,
      // Nobody opted into anything yet — this is a one-off confirmation, not bulk mail.
      headers: { "Auto-Submitted": "auto-generated" },
    });
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Confirmation email failed";
    console.error("Confirmation email failed:", message);
    return { ok: false, error: message.slice(0, 300) };
  }
}
