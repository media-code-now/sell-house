import { PageStructuredData } from "@/components/structured-data";
import { corePages } from "@/lib/seo";
import { coreMetadata } from "@/lib/seo";
import { BrandMark } from "@/components/brand-mark";
import { PropertyQuestionnaire } from "@/components/property-questionnaire";

export const metadata = coreMetadata("/offer/");

export default async function OfferPage({ searchParams }: { searchParams: Promise<{ address?: string }> }) {
  const { address = "" } = await searchParams;
  return <main className="min-h-svh bg-[var(--paper)]"><PageStructuredData path="/offer/" title={corePages["/offer/"].title} description={corePages["/offer/"].description}/><header className="border-b border-[var(--line)] bg-white"><div className="container-shell flex h-20 items-center justify-between"><BrandMark/><span className="text-xs font-bold text-[var(--ink-soft)]">No fees · No obligation</span></div></header><PropertyQuestionnaire initialAddress={address}/></main>;
}
