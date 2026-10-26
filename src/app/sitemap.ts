import { sellerGuides } from "@/lib/seller-guides";
import type { MetadataRoute } from "next";
import { citySlugs, neighborhoodKeys } from "@/lib/location-content";
import { marketSlugs, situationSlugs } from "@/lib/seo-landing-content";
import { absoluteUrl, corePages } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  // Only canonical, indexable pages. Redirects and transaction/private pages are excluded.
  const paths = [
    ...Object.keys(corePages),
    ...sellerGuides.map((guide) => `/guides/${guide.slug}/`),
    ...citySlugs.map((city) => `/${city}/`),
    ...neighborhoodKeys.map((key) => `/${key}/`),
    ...marketSlugs.flatMap((market) => situationSlugs.map((situation) => `/${market}/${situation}/`)),
  ];
  return [...new Set(paths)].map((path) => ({ url: absoluteUrl(path) }));
}
