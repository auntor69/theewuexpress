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
 *
 * Also migrates older installs (adds the unsubscribe columns) and backfills an
 * unsubscribe token for every existing row, so mail sent before this change
 * still offers a working opt-out once a list is re-sent.
 */
let subscribersTableReady: Promise<void> | null = null;
export function ensureSubscribersTable(): Promise<void> {
  subscribersTableReady ??= (async () => {
    await client.execute(
      `CREATE TABLE IF NOT EXISTS subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        unsubscribe_token TEXT,
        confirm_token TEXT,
        confirmed_at TEXT,
        unsubscribed_at TEXT,
        subscribed_at TEXT DEFAULT (datetime('now')) NOT NULL
      )`
    );

    // Older installs: CREATE TABLE IF NOT EXISTS won't add columns, so add
    // them explicitly. "duplicate column name" on a second run is expected.
    for (const column of [
      "unsubscribe_token TEXT",
      "unsubscribed_at TEXT",
      "confirm_token TEXT",
      "confirmed_at TEXT",
    ]) {
      try {
        await client.execute(`ALTER TABLE subscribers ADD COLUMN ${column}`);
      } catch {
        /* column already exists */
      }
    }

    // Give every existing subscriber a token (new ones get one on insert).
    await client.execute(
      `UPDATE subscribers
          SET unsubscribe_token = lower(hex(randomblob(16)))
        WHERE unsubscribe_token IS NULL OR unsubscribe_token = ''`
    );

    // Rows from before double opt-in gave consent the old way (they typed their
    // address and asked for the emails), so treat them as confirmed instead of
    // dropping the list. The `confirm_token IS NULL` guard is what makes this
    // safe to re-run: every row created under the new flow carries a token, so
    // a reader who has not clicked "confirm" yet can never be auto-confirmed.
    await client.execute(
      `UPDATE subscribers
          SET confirmed_at = COALESCE(subscribed_at, datetime('now'))
        WHERE confirm_token IS NULL AND confirmed_at IS NULL`
    );

    await client.execute(
      `CREATE UNIQUE INDEX IF NOT EXISTS subscribers_unsubscribe_token_idx
         ON subscribers (unsubscribe_token)`
    );
    await client.execute(
      `CREATE INDEX IF NOT EXISTS subscribers_confirm_token_idx
         ON subscribers (confirm_token)`
    );
  })();
  return subscribersTableReady;
}

/**
 * Per-recipient delivery log for the newsletter (see newsletterDeliveries in
 * schema.ts). Created on demand for the same reason as the table above.
 */
let deliveriesTableReady: Promise<void> | null = null;
export function ensureNewsletterDeliveriesTable(): Promise<void> {
  deliveriesTableReady ??= (async () => {
    await client.execute(
      `CREATE TABLE IF NOT EXISTS newsletter_deliveries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        email TEXT NOT NULL,
        status TEXT DEFAULT 'pending' NOT NULL,
        error TEXT,
        created_at TEXT DEFAULT (datetime('now')) NOT NULL,
        attempted_at TEXT,
        sent_at TEXT
      )`
    );
    // Older installs again: add the attempt column if the table predates it.
    try {
      await client.execute(
        `ALTER TABLE newsletter_deliveries ADD COLUMN attempted_at TEXT`
      );
    } catch {
      /* column already exists */
    }
    // One row per (story, address): makes sending idempotent, so a retry or a
    // double-clicked publish can never email the same person the same story twice.
    await client.execute(
      `CREATE UNIQUE INDEX IF NOT EXISTS newsletter_deliveries_post_email_idx
         ON newsletter_deliveries (post_id, email)`
    );
    await client.execute(
      `CREATE INDEX IF NOT EXISTS newsletter_deliveries_status_idx
         ON newsletter_deliveries (status)`
    );
  })();
  return deliveriesTableReady;
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
