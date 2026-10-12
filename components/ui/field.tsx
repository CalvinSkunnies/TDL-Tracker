import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface FieldProps {
  id: string;
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Label, hint and error wrapper shared by Input and Textarea. */
export function Field({
  id,
  label,
  hint,
  error,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={id} className="text-ink text-sm font-medium">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-danger text-sm">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-ink-muted text-sm">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Shared control styling for text-like inputs. */
export const controlClasses =
  "w-full rounded-xl border bg-cream-50 px-3.5 text-ink shadow-soft placeholder:text-ink-muted/70 " +
  "transition-[border-color,box-shadow,background-color] duration-200 " +
  "hover:border-ink-muted/50 focus:border-clay-500 focus:bg-raised focus:outline-none focus:ring-4 focus:ring-clay-500/20 " +
  "disabled:cursor-not-allowed disabled:opacity-50";
