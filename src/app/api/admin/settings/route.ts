import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  SETTING_KEYS,
  getSettings,
  setSettings,
  getMailConfig,
} from "@/lib/settings";

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

    // Never return the app password — only whether one is saved.
    return NextResponse.json({
      mailFromName: settings[SETTING_KEYS.mailFromName] || "",
      mailUser: settings[SETTING_KEYS.mailUser] || "",
      hasMailAppPassword: Boolean(settings[SETTING_KEYS.mailAppPassword]),
      siteUrl: settings[SETTING_KEYS.siteUrl] || "",
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

    const nodemailer = (await import("nodemailer")).default;
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: mail.user, pass: mail.appPassword },
    });

    await transporter.sendMail({
      from: `${mail.fromName} <${mail.user}>`,
      to,
      subject: "✅ The EWU Express — newsletter test",
      html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
        <h2 style="color:#08216e;">It works! 🎉</h2>
        <p style="color:#525252;line-height:1.6;">
          This is a test email from <strong>The EWU Express</strong> admin settings.
          From now on, every new published story will automatically reach your
          subscribers with a preview and a link to the article.
        </p>
      </div>`,
      text: "The EWU Express newsletter is configured correctly.",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Test email failed:", error);
    const message =
      error instanceof Error ? error.message : "Test email failed";
    return NextResponse.json(
      {
        error:
          message.includes("Invalid login")
            ? "Gmail rejected the login — check the address and App Password (16 characters, no spaces)."
            : message,
      },
      { status: 500 }
    );
  }
}
