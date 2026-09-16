import { db, ensureAppSettingsTable } from "@/db";
import { appSettings } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

/**
 * Key-value settings stored in the database — the admin inserts them via the
 * Settings page, so no env vars are needed. Environment variables still win
 * if present (useful for ops overrides without touching the DB).
 */

export const SETTING_KEYS = {
  mailFromName: "mail_from_name",
  mailUser: "mail_user",
  mailAppPassword: "mail_app_password",
  siteUrl: "site_url",
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

const ALL_KEYS = Object.values(SETTING_KEYS);

export async function getSettings(): Promise<Record<string, string>> {
  await ensureAppSettingsTable();
  const rows = await db
    .select()
    .from(appSettings)
    .where(inArray(appSettings.key, [...ALL_KEYS]));
  return Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""]));
}

export async function getSetting(key: SettingKey): Promise<string | undefined> {
  await ensureAppSettingsTable();
  const row = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, key))
    .get();
  return row?.value ?? undefined;
}

export async function setSetting(key: SettingKey, value: string): Promise<void> {
  await ensureAppSettingsTable();
  await db
    .insert(appSettings)
    .values({ key, value, updatedAt: new Date().toISOString().replace("T", " ").replace(/\.\d{3}Z$/, "") })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: {
        value,
        updatedAt: new Date().toISOString().replace("T", " ").replace(/\.\d{3}Z$/, ""),
      },
    });
}

export async function setSettings(values: Record<string, string>): Promise<void> {
  for (const [key, value] of Object.entries(values)) {
    if (ALL_KEYS.includes(key as SettingKey)) {
      await setSetting(key as SettingKey, value);
    }
  }
}

export interface MailConfig {
  fromName: string;
  user: string;
  appPassword: string;
  siteUrl?: string;
  /** Where the config came from — DB settings or environment fallback. */
  source: "settings" | "env";
}

/**
 * Resolves the mail configuration: admin-inserted DB settings first,
 * environment variables as fallback (MAIL_FROM, MAIL_USER, MAIL_APP_PASSWORD).
 */
export async function getMailConfig(): Promise<MailConfig | null> {
  const settings = await getSettings();

  const fromName = settings[SETTING_KEYS.mailFromName]?.trim();
  const user = settings[SETTING_KEYS.mailUser]?.trim();
  const appPassword = settings[SETTING_KEYS.mailAppPassword]?.trim();
  const siteUrl = settings[SETTING_KEYS.siteUrl]?.trim() || undefined;

  if (fromName && user && appPassword) {
    return { fromName, user, appPassword, siteUrl, source: "settings" };
  }

  // Environment fallback (previously used approach).
  const envFrom = process.env.MAIL_FROM;
  const envPass = process.env.MAIL_APP_PASSWORD;
  if (envFrom && envPass) {
    const envUser =
      process.env.MAIL_USER || envFrom.replace(/^[^<]*<([^>]+)>.*/, "$1").trim() || envFrom;
    return {
      fromName: fromName || envFrom.replace(/^[^<]*</, "").replace(/>.*$/, "").trim() || "The EWU Express",
      user: envUser,
      appPassword: envPass,
      siteUrl: siteUrl || process.env.NEXT_PUBLIC_SITE_URL,
      source: "env",
    };
  }

  return null;
}
