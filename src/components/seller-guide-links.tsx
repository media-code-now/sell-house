import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { sellerGuides } from "@/lib/seller-guides";

export function SellerGuideLinks() {
  return <section className="bg-[var(--paper)] py-16 sm:py-20"><div className="container-shell">
    <p className="eyebrow text-[var(--copper-dark)]">Before you decide</p>
    <h2 className="font-display mt-4 text-3xl sm:text-4xl">Practical guides for your next step.</h2>
    <div className="mt-8 grid gap-5 md:grid-cols-2">{sellerGuides.map((guide) => <Link key={guide.slug} href={`/guides/${guide.slug}/`} className="focus-ring group rounded-2xl border border-[var(--line)] bg-white p-7 hover:border-[var(--copper)]">
      <h3 className="text-lg font-bold">{guide.title}</h3><p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">{guide.description}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--copper-dark)]">Read the guide<ArrowRight className="size-4" /></span>
    </Link>)}</div>
  </div></section>;
}
