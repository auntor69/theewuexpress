"use client";

import { useEffect, useState } from "react";

/**
 * Newspaper-style dateline: the date in small caps between two hairlines,
 * centered like a broadsheet's folio line. Rendered only after mount so the
 * server and client markup agree (no hydration mismatch from timezones).
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
    <div className="hairline-b bg-[var(--surface)]">
      <div className="container-editorial flex items-center justify-center py-2">
        <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.24em] uppercase text-faint">
          {today ?? "\u00A0"}
        </span>
      </div>
    </div>
  );
}
