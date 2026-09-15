import { db } from "@/db";
import { subscribers } from "@/db/schema";
import { isMailerConfigured, sendPostEmail } from "@/lib/mailer";
import { Post } from "@/db/schema";

/**
 * Sends the new-post newsletter to all subscribers.
 * Best-effort: never throws, so publishing never fails because of mail.
 */
export async function notifySubscribersOfPost(post: Post): Promise<void> {
  if (!(await isMailerConfigured())) {
    console.log(
      "Newsletter skipped: no mail settings saved (admin → Settings) and no env fallback."
    );
    return;
  }

  try {
    const all = await db.select({ email: subscribers.email }).from(subscribers);
    const emails = all
      .map((s) => s.email)
      .filter((e): e is string => Boolean(e));

    if (!emails.length) {
      console.log("Newsletter skipped: no subscribers yet.");
      return;
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || undefined;
    let sent = 0;
    let failed = 0;

    for (const email of emails) {
      const ok = await sendPostEmail(email, post, siteUrl);
      if (ok) sent++;
      else failed++;
    }

    console.log(
      `Newsletter for "${post.title}": ${sent} sent, ${failed} failed (${emails.length} subscribers).`
    );
  } catch (error) {
    console.error("Newsletter dispatch failed:", error);
  }
}
