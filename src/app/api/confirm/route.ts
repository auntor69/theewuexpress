import { NextRequest, NextResponse } from "next/server";
import { confirmByToken } from "@/lib/newsletter";

/**
 * Double opt-in confirmation endpoint.
 *
 * GET is deliberately side-effect free: it forwards to the confirmation page so
 * that a mail scanner or link preview (Gmail prefetch, Outlook SafeLinks)
 * cannot silently confirm a subscription the reader never clicked. POST is what
 * actually confirms.
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
  return new URL(`/confirm?status=${status}`, request.nextUrl.origin);
}

export async function GET(request: NextRequest) {
  const token = await tokenFrom(request);
  return NextResponse.redirect(pageUrl(request, token ? "confirm" : "invalid"));
}

export async function POST(request: NextRequest) {
  const token = await tokenFrom(request);
  const { status } = await confirmByToken(token);

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("form")) {
    return NextResponse.redirect(pageUrl(request, status), 303);
  }

  const failed = status === "invalid" || status === "expired";
  return NextResponse.json({ status }, { status: failed ? 400 : 200 });
}
