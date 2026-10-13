"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SaveOptions } from "@/lib/store";
import { useTasks } from "@/lib/use-tasks";
import { useToday } from "@/lib/use-today";
import type { Task, TaskPatch, TaskStatus } from "@/lib/types";
import { CapacityView } from "./capacity-view";
import { DataControls } from "./data-controls";
import { DeleteDialog } from "./delete-dialog";
import { FilterBar } from "./filter-bar";
import { Journal } from "./journal";
import { STATUS_LABELS } from "./labels";
import { QuickAdd } from "./quick-add";
import { EmptyState, LoadingState, NoResultsState } from "./states";
import { TaskEditor, type SaveScope } from "./task-editor";
import { TaskRow } from "./task-row";

const GROUP_ORDER: TaskStatus[] = ["todo", "in-progress", "done"];

const STORAGE_MESSAGES = {
  unavailable:
    "This browser is blocking local storage, so tasks can't be saved and will be lost when you leave.",
  corrupt:
    "Saved data couldn't be read, so you're starting fresh. A backup copy was kept in this browser.",
  "save-failed":
    "The latest change couldn't be saved (storage may be full). It's visible now but may be lost.",
} as const;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}

export function TasksApp() {
  const {
    tasks,
    journal,
    settings,
    isLoading,
    storageProblem,
    addTask,
    saveTask,
    deleteTask,
    deleteSeries,
    toggleStatus,
    startTimer,
    stopTimer,
    setDailyCapacityHours,
    setJournalEntry,
    exportData,
    importData,
    getTemplate,
    filters,
    setFilters,
    resetFilters,
    hasActiveFilters,
    allTags,
    groups,
    visibleTasks,
    counts,
  } = useTasks();
  const today = useToday();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [announcement, setAnnouncement] = useState("");

  /**
   * A row that changes group is re-created, which would drop keyboard focus.
   * Handlers note which control to refocus; the effect below applies it once
   * the list has re-rendered.
   */
  const pendingFocus = useRef<{
    id: string;
    target: "checkbox" | "status" | "open";
  } | null>(null);

  const quickAddRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const editing = tasks.find((task) => task.id === editingId) ?? null;
  const editingTemplate = editing ? getTemplate(editing.seriesId) : null;
  const openCount = counts.todo + counts["in-progress"];

  /** Estimate minutes for today's open work, for the capacity meter. */
  const plannedMinutes = useMemo(
    () =>
      tasks.reduce((sum, task) => {
        if (task.status === "done") return sum;
        const day = task.instanceDate ?? task.dueDate;
        if (day !== today) return sum;
        return sum + (task.estimateMinutes ?? 0);
      }, 0),
    [tasks, today],
  );

  useEffect(() => {
    const pending = pendingFocus.current;
    if (!pending) return;
    pendingFocus.current = null;
    document
      .querySelector<HTMLElement>(
        `[data-task-id="${CSS.escape(pending.id)}"] [data-focus="${pending.target}"]`,
      )
      ?.focus();
  });

  // Keyboard shortcuts: "n" = new task, "/" = search.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey) return;
      if (event.altKey || isTypingTarget(event.target)) return;
      if (document.querySelector("dialog[open]")) return;
      if (event.key === "n") {
        event.preventDefault();
        quickAddRef.current?.focus();
      } else if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function focusQuickAddSoon() {
    // After the dialog has finished closing and restoring focus.
    window.setTimeout(() => quickAddRef.current?.focus(), 50);
  }

  function handleAdd(title: string): boolean {
    const task = addTask({ title });
    if (!task) return false;
    setAnnouncement(`Added “${task.title}”.`);
    return true;
  }

  function handleToggle(task: Task) {
    const updated = toggleStatus(task.id);
    pendingFocus.current = { id: task.id, target: "checkbox" };
    if (updated) {
      setAnnouncement(
        updated.status === "done"
          ? `Completed “${task.title}”.`
          : `Reopened “${task.title}”.`,
      );
    }
  }

  function handleStatusChange(task: Task, status: TaskStatus) {
    saveTask(task.id, { status });
    pendingFocus.current = { id: task.id, target: "status" };
    setAnnouncement(`Moved “${task.title}” to ${STATUS_LABELS[status]}.`);
  }

  function handleSave(id: string, patch: TaskPatch, options: SaveOptions) {
    saveTask(id, patch, options);
    pendingFocus.current = { id, target: "open" };
    setEditingId(null);
    setAnnouncement("Task saved.");
  }

  function handleConfirmDelete(task: Task, scope: SaveScope) {
    const stopsSeries = scope === "future" && task.seriesId !== null;
    if (stopsSeries) {
      deleteSeries(task.id);
    } else {
      deleteTask(task.id);
    }
    setDeleting(null);
    setAnnouncement(
      stopsSeries
        ? `Deleted “${task.title}” and stopped the series.`
        : `Deleted “${task.title}”.`,
    );
    focusQuickAddSoon();
  }

  function requestDelete(task: Task) {
    setEditingId(null);
    setDeleting(task);
  }

  const showList = !isLoading && tasks.length > 0 && visibleTasks.length > 0;

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">
            Your tasks
          </h1>
          <p className="text-ink-muted mt-2 text-base" aria-live="off">
            {isLoading
              ? " "
              : tasks.length === 0
                ? "Nothing here yet."
                : `${openCount} open · ${counts.done} done`}
          </p>
        </div>
        {!isLoading && (
          <DataControls
            today={today}
            onExport={exportData}
            onImport={importData}
          />
        )}
      </header>

      {storageProblem && (
        <p
          role="alert"
          className="border-danger/40 bg-cream-50 text-danger mb-6 rounded-xl border px-4 py-3 text-sm"
        >
          {STORAGE_MESSAGES[storageProblem]}
        </p>
      )}

      {!isLoading && (
        <div className="mb-8">
          <CapacityView
            plannedMinutes={plannedMinutes}
            capacityHours={settings.dailyCapacityHours}
            onCapacityChange={setDailyCapacityHours}
          />
        </div>
      )}

      <QuickAdd onAdd={handleAdd} disabled={isLoading} inputRef={quickAddRef} />
      <p className="text-ink-muted mt-2 text-xs">
        Press <kbd className="font-sans font-semibold">n</kbd> to add and{" "}
        <kbd className="font-sans font-semibold">/</kbd> to search.
      </p>

      {!isLoading && tasks.length > 0 && (
        <div className="mt-8">
          <FilterBar
            filters={filters}
            counts={counts}
            tags={allTags}
            hasActiveFilters={hasActiveFilters}
            onChange={setFilters}
            onReset={resetFilters}
            searchRef={searchRef}
          />
        </div>
      )}

      <div className="mt-8">
        {isLoading ? (
          <LoadingState />
        ) : tasks.length === 0 ? (
          <EmptyState onAdd={() => quickAddRef.current?.focus()} />
        ) : visibleTasks.length === 0 ? (
          <NoResultsState onClear={resetFilters} />
        ) : null}

        {showList && (
          <div className="flex flex-col gap-9">
            {GROUP_ORDER.filter((status) => groups[status].length > 0).map(
              (status) => (
                <section key={status} aria-labelledby={`group-${status}`}>
                  <h2
                    id={`group-${status}`}
                    className="font-display mb-3 flex items-baseline gap-2 text-xl font-medium tracking-tight"
                  >
                    {STATUS_LABELS[status]}
                    <span className="text-ink-muted font-sans text-sm tabular-nums">
                      {groups[status].length}
                    </span>
                  </h2>
                  <ul className="flex flex-col gap-2.5">
                    {groups[status].map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        today={today}
                        recurrence={
                          task.seriesId
                            ? (getTemplate(task.seriesId)?.recurrence ?? null)
                            : null
                        }
                        onToggle={handleToggle}
                        onOpen={(t) => setEditingId(t.id)}
                        onStatusChange={handleStatusChange}
                        onStartTimer={(t) => startTimer(t.id)}
                        onStopTimer={(t) => stopTimer(t.id)}
                        onDelete={requestDelete}
                        onTagClick={(tag) => setFilters({ tag })}
                      />
                    ))}
                  </ul>
                </section>
              ),
            )}
          </div>
        )}
      </div>

      {!isLoading && (
        <div className="mt-12">
          <Journal today={today} entries={journal} onChange={setJournalEntry} />
        </div>
      )}

      <TaskEditor
        task={editing}
        template={editingTemplate}
        onSave={handleSave}
        onDelete={requestDelete}
        onClose={() => setEditingId(null)}
      />
      <DeleteDialog
        task={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleting(null)}
      />

      {/* Screen-reader announcements for actions that change the list. */}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
