"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { categories } from "@/lib/categories";
import { Check, Loader2 } from "lucide-react";

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
    <footer className="bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image src="/logo.png" alt="EWU Express" width={32} height={32} className="rounded-lg" />
              <span className="font-black text-lg tracking-tight">
                THE EWU EXPRESS
              </span>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
              The voice of East West University. Raw stories, real talk, campus
              culture — unfiltered.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-neutral-500">
              Categories
            </h3>
            <div className="flex flex-col gap-2">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors text-sm"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-neutral-500">
              Newsletter
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-4">
              Get the best stories delivered to your inbox.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status !== "idle") setStatus("idle");
                }}
                placeholder="your@email.com"
                disabled={status === "loading"}
                className="flex-1 min-w-0 px-4 py-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500 text-neutral-900 dark:text-white disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="px-4 py-2 bg-[#ffdb57] rounded-lg text-sm font-bold text-black hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-1.5 flex-shrink-0"
              >
                {status === "loading" ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : status === "success" ? (
                  <Check size={14} />
                ) : null}
                {status === "success" ? "Done" : "Subscribe"}
              </button>
            </form>
            {message && (
              <p
                className={`text-xs mt-2 ${
                  status === "error"
                    ? "text-red-500"
                    : "text-green-600 dark:text-green-400"
                }`}
              >
                {message}
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-neutral-300 dark:border-neutral-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-neutral-500 text-xs">
            &copy; {new Date().getFullYear()} The EWU Express. All rights
            reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/login"
              className="text-neutral-400 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-400 text-xs transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
