import { PageStructuredData } from "./structured-data";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { ButtonLink } from "./ui/button-link";

export function InteriorPage({ path, eyebrow, title, description, children }: { path?: string; eyebrow: string; title: string; description: string; children?: React.ReactNode }) {
  return <><main>{path && <PageStructuredData path={path} title={title} description={description} type={path === "/about/" ? "AboutPage" : path === "/locations/" ? "CollectionPage" : "WebPage"} />}<div className="relative overflow-hidden bg-[var(--ink)] pb-20 pt-36 text-white"><SiteHeader /><div className="container-shell relative z-10"><p className="eyebrow text-[#dda782]">{eyebrow}</p><h1 className="font-display mt-5 max-w-4xl text-5xl leading-[1.02] sm:text-7xl">{title}</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">{description}</p><div className="mt-8 flex flex-wrap gap-3"><ButtonLink href="/offer">Get My Cash Offer</ButtonLink><ButtonLink href="/selling-options" variant="light">See My Selling Options</ButtonLink></div></div><div className="absolute -right-20 -top-20 size-96 rounded-full bg-[#31505b]/35 blur-3xl" /></div>{children}</main><SiteFooter /></>;
}
