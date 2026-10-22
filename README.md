# Notepad

A private, offline-capable personal task and workload tracker built with
Next.js (App Router), TypeScript and Tailwind CSS. It is gated behind a single
passphrase and keeps all data in the browser — there is no backend, database or
external API.

## Stack

- [Next.js](https://nextjs.org) 16 (App Router, `app/` directory; `proxy.ts`
  replaces the old `middleware.ts`)
- TypeScript
- Tailwind CSS v4
- `jose` for the signed session cookie
- ESLint (with `eslint-config-next`) + Prettier (with the Tailwind class
  sorting plugin)

## Local development

Requires Node.js 20.9 or newer (Node 22 is recommended) and npm.

```bash
npm install           # install dependencies
npm run dev           # start the dev server at http://localhost:3000
npm run build         # create a production build
npm run start         # serve the production build locally
npm run lint          # run ESLint
npm run format        # format all files with Prettier
npm run format:check  # check formatting without writing changes
```

One Next.js app now serves two things:

- the public portfolio at **`/`** and **`/projects`** (static HTML kept verbatim
  in `public/portfolio/`, mapped by rewrites in `next.config.ts`)
- the private tracker at **`/tdl/tracker`** (`/tdl` redirects there), with
  **`/tdl/design-system`** previewing the UI primitives

All tracker URLs live under `/tdl`, so the portfolio owns the root of the domain
and the gate only has to protect one prefix.

### Environment variables

Copy the example file and fill in values as needed:

```bash
cp .env.local.example .env.local
```

Two variables are required (see [Private access gate](#private-access-gate)).
`.env.local` is gitignored; only `.env.local.example` is committed. Variables
prefixed with `NEXT_PUBLIC_` are exposed to the browser; all others are
server-only.

## Design system

A warm, editorial theme (cream surfaces, clay accent, Fraunces + Inter).
Tailwind v4 has no `tailwind.config` file; tokens for color, fonts, radii,
shadows and motion live in the `@theme` block in `app/globals.css`.

- Primitives: `components/ui/` (Button, Card, Input, Textarea, Checkbox,
  Badge, Modal, Tabs). Import from `@/components/ui`.
- Layout shell: `components/layout/site-nav.tsx` and the container in
  `app/layout.tsx`. The nav collapses to a menu button on small screens.
- Review everything at `/tdl/design-system` while running `npm run dev`.
- Fonts are self-hosted through `@fontsource-variable/*` and `next/font/local`.
- Dark mode: the same token names are remapped under `[data-theme="dark"]`.
  The nav toggle stores the choice; an inline script applies it before first
  paint. The whole app respects `prefers-reduced-motion`.

## Task tracker

The tracker (`/tdl/tracker`) keeps everything in this browser's `localStorage`;
nothing is sent anywhere.

- **Data model:** `lib/types.ts`. Domain logic (validation, recurrence,
  filtering, grouping) is in `lib/tasks.ts`.
- **Storage:** `lib/store.ts` keeps
  `{ version, tasks, templates, journal, settings }` under the key
  `tdl-tracker:data`. It is SSR-safe (no `window` access on the server), syncs
  across tabs, and reports blocked, full or unreadable storage in the UI.
  Writes are debounced (coalesced) and flushed on page hide.
- **Hook:** `useTasks()` in `lib/use-tasks.ts` exposes `tasks`, `templates`,
  `journal`, `settings` and actions (`addTask`, `saveTask`, `deleteTask`,
  `deleteSeries`, `toggleStatus`, `startTimer`, `stopTimer`,
  `setDailyCapacityHours`, `setJournalEntry`, `exportData`, `importData`) plus
  derived lists.
- **Schema changes:** bump `SCHEMA_VERSION` in `lib/store.ts` and add a
  migration to the `migrations` map, keyed by the version it upgrades from.
  Unreadable data is copied to `tdl-tracker:data:backup` instead of being
  overwritten.
- **Recurring tasks (series + instances):** a series is a `TaskTemplate`;
  each day the app generates at most one instance per `(seriesId,
  instanceDate)` and never backfills past days. Editing or deleting an
  instance can apply to *this task only* or *this and all future* instances.
- **Time tracking:** each task has an estimate and a running stopwatch; when
  stopped, elapsed time is banked into the task's actual minutes, and the row
  flags whether it ran over or under the estimate.
- **Daily capacity:** today's open-task estimates are totalled against a
  configurable hours target (`settings.dailyCapacityHours`).
- **Insights:** `lib/insights.ts` derives completion rate, focused time per
  day, estimate-vs-actual, the current completion streak and overload warnings
  for a 7- or 30-day window. Charts are dependency-free inline SVG
  (`components/tasks/charts.tsx`).
- **Journal:** one free-form end-of-day entry per date, keyed by `YYYY-MM-DD`.
- **Feedback:** actions raise toasts (`components/tasks/toaster.tsx`); a
  route-level error boundary (`app/error.tsx`) keeps the UI recoverable.
- **Keyboard:** `Cmd/Ctrl+K` opens the command palette, `n` focuses quick add,
  `/` focuses search, Enter on a title opens the editor, Escape closes dialogs.
- Data is per browser and per origin; clearing site data erases it. See
  [Backup & export](#backup--export).

## Private access gate

Every route under `/tdl` except `/tdl/login` requires a signed session cookie.
The portfolio at `/` and `/projects` is public, and the PWA files the browser
must fetch without a session (`/sw.js`, `/manifest.webmanifest`,
`/offline.html`) and static assets are excluded from the gate.

- `proxy.ts` runs before any page renders and redirects visitors without a
  valid cookie to `/tdl/login`. (Next.js 16 renamed `middleware.ts` to
  `proxy.ts`; it is the same feature, and it runs on the Node.js runtime.)
- `/tdl/login` takes one passphrase (`APP_PASSPHRASE`). It is compared in
  constant time; wrong guesses are delayed by 700 ms, and five failures from the
  same IP within 15 minutes trigger a 15-minute lockout
  (`lib/login-throttle.ts`).
- On success the server sets an HS256 JWT (via `jose`) signed with
  `AUTH_SECRET`, valid for 7 days. Cookie flags: `HttpOnly`, `Secure` (in
  production), `SameSite=Strict`, `Path=/`, and the `__Host-` prefix in
  production. JavaScript cannot read it, and the browser only sends it over
  HTTPS to this exact host.
- **Log out** in the nav clears the cookie.
- It fails closed: if either variable is missing (or `AUTH_SECRET` is shorter
  than 32 characters), nobody can sign in.
- Changing `APP_PASSPHRASE` or `AUTH_SECRET` signs out every session.

Why not client-only auth: a client-side check runs after the page and its data
have already been sent, so anyone can read the source, disable the script or
call the endpoints directly. Here the check happens on the server before
anything is rendered, and the proof of login is a cookie that scripts cannot
read or forge without `AUTH_SECRET`.

Generate a secret with `openssl rand -base64 32`.

> The login lockout is held in memory, so on serverless hosting it survives
> only on a warm instance. It discourages brute force but is not a hard cap; back
> it with shared storage (e.g. Vercel KV / Upstash Redis) if you need one.

### Troubleshooting sign-in

| Symptom | Cause and fix |
| --- | --- |
| "Sign-in isn't configured on this server yet." | `AUTH_SECRET` (32+ chars) and/or `APP_PASSPHRASE` is missing at runtime. Check **Vercel → Settings → Environment Variables** for both, then **redeploy** — env changes only apply to new deployments. The server log names the exact variable: Vercel → **Logs** → look for `[auth] sign-in unavailable: …`. |
| "That passphrase isn't right." | The value typed differs from `APP_PASSPHRASE` (watch for stray spaces, and note the comparison is exact). |
| "Too many attempts." | Five failures from your IP triggered the 15-minute lockout. Wait it out, or restart the deployment to reset the in-memory counter. |
| Redirected to `/tdl/login` on every visit | The session cookie was not stored or was dropped: it requires HTTPS (`Secure`) and the `__Host-` prefix, so use the production domain, not `http://localhost`. |

## Portfolio and URL layout

The portfolio is a static site copied verbatim into `public/portfolio/`, with its
assets in `public/assets/`. `next.config.ts` rewrites `/` and `/index.html` to
`portfolio/index.html`, and `/projects` and `/projects.html` to
`portfolio/projects.html`. Its nav has a **Tracker** link to `/tdl/tracker`.

The tracker occupies `/tdl/*`:

| Path | What it is |
| --- | --- |
| `/tdl` | Redirects to `/tdl/tracker` |
| `/tdl/tracker` | The task app (behind the gate) |
| `/tdl/login` | Passphrase form |
| `/tdl/design-system` | UI primitives reference (behind the gate) |

**Keeping the portfolio project.** The static portfolio can stay the entry point
on `calvinskunnies.vercel.app`; its `vercel.json` proxies the tracker in with
external rewrites (`/tdl/*`, `/_next/*`, and the PWA files), so the browser stays
on the portfolio domain and the session cookie is stored there. The tracker
deployment (`calvinskunniestdl.vercel.app`) keeps serving the same app directly.
Alternatively, move the domain to this project and retire the static deploy.

You **cannot** create subdomains of `*.vercel.app` — Vercel owns that domain. A
name like `todo.yourdomain.com` requires owning a custom domain.

### Adding a custom domain (optional)

1. In the Vercel project: **Settings > Domains > Add**, enter
   `todo.yourdomain.com`, and choose the project to attach it to.
2. At your DNS provider, create a **CNAME** record pointing the subdomain to
   `cname.vercel-dns.com`:
   - Host: `todo`
   - Type: `CNAME`
   - Value: `cname.vercel-dns.com`
   - TTL: automatic / 300s
3. For an apex domain (`yourdomain.com`) use an **A** record to `76.76.21.21`
   instead, or point the nameservers at Vercel.
4. Wait for DNS to propagate; Vercel issues a TLS certificate automatically.
   The portfolio then lives at `https://todo.yourdomain.com` and the tracker at
   `https://todo.yourdomain.com/tdl/tracker`.

Set `NEXT_PUBLIC_APP_URL` (optional) to the custom domain for your own
reference; the app does not require it.

## PWA / offline

- `app/manifest.ts` serves `/manifest.webmanifest` (name, theme colors,
  `start_url: /tdl/tracker`). `app/icon.svg` is the app icon.
- `public/sw.js` caches the app shell: navigations are network-first with an
  offline fallback (`public/offline.html`); other same-origin GETs use
  stale-while-revalidate.
- `components/pwa/service-worker-register.tsx` registers the worker in
  production only (so it never fights the dev server).
- Tasks live in `localStorage`, which the service worker never touches, so your
  data persists across reloads, reinstalls and offline sessions.
- Chromium install banners are happiest with raster 192px and 512px PNG icons.
  The SVG icon works, but add `public/icon-192.png` and `public/icon-512.png`
  and list them in `app/manifest.ts` for the richest install UI.

## Backup & export

`localStorage` is **per browser and per origin**, so data does not sync between
devices and is lost if you clear site data.

- **Export** (header button, or **Cmd/Ctrl+K > Export backup**) downloads a JSON
  file (`tdl-tracker-YYYY-MM-DD.json`) with everything.
- **Import** (header button) replaces all current data from that file after a
  confirmation prompt.
- Export before clearing site data, switching browsers, or moving devices.

## Rotating the passphrase

1. Change `APP_PASSPHRASE` (and, if you wish, `AUTH_SECRET`) in
   **Vercel > Settings > Environment Variables**, then **Redeploy**.
2. Because the signing key is derived from both values, every existing session
   is invalidated immediately and everyone must sign in again.
3. Update `.env.local` locally so development matches.

## Security checklist

- [x] Middleware/proxy protects every `/tdl` route except `/tdl/login`; the
      portfolio at `/` stays public, as do the PWA assets.
- [x] Session cookie is `HttpOnly`, `Secure` (prod), `SameSite=Strict`, `Path=/`
      with the `__Host-` prefix in production.
- [x] Login has a constant-time compare, a fixed delay, and an IP lockout after
      five failures.
- [x] Security headers set in `next.config.ts`: CSP, `X-Frame-Options: DENY`,
      `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
      `Permissions-Policy`, and HSTS. `X-Powered-By` is disabled.
- [x] `.env*` is gitignored (only `.env.local.example` is committed); no secrets
      are in the repo.

## Deploy on Vercel

Pushing to `main` deploys to production automatically once the repository is
connected to Vercel.

1. Push this repository to GitHub (the default branch should be `main`).
2. Sign in at [vercel.com](https://vercel.com) (choose **Continue with
   GitHub** if you want the GitHub connection set up during sign-in).
3. Click **Add New... > Project**.
4. Under **Import Git Repository**, find this repository. If it is not listed,
   click **Adjust GitHub App Permissions**, grant the Vercel GitHub App access
   to the repository, then return.
5. Click **Import**. Vercel detects Next.js automatically; leave the defaults
   (Framework Preset: Next.js, Build Command: `next build`, Output Directory:
   default, Install Command: `npm install`).
6. Under **Environment Variables**, add `APP_PASSPHRASE` and `AUTH_SECRET`
   (see below). Without them nobody can sign in.
7. Click **Deploy**.

After the first deploy:

- Every push to `main` triggers a new **production** deployment.
- Every push to another branch or pull request creates a **preview**
  deployment with its own URL.
- To confirm the production branch, open **Project Settings > Git** and check
  that **Production Branch** is `main`.
- To set the gate's variables on an existing project: **Project Settings >
  Environment Variables**, add `APP_PASSPHRASE` and `AUTH_SECRET` (leave
  **Sensitive** on, tick Production and Preview, and do not add a
  `NEXT_PUBLIC_` prefix), then **Redeploy** so the new values take effect.
  Locally, put the same two lines in `.env.local`.
- Environment variables can be changed later under **Project Settings >
  Environment Variables**; redeploy for changes to take effect.
- **Option 1 — keep the portfolio project (multi-zone):** add the `vercel.json`
  from the portfolio repo (it proxies `/tdl/*`, `/_next/*`, `/sw.js`,
  `/offline.html`, `/manifest.webmanifest`, and `/icon.svg` to
  `https://calvinskunniestdl.vercel.app`), commit and redeploy the portfolio. No
  domain change is needed; `calvinskunnies.vercel.app/tdl/tracker` then serves
  this deployment.
- **Option 2 — move the domain:** remove `calvinskunnies.vercel.app` from the
  portfolio project's **Settings > Domains**, add it to this project instead,
  and delete the old static deployment once it resolves here.

### Manual checklist (things only you can do)

1. **Vercel env vars** — set `APP_PASSPHRASE` (a long unique phrase) and
   `AUTH_SECRET` (`openssl rand -base64 32`, 32+ chars) for Production and
   Preview, then redeploy.
2. **Domain DNS** (optional) — add the custom domain in Vercel and the
   `CNAME`/`A` record at your DNS provider as described above.
3. **First login** — open `https://<your-project>.vercel.app/tdl/tracker`, get
   redirected to `/tdl/login`, enter the passphrase.
4. **Export a backup** once you have data, and again before clearing site data.
