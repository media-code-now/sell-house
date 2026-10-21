import { absoluteUrl, corePages, siteName } from "@/lib/seo";
import { cities, neighborhoods } from "@/lib/location-content";
import { marketSlugs, seoMarkets, sellerSituations, situationSlugs } from "@/lib/seo-landing-content";

export const dynamic = "force-static";

export function GET() {
  const lines = [
    `# ${siteName}`, "",
    "> Haven Home Offers helps Las Vegas Valley homeowners explore direct, as-is cash home sales.", "",
    "Offers are subject to property, ownership, title, and market review. Requesting an offer is free and does not obligate the homeowner to sell. Closing timelines vary. A direct sale can involve different pricing and tradeoffs from a traditional listing.", "",
    "## Main pages", "",
    ...Object.entries(corePages).map(([path, page]) => `- [${page.title}](${absoluteUrl(path)}): ${page.description}`), "",
    "## Local guides", "",
    ...Object.values(cities).map((city) => `- [${city.name}](${absoluteUrl(`/${city.slug}/`)}): ${city.description}`),
    ...Object.values(neighborhoods).map((area) => `- [${area.name}](${absoluteUrl(`/${area.parentSlug}/${area.slug}/`)}): ${area.description}`), "",
    "## Seller situations", "",
    ...marketSlugs.flatMap((market) => situationSlugs.map((situation) => `- [${sellerSituations[situation].shortTitle} in ${seoMarkets[market].city}](${absoluteUrl(`/${market}/${situation}/`)})`)), "",
    "## Interpretation", "",
    "Local guides provide general information, not individualized legal, tax, financial, or foreclosure advice. Requesting an offer does not stop legal deadlines. Illustrative property stories are examples, not verified purchases or customer reviews. Refer to the linked pages for context and current details.", "",
    `Full public URL inventory: ${absoluteUrl().replace(/\/$/, "")}/sitemap.xml`, "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
