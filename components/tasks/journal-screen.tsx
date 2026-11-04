"use client";

import Link from "next/link";
import { useTasks } from "@/lib/use-tasks";
import { useToday } from "@/lib/use-today";
import { Journal } from "./journal";
import { LoadingState } from "./states";

/** The journal gets its own page so the task list stays about tasks. */
export function JournalScreen() {
  const { journal, isLoading, setJournalEntry } = useTasks();
  const today = useToday();

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-8">
        <Link
          href="/tdl/tracker"
          className="text-ink-muted hover:text-ink focus-visible:outline-clay-500 rounded-md text-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          ← Back to tasks
        </Link>
        <h1 className="font-display mt-3 text-4xl font-medium tracking-tight sm:text-5xl">
          Journal
        </h1>
        <p className="text-ink-muted mt-2 text-base">
          A few lines at the end of the day. Stored in this browser only.
        </p>
      </header>

      {isLoading ? (
        <LoadingState />
      ) : (
        <Journal
          title="Today"
          today={today}
          entries={journal}
          onChange={setJournalEntry}
        />
      )}
    </div>
  );
}
