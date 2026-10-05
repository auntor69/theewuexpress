import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { createAttemptThrottle } from "./loginThrottle";

/** Fake-timer harness for the per-key throttle.
 *
 * auth.ts uses MAX_FAILED_ATTEMPTS = 8 and ATTEMPT_WINDOW_MS = 5 * 60 * 1000.
 * The throttle is deliberately general, so these tests parametrize the boundary
 * to keep the 8/5-min behaviour legible without hardcoding it in every assertion.
 */
const MAX_FAILED = 8;
const WINDOW_MS = 5 * 60 * 1000;

describe("createAttemptThrottle", () => {
  let throttle: ReturnType<typeof createAttemptThrottle>;
  let now: number;

  beforeEach(() => {
    vi.useFakeTimers();
    now = 1_000_000_000_000;
    vi.setSystemTime(now);
    throttle = createAttemptThrottle(MAX_FAILED, WINDOW_MS);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not throttle before any failures", () => {
    expect(throttle.isThrottled("user:a")).toBe(false);
  });

  it("does not throttle until the boundary is crossed", () => {
    for (let i = 0; i < MAX_FAILED - 1; i += 1) {
      throttle.recordFailure("user:b");
      expect(throttle.isThrottled("user:b")).toBe(false);
    }
  });

  it(`throttles the ${MAX_FAILED}th failure onward`, () => {
    for (let i = 0; i < MAX_FAILED; i += 1) {
      throttle.recordFailure("user:c");
    }
    expect(throttle.isThrottled("user:c")).toBe(true);

    // Extra failures keep it throttled.
    throttle.recordFailure("user:c");
    expect(throttle.isThrottled("user:c")).toBe(true);
  });

  it("resets the window when enough time passes and unblocks", () => {
    for (let i = 0; i < MAX_FAILED; i += 1) {
      throttle.recordFailure("user:d");
    }
    expect(throttle.isThrottled("user:d")).toBe(true);

    // Advance past the window, then one more failure starts a fresh count.
    vi.setSystemTime(now + WINDOW_MS + 1);
    expect(throttle.isThrottled("user:d")).toBe(false);
    throttle.recordFailure("user:d");
    expect(throttle.isThrottled("user:d")).toBe(false);
  });

  it("keeps separate state per key", () => {
    for (let i = 0; i < MAX_FAILED; i += 1) {
      throttle.recordFailure("user:e");
    }
    expect(throttle.isThrottled("user:e")).toBe(true);
    expect(throttle.isThrottled("user:f")).toBe(false);
    throttle.recordFailure("user:f");
    expect(throttle.isThrottled("user:f")).toBe(false);
  });

  it("clear() unblocks a throttled key", () => {
    for (let i = 0; i < MAX_FAILED; i += 1) {
      throttle.recordFailure("user:g");
    }
    expect(throttle.isThrottled("user:g")).toBe(true);
    throttle.clear("user:g");
    expect(throttle.isThrottled("user:g")).toBe(false);
    throttle.recordFailure("user:g");
    expect(throttle.isThrottled("user:g")).toBe(false);
  });

  it("starts a fresh window from the latest failure inside the current one", () => {
    // First failure anchors the window.
    throttle.recordFailure("user:h");

    // Later failure within the window resets the anchor to that later time,
    // so the window expires relative to the most recent activity — which is
    // what avoids a burst beating a fixed timer.
    vi.setSystemTime(now + WINDOW_MS - 1000);
    throttle.recordFailure("user:h");
    expect(throttle.isThrottled("user:h")).toBe(false);

    // The window is now measured from this latest failure, not the original one.
    vi.setSystemTime(now + WINDOW_MS + 1);
    // Still within the freshly-anchored window: only 2 failures so far.
    expect(throttle.isThrottled("user:h")).toBe(false);
    for (let i = 0; i < MAX_FAILED - 2; i += 1) {
      throttle.recordFailure("user:h");
    }
    expect(throttle.isThrottled("user:h")).toBe(true);
  });
});
