import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SiteNav } from "@/components/layout/site-nav";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import "./globals.css";

const fraunces = localFont({
  src: "../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-opsz-normal.woff2",
  variable: "--font-fraunces",
  weight: "100 900",
  display: "swap",
});

const inter = localFont({
  src: "../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Notepad",
  description: "A private task and workload notepad.",
  // Private site: ask search engines not to index it.
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "Notepad", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#d97757",
  colorScheme: "light dark",
};

/**
 * Runs before first paint: saved choice wins, otherwise the OS setting.
 * Sets data-theme on <html> so there is no flash of the wrong theme.
 */
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <SiteNav />
        <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-12 sm:px-8 sm:py-16">
          {children}
        </main>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
