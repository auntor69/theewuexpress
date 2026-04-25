import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.DATABASE_URL || "file:local.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

async function migrate() {
  console.log("Running migrations...");

  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      caption TEXT NOT NULL,
      content TEXT NOT NULL,
      cover_image TEXT NOT NULL,
      images TEXT DEFAULT '[]',
      category TEXT NOT NULL,
      tags TEXT DEFAULT '[]',
      views INTEGER DEFAULT 0 NOT NULL,
      featured INTEGER DEFAULT 0 NOT NULL,
      editor_pick INTEGER DEFAULT 0 NOT NULL,
      published INTEGER DEFAULT 1 NOT NULL,
      created_at TEXT DEFAULT (datetime('now')) NOT NULL,
      updated_at TEXT DEFAULT (datetime('now')) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')) NOT NULL
    );
  `);

  console.log("Migrations complete!");
}

migrate().catch(console.error);
