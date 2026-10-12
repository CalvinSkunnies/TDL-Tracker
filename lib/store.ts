import {
  applyPatch,
  createTask,
  nextDueDate,
  normalizeTask,
  toDateString,
} from "./tasks";
import type { NewTask, PersistedState, Task, TaskPatch } from "./types";

/**
 * Task storage: everything lives in the browser's localStorage under one key.
 * No network calls anywhere.
 *
 * Shape on disk: { version: number, tasks: Task[] }.
 * To change the shape later: bump SCHEMA_VERSION and add a migration keyed by
 * the version it upgrades FROM (see `migrations`).
 */

export const STORAGE_KEY = "tdl-tracker:data";
const BACKUP_KEY = `${STORAGE_KEY}:backup`;
export const SCHEMA_VERSION = 1;

type RawState = { version: number; tasks: unknown[] };
type Migration = (state: RawState) => RawState;

const migrations: Record<number, Migration> = {
  // v0 was a bare array of tasks with no version field.
  0: (state) => ({ ...state, version: 1 }),
  // 1: (state) => ({ ...state, version: 2, tasks: state.tasks.map(...) }),
};

/* ------------------------------------------------------------------ */
/* Load / save (SSR-safe)                                               */
/* ------------------------------------------------------------------ */

/** localStorage, or null on the server or when the browser blocks it. */
function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null; // e.g. blocked by privacy settings
  }
}

function emptyState(): PersistedState {
  return { version: SCHEMA_VERSION, tasks: [] };
}

/** Runs every migration from the stored version up to SCHEMA_VERSION. */
export function migrate(parsed: unknown): RawState | null {
  let state: RawState | null = null;
  if (Array.isArray(parsed)) {
    state = { version: 0, tasks: parsed };
  } else if (typeof parsed === "object" && parsed !== null) {
    const p = parsed as Record<string, unknown>;
    if (typeof p.version === "number" && Array.isArray(p.tasks)) {
      state = { version: p.version, tasks: p.tasks };
    }
  }
  if (!state) return null;

  while (state.version < SCHEMA_VERSION) {
    const step: Migration | undefined = migrations[state.version];
    if (!step) return null;
    state = step(state);
  }
  return state;
}

export type LoadResult = {
  state: PersistedState;
  problem: StorageProblem | null;
};

export type StorageProblem = "unavailable" | "corrupt" | "save-failed";

export function loadState(): LoadResult {
  const storage = getStorage();
  if (!storage) return { state: emptyState(), problem: "unavailable" };

  let text: string | null;
  try {
    text = storage.getItem(STORAGE_KEY);
  } catch {
    return { state: emptyState(), problem: "unavailable" };
  }
  if (text === null) return { state: emptyState(), problem: null };

  let migrated: RawState | null = null;
  try {
    migrated = migrate(JSON.parse(text));
  } catch {
    migrated = null;
  }

  if (!migrated) {
    // Unreadable. Keep a copy rather than silently destroying the data.
    try {
      storage.setItem(BACKUP_KEY, text);
    } catch {
      /* nothing more we can do */
    }
    return { state: emptyState(), problem: "corrupt" };
  }

  if (migrated.version > SCHEMA_VERSION) {
    // Written by a newer version of the app: back it up before touching it.
    try {
      storage.setItem(BACKUP_KEY, text);
    } catch {
      /* ignore */
    }
  }

  const tasks = migrated.tasks
    .map(normalizeTask)
    .filter((task): task is Task => task !== null);
  return { state: { version: SCHEMA_VERSION, tasks }, problem: null };
}

/** Returns false when the browser refuses the write (quota, blocked, etc). */
export function saveState(state: PersistedState): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Observable store (for useSyncExternalStore)                          */
/* ------------------------------------------------------------------ */

export interface StoreSnapshot {
  tasks: Task[];
  problem: StorageProblem | null;
}

let snapshot: StoreSnapshot | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function readFromStorage(): StoreSnapshot {
  const { state, problem } = loadState();
  return { tasks: state.tasks, problem };
}

/** Client snapshot; loaded lazily on first read. Identity only changes on change. */
export function getSnapshot(): StoreSnapshot {
  if (snapshot === null) snapshot = readFromStorage();
  return snapshot;
}

/** On the server there is no localStorage, so the data is "not loaded yet". */
export function getServerSnapshot(): StoreSnapshot | null {
  return null;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  // Another tab changed the data: reload and re-render.
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      snapshot = readFromStorage();
      emit();
    }
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function commit(tasks: Task[]) {
  const saved = saveState({ version: SCHEMA_VERSION, tasks });
  // Keep working in memory even if the write failed, but tell the UI.
  snapshot = { tasks, problem: saved ? null : "save-failed" };
  emit();
}

/* ------------------------------------------------------------------ */
/* CRUD                                                                 */
/* ------------------------------------------------------------------ */

/** Returns the new task, or null when the title is empty. */
export function addTask(input: NewTask): Task | null {
  const task = createTask(input);
  if (!task) return null;
  commit([task, ...getSnapshot().tasks]);
  return task;
}

export function updateTask(id: string, patch: TaskPatch): Task | null {
  const { tasks } = getSnapshot();
  const current = tasks.find((task) => task.id === id);
  if (!current) return null;

  const updated = applyPatch(current, patch);
  const next = tasks.map((task) => (task.id === id ? updated : task));

  // Finishing a recurring task schedules its next occurrence.
  if (current.status !== "done" && updated.status === "done") {
    const spawned = spawnNextOccurrence(updated);
    if (spawned) next.unshift(spawned);
  }
  commit(next);
  return updated;
}

export function deleteTask(id: string): boolean {
  const { tasks } = getSnapshot();
  if (!tasks.some((task) => task.id === id)) return false;
  commit(tasks.filter((task) => task.id !== id));
  return true;
}

/** Done -> to do; anything else -> done. */
export function toggleStatus(id: string): Task | null {
  const current = getSnapshot().tasks.find((task) => task.id === id);
  if (!current) return null;
  return updateTask(id, {
    status: current.status === "done" ? "todo" : "done",
  });
}

function spawnNextOccurrence(finished: Task): Task | null {
  if (!finished.isRecurring) return null;
  const today = toDateString(new Date());
  return createTask({
    title: finished.title,
    notes: finished.notes,
    priority: finished.priority,
    tags: finished.tags,
    estimateMinutes: finished.estimateMinutes,
    isRecurring: true,
    recurrence: finished.recurrence,
    dueDate: nextDueDate(finished.recurrence, finished.dueDate, today),
  });
}
