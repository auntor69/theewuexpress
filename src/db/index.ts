import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const url = process.env.DATABASE_URL || "file:local.db";

const client = createClient({
  url,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });

/** True when the app is connected to a remote (e.g. Turso cloud) database. */
export const usingRemoteDatabase = /^(libsql|https?):/i.test(url);

export const databaseLabel = usingRemoteDatabase
  ? "Turso cloud database"
  : "Local SQLite file (file:local.db)";

export { schema };
