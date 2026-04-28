"use client";

import Link from "next/link";
import Image from "next/image";
import { categories } from "@/lib/categories";

export function Footer() {
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
                  {cat.emoji} {cat.name}
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
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex gap-2"
            >
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-4 py-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500 text-neutral-900 dark:text-white"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity"
              >
                Subscribe
              </button>
            </form>
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
