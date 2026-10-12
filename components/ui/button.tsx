import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant =
  "primary" | "secondary" | "ghost" | "danger" | "danger-ghost";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ComponentProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-clay-500 text-on-clay shadow-soft hover:bg-clay-600 hover:shadow-lift",
  secondary:
    "border border-line-strong bg-cream-50 text-ink shadow-soft hover:border-ink-muted/50 hover:bg-raised",
  ghost: "text-ink-soft hover:bg-cream-200 hover:text-ink",
  /** Destructive confirmation: bordered, red text. */
  danger:
    "border border-danger/40 bg-cream-50 text-danger shadow-soft hover:border-danger hover:bg-danger/10",
  /** Quiet until hovered; for row-level delete icons. */
  "danger-ghost": "text-ink-muted hover:bg-danger/10 hover:text-danger",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 px-3 text-sm",
  md: "h-10 gap-2 px-4 text-sm",
  lg: "h-12 gap-2 px-6 text-base",
  /** Square, for a single icon. Always pass an aria-label. */
  icon: "size-8",
};

/** Button styling as a function, for links that should look like buttons. */
export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center rounded-xl font-medium whitespace-nowrap",
    "transition-[background-color,border-color,box-shadow,color,transform] duration-200 ease-calm",
    "motion-safe:active:scale-[0.98]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-500",
    "disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  type = "button",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, className })}
      {...props}
    />
  );
}
