import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  SETTING_KEYS,
  getSettings,
  setSettings,
  getMailConfig,
  getNewsletterIdentity,
} from "@/lib/settings";
import { sendTestEmail } from "@/lib/mailer";

/** Sending a test plus a cold SMTP handshake needs more than the 10s default. */
export const maxDuration = 60;

async function requireSession() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const denied = await requireSession();
  if (denied) return denied;

  try {
    const settings = await getSettings();
    const mail = await getMailConfig();
    const identity = await getNewsletterIdentity();

    // Never return the app password — only whether one is saved.
    return NextResponse.json({
      mailFromName: settings[SETTING_KEYS.mailFromName] || "",
      mailUser: settings[SETTING_KEYS.mailUser] || "",
      hasMailAppPassword: Boolean(settings[SETTING_KEYS.mailAppPassword]),
      siteUrl: settings[SETTING_KEYS.siteUrl] || "",
      mailAddress: settings[SETTING_KEYS.mailAddress] || "",
      contactEmail: settings[SETTING_KEYS.contactEmail] || "",
      // What is actually printed today, defaults included — so the admin can
      // see the address that goes out even before setting one.
      resolvedMailAddress: identity.postalAddress,
      active: mail
        ? {
            fromName: mail.fromName,
            user: mail.user,
            siteUrl: mail.siteUrl || "",
            source: mail.source,
          }
        : null,
    });
  } catch (error) {
    console.error("Error reading settings:", error);
    return NextResponse.json(
      { error: "Failed to read settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const denied = await requireSession();
  if (denied) return denied;

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const updates: Record<string, string> = {};

    const fromName = typeof body.mailFromName === "string" ? body.mailFromName.trim() : "";
    const user = typeof body.mailUser === "string" ? body.mailUser.trim().toLowerCase() : "";
    const siteUrl = typeof body.siteUrl === "string" ? body.siteUrl.trim() : "";
    const mailAddress =
      typeof body.mailAddress === "string" ? body.mailAddress.trim() : "";
    const contactEmail =
      typeof body.contactEmail === "string"
        ? body.contactEmail.trim().toLowerCase()
        : "";

    if (fromName) updates[SETTING_KEYS.mailFromName] = fromName;
    if (user) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user)) {
        return NextResponse.json(
          { error: "Gmail address doesn't look valid" },
          { status: 400 }
        );
      }
      updates[SETTING_KEYS.mailUser] = user;
    }
    if (siteUrl) {
      if (!/^https?:\/\//i.test(siteUrl)) {
        return NextResponse.json(
          { error: "Site URL must start with http:// or https://" },
          { status: 400 }
        );
      }
      updates[SETTING_KEYS.siteUrl] = siteUrl.replace(/\/+$/, "");
    }

    // Postal address printed in every email. CAN-SPAM requires a real physical
    // address here, so reject obvious placeholders rather than let one ship.
    if (mailAddress) {
      if (mailAddress.length < 12) {
        return NextResponse.json(
          { error: "The postal address looks too short to be real" },
          { status: 400 }
        );
      }
      updates[SETTING_KEYS.mailAddress] = mailAddress.slice(0, 300);
    }

    if (contactEmail) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
        return NextResponse.json(
          { error: "Privacy contact address doesn't look valid" },
          { status: 400 }
        );
      }
      updates[SETTING_KEYS.contactEmail] = contactEmail;
    }

    // App password: only overwrite when a new value is provided (never clear it by accident).
    const appPassword = typeof body.mailAppPassword === "string" ? body.mailAppPassword : "";
    if (appPassword.trim()) {
      updates[SETTING_KEYS.mailAppPassword] = appPassword.trim().replace(/\s+/g, "");
    }

    await setSettings(updates);

    return NextResponse.json({ ok: true, saved: Object.keys(updates).length });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}

/** Sends a test email to the address in the body so the admin can verify the setup. */
export async function POST(request: NextRequest) {
  const denied = await requireSession();
  if (denied) return denied;

  try {
    const body = await request.json().catch(() => null);
    const to = typeof body?.to === "string" ? body.to.trim() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json(
        { error: "Enter a valid email to receive the test" },
        { status: 400 }
      );
    }

    const mail = await getMailConfig();
    if (!mail) {
      return NextResponse.json(
        {
          error:
            "Newsletter is not configured yet. Fill in sender name, Gmail address and App Password, then save.",
        },
        { status: 400 }
      );
    }

    const result = await sendTestEmail(to);
    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error.includes("Invalid login")
            ? "Gmail rejected the login — check the address and App Password (16 characters, no spaces)."
            : result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Test email failed:", error);
    return NextResponse.json(
      { error: "Test email failed" },
      { status: 500 }
    );
  }
}
