"use client";

import { useState, type Ref } from "react";
import { Button, Input } from "@/components/ui";

interface QuickAddProps {
  onAdd: (title: string) => boolean;
  disabled?: boolean;
  inputRef?: Ref<HTMLInputElement>;
}

/** Type a title, press Enter. Everything else is edited in the detail dialog. */
export function QuickAdd({ onAdd, disabled, inputRef }: QuickAddProps) {
  const [title, setTitle] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (onAdd(title)) setTitle("");
  }

  return (
    <form onSubmit={submit} className="flex items-start gap-2">
      <Input
        ref={inputRef}
        aria-label="Add a task"
        placeholder="Add a task and press Enter"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        disabled={disabled}
        maxLength={200}
        autoComplete="off"
        className="h-12 text-base"
      />
      <Button
        type="submit"
        size="lg"
        disabled={disabled || title.trim() === ""}
        className="shrink-0"
      >
        Add
      </Button>
    </form>
  );
}
