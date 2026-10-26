import { InteriorPage } from "@/components/interior-page";
import { SellerGuideLinks } from "@/components/seller-guide-links";
import { StructuredData } from "@/components/structured-data";
import { sellerGuides } from "@/lib/seller-guides";
import { absoluteUrl, coreMetadata } from "@/lib/seo";

export const metadata = coreMetadata("/guides/");

export default function GuidesPage() {
  return <InteriorPage path="/guides/" eyebrow="Homeowner resources" title="Las Vegas home selling guides" description="Prepare for an as-is sale, understand the questions to ask, and compare your options before making a commitment.">
    <StructuredData data={{ "@context": "https://schema.org", "@type": "ItemList", itemListElement: sellerGuides.map((guide, index) => ({ "@type": "ListItem", position: index + 1, name: guide.title, url: absoluteUrl(`/guides/${guide.slug}/`) })) }} />
    <SellerGuideLinks />
  </InteriorPage>;
}
