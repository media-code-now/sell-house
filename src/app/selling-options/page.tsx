import { coreMetadata } from "@/lib/seo";
import { InteriorPage } from "@/components/interior-page";
import { situations } from "@/lib/content";
import Link from "next/link";
import { SellerGuideLinks } from "@/components/seller-guide-links";
import { marketSlugs, seoMarkets, sellerSituations, situationSlugs } from "@/lib/seo-landing-content";

export const metadata = coreMetadata("/selling-options/");
export default function Page() {
  return <InteriorPage path="/selling-options/" eyebrow="Options, not pressure" title="Compare your Las Vegas home selling options." description="Learn when a direct sale may help—and when another path could be a better fit.">
    <section className="bg-white py-20"><div className="container-shell grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{situations.map(({ title, description, icon: Icon }) => <article key={title} className="rounded-2xl border border-[var(--line)] p-7"><Icon className="size-6 text-[var(--copper)]" /><h2 className="mt-5 text-lg font-bold">{title}</h2><p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{description}</p></article>)}</div></section>
    <section className="bg-[var(--sand)] py-16"><div className="container-shell"><h2 className="font-display text-3xl sm:text-4xl">Explore a guide for your situation.</h2><p className="mt-4 max-w-2xl leading-7 text-[var(--ink-soft)]">Compare keeping the home, listing it, and selling directly. Each guide covers practical steps, tradeoffs, and local resources.</p>
      {marketSlugs.map((market) => <div key={market} className="mt-10"><h3 className="text-xl font-bold">{seoMarkets[market].city} seller guides</h3><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{situationSlugs.map((slug) => <Link key={slug} href={`/${market}/${slug}/`} className="focus-ring rounded-xl border border-[var(--line)] bg-white p-5 font-bold text-[var(--copper-dark)] hover:border-[var(--copper)]">{sellerSituations[slug].h1(seoMarkets[market].city)}</Link>)}</div></div>)}
    </div></section>
    <SellerGuideLinks />
  </InteriorPage>;
}
