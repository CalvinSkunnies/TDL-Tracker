"use client";

import type { Ref } from "react";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { StatusFilter, TaskFilters } from "@/lib/types";
import { STATUS_LABELS } from "./labels";

interface FilterBarProps {
  filters: TaskFilters;
  counts: Record<StatusFilter, number>;
  tags: string[];
  hasActiveFilters: boolean;
  onChange: (patch: Partial<TaskFilters>) => void;
  onReset: () => void;
  searchRef?: Ref<HTMLInputElement>;
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "todo", label: STATUS_LABELS.todo },
  { value: "in-progress", label: STATUS_LABELS["in-progress"] },
  { value: "done", label: STATUS_LABELS.done },
];

function Chip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "ease-calm inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors duration-200",
        "focus-visible:outline-clay-500 focus-visible:outline-2 focus-visible:outline-offset-2",
        pressed
          ? "border-clay-500/50 bg-clay-100 text-clay-700"
          : "border-line text-ink-muted hover:bg-cream-200 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

export function FilterBar({
  filters,
  counts,
  tags,
  hasActiveFilters,
  onChange,
  onReset,
  searchRef,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-4">
      <Input
        ref={searchRef}
        type="search"
        aria-label="Search tasks"
        placeholder="Search tasks, notes and tags"
        value={filters.query}
        onChange={(event) => onChange({ query: event.target.value })}
        autoComplete="off"
      />

      <div
        role="group"
        aria-label="Filter by status"
        className="flex flex-wrap gap-2"
      >
        {STATUS_OPTIONS.map(({ value, label }) => (
          <Chip
            key={value}
            pressed={filters.status === value}
            onClick={() => onChange({ status: value })}
          >
            {label}
            <span className="text-ink-muted tabular-nums">{counts[value]}</span>
          </Chip>
        ))}
      </div>

      {tags.length > 0 && (
        <div
          role="group"
          aria-label="Filter by tag"
          className="flex flex-wrap items-center gap-2"
        >
          {tags.map((tag) => (
            <Chip
              key={tag}
              pressed={filters.tag === tag}
              onClick={() =>
                onChange({ tag: filters.tag === tag ? null : tag })
              }
            >
              #{tag}
            </Chip>
          ))}
        </div>
      )}

      {hasActiveFilters && (
        <div>
          <Button variant="ghost" size="sm" onClick={onReset}>
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
