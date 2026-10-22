interface NotepadMarkProps {
  className?: string;
}

/** Notepad glyph used as the site mark. Inherits its color from `currentColor`. */
export function NotepadMark({ className }: NotepadMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 3.5h10A1.5 1.5 0 0 1 18.5 5v14a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5Z" />
      <path d="M9.5 3.5v17" />
      <path d="M12.5 8.5h3.5M12.5 12h3.5M12.5 15.5h2.5" />
    </svg>
  );
}
