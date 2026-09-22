import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { db, ensureSubscribersTable } from "@/db";
import { subscribers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isConfirmLinkExpired, maskEmail } from "@/lib/newsletter";

export const metadata: Metadata = {
  title: "Confirm your subscription — The EWU Express",
  robots: { index: false, follow: false },
};

/**
 * Confirmation step of double opt-in. The reader lands here from the email and
 * clicks once — that click is the record of consent, and it is why no other
 * email is ever sent to an address that has not confirmed.
 */
export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: { token?: string; status?: string };
}) {
  const status = searchParams.status;
  const token = searchParams.token?.trim() ?? "";

  let email: string | undefined;
  let unsubscribeToken: string | undefined;
  let expired = false;

  if (token.length >= 16) {
    try {
      await ensureSubscribersTable();
      const row = await db
        .select({
          email: subscribers.email,
          confirmedAt: subscribers.confirmedAt,
          subscribedAt: subscribers.subscribedAt,
          unsubscribeToken: subscribers.unsubscribeToken,
        })
        .from(subscribers)
        .where(eq(subscribers.confirmToken, token))
        .get();

      if (row?.email && !row.confirmedAt) {
        // The same 7-day window /api/confirm enforces: once it is up, the page
        // must stop offering a confirm button for a link that no longer works.
        expired = isConfirmLinkExpired(row.subscribedAt);
        if (!expired) {
          email = row.email;
          unsubscribeToken = row.unsubscribeToken ?? undefined;
        }
      }
    } catch {
      email = undefined;
    }
  }

  const invalid =
    status === "invalid" ||
    status === "expired" ||
    expired ||
    (!email && status !== "done" && status !== "already");
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
              You&apos;re confirmed.
            </h1>
            <p className="mt-4 text-muted leading-relaxed">
              {email ? maskEmail(email) : "Your address"} is on the list. You&apos;ll
              get an email when we publish a new story, and every one of them
              carries a one-click unsubscribe link.
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
              We couldn&apos;t match this confirmation link to a pending
              subscription. It may have been used already, or it may be more than
              7 days old. Just subscribe again from the front page and we&apos;ll
              send a fresh link.
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
              Confirm your subscription
            </h1>
            <p className="mt-4 text-muted leading-relaxed">
              Click below and {maskEmail(email as string)} will receive an email
              whenever a new story is published. Nothing else is sent to this
              address until you confirm.
            </p>
            <form
              action={`/api/confirm?token=${encodeURIComponent(token)}`}
              method="post"
              className="mt-8"
            >
              <input type="hidden" name="token" value={token} />
              <button
                type="submit"
                className="rounded-md bg-[#0f2a5c] px-6 py-3 text-sm font-bold text-white transition-opacity duration-300 hover:opacity-90 dark:bg-[#c9a227] dark:text-[#0f2a5c]"
              >
                Confirm subscription
              </button>
            </form>
            <p className="mt-4 text-xs text-faint">
              Didn&apos;t ask for this? Close this page — nothing is sent to this
              address unless you confirm.
            </p>
            {/* The abuse case: someone typed a stranger's address into the form.
                One click suppresses the row for good, without the reader having
                to email us about it. */}
            {unsubscribeToken ? (
              <form
                action="/api/unsubscribe?redirect=1"
                method="post"
                className="mt-3"
              >
                <input
                  type="hidden"
                  name="token"
                  value={unsubscribeToken}
                />
                <button
                  type="submit"
                  className="text-xs font-medium text-muted underline underline-offset-4 transition-colors duration-300 hover:text-ink"
                >
                  This wasn&apos;t me — remove this address
                </button>
              </form>
            ) : null}
          </>
        )}

        <p className="mt-10 text-xs leading-relaxed text-faint">
          We only use your address to send story emails. Read our{" "}
          <Link
            href="/privacy"
            className="underline transition-colors hover:text-ink"
          >
            privacy policy
          </Link>
          .
        </p>
      </div>
      <Footer />
    </main>
  );
}
