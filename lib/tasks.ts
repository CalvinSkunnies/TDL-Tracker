import {
  TASK_PRIORITIES,
  TASK_RECURRENCES,
  TASK_STATUSES,
  type NewTask,
  type Task,
  type TaskFilters,
  type TaskPatch,
  type TaskRecurrence,
  type TaskStatus,
} from "./types";

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

export const MAX_TITLE_LENGTH = 200;
export const MAX_TAG_LENGTH = 30;
export const MAX_MINUTES = 60 * 24 * 365;

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Lowercase, trimmed, de-duplicated, empty and over-long entries dropped. */
export function normalizeTags(input: readonly unknown[]): string[] {
  const seen = new Set<string>();
  for (const value of input) {
    if (typeof value !== "string") continue;
    const tag = value.trim().replace(/^#/, "").trim().toLowerCase();
    if (tag && tag.length <= MAX_TAG_LENGTH) seen.add(tag);
  }
  return [...seen];
}

/** "work, home  #errands" -> ["work", "home", "errands"]. */
export function parseTagInput(text: string): string[] {
  return normalizeTags(text.split(/[,\s]+/));
}

function minutesOrNull(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return Math.min(Math.round(value), MAX_MINUTES);
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function dueDateOrNull(value: unknown): string | null {
  return typeof value === "string" && DATE_ONLY.test(value) ? value : null;
}

function isoOr(value: unknown, fallback: string): string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value))
    ? value
    : fallback;
}

function oneOf<T extends string>(
  options: readonly T[],
  value: unknown,
  fallback: T,
): T {
  return typeof value === "string" &&
    (options as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

/* ------------------------------------------------------------------ */
/* Local calendar dates ("YYYY-MM-DD")                                  */
/* ------------------------------------------------------------------ */

export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parses as local midnight (not UTC), so dates never shift a day. */
export function parseDateString(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * The next due date for a recurring task that was just completed: the first
 * matching day after whichever is later, the old due date or today. Finishing
 * an overdue task never produces another overdue one.
 */
export function nextDueDate(
  recurrence: TaskRecurrence,
  currentDue: string | null,
  today: string,
): string | null {
  if (recurrence === "none") return null;
  const anchor = currentDue && currentDue > today ? currentDue : today;
  const next = parseDateString(anchor);
  do {
    next.setDate(next.getDate() + 1);
  } while (
    recurrence === "weekdays" &&
    (next.getDay() === 0 || next.getDay() === 6)
  );
  return toDateString(next);
}

/* ------------------------------------------------------------------ */
/* Creating, normalizing and patching tasks                             */
/* ------------------------------------------------------------------ */

/** isRecurring and recurrence must never disagree. */
function resolveRecurrence(
  current: Pick<Task, "isRecurring" | "recurrence">,
  patch: Pick<TaskPatch, "isRecurring" | "recurrence">,
): Pick<Task, "isRecurring" | "recurrence"> {
  let recurrence = patch.recurrence ?? current.recurrence;
  let isRecurring = patch.isRecurring ?? current.isRecurring;

  if (patch.isRecurring === false) recurrence = "none";
  else if (patch.recurrence && patch.recurrence !== "none") isRecurring = true;

  if (isRecurring && recurrence === "none") recurrence = "daily";
  if (!isRecurring) recurrence = "none";
  return { isRecurring, recurrence };
}

/** Builds a complete task; returns null when the title is empty. */
export function createTask(input: NewTask, now = new Date()): Task | null {
  const title = input.title.trim().slice(0, MAX_TITLE_LENGTH);
  if (!title) return null;

  const stamp = now.toISOString();
  const status = oneOf(TASK_STATUSES, input.status, "todo");
  const recurrence = resolveRecurrence(
    { isRecurring: false, recurrence: "none" },
    { isRecurring: input.isRecurring, recurrence: input.recurrence },
  );

  return {
    id: newId(),
    title,
    notes: input.notes ?? "",
    status,
    createdAt: stamp,
    updatedAt: stamp,
    completedAt: status === "done" ? stamp : null,
    dueDate: dueDateOrNull(input.dueDate),
    priority: oneOf(TASK_PRIORITIES, input.priority, "medium"),
    tags: normalizeTags(input.tags ?? []),
    estimateMinutes: minutesOrNull(input.estimateMinutes),
    actualMinutes: minutesOrNull(input.actualMinutes),
    ...recurrence,
  };
}

/** Applies a patch, keeping completedAt, recurrence and updatedAt consistent. */
export function applyPatch(
  task: Task,
  patch: TaskPatch,
  now = new Date(),
): Task {
  const stamp = now.toISOString();
  const status = oneOf(TASK_STATUSES, patch.status, task.status);
  const title = patch.title?.trim().slice(0, MAX_TITLE_LENGTH);

  return {
    ...task,
    title: title ? title : task.title,
    notes: patch.notes ?? task.notes,
    status,
    completedAt:
      status === task.status
        ? task.completedAt
        : status === "done"
          ? stamp
          : null,
    dueDate: "dueDate" in patch ? dueDateOrNull(patch.dueDate) : task.dueDate,
    priority: oneOf(TASK_PRIORITIES, patch.priority, task.priority),
    tags: patch.tags ? normalizeTags(patch.tags) : task.tags,
    estimateMinutes:
      "estimateMinutes" in patch
        ? minutesOrNull(patch.estimateMinutes)
        : task.estimateMinutes,
    actualMinutes:
      "actualMinutes" in patch
        ? minutesOrNull(patch.actualMinutes)
        : task.actualMinutes,
    ...resolveRecurrence(task, patch),
    updatedAt: stamp,
  };
}

/**
 * Coerces untrusted data (from localStorage) into a valid Task, or null when
 * it is unusable. Anything missing or malformed falls back to a safe default,
 * so one bad record never breaks the whole list.
 */
export function normalizeTask(raw: unknown): Task | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || !r.id) return null;
  if (typeof r.title !== "string" || !r.title.trim()) return null;

  const now = new Date().toISOString();
  const createdAt = isoOr(r.createdAt, now);
  const status = oneOf(TASK_STATUSES, r.status, "todo");
  const recurrence = oneOf(TASK_RECURRENCES, r.recurrence, "none");

  return {
    id: r.id,
    title: r.title.trim().slice(0, MAX_TITLE_LENGTH),
    notes: typeof r.notes === "string" ? r.notes : "",
    status,
    createdAt,
    updatedAt: isoOr(r.updatedAt, createdAt),
    completedAt:
      status === "done" ? isoOr(r.completedAt, isoOr(r.updatedAt, now)) : null,
    dueDate: dueDateOrNull(r.dueDate),
    priority: oneOf(TASK_PRIORITIES, r.priority, "medium"),
    tags: Array.isArray(r.tags) ? normalizeTags(r.tags) : [],
    estimateMinutes: minutesOrNull(r.estimateMinutes),
    actualMinutes: minutesOrNull(r.actualMinutes),
    isRecurring: recurrence !== "none",
    recurrence,
  };
}

/* ------------------------------------------------------------------ */
/* Filtering, sorting, grouping                                         */
/* ------------------------------------------------------------------ */

export const DEFAULT_FILTERS: TaskFilters = {
  status: "all",
  tag: null,
  query: "",
};

export function matchesQuery(task: Task, query: string): boolean {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack =
    `${task.title}\n${task.notes}\n${task.tags.join(" ")}`.toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

export function filterTasks(tasks: Task[], filters: TaskFilters): Task[] {
  return tasks.filter(
    (task) =>
      (filters.status === "all" || task.status === filters.status) &&
      (filters.tag === null || task.tags.includes(filters.tag)) &&
      matchesQuery(task, filters.query),
  );
}

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 } as const;

/** Open tasks: priority, then soonest due date, then oldest first. */
function compareOpen(a: Task, b: Task): number {
  return (
    PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
    (a.dueDate ?? "9999-99-99").localeCompare(b.dueDate ?? "9999-99-99") ||
    a.createdAt.localeCompare(b.createdAt)
  );
}

/** Finished tasks: most recently completed first. */
function compareDone(a: Task, b: Task): number {
  return (b.completedAt ?? "").localeCompare(a.completedAt ?? "");
}

export type GroupedTasks = Record<TaskStatus, Task[]>;

export function groupTasks(tasks: Task[]): GroupedTasks {
  const groups: GroupedTasks = { todo: [], "in-progress": [], done: [] };
  for (const task of tasks) groups[task.status].push(task);
  groups.todo.sort(compareOpen);
  groups["in-progress"].sort(compareOpen);
  groups.done.sort(compareDone);
  return groups;
}

export function collectTags(tasks: Task[]): string[] {
  const tags = new Set<string>();
  for (const task of tasks) for (const tag of task.tags) tags.add(tag);
  return [...tags].sort((a, b) => a.localeCompare(b));
}
