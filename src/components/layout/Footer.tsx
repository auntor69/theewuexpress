"use client";

import { useState } from "react";
import Link from "next/link";
import { categories } from "@/lib/categories";
import { Check, Loader2, ArrowRight } from "lucide-react";

const NAVY = "#0f2a5c";

/**
 * Compact professional footer: one slim navy band with the newsletter form,
 * a tight link grid, and a single bottom line — the opposite of a tall
 * boxy dark slab. Everything centered, generous only where it matters.
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
    <footer className="mt-20">
      {/* Newsletter band — navy, slim, one row */}
      <div style={{ backgroundColor: NAVY }}>
        <div className="container-editorial py-10">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-12">
            <div className="lg:w-1/2">
              <p className="kicker">The EWU Express Weekly</p>
              <h2 className="font-display text-2xl sm:text-[1.7rem] font-semibold text-[#f5efe0] mt-1.5 leading-snug">
                The stories that matter, in your inbox every week.
              </h2>
            </div>
            <div className="lg:w-1/2">
              <form onSubmit={handleSubscribe} className="flex gap-2">
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
                  className="flex-1 min-w-0 px-4 py-3 bg-white/[0.07] border border-white/15 rounded-md text-sm text-white placeholder:text-white/40 outline-none focus:border-[#c9a227] focus:bg-white/10 transition-colors disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="px-5 py-3 bg-[#c9a227] rounded-md text-sm font-bold text-[#0f2a5c] hover:bg-[#d9b23a] transition-colors duration-300 disabled:opacity-60 flex items-center gap-1.5 flex-shrink-0"
                >
                  {status === "loading" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : status === "success" ? (
                    <Check size={14} />
                  ) : null}
                  {status === "loading"
                    ? "Subscribing…"
                    : status === "success"
                    ? "Done"
                    : "Subscribe"}
                </button>
              </form>
              {message && (
                <p
                  className={`text-xs mt-2 ${
                    status === "error" ? "text-red-300" : "text-[#c9a227]"
                  }`}
                >
                  {message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Link grid — quiet, on paper */}
      <div className="bg-surface hairline-t hairline-b">
        <div className="container-editorial py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <p className="font-display font-bold text-ink tracking-tight">
                THE EWU EXPRESS
              </p>
              <p className="text-muted text-sm leading-relaxed mt-2">
                The student news publication of East West University — campus
                heat, real stories, student voice.
              </p>
            </div>

            <div>
              <p className="kicker mb-3">Sections</p>
              <div className="flex flex-col gap-2">
                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/category/${cat.slug}`}
                    className="text-muted hover:text-[var(--accent)] transition-colors duration-300 text-sm"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="kicker mb-3">Read</p>
              <div className="flex flex-col gap-2">
                <Link
                  href="/"
                  className="text-muted hover:text-[var(--accent)] transition-colors duration-300 text-sm"
                >
                  Front page
                </Link>
                <Link
                  href="/search"
                  className="text-muted hover:text-[var(--accent)] transition-colors duration-300 text-sm"
                >
                  Search stories
                </Link>
              </div>
            </div>

            <div>
              <p className="kicker mb-3">About</p>
              <p className="text-muted text-sm leading-relaxed">
                Written by students, for students. Raw stories, real talk,
                campus culture.
              </p>
              <Link
                href="/admin/login"
                className="text-faint hover:text-[var(--accent)] transition-colors text-xs mt-3 inline-block"
              >
                Staff login
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar — one slim line */}
      <div className="bg-surface">
        <div className="container-editorial py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-faint text-xs">
            &copy; {new Date().getFullYear()} The EWU Express &middot; East West
            University, Dhaka
          </p>
          <Link
            href="/"
            className="text-faint hover:text-[var(--accent)] text-xs transition-colors inline-flex items-center gap-1"
          >
            Back to front page
            <ArrowRight size={11} className="-rotate-45" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
