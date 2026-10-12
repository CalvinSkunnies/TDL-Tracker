import type { ComponentProps, ReactNode } from "react";
import { useId } from "react";
import { cn } from "@/lib/cn";
import { Field, controlClasses } from "./field";

export interface InputProps extends Omit<ComponentProps<"input">, "size"> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
}

export function Input({
  label,
  hint,
  error,
  id,
  className,
  ...props
}: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error
    ? `${inputId}-error`
    : hint
      ? `${inputId}-hint`
      : undefined;

  return (
    <Field id={inputId} label={label} hint={hint} error={error}>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          controlClasses,
          "h-10 text-sm",
          error ? "border-danger" : "border-line",
          className,
        )}
        {...props}
      />
    </Field>
  );
}
