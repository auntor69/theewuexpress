import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Images are hosted on imgbb so only the URL is stored in the database —
// uploads survive redeploys and nothing is written to the server filesystem.
const IMGBB_ENDPOINT = "https://api.imgbb.com/1/upload";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function getImgbbApiKey(): string | undefined {
  return (
    process.env.IMGBB_API_KEY ||
    process.env.IMGBB_KEY ||
    process.env.NEXT_PUBLIC_IMGBB_API_KEY
  );
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = getImgbbApiKey();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Image hosting is not configured. Add the IMGBB_API_KEY environment variable and try again.",
      },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `File type '${file.type}' not allowed. Accepted: JPEG, PNG, GIF, WebP` },
          { status: 400 }
        );
      }
      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { error: "File size exceeds 10MB limit" },
          { status: 400 }
        );
      }
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
        return NextResponse.json(
          { error: `File extension '.${ext}' not allowed` },
          { status: 400 }
        );
      }
    }

    const urls: string[] = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString("base64");

      // Key travels in the query string per imgbb's documented API; the
      // base64 image goes in the request body.
      const res = await fetch(`${IMGBB_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ image: base64 }).toString(),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        const message =
          data?.error?.message || `imgbb upload failed for '${file.name}'`;
        throw new Error(message);
      }

      // display_url is the human-friendly direct image link; fall back to url.
      const url = data.data?.display_url || data.data?.url;
      if (!url) {
        throw new Error(`imgbb returned no URL for '${file.name}'`);
      }
      urls.push(url);
    }

    return NextResponse.json({ urls });
  } catch (error) {
    console.error("Error uploading files:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to upload files",
      },
      { status: 500 }
    );
  }
}
