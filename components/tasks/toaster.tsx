"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export type ToastVariant = "info" | "success" | "error";

export interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

/** Manages a small stack of ephemeral notifications. */
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = nextId.current;
      nextId.current += 1;
      setToasts((list) => [...list.slice(-2), { id, message, variant }]);
    },
    [],
  );

  return { toasts, notify, dismiss };
}

const DURATION_MS = 4000;

const variantClasses: Record<ToastVariant, string> = {
  info: "border-line text-ink",
  success: "border-success/40 text-success",
  error: "border-danger/40 text-danger",
};

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const id = window.setTimeout(() => onDismiss(toast.id), DURATION_MS);
    return () => window.clearTimeout(id);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={cn(
        "bg-cream-50 shadow-lift pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 text-sm",
        variantClasses[toast.variant],
      )}
    >
      <span>{toast.message}</span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="text-ink-muted hover:text-ink focus-visible:outline-clay-500 ml-auto shrink-0 cursor-pointer rounded p-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5">
          <path
            d="M4 4l8 8M12 4l-8 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

/** Fixed, polite live region; also the visible toast stack. */
export function Toaster({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
