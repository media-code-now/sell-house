import Image from "next/image";
import { PageStructuredData } from "./structured-data";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { ButtonLink } from "./ui/button-link";

const heroImages: Record<string, { src: string; alt: string }> = {
  "/about/": { src: "/images/southwestern-living-room.webp", alt: "Sunlit Southwestern living room with warm wood furniture and desert garden views" },
  "/how-it-works/": { src: "/images/moving-day-entryway.webp", alt: "Moving boxes and house keys beside an open, sunlit doorway" },
  "/selling-options/": { src: "/images/southwestern-living-room.webp", alt: "Comfortable living room with natural textures and warm afternoon light" },
  "/locations/": { src: "/images/desert-neighborhood.webp", alt: "Illustrative desert neighborhood with stucco homes and mountain views" },
};

export function InteriorPage({ path, eyebrow, title, description, children }: { path?: string; eyebrow: string; title: string; description: string; children?: React.ReactNode }) {
  const heroImage = path ? heroImages[path] : undefined;
  return <>
    <main>
      {path && <PageStructuredData path={path} title={title} description={description} type={path === "/about/" ? "AboutPage" : (path === "/locations/" || path === "/guides/") ? "CollectionPage" : "WebPage"} />}
      <div className="relative overflow-hidden bg-[var(--ink)] pb-20 pt-36 text-white">
        <SiteHeader />
        <div className={`container-shell relative z-10 ${heroImage ? "grid items-center gap-10 lg:grid-cols-[1.15fr_.85fr] lg:gap-14" : ""}`}>
          <div>
            <p className="eyebrow text-[#dda782]">{eyebrow}</p>
            <h1 className="font-display mt-5 max-w-4xl text-5xl leading-[1.02] sm:text-7xl">{title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">{description}</p>
            <div className="mt-8 flex flex-wrap gap-3"><ButtonLink href="/offer">Get My Cash Offer</ButtonLink><ButtonLink href="/selling-options" variant="light">See My Selling Options</ButtonLink></div>
          </div>
          {heroImage && <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/15 shadow-2xl lg:aspect-[4/5]">
            <Image src={heroImage.src} alt={heroImage.alt} fill sizes="(max-width: 1023px) 100vw, 45vw" className="object-cover" />
          </div>}
        </div>
        <div className="absolute -right-20 -top-20 size-96 rounded-full bg-[#31505b]/35 blur-3xl" />
      </div>
      {children}
    </main>
    <SiteFooter />
  </>;
}
