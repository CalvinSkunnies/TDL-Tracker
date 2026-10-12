"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "./theme-toggle";

const links = [
  { href: "/", label: "Tasks" },
  { href: "/design-system", label: "Design system" },
];

const itemClasses =
  "focus-visible:outline-clay-500 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2";

export function SiteNav() {
  const pathname = usePathname();
  // Signed-out visitors only ever see /login, so hide the app links there.
  const signedOutView = pathname === "/login";

  return (
    <header className="border-line bg-cream-50/85 sticky top-0 z-40 border-b backdrop-blur">
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-5 sm:px-8"
      >
        <Link
          href="/"
          className="font-display text-ink hover:text-clay-700 focus-visible:outline-clay-500 text-xl font-medium tracking-tight transition-colors focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          web-app
        </Link>
        <ul className="flex items-center gap-1">
          {!signedOutView &&
            links.map(({ href, label }) => {
              const active = pathname === href;
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
          <li className="ml-1">
            <ThemeToggle />
          </li>
        </ul>
      </nav>
    </header>
  );
}
