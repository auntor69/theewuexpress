import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const url = process.env.DATABASE_URL || "file:local.db";

const client = createClient({
  url,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });

/**
 * Ensures the subscribers table exists in the connected database.
 * Idempotent + runs once per process — lets the newsletter work on any
 * environment (dev local file, Turso cloud, fresh production) without
 * needing a manual migration step.
 */
let subscribersTableReady: Promise<void> | null = null;
export function ensureSubscribersTable(): Promise<void> {
  subscribersTableReady ??= client
    .execute(
      `CREATE TABLE IF NOT EXISTS subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        subscribed_at TEXT DEFAULT (datetime('now')) NOT NULL
      )`
    )
    .then(() => undefined);
  return subscribersTableReady;
}

/**
 * Ensures the app_settings table exists (idempotent, once per process) —
 * admin-inserted settings (newsletter sender, Gmail app password, site URL)
 * live here so no env vars are required.
 */
let appSettingsTableReady: Promise<void> | null = null;
export function ensureAppSettingsTable(): Promise<void> {
  appSettingsTableReady ??= client
    .execute(
      `CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT DEFAULT (datetime('now')) NOT NULL
      )`
    )
    .then(() => undefined);
  return appSettingsTableReady;
}

/** True when the app is connected to a remote (e.g. Turso cloud) database. */
export const usingRemoteDatabase = /^(libsql|https?):/i.test(url);

export const databaseLabel = usingRemoteDatabase
  ? "Turso cloud database"
  : "Local SQLite file (file:local.db)";

export { schema };
