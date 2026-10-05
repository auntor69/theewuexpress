import { describe, expect, it } from "vitest";
import { LEGACY_CATEGORIES, categoryOrNull } from "./categories.legacy";

describe("LEGACY_CATEGORIES", () => {
  it("lists the categories the import path remaps to NULL", () => {
    expect(LEGACY_CATEGORIES).toEqual(["confessions", "real-talk"]);
  });
});

describe("categoryOrNull", () => {
  it("passes a valid slug straight through", () => {
    expect(categoryOrNull("news")).toBe("news");
    expect(categoryOrNull("sport")).toBe("sport");
  });

  it("normalises case and surrounding whitespace for a valid slug", () => {
    expect(categoryOrNull(" NEWS ")).toBe("news");
    expect(categoryOrNull("SpoRt")).toBe("sport");
  });

  it("maps legacy categories to NULL", () => {
    expect(categoryOrNull("confessions")).toBe(null);
    expect(categoryOrNull("real-talk")).toBe(null);
    expect(categoryOrNull("CONFESSIONS")).toBe(null);
    expect(categoryOrNull("  Real-Talk  ")).toBe(null);
  });

  it("maps empty, whitespace-only and non-string values to NULL", () => {
    expect(categoryOrNull("")).toBe(null);
    expect(categoryOrNull("   ")).toBe(null);
    expect(categoryOrNull(null)).toBe(null);
    expect(categoryOrNull(undefined)).toBe(null);
    expect(categoryOrNull(42)).toBe(null);
    expect(categoryOrNull({})).toBe(null);
  });
});
