"use client";

import { useEffect, useState } from "react";
import { AuroraFlow } from "@/components/ui/aurora-flow";

/**
 * Futuristic dark background for the tracker, built on Componentry's
 * Aurora Flow (vendored in components/ui/aurora-flow.tsx).
 *
 * - Only renders in dark mode. The theme toggle flips `data-theme` on
 *   <html>, so this watches that attribute and mounts/unmounts the
 *   WebGL canvas accordingly — light mode pays nothing for it.
 * - Fixed behind everything (`-z-10`), with the page background
 *   transparent in dark mode (see app/globals.css) so the aurora
 *   shows through. The <html> element carries the solid dark base.
 * - Calm settings on purpose: slow, dim, no pointer bending. This
 *   is a productivity app, not a landing page — the background
 *   should feel alive, not demand attention.
 * - Reduced motion is handled inside Aurora Flow itself: it draws
 *   one static frame and never animates.
 * - If WebGL is unavailable, Aurora Flow falls back to a static
 *   gradient built from the same palette, so the page still looks
 *   finished instead of breaking.
 */
export function AuroraBackground() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.dataset.theme === "dark");
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  if (!isDark) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <AuroraFlow
        preset="midnight"
        className="h-full w-full"
        opacity={0.55}
        speed={0.6}
        intensity={0.8}
        grainOpacity={0.18}
        pointerInteraction={false}
        scrollInteraction={false}
      />
    </div>
  );
}
