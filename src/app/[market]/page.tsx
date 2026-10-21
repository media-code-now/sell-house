import { siteUrl, pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocationLandingPage } from "@/components/location-landing-page";
import { cities, citySlugs, isCitySlug } from "@/lib/location-content";

type Props = { params: Promise<{ market: string }> };

export function generateStaticParams() { return citySlugs.map((market) => ({ market })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { market } = await params;
  if (!isCitySlug(market)) return {};
  const content = cities[market];
  return pageMetadata(content.title, content.description, `/${market}/`);
}

export default async function CityPage({ params }: Props) {
  const { market } = await params;
  if (!isCitySlug(market)) notFound();
  return <LocationLandingPage content={cities[market]} canonical={`${siteUrl}/${market}/`}/>;
}
