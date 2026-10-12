import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Constant-time passphrase check. Both sides are hashed first so the buffers
 * are always the same length, which lets timingSafeEqual run without leaking
 * the real passphrase's length or content through timing.
 */
export function passphraseMatches(input: string): boolean {
  const expected = process.env.APP_PASSPHRASE;
  if (!expected) return false;
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}
