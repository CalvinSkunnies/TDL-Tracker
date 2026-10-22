"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/tdl/login/actions";
import { cn } from "@/lib/cn";
import { NotepadMark } from "./notepad-mark";
import { ThemeToggle } from "./theme-toggle";

const links = [
  { href: "/tdl/tracker", label: "Tasks" },
  { href: "/tdl/design-system", label: "Design system" },
];

const itemClasses =
  "focus-visible:outline-clay-500 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  // Navigating always closes the mobile menu (render-time state adjustment).
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  // Signed-out visitors only ever see /tdl/login, so hide the app links there.
  const signedOutView = pathname === "/tdl/login";

  return (
    <header className="border-line bg-cream-50/85 sticky top-0 z-40 border-b backdrop-blur">
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-5 sm:px-8"
      >
        <Link
          href="/tdl/tracker"
          aria-label="Notepad — your tasks"
          className="text-ink hover:text-clay-700 focus-visible:outline-clay-500 flex items-center gap-2.5 transition-colors focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          <span className="bg-clay-100 text-clay-700 grid size-9 place-items-center rounded-lg">
            <NotepadMark className="size-5" />
          </span>
          <span className="font-display text-xl font-medium tracking-tight">
            Notepad
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <ul className="hidden items-center gap-1 sm:flex">
            {!signedOutView &&
              links.map(({ href, label }) => {
                const active = isActive(pathname, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        itemClasses,
                        active
                          ? "bg-cream-200 text-ink"
                          : "text-ink-muted hover:bg-cream-200/70 hover:text-ink",
                      )}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            {!signedOutView && (
              <li>
                <form action={logout}>
                  <button
                    type="submit"
                    className={cn(
                      itemClasses,
                      "text-ink-muted hover:bg-cream-200/70 hover:text-ink cursor-pointer",
                    )}
                  >
                    Log out
                  </button>
                </form>
              </li>
            )}
          </ul>

          <ThemeToggle />

          {!signedOutView && (
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="text-ink-muted hover:bg-cream-200/70 hover:text-ink focus-visible:outline-clay-500 grid size-9 place-items-center rounded-lg transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 sm:hidden"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              >
                {open ? (
                  <path d="M6 6l12 12M18 6L6 18" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          )}
        </div>
      </nav>

      {open && !signedOutView && (
        <div
          id="mobile-menu"
          className="border-line bg-cream-50/95 border-t backdrop-blur sm:hidden"
        >
          <ul className="mx-auto flex w-full max-w-4xl flex-col gap-1 px-5 py-3">
            {links.map(({ href, label }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      itemClasses,
                      "block",
                      active
                        ? "bg-cream-200 text-ink"
                        : "text-ink-muted hover:bg-cream-200/70 hover:text-ink",
                    )}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
            <li>
              <form action={logout}>
                <button
                  type="submit"
                  className={cn(
                    itemClasses,
                    "text-ink-muted hover:bg-cream-200/70 hover:text-ink w-full cursor-pointer text-left",
                  )}
                >
                  Log out
                </button>
              </form>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
