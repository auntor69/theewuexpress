import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { db, ensureSubscribersTable } from "@/db";
import { subscribers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { maskEmail } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Unsubscribe — The EWU Express",
  robots: { index: false, follow: false },
};

/**
 * Reader-facing opt-out page. The email link lands here (never straight on the
 * API) so a mail scanner can't unsubscribe anyone silently — the reader
 * confirms with one click.
 */
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: { token?: string; status?: string };
}) {
  const status = searchParams.status;
  const token = searchParams.token?.trim() ?? "";

  let email: string | undefined;
  if (token.length >= 16) {
    try {
      await ensureSubscribersTable();
      const row = await db
        .select({ email: subscribers.email })
        .from(subscribers)
        .where(eq(subscribers.unsubscribeToken, token))
        .get();
      email = row?.email ?? undefined;
    } catch {
      email = undefined;
    }
  }

  const invalid = status === "invalid" || (!email && status !== "done" && status !== "already");
  const done = status === "done" || status === "already";

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="h-16 sm:h-[72px]" aria-hidden />
      <div className="container-editorial max-w-xl py-20 text-center sm:py-28">
        <p className="kicker">Newsletter</p>

        {done ? (
          <>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              You&apos;re unsubscribed.
            </h1>
            <p className="mt-4 text-muted leading-relaxed">
              {email ? maskEmail(email) : "This address"} will no longer receive
              story emails from The EWU Express. Nothing else changed — your
              subscription can be restored any time from the front page.
            </p>
            <Link
              href="/"
              className="mt-8 inline-block rounded-md bg-[#0f2a5c] px-6 py-3 text-sm font-bold text-white transition-opacity duration-300 hover:opacity-90 dark:bg-[#c9a227] dark:text-[#0f2a5c]"
            >
              Back to the front page
            </Link>
          </>
        ) : invalid ? (
          <>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              That link has expired.
            </h1>
            <p className="mt-4 text-muted leading-relaxed">
              We couldn&apos;t match this unsubscribe link to a subscriber. If
              emails keep arriving, open the most recent one and use the
              unsubscribe link at the bottom.
            </p>
            <Link
              href="/"
              className="mt-8 inline-block rounded-md border border-line px-6 py-3 text-sm font-bold text-ink transition-colors duration-300 hover:border-[var(--gold)]"
            >
              Back to the front page
            </Link>
          </>
        ) : (
          <>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Stop story emails?
            </h1>
            <p className="mt-4 text-muted leading-relaxed">
              {maskEmail(email as string)} will no longer receive an email when a
              new story is published.
            </p>
            <form action="/api/unsubscribe?redirect=1" method="post" className="mt-8">
              <input type="hidden" name="token" value={token} />
              <button
                type="submit"
                className="rounded-md bg-[#b91c1c] px-6 py-3 text-sm font-bold text-white transition-opacity duration-300 hover:opacity-90"
              >
                Unsubscribe
              </button>
            </form>
            <p className="mt-4 text-xs text-faint">
              Changed your mind? Just close this page.
            </p>
          </>
        )}
      </div>
      <Footer />
    </main>
  );
}
