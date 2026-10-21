import { coreMetadata } from "@/lib/seo";
import Link from "next/link";
import { InteriorPage } from "@/components/interior-page";
import { cities, neighborhoods } from "@/lib/location-content";

export const metadata = coreMetadata("/locations/");
export default function Page() { return <InteriorPage path="/locations/" eyebrow="Local by design" title="Focused service across the Las Vegas Valley." description="Property decisions are local. Explore verified jurisdiction, neighborhood, property-type, and selling considerations for each area."><section className="bg-white py-20"><div className="container-shell"><h2 className="font-display text-4xl">Cities</h2><div className="mt-8 grid gap-5 md:grid-cols-3">{Object.values(cities).map(m=><AreaCard key={m.slug} href={`/${m.slug}/`} label="City" name={m.name} location={m.state} description={m.description}/>)}</div><h2 className="font-display mt-16 text-4xl">Las Vegas neighborhoods</h2><div className="mt-8 grid gap-5 md:grid-cols-2">{Object.values(neighborhoods).map(m=><AreaCard key={`${m.parentSlug}-${m.slug}`} href={`/${m.parentSlug}/${m.slug}/`} label="Neighborhood" name={m.name} location={`${m.parentCity}, Nevada`} description={m.description}/>)}</div></div></section></InteriorPage> }

function AreaCard({href,label,name,location,description}:{href:string;label:string;name:string;location:string;description:string}) { return <Link href={href} className="rounded-2xl border border-[var(--line)] p-8 transition hover:-translate-y-1 hover:shadow-xl"><p className="eyebrow text-[var(--copper-dark)]">{label}</p><h3 className="font-display mt-5 text-4xl">{name}</h3><p className="mt-2 text-[var(--ink-soft)]">{location}</p><p className="mt-5 text-sm leading-6 text-[var(--ink-soft)]">{description}</p></Link> }
