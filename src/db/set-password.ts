import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { config as loadEnv } from "dotenv";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { adminUsers } from "./schema";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ quiet: true });

/**
 * Sets (or creates) the admin login with a single command — the way back in if
 * the password is forgotten, since the admin UI requires the current password.
 *
 * Unlike the seed script this touches nothing else: no sample posts.
 *
 *   ADMIN_PASSWORD='your-new-password' npm run db:password
 *
 * With DATABASE_URL / DATABASE_AUTH_TOKEN set for Turso it updates the live
 * database; without them it updates the local `local.db`.
 */
async function main() {
  const targetUrl = process.env.DATABASE_URL || "file:local.db";
  const isRemote = /^(libsql|https?):/i.test(targetUrl);

  const email = (process.env.ADMIN_EMAIL || "admin@ewuexpress.com")
    .trim()
    .toLowerCase();
  const password = process.env.ADMIN_PASSWORD?.trim();
  const name = process.env.ADMIN_NAME?.trim() || "Admin";

  if (!password) {
    console.error(
      "Missing ADMIN_PASSWORD.\n" +
        "Run: ADMIN_PASSWORD='your-new-password' npm run db:password"
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("ADMIN_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }

  const client = createClient({
    url: targetUrl,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  const db = drizzle(client);

  const hashed = await bcrypt.hash(password, 10);
  const existing = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .get();

  if (existing) {
    await db
      .update(adminUsers)
      .set({ password: hashed })
      .where(eq(adminUsers.id, existing.id));
    console.log(
      `Password updated for ${email} (${isRemote ? "Turso cloud" : targetUrl}).`
    );
  } else {
    await db.insert(adminUsers).values({ email, password: hashed, name });
    console.log(
      `Admin account created: ${email} (${isRemote ? "Turso cloud" : targetUrl}).`
    );
  }

  client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
