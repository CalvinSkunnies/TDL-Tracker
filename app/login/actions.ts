"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { passphraseMatches } from "@/lib/passphrase";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  isAuthConfigured,
} from "@/lib/session";

export type LoginState = { error: string } | null;

/** Slows down guessing; every wrong attempt costs the same wait. */
const FAILED_ATTEMPT_DELAY_MS = 700;

/** Only same-site relative paths, to avoid open redirects. */
function safeRedirectTarget(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "/";
  const ok =
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/\\") &&
    !value.startsWith("/login");
  return ok ? value : "/";
}

export async function login(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  if (!isAuthConfigured()) {
    return { error: "Sign-in isn't configured on this server yet." };
  }

  const input = formData.get("passphrase");
  if (typeof input !== "string" || !passphraseMatches(input)) {
    await new Promise((resolve) =>
      setTimeout(resolve, FAILED_ATTEMPT_DELAY_MS),
    );
    return { error: "That passphrase isn't right. Please try again." };
  }

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
  redirect("/login");
}
