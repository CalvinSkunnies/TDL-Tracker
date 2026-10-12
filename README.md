# web-app

## Purpose

A web application scaffold built with Next.js (App Router), TypeScript and
Tailwind CSS, with ESLint and Prettier preconfigured and ready to deploy on
Vercel. This repository currently contains only the starter setup; features
will be added in later steps.

## Stack

- [Next.js](https://nextjs.org) (App Router, `app/` directory)
- TypeScript
- Tailwind CSS
- ESLint (with `eslint-config-next`) + Prettier (with the Tailwind class
  sorting plugin)

## Local development

Requires Node.js 20.9 or newer (Node 22 is recommended) and npm.

```bash
npm install        # install dependencies
npm run dev        # start the dev server at http://localhost:3000
npm run build      # create a production build
npm run start      # serve the production build locally
npm run lint       # run ESLint
npm run format     # format all files with Prettier
npm run format:check  # check formatting without writing changes
```

### Environment variables

Copy the example file and fill in values as needed:

```bash
cp .env.local.example .env.local
```

Two variables are required (see below). `.env.local` is gitignored; only
`.env.local.example` is committed. Variables prefixed with `NEXT_PUBLIC_` are
exposed to the browser; all others are server-only.

## Design system

A warm, editorial theme (cream surfaces, clay accent, Fraunces + Inter).
Tailwind v4 has no `tailwind.config` file; tokens for color, fonts, radii,
shadows and motion live in the `@theme` block in `app/globals.css`.

- Primitives: `components/ui/` (Button, Card, Input, Textarea, Checkbox,
  Badge, Modal, Tabs). Import from `@/components/ui`.
- Layout shell: `components/layout/site-nav.tsx` and the container in
  `app/layout.tsx`.
- Review everything at `/design-system` while running `npm run dev`.
- Fonts are self-hosted through `@fontsource-variable/*` and `next/font/local`.
- Dark mode: the same token names are remapped under `[data-theme="dark"]`
  (and `prefers-color-scheme` until the user picks). The nav toggle stores the
  choice; an inline script in `app/layout.tsx` applies it before first paint.

## Private access gate

Every route except `/login` requires a signed session cookie.

- `proxy.ts` runs before any page renders and redirects visitors without a
  valid cookie to `/login`. (Next.js 16 renamed `middleware.ts` to `proxy.ts`;
  it is the same feature, and it runs on the Node.js runtime.)
- `/login` takes one passphrase (`APP_PASSPHRASE`). It is compared in constant
  time; wrong guesses are delayed by 700 ms.
- On success the server sets an HS256 JWT (via `jose`) signed with
  `AUTH_SECRET`, valid for 7 days. Cookie flags: `HttpOnly`, `Secure` (in
  production), `SameSite=Lax`, `Path=/`, and the `__Host-` prefix in
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
