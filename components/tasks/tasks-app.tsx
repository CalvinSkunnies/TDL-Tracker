"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { downloadTextFile, prefersReducedMotion } from "@/lib/backup";
import type { SaveOptions } from "@/lib/store";
import { useTasks } from "@/lib/use-tasks";
import { useToday } from "@/lib/use-today";
import type { NewTask, Task, TaskPatch, TaskStatus } from "@/lib/types";
import { AddTaskDialog } from "./add-task-dialog";
import { CommandPalette } from "./command-palette";
import { DataControls } from "./data-controls";
import { DeleteDialog } from "./delete-dialog";
import { FilterBar } from "./filter-bar";
import { Journal } from "./journal";
import { STATUS_LABELS } from "./labels";
import { QuickAdd } from "./quick-add";
import { EmptyState, LoadingState, NoResultsState } from "./states";
import { StatsDashboard } from "./stats-dashboard";
import { TaskEditor, type SaveScope } from "./task-editor";
import { TaskRow } from "./task-row";
import { Toaster, useToasts } from "./toaster";

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

function toggleTheme() {
  const root = document.documentElement;
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  try {
    localStorage.setItem("theme", next);
  } catch {
    // Storage can be blocked; the theme still applies for this visit.
  }
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
    reorderTasks,
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
  const { toasts, notify, dismiss } = useToasts();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addTitle, setAddTitle] = useState("");

  const pendingFocus = useRef<
    {
      id: string;
      target: "checkbox" | "status" | "open";
    } | null
  >(null);

  const quickAddRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const editing = tasks.find((task) => task.id === editingId) ?? null;
  const editingTemplate = editing ? getTemplate(editing.seriesId) : null;
  const openCount = counts.todo + counts["in-progress"];

  // Drag-and-drop handlers
  const dragOverRef = useRef<HTMLElement | null>(null);
  const dragOverIndexRef = useRef<number>(0);
  const dragOverStatusRef = useRef<TaskStatus | null>(null);

  function handleDragStart(event: React.DragEvent<HTMLLIElement>, taskId: string, status: TaskStatus) {
    event.dataTransfer.setData("text/plain", taskId);
    dragOverRef.current = event.currentTarget;
    dragOverStatusRef.current = status;
  }

  function handleDragEnter(event: React.DragEvent<HTMLLIElement>, index: number, status: TaskStatus) {
    if (dragOverRef.current === event.currentTarget) return;
    event.preventDefault();
    dragOverRef.current = event.currentTarget;
    dragOverIndexRef.current = index;
    dragOverStatusRef.current = status;
  }

  function handleDragOver(event: React.DragEvent<HTMLLIElement>) {
    event.preventDefault();
  }

  function handleDrop(event: React.DragEvent<HTMLLIElement>, targetTaskId: string, status: TaskStatus) {
    event.preventDefault();
    const sourceTaskId = event.dataTransfer.getData("text/plain");
    if (!sourceTaskId || sourceTaskId === targetTaskId) return;

    const currentTasks = groups[status] ?? [];
    const sorted = [...currentTasks];
    const sourceIndex = sorted.findIndex((t) => t.id === sourceTaskId);
    const targetIndex = sorted.findIndex((t) => t.id === targetTaskId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    const [moved] = sorted.splice(sourceIndex, 1);
    sorted.splice(targetIndex, 0, moved);

    const taskIds = sorted.map((t) => t.id);
    reorderTasks(status, taskIds);
  }

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

  // Keyboard shortcuts: Cmd/Ctrl+K palette, "/" search.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) return;
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      if (document.querySelector("dialog[open]")) return;
      if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function focusQuickAddSoon() {
    window.setTimeout(() => quickAddRef.current?.focus(), 50);
  }

  function handleAdd(title: string): boolean {
    const task = addTask({ title });
    if (!task) return false;
    notify(`Added "${task.title}".`, "success");
    return true;
  }

  function openAddForm(title = "") {
    setAddTitle(title);
    setAddOpen(true);
  }

  function handleCreate(input: NewTask) {
    const task = addTask(input);
    setAddOpen(false);
    if (task) notify(`Added "${task.title}".`, "success");
  }

  function handleToggle(task: Task) {
    const updated = toggleStatus(task.id);
    pendingFocus.current = { id: task.id, target: "checkbox" };
    if (updated) {
      notify(
        updated.status === "done"
          ? `Completed "${task.title}".`
          : `Reopened "${task.title}".`,
        updated.status === "done" ? "success" : "info",
      );
    }
  }

  function handleStatusChange(task: Task, status: TaskStatus) {
    saveTask(task.id, { status });
    pendingFocus.current = { id: task.id, target: "status" };
    notify(`Moved "${task.title}" to ${STATUS_LABELS[status]}.`);
  }

  function handleSave(id: string, patch: TaskPatch, options: SaveOptions) {
    saveTask(id, patch, options);
    pendingFocus.current = { id, target: "open" };
    setEditingId(null);
    notify("Task saved.", "success");
  }

  function handleConfirmDelete(task: Task, scope: SaveScope) {
    const stopsSeries = scope === "future" && task.seriesId !== null;
    if (stopsSeries) {
      deleteSeries(task.id);
    } else {
      deleteTask(task.id);
    }
    setDeleting(null);
    notify(
      stopsSeries
        ? `Deleted "${task.title}" and stopped the series.`
        : `Deleted "${task.title}".$`,
    );
    focusQuickAddSoon();
  }

  function requestDelete(task: Task) {
    setEditingId(null);
    setDeleting(task);
  }

  const commands = [
    {
      id: "add",
      label: "Add task",
      run: () => openAddForm(),
    },
    {
      id: "search",
      label: "Search tasks",
      hint: "⌘K / Ctrl+K",
      run: () => searchRef.current?.focus(),
    },
    {
      id: "export",
      label: "Export backup",
      run: () =>
        downloadTextFile(`tdl-tracker-${today || "backup"}.json`, exportData()),
    },
    {
      id: "insights",
      label: "Show insights",
      run: () => {
        const target = document.getElementById("insights");
        target?.scrollIntoView({
          behavior: prefersReducedMotion() ? "auto" : "smooth",
          block: "start",
        });
      },
    },
    { id: "theme", label: "Toggle theme", run: toggleTheme },
  ];

  const showList = !isLoading && tasks.length > 0 && visibleTasks.length > 0;

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">
            Your tasks
          </h1>
          <p className="text-ink-muted mt-2 text-base" aria-live="polite">
            {isLoading
              ? " "
              : tasks.length === 0
                ? "Nothing here yet."
                : `${openCount} open · ${counts.done} done`}
          </p>
        </div>
        {!isLoading && (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button size="sm" onClick={() => openAddForm()}>
              Add task
            </Button>
            <DataControls
              today={today}
              onExport={exportData}
              onImport={importData}
            />
          </div>
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

      <QuickAdd
        onAdd={handleAdd}
        onDetails={openAddForm}
        disabled={isLoading}
        inputRef={quickAddRef}
      />
      <p className="text-ink-muted mt-2 text-xs">
        Press <kbd className="font-sans font-semibold">/</kbd> to search.
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
              (status) => {
                const statusTasks = groups[status];
                return (
                  <section key={status} aria-labelledby={`group-${status}`}>
                    <h2
                      id={`group-${status}`}
                      className="font-display mb-3 flex items-baseline gap-2 text-xl font-medium tracking-tight"
                    >
                      {STATUS_LABELS[status]}
                      <span className="text-ink-muted font-sans text-sm tabular-nums">
                        {statusTasks.length}
                      </span>
                    </h2>
                    <ul className="flex flex-col gap-2.5">
                      {statusTasks.map((task, index) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id, status)}
                          onDragEnter={(e) => handleDragEnter(e, index, status)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, task.id, status)}
                        >
                          <TaskRow
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
                        </div>
                      ))}
                    </ul>
                  </section>
                );
              }
            )}
          </div>
        )}
      </div>

      {!isLoading && (
        <div className="mt-12">
          <StatsDashboard tasks={tasks} settings={settings} today={today} />
        </div>
      )}

      {!isLoading && (
        <div className="mt-12">
          <Journal today={today} entries={journal} onChange={setJournalEntry} />
        </div>
      )}

      <AddTaskDialog
        open={addOpen}
        initialTitle={addTitle}
        onClose={() => setAddOpen(false)}
        onCreate={handleCreate}
      />
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
      <CommandPalette
        open={paletteOpen}
        commands={commands}
        onClose={() => setPaletteOpen(false)}
      />
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}