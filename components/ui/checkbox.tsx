import type { ComponentProps, ReactNode } from "react";
import { useId } from "react";
import { cn } from "@/lib/cn";

export interface CheckboxProps extends Omit<
  ComponentProps<"input">,
  "type" | "size"
> {
  label: ReactNode;
  description?: ReactNode;
}

/** Native checkbox, so keyboard, form and screen-reader behavior come for free. */
export function Checkbox({
  label,
  description,
  id,
  className,
  disabled,
  ...props
}: CheckboxProps) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <div
      className={cn(
        "flex items-start gap-3",
        disabled && "opacity-50",
        className,
      )}
    >
      <span className="relative mt-0.5 grid size-5 shrink-0 place-items-center">
        <input
          id={inputId}
          type="checkbox"
          disabled={disabled}
          aria-describedby={description ? `${inputId}-desc` : undefined}
          className={cn(
            "peer border-line-strong bg-cream-50 shadow-soft size-5 cursor-pointer appearance-none rounded-md border",
            "transition-[background-color,border-color,box-shadow] duration-200",
            "hover:border-ink-muted checked:border-clay-500 checked:bg-clay-500",
            "focus-visible:outline-clay-500 focus-visible:outline-2 focus-visible:outline-offset-2",
            "disabled:cursor-not-allowed",
          )}
          {...props}
        />
        <svg
          viewBox="0 0 16 16"
          aria-hidden="true"
          className="text-on-clay ease-calm pointer-events-none absolute size-3.5 scale-75 opacity-0 transition-[opacity,transform] duration-200 peer-checked:scale-100 peer-checked:opacity-100"
        >
          <path
            d="M3.5 8.5l3 3 6-6.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <div className="flex flex-col">
        <label
          htmlFor={inputId}
          className={cn(
            "text-ink text-sm font-medium",
            !disabled && "cursor-pointer",
          )}
        >
          {label}
        </label>
        {description && (
          <p id={`${inputId}-desc`} className="text-ink-muted text-sm">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
