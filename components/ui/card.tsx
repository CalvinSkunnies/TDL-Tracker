import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export type CardVariant = "primary" | "secondary" | "ghost";

export interface CardProps extends ComponentProps<"div"> {
  variant?: CardVariant;
  /** Adds a gentle lift on hover. Use for cards that are clickable. */
  interactive?: boolean;
}

const variants: Record<CardVariant, string> = {
  primary: "border border-line bg-cream-50 shadow-soft",
  secondary: "border border-transparent bg-cream-200",
  ghost: "border border-line bg-transparent",
};

export function Card({
  variant = "primary",
  interactive = false,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "ease-calm rounded-2xl p-6 transition-[box-shadow,border-color,transform] duration-200",
        variants[variant],
        interactive &&
          "hover:border-line-strong hover:shadow-lift cursor-pointer motion-safe:hover:-translate-y-0.5",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: ComponentProps<"h3">) {
  return (
    <h3
      className={cn(
        "font-display text-ink text-xl font-medium tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p className={cn("text-ink-muted mt-1.5 text-sm", className)} {...props} />
  );
}
