import { coreMetadata, absoluteUrl, corePages } from "@/lib/seo";
import { SellerGuideLinks } from "@/components/seller-guide-links";
import { StructuredData } from "@/components/structured-data";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, BadgeCheck, CalendarCheck2, Check, CircleDollarSign, Clock3, Hammer,
  Handshake, HeartCrack, Home, KeyRound, Landmark, MapPin, Paintbrush,
  Scale, ShieldCheck, Sparkles, UsersRound, X,
} from "lucide-react";
import { AddressOfferForm } from "@/components/address-offer-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ButtonLink } from "@/components/ui/button-link";
import { cities, neighborhoods } from "@/lib/location-content";

export const metadata = coreMetadata("/");

const benefits = ["Sell as-is", "No agent commissions", "Choose your closing date", "No repairs required", "No obligation"];
const steps = [
  { icon: MapPin, number: "01", title: "Tell us about your property", text: "Start with the address, then share a few simple details about the home and your timeline." },
  { icon: CircleDollarSign, number: "02", title: "Get a fair cash offer", text: "We review the property and present a clear, no-obligation offer with no hidden fees." },
  { icon: CalendarCheck2, number: "03", title: "Choose when you close", text: "Accept only if it works for you, then pick the closing date that fits your next move." },
];
const reasons = [
  { icon: Hammer, title: "Skip repairs and cleanup", text: "Leave the paint, roof, appliances, and unwanted items exactly as they are." },
  { icon: Clock3, title: "Move on your schedule", text: "Close quickly when timing matters—or choose a later date when you need room to plan." },
  { icon: CircleDollarSign, title: "Know what you’ll receive", text: "No agent commission and no surprise deductions for ordinary repair work." },
  { icon: Handshake, title: "Make a pressure-free decision", text: "Review your offer, ask questions, and decide without obligation or pushy sales tactics." },
];
const sellerSituations = [
  { icon: Landmark, title: "Behind on payments", href: "/las-vegas/behind-on-mortgage/" }, { icon: Scale, title: "Foreclosure pressure", href: "/las-vegas/avoid-foreclosure/" },
  { icon: KeyRound, title: "Inherited property", href: "/las-vegas/sell-inherited-house/" }, { icon: UsersRound, title: "Probate", href: "/las-vegas/sell-inherited-house/" },
  { icon: HeartCrack, title: "Divorce", href: "/las-vegas/sell-house-during-divorce/" }, { icon: Home, title: "Vacant property", href: "/las-vegas/sell-vacant-house/" },
  { icon: Paintbrush, title: "Major repairs", href: "/las-vegas/sell-house-needing-repairs/" }, { icon: Sparkles, title: "Need to sell quickly", href: "/guides/how-long-to-sell-house-las-vegas/" },
];
const comparison = [
  ["Repairs", "None required", "Often expected"], ["Agent commission", "$0", "Negotiated with your agent"],
  ["Showings", "None", "Multiple appointments"], ["Closing timeline", "You choose", "Often 30–90+ days"],
  ["Sale certainty", "Direct offer", "Depends on buyer and financing"],
];
const properties = [
  { image: "/images/case-las-vegas.webp", market: "Las Vegas, NV", situation: "Property needed significant updates", result: "Sold as-is on the owner’s timeline" },
  { image: "/images/case-henderson.webp", market: "Henderson, NV", situation: "Inherited home with deferred maintenance", result: "No repairs, cleaning, or public showings" },
  { image: "/images/case-summerlin.webp", market: "Summerlin, Las Vegas", situation: "Owner relocating on a firm deadline", result: "Flexible closing coordinated around the move" },
];
const faqs = [
  ["Do I need to make repairs before selling?", "No. We consider properties in their current condition, including homes that need major repairs, cleanup, or updates."],
  ["Is there a fee to receive an offer?", "No. Requesting and reviewing an offer is free, and there is no obligation to accept it."],
  ["How quickly can I sell?", "Timing depends on the property and title process, but a direct sale can often close much faster than a traditional listing. You can also request additional time when needed."],
  ["Will I pay an agent commission?", "No agent commission is charged when you sell directly to us."],
  ["What types of properties do you consider?", "We consider single-family homes and many other residential properties, whether occupied, vacant, inherited, tenant-occupied, or in need of repairs."],
  ["What happens after I enter my address?", "We’ll ask for a few property details, review your situation, and explain the next step. You remain in control throughout the process."],
];

export default function HomePage() {
  return (
    <main className="overflow-x-clip pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
      <StructuredData data={{ "@context": "https://schema.org", "@graph": [
        { "@type": "WebPage", "@id": `${absoluteUrl()}#webpage`, url: absoluteUrl(), name: corePages["/"].title, description: corePages["/"].description, isPartOf: { "@id": `${absoluteUrl()}#website` }, about: { "@id": `${absoluteUrl()}#organization` } },
        { "@type": "FAQPage", mainEntity: faqs.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
      ] }} />
      <section className="relative min-h-[780px] overflow-hidden bg-[var(--ink)] text-white lg:min-h-[830px]">
        <Image src="/images/desert-home-hero.webp" alt="Contemporary home at sunset" fill preload className="object-cover object-[66%_center] opacity-70" sizes="100vw" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,24,31,.98)_0%,rgba(10,24,31,.9)_45%,rgba(10,24,31,.25)_82%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a181f]/70 via-transparent to-transparent" />
        <SiteHeader />
        <div className="container-shell relative z-10 flex min-h-[780px] items-center pb-16 pt-32 lg:min-h-[830px]">
          <div className="max-w-3xl">
            <p className="eyebrow flex items-center gap-2 text-[#edb891]"><span className="h-px w-7 bg-current" />A clear path to your next chapter</p>
            <h1 className="font-display text-balance mt-5 text-[3.25rem] leading-[.96] sm:text-7xl lg:text-[5.35rem]">Sell Your House Fast in Las Vegas</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75 sm:text-xl">Get a fair cash offer for your property. No repairs, no cleaning, no commissions, and no obligation.</p>
            <AddressOfferForm theme="dark" className="mt-8 max-w-2xl" />
            <div className="mt-7 grid max-w-2xl grid-cols-1 gap-x-5 gap-y-3 text-sm text-white/78 min-[460px]:grid-cols-2 lg:grid-cols-3">{benefits.map((benefit) => <span key={benefit} className="flex items-center gap-2"><span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#e9b28b]/15"><Check className="size-3.5 text-[#edb891]" /></span>{benefit}</span>)}</div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 z-10 hidden border-t border-white/15 bg-black/15 backdrop-blur-sm lg:block"><div className="container-shell flex h-20 items-center justify-between text-sm text-white/70"><span className="flex items-center gap-2"><ShieldCheck className="size-5 text-[#edb891]" />Private and secure</span><span className="flex items-center gap-2"><BadgeCheck className="size-5 text-[#edb891]" />No fees or obligation</span><span className="flex items-center gap-2"><Handshake className="size-5 text-[#edb891]" />Real people, no pressure</span></div></div>
      </section>

      <section className="bg-white py-20 sm:py-28" id="how-it-works">
        <div className="container-shell"><SectionHeading eyebrow="How it works" title="From address to offer in three simple steps." text="A straightforward process built to give you answers, flexibility, and control." />
          <div className="mt-14 grid gap-5 lg:grid-cols-3">{steps.map(({icon: Icon,number,title,text}) => <article key={number} className="relative rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-7 sm:p-9"><span aria-hidden="true" className="absolute right-7 top-6 font-display text-5xl text-[var(--ink-soft)]/75">{number}</span><div className="grid size-12 place-items-center rounded-full bg-[var(--sage)]"><Icon className="size-5" /></div><h3 className="mt-8 text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{text}</p></article>)}</div>
          <div className="mt-10 text-center"><ButtonLink href="#final-offer">Get My Cash Offer</ButtonLink></div>
        </div>
      </section>

      <section className="bg-[var(--paper)] py-20 sm:py-28">
        <div className="container-shell grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:gap-20"><div><p className="eyebrow text-[var(--copper-dark)]">Why homeowners choose a direct sale</p><h2 className="font-display text-balance mt-4 text-4xl leading-tight sm:text-6xl">Less work. Less uncertainty. More control.</h2><p className="mt-5 max-w-lg leading-7 text-[var(--ink-soft)]">Selling should help you move forward—not create another list of things to fix, clean, schedule, and worry about.</p><div className="relative mt-8 aspect-[4/3] overflow-hidden rounded-3xl shadow-lg"><Image src="/images/southwestern-living-room.webp" alt="Sunlit living room with natural wood furniture and views of a desert garden" fill sizes="(max-width: 1023px) 100vw, 40vw" className="object-cover" /></div></div><div className="grid gap-4 sm:grid-cols-2">{reasons.map(({icon: Icon,title,text}) => <article key={title} className="rounded-2xl bg-white p-7 shadow-[0_12px_40px_rgba(27,39,44,.06)]"><Icon className="size-6 text-[var(--copper)]"/><h3 className="mt-5 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{text}</p></article>)}</div></div>
      </section>

      <section className="bg-[#193039] py-20 text-white sm:py-28">
        <div className="container-shell"><SectionHeading dark eyebrow="Whatever brought you here" title="We understand that every home sale has a story." text="You don’t need a perfect property or a perfect situation to explore your options." />
          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">{sellerSituations.map(({icon: Icon,title,href}) => <Link key={title} href={href} className="focus-ring rounded-2xl border border-white/12 bg-white/[.045] p-5 transition hover:border-[#edb891] hover:bg-white/10 sm:p-6"><Icon className="size-5 text-[#edb891]"/><h3 className="mt-4 text-sm font-bold leading-5">{title}</h3><span className="mt-3 inline-flex items-center gap-1 text-xs text-[#edb891]">Explore your options<ArrowRight className="size-3"/></span></Link>)}</div>
          <div className="mt-10 flex justify-center"><ButtonLink href="/selling-options" variant="light">See My Selling Options</ButtonLink></div>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-28">
        <div className="container-shell"><SectionHeading eyebrow="Compare your options" title="A direct cash offer vs. a traditional listing." text="Both can work. The right choice depends on whether you value maximum market exposure or a simpler, more certain process." />
          <div className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-3xl border border-[var(--line)]">
            <div className="grid grid-cols-[1.15fr_1fr_1fr] bg-[var(--ink)] px-4 py-5 text-xs font-bold uppercase tracking-wider text-white sm:px-7"><span>What to expect</span><span className="text-[#edb891]">Cash offer</span><span className="text-white/60">Traditional sale</span></div>
            {comparison.map(([label,cash,traditional]) => <div key={label} className="grid grid-cols-[1.15fr_1fr_1fr] items-center border-t border-[var(--line)] px-4 py-5 text-xs sm:px-7 sm:text-sm"><strong>{label}</strong><span className="flex items-center gap-1.5 font-bold text-[#43604d]"><Check className="hidden size-4 sm:block" />{cash}</span><span className="flex items-center gap-1.5 text-[var(--ink-soft)]"><X className="hidden size-4 text-[#98705e] sm:block" />{traditional}</span></div>)}
          </div>
          <div className="mt-9 text-center"><ButtonLink href="#final-offer">Get My Cash Offer</ButtonLink></div>
        </div>
      </section>

      <section className="bg-[var(--paper)] py-20 sm:py-28">
        <div className="container-shell"><div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><SectionHeading align="left" eyebrow="Property stories" title="Homes don’t need to be market-ready." text="Examples of the kinds of homeowner situations a direct sale can simplify." /><span className="w-fit rounded-full bg-[var(--sand)] px-3 py-1.5 text-[.65rem] font-bold uppercase tracking-widest text-[var(--ink-soft)]">Illustrative case studies</span></div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">{properties.map((property) => <article key={property.market} className="overflow-hidden rounded-3xl bg-white shadow-[0_15px_50px_rgba(27,39,44,.08)]"><div className="relative aspect-[4/2.75]"><Image src={property.image} alt={`Representative home in ${property.market}`} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 33vw" /></div><div className="p-6"><p className="eyebrow text-[var(--copper-dark)]">{property.market}</p><h3 className="mt-4 font-bold">{property.situation}</h3><p className="mt-3 flex gap-2 text-sm leading-6 text-[var(--ink-soft)]"><Check className="mt-1 size-4 shrink-0 text-[#52715c]"/>{property.result}</p></div></article>)}</div>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-28">
        <div className="container-shell"><SectionHeading eyebrow="What to expect" title="Clear answers. Space to decide." text="A home sale is a significant decision. These commitments guide our process." />
          <div className="mt-12 grid gap-5 lg:grid-cols-3">{[
            ["Understand your offer", "Ask how property condition, repair needs, and the closing timeline affect the offer before deciding."],
            ["Compare your options", "Review a direct sale alongside listing, making repairs, or keeping the property. Consider the costs and tradeoffs of each path."],
            ["Decide without pressure", "Requesting an offer is free. You can review the details, ask questions, and choose whether to proceed."],
          ].map(([title, text]) => <article key={title} className="rounded-2xl border border-[var(--line)] p-7"><ShieldCheck className="size-7 text-[var(--copper)]"/><h3 className="font-display mt-5 text-2xl">{title}</h3><p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">{text}</p></article>)}</div>
        </div>
      </section>

      <section className="bg-[var(--sand)] py-20 sm:py-28">
        <div className="container-shell"><SectionHeading eyebrow="Las Vegas Valley areas we serve" title="Local focus. Straightforward options." text="Explore direct-sale options across Las Vegas, Henderson, North Las Vegas, Summerlin, and the southwest valley." />
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[...Object.values(cities),...Object.values(neighborhoods)].map((market,index)=><Link key={`${market.kind}-${market.slug}`} href={market.kind==="city"?`/${market.slug}/`:`/${market.parentSlug}/${market.slug}/`} className="group relative min-h-64 overflow-hidden rounded-3xl bg-[var(--ink)] p-7 text-white"><Image src={["/images/desert-neighborhood.webp", "/images/case-henderson.webp", "/images/case-summerlin.webp"][index%3]} alt="" fill sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw" className="object-cover opacity-65 transition duration-500 group-hover:scale-105"/><div className="absolute inset-0 bg-gradient-to-t from-[#0a181f]/95 via-[#0a181f]/45 to-[#0a181f]/20"/><div className="relative flex h-full flex-col justify-between"><span className="eyebrow text-white/55">{market.kind==="city"?"City":"Neighborhood"}</span><div><h3 className="font-display text-4xl">{market.name}</h3><p className="mt-1 text-sm text-white/60">{market.kind==="neighborhood"?`${market.parentCity}, NV`:market.state}</p><span className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest">Explore this area <ArrowRight className="size-4 transition group-hover:translate-x-1"/></span></div></div></Link>)}</div>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-28">
        <div className="container-shell grid gap-12 lg:grid-cols-[.65fr_1fr] lg:gap-24"><div><p className="eyebrow text-[var(--copper-dark)]">Frequently asked questions</p><h2 className="font-display text-balance mt-4 text-4xl leading-tight sm:text-6xl">Answers before you take the next step.</h2><p className="mt-5 leading-7 text-[var(--ink-soft)]">Still unsure? Start with your address. Reviewing your options does not commit you to a sale.</p></div><div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">{faqs.map(([question,answer])=><details key={question} className="group py-1"><summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-5 rounded py-5 font-bold"><span>{question}</span><span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--paper)] text-lg transition group-open:rotate-45">+</span></summary><p className="max-w-2xl pb-6 pr-8 text-sm leading-7 text-[var(--ink-soft)]">{answer}</p></details>)}</div></div>
      </section>

      <section id="final-offer" className="relative overflow-hidden bg-[var(--ink)] py-20 text-white sm:py-28"><div className="absolute -right-24 -top-24 size-96 rounded-full bg-[#31505b]/45 blur-3xl"/><div className="container-shell relative z-10"><div className="mx-auto max-w-3xl text-center"><p className="eyebrow text-[#edb891]">Ready when you are</p><h2 className="font-display text-balance mt-4 text-4xl leading-tight sm:text-6xl">It starts with your property address.</h2><p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/65">Find out what a simple, as-is sale could look like. It’s free and there’s no obligation.</p><AddressOfferForm theme="dark" className="mx-auto mt-9 max-w-2xl text-left"/><div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-white/55"><span className="flex items-center gap-2"><ShieldCheck className="size-4"/>Private and secure</span><span className="flex items-center gap-2"><BadgeCheck className="size-4"/>No obligation</span></div></div></div></section>
      <SellerGuideLinks />
      <SiteFooter />

      <div className="mobile-offer-cta fixed inset-x-0 bottom-0 z-50 border-t border-black/10 bg-white/95 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] shadow-[0_-10px_35px_rgba(15,28,35,.12)] backdrop-blur md:hidden"><a href="#final-offer" className="focus-ring flex min-h-14 items-center justify-center gap-2 rounded-xl bg-[var(--copper)] px-5 text-sm font-bold text-white">Get My Cash Offer <ArrowRight className="size-4"/></a></div>
    </main>
  );
}

function SectionHeading({ eyebrow, title, text, dark = false, align = "center" }: { eyebrow: string; title: string; text: string; dark?: boolean; align?: "center" | "left" }) {
  return <div className={`${align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}`}><p className={`eyebrow ${dark ? "text-[#edb891]" : "text-[var(--copper-dark)]"}`}>{eyebrow}</p><h2 className={`font-display text-balance mt-4 text-4xl leading-tight sm:text-6xl ${dark ? "text-white" : "text-[var(--ink)]"}`}>{title}</h2><p className={`mt-5 leading-7 ${dark ? "text-white/60" : "text-[var(--ink-soft)]"}`}>{text}</p></div>;
}
