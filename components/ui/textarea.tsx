import type { ComponentProps, ReactNode } from "react";
import { useId } from "react";
import { cn } from "@/lib/cn";
import { Field, controlClasses } from "./field";

export interface TextareaProps extends ComponentProps<"textarea"> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Classes for the outer wrapper (label + control + message). */
  wrapperClassName?: string;
}

export function Textarea({
  label,
  hint,
  error,
  wrapperClassName,
  id,
  className,
  rows = 4,
  ...props
}: TextareaProps) {
  const autoId = useId();
  const textareaId = id ?? autoId;
  const describedBy = error
    ? `${textareaId}-error`
    : hint
      ? `${textareaId}-hint`
      : undefined;

  return (
    <Field
      id={textareaId}
      label={label}
      hint={hint}
      error={error}
      className={wrapperClassName}
    >
      <textarea
        id={textareaId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          controlClasses,
          "resize-y py-2.5 text-sm leading-relaxed",
          error ? "border-danger" : "border-line",
          className,
        )}
        {...props}
      />
    </Field>
  );
}
