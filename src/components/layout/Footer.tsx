"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { categories } from "@/lib/categories";
import { Check, Loader2 } from "lucide-react";

/**
 * Slim footer — one band, three things, done. No headline block, no stacked
 * columns, no filler paragraph: brand + sections + subscribe on a single row
 * on desktop, tightly stacked on mobile, closed by a one-line colophon.
 */
export function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.error) {
        setStatus("error");
        setMessage(data.error);
      } else {
        setStatus("success");
        setMessage(data.message || "Subscribed!");
        setEmail("");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <footer className="mt-16 hairline-t bg-surface">
      <div className="container-editorial">
        <div className="py-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-8">
          {/* Brand — one line */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image
              src="/logo.png"
              alt="The EWU Express"
              width={26}
              height={26}
              className="rounded-md"
            />
            <span className="font-display font-bold text-sm tracking-tight text-ink">
              THE EWU EXPRESS
            </span>
          </Link>

          {/* Sections — inline, wraps instead of stacking */}
          <nav
            className="flex flex-wrap items-center gap-x-4 gap-y-1.5 md:justify-center"
            aria-label="Sections"
          >
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted hover:text-[var(--accent)] transition-colors duration-300"
              >
                {cat.name}
              </Link>
            ))}
          </nav>

          {/* Subscribe — compact inline form */}
          <form onSubmit={handleSubscribe} className="flex gap-2 md:shrink-0">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status !== "idle") setStatus("idle");
              }}
              placeholder="you@ewubd.edu"
              disabled={status === "loading"}
              aria-label="Email address"
              className="h-9 w-full md:w-44 px-3 bg-raised border border-line rounded-md text-[13px] text-ink placeholder:text-faint outline-none focus:border-[var(--gold)] transition-colors disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="h-9 px-3.5 rounded-md text-[13px] font-bold bg-[#c9a227] text-[#0f2a5c] hover:bg-[#d9b23a] transition-colors duration-300 disabled:opacity-60 flex items-center gap-1.5 shrink-0"
            >
              {status === "loading" ? (
                <Loader2 size={13} className="animate-spin" />
              ) : status === "success" ? (
                <Check size={13} />
              ) : null}
              {status === "success" ? "Sent" : "Subscribe"}
            </button>
          </form>
        </div>

        {message && (
          <p
            className={`pb-4 -mt-2 text-[11px] ${
              status === "error" ? "text-red-500" : "text-[var(--gold)]"
            }`}
          >
            {message}
          </p>
        )}

        {/* Consent disclosure — required: a reader must know what they are
            agreeing to before handing over an address. One line, kept quiet. */}
        <p className="pb-3.5 -mt-1 text-[10.5px] leading-relaxed text-faint md:text-right">
          We email a link to confirm, then a story when we publish. Unsubscribe
          in one click, any time. See our{" "}
          <Link
            href="/privacy"
            className="underline transition-colors duration-300 hover:text-ink"
          >
            privacy policy
          </Link>
          .
        </p>

        {/* Colophon — one line. The admin panel is intentionally unlinked:
            staff know the URL, readers don't need a door into it. */}
        <div className="py-3.5 hairline-t">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-faint text-[11px]">
            <span>
              &copy; {new Date().getFullYear()} The EWU Express &middot; East West
              University, Dhaka
            </span>
            <Link
              href="/privacy"
              className="transition-colors duration-300 hover:text-ink"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="transition-colors duration-300 hover:text-ink"
            >
              Terms
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
