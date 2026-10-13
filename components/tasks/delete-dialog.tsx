"use client";

import { Button, Modal } from "@/components/ui";
import type { Task } from "@/lib/types";
import type { SaveScope } from "./task-editor";

interface DeleteDialogProps {
  /** The task pending deletion, or null when closed. */
  task: Task | null;
  onConfirm: (task: Task, scope: SaveScope) => void;
  onCancel: () => void;
}

export function DeleteDialog({ task, onConfirm, onCancel }: DeleteDialogProps) {
  const isSeriesInstance = task !== null && task.seriesId !== null;

  return (
    <Modal
      open={task !== null}
      onClose={onCancel}
      title={isSeriesInstance ? "Delete a repeating task" : "Delete this task?"}
      description={
        task ? (
          <>
            <span className="text-ink font-medium">“{task.title}”</span> will be
            removed permanently. This can&apos;t be undone.
            {isSeriesInstance &&
              " Choose whether to skip only today or stop the series entirely."}
          </>
        ) : undefined
      }
      footer={
        task && (
          <>
            {/* Cancel first in DOM order, so it is the safe default focus. */}
            <Button variant="secondary" onClick={onCancel} autoFocus>
              Keep task
            </Button>
            {isSeriesInstance ? (
              <>
                <Button variant="danger-ghost" onClick={() => onConfirm(task, "this")}>
                  Skip today
                </Button>
                <Button variant="danger" onClick={() => onConfirm(task, "future")}>
                  Stop series
                </Button>
              </>
            ) : (
              <Button variant="danger" onClick={() => onConfirm(task, "this")}>
                Delete task
              </Button>
            )}
          </>
        )
      }
    />
  );
}
