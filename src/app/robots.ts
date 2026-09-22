import type { MetadataRoute } from "next";
import { resolveSiteUrl } from "@/lib/siteUrl";

/**
 * robots.txt for crawlers.
 *
 * The policy pages are public on purpose — a privacy policy that can't be
 * found by search is useless in a dispute — so only the truly private
 * surfaces (admin panel, transactional flow pages) are excluded. The API is
 * excluded wholesale: none of it belongs in an index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/", "/confirm", "/unsubscribe"],
      },
    ],
    sitemap: `${resolveSiteUrl()}/sitemap.xml`,
  };
}
