import type { Metadata } from "next";

export const siteName = "Haven Home Offers";
// Canonicals always use the public origin, never a request host or a tracking query.
const configuredUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://sellhomefastvegas.com");
if (!["http:", "https:"].includes(configuredUrl.protocol)) throw new Error("NEXT_PUBLIC_SITE_URL must be an HTTP(S) URL");
export const siteUrl = configuredUrl.origin;
export function absoluteUrl(path = "/") {
  const cleanPath = path.split(/[?#]/)[0];
  return `${siteUrl}${cleanPath === "/" ? "/" : `/${cleanPath.replace(/^\/+|\/+$/g, "")}/`}`;
}

export function pageMetadata(title: string, description: string, path: string, index = true): Metadata {
  const url = absoluteUrl(path);
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
  const images = [{ url: `${siteUrl}/share-image/`, width: 1200, height: 630, alt: "Haven Home Offers — sell your Las Vegas Valley home as-is" }];
  return {
    title: { absolute: fullTitle }, description,
    alternates: { canonical: url },
    openGraph: { type: "website", locale: "en_US", siteName, url, title: fullTitle, description, images },
    twitter: { card: "summary_large_image", title: fullTitle, description, images },
    robots: index
      ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } }
      : { index: false, follow: false },
  };
}

export const corePages = {
  "/": { title: "Sell Your House Fast in Las Vegas, NV for Cash", description: "Request a no-obligation cash offer for your Las Vegas Valley home. Sell as-is in Las Vegas, Henderson, or North Las Vegas with no agent commission." },
  "/about/": { title: "About Haven Home Offers", description: "Learn how Haven Home Offers helps Las Vegas Valley homeowners explore a direct, as-is home sale with clear choices and no obligation." },
  "/how-it-works/": { title: "How to Sell Your Las Vegas House for Cash", description: "Share your property details, review a no-obligation cash offer, and choose your closing timeline. Learn how a direct home sale works with Haven." },
  "/selling-options/": { title: "Compare Your Home Selling Options", description: "Explore direct-sale options for inherited homes, repairs, rental properties, relocation, and mortgage pressure across the Las Vegas Valley." },
  "/locations/": { title: "Las Vegas Valley Areas We Serve", description: "Explore cash home sale options in Las Vegas, Henderson, North Las Vegas, Summerlin, and southwest Las Vegas, with local property guides." },
  "/guides/": { title: "Las Vegas Home Selling Guides", description: "Compare cash home offers and prepare to sell your Las Vegas Valley house as-is with practical checklists and questions to ask before signing." },
  "/offer/": { title: "Get a Cash Offer for Your Las Vegas House", description: "Tell Haven Home Offers about your Las Vegas Valley property to request a free cash offer. No repairs required and no obligation to accept." },
} as const;

export function coreMetadata(path: keyof typeof corePages) {
  const { title, description } = corePages[path];
  return pageMetadata(title, description, path);
}
