import {
  DEFAULT_CAPACITY_HOURS,
  MAX_MINUTES,
  applyPatch,
  applyTemplatePatch,
  buildInstanceFromTemplate,
  createTask,
  createTemplate,
  fallsOn,
  newId,
  normalizeJournal,
  normalizeSettings,
  normalizeTask,
  normalizeTemplate,
  templateFieldsFromTask,
  toDateString,
} from "./tasks";
import type {
  NewTask,
  PersistedState,
  Recurrence,
  Settings,
  Task,
  TaskPatch,
  TaskTemplate,
  TemplatePatch,
} from "./types";

/**
 * Task storage: everything lives in the browser's localStorage under one key.
 * No network calls anywhere.
 *
 * Shape on disk:
 *   { version, tasks: Task[], templates: TaskTemplate[],
 *     journal: Record<string, string>, settings: Settings }
 *
 * To change the shape later: bump SCHEMA_VERSION and add a migration keyed by
 * the version it upgrades FROM (see `migrations`).
 */

export const STORAGE_KEY = "tdl-tracker:data";
const BACKUP_KEY = `${STORAGE_KEY}:backup`;
export const SCHEMA_VERSION = 2;

type RawState = {
  version: number;
  tasks: unknown[];
  templates?: unknown[];
  journal?: unknown;
  settings?: unknown;
};
type Migration = (state: RawState) => RawState;

const migrations: Record<number, Migration> = {
  // v0 was a bare array of tasks with no version field.
  0: (state) => ({ ...state, version: 1 }),
  // v1 → v2: recurrence moved off tasks and into series (templates).
  1: (state) => {
    const now = new Date().toISOString();
    const today = toDateString(new Date());
    const templates: unknown[] = Array.isArray(state.templates)
      ? [...state.templates]
      : [];

    const tasks = state.tasks.map((raw) => {
      if (typeof raw !== "object" || raw === null) return raw;
      const r = { ...(raw as Record<string, unknown>) };
      const recurrence = r.recurrence;
      const recurring = recurrence === "daily" || recurrence === "weekdays";

      delete r.isRecurring;
      delete r.recurrence;

      if (!recurring) {
        return { ...r, seriesId: null, instanceDate: null, timerStartedAt: null };
      }

      const templateId = newId();
      templates.push({
        id: templateId,
        title: typeof r.title === "string" ? r.title : "Untitled",
        notes: typeof r.notes === "string" ? r.notes : "",
        priority: typeof r.priority === "string" ? r.priority : "medium",
        tags: Array.isArray(r.tags) ? r.tags : [],
        estimateMinutes:
          typeof r.estimateMinutes === "number" ? r.estimateMinutes : null,
        recurrence,
        active: true,
        createdAt: typeof r.createdAt === "string" ? r.createdAt : now,
        updatedAt: now,
      });

      return {
        ...r,
        seriesId: templateId,
        instanceDate:
          typeof r.dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.dueDate)
            ? r.dueDate
            : today,
        timerStartedAt: null,
      };
    });

    return {
      version: 2,
      tasks,
      templates,
      journal: state.journal ?? {},
      settings: state.settings ?? { dailyCapacityHours: DEFAULT_CAPACITY_HOURS },
    };
  },
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
  return {
    version: SCHEMA_VERSION,
    tasks: [],
    templates: [],
    journal: {},
    settings: { dailyCapacityHours: DEFAULT_CAPACITY_HOURS },
  };
}

/** Runs every migration from the stored version up to SCHEMA_VERSION. */
export function migrate(parsed: unknown): RawState | null {
  let state: RawState | null = null;
  if (Array.isArray(parsed)) {
    state = { version: 0, tasks: parsed };
  } else if (typeof parsed === "object" && parsed !== null) {
    const p = parsed as Record<string, unknown>;
    if (typeof p.version === "number" && Array.isArray(p.tasks)) {
      state = {
        version: p.version,
        tasks: p.tasks,
        templates: Array.isArray(p.templates) ? p.templates : undefined,
        journal: p.journal,
        settings: p.settings,
      };
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
  const templates = Array.isArray(migrated.templates)
    ? migrated.templates
        .map(normalizeTemplate)
        .filter((template): template is TaskTemplate => template !== null)
    : [];

  return {
    state: {
      version: SCHEMA_VERSION,
      tasks,
      templates,
      journal: normalizeJournal(migrated.journal),
      settings: normalizeSettings(migrated.settings),
    },
    problem: null,
  };
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
  templates: TaskTemplate[];
  journal: Record<string, string>;
  settings: Settings;
  problem: StorageProblem | null;
}

let snapshot: StoreSnapshot | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function readFromStorage(): StoreSnapshot {
  const { state, problem } = loadState();
  return {
    tasks: state.tasks,
    templates: state.templates,
    journal: state.journal,
    settings: state.settings,
    problem,
  };
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

function currentState(): PersistedState {
  const s = getSnapshot();
  return {
    version: SCHEMA_VERSION,
    tasks: s.tasks,
    templates: s.templates,
    journal: s.journal,
    settings: s.settings,
  };
}

function commit(state: PersistedState) {
  const saved = saveState(state);
  // Keep working in memory even if the write failed, but tell the UI.
  snapshot = {
    tasks: state.tasks,
    templates: state.templates,
    journal: state.journal,
    settings: state.settings,
    problem: saved ? null : "save-failed",
  };
  emit();
}

/* ------------------------------------------------------------------ */
/* Timers                                                               */
/* ------------------------------------------------------------------ */

/** Adds the time elapsed since `timerStartedAt` and stops the timer. */
function accumulate(task: Task, nowIso: string): Task {
  if (!task.timerStartedAt) return task;
  const started = Date.parse(task.timerStartedAt);
  if (Number.isNaN(started)) return { ...task, timerStartedAt: null };
  const elapsedMs = Math.max(0, Date.parse(nowIso) - started);
  const addedMinutes = Math.round(elapsedMs / 60_000);
  const base = task.actualMinutes ?? 0;
  return {
    ...task,
    actualMinutes: Math.min(base + addedMinutes, MAX_MINUTES),
    timerStartedAt: null,
    updatedAt: nowIso,
  };
}

function patchTask(id: string, update: (task: Task) => Task): Task | null {
  const state = currentState();
  const found = state.tasks.find((task) => task.id === id);
  if (!found) return null;
  const updated = update(found);
  commit({
    ...state,
    tasks: state.tasks.map((task) => (task.id === id ? updated : task)),
  });
  return updated;
}

/* ------------------------------------------------------------------ */
/* Series generation (idempotent)                                       */
/* ------------------------------------------------------------------ */

/**
 * Creates today's instance for every active series that falls on today.
 * Safe to call repeatedly: an instance is unique by (seriesId, instanceDate),
 * so a second call is a no-op. Never backfills past days.
 */
export function generateToday(): number {
  const state = currentState();
  const today = toDateString(new Date());
  const created: Task[] = [];

  for (const template of state.templates) {
    if (!template.active) continue;
    if (!fallsOn(template.recurrence, today)) continue;
    const exists = state.tasks.some(
      (task) => task.seriesId === template.id && task.instanceDate === today,
    );
    if (exists) continue;
    const instance = buildInstanceFromTemplate(template, today);
    if (instance) created.push(instance);
  }

  if (created.length === 0) return 0;
  commit({ ...state, tasks: [...created, ...state.tasks] });
  return created.length;
}

/* ------------------------------------------------------------------ */
/* CRUD                                                                 */
/* ------------------------------------------------------------------ */

/** Returns the new task, or null when the title is empty. */
export function addTask(input: NewTask): Task | null {
  const task = createTask(input);
  if (!task) return null;
  const state = currentState();
  commit({ ...state, tasks: [task, ...state.tasks] });
  return task;
}

export interface SaveOptions {
  /** When present, sets or clears the task's series. */
  recurrence?: { enabled: boolean; rule: Recurrence };
  /** "future" also updates the series definition for future instances. */
  scope?: "this" | "future";
}

/**
 * Saves edits to a task, creating/converting/removing its series as needed.
 * Recurrence lives on the series, so enabling "Repeats" creates a template and
 * links this task as its first instance; disabling it detaches and deactivates.
 */
export function saveTask(
  id: string,
  patch: TaskPatch,
  options: SaveOptions = {},
): Task | null {
  const state = currentState();
  const current = state.tasks.find((task) => task.id === id);
  if (!current) return null;

  const stamp = new Date().toISOString();
  let task = applyPatch(current, patch);
  let templates = state.templates;
  const scope = options.scope ?? "this";
  const recurrence = options.recurrence;

  if (recurrence) {
    if (recurrence.enabled) {
      if (task.seriesId) {
        const existing = templates.find((t) => t.id === task.seriesId);
        if (existing) {
          const templatePatch: TemplatePatch = { recurrence: recurrence.rule };
          if (scope === "future") {
            Object.assign(templatePatch, templateFieldsFromTask(task));
          }
          templates = templates.map((t) =>
            t.id === existing.id ? applyTemplatePatch(t, templatePatch) : t,
          );
        } else {
          const created = createTemplate({
            ...templateFieldsFromTask(task),
            recurrence: recurrence.rule,
          });
          if (created) {
            templates = [...templates, created];
            task = {
              ...task,
              seriesId: created.id,
              instanceDate: task.instanceDate ?? task.dueDate ?? toDateString(new Date()),
            };
          }
        }
      } else {
        const created = createTemplate({
          ...templateFieldsFromTask(task),
          recurrence: recurrence.rule,
        });
        if (created) {
          templates = [...templates, created];
          task = {
            ...task,
            seriesId: created.id,
            instanceDate: task.dueDate ?? toDateString(new Date()),
          };
        }
      }
    } else if (task.seriesId) {
      templates = templates.map((t) =>
        t.id === task.seriesId ? { ...t, active: false, updatedAt: stamp } : t,
      );
      task = { ...task, seriesId: null, instanceDate: null };
    }
  } else if (scope === "future" && task.seriesId) {
    templates = templates.map((t) =>
      t.id === task.seriesId
        ? applyTemplatePatch(t, templateFieldsFromTask(task))
        : t,
    );
  }

  commit({
    ...state,
    tasks: state.tasks.map((t) => (t.id === id ? task : t)),
    templates,
  });
  return task;
}

/** Removes a single instance. Its series keeps generating. */
export function deleteTask(id: string): boolean {
  const state = currentState();
  if (!state.tasks.some((task) => task.id === id)) return false;
  commit({ ...state, tasks: state.tasks.filter((task) => task.id !== id) });
  return true;
}

/** Removes this instance and stops its series (history is kept). */
export function deleteSeries(id: string): boolean {
  const state = currentState();
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return false;
  const stamp = new Date().toISOString();
  commit({
    ...state,
    tasks: state.tasks.filter((t) => t.id !== id),
    templates: task.seriesId
      ? state.templates.map((t) =>
          t.id === task.seriesId ? { ...t, active: false, updatedAt: stamp } : t,
        )
      : state.templates,
  });
  return true;
}

/** Deactivates a series by id (kept for completeness). */
export function deactivateTemplate(id: string): boolean {
  const state = currentState();
  if (!state.templates.some((t) => t.id === id)) return false;
  const stamp = new Date().toISOString();
  commit({
    ...state,
    templates: state.templates.map((t) =>
      t.id === id ? { ...t, active: false, updatedAt: stamp } : t,
    ),
  });
  return true;
}

/** Done -> to do; anything else -> done. */
export function toggleStatus(id: string): Task | null {
  const current = getSnapshot().tasks.find((task) => task.id === id);
  if (!current) return null;
  return saveTask(id, { status: current.status === "done" ? "todo" : "done" });
}

/** Starts timing a task; any other running timer is stopped and banked first. */
export function startTimer(id: string): Task | null {
  const state = currentState();
  if (!state.tasks.some((task) => task.id === id)) return null;
  const now = new Date().toISOString();
  let tasks = state.tasks;
  if (tasks.some((t) => t.timerStartedAt && t.id !== id)) {
    tasks = tasks.map((t) =>
      t.timerStartedAt && t.id !== id ? accumulate(t, now) : t,
    );
  }
  commit({
    ...state,
    tasks: tasks.map((t) =>
      t.id === id ? { ...t, timerStartedAt: now, updatedAt: now } : t,
    ),
  });
  return getSnapshot().tasks.find((t) => t.id === id) ?? null;
}

/** Stops timing a task and banks the elapsed time. */
export function stopTimer(id: string): Task | null {
  const now = new Date().toISOString();
  return patchTask(id, (task) => accumulate(task, now));
}

/* ------------------------------------------------------------------ */
/* Settings, journal, backup                                            */
/* ------------------------------------------------------------------ */

export function setDailyCapacityHours(hours: number): void {
  const state = currentState();
  const clamped = Math.min(24, Math.max(1, Math.round(hours)));
  commit({
    ...state,
    settings: { ...state.settings, dailyCapacityHours: clamped },
  });
}

export function setJournalEntry(date: string, text: string): void {
  const state = currentState();
  const journal = { ...state.journal };
  if (text.trim() === "") delete journal[date];
  else journal[date] = text;
  commit({ ...state, journal });
}

/** Serializes everything for download. */
export function exportData(): string {
  const state = currentState();
  return JSON.stringify(state, null, 2);
}

/** Replaces all data from a backup file. Returns false on unusable input. */
export function importData(text: string): boolean {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return false;
  }
  if (typeof parsed !== "object" || parsed === null) return false;
  const p = parsed as Record<string, unknown>;
  if (!Array.isArray(p.tasks)) return false;

  const tasks = p.tasks
    .map(normalizeTask)
    .filter((task): task is Task => task !== null);
  const templates = Array.isArray(p.templates)
    ? p.templates
        .map(normalizeTemplate)
        .filter((template): template is TaskTemplate => template !== null)
    : [];

  commit({
    version: SCHEMA_VERSION,
    tasks,
    templates,
    journal: normalizeJournal(p.journal),
    settings: normalizeSettings(p.settings),
  });
  return true;
}
