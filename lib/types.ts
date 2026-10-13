export const TASK_STATUSES = ["todo", "in-progress", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "medium", "high"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

/**
 * Recurrence is a property of a series (a `TaskTemplate`), never of an
 * individual task. There is no "none": a task without a series simply has
 * `seriesId === null`.
 */
export const RECURRENCES = ["daily", "weekdays"] as const;
export type Recurrence = (typeof RECURRENCES)[number];

export interface Task {
  id: string;
  title: string;
  notes: string;
  status: TaskStatus;
  /** ISO 8601 timestamps (UTC). */
  createdAt: string;
  updatedAt: string;
  /** Set when status becomes "done", cleared when it leaves "done". */
  completedAt: string | null;
  /** Calendar date in the user's local time, "YYYY-MM-DD". */
  dueDate: string | null;
  priority: TaskPriority;
  /** Lowercase, trimmed, de-duplicated. */
  tags: string[];
  estimateMinutes: number | null;
  actualMinutes: number | null;
  /** ISO timestamp while a timer is running, else null. */
  timerStartedAt: string | null;
  /** The recurring series this instance was generated from, or null. */
  seriesId: string | null;
  /**
   * The calendar day ("YYYY-MM-DD", local time) this instance represents.
   * A task is unique within its series by (seriesId, instanceDate).
   */
  instanceDate: string | null;
}

/** A recurring series. Instances reference it by `seriesId`. */
export interface TaskTemplate {
  id: string;
  title: string;
  notes: string;
  priority: TaskPriority;
  tags: string[];
  estimateMinutes: number | null;
  recurrence: Recurrence;
  /** Inactive series stop generating new instances but keep their history. */
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** The fields a caller may set when creating a task. */
export type NewTask = Partial<
  Pick<
    Task,
    | "title"
    | "notes"
    | "status"
    | "dueDate"
    | "priority"
    | "tags"
    | "estimateMinutes"
    | "actualMinutes"
    | "seriesId"
    | "instanceDate"
  >
> &
  Pick<Task, "title">;

/** The fields a caller may change on an existing task. */
export type TaskPatch = Partial<
  Pick<
    Task,
    | "title"
    | "notes"
    | "status"
    | "dueDate"
    | "priority"
    | "tags"
    | "estimateMinutes"
    | "actualMinutes"
  >
>;

/** The fields a caller may set when creating a series. */
export type NewTemplate = Partial<
  Omit<TaskTemplate, "id" | "createdAt" | "updatedAt">
> &
  Pick<TaskTemplate, "title" | "recurrence">;

/** The fields a caller may change on an existing series. */
export type TemplatePatch = Partial<
  Omit<TaskTemplate, "id" | "createdAt" | "updatedAt">
>;

export interface Settings {
  /** Target focused hours for a day. */
  dailyCapacityHours: number;
}

/** What is written to localStorage. */
export interface PersistedState {
  version: number;
  tasks: Task[];
  templates: TaskTemplate[];
  /** End-of-day journal, keyed by "YYYY-MM-DD". */
  journal: Record<string, string>;
  settings: Settings;
}

export type StatusFilter = "all" | TaskStatus;

export interface TaskFilters {
  status: StatusFilter;
  /** Lowercase tag, or null for any. */
  tag: string | null;
  query: string;
}
