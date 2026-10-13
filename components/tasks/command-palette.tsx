"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "@/components/ui";
import { cn } from "@/lib/cn";

export interface Command {
  id: string;
  label: string;
  hint?: string;
  run: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  commands: Command[];
  onClose: () => void;
}

/** A keyboard-first launcher (Cmd/Ctrl+K). */
export function CommandPalette({ open, commands, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [lastOpen, setLastOpen] = useState(open);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset the query each time it opens (render-time state adjustment).
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setQuery("");
      setActive(0);
    }
  }

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((command) =>
      command.label.toLowerCase().includes(q),
    );
  }, [commands, query]);

  const activeIndex = Math.min(active, Math.max(0, results.length - 1));

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  function runCommand(command: Command | undefined) {
    if (!command) return;
    onClose();
    command.run();
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive(Math.min(activeIndex + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive(Math.max(activeIndex - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      runCommand(results[activeIndex]);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Quick actions">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
        }}
        onKeyDown={onKeyDown}
        placeholder="Type a command…"
        aria-label="Search commands"
        autoComplete="off"
        className="border-line bg-raised text-ink focus:border-clay-500 h-11 w-full rounded-xl border px-3 text-sm outline-none"
      />
      <ul className="mt-3 max-h-72 overflow-y-auto" role="listbox">
        {results.length === 0 ? (
          <li className="text-ink-muted px-3 py-6 text-center text-sm">
            No matching commands.
          </li>
        ) : (
          results.map((command, i) => (
            <li key={command.id}>
              <button
                type="button"
                role="option"
                aria-selected={i === activeIndex}
                onMouseEnter={() => setActive(i)}
                onClick={() => runCommand(command)}
                className={cn(
                  "flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  i === activeIndex
                    ? "bg-cream-200 text-ink"
                    : "text-ink-soft hover:bg-cream-200/70",
                )}
              >
                <span>{command.label}</span>
                {command.hint && (
                  <kbd className="text-ink-muted font-sans text-xs">
                    {command.hint}
                  </kbd>
                )}
              </button>
            </li>
          ))
        )}
      </ul>
    </Modal>
  );
}
