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
import { parseTagInput } from "@/lib/tasks";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Task,
  type TaskPatch,
  type TaskPriority,
  type TaskRecurrence,
  type TaskStatus,
} from "@/lib/types";
import {
  PRIORITY_LABELS,
  RECURRENCE_LABELS,
  STATUS_LABELS,
  formatTimestamp,
} from "./labels";

interface TaskEditorProps {
  /** The task being edited, or null when the dialog is closed. */
  task: Task | null;
  onSave: (id: string, patch: TaskPatch) => void;
  onDelete: (task: Task) => void;
  onClose: () => void;
}

export function TaskEditor({
  task,
  onSave,
  onDelete,
  onClose,
}: TaskEditorProps) {
  const formId = useId();

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
            <Button variant="danger" onClick={() => onDelete(task)}>
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
          onSubmit={(patch) => onSave(task.id, patch)}
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
  onSubmit,
}: {
  formId: string;
  task: Task;
  onSubmit: (patch: TaskPatch) => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate ?? "");
  const [tags, setTags] = useState(task.tags.join(", "));
  const [estimate, setEstimate] = useState(
    minutesToField(task.estimateMinutes),
  );
  const [actual, setActual] = useState(minutesToField(task.actualMinutes));
  const [repeats, setRepeats] = useState(task.isRecurring);
  const [recurrence, setRecurrence] = useState<TaskRecurrence>(
    task.recurrence === "none" ? "daily" : task.recurrence,
  );
  const [titleError, setTitleError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (title.trim() === "") {
      setTitleError("Give the task a title.");
      return;
    }
    onSubmit({
      title,
      notes,
      status,
      priority,
      dueDate: dueDate || null,
      tags: parseTagInput(tags),
      estimateMinutes: fieldToMinutes(estimate),
      actualMinutes: fieldToMinutes(actual),
      isRecurring: repeats,
      recurrence: repeats ? recurrence : "none",
    });
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
        label="Notes"
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
        label="Due date"
        type="date"
        value={dueDate}
        onChange={(event) => setDueDate(event.target.value)}
      />
      <Input
        label="Tags"
        value={tags}
        onChange={(event) => setTags(event.target.value)}
        hint="Separate with commas or spaces."
        autoComplete="off"
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
          description="A new copy is scheduled when you finish it."
          checked={repeats}
          onChange={(event) => setRepeats(event.target.checked)}
        />
        {repeats && (
          <Select
            aria-label="Repeat schedule"
            value={recurrence}
            onChange={(event) =>
              setRecurrence(event.target.value as TaskRecurrence)
            }
            wrapperClassName="sm:w-44"
          >
            {(
              Object.keys(
                RECURRENCE_LABELS,
              ) as (keyof typeof RECURRENCE_LABELS)[]
            ).map((value) => (
              <option key={value} value={value}>
                {RECURRENCE_LABELS[value]}
              </option>
            ))}
          </Select>
        )}
      </div>
    </form>
  );
}
