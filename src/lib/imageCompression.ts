/**
 * Client-side image compression before upload to imgbb.
 *
 * A modern phone photo is 3–10 MB. Uploading that raw means imgbb serves a
 * multi-megabyte original, and Next.js's image optimizer has to download the
 * whole thing before it can produce the fast AVIF/WebP variant — which is why
 * some images feel instant and others take seconds (cache misses pay the full
 * download).
 *
 * We resize to a max edge of 1600px (plenty for any layout slot, including
 * retina) and encode as JPEG/WebP quality 0.82 — visually identical to the
 * original at ~5–10x smaller. Compression happens in the browser on a canvas
 * with the image drawn offscreen, so the UI never blocks.
 */

const MAX_EDGE = 1600;
const QUALITY = 0.82;
// Don't re-encode files that are already small — keeps GIFs animated and
// avoids a pointless quality loss on already-optimized images.
const SKIP_BELOW_BYTES = 300 * 1024;

export interface CompressionResult {
  file: File;
  /** Human-readable summary for toasts, e.g. "4.2 MB → 310 KB". */
  summary: string;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

export async function compressImage(file: File): Promise<CompressionResult> {
  // GIFs must stay untouched (animation is lost on canvas re-encode).
  // Already-small images skip re-encoding entirely.
  if (file.type === "image/gif" || file.size < SKIP_BELOW_BYTES) {
    return { file, summary: formatBytes(file.size) };
  }

  const bitmap = await createImageBitmap(file);

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return { file, summary: formatBytes(file.size) };
  }

  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // WebP compresses better than JPEG in every modern browser (Safari 14+).
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", QUALITY)
  );

  const compressed = blob
    ? new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" })
    : file;

  return {
    file: compressed,
    summary: `${formatBytes(file.size)} → ${formatBytes(compressed.size)}`,
  };
}

/** Compresses every file in a list, reporting progress for a toast. */
export async function compressImages(
  files: File[],
  onProgress?: (done: number, total: number, lastSummary: string) => void
): Promise<File[]> {
  const out: File[] = [];
  for (let i = 0; i < files.length; i++) {
    const { file, summary } = await compressImage(files[i]);
    out.push(file);
    onProgress?.(i + 1, files.length, summary);
  }
  return out;
}
