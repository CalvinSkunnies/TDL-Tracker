import type { Metadata } from "next";
import { Journal } from "@/components/tasks/journal";
import { useTasks } from "@/lib/use-tasks";
import { useToday } from "@/lib/use-today";

export const metadata: Metadata = { title: "Journal · TDL Tracker" };

export default function JournalPage() {
  const { journal, setJournalEntry } = useTasks();
  const today = useToday();

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-medium tracking-tight">
          Journal
        </h1>
        <p className="text-ink-muted mt-2 text-sm" aria-live="polite">
          Your end-of-day reflections and notes
        </p>
      </header>

      <Journal today={today} entries={journal} onChange={setJournalEntry} />
    </div>
  );
}