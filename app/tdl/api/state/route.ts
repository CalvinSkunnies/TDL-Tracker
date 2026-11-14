import { Redis } from "@upstash/redis";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { migrate, SCHEMA_VERSION } from "@/lib/store";
import {
  normalizeJournal,
  normalizeSettings,
  normalizeTask,
  normalizeTemplate,
} from "@/lib/tasks";
import type { PersistedState, Task, TaskTemplate } from "@/lib/types";

/**
 * Remote save for the tracker, backed by Upstash Redis.
 *
 * NOTE: Vercel KV no longer exists as a product — it was sunset and its
 * stores moved to Upstash Redis. The replacement is the Upstash
 * integration from the Vercel Marketplace (Storage → Upstash), and the
 * client is @upstash/redis, not the deprecated @vercel/kv. Do not go
 * looking for a "KV" entry in Vercel Storage; there isn't one any more.
 *
 * One key holds the whole list, in exactly the same shape as localStorage
 * ({ version, tasks, templates, journal, settings }):
 *
 *   GET /tdl/api/state  -> { state: PersistedState | null }
 *   PUT /tdl/api/state  -> { ok: true }  (body: the whole PersistedState)
 *
 * Why /tdl/api/state and not /api/state:
 * the portfolio at calvinskunnies.vercel.app only rewrites /tdl/* (plus
 * /_next/* and the PWA files) to this deployment, so an /api/* route would
 * never reach here from the portfolio domain. /tdl/api/state passes
 * through that rewrite, and it is also covered by proxy.ts's auth gate.
 *
 * Auth is checked here too (defence in depth): only a request carrying a
 * valid session cookie — the same cookie the passphrase login sets — may
 * read or write. Unauthenticated requests get 401, never a redirect, so
 * the client can tell "signed out" apart from "offline".
 *
 * No expiry is ever set on the key: the list must persist, not expire.
 * Env vars (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN) are added
 * by Vercel automatically when the Upstash database is linked to this
 * project. They are server-only; never give them a NEXT_PUBLIC_ prefix.
 */

// NOTE: no `dynamic` / `runtime` segment config here. With
// `cacheComponents: true` in next.config.ts, Next 16 rejects both at build
// time. Neither is needed: the handler reads the session cookie (which
// makes the route dynamic on its own) and every response carries
// `Cache-Control: no-store`, and the default route-handler runtime is
// Node.js already.

/** The single Redis key for this (single-user) tracker. */
const KV_KEY = "tdl-tracker:data";

/** Refuse absurd payloads before they reach Redis (a normal list is kilobytes). */
const MAX_STATE_BYTES = 1_000_000;

/**
 * Built lazily inside the handlers (not at module level): Redis.fromEnv()
 * throws when the env vars are missing, and that must surface as a 503
 * from the handler — not as a crash while the route module loads.
 * Reads UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN from the env.
 */
function getRedis(): Redis {
  return Redis.fromEnv();
}

function noStore(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

async function isSignedIn(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

/** Validate + normalize untrusted JSON into a PersistedState, or null. */
function toPersistedState(body: unknown): PersistedState | null {
  const migrated = migrate(body);
  if (!migrated) return null;

  const tasks = migrated.tasks
    .map(normalizeTask)
    .filter((task): task is Task => task !== null);
  const templates = Array.isArray(migrated.templates)
    ? migrated.templates
        .map(normalizeTemplate)
        .filter((template): template is TaskTemplate => template !== null)
    : [];

  return {
    version: SCHEMA_VERSION,
    tasks,
    templates,
    journal: normalizeJournal(migrated.journal),
    settings: normalizeSettings(migrated.settings),
  };
}

export async function GET() {
  if (!(await isSignedIn())) {
    return noStore({ error: "unauthorized" }, 401);
  }

  try {
    const state = await getRedis().get<PersistedState>(KV_KEY);
    if (!state) return noStore({ state: null });
    // Light check only: the value was fully validated when it was written.
    if (typeof state !== "object" || !Array.isArray(state.tasks)) {
      return noStore({ error: "stored data is unreadable" }, 500);
    }
    return noStore({ state });
  } catch (error) {
    console.error("[redis] GET failed:", error);
    return noStore({ error: "remote storage is not available" }, 503);
  }
}

export async function PUT(request: NextRequest) {
  if (!(await isSignedIn())) {
    return noStore({ error: "unauthorized" }, 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noStore({ error: "body must be JSON" }, 400);
  }

  const state = toPersistedState(body);
  if (!state) {
    return noStore({ error: "body is not a valid tracker state" }, 400);
  }

  if (JSON.stringify(state).length > MAX_STATE_BYTES) {
    return noStore({ error: "state is too large" }, 413);
  }

  try {
    await getRedis().set(KV_KEY, state);
    return noStore({ ok: true, version: SCHEMA_VERSION });
  } catch (error) {
    console.error("[redis] PUT failed:", error);
    return noStore({ error: "remote storage is not available" }, 503);
  }
}
