"use client";

import { useId, useState } from "react";
import { Button, Input, Modal, Textarea } from "@/components/ui";
import type { NewTask } from "@/lib/types";

interface AddTaskDialogProps {
  open: boolean;
  /** Optional starting title, e.g. text typed in the quick-add field. */
  initialTitle?: string;
  onClose: () => void;
  onCreate: (input: NewTask) => void;
}

interface DateError {
  field: "title" | "dates";
  message: string;
}

export function AddTaskDialog({
  open,
  initialTitle,
  onClose,
  onCreate,
}: AddTaskDialogProps) {
  const formId = useId();

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="New task"
      description="Fill in what you know now; the rest can be edited later."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId}>
            Create task
          </Button>
        </>
      }
    >
      {open && (
        <AddTaskForm
          formId={formId}
          initialTitle={initialTitle ?? ""}
          onSubmit={onCreate}
        />
      )}
    </Modal>
  );
}

function AddTaskForm({
  formId,
  initialTitle,
  onSubmit,
}: {
  formId: string;
  initialTitle: string;
  onSubmit: (input: NewTask) => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<DateError | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (title.trim() === "") {
      setError({ field: "title", message: "Give the task a title." });
      return;
    }
    if (startDate && endDate && endDate < startDate) {
      setError({
        field: "dates",
        message: "The end date can't be before the start date.",
      });
      return;
    }

    onSubmit({
      title: title.trim(),
      notes: description.trim(),
      startDate: startDate || null,
      dueDate: endDate || null,
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
        label="Task title"
        value={title}
        onChange={(event) => {
          setTitle(event.target.value);
          if (error?.field === "title") setError(null);
        }}
        error={error?.field === "title" ? error.message : undefined}
        maxLength={200}
        required
        autoComplete="off"
        autoFocus
      />

      <Textarea
        label="Description (optional)"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        rows={3}
        wrapperClassName="sm:col-span-2"
        hint="Context, links, or what done looks like."
      />

      <Input
        label="Start date"
        type="date"
        value={startDate}
        onChange={(event) => {
          setStartDate(event.target.value);
          if (error?.field === "dates") setError(null);
        }}
      />
      <Input
        label="End date / deadline"
        type="date"
        value={endDate}
        min={startDate || undefined}
        onChange={(event) => {
          setEndDate(event.target.value);
          if (error?.field === "dates") setError(null);
        }}
        error={error?.field === "dates" ? error.message : undefined}
      />
    </form>
  );
}
