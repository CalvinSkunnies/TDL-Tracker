import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content Security Policy.
 *
 * `'unsafe-inline'` is required for scripts and styles because Next.js and
 * Tailwind emit inline bootstrap/style tags (and the theme script runs before
 * paint). A nonce-based policy would be stricter but needs every response to be
 * dynamically rendered; this app is a static export, so we accept inline and
 * lock down everything else (no external origins, no framing, no plugins).
 */
function contentSecurityPolicy(): string {
  const scriptSrc = isDev
    ? "'self' 'unsafe-inline' 'unsafe-eval'"
    : "'self' 'unsafe-inline'";
  const connectSrc = isDev ? "'self' ws: wss:" : "'self'";

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    `connect-src ${connectSrc}`,
    "manifest-src 'self'",
    "worker-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
  ].join("; ");
}

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy() },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Allow a service worker served at the domain root to control /tdl only,
        // which is what happens when the portfolio proxies the tracker in.
        source: "/sw.js",
        headers: [{ key: "Service-Worker-Allowed", value: "/tdl/" }],
      },
    ];
  },
  async redirects() {
    return [
      // Old tracker URLs from before the portfolio took over the root.
      { source: "/tracker", destination: "/tdl/tracker", permanent: false },
      { source: "/login", destination: "/tdl/login", permanent: false },
      {
        source: "/design-system",
        destination: "/tdl/design-system",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return {
      // The portfolio is static HTML, kept verbatim in public/portfolio.
      beforeFiles: [
        { source: "/", destination: "/portfolio/index.html" },
        { source: "/index.html", destination: "/portfolio/index.html" },
        { source: "/projects", destination: "/portfolio/projects.html" },
        { source: "/projects.html", destination: "/portfolio/projects.html" },
      ],
    };
  },
};

export default nextConfig;
