import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    // The wildcard permits search engines and AI search crawlers to read public content.
    // Keep noindex pages crawlable so crawlers can read their exclusion metadata.
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/acquisitions/"] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
