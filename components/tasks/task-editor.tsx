"use client";

import { useId, useState } from "react";
import {
  Button,
  Checkbox,
  Input,
  Modal,
  Select,
  Textarea,
} from "@/components/ui";
import type { SaveOptions } from "@/lib/store";
import { parseTagInput } from "@/lib/tasks";
import {
  RECURRENCES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Recurrence,
  type Task,
  type TaskPatch,
  type TaskPriority,
  type TaskStatus,
  type TaskTemplate,
} from "@/lib/types";
import {
  PRIORITY_LABELS,
  RECURRENCE_LABELS,
  STATUS_LABELS,
  formatTimestamp,
} from "./labels";

export type SaveScope = "this" | "future";

interface TaskEditorProps {
  /** The task being edited, or null when the dialog is closed. */
  task: Task | null;
  /** The series backing this task, or null when it is a one-off. */
  template: TaskTemplate | null;
  onSave: (id: string, patch: TaskPatch, options: SaveOptions) => void;
  onDelete: (task: Task, scope: SaveScope) => void;
  onClose: () => void;
}

export function TaskEditor({
  task,
  template,
  onSave,
  onDelete,
  onClose,
}: TaskEditorProps) {
  const formId = useId();
  const [scopeState, setScopeState] = useState<{
    id: string | null;
    scope: SaveScope;
  }>({ id: task?.id ?? null, scope: "this" });

  // Reset the scope back to "this task" whenever a different task is opened.
  if ((task?.id ?? null) !== scopeState.id) {
    setScopeState({ id: task?.id ?? null, scope: "this" });
  }
  const scope = scopeState.scope;
  const setScope = (next: SaveScope) => setScopeState({ id: task?.id ?? null, scope: next });

  return (
    <Modal
      open={task !== null}
      onClose={onClose}
      size="lg"
      title="Edit task"
      description={
        task
          ? `Created ${formatTimestamp(task.createdAt)}${
              task.completedAt
                ? ` · Completed ${formatTimestamp(task.completedAt)}`
                : ""
            }`
          : undefined
      }
      footer={
        task && (
          <div className="flex w-full items-center justify-between gap-2">
            <Button variant="danger" onClick={() => onDelete(task, scope)}>
              Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" form={formId}>
                Save changes
              </Button>
            </div>
          </div>
        )
      }
    >
      {/* Re-mounting per task resets the form state. */}
      {task && (
        <EditorForm
          key={task.id}
          formId={formId}
          task={task}
          template={template}
          scope={scope}
          onScopeChange={setScope}
          onSubmit={(patch, options) => onSave(task.id, patch, options)}
        />
      )}
    </Modal>
  );
}

function minutesToField(value: number | null): string {
  return value === null ? "" : String(value);
}

function fieldToMinutes(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

function EditorForm({
  formId,
  task,
  template,
  scope,
  onScopeChange,
  onSubmit,
}: {
  formId: string;
  task: Task;
  template: TaskTemplate | null;
  scope: SaveScope;
  onScopeChange: (scope: SaveScope) => void;
  onSubmit: (patch: TaskPatch, options: SaveOptions) => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [startDate, setStartDate] = useState(task.startDate ?? "");
  const [dueDate, setDueDate] = useState(task.dueDate ?? "");
  const [tags, setTags] = useState(task.tags.join(", "));
  const [estimate, setEstimate] = useState(
    minutesToField(task.estimateMinutes),
  );
  const [actual, setActual] = useState(minutesToField(task.actualMinutes));
  const [repeats, setRepeats] = useState(template !== null);
  const [recurrence, setRecurrence] = useState<Recurrence>(
    template?.recurrence ?? "daily",
  );
  const [titleError, setTitleError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (title.trim() === "") {
      setTitleError("Give the task a title.");
      return;
    }
    if (startDate && dueDate && dueDate < startDate) {
      setDateError("The end date can't be before the start date.");
      return;
    }
    onSubmit(
      {
        title,
        notes,
        status,
        priority,
        startDate: startDate || null,
        dueDate: dueDate || null,
        tags: parseTagInput(tags),
        estimateMinutes: fieldToMinutes(estimate),
        actualMinutes: fieldToMinutes(actual),
      },
      { recurrence: { enabled: repeats, rule: recurrence }, scope },
    );
  }

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      noValidate
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
      <Input
        wrapperClassName="sm:col-span-2"
        label="Title"
        value={title}
        onChange={(event) => {
          setTitle(event.target.value);
          if (titleError) setTitleError(null);
        }}
        error={titleError}
        maxLength={200}
        required
        autoComplete="off"
      />
      <Textarea
        label="Description (optional)"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        rows={3}
        wrapperClassName="sm:col-span-2"
      />

      <Select
        label="Status"
        value={status}
        onChange={(event) => setStatus(event.target.value as TaskStatus)}
      >
        {TASK_STATUSES.map((value) => (
          <option key={value} value={value}>
            {STATUS_LABELS[value]}
          </option>
        ))}
      </Select>
      <Select
        label="Priority"
        value={priority}
        onChange={(event) => setPriority(event.target.value as TaskPriority)}
      >
        {TASK_PRIORITIES.map((value) => (
          <option key={value} value={value}>
            {PRIORITY_LABELS[value]}
          </option>
        ))}
      </Select>

      <Input
        label="Start date"
        type="date"
        value={startDate}
        onChange={(event) => {
          setStartDate(event.target.value);
          if (dateError) setDateError(null);
        }}
      />
      <Input
        label="End date / deadline"
        type="date"
        value={dueDate}
        min={startDate || undefined}
        onChange={(event) => {
          setDueDate(event.target.value);
          if (dateError) setDateError(null);
        }}
        error={dateError}
      />
      <Input
        label="Tags"
        value={tags}
        onChange={(event) => setTags(event.target.value)}
        hint="Separate with commas or spaces."
        autoComplete="off"
        wrapperClassName="sm:col-span-2"
      />

      <Input
        label="Estimate (minutes)"
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        value={estimate}
        onChange={(event) => setEstimate(event.target.value)}
      />
      <Input
        label="Time spent (minutes)"
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        value={actual}
        onChange={(event) => setActual(event.target.value)}
      />

      <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-start sm:justify-between">
        <Checkbox
          label="Repeats"
          description="A fresh copy appears each day it is due."
          checked={repeats}
          onChange={(event) => setRepeats(event.target.checked)}
        />
        {repeats && (
          <Select
            aria-label="Repeat schedule"
            value={recurrence}
            onChange={(event) =>
              setRecurrence(event.target.value as Recurrence)
            }
            wrapperClassName="sm:w-44"
          >
            {RECURRENCES.map((value) => (
              <option key={value} value={value}>
                {RECURRENCE_LABELS[value]}
              </option>
            ))}
          </Select>
        )}
      </div>

      {template && (
        <fieldset className="border-line rounded-xl border p-3 sm:col-span-2">
          <legend className="text-ink px-1 text-sm font-medium">
            Apply changes to
          </legend>
          <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
            {(
              [
                ["this", "This task only"],
                ["future", "This and all future"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className="text-ink-soft flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="radio"
                  name="scope"
                  value={value}
                  checked={scope === value}
                  onChange={() => onScopeChange(value)}
                  className="accent-clay-500 size-4"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </form>
  );
}
