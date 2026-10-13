"use client";

import { Badge, Button, Checkbox } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Recurrence, Task } from "@/lib/types";
import { RECURRENCE_LABELS, describeDue, formatMinutes } from "./labels";
import { TaskTimer } from "./task-timer";

interface TaskRowProps {
  task: Task;
  /** "YYYY-MM-DD" in local time, used for due-date wording. */
  today: string;
  /** The series rule this task repeats on, or null when it is a one-off. */
  recurrence: Recurrence | null;
  onToggle: (task: Task) => void;
  onOpen: (task: Task) => void;
  onStatusChange: (task: Task, status: Task["status"]) => void;
  onStartTimer: (task: Task) => void;
  onStopTimer: (task: Task) => void;
  onDelete: (task: Task) => void;
  onTagClick: (tag: string) => void;
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4">
      <path
        d="M4 6h12M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6m2 0-.6 9a1.5 1.5 0 0 1-1.5 1.4H8.1A1.5 1.5 0 0 1 6.6 15L6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TaskRow({
  task,
  today,
  recurrence,
  onToggle,
  onOpen,
  onStatusChange,
  onStartTimer,
  onStopTimer,
  onDelete,
  onTagClick,
}: TaskRowProps) {
  const isDone = task.status === "done";
  const due = task.dueDate ? describeDue(task.dueDate, today, isDone) : null;
  const over = task.estimateMinutes !== null && task.actualMinutes !== null;

  return (
    <li
      data-task-id={task.id}
      className={cn(
        "border-line bg-cream-50 shadow-soft ease-calm flex items-start gap-3 rounded-xl border p-3.5 transition-[border-color,box-shadow] duration-200",
        "hover:border-line-strong hover:shadow-lift",
      )}
    >
      <Checkbox
        hideLabel
        data-focus="checkbox"
        label={`Mark "${task.title}" as ${isDone ? "not done" : "done"}`}
        checked={isDone}
        onChange={() => onToggle(task)}
        className="pt-0.5"
      />

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onOpen(task)}
          data-focus="open"
          aria-haspopup="dialog"
          className={cn(
            "focus-visible:outline-clay-500 -mx-1 block max-w-full cursor-pointer rounded-md px-1 text-left text-base font-medium break-words transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2",
            isDone
              ? "text-ink-muted line-through decoration-1"
              : "text-ink hover:text-clay-700",
          )}
        >
          {task.title}
        </button>

        {task.notes && (
          <p className="text-ink-muted mt-0.5 line-clamp-1 text-sm">
            {task.notes}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
          {task.priority !== "medium" && (
            <Badge variant={task.priority === "high" ? "primary" : "ghost"}>
              {task.priority === "high" ? "High priority" : "Low priority"}
            </Badge>
          )}
          {due && (
            <span
              className={cn(
                "tabular-nums",
                due.overdue ? "text-danger font-medium" : "text-ink-muted",
              )}
            >
              {due.overdue ? "Overdue · " : "Due "}
              {due.label}
            </span>
          )}
          {(task.estimateMinutes !== null || task.actualMinutes !== null) && (
            <span
              className={cn(
                "tabular-nums",
                over
                  ? task.actualMinutes! > task.estimateMinutes!
                    ? "text-danger font-medium"
                    : "text-success font-medium"
                  : "text-ink-muted",
              )}
            >
              {task.estimateMinutes !== null &&
                `Est. ${formatMinutes(task.estimateMinutes)}`}
              {task.estimateMinutes !== null &&
                task.actualMinutes !== null &&
                " · "}
              {task.actualMinutes !== null &&
                `Spent ${formatMinutes(task.actualMinutes)}`}
              {over && (
                <span aria-hidden="true">
                  {task.actualMinutes! > task.estimateMinutes! ? " ▲" : " ▼"}
                </span>
              )}
            </span>
          )}
          {recurrence && (
            <span className="text-ink-muted">
              Repeats: {RECURRENCE_LABELS[recurrence].toLowerCase()}
            </span>
          )}
          {task.tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onTagClick(tag)}
              aria-label={`Filter by tag ${tag}`}
              className="text-ink-muted hover:text-clay-700 focus-visible:outline-clay-500 cursor-pointer rounded transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {!isDone && (
          <TaskTimer
            title={task.title}
            startedAt={task.timerStartedAt}
            onStart={() => onStartTimer(task)}
            onStop={() => onStopTimer(task)}
          />
        )}
        {task.status === "todo" && (
          <Button
            variant="ghost"
            size="sm"
            data-focus="status"
            aria-label={`Start "${task.title}"`}
            onClick={() => onStatusChange(task, "in-progress")}
          >
            Start
          </Button>
        )}
        {task.status === "in-progress" && (
          <Button
            variant="ghost"
            size="sm"
            data-focus="status"
            aria-label={`Move "${task.title}" back to to do`}
            onClick={() => onStatusChange(task, "todo")}
          >
            Pause
          </Button>
        )}
        <Button
          variant="danger-ghost"
          size="icon"
          aria-label={`Delete "${task.title}"`}
          onClick={() => onDelete(task)}
        >
          <TrashIcon />
        </Button>
      </div>
    </li>
  );
}
