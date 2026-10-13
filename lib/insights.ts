import { parseDateString, toDateString } from "./tasks";
import type { Settings, Task } from "./types";

/**
 * Derived statistics for the insights dashboard. Everything here is pure and
 * synchronous, so it can run inside a single `useMemo` per render.
 *
 * The tracker has no per-day history beyond what a task records, so each
 * metric picks a defensible "day" for a task:
 *   - a task's *scheduled* day  = dueDate ?? instanceDate ?? creation day
 *   - a task's *completion* day = the local day of completedAt
 *   - a task's *logged* day     = the local day of updatedAt (when it last moved)
 */

const WEEKDAY = new Intl.DateTimeFormat(undefined, { weekday: "short" });
const MONTH_DAY = new Intl.DateTimeFormat(undefined, {
  month: "numeric",
  day: "numeric",
});

function addDays(date: string, delta: number): string {
  const d = parseDateString(date);
  return toDateString(new Date(d.getFullYear(), d.getMonth(), d.getDate() + delta));
}

function localDayOf(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : toDateString(d);
}

/** The day a task is scheduled for. */
export function scheduledDay(task: Task): string {
  if (task.dueDate) return task.dueDate;
  if (task.instanceDate) return task.instanceDate;
  return localDayOf(task.createdAt);
}

/** The day a task was completed, or "" when it is not done. */
export function completionDay(task: Task): string {
  return task.status === "done" ? localDayOf(task.completedAt) : "";
}

/** The day a task last changed (used to bucket logged time). */
export function loggedDay(task: Task): string {
  return localDayOf(task.updatedAt || task.createdAt);
}

export interface InsightPoint {
  date: string;
  label: string;
}

export interface Insights {
  days: number;
  points: InsightPoint[];
  /** Fraction of tasks scheduled in the window that are done. */
  completion: { rate: number | null; completed: number; total: number };
  /** Minutes logged per day, aligned with `points`. */
  focusByDay: number[];
  /** Minutes estimated vs actually spent, per completion day. */
  estimateByDay: number[];
  actualByDay: number[];
  totalFocusMinutes: number;
  estimateTotal: number;
  actualTotal: number;
  /** Consecutive days (ending today or yesterday) with at least one completion. */
  streak: number;
  /** Days in the window where planned time exceeded capacity. */
  overloadDays: number;
  plannedByDay: number[];
}

export function buildInsights(
  tasks: Task[],
  settings: Settings,
  days: number,
  today: string,
): Insights {
  const start = addDays(today, -(days - 1));
  const points: InsightPoint[] = [];
  const index = new Map<string, number>();
  for (let i = 0; i < days; i += 1) {
    const date = addDays(start, i);
    index.set(date, i);
    points.push({
      date,
      label:
        days <= 7
          ? WEEKDAY.format(parseDateString(date))
          : MONTH_DAY.format(parseDateString(date)),
    });
  }

  const focusByDay = new Array<number>(days).fill(0);
  const estimateByDay = new Array<number>(days).fill(0);
  const actualByDay = new Array<number>(days).fill(0);
  const plannedByDay = new Array<number>(days).fill(0);

  let completed = 0;
  let total = 0;

  for (const task of tasks) {
    const scheduled = scheduledDay(task);
    if (scheduled && scheduled >= start && scheduled <= today) {
      total += 1;
      if (task.status === "done") completed += 1;
    }

    const planned = scheduled ? index.get(scheduled) : undefined;
    if (planned !== undefined) {
      plannedByDay[planned] += task.estimateMinutes ?? 0;
    }

    const logged = loggedDay(task);
    const loggedIndex = logged ? index.get(logged) : undefined;
    if (loggedIndex !== undefined && task.actualMinutes) {
      focusByDay[loggedIndex] += task.actualMinutes;
    }

    const done = completionDay(task);
    const doneIndex = done ? index.get(done) : undefined;
    if (doneIndex !== undefined) {
      estimateByDay[doneIndex] += task.estimateMinutes ?? 0;
      actualByDay[doneIndex] += task.actualMinutes ?? 0;
    }
  }

  const estimateTotal = estimateByDay.reduce((sum, value) => sum + value, 0);
  const actualTotal = actualByDay.reduce((sum, value) => sum + value, 0);
  const totalFocusMinutes = focusByDay.reduce((sum, value) => sum + value, 0);

  const completionDays = new Set<string>();
  for (const task of tasks) {
    const done = completionDay(task);
    if (done) completionDays.add(done);
  }
  let streak = 0;
  let cursor = completionDays.has(today) ? today : addDays(today, -1);
  while (completionDays.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  const capacityMinutes = Math.max(1, settings.dailyCapacityHours) * 60;
  let overloadDays = 0;
  for (const planned of plannedByDay) {
    if (planned > capacityMinutes) overloadDays += 1;
  }

  return {
    days,
    points,
    completion: {
      rate: total === 0 ? null : completed / total,
      completed,
      total,
    },
    focusByDay,
    estimateByDay,
    actualByDay,
    plannedByDay,
    totalFocusMinutes,
    estimateTotal,
    actualTotal,
    streak,
    overloadDays,
  };
}
