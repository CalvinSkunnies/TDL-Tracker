"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui";

interface DataControlsProps {
  /** "YYYY-MM-DD", used in the export filename. */
  today: string;
  onExport: () => string;
  onImport: (text: string) => boolean;
}

/** Export / import the whole localStorage payload as a JSON backup. */
export function DataControls({ today, onExport, onImport }: DataControlsProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");

  function handleExport() {
    const text = onExport();
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tdl-tracker-${today || "backup"}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMessage("Exported.");
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const text = await file.text();
    if (
      !window.confirm(
        "Importing replaces all current tasks, series, journal and settings. Continue?",
      )
    ) {
      return;
    }
    setMessage(onImport(text) ? "Imported." : "That file could not be read.");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" size="sm" onClick={handleExport}>
        Export
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => fileRef.current?.click()}
      >
        Import
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        onChange={handleFile}
      />
      {message && (
        <span role="status" className="text-ink-muted text-xs">
          {message}
        </span>
      )}
    </div>
  );
}
