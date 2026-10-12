"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type TabsVariant = "primary" | "secondary" | "ghost";

export interface TabItem {
  value: string;
  label: ReactNode;
  content: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  defaultValue?: string;
  variant?: TabsVariant;
  className?: string;
}

const listVariants: Record<TabsVariant, string> = {
  primary: "gap-1",
  secondary: "gap-1 rounded-xl bg-cream-200 p-1",
  ghost: "gap-5 border-b border-line",
};

const tabVariants: Record<TabsVariant, { base: string; active: string }> = {
  primary: {
    base: "rounded-lg px-3.5 py-1.5 text-ink-muted hover:bg-cream-200 hover:text-ink",
    active: "bg-clay-100 text-clay-700 hover:bg-clay-100 hover:text-clay-700",
  },
  secondary: {
    base: "rounded-lg px-3.5 py-1.5 text-ink-muted hover:text-ink",
    active: "bg-cream-50 text-ink shadow-soft",
  },
  ghost: {
    base: "-mb-px border-b-2 border-transparent pb-2.5 text-ink-muted hover:text-ink",
    active: "border-clay-500 text-ink",
  },
};

export function Tabs({
  items,
  defaultValue,
  variant = "primary",
  className,
}: TabsProps) {
  const [value, setValue] = useState(defaultValue ?? items[0]?.value);
  const baseId = useId();
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  function focusTab(index: number) {
    const next = items[(index + items.length) % items.length];
    setValue(next.value);
    tabRefs.current[next.value]?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent, index: number) {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        focusTab(index + 1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        focusTab(index - 1);
        break;
      case "Home":
        event.preventDefault();
        focusTab(0);
        break;
      case "End":
        event.preventDefault();
        focusTab(items.length - 1);
        break;
    }
  }

  const styles = tabVariants[variant];

  return (
    <div className={className}>
      <div
        role="tablist"
        className={cn(
          "inline-flex max-w-full overflow-x-auto",
          listVariants[variant],
        )}
      >
        {items.map((item, index) => {
          const selected = item.value === value;
          return (
            <button
              key={item.value}
              ref={(node) => {
                tabRefs.current[item.value] = node;
              }}
              role="tab"
              type="button"
              id={`${baseId}-tab-${item.value}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.value}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setValue(item.value)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={cn(
                "text-sm font-medium whitespace-nowrap transition-[background-color,color,border-color,box-shadow] duration-200",
                "focus-visible:outline-clay-500 focus-visible:outline-2 focus-visible:outline-offset-2",
                styles.base,
                selected && styles.active,
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item) => (
        <div
          key={item.value}
          role="tabpanel"
          id={`${baseId}-panel-${item.value}`}
          aria-labelledby={`${baseId}-tab-${item.value}`}
          hidden={item.value !== value}
          tabIndex={0}
          className="text-ink-soft focus-visible:outline-clay-500 motion-safe:animate-fade-in mt-5 rounded-lg text-sm focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
