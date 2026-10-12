"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import * as store from "./store";
import {
  DEFAULT_FILTERS,
  collectTags,
  filterTasks,
  groupTasks,
  matchesQuery,
} from "./tasks";
import {
  TASK_STATUSES,
  type NewTask,
  type Task,
  type TaskFilters,
  type TaskPatch,
  type TaskStatus,
} from "./types";

const NO_TASKS: Task[] = [];

/**
 * All task state and actions for the UI.
 *
 * `isLoading` is true on the server and during hydration (localStorage does
 * not exist there); render a skeleton until it flips to false.
 */
export function useTasks() {
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);

  const isLoading = snapshot === null;
  const tasks = snapshot?.tasks ?? NO_TASKS;

  const allTags = useMemo(() => collectTags(tasks), [tasks]);

  // A tag filter that points at a tag nobody uses any more filters nothing.
  const effectiveFilters = useMemo<TaskFilters>(
    () => ({
      ...filters,
      tag: filters.tag && allTags.includes(filters.tag) ? filters.tag : null,
    }),
    [filters, allTags],
  );

  const visibleTasks = useMemo(
    () => filterTasks(tasks, effectiveFilters),
    [tasks, effectiveFilters],
  );
  const groups = useMemo(() => groupTasks(visibleTasks), [visibleTasks]);

  /** Per-status counts that respect the tag and search filters. */
  const counts = useMemo(() => {
    const result: Record<TaskStatus | "all", number> = {
      all: 0,
      todo: 0,
      "in-progress": 0,
      done: 0,
    };
    for (const task of tasks) {
      if (effectiveFilters.tag && !task.tags.includes(effectiveFilters.tag)) {
        continue;
      }
      if (!matchesQuery(task, effectiveFilters.query)) continue;
      result.all += 1;
      result[task.status] += 1;
    }
    return result;
  }, [tasks, effectiveFilters]);

  const updateFilters = useCallback((patch: Partial<TaskFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
  }, []);
  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const hasActiveFilters =
    effectiveFilters.status !== "all" ||
    effectiveFilters.tag !== null ||
    effectiveFilters.query.trim() !== "";

  return {
    tasks,
    isLoading,
    /** Set when localStorage is unavailable, unreadable or full. */
    storageProblem: snapshot?.problem ?? null,

    addTask: (input: NewTask) => store.addTask(input),
    updateTask: (id: string, patch: TaskPatch) => store.updateTask(id, patch),
    deleteTask: (id: string) => store.deleteTask(id),
    toggleStatus: (id: string) => store.toggleStatus(id),

    filters: effectiveFilters,
    setFilters: updateFilters,
    resetFilters,
    hasActiveFilters,

    allTags,
    visibleTasks,
    groups,
    counts,
    statuses: TASK_STATUSES,
  };
}

export type UseTasks = ReturnType<typeof useTasks>;
