"use client";

import { useEffect, useState } from "react";

/**
 * Newspaper-style dateline: weekday, date and city between two hairlines.
 * Rendered only after mount so the server and client markup agree (no
 * hydration mismatch from timezone-dependent date formatting).
 */
export function Dateline() {
  const [today, setToday] = useState<string | null>(null);

  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );
  }, []);

  return (
    <div className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-center">
        <span className="text-[11px] sm:text-xs font-medium tracking-[0.18em] uppercase text-neutral-500 dark:text-neutral-400">
          {today ?? "\u00A0"}
        </span>
      </div>
    </div>
  );
}
