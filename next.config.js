/**
 * The publication moved to theewuexpress.online. Bookmarks, external links and
 * cached search results still point at these hosts, so each one answers with a
 * permanent redirect to the same path on the new domain instead of serving a
 * second, competing copy of the site:
 *
 *   - the pre-migration Vercel host;
 *   - `www`, so the apex stays the one canonical host.
 *
 * Next compiles each `value` as a regular expression (hence the escaped dots),
 * and only these hosts are matched — Vercel preview URLs and localhost are
 * untouched.
 */
const LEGACY_HOSTS = [
  "theewuexpress\\.vercel\\.app",
  "www\\.theewuexpress\\.online",
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return LEGACY_HOSTS.map((host) => ({
      source: "/:path*",
      has: [{ type: "host", value: host }],
      destination: "https://theewuexpress.online/:path*",
      permanent: true,
    }));
  },
  images: {
    // Explicit allowlist. A wildcard hostname would turn Next's image
    // optimizer into an open proxy that anyone could use to fetch and
    // re-encode arbitrary remote images through this deployment.
    remotePatterns: [
      // imgbb — where the admin uploader sends every image
      { protocol: "https", hostname: "i.ibb.co" },
      { protocol: "https", hostname: "i.ibb.co.com" },
      // Common sources for images pasted by link
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "cdn.pixabay.com" },
      { protocol: "https", hostname: "pbs.twimg.com" },
      { protocol: "https", hostname: "media.giphy.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
    // AVIF is ~20% smaller than WebP at the same quality — the optimizer
    // serves it to capable browsers and falls back automatically.
    formats: ["image/avif", "image/webp"],
    // SVGs can carry scripts; never let them through the optimizer.
    dangerouslyAllowSVG: false,
  },
};

module.exports = nextConfig;
