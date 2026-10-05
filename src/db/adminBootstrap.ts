/**
 * Admin-bootstrap decision logic for src/db/migrate.ts.
 *
 * Kept in its own module so the remote-safety rule can be unit-tested without
 * touching a database — the same split as categories.legacy.ts.
 *
 * Rule (mirrors src/db/seed.ts): credentials come from the environment. The
 * guessable dev default is only ever applied to a LOCAL database; a remote
 * (production) database is never seeded with a guessable password, and a
 * configured password is never echoed to the log.
 */

export const DEFAULT_ADMIN_EMAIL = "admin@ewuexpress.com";

/** The weak local-only default — never applied to a remote database. */
export const LOCAL_DEV_ADMIN_PASSWORD = "admin123";

export const REMOTE_ADMIN_SKIP_WARNING =
  "SKIPPED admin account: refusing to set a default password on a remote database.\n" +
  "Re-run with ADMIN_PASSWORD='<strong-password>' npm run db:password to create the admin login.";

export type AdminBootstrapPlan =
  | { action: "skip"; email: string }
  | {
      action: "create";
      email: string;
      password: string;
      /** True only for the known local dev default; configured passwords are never logged. */
      printPassword: boolean;
    };

/**
 * Decides what migrate.ts should do about the first admin account.
 *
 * `isRemote` must come from the same check the script uses to pick its target
 * database — it is the only thing standing between a production database and
 * a guessable password.
 */
export function planAdminBootstrap(options: {
  email?: string;
  password?: string;
  isRemote: boolean;
}): AdminBootstrapPlan {
  const email = options.email || DEFAULT_ADMIN_EMAIL;
  const password = options.password?.trim();

  if (!password) {
    // No configured password: only a local database may fall back to the
    // guessable dev default. Remote targets are skipped with instructions.
    if (options.isRemote) return { action: "skip", email };
    return {
      action: "create",
      email,
      password: LOCAL_DEV_ADMIN_PASSWORD,
      printPassword: true,
    };
  }

  return { action: "create", email, password, printPassword: false };
}
