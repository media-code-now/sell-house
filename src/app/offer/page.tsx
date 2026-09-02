import { BrandMark } from "@/components/brand-mark";
import { PropertyQuestionnaire } from "@/components/property-questionnaire";

export const metadata = { title: "Get My Cash Offer" };

export default async function OfferPage({ searchParams }: { searchParams: Promise<{ address?: string }> }) {
  const { address = "" } = await searchParams;
  return <main className="min-h-svh bg-[var(--paper)]"><header className="border-b border-[var(--line)] bg-white"><div className="container-shell flex h-20 items-center justify-between"><BrandMark/><span className="text-xs font-bold text-[var(--ink-soft)]">No fees · No obligation</span></div></header><PropertyQuestionnaire initialAddress={address}/></main>;
}
