/** @type {import('next').NextConfig} */
const nextConfig = {
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
