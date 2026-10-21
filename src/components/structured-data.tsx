import { absoluteUrl, siteName } from "@/lib/seo";

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
