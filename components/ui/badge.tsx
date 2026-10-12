import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export type BadgeVariant = "primary" | "secondary" | "ghost";

export interface BadgeProps extends ComponentProps<"span"> {
  variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
  primary: "bg-clay-100 text-clay-700",
  secondary: "bg-cream-200 text-ink-soft",
  ghost: "border border-line-strong text-ink-muted",
};

export function Badge({
  variant = "secondary",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
