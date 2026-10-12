"use client";

/**
 * Flips between light and dark and remembers the choice. The initial theme is
 * resolved before first paint by THEME_SCRIPT in the root layout, so this only
 * has to react to clicks. Both icons are in the DOM and swapped with CSS, which
 * keeps server and client markup identical (no hydration mismatch).
 */
export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Storage can be blocked (private mode); the theme still applies for this visit.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle color theme"
      title="Toggle color theme"
      className="text-ink-muted hover:bg-cream-200/70 hover:text-ink focus-visible:outline-clay-500 grid size-9 place-items-center rounded-lg transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {/* Moon: shown in light mode */}
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="size-[18px] dark:hidden"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
      </svg>
      {/* Sun: shown in dark mode */}
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="hidden size-[18px] dark:block"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
      </svg>
    </button>
  );
}
