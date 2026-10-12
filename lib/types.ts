export const TASK_STATUSES = ["todo", "in-progress", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "medium", "high"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_RECURRENCES = ["none", "daily", "weekdays"] as const;
export type TaskRecurrence = (typeof TASK_RECURRENCES)[number];

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
  /** Kept in sync with `recurrence`: true exactly when recurrence !== "none". */
  isRecurring: boolean;
  recurrence: TaskRecurrence;
}

/** The fields a caller may set when creating a task. */
export type NewTask = Partial<
  Omit<Task, "id" | "createdAt" | "updatedAt" | "completedAt">
> &
  Pick<Task, "title">;

/** The fields a caller may change on an existing task. */
export type TaskPatch = Partial<
  Omit<Task, "id" | "createdAt" | "updatedAt" | "completedAt">
>;

/** What is written to localStorage. */
export interface PersistedState {
  version: number;
  tasks: Task[];
}

export type StatusFilter = "all" | TaskStatus;

export interface TaskFilters {
  status: StatusFilter;
  /** Lowercase tag, or null for any. */
  tag: string | null;
  query: string;
}
