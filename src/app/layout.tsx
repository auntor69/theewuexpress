import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";

const inter = Inter({ subsets: ["latin"] });

// Editorial display face for wordmark + headlines (news-site identity),
// self-hosted and preloaded by next/font so it adds no request overhead.
const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "The EWU Express | Campus Stories, Unfiltered",
  description:
    "The voice of East West University. Raw stories, real talk, campus culture — unfiltered.",
  openGraph: {
    title: "The EWU Express",
    description:
      "The voice of East West University. Raw stories, real talk, campus culture — unfiltered.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The EWU Express",
    description:
      "The voice of East West University. Raw stories, real talk, campus culture — unfiltered.",
  },
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
