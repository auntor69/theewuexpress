/**
 * Lightweight in-memory throttle for credential stuffing / brute force.
 * Per-instance on serverless, but it still removes the easy "hammer the
 * login endpoint" path, and it never locks out a legitimate admin for long.
 *
 * Extracted from src/lib/auth.ts (and mirrored by the admin password route)
 * so the window/boundary logic can be unit-tested without Next.js imports.
 */
export function createAttemptThrottle(
  maxFailedAttempts: number,
  attemptWindowMs: number
) {
  const failedAttempts = new Map<string, { count: number; firstAt: number }>();

  function isThrottled(key: string): boolean {
    const entry = failedAttempts.get(key);
    if (!entry) return false;
    if (Date.now() - entry.firstAt > attemptWindowMs) {
      failedAttempts.delete(key);
      return false;
    }
    return entry.count >= maxFailedAttempts;
  }

  function recordFailure(key: string): void {
    const entry = failedAttempts.get(key);
    if (!entry || Date.now() - entry.firstAt > attemptWindowMs) {
      failedAttempts.set(key, { count: 1, firstAt: Date.now() });
      return;
    }
    // Extend the window from the latest failure so a burst inside the window
    // cannot be beaten by a fixed timer that was anchored to the first failure.
    entry.firstAt = Date.now();
    entry.count += 1;
  }

  function clear(key: string): void {
    failedAttempts.delete(key);
  }

  return { isThrottled, recordFailure, clear };
}
