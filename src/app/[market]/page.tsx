import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocationLandingPage } from "@/components/location-landing-page";
import { cities, citySlugs, isCitySlug } from "@/lib/location-content";

type Props = { params: Promise<{ market: string }> };
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://havenhomeoffers.com").replace(/\/$/, "");

export function generateStaticParams() { return citySlugs.map((market) => ({ market })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { market } = await params;
  if (!isCitySlug(market)) return {};
  const content = cities[market]; const canonical = `${siteUrl}/${market}/`;
  return { title: { absolute: `${content.title} | Haven Home Offers` }, description: content.description, alternates: { canonical }, openGraph: { title: content.title, description: content.description, url: canonical, type: "website", locale: "en_US", siteName: "Haven Home Offers", images: [{ url: `${siteUrl}/images/desert-home-hero.webp`, width: 1672, height: 941, alt: `${content.name}, Nevada home` }] }, twitter: { card: "summary_large_image", title: content.title, description: content.description, images: [`${siteUrl}/images/desert-home-hero.webp`] } };
}

export default async function CityPage({ params }: Props) {
  const { market } = await params;
  if (!isCitySlug(market)) notFound();
  return <LocationLandingPage content={cities[market]} canonical={`${siteUrl}/${market}/`}/>;
}
