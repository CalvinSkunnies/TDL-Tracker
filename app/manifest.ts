import type { MetadataRoute } from "next";

/**
 * PWA manifest (served at /manifest.webmanifest). The icon is an SVG so it
 * scales to any size; add raster 192/512 PNGs alongside /icon.svg later if you
 * want the richest install UI on every platform.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "web-app task tracker",
    short_name: "Tasks",
    description:
      "A private, offline-capable personal task and workload tracker.",
    start_url: "/tracker",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#faf9f5",
    theme_color: "#d97757",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "192x192" },
      { src: "/icon.svg", type: "image/svg+xml", sizes: "512x512" },
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
    ],
  };
}
