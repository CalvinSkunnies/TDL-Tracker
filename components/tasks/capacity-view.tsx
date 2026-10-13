"use client";

import { Card, Input } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatMinutes } from "./labels";

interface CapacityViewProps {
  /** Sum of estimates for today's open tasks, in minutes. */
  plannedMinutes: number;
  capacityHours: number;
  onCapacityChange: (hours: number) => void;
}

/** Today's planned load against the daily focus target. */
export function CapacityView({
  plannedMinutes,
  capacityHours,
  onCapacityChange,
}: CapacityViewProps) {
  const capacityMinutes = Math.max(1, capacityHours) * 60;
  const remaining = capacityMinutes - plannedMinutes;
  const overloaded = remaining < 0;
  const percent = Math.min(
    100,
    Math.round((plannedMinutes / capacityMinutes) * 100),
  );

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-medium tracking-tight">
            Today&apos;s load
          </h2>
          <p className="text-ink-muted mt-1 text-sm tabular-nums">
            {plannedMinutes === 0
              ? "Nothing planned yet."
              : overloaded
                ? `${formatMinutes(plannedMinutes)} planned · ${formatMinutes(
                    -remaining,
                  )} over capacity`
                : `${formatMinutes(plannedMinutes)} planned · ${formatMinutes(
                    remaining,
                  )} of room`}
          </p>
        </div>
        <Input
          label="Capacity (h)"
          type="number"
          inputMode="numeric"
          min={1}
          max={24}
          step={1}
          value={capacityHours}
          onChange={(event) => {
            const value = Number(event.target.value);
            if (Number.isFinite(value)) onCapacityChange(value);
          }}
          wrapperClassName="w-28 shrink-0"
          className="h-9"
        />
      </div>
      <div
        role="progressbar"
        aria-label="Planned time against capacity"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="bg-cream-200 mt-4 h-2.5 w-full overflow-hidden rounded-full"
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width,background-color] duration-300 ease-calm",
            overloaded ? "bg-danger" : "bg-clay-500",
          )}
          style={{ width: `${plannedMinutes === 0 ? 0 : Math.max(4, percent)}%` }}
        />
      </div>
    </Card>
  );
}
