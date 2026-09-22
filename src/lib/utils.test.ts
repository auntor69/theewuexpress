import { describe, expect, it } from "vitest";
import {
  isConfirmLinkExpired,
  isHardBounce,
  maskEmail,
  slugify,
  estimateReadTime,
  formatViews,
  escapeLikePattern,
} from "./utils";

/** UTC timestamp N days ago in the DB's "YYYY-MM-DD HH:MM:SS" format. */
const daysAgo = (days: number, minutes = 0) =>
  new Date(Date.now() - days * 86_400_000 - minutes * 60_000)
    .toISOString()
    .replace("T", " ")
    .slice(0, 19);

describe("isConfirmLinkExpired", () => {
  it("is false for a fresh signup", () => {
    expect(isConfirmLinkExpired(daysAgo(0, 5))).toBe(false);
  });

  it("is true past the advertised 7-day window", () => {
    expect(isConfirmLinkExpired(daysAgo(8))).toBe(true);
    expect(isConfirmLinkExpired(daysAgo(30))).toBe(true);
  });

  it("is still false just inside the window", () => {
    expect(isConfirmLinkExpired(daysAgo(6, 23 * 60))).toBe(false);
  });

  it("fails open on missing or unparseable timestamps", () => {
    expect(isConfirmLinkExpired(null)).toBe(false);
    expect(isConfirmLinkExpired(undefined)).toBe(false);
    expect(isConfirmLinkExpired("")).toBe(false);
    expect(isConfirmLinkExpired("not-a-date")).toBe(false);
  });

  it("reads the DB's bare UTC format correctly (not as local time)", () => {
    // Construct a stamp that is expired if read as UTC but would look fresh if
    // the parser treated it as local time in a UTC+/-N timezone.
    const stamp = daysAgo(8);
    expect(isConfirmLinkExpired(stamp)).toBe(true);
  });
});

describe("maskEmail", () => {
  it("keeps the first character and hides the rest", () => {
    expect(maskEmail("auntor@example.com")).toBe("a*****@example.com");
  });

  it("never reveals a very short local part", () => {
    expect(maskEmail("ab@example.com")).toBe("a**@example.com");
    expect(maskEmail("a@example.com")).toBe("a**@example.com");
  });

  it("returns non-emails untouched", () => {
    expect(maskEmail("not-an-email")).toBe("not-an-email");
  });
});

describe("isHardBounce", () => {
  it("recognises the standard 'no such user' rejections", () => {
    expect(isHardBounce("550 5.1.1 The email account that you tried to reach does not exist")).toBe(true);
    expect(isHardBounce("Recipient address rejected: User unknown in virtual mailbox table")).toBe(true);
    expect(isHardBounce("553 5.1.8 unknown recipient")).toBe(true);
    expect(isHardBounce("user not found")).toBe(true);
    expect(isHardBounce("Invalid recipient")).toBe(true);
    expect(isHardBounce("Bad destination mailbox address")).toBe(true);
  });

  it("recognises the raw status codes 5.1.0 / 5.1.1", () => {
    expect(isHardBounce("550 5.1.0 <x@y> recipient rejected")).toBe(true);
  });

  it("never classifies transient or infra errors as bounces", () => {
    expect(isHardBounce("Connection timeout after 10000ms")).toBe(false);
    expect(isHardBounce("Gmail: 421 Try again later")).toBe(false);
    expect(isHardBounce("Daily user sending quota exceeded")).toBe(false);
    expect(isHardBounce("452 4.2.2 The email account that you tried to reach is over quota")).toBe(false);
    expect(isHardBounce("getaddrinfo ENOTFOUND smtp.gmail.com")).toBe(false);
    expect(isHardBounce("535 5.7.8 Username and Password not accepted")).toBe(false);
    expect(isHardBounce(null)).toBe(false);
    expect(isHardBounce(undefined)).toBe(false);
    expect(isHardBounce("")).toBe(false);
  });
});

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Hello World of EWU!")).toBe("hello-world-of-ewu");
  });

  it("collapses runs of separators", () => {
    expect(slugify("a   --  b")).toBe("a-b");
  });

  it("strips leading and trailing separators", () => {
    expect(slugify("--hello world--")).toBe("hello-world");
  });

  it("drops non-latin scripts entirely", () => {
    expect(slugify("বাংলা news")).toBe("news");
  });
});

describe("estimateReadTime", () => {
  it("counts roughly 200 words per minute and never returns 0", () => {
    const words = Array.from({ length: 450 }, (_, i) => `w${i}`).join(" ");
    expect(estimateReadTime(words)).toBe(3);
    expect(estimateReadTime("<p>tiny</p>")).toBe(1);
  });
});

describe("formatViews", () => {
  it("formats thousands and millions", () => {
    expect(formatViews(999)).toBe("999");
    expect(formatViews(4200)).toBe("4.2K");
    expect(formatViews(2_500_000)).toBe("2.5M");
  });
});

describe("escapeLikePattern", () => {
  it("escapes LIKE metacharacters so user input cannot widen a search", () => {
    expect(escapeLikePattern("100% _a\\b")).toBe("100\\% \\_a\\\\b");
  });
});
