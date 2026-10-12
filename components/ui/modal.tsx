"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  /** Action buttons, rendered right-aligned under the content. */
  footer?: ReactNode;
  children?: ReactNode;
  /** md = confirmations, lg = forms. */
  size?: "md" | "lg";
  className?: string;
}

/**
 * Built on the native <dialog> element: the browser handles the focus trap,
 * Escape to close, inert background and returning focus to the trigger.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  children,
  size = "md",
  className,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClose={onClose}
      onClick={(event) => {
        // Only the backdrop is the <dialog> element itself; the panel is a child.
        if (event.target === event.currentTarget) onClose();
      }}
      className={cn(
        "text-ink m-auto w-[calc(100%-2.5rem)] bg-transparent p-0",
        size === "lg" ? "max-w-xl" : "max-w-md",
        "backdrop:bg-backdrop open:backdrop:animate-fade-in backdrop:backdrop-blur-[2px]",
        "open:animate-modal-in",
      )}
    >
      <div
        className={cn(
          "border-line bg-cream-50 shadow-overlay rounded-2xl border p-6",
          className,
        )}
      >
        <h2
          id={titleId}
          className="font-display text-2xl font-medium tracking-tight"
        >
          {title}
        </h2>
        {description && (
          <p id={descId} className="text-ink-muted mt-1.5 text-sm">
            {description}
          </p>
        )}
        {children && <div className="mt-5">{children}</div>}
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </dialog>
  );
}
