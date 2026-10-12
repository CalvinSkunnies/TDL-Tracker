import type { ReactNode } from "react";
import { Button } from "@/components/ui";

/** Skeleton shown on the server and for the instant before localStorage loads. */
export function LoadingState() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading your tasks…</span>
      <ul aria-hidden="true" className="flex flex-col gap-2.5">
        {[0, 1, 2].map((i) => (
          <li
            key={i}
            className="border-line bg-cream-50 flex items-center gap-3 rounded-xl border p-3.5"
          >
            <div className="bg-cream-200 size-5 animate-pulse rounded-md" />
            <div className="flex-1 space-y-2">
              <div
                className="bg-cream-200 h-4 animate-pulse rounded"
                style={{ width: `${70 - i * 15}%` }}
              />
              <div className="bg-cream-200 h-3 w-24 animate-pulse rounded" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Message({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="border-line rounded-2xl border border-dashed px-6 py-14 text-center">
      <div className="bg-clay-100 text-clay-700 mx-auto mb-5 grid size-12 place-items-center rounded-full">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6">
          <path
            d="M5 12.5l4.5 4.5L19 7.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2 className="font-display text-2xl font-medium tracking-tight">
        {title}
      </h2>
      <p className="text-ink-muted mx-auto mt-2 max-w-sm text-sm">{children}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <Message
      title="A clear day ahead"
      action={<Button onClick={onAdd}>Add your first task</Button>}
    >
      Nothing on your list yet. Capture the first thing on your mind. Tasks are
      saved in this browser only.
    </Message>
  );
}

export function NoResultsState({ onClear }: { onClear: () => void }) {
  return (
    <Message
      title="No matching tasks"
      action={
        <Button variant="secondary" onClick={onClear}>
          Clear filters
        </Button>
      }
    >
      Nothing fits the current search and filters.
    </Message>
  );
}
