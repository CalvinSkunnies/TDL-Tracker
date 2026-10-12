import { SignJWT, jwtVerify } from "jose";

/**
 * Stateless, signed session. The cookie holds an HS256 JWT; nothing about the
 * user is stored server-side, and the token carries no data beyond "owner".
 *
 * This file only uses Web Crypto (via jose), so it is safe in the proxy and
 * in Server Actions alike.
 */

/** `__Host-` pins the cookie to this exact host, path "/", and requires Secure. */
export const SESSION_COOKIE =
  process.env.NODE_ENV === "production" ? "__Host-session" : "session";

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true, // not readable from JavaScript
  secure: process.env.NODE_ENV === "production", // HTTPS only in production
  sameSite: "lax" as const,
  path: "/",
};

const SUBJECT = "owner";

/**
 * Signing key = AUTH_SECRET + APP_PASSPHRASE. Rotating either value
 * invalidates every existing session, so changing the passphrase also signs
 * out anyone holding an old cookie.
 */
function signingKey(): Uint8Array | null {
  const secret = process.env.AUTH_SECRET;
  const passphrase = process.env.APP_PASSPHRASE;
  if (!secret || secret.length < 32 || !passphrase) return null;
  return new TextEncoder().encode(`${secret}\u0000${passphrase}`);
}

/** False when env vars are missing or weak. Callers must fail closed. */
export function isAuthConfigured(): boolean {
  return signingKey() !== null;
}

export async function createSessionToken(): Promise<string> {
  const key = signingKey();
  if (!key) {
    throw new Error("AUTH_SECRET (32+ chars) and APP_PASSPHRASE must be set.");
  }
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(SUBJECT)
    .setIssuedAt(now)
    .setExpirationTime(now + SESSION_MAX_AGE_SECONDS)
    .sign(key);
}

/** True only for an untampered, unexpired token signed with the current key. */
export async function verifySessionToken(
  token: string | undefined | null,
): Promise<boolean> {
  if (!token) return false;
  const key = signingKey();
  if (!key) return false;
  try {
    await jwtVerify(token, key, { algorithms: ["HS256"], subject: SUBJECT });
    return true;
  } catch {
    return false;
  }
}
