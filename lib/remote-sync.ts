"use client";

import * as store from "./store";

/**
 * Remote sync: localStorage stays the instant, offline cache; Upstash Redis
 * (via /tdl/api/state) is the source of truth across browsers/devices.
 *
 * How it works
 * - On first load (after local data is ready) it fetches the remote list:
 *   - remote exists, local is empty          -> load the remote list.
 *   - remote exists, local has different data -> back the local copy up
 *     to `tdl-tracker:data:pre-remote-backup` in this browser, then load
 *     the remote list. Remote wins; nothing is silently destroyed.
 *   - no remote list yet, local has data      -> upload the local list.
 *   - neither has data                        -> nothing to do.
 * - After that, every local change is pushed (debounced ~1s). A push
 *   failure never touches local data: the status flips to offline/error
 *   and the next change (or coming back online) retries.
 *
 * Safety properties
 * - An empty browser can never wipe Redis: an empty local list is only ever
 *   replaced by the remote list, never uploaded over a non-empty one.
 * - The whole document is synced, last-write-wins. For one person that
 *   is fine; do not edit the list on two devices at the same moment.
 * - A running timer's `timerStartedAt` is synced as-is, so a timer
 *   started on one device looks running on the other. Stop timers
 *   before switching devices if that bothers you.
 */

export type SyncStatus = "loading" | "synced" | "syncing" | "offline" | "error";

export interface RemoteSyncOptions {
  onStatus: (status: SyncStatus) => void;
  /** Called when a remote list replaced the copy in this browser. */
  onRemoteReplacedLocal?: () => void;
}

const API_URL = "/tdl/api/state";
const PUSH_DELAY_MS = 1000;
/** Where the pre-sync browser copy is kept (see above). */
const PRE_REMOTE_BACKUP_KEY = "tdl-tracker:data:pre-remote-backup";

function isEmptyJson(json: string): boolean {
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    return (
      (!Array.isArray(parsed.tasks) || parsed.tasks.length === 0) &&
      (!Array.isArray(parsed.templates) || parsed.templates.length === 0) &&
      (typeof parsed.journal !== "object" ||
        parsed.journal === null ||
        Object.keys(parsed.journal as Record<string, unknown>).length === 0)
    );
  } catch {
    return true;
  }
}

function hasItems(json: string): boolean {
  return !isEmptyJson(json);
}

async function fetchRemoteJson(): Promise<string | null> {
  const res = await fetch(API_URL, {
    method: "GET",
    headers: { "cache-control": "no-store" },
  });
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error(`remote load failed: ${res.status}`);
  const body = (await res.json()) as { state?: unknown };
  if (body.state === null || body.state === undefined) return null;
  if (typeof body.state !== "object") throw new Error("remote data is invalid");
  return JSON.stringify(body.state);
}

/**
 * Starts syncing. Call once, after local data has loaded (isLoading === false).
 * Returns a cleanup function (unsubscribes + cancels any pending push).
 */
export function startRemoteSync(options: RemoteSyncOptions): () => void {
  const { onStatus, onRemoteReplacedLocal } = options;

  let stopped = false;
  let lastPushedJson: string | null = null;
  let applyingRemote = false;
  let pushTimer: number | null = null;
  let pendingPush = false;

  function setStatus(status: SyncStatus) {
    if (!stopped) onStatus(status);
  }

  function offlineStatus(): SyncStatus {
    return typeof navigator !== "undefined" && navigator.onLine === false
      ? "offline"
      : "error";
  }

  async function pushNow(keepalive = false): Promise<boolean> {
    const json = store.exportData();
    if (json === lastPushedJson) return true;

    setStatus("syncing");
    try {
      const res = await fetch(API_URL, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: json,
        ...(keepalive ? { keepalive: true } : {}),
      });
      if (res.status === 401) throw new Error("unauthorized");
      if (!res.ok) throw new Error(`remote save failed: ${res.status}`);
      lastPushedJson = json;
      setStatus("synced");
      return true;
    } catch {
      setStatus(offlineStatus());
      return false;
    }
  }

  function schedulePush() {
    pendingPush = true;
    if (pushTimer !== null) window.clearTimeout(pushTimer);
    pushTimer = window.setTimeout(() => {
      pushTimer = null;
      pendingPush = false;
      void pushNow();
    }, PUSH_DELAY_MS);
  }

  /** First load: reconcile local and remote, then start watching for edits. */
  async function initialSync(): Promise<void> {
    setStatus("loading");
    const localJson = store.exportData();

    let remoteJson: string | null;
    try {
      remoteJson = await fetchRemoteJson();
    } catch {
      // Redis down / not configured / signed out: keep working locally.
      lastPushedJson = localJson;
      setStatus(offlineStatus());
      return;
    }

    if (remoteJson === null) {
      // Nothing saved remotely yet: upload this browser's list (if any).
      lastPushedJson = null;
      if (hasItems(localJson)) {
        await pushNow();
      } else {
        lastPushedJson = localJson;
        setStatus("synced");
      }
      return;
    }

    if (remoteJson === localJson) {
      lastPushedJson = localJson;
      setStatus("synced");
      return;
    }

    if (isEmptyJson(localJson)) {
      // This browser is empty: just take the remote list.
      applyingRemote = true;
      try {
        if (store.importData(remoteJson)) {
          store.generateToday();
          // Force the push: lastPushedJson must not already equal the new state.
          lastPushedJson = null;
          await pushNow();
        } else {
          setStatus("error");
        }
      } finally {
        applyingRemote = false;
      }
      return;
    }

    // Both sides have data and they differ: remote wins, local is backed up.
    try {
      window.localStorage.setItem(PRE_REMOTE_BACKUP_KEY, localJson);
    } catch {
      // Backup failing must not block the sync itself.
    }
    applyingRemote = true;
    try {
      if (store.importData(remoteJson)) {
        store.generateToday();
        // Force the push: lastPushedJson must not already equal the new state.
        lastPushedJson = null;
        await pushNow();
        onRemoteReplacedLocal?.();
      } else {
        setStatus("error");
      }
    } finally {
      applyingRemote = false;
    }
  }

  // Push local edits (but not edits that came from the remote list itself).
  const unsubscribe = store.subscribe(() => {
    if (stopped || applyingRemote) return;
    schedulePush();
  });

  // Make sure the last edit survives a tab close / background switch.
  function flush() {
    if (pushTimer !== null) {
      window.clearTimeout(pushTimer);
      pushTimer = null;
    }
    if (pendingPush) {
      pendingPush = false;
      void pushNow(true);
    }
  }
  window.addEventListener("pagehide", flush);
  function onVisibilityChange() {
    if (document.visibilityState === "hidden") flush();
  }
  document.addEventListener("visibilitychange", onVisibilityChange);

  // Coming back online: retry the last failed push.
  async function onOnline() {
    if (stopped) return;
    await pushNow();
  }
  window.addEventListener("online", onOnline);

  void initialSync();

  return () => {
    stopped = true;
    unsubscribe();
    if (pushTimer !== null) window.clearTimeout(pushTimer);
    window.removeEventListener("pagehide", flush);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("online", onOnline);
  };
}
