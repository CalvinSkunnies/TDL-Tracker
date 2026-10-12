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

No variables are required yet. `.env.local` is gitignored; only
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
6. Under **Environment Variables**, add anything from `.env.local.example`
   that the app needs (none are required yet).
7. Click **Deploy**.

After the first deploy:

- Every push to `main` triggers a new **production** deployment.
- Every push to another branch or pull request creates a **preview**
  deployment with its own URL.
- To confirm the production branch, open **Project Settings > Git** and check
  that **Production Branch** is `main`.
- Environment variables can be changed later under **Project Settings >
  Environment Variables**; redeploy for changes to take effect.
