import type { Metadata, Viewport } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { resolveSiteUrl } from "@/lib/siteUrl";
import {
  PUBLISHER_NAME,
  SITE_DESCRIPTION,
  SITE_OG_TITLE,
} from "@/lib/structuredData";

const inter = Inter({ subsets: ["latin"] });

// Editorial display face for wordmark + headlines (news-site identity),
// self-hosted and preloaded by next/font so it adds no request overhead.
const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const siteUrl = resolveSiteUrl();

/**
 * Ownership tokens for the search console. Optional: set
 * GOOGLE_SITE_VERIFICATION (or BING_SITE_VERIFICATION) in the environment and
 * the matching meta tag is emitted; leave them unset and nothing is emitted.
 */
const verification: Metadata["verification"] = {
  ...(process.env.GOOGLE_SITE_VERIFICATION?.trim()
    ? { google: process.env.GOOGLE_SITE_VERIFICATION.trim() }
    : {}),
  ...(process.env.BING_SITE_VERIFICATION?.trim()
    ? { other: { "msvalidate.01": process.env.BING_SITE_VERIFICATION.trim() } }
    : {}),
};

export const metadata: Metadata = {
  // Anchors every relative OG/Twitter/canonical URL to an absolute origin.
  // Without it, Next.js warns and social platforms can resolve relative
  // preview images against the wrong host.
  metadataBase: new URL(siteUrl),
  title: {
    default: `${PUBLISHER_NAME} | The Student News Publication of East West University`,
    // Pages set a bare title; this is the one place the brand suffix lives, so
    // no page has to repeat it (and none can end up with it twice).
    template: `%s | ${PUBLISHER_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: PUBLISHER_NAME,
  authors: [{ name: PUBLISHER_NAME, url: siteUrl }],
  creator: PUBLISHER_NAME,
  publisher: PUBLISHER_NAME,
  category: "news",
  formatDetection: { email: false, address: false, telephone: false },
  // Lets browsers and reader apps discover the RSS feed from the page itself.
  // Pages add their own canonical via `pageAlternates()`.
  alternates: {
    types: { "application/rss+xml": "/rss" },
  },
  openGraph: {
    type: "website",
    siteName: PUBLISHER_NAME,
    locale: "en_US",
    title: SITE_OG_TITLE,
    description: SITE_DESCRIPTION,
    // The image comes from the file convention (src/app/opengraph-image.tsx),
    // and `url` is set per page (metadata fields replace rather than merge),
    // so neither is declared here.
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_OG_TITLE,
    description: SITE_DESCRIPTION,
  },
  // Editorial content is meant to be indexed, with the larger image previews
  // Google Discover needs. Pages that should stay out (search results, the
  // 404) opt out individually.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  ...(Object.keys(verification).length ? { verification } : {}),
};

// Theme colors follow the site's own surface tokens (globals.css) so the
// browser chrome matches the page in both schemes.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f3" },
    { media: "(prefers-color-scheme: dark)", color: "#131211" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} ${newsreader.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
