import { NextRequest, NextResponse } from "next/server";
import { unsubscribeByToken } from "@/lib/newsletter";

/**
 * One-click unsubscribe endpoint.
 *
 * POST performs the opt-out — this is the URL advertised in the
 * List-Unsubscribe header, which mailbox providers call directly (RFC 8058).
 * GET is intentionally side-effect free and just forwards to the confirmation
 * page, because link scanners and mail-client previews fetch every URL in an
 * email and must never unsubscribe a reader behind their back.
 */

async function tokenFrom(request: NextRequest): Promise<string> {
  const fromQuery = request.nextUrl.searchParams.get("token");
  if (fromQuery) return fromQuery;

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null);
    return typeof body?.token === "string" ? body.token : "";
  }
  if (contentType.includes("form")) {
    const form = await request.formData().catch(() => null);
    const value = form?.get("token");
    return typeof value === "string" ? value : "";
  }
  return "";
}

function pageUrl(request: NextRequest, status: string): URL {
  return new URL(`/unsubscribe?status=${status}`, request.nextUrl.origin);
}

export async function GET(request: NextRequest) {
  const token = await tokenFrom(request);
  return NextResponse.redirect(pageUrl(request, token ? "confirm" : "invalid"));
}

export async function POST(request: NextRequest) {
  const token = await tokenFrom(request);
  const { status } = await unsubscribeByToken(token);

  const contentType = request.headers.get("content-type") ?? "";
  const wantsPage =
    contentType.includes("form") &&
    request.nextUrl.searchParams.get("redirect") === "1";

  if (wantsPage) {
    return NextResponse.redirect(pageUrl(request, status), 303);
  }

  // RFC 8058 one-click: a bare 200 is all the provider needs.
  return new NextResponse(status === "invalid" ? "Invalid token" : "Unsubscribed", {
    status: status === "invalid" ? 400 : 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
