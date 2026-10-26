import { absoluteUrl, siteName, siteUrl } from "@/lib/seo";
import { cities } from "@/lib/location-content";

export function SiteStructuredData() {
  return <StructuredData data={{ "@context": "https://schema.org", "@graph": [
    { "@type": "Organization", "@id": `${absoluteUrl()}#organization`, name: siteName, url: absoluteUrl(), logo: `${siteUrl}/icon.svg`, description: "Direct, as-is home buying in the Las Vegas Valley.", areaServed: Object.values(cities).map((city) => ({ "@type": "City", name: city.name, containedInPlace: { "@type": "State", name: "Nevada" } })) },
    { "@type": "WebSite", "@id": `${absoluteUrl()}#website`, url: absoluteUrl(), name: siteName, inLanguage: "en-US", publisher: { "@id": `${absoluteUrl()}#organization` } },
    { "@type": "Service", "@id": `${absoluteUrl()}#home-buying`, name: "As-is cash home buying", serviceType: "Residential home buying", provider: { "@id": `${absoluteUrl()}#organization` }, url: absoluteUrl("/how-it-works/"), areaServed: Object.values(cities).map((city) => ({ "@type": "City", name: city.name })) },
  ] }} />;
}

export function StructuredData({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function PageStructuredData({ path, title, description, type = "WebPage" }: { path: string; title: string; description: string; type?: string }) {
  const url = absoluteUrl(path);
  return <StructuredData data={{ "@context": "https://schema.org", "@graph": [
    { "@type": type, "@id": `${url}#webpage`, url, name: title, description, inLanguage: "en-US", isPartOf: { "@id": `${absoluteUrl()}#website` }, publisher: { "@id": `${absoluteUrl()}#organization` } },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: siteName, item: absoluteUrl() },
      { "@type": "ListItem", position: 2, name: title, item: url },
    ] },
  ] }} />;
}
