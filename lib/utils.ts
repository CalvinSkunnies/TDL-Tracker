import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Class-name helper for the vendored Componentry components
 * (components/ui/aurora-flow.tsx, kinetic-text-reveal.tsx,
 * webgl-error-boundary.tsx), which import `cn` from "@/lib/utils"
 * the way shadcn registries expect.
 *
 * The app's own components keep using "@/lib/cn" — this file only
 * exists so the vendored files stay byte-identical to upstream
 * (apart from their attribution header).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
