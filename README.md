# The EWU Express

The EWU Express is the student news publication of East West University — a campus media platform where stories are published without a category and assigned editorially, subscribers get new stories by email (double opt-in), and everything is run from a password-protected admin dashboard. It is deployed at [theewuexpress.online](https://theewuexpress.online) and actively run by the editorial team.

**Status:** deployed and actively run campus product.

![The EWU Express feed](docs/screenshot-feed.png)

## Features

- **Social Media-Style Feed** — Infinite scroll, featured carousel, trending system
- **Clean Article Pages** — Distraction-free reading with hero images, share buttons, view counts
- **Modern Admin Dashboard** — Rich text editor (Tiptap), image uploads, category assignment queue, analytics, authentication
- **Category Workflow** — Posts can be published without a category, then assigned individually from the admin panel
- **Newsletter** — Double opt-in subscriptions, queue-based delivery, unsubscribe links in every email
- **Turso Cloud Database** — Persistent SQLite-compatible storage (no data loss on redeploy)
- **Dark/Light Mode** — System-aware theme switching
- **Search** — Full-text search across stories
- **Categories** — Campus Heat, Stories, Events, Did You Know?
- **Responsive** — Mobile-first design with swipeable featured carousel
- **SEO Optimized** — Per-page titles and canonicals, Open Graph + Twitter cards with generated fallbacks, JSON-LD structured data, sitemap, robots.txt, RSS feed at `/rss` (see [SEO](#seo))

## Screenshots

| Feed | Article |
| --- | --- |
| ![Feed](docs/screenshot-feed.png) | ![Article page](docs/screenshot-article.png) |

| Admin login | |
| --- | --- |
| ![Admin login](docs/screenshot-admin-login.png) | |

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + Typography plugin
- **Database:** Turso (libSQL) with local SQLite fallback
- **ORM:** Drizzle ORM
- **Editor:** Tiptap 3 (WYSIWYG rich text)
- **Auth:** NextAuth.js v5
- **Animations:** Framer Motion
- **Icons:** Lucide React

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env.local
   ```

3. **Set up database:**
   ```bash
   npm run db:setup
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Open** [http://localhost:3000](http://localhost:3000)

## Database (Turso)

By default (no `DATABASE_URL`), the app uses a local SQLite file `local.db`.
For production, connect Turso so data survives redeploys:

```env
DATABASE_URL=libsql://your-db.turso.io
DATABASE_AUTH_TOKEN=your-token
```

Migrate + seed the cloud DB with the same scripts:

```bash
npm run db:setup
```

**Already have a local.db with posts?** Import it into Turso:

```bash
npm run db:migrate -- --import ./local.db
```

Legacy categories (`confessions`, `real-talk`) are automatically moved to the
uncategorized pool during import — assign them from the admin panel.

## Admin Access

- **URL:** `/admin/login`
- **Credentials** come from the environment: set `ADMIN_EMAIL` and `ADMIN_PASSWORD` before running `npm run db:setup` (see `.env.example`), then change the dev default after first login. The weak default is only ever applied to a **local** database — a remote/production database is never seeded with a guessable password.
- Forgot the password? Reset it without touching anything else: `ADMIN_PASSWORD='your-new-password' npm run db:password` (works against local and Turso databases).

## Managing the Admin Account

There are two supported ways to manage the admin login:

1. **Admin panel — Settings page (`/admin/settings`).** While signed in, the
   *Admin account* card changes the password (current password required, minimum
   8 characters, stored bcrypt-hashed). The same page also manages the
   newsletter sender: the Gmail address and App Password used for sending
   (stored in the database, never displayed again), the sender name, the site
   URL newsletter links point to, the CAN-SPAM postal address, the privacy
   contact email, and a "send test email" button.

2. **`src/db/set-password.ts` (via `npm run db:password`).** The recovery path
   when the password is forgotten. It sets or creates the admin login and
   touches nothing else — no sample posts, no schema changes. It requires
   `ADMIN_PASSWORD` (minimum 8 characters) and targets whatever database
   `DATABASE_URL`/`DATABASE_AUTH_TOKEN` point at (Turso when set, `local.db`
   otherwise):

   ```bash
   ADMIN_EMAIL='admin@yoursite.com' ADMIN_PASSWORD='your-new-password' npm run db:password
   ```

## Category Workflow

1. Writers publish posts without picking a category (optional field).
2. The **All Posts** page highlights uncategorized posts at the top with an
   amber **"Needs Category"** filter and count badge.
3. Click **Assign category** on any post to set it inline — no full edit needed.

## SEO

The crawlable surface is generated from the database, so publishing a story is
all it takes for it to become discoverable:

| Surface | Where | What it does |
|---|---|---|
| Titles & descriptions | `src/app/layout.tsx` + each page | One brand template (`%s \| The EWU Express`); pages set a bare title so the suffix can only appear once |
| Canonical URLs | `src/lib/siteUrl.ts` (`canonicalUrl`, `pageAlternates`) | Every page declares one canonical URL built from the configured origin — a preview deployment never competes with the live article |
| Open Graph / Twitter | page `metadata` + `src/app/opengraph-image.tsx` | Stories use their cover image with real published/modified times; pages without their own image fall back to the generated masthead card |
| Structured data | `src/lib/structuredData.ts` | `NewsMediaOrganization` + `WebSite` with sitelinks search box (front page), `NewsArticle` + `BreadcrumbList` (stories), `CollectionPage` + `ItemList` (sections) |
| `sitemap.xml` | `src/app/sitemap.ts` | Static pages, every section and all published stories, with last-modified dates. The noindexed `/search` page is intentionally absent |
| `robots.txt` | `src/app/robots.ts` | Crawling allowed, with the admin panel, API and transactional pages (confirm / unsubscribe) excluded |
| RSS | `src/app/rss/route.ts` | `application/rss+xml`, linked from every page's `<head>` |
| 404 | `src/app/not-found.tsx` | Real 404 status, `noindex`, and links back into the sections |

Search-console verification is optional — set `GOOGLE_SITE_VERIFICATION` or
`BING_SITE_VERIFICATION` in the environment (Vercel → Project → Settings →
Environment Variables) and the matching verification meta tag is emitted.
Every canonical URL is built from one origin, resolved in this order
(`src/lib/siteUrl.ts`):

1. the **Site URL** saved in admin → Settings (highest priority — it also sets where
   newsletter links point);
2. `NEXT_PUBLIC_SITE_URL` in the environment;
3. Vercel's `VERCEL_PROJECT_PRODUCTION_URL` / `VERCEL_URL`;
4. `FALLBACK_SITE_URL` in `src/lib/siteUrl.ts` — currently
   `https://theewuexpress.online`, the live domain.

So on the live site the origin comes from the platform, while local runs and
fresh deployments fall back to the domain hardcoded in step 4 — keep it on the
real public domain when the site ever moves again.

The URL and structured-data rules are pure functions, unit-tested in
`src/lib/structuredData.test.ts`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests once (Vitest); `npm run test:watch` to watch |
| `npm run db:migrate` | Create/repair tables; with `--import <file>` copies posts + admin users from an existing SQLite file (see below) |
| `npm run db:seed` | Seed sample data (posts + admin account; respects `ADMIN_EMAIL`/`ADMIN_PASSWORD`, skips guessable passwords on remote DBs) |
| `npm run db:password` | Set or reset the admin password only (no sample data) |
| `npm run db:setup` | Migrate + seed |

## Project Structure

```
src/
├── app/             # Next.js App Router pages
│   ├── admin/       # Admin dashboard (incl. settings page)
│   ├── api/         # API routes
│   ├── article/     # Article pages
│   ├── category/    # Category pages
│   ├── search/      # Search page (noindex)
│   └── not-found.tsx  # 404 page
├── components/      # React components
│   ├── admin/       # Admin components (incl. Tiptap editor)
│   ├── article/     # Article components
│   ├── home/        # Homepage components
│   └── layout/      # Layout components
├── db/              # Database schema, migrations & seed scripts
└── lib/             # Utilities & helpers (auth, newsletter, feed, SEO, etc.)
```

**SEO surface:** `src/lib/siteUrl.ts` (canonical URLs),
`src/lib/structuredData.ts` (JSON-LD builders), `src/app/sitemap.ts`,
`src/app/robots.ts`, `src/app/rss/route.ts`,
`src/app/opengraph-image.tsx`.

## Security & Governance

- Report vulnerabilities privately — see [SECURITY.md](SECURITY.md). Please do
  not open public issues for security problems.
