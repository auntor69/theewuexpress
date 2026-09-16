import { db } from "@/db";
import { subscribers } from "@/db/schema";
import { isMailerConfigured, sendPostEmail } from "@/lib/mailer";
import { Post } from "@/db/schema";
import { getCategoryBySlug } from "@/lib/categories";
import { getSetting, SETTING_KEYS } from "@/lib/settings";

/**
 * Newsletter dispatch.
 *
 * Two things matter for real delivery on Vercel:
 *  1. Work that starts after the response is returned can be frozen mid-flight,
 *     so the caller awaits this function (there is nothing to await otherwise
 *     and emails quietly never send).
 *  2. Waiting for hundreds of sequential SMTP sends would blow the function
 *     timeout, so sends run in small parallel batches and the whole dispatch
 *     is capped by a time budget. Whatever fits in the budget goes out before
 *     the publish response returns; the rest keeps going in the background.
 *
 * Never throws — publishing must not fail because of mail.
 */
const SEND_CONCURRENCY = 5;
const DISPATCH_BUDGET_MS = 7000;

export async function notifySubscribersOfPost(post: Post): Promise<void> {
  if (!(await isMailerConfigured())) {
    console.log(
      "Newsletter skipped: no mail settings saved (admin → Settings) and no env fallback."
    );
    return;
  }

  const dispatch = async (): Promise<void> => {
    const all = await db.select({ email: subscribers.email }).from(subscribers);
    const emails = all
      .map((s) => s.email)
      .filter((e): e is string => Boolean(e));

    if (!emails.length) {
      console.log("Newsletter skipped: no subscribers yet.");
      return;
    }

    // The exact link inside the email must point at the live site — resolved
    // from the admin-saved site URL first, then env, then the known domain.
    const siteUrl =
      (await getSetting(SETTING_KEYS.siteUrl)) ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      undefined;
    const categoryName = getCategoryBySlug(post.category)?.name;

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < emails.length; i += SEND_CONCURRENCY) {
      const batch = emails.slice(i, i + SEND_CONCURRENCY);
      const results = await Promise.all(
        batch.map((email) => sendPostEmail(email, post, siteUrl, categoryName))
      );
      for (const ok of results) {
        if (ok) sent++;
        else failed++;
      }
    }

    console.log(
      `Newsletter for "${post.title}": ${sent} sent, ${failed} failed (${emails.length} subscribers).`
    );
  };

  try {
    let timedOut = false;
    await Promise.race([
      dispatch(),
      new Promise<void>((resolve) =>
        setTimeout(() => {
          timedOut = true;
          resolve();
        }, DISPATCH_BUDGET_MS)
      ),
    ]);

    if (timedOut) {
      console.warn(
        `Newsletter for "${post.title}" exceeded the ${DISPATCH_BUDGET_MS}ms budget — ` +
          "remaining sends continue in the background. Consider a large list a batch job."
      );
    }
  } catch (error) {
    console.error("Newsletter dispatch failed:", error);
  }
}
