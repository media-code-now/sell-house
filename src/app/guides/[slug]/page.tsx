import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StructuredData } from "@/components/structured-data";
import { ButtonLink } from "@/components/ui/button-link";
import { getSellerGuide, sellerGuides } from "@/lib/seller-guides";
import { absoluteUrl, pageMetadata, siteName } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() { return sellerGuides.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: Props) {
  const guide = getSellerGuide((await params).slug);
  if (!guide) notFound();
  return pageMetadata(guide.title, guide.description, `/guides/${guide.slug}/`);
}

export default async function SellerGuidePage({ params }: Props) {
  const guide = getSellerGuide((await params).slug);
  if (!guide) notFound();
  const url = absoluteUrl(`/guides/${guide.slug}/`);
  const crumbs = [{ name: "Home", url: absoluteUrl() }, { name: "Seller guides", url: absoluteUrl("/guides/") }, { name: guide.title, url }];
  return <><main>
    <StructuredData data={{ "@context": "https://schema.org", "@graph": [
      { "@type": "WebPage", "@id": `${url}#webpage`, url, name: guide.title, description: guide.description, inLanguage: "en-US", isPartOf: { "@id": `${absoluteUrl()}#website` }, mainEntity: { "@id": `${url}#article` } },
      { "@type": "Article", "@id": `${url}#article`, headline: guide.title, description: guide.description, mainEntityOfPage: { "@id": `${url}#webpage` }, author: { "@type": "Organization", "@id": `${absoluteUrl()}#organization`, name: siteName, url: absoluteUrl("/about/") }, publisher: { "@id": `${absoluteUrl()}#organization` }, inLanguage: "en-US", articleSection: "Home selling guides" },
      { "@type": "BreadcrumbList", itemListElement: crumbs.map((crumb, index) => ({ "@type": "ListItem", position: index + 1, name: crumb.name, item: crumb.url })) },
    ] }} />
    <article>
      <div className="relative bg-[var(--ink)] pb-16 pt-32 text-white"><SiteHeader /><div className="container-shell">
        <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap gap-2 text-sm text-white/65"><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/guides/">Seller guides</Link><span aria-hidden="true">/</span><span aria-current="page">{guide.title}</span></nav>
        <p className="eyebrow text-[#edb891]">Las Vegas Valley homeowner resources</p><h1 className="font-display mt-5 max-w-4xl text-4xl leading-tight sm:text-6xl">{guide.title}</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-white/75">{guide.intro}</p><p className="mt-6 text-sm text-white/65">By <Link href="/about/" className="underline underline-offset-4">{siteName}</Link></p>
      </div></div>
      <div className="container-shell grid gap-12 py-16 lg:grid-cols-[.4fr_1fr]">
        <nav aria-label="On this page" className="h-fit rounded-2xl bg-[var(--sand)] p-6 lg:sticky lg:top-6"><p className="font-bold">In this guide</p><ol className="mt-4 grid gap-4 text-sm leading-6">{guide.sections.map((section) => <li key={section.id}><a href={`#${section.id}`} className="focus-ring hover:underline">{section.title}</a></li>)}</ol></nav>
        <div className="max-w-3xl space-y-12">{guide.sections.map((section) => <section key={section.id} id={section.id} className="scroll-mt-8"><h2 className="font-display text-3xl sm:text-4xl">{section.title}</h2><div className="mt-5 space-y-4 leading-8 text-[var(--ink-soft)]">{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>{section.checklist && <ul className="mt-6 list-disc space-y-3 rounded-2xl bg-[var(--paper)] p-7 pl-12 text-sm leading-7">{section.checklist.map((item) => <li key={item}>{item}</li>)}</ul>}</section>)}</div>
      </div>
    </article>
    <section className="bg-[var(--paper)] py-14"><div className="container-shell"><h2 className="font-display text-3xl">Keep exploring your options</h2><div className="mt-6 flex flex-wrap gap-5">{guide.related.map((link) => <Link key={link.href} href={link.href} className="focus-ring font-bold text-[var(--copper-dark)] underline underline-offset-4">{link.label}</Link>)}</div><div className="mt-10"><ButtonLink href="/offer/">Request a No-Obligation Cash Offer</ButtonLink></div></div></section>
  </main><SiteFooter /></>;
}
