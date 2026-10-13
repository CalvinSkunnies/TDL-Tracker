"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";

/** ms -> "m:ss" under an hour, "h:mm:ss" above. */
export function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const ss = String(s).padStart(2, "0");
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${ss}`;
  return `${m}:${ss}`;
}

interface TaskTimerProps {
  title: string;
  /** ISO timestamp while running, else null. */
  startedAt: string | null;
  onStart: () => void;
  onStop: () => void;
}

/**
 * A per-task stopwatch. While running it re-renders every second; the elapsed
 * time is banked into `actualMinutes` by the store when stopped.
 */
export function TaskTimer({ title, startedAt, onStart, onStop }: TaskTimerProps) {
  // Null until the first tick after mount, so no wall-clock read during render.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!startedAt) return;
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [startedAt]);

  if (startedAt) {
    const started = Date.parse(startedAt);
    const elapsed = Number.isNaN(started) || now === null ? 0 : now - started;
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={onStop}
        aria-label={`Stop timer for "${title}"`}
        className="tabular-nums"
      >
        <span className="text-danger" aria-hidden="true">
          ●
        </span>
        {formatElapsed(elapsed)}
        <span className="text-ink-muted">Stop</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onStart}
      aria-label={`Start timer for "${title}"`}
    >
      Start timer
    </Button>
  );
}
