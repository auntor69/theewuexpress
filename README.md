# The EWU Express

A modern, premium digital media platform for East West University. Built with Next.js 14, Tailwind CSS, and Turso (libSQL).

## Features

- **Social Media-Style Feed** — Infinite scroll, featured carousel, trending system
- **Clean Article Pages** — Distraction-free reading with hero images, share buttons, view counts
- **Modern Admin Dashboard** — Rich text editor (Tiptap), image uploads, category assignment queue, analytics, authentication
- **Category Workflow** — Posts can be published without a category, then assigned individually from the admin panel
- **Turso Cloud Database** — Persistent SQLite-compatible storage (no data loss on redeploy)
- **Dark/Light Mode** — System-aware theme switching
- **Search** — Full-text search across stories
- **Categories** — Campus Heat, Stories, Events, Did You Know?
- **Responsive** — Mobile-first design with swipeable featured carousel
- **SEO Optimized** — Meta tags, Open Graph, clean URLs

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
- **Email:** `admin@ewuexpress.com`
- **Password:** `admin123` *(change this immediately)*

## Category Workflow

1. Writers publish posts without picking a category (optional field).
2. The **All Posts** page highlights uncategorized posts at the top with an
   amber **"Needs Category"** filter and count badge.
3. Click **Assign category** on any post to set it inline — no full edit needed.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Run database migrations (supports `--import <file>`) |
| `npm run db:seed` | Seed sample data |
| `npm run db:setup` | Migrate + seed |

## Project Structure

```
src/
├── app/             # Next.js App Router pages
│   ├── admin/       # Admin dashboard
│   ├── api/         # API routes
│   ├── article/     # Article pages
│   ├── category/    # Category pages
│   └── search/      # Search page
├── components/      # React components
│   ├── admin/       # Admin components (incl. Tiptap editor)
│   ├── article/     # Article components
│   ├── home/        # Homepage components
│   └── layout/      # Layout components
├── db/              # Database schema, migrations & seed
└── lib/             # Utilities & helpers
```
