/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
    // AVIF is ~20% smaller than WebP at the same quality — the optimizer
    // serves it to capable browsers and falls back automatically.
    formats: ["image/avif", "image/webp"],
  },
};

module.exports = nextConfig;
