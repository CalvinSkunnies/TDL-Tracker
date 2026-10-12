"use client";

import { Button, Modal } from "@/components/ui";
import type { Task } from "@/lib/types";

interface DeleteDialogProps {
  /** The task pending deletion, or null when closed. */
  task: Task | null;
  onConfirm: (task: Task) => void;
  onCancel: () => void;
}

export function DeleteDialog({ task, onConfirm, onCancel }: DeleteDialogProps) {
  return (
    <Modal
      open={task !== null}
      onClose={onCancel}
      title="Delete this task?"
      description={
        task ? (
          <>
            <span className="text-ink font-medium">“{task.title}”</span> will be
            removed permanently. This can&apos;t be undone.
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
            <Button variant="danger" onClick={() => onConfirm(task)}>
              Delete task
            </Button>
          </>
        )
      }
    />
  );
}
