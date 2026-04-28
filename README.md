# The EWU Express

A modern, premium digital media platform for East West University. Built with Next.js 14, Tailwind CSS, and SQLite/Turso.

## Features

- **Social Media-Style Feed** — Infinite scroll, featured cards, trending system
- **Clean Article Pages** — Distraction-free reading with hero images, share buttons, view counts
- **Admin Dashboard** — Full CRUD, image uploads, analytics, authentication
- **Dark/Light Mode** — System-aware theme switching
- **Search** — Full-text search across stories
- **Categories** — Campus Heat, Confessions, Stories, Real Talk, Events
- **Responsive** — Mobile-first design
- **SEO Optimized** — Meta tags, Open Graph, clean URLs

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + Typography plugin
- **Database:** SQLite (libsql) / Turso
- **ORM:** Drizzle ORM
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

## Admin Access

- **URL:** `/admin/login`
- **Email:** `admin@ewuexpress.com`
- **Password:** `admin123`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Run database migrations |
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
│   ├── admin/       # Admin components
│   ├── article/     # Article components
│   ├── home/        # Homepage components
│   └── layout/      # Layout components
├── db/              # Database schema & config
└── lib/             # Utilities & helpers
```
