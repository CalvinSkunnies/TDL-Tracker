"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { clearFailures, isLockedOut, recordFailure } from "@/lib/login-throttle";
import { passphraseMatches } from "@/lib/passphrase";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  SESSION_MAX_AGE_SECONDS,
  authConfigProblem,
  createSessionToken,
  isAuthConfigured,
} from "@/lib/session";

export type LoginState = { error: string } | null;

/** Slows down guessing; every wrong attempt costs the same wait. */
const FAILED_ATTEMPT_DELAY_MS = 700;

/** Best-effort client identity for the lockout (see lib/login-throttle.ts). */
async function clientKey(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown"
  );
}

/** Only same-site relative paths, to avoid open redirects. */
function safeRedirectTarget(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "/tdl/tracker";
  const ok =
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/\\") &&
    !value.startsWith("/tdl/login");
  return ok ? value : "/tdl/tracker";
}

export async function login(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  if (!isAuthConfigured()) {
    // Server-side only: names the missing env var without revealing any value.
    console.error(`[auth] sign-in unavailable: ${authConfigProblem()}`);
    return { error: "Sign-in isn't configured on this server yet." };
  }

  const key = await clientKey();
  const lockedForMs = isLockedOut(key);
  if (lockedForMs > 0) {
    const minutes = Math.ceil(lockedForMs / 60_000);
    return {
      error: `Too many attempts. Please wait about ${minutes} minute${
        minutes === 1 ? "" : "s"
      } and try again.`,
    };
  }

  const input = formData.get("passphrase");
  if (typeof input !== "string" || !passphraseMatches(input)) {
    recordFailure(key);
    await new Promise((resolve) =>
      setTimeout(resolve, FAILED_ATTEMPT_DELAY_MS),
    );
    return { error: "That passphrase isn't right. Please try again." };
  }

  clearFailures(key);

  const token = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  redirect(safeRedirectTarget(formData.get("next")));
}

export async function logout() {
  const cookieStore = await cookies();
  // Re-set with the same attributes and maxAge 0: a __Host- cookie must keep
  // Secure and Path=/ even when it is being expired.
  cookieStore.set(SESSION_COOKIE, "", { ...SESSION_COOKIE_OPTIONS, maxAge: 0 });
  redirect("/tdl/login");
}
