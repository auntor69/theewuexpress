export function parseUTCDate(dateString: string): Date {
  // SQLite stores UTC timestamps without Z suffix; browsers treat bare
  // datetime strings as local time. Append Z so JS parses them as UTC.
  if (!dateString.endsWith("Z") && !dateString.includes("+")) {
    return new Date(dateString.replace(" ", "T") + "Z");
  }
  return new Date(dateString);
}

/**
 * How long the link in the confirmation email stays usable. This is the window
 * the email itself advertises ("the link stops working after 7 days"), so it
 * has to be enforced — an expired link that still works makes the promise a
 * lie, and it lets a long-forgotten signup be confirmed by whoever finds the
 * mailbox open.
 */
export const CONFIRM_LINK_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Whether a pending signup's confirmation link has aged out.
 *
 * `subscribedAt` doubles as the send time: it is stamped when the pending row
 * is written and restamped on every resend, so the clock starts at the most
 * recent confirmation email the reader received. A row with no usable
 * timestamp is never treated as expired — failing open here only ever costs a
 * late confirmation, while failing closed would silently drop a real reader.
 */
export function isConfirmLinkExpired(
  subscribedAt: string | null | undefined
): boolean {
  if (!subscribedAt) return false;
  const sentAt = parseUTCDate(subscribedAt);
  if (Number.isNaN(sentAt.getTime())) return false;
  return Date.now() - sentAt.getTime() > CONFIRM_LINK_TTL_MS;
}

/** Hides all but the first character of the local part: a****@domain. */
export function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  const head = name.slice(0, 1);
  return `${head}${"*".repeat(Math.max(name.length - 1, 2))}@${domain}`;
}

/**
 * SMTP rejections that are permanent for this address — a full mailbox or a
 * connection problem can clear on retry, but "that user does not exist" will
 * never succeed no matter how often it is retried.
 *
 * Deliberately conservative, and it only inspects the rejection text: a typo in
 * OUR SMTP host produces DNS-looking errors on every send, and mistaking that
 * for bounces would suppress the entire list. Only rejections that clearly
 * name the recipient (user / mailbox / address / account) count.
 */
const HARD_BOUNCE_PATTERNS: RegExp[] = [
  /\b5\.1\.[01]\b/, // 550 5.1.0 / 5.1.1: other side refused the recipient
  /\bunknown\s+(?:user|recipient|mailbox|address)\b/i,
  /\bno\s+such\s+(?:user|recipient|mailbox|address)\b/i,
  /\b(?:user|recipient|mailbox|address)\s+(?:does\s+not\s+exist|not\s+found|unknown|doesn.t\s+exist)\b/i,
  /\b(?:user|address|mailbox|account|recipient|domain)[^.]{0,60}\bdoes\s+not\s+exist\b/i,
  /\brecipient\s+address\s+rejected\b/i,
  /\binvalid\s+(?:recipient|mailbox|address)\b/i,
  /\bbad\s+(?:destination|recipient)\s+(?:mailbox\s+)?address\b/i,
];

/**
 * Whether a send failure means the address itself is dead and should be
 * suppressed rather than retried forever.
 */
export function isHardBounce(error: string | null | undefined): boolean {
  if (!error) return false;
  return HARD_BOUNCE_PATTERNS.some((pattern) => pattern.test(error));
}

export function formatDate(dateString: string): string {
  const date = parseUTCDate(dateString);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function timeAgo(dateString: string): string {
  const date = parseUTCDate(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const intervals = [
    { label: "y", seconds: 31536000 },
    { label: "mo", seconds: 2592000 },
    { label: "w", seconds: 604800 },
    { label: "d", seconds: 86400 },
    { label: "h", seconds: 3600 },
    { label: "m", seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count}${interval.label} ago`;
    }
  }
  return "just now";
}

export function estimateReadTime(content: string): number {
  const text = content.replace(/<[^>]*>/g, "");
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function formatViews(views: number): string {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return String(views);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function escapeLikePattern(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
