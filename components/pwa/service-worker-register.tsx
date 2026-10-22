"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (production only, so it never interferes with
 * the dev server's fast refresh). Renders nothing.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/tdl/" })
        .catch(() => {
          // Registration can fail on unsupported or sandboxed hosts; the app
          // still works, just without offline caching.
        });
    };
    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
