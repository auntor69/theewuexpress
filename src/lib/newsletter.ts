import { randomBytes } from "crypto";
import {
  db,
  ensureNewsletterDeliveriesTable,
  ensureSubscribersTable,
} from "@/db";
import { newsletterDeliveries, posts, subscribers, type Post } from "@/db/schema";
import { and, asc, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import {
  isMailerConfigured,
  sendPostEmail,
  storyFromPost,
  type NewsletterStory,
} from "@/lib/mailer";
import { getCategoryBySlug } from "@/lib/categories";
import {
  getNewsletterIdentity,
  getSetting,
  SETTING_KEYS,
} from "@/lib/settings";
import { resolveSiteUrl } from "@/lib/siteUrl";
import { isConfirmLinkExpired, isHardBounce } from "@/lib/utils";

/**
 * Newsletter core: who gets an email, whether it went out, and how a reader
 * opts out.
 *
 * Delivery is queue-based on purpose. Serverless functions are frozen the
 * moment a response is returned, so "send it in the background after
 * responding" silently loses every email the function didn't finish — and a
 * big list cannot finish inside one request. Instead every publish writes a
 * row per subscriber first, then sends as many as the time budget allows. What
 * is left stays `pending`, visible in the admin panel and resumable, so a send
 * is never lost and never repeated.
 */

const SEND_CONCURRENCY = 8;
/** Default synchronous budget for a publish request (awaited, so nothing is abandoned). */
export const DISPATCH_BUDGET_MS = Number(process.env.NEWSLETTER_BUDGET_MS ?? 20000);
/** Larger budget for an explicit "send the rest" run from the admin panel. */
export const RESUME_BUDGET_MS = Number(process.env.NEWSLETTER_RESUME_BUDGET_MS ?? 50000);
const MAX_ROWS_PER_RUN = 2000;

export function nowUtc(): string {
  return new Date().toISOString().replace("T", " ").replace(/\.\d{3}Z$/, "");
}

export function createUnsubscribeToken(): string {
  return randomBytes(16).toString("hex");
}

/** Same shape of secret as the unsubscribe token; separate so one cannot be used as the other. */
export function createConfirmToken(): string {
  return randomBytes(16).toString("hex");
}

export function unsubscribeUrlFor(token: string, siteUrl?: string | null): string {
  return `${resolveSiteUrl(siteUrl)}/unsubscribe?token=${encodeURIComponent(token)}`;
}

export function confirmUrlFor(token: string, siteUrl?: string | null): string {
  return `${resolveSiteUrl(siteUrl)}/confirm?token=${encodeURIComponent(token)}`;
}



export interface DispatchSummary {
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  pending: number;
  /** How many previously-failed rows this run picked back up. */
  retried?: number;
}

const EMPTY_SUMMARY: DispatchSummary = {
  total: 0,
  sent: 0,
  failed: 0,
  skipped: 0,
  pending: 0,
};

/**
 * The only people the newsletter is allowed to email: they clicked the link in
 * the confirmation email (double opt-in — the consent record a regulator will
 * ask for) and they have not opted out since.
 */
async function activeSubscriberList(): Promise<
  { id: number; email: string; token: string | null }[]
> {
  const rows = await db
    .select({
      id: subscribers.id,
      email: subscribers.email,
      token: subscribers.unsubscribeToken,
    })
    .from(subscribers)
    .where(
      and(
        isNull(subscribers.unsubscribedAt),
        isNotNull(subscribers.confirmedAt)
      )
    );

  return rows
    .filter((row) => Boolean(row.email?.trim()))
    .map((row) => ({
      id: row.id,
      email: (row.email ?? "").trim().toLowerCase(),
      token: row.token,
    }));
}

/**
 * Writes one pending delivery row per active subscriber for this story.
 * `force` clears any previous log for the story so an admin re-send goes out
 * again; otherwise the unique (post, email) index makes this idempotent.
 */
async function enqueueStory(post: Post, force: boolean): Promise<number> {
  await ensureSubscribersTable();
  await ensureNewsletterDeliveriesTable();

  const recipients = await activeSubscriberList();
  if (!recipients.length) return 0;

  if (force) {
    await db
      .delete(newsletterDeliveries)
      .where(eq(newsletterDeliveries.postId, post.id));
  }

  for (let i = 0; i < recipients.length; i += 100) {
    const chunk = recipients.slice(i, i + 100);
    await db
      .insert(newsletterDeliveries)
      .values(
        chunk.map((recipient) => ({
          postId: post.id,
          email: recipient.email,
          status: "pending",
        }))
      )
      .onConflictDoNothing();
  }

  return recipients.length;
}

/**
 * Sends pending deliveries, newest queue first, until the budget runs out.
 * Safe to call repeatedly: sent rows move out of `pending`, so a resumed run
 * only touches what is still outstanding.
 */
export async function drainNewsletterQueue(
  options: { postId?: number; budgetMs?: number; retryFailed?: boolean } = {}
): Promise<DispatchSummary> {
  await ensureNewsletterDeliveriesTable();

  // `retryFailed` also picks up rows that failed earlier (Gmail quota, a
  // temporary connection error) so an admin can try them again.
  const statuses = options.retryFailed ? ["pending", "failed"] : ["pending"];
  const where = options.postId
    ? and(
        inArray(newsletterDeliveries.status, statuses),
        eq(newsletterDeliveries.postId, options.postId)
      )
    : inArray(newsletterDeliveries.status, statuses);

  const rows = await db
    .select()
    .from(newsletterDeliveries)
    .where(where)
    .orderBy(asc(newsletterDeliveries.id))
    .limit(MAX_ROWS_PER_RUN);

  const summary: DispatchSummary = {
    ...EMPTY_SUMMARY,
    total: rows.length,
    pending: rows.length,
    retried: options.retryFailed
      ? rows.filter((row) => row.status === "failed").length
      : 0,
  };
  if (!rows.length) return summary;

  if (!(await isMailerConfigured())) {
    console.warn(
      `Newsletter: ${rows.length} emails queued but no mail settings are saved (admin → Settings).`
    );
    return summary;
  }

  const siteUrl =
    (await getSetting(SETTING_KEYS.siteUrl)) ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    undefined;

  // Resolved once per run, not once per recipient — the postal address is part
  // of every email's footer and looks up settings.
  const identity = await getNewsletterIdentity();

  const recipients = await activeSubscriberList();
  const tokenByEmail = new Map(
    recipients.map((recipient) => [recipient.email, recipient.token])
  );

  // Story data is read live when the post still exists, so a resumed send uses
  // the current title/slug instead of a stale snapshot.
  const storyCache = new Map<number, NewsletterStory | null>();
  const storyFor = async (postId: number): Promise<NewsletterStory | null> => {
    if (storyCache.has(postId)) return storyCache.get(postId) ?? null;
    const post = await db.select().from(posts).where(eq(posts.id, postId)).get();
    const story = post
      ? storyFromPost(post, getCategoryBySlug(post.category)?.name)
      : null;
    storyCache.set(postId, story);
    return story;
  };

  const budgetMs = options.budgetMs ?? DISPATCH_BUDGET_MS;
  const deadline = Date.now() + budgetMs;

  // Rejections that mean the address is dead. Retrying them forever is why
  // "Retry failed" existed in the first place — this is the fix, not a workaround.
  // Rows carry no token; look it up through the recipient's unsubscribe token.
  const suppress: { token: string; email: string; error: string }[] = [];

  for (let i = 0; i < rows.length; i += SEND_CONCURRENCY) {
    // Stop cleanly before the function is killed; the rest stays pending.
    if (Date.now() >= deadline) break;

    const batch = rows.slice(i, i + SEND_CONCURRENCY);
    const sentIds: number[] = [];
    const skippedIds: number[] = [];
    const failures: { id: number; error: string }[] = [];

    await Promise.all(
      batch.map(async (row) => {
        const email = row.email.trim().toLowerCase();
        const token = tokenByEmail.get(email);

        // Opted out (or removed) after the story was queued → never send.
        if (!token) {
          skippedIds.push(row.id);
          return;
        }

        const story = await storyFor(row.postId);
        if (!story) {
          failures.push({ id: row.id, error: "Story was deleted before it sent" });
          return;
        }

        const result = await sendPostEmail(email, story, {
          siteUrl,
          unsubscribeUrl: unsubscribeUrlFor(token, siteUrl),
          mailingAddress: identity.postalAddress,
        });

        if (result.ok) sentIds.push(row.id);
        else failures.push({ id: row.id, error: result.error });
      })
    );

    if (sentIds.length) {
      await db
        .update(newsletterDeliveries)
        .set({ status: "sent", sentAt: nowUtc(), attemptedAt: nowUtc(), error: null })
        .where(inArray(newsletterDeliveries.id, sentIds));
      summary.sent += sentIds.length;
    }

    if (skippedIds.length) {
      await db
        .update(newsletterDeliveries)
        .set({ status: "skipped", error: "Unsubscribed before it was sent" })
        .where(inArray(newsletterDeliveries.id, skippedIds));
      summary.skipped += skippedIds.length;
    }

    for (const failure of failures) {
      // A hard bounce can never succeed on retry — the mailbox does not exist.
      // Suppression is immediate; one attempt is enough to be certain.
      if (isHardBounce(failure.error)) {
        const recipient = batch.find((row) => row.id === failure.id);
        const token = recipient ? tokenByEmail.get(recipient.email.trim().toLowerCase()) : undefined;
        if (token) {
          suppress.push({
            token,
            email: recipient!.email,
            error: failure.error,
          });
        }
      }
      await db
        .update(newsletterDeliveries)
        // A failed send records when we *tried* — `sentAt` stays null so a
        // failure can never be read as a delivery.
        .set({ status: "failed", error: failure.error, attemptedAt: nowUtc() })
        .where(eq(newsletterDeliveries.id, failure.id));
      summary.failed += 1;
    }
  }

  // Opt the bounced addresses out, so the next story never even queues a row
  // for them. Same mechanism and same permanence as a reader unsubscribe.
  for (const bounced of suppress) {
    if (!bounced.token) continue;
    await db
      .update(subscribers)
      .set({ unsubscribedAt: nowUtc() })
      .where(
        and(
          eq(subscribers.unsubscribeToken, bounced.token),
          isNull(subscribers.unsubscribedAt)
        )
      );
    console.warn(
      `Newsletter: suppressed ${bounced.email} after a hard bounce (${bounced.error.slice(0, 120)}).`
    );
  }

  summary.pending = summary.total - summary.sent - summary.failed - summary.skipped;
  return summary;
}

/**
 * Public entry point used when a story is published. Never throws — publishing
 * must not fail because of mail.
 */
export async function notifySubscribersOfPost(
  post: Post,
  options: { force?: boolean; budgetMs?: number } = {}
): Promise<DispatchSummary> {
  try {
    if (!(await isMailerConfigured())) {
      console.log(
        "Newsletter skipped: no mail settings saved (admin → Settings) and no env fallback."
      );
      return { ...EMPTY_SUMMARY };
    }

    const recipients = await enqueueStory(post, options.force === true);
    if (!recipients) {
      console.log("Newsletter skipped: no subscribers yet.");
      return { ...EMPTY_SUMMARY };
    }

    const summary = await drainNewsletterQueue({
      postId: post.id,
      budgetMs: options.budgetMs,
    });

    console.log(
      `Newsletter for "${post.title}": ${summary.sent} sent, ${summary.failed} failed, ` +
        `${summary.skipped} skipped, ${summary.pending} still pending (${recipients} subscribers).`
    );
    return summary;
  } catch (error) {
    console.error("Newsletter dispatch failed:", error);
    return { ...EMPTY_SUMMARY };
  }
}

export interface NewsletterOverview {
  /** Confirmed readers who will receive the next story. */
  active: number;
  /** Signed up but never clicked the confirmation link — never emailed. */
  awaiting: number;
  unsubscribed: number;
  pending: number;
  /** Failed deliveries that can be retried. */
  retryable: number;
  pendingStory: { postId: number; title: string; count: number } | null;
  last: {
    postId: number;
    title: string;
    sent: number;
    failed: number;
    skipped: number;
    pending: number;
    total: number;
    at: string;
  } | null;
  recentFailures: { email: string; error: string; at: string }[];
}

/** Everything the admin panel shows about the newsletter in one round-trip. */
export async function getNewsletterOverview(): Promise<NewsletterOverview> {
  await ensureSubscribersTable();
  await ensureNewsletterDeliveriesTable();

  const [counts, pendingRows, lastRows, failures, retryableCount] = await Promise.all([
    db
      .select({
        active: sql<number>`sum(case when ${subscribers.confirmedAt} is not null and ${subscribers.unsubscribedAt} is null then 1 else 0 end)`,
        awaiting: sql<number>`sum(case when ${subscribers.confirmedAt} is null and ${subscribers.unsubscribedAt} is null then 1 else 0 end)`,
        unsubscribed: sql<number>`sum(case when ${subscribers.unsubscribedAt} is null then 0 else 1 end)`,
      })
      .from(subscribers),
    db
      .select({
        postId: newsletterDeliveries.postId,
        count: sql<number>`count(*)`,
      })
      .from(newsletterDeliveries)
      .where(eq(newsletterDeliveries.status, "pending"))
      .groupBy(newsletterDeliveries.postId)
      .orderBy(asc(newsletterDeliveries.postId)),
    db
      .select({
        postId: newsletterDeliveries.postId,
        sent: sql<number>`sum(case when ${newsletterDeliveries.status} = 'sent' then 1 else 0 end)`,
        failed: sql<number>`sum(case when ${newsletterDeliveries.status} = 'failed' then 1 else 0 end)`,
        skipped: sql<number>`sum(case when ${newsletterDeliveries.status} = 'skipped' then 1 else 0 end)`,
        pending: sql<number>`sum(case when ${newsletterDeliveries.status} = 'pending' then 1 else 0 end)`,
        total: sql<number>`count(*)`,
        at: sql<string>`max(${newsletterDeliveries.createdAt})`,
      })
      .from(newsletterDeliveries)
      .groupBy(newsletterDeliveries.postId)
      .orderBy(desc(sql`max(${newsletterDeliveries.createdAt})`))
      .limit(1),
    db
      .select({
        email: newsletterDeliveries.email,
        error: newsletterDeliveries.error,
        at: newsletterDeliveries.attemptedAt,
      })
      .from(newsletterDeliveries)
      .where(eq(newsletterDeliveries.status, "failed"))
      .orderBy(desc(newsletterDeliveries.id))
      .limit(5),
    db
      .select({ total: sql<number>`count(*)` })
      .from(newsletterDeliveries)
      .where(eq(newsletterDeliveries.status, "failed")),
  ]);

  const pendingTotal = pendingRows.reduce((sum, row) => sum + Number(row.count), 0);
  const ids = new Set<number>();
  pendingRows.forEach((row) => ids.add(row.postId));
  lastRows.forEach((row) => ids.add(row.postId));

  const titles = new Map<number, string>();
  if (ids.size) {
    const found = await db
      .select({ id: posts.id, title: posts.title })
      .from(posts)
      .where(inArray(posts.id, Array.from(ids)));
    found.forEach((post) => titles.set(post.id, post.title));
  }

  const firstPending = pendingRows.find((row) => Number(row.count) > 0);
  const lastRow = lastRows[0];

  return {
    active: Number(counts[0]?.active ?? 0),
    awaiting: Number(counts[0]?.awaiting ?? 0),
    unsubscribed: Number(counts[0]?.unsubscribed ?? 0),
    pending: pendingTotal,
    retryable: Number(retryableCount[0]?.total ?? 0),
    pendingStory: firstPending
      ? {
          postId: firstPending.postId,
          title: titles.get(firstPending.postId) ?? `Story #${firstPending.postId}`,
          count: Number(firstPending.count),
        }
      : null,
    last: lastRow
      ? {
          postId: lastRow.postId,
          title: titles.get(lastRow.postId) ?? `Story #${lastRow.postId}`,
          sent: Number(lastRow.sent ?? 0),
          failed: Number(lastRow.failed ?? 0),
          skipped: Number(lastRow.skipped ?? 0),
          pending: Number(lastRow.pending ?? 0),
          total: Number(lastRow.total ?? 0),
          at: String(lastRow.at ?? ""),
        }
      : null,
    recentFailures: failures.map((row) => ({
      email: row.email,
      error: row.error ?? "Unknown error",
      at: row.at ?? "",
    })),
  };
}

export type UnsubscribeStatus = "done" | "already" | "invalid";

/** Opts an address out by its unsubscribe token. */
export async function unsubscribeByToken(
  rawToken: string | null | undefined
): Promise<{ status: UnsubscribeStatus; email?: string }> {
  const token = rawToken?.trim();
  if (!token || token.length < 16) return { status: "invalid" };

  await ensureSubscribersTable();

  const row = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.unsubscribeToken, token))
    .get();

  if (!row?.email) return { status: "invalid" };
  if (row.unsubscribedAt) return { status: "already", email: row.email };

  await db
    .update(subscribers)
    .set({ unsubscribedAt: nowUtc() })
    .where(eq(subscribers.id, row.id));

  return { status: "done", email: row.email };
}

export type SubscriptionStart =
  /** Already a confirmed reader — nothing to do. */
  | { status: "active"; email: string }
  /** A confirmation email must be sent to this address before they get stories. */
  | { status: "awaiting"; email: string; confirmUrl: string; resent: boolean }
  | { status: "failed"; email: string };

/**
 * Starts (or restarts) a subscription.
 *
 * The address is not added to the mailing list until the reader clicks the
 * link in the confirmation email. That link is the consent record — without
 * it, anyone can be signed up by a stranger, and there is nothing on file
 * proving the reader ever asked for the emails. It is also what stops a
 * typo'd or forged address from ever being mailed.
 *
 * Re-subscribing rotates the unsubscribe token so a link from a previous
 * subscription cannot remove the new one.
 */
export async function startSubscription(
  rawEmail: string
): Promise<SubscriptionStart> {
  const email = rawEmail.trim().toLowerCase();
  await ensureSubscribersTable();

  // With no mail settings saved there is no email to confirm against and no
  // newsletter can go out at all, so stay single opt-in (keeps local dev and a
  // freshly cloned install usable).
  const requireConfirmation = await isMailerConfigured();
  const siteUrl =
    (await getSetting(SETTING_KEYS.siteUrl)) ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    undefined;

  const existing = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.email, email))
    .get();

  const confirmToken = requireConfirmation ? createConfirmToken() : null;

  if (existing) {
    if (existing.confirmedAt && !existing.unsubscribedAt) {
      return { status: "active", email };
    }

    // Pending and asking again → they probably lost the email; say so.
    const resent = !existing.unsubscribedAt && !existing.confirmedAt;

    await db
      .update(subscribers)
      .set({
        confirmToken,
        confirmedAt: confirmToken ? null : nowUtc(),
        unsubscribeToken: createUnsubscribeToken(),
        unsubscribedAt: null,
        subscribedAt: nowUtc(),
      })
      .where(eq(subscribers.id, existing.id));

    if (!confirmToken) return { status: "active", email };
    return {
      status: "awaiting",
      email,
      confirmUrl: confirmUrlFor(confirmToken, siteUrl),
      resent,
    };
  }

  try {
    await db.insert(subscribers).values({
      email,
      confirmToken,
      confirmedAt: confirmToken ? null : nowUtc(),
      unsubscribeToken: createUnsubscribeToken(),
    });
  } catch {
    // Race: the same address was inserted between the check and this insert.
    const row = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.email, email))
      .get();
    if (row?.confirmedAt && !row.unsubscribedAt) return { status: "active", email };
    if (row?.confirmToken) {
      return {
        status: "awaiting",
        email,
        confirmUrl: confirmUrlFor(row.confirmToken, siteUrl),
        resent: false,
      };
    }
    return { status: "failed", email };
  }

  if (!confirmToken) return { status: "active", email };
  return {
    status: "awaiting",
    email,
    confirmUrl: confirmUrlFor(confirmToken, siteUrl),
    resent: false,
  };
}

export type ConfirmStatus = "done" | "already" | "expired" | "invalid";

/** Turns a confirmation link into an active subscription (once). */
export async function confirmByToken(
  rawToken: string | null | undefined
): Promise<{ status: ConfirmStatus; email?: string }> {
  const token = rawToken?.trim();
  if (!token || token.length < 16) return { status: "invalid" };

  await ensureSubscribersTable();

  const row = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.confirmToken, token))
    .get();

  if (!row?.email) return { status: "invalid" };

  // Someone who opted out stays opted out: an old confirmation link must never
  // undo an unsubscribe. Subscribing again through the form is the way back.
  if (row.unsubscribedAt) return { status: "invalid" };
  if (row.confirmedAt) return { status: "already", email: row.email };

  // Past the advertised window the link is dead. The row stays pending (so the
  // address can still be removed or subscribed again), but it can no longer be
  // turned into a subscription off the back of a weeks-old click.
  if (isConfirmLinkExpired(row.subscribedAt)) {
    return { status: "expired", email: row.email };
  }

  await db
    .update(subscribers)
    .set({
      confirmedAt: nowUtc(),
      confirmToken: null,
      unsubscribeToken: row.unsubscribeToken ?? createUnsubscribeToken(),
    })
    .where(eq(subscribers.id, row.id));

  return { status: "done", email: row.email };
}
