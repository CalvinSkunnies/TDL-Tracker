"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import { buildInsights } from "@/lib/insights";
import type { Settings, Task } from "@/lib/types";
import { BarChart } from "./charts";
import { formatMinutes } from "./labels";

const RANGES = [7, 30] as const;
type Range = (typeof RANGES)[number];

type Tone = "neutral" | "success" | "warning";

const toneClasses: Record<Tone, string> = {
  neutral: "text-ink",
  success: "text-success",
  warning: "text-danger",
};

function StatCard({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: Tone;
}) {
  return (
    <Card className="p-4">
      <p className="text-ink-muted text-xs font-medium tracking-wide uppercase">
        {label}
      </p>
      <p
        className={cn(
          "font-display mt-1.5 text-3xl font-medium tracking-tight tabular-nums",
          toneClasses[tone],
        )}
      >
        {value}
      </p>
      <p className="text-ink-muted mt-1 text-xs">{detail}</p>
    </Card>
  );
}

export function StatsDashboard({
  tasks,
  settings,
  today,
}: {
  tasks: Task[];
  settings: Settings;
  today: string;
}) {
  const [range, setRange] = useState<Range>(7);
  const data = useMemo(
    () => buildInsights(tasks, settings, range, today),
    [tasks, settings, range, today],
  );

  const ratePercent =
    data.completion.rate === null
      ? null
      : Math.round(data.completion.rate * 100);
  const accuracy =
    data.estimateTotal > 0
      ? Math.round((data.actualTotal / data.estimateTotal) * 100)
      : null;
  const accuracyTone: Tone =
    accuracy === null ? "neutral" : accuracy > 110 ? "warning" : "success";
  const overloadThreshold = Math.max(3, Math.round(range * 0.4));

  return (
    <section id="insights" aria-labelledby="insights-heading">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2
          id="insights-heading"
          className="font-display text-xl font-medium tracking-tight"
        >
          Insights
        </h2>
        <div
          role="group"
          aria-label="Insights range"
          className="border-line bg-cream-200/60 inline-flex rounded-full border p-0.5"
        >
          {RANGES.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={range === value}
              onClick={() => setRange(value)}
              className={cn(
                "focus-visible:outline-clay-500 cursor-pointer rounded-full px-3 py-1 text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2",
                range === value
                  ? "bg-cream-50 text-ink shadow-soft"
                  : "text-ink-muted hover:text-ink",
              )}
            >
              {value}d
            </button>
          ))}
        </div>
      </div>

      {tasks.length === 0 ? (
        <p className="border-line text-ink-muted rounded-2xl border border-dashed px-6 py-10 text-center text-sm">
          Add and complete a few tasks to see your trends here.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {data.overloadDays >= overloadThreshold && (
            <p
              role="alert"
              className="border-danger/40 bg-danger/10 text-danger rounded-xl border px-4 py-3 text-sm"
            >
              Planned time exceeded your daily capacity on {data.overloadDays}{" "}
              of the last {range} days. Consider trimming estimates or raising
              your capacity.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Completion rate"
              value={ratePercent === null ? "—" : `${ratePercent}%`}
              detail={`${data.completion.completed} of ${data.completion.total} scheduled`}
            />
            <StatCard
              label="Current streak"
              value={`${data.streak}d`}
              detail="Days with a completed task"
            />
            <StatCard
              label="Focus logged"
              value={formatMinutes(data.totalFocusMinutes)}
              detail={`Actual time, last ${range} days`}
            />
            <StatCard
              label="Estimate accuracy"
              value={accuracy === null ? "—" : `${accuracy}%`}
              detail={
                accuracy === null
                  ? "No completed estimates yet"
                  : accuracy > 110
                    ? "Ran over estimate"
                    : "On or under estimate"
              }
              tone={accuracyTone}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Card className="p-5">
              <h3 className="text-sm font-medium">Focus logged per day</h3>
              <p className="text-ink-muted mb-3 text-xs">
                {formatMinutes(data.totalFocusMinutes)} total actual time
              </p>
              <BarChart
                ariaLabel={`Focused time logged per day over the last ${range} days, ${formatMinutes(data.totalFocusMinutes)} total.`}
                labels={data.points.map((point) => point.label)}
                series={[{ values: data.focusByDay, className: "fill-clay-500" }]}
              />
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-medium">Estimate vs actual</h3>
              <p className="text-ink-muted mb-3 flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5">
                  <span className="bg-line-strong inline-block size-2.5 rounded-sm" />
                  Planned
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="bg-clay-500 inline-block size-2.5 rounded-sm" />
                  Actual
                </span>
              </p>
              <BarChart
                ariaLabel={`Planned versus actual minutes for tasks completed each day over the last ${range} days.`}
                labels={data.points.map((point) => point.label)}
                series={[
                  { values: data.estimateByDay, className: "fill-line-strong" },
                  { values: data.actualByDay, className: "fill-clay-500" },
                ]}
              />
            </Card>
          </div>
        </div>
      )}
    </section>
  );
}
