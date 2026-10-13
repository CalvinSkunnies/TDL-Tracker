"use client";

import { cn } from "@/lib/cn";

export interface BarSeries {
  values: number[];
  /** Tailwind fill utility for the bars, e.g. "fill-clay-500". */
  className: string;
}

interface BarChartProps {
  series: BarSeries[];
  labels: string[];
  /** Screen-reader summary; the chart itself is aria-hidden inside. */
  ariaLabel: string;
  className?: string;
}

const SLOT = 12;
const GAP = 1.5;
const BASELINE = 102;

/**
 * Dependency-free grouped bar chart (inline SVG). The SVG has no text nodes, so
 * it can stretch fluidly; the axis labels are real HTML beneath it.
 */
export function BarChart({ series, labels, ariaLabel, className }: BarChartProps) {
  const count = labels.length;
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const bars = Math.max(1, series.length);
  const barWidth = (SLOT - GAP * (bars + 1)) / bars;
  const labelIndices = pickLabelIndices(count);

  return (
    <figure className={cn("flex flex-col gap-2", className)}>
      <div role="img" aria-label={ariaLabel} className="h-32 w-full">
        <svg
          viewBox={`0 0 ${count * SLOT} 104`}
          preserveAspectRatio="none"
          aria-hidden="true"
          className="h-full w-full"
        >
          {series.map((s, seriesIndex) =>
            s.values.map((value, i) => {
              if (value <= 0) return null;
              const height = Math.max(2, (value / max) * 100);
              const x = i * SLOT + GAP + seriesIndex * (barWidth + GAP);
              return (
                <rect
                  key={`${seriesIndex}-${i}`}
                  x={x}
                  y={BASELINE - height}
                  width={barWidth}
                  height={height}
                  rx={1.5}
                  className={s.className}
                />
              );
            }),
          )}
          <line
            x1={0}
            y1={BASELINE}
            x2={count * SLOT}
            y2={BASELINE}
            strokeWidth={1}
            className="stroke-line"
          />
        </svg>
      </div>
      {count > 1 && (
        <div
          aria-hidden="true"
          className="text-ink-muted flex justify-between text-[10px] tabular-nums"
        >
          {labelIndices.map((i) => (
            <span key={i}>{labels[i]}</span>
          ))}
        </div>
      )}
    </figure>
  );
}

function pickLabelIndices(count: number): number[] {
  if (count <= 1) return [0];
  if (count <= 10) return Array.from({ length: count }, (_, i) => i);
  return [
    ...new Set([
      0,
      Math.round((count - 1) / 3),
      Math.round((2 * (count - 1)) / 3),
      count - 1,
    ]),
  ];
}
