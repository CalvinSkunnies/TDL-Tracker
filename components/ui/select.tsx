import type { ComponentProps, ReactNode } from "react";
import { useId } from "react";
import { cn } from "@/lib/cn";
import { Field, controlClasses } from "./field";

export interface SelectProps extends Omit<ComponentProps<"select">, "size"> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Classes for the outer wrapper (label + control + message). */
  wrapperClassName?: string;
}

/** Native <select> (best keyboard and mobile behavior) in the house style. */
export function Select({
  label,
  hint,
  error,
  wrapperClassName,
  id,
  className,
  children,
  ...props
}: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const describedBy = error
    ? `${selectId}-error`
    : hint
      ? `${selectId}-hint`
      : undefined;

  return (
    <Field
      id={selectId}
      label={label}
      hint={hint}
      error={error}
      className={wrapperClassName}
    >
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            controlClasses,
            "h-10 cursor-pointer appearance-none pr-9 text-sm",
            error ? "border-danger" : "border-line",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <svg
          viewBox="0 0 16 16"
          aria-hidden="true"
          className="text-ink-muted pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
        >
          <path
            d="M4 6.5l4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </Field>
  );
}
