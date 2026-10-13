/**
 * Tiny in-memory login lockout, keyed by client IP.
 *
 * LIMITATION: this state lives in the instance's memory. On a serverless host
 * (Vercel) a cold start resets it, and requests may land on different instances,
 * so it raises the cost of brute force rather than capping it absolutely. For a
 * hard guarantee, back it with shared storage (e.g. Vercel KV / Upstash Redis).
 */

const WINDOW_MS = 15 * 60_000; // failures are counted over 15 minutes
const LOCK_MS = 15 * 60_000; // lockout duration once tripped
const MAX_FAILURES = 5;

interface Attempt {
  count: number;
  firstAt: number;
  lockedUntil: number;
}

const attempts = new Map<string, Attempt>();

/** Milliseconds remaining on a lockout, or 0 when not locked out. */
export function isLockedOut(key: string, now = Date.now()): number {
  const record = attempts.get(key);
  if (!record) return 0;
  return record.lockedUntil > now ? record.lockedUntil - now : 0;
}

export function recordFailure(key: string, now = Date.now()): void {
  const record = attempts.get(key);
  if (!record || now - record.firstAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: now, lockedUntil: 0 });
    return;
  }
  record.count += 1;
  if (record.count >= MAX_FAILURES) {
    record.lockedUntil = now + LOCK_MS;
    record.count = 0;
    record.firstAt = now;
  }
}

export function clearFailures(key: string): void {
  attempts.delete(key);
}
