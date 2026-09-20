import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

/**
 * Shared shell for the policy pages (privacy, terms). Keeps the editorial
 * masthead and rule language of the paper so a legal page still reads like
 * part of the publication rather than a bolted-on template.
 */
export function LegalPage({
  title,
  intro,
  updated,
  contactEmail,
  postalAddress,
  children,
}: {
  title: string;
  intro: string;
  updated: string;
  contactEmail?: string;
  postalAddress?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="h-16 sm:h-[72px]" aria-hidden />

      <header className="hairline-b bg-surface">
        <div className="container-editorial py-12 sm:py-16">
          <p className="kicker">Policies</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted">
            {intro}
          </p>
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-faint">
            Last updated {updated}
          </p>
        </div>
      </header>

      <article className="container-editorial max-w-2xl py-12 sm:py-16">
        <div className="legal-prose">{children}</div>

        <div className="mt-14 hairline-t pt-7">
          <h2 className="font-display text-base font-semibold tracking-tight text-ink">
            Contacting us
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            The EWU Express is a student-run news publication at East West
            University. Questions about this page, requests about your data, or
            a correction:{" "}
            {contactEmail ? (
              <a
                href={`mailto:${contactEmail}`}
                className="underline transition-opacity duration-300 hover:opacity-75"
                style={{ color: "var(--accent)" }}
              >
                {contactEmail}
              </a>
            ) : (
              <strong className="text-ink">
                use the address printed at the bottom of any email from us
              </strong>
            )}
            .
          </p>
          {postalAddress && (
            <p className="mt-3 text-[13px] leading-relaxed text-faint">
              {postalAddress}
            </p>
          )}
          <nav className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-semibold uppercase tracking-[0.16em]">
            <Link
              href="/privacy"
              className="text-muted transition-colors duration-300 hover:text-ink"
            >
              Privacy policy
            </Link>
            <Link
              href="/terms"
              className="text-muted transition-colors duration-300 hover:text-ink"
            >
              Terms of use
            </Link>
            <Link
              href="/"
              className="text-muted transition-colors duration-300 hover:text-ink"
            >
              Front page
            </Link>
          </nav>
        </div>
      </article>

      <Footer />
    </main>
  );
}
