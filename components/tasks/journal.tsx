"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui";
import { parseDateString } from "@/lib/tasks";

interface JournalProps {
  /** "YYYY-MM-DD" in local time. */
  today: string;
  entries: Record<string, string>;
  onChange: (date: string, text: string) => void;
}

const shortDate = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
});

/** One free-form entry per day; saved when the field loses focus. */
export function Journal({ today, entries, onChange }: JournalProps) {
  const stored = entries[today] ?? "";
  const [draft, setDraft] = useState(() => ({ date: today, text: stored }));

  // When the day rolls over, start fresh instead of carrying over yesterday.
  if (draft.date !== today) setDraft({ date: today, text: stored });

  const text = draft.text;
  const setText = (value: string) => setDraft({ date: today, text: value });

  const past = Object.entries(entries)
    .filter(([date, value]) => date !== today && value.trim() !== "")
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 5);

  return (
    <section aria-labelledby="journal-heading">
      <h2
        id="journal-heading"
        className="font-display mb-3 text-xl font-medium tracking-tight"
      >
        End-of-day journal
      </h2>
      <Textarea
        aria-label={`Journal for ${today}`}
        placeholder="How did today go? What moved, what stalled?"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={() => onChange(today, text)}
        rows={4}
        hint="Saved when you click away. Stored in this browser only."
      />

      {past.length > 0 && (
        <div className="mt-5">
          <h3 className="text-ink-muted text-xs font-medium tracking-wide uppercase">
            Previous entries
          </h3>
          <ul className="mt-2 flex flex-col gap-3">
            {past.map(([date, value]) => (
              <li
                key={date}
                className="border-line rounded-xl border px-4 py-3"
              >
                <p className="text-ink-muted text-xs tabular-nums">
                  {shortDate.format(parseDateString(date))}
                </p>
                <p className="text-ink-soft mt-1 text-sm whitespace-pre-wrap">
                  {value}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
