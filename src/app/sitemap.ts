import type { MetadataRoute } from "next";
import { citySlugs, neighborhoodKeys } from "@/lib/location-content";
import { marketSlugs, situationSlugs } from "@/lib/seo-landing-content";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://havenhomeoffers.com").replace(/\/$/, "");
  const core = ["", "/offer", "/how-it-works", "/selling-options", "/locations", "/about", "/privacy", "/terms"];
  const legacyMarketPages = marketSlugs
    .filter((market) => market !== "las-vegas")
    .map((market) => `/locations/${market}`);
  const cityPages = citySlugs.map((city) => `/${city}`);
  const neighborhoodPages = neighborhoodKeys.map((key) => `/${key}`);
  const seoPages = marketSlugs.flatMap((market) => situationSlugs.map((situation) => `/${market}/${situation}`));
  return [...core, ...legacyMarketPages, ...cityPages, ...neighborhoodPages, ...seoPages].map((path) => ({
    url: `${base}${path}/`.replace(/([^:]\/)\/+/, "$1"),
    changeFrequency: path.startsWith("/privacy") || path.startsWith("/terms") ? "yearly" : "monthly",
    priority: path === "" ? 1 : neighborhoodKeys.some((key) => path === `/${key}`) ? 0.8 : citySlugs.some((city) => path === `/${city}`) ? 0.9 : path.startsWith("/locations/") ? 0.7 : path.split("/").length === 3 ? 0.85 : 0.6,
  }));
}
