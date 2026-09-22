import { describe, expect, it } from "vitest";
import { stripHtml, escapeXml, toRfc822 } from "./feed";

describe("stripHtml", () => {
  it("removes tags and collapses whitespace", () => {
    expect(stripHtml("<p>Hello</p>   <b>world</b>")).toBe("Hello world");
  });

  it("resolves the common named entities", () => {
    expect(stripHtml("Tom&nbsp;&amp;&nbsp;Jerry &lt;3 &quot;Hi&quot; &#39;bye&#39;")).toBe(
      'Tom & Jerry <3 "Hi" \'bye\''
    );
  });

  it("drops numeric entities instead of guessing", () => {
    // The entity becomes a space, then runs of whitespace collapse and trim.
    expect(stripHtml("&#8212; dash")).toBe("dash");
  });

  it("returns an empty string for markup-only input", () => {
    expect(stripHtml("<br/><hr/>")).toBe("");
  });
});

describe("escapeXml", () => {
  it("escapes the five reserved characters", () => {
    expect(escapeXml(`<a href="x">&'</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&amp;&apos;&lt;/a&gt;"
    );
  });

  it("leaves plain text untouched", () => {
    expect(escapeXml("plain text 123")).toBe("plain text 123");
  });

  it("drops control characters that are illegal in XML 1.0", () => {
    expect(escapeXml("bad\u0000\u0008\u000B\u001F okay")).toBe("bad okay");
  });

  it("keeps tabs and newlines (legal in XML, folded by readers)", () => {
    expect(escapeXml("a\tb\nc")).toBe("a\tb\nc");
  });
});

describe("toRfc822", () => {
  it("converts the DB's UTC 'YYYY-MM-DD HH:MM:SS' to RFC 822", () => {
    // 2026-09-22 10:00:00 UTC == 10:00 GMT
    expect(toRfc822("2026-09-22 10:00:00")).toMatch(/Tue, 22 Sep 2026 10:00:00 GMT/);
  });

  it("returns undefined for empty or unparseable input", () => {
    expect(toRfc822("")).toBeUndefined();
    expect(toRfc822("not-a-date")).toBeUndefined();
  });

  it("treats the input as UTC, not server-local", () => {
    // If this were parsed as local time, the result would drift by the TZ
    // offset — which is exactly the bug the 'Z' suffix prevents.
    const rfc = toRfc822("2026-01-01 00:00:00")!;
    expect(rfc.startsWith("Thu, 01 Jan 2026 00:00:00")).toBe(true);
  });
});
