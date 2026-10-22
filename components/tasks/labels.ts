import { parseDateString } from "@/lib/tasks";
import type { Recurrence, TaskPriority, TaskStatus } from "@/lib/types";

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  "in-progress": "In progress",
  done: "Done",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const RECURRENCE_LABELS: Record<Recurrence, string> = {
  daily: "Every day",
  weekdays: "Every weekday",
};

/** 90 -> "1h 30m", 45 -> "45m", 120 -> "2h". */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

const shortDate = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});

/** "Today", "Tomorrow", "Yesterday" or "Oct 14". `overdue` ignores done tasks. */
export function describeDue(
  due: string,
  today: string,
  isDone: boolean,
): { label: string; overdue: boolean } {
  const overdue = !isDone && due < today;
  const diffDays = Math.round(
    (parseDateString(due).getTime() - parseDateString(today).getTime()) /
      86_400_000,
  );
  const label =
    diffDays === 0
      ? "Today"
      : diffDays === 1
        ? "Tomorrow"
        : diffDays === -1
          ? "Yesterday"
          : shortDate.format(parseDateString(due));
  return { label, overdue };
}

const fullDateTime = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

/** "today", "tomorrow", "yesterday" or "Oct 14" — used after "Starts". */
export function describeStart(start: string, today: string): string {
  const diffDays = Math.round(
    (parseDateString(start).getTime() - parseDateString(today).getTime()) /
      86_400_000,
  );
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays === -1) return "yesterday";
  return shortDate.format(parseDateString(start));
}

export function formatTimestamp(iso: string): string {
  return fullDateTime.format(new Date(iso));
}
