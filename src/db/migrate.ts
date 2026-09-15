import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
// Scripts run outside Next.js, so load .env.local / .env ourselves.
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ quiet: true });

import { parseArgs } from "node:util";

/**
 * Standalone migration script.
 * - Creates tables if missing (posts.category is nullable: uncategorized pool).
 * - Rebuilds legacy tables where category was NOT NULL, remapping removed
 *   categories (confessions, real-talk) to NULL (uncategorized).
 * - `--import <path-to-sqlite-file>` copies posts + admin users from an
 *   existing local.db into the target database (e.g. Turso), idempotently.
 * - `--dry-run` shows what would happen without writing.
 *
 * Usage:
 *   npm run db:migrate
 *   npm run db:migrate -- --import ./local.db
 *   npm run db:migrate -- --import ./local.db --dry-run
 */

const args = parseArgs({
  allowPositionals: false,
  options: {
    import: { type: "string" },
    "dry-run": { type: "boolean", default: false },
  },
});

const target = createClient({
  url: process.env.DATABASE_URL || "file:local.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const LEGACY_CATEGORIES = ["confessions", "real-talk"];

const CREATE_POSTS = `
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    caption TEXT NOT NULL,
    content TEXT NOT NULL,
    cover_image TEXT NOT NULL,
    images TEXT DEFAULT '[]',
    category TEXT,
    tags TEXT DEFAULT '[]',
    views INTEGER DEFAULT 0 NOT NULL,
    featured INTEGER DEFAULT 0 NOT NULL,
    editor_pick INTEGER DEFAULT 0 NOT NULL,
    published INTEGER DEFAULT 1 NOT NULL,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL,
    updated_at TEXT DEFAULT (datetime('now')) NOT NULL
  );
`;

const CREATE_ADMIN_USERS = `
  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')) NOT NULL
  );
`;

const CREATE_SUBSCRIBERS = `
  CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    subscribed_at TEXT DEFAULT (datetime('now')) NOT NULL
  );
`;

const CREATE_APP_SETTINGS = `
  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT DEFAULT (datetime('now')) NOT NULL
  );
`;

function categoryOrNull(category: unknown): string | null {
  const value = typeof category === "string" ? category.toLowerCase().trim() : "";
  if (!value || LEGACY_CATEGORIES.includes(value)) return null;
  return value;
}

async function ensureSchema() {
  const table = await target.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='posts'"
  );

  if (!table.rows.length) {
    await target.executeMultiple(
      CREATE_POSTS + CREATE_ADMIN_USERS + CREATE_SUBSCRIBERS + CREATE_APP_SETTINGS
    );
    console.log("✓ Created tables (posts, admin_users, subscribers, app_settings)");
    return;
  }

  // Does the existing posts.category column have a NOT NULL constraint?
  const info = await target.execute("PRAGMA table_info(posts)");
  const categoryCol = info.rows.find(
    (row) => String(row.name).toLowerCase() === "category"
  );
  const isNotNull = categoryCol ? Number(categoryCol.notnull) === 1 : false;

  // Tables added after initial release — create them for existing DBs.
  await target.execute(CREATE_SUBSCRIBERS);
  await target.execute(CREATE_APP_SETTINGS);

  if (!isNotNull) {
    console.log("✓ Schema is up to date (category already nullable)");
    return;
  }

  if (args.values["dry-run"]) {
    console.log(
      "[dry-run] Would rebuild posts table: category NOT NULL → nullable, " +
        "remapping removed categories (confessions, real-talk) to uncategorized."
    );
    return;
  }

  // SQLite cannot drop a NOT NULL constraint in place → rebuild the table.
  const remap = LEGACY_CATEGORIES.map((c) => `'${c}'`).join(", ");
  await target.executeMultiple(`
    BEGIN;
    CREATE TABLE posts_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      caption TEXT NOT NULL,
      content TEXT NOT NULL,
      cover_image TEXT NOT NULL,
      images TEXT DEFAULT '[]',
      category TEXT,
      tags TEXT DEFAULT '[]',
      views INTEGER DEFAULT 0 NOT NULL,
      featured INTEGER DEFAULT 0 NOT NULL,
      editor_pick INTEGER DEFAULT 0 NOT NULL,
      published INTEGER DEFAULT 1 NOT NULL,
      created_at TEXT DEFAULT (datetime('now')) NOT NULL,
      updated_at TEXT DEFAULT (datetime('now')) NOT NULL
    );
    INSERT INTO posts_new
      (id, title, slug, caption, content, cover_image, images, category, tags,
       views, featured, editor_pick, published, created_at, updated_at)
    SELECT
      id, title, slug, caption, content, cover_image, images,
      CASE WHEN LOWER(TRIM(category)) IN (${remap}) THEN NULL ELSE category END,
      tags, views, featured, editor_pick, published, created_at, updated_at
    FROM posts;
    DROP TABLE posts;
    ALTER TABLE posts_new RENAME TO posts;
    COMMIT;
  `);
  console.log(
    "✓ Rebuilt posts table: category is now nullable; removed categories (confessions, real-talk) moved to uncategorized"
  );
}

async function importFromSource() {
  const sourcePath = args.values.import as string;
  const source = createClient({
    url: sourcePath.startsWith("file:") || sourcePath.includes("://")
      ? sourcePath
      : `file:${sourcePath}`,
  });

  const srcPosts = await source.execute(
    "SELECT id, title, slug, caption, content, cover_image, images, category, tags, views, featured, editor_pick, published, created_at, updated_at FROM posts ORDER BY id"
  );
  console.log(`Found ${srcPosts.rows.length} posts in ${sourcePath}`);

  const srcUsers = await source
    .execute("SELECT email, password, name FROM admin_users")
    .catch(() => ({ rows: [] as never[] }));
  console.log(`Found ${(srcUsers.rows as unknown[]).length} admin users in ${sourcePath}`);

  if (args.values["dry-run"]) {
    const legacy = srcPosts.rows.filter((r) =>
      LEGACY_CATEGORIES.includes(String(r.category || "").toLowerCase().trim())
    ).length;
    console.log(
      `[dry-run] Would import ${srcPosts.rows.length} posts (${legacy} remapped to uncategorized) and ${(srcUsers.rows as unknown[]).length} admin users.`
    );
    source.close();
    return;
  }

  let imported = 0;
  let remapped = 0;

  type SrcRow = Record<string, unknown>;

  for (const row of srcPosts.rows as SrcRow[]) {
    const category = categoryOrNull(row.category);
    if (!category && row.category) remapped++;

    await target.execute(
      `INSERT INTO posts
        (title, slug, caption, content, cover_image, images, category, tags, views, featured, editor_pick, published, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(slug) DO UPDATE SET
          title=excluded.title,
          caption=excluded.caption,
          content=excluded.content,
          cover_image=excluded.cover_image,
          images=excluded.images,
          category=excluded.category,
          tags=excluded.tags,
          views=excluded.views,
          featured=excluded.featured,
          editor_pick=excluded.editor_pick,
          published=excluded.published,
          updated_at=excluded.updated_at`,
      [
        row.title, row.slug, row.caption, row.content, row.cover_image,
        row.images ?? "[]", category, row.tags ?? "[]", row.views ?? 0,
        row.featured ?? 0, row.editor_pick ?? 0, row.published ?? 1,
        row.created_at, row.updated_at,
      ] as never[]
    );
    imported++;
  }

  let usersImported = 0;
  for (const row of srcUsers.rows as Array<Record<string, unknown>>) {
    await target.execute(
      `INSERT INTO admin_users (email, password, name)
        VALUES (?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET password=excluded.password, name=excluded.name`,
      [row.email, row.password, row.name] as never[]
    );
    usersImported++;
  }

  source.close();
  console.log(
    `✓ Imported ${imported} posts (${remapped} moved to uncategorized) and ${usersImported} admin users`
  );
}

async function ensureAdminUser() {
  const existing = await target.execute(
    "SELECT COUNT(*) AS n FROM admin_users"
  );
  if (Number(existing.rows[0]?.n ?? 0) > 0) {
    console.log("✓ Admin user already exists");
    return;
  }

  const email = process.env.ADMIN_EMAIL || "admin@ewuexpress.com";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const hashed = await bcrypt.hash(password, 10);

  await target.execute(
    "INSERT INTO admin_users (email, password, name) VALUES (?, ?, ?) ON CONFLICT(email) DO NOTHING",
    [email, hashed, "Admin"]
  );
  console.log(`✓ Created admin user: ${email} (password: ${password} — change it after first login)`);
}

async function main() {
  const targetUrl = process.env.DATABASE_URL || "file:local.db";
  const isRemote = /^(libsql|https?):/i.test(targetUrl);
  console.log(`Target database: ${isRemote ? "Turso cloud" : targetUrl}`);

  await ensureSchema();

  if (args.values.import) {
    await importFromSource();
  }

  await ensureAdminUser();
  console.log("Migration complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
