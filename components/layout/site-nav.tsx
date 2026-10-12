"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "./theme-toggle";

const links = [
  { href: "/", label: "Home" },
  { href: "/design-system", label: "Design system" },
];

export function SiteNav() {
  const pathname = usePathname();

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
          {links.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "focus-visible:outline-clay-500 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2",
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
          <li className="ml-1">
            <ThemeToggle />
          </li>
        </ul>
      </nav>
    </header>
  );
}
