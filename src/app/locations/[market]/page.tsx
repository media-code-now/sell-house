import { notFound, permanentRedirect } from "next/navigation";
import { markets } from "@/lib/content";

export function generateStaticParams() { return markets.map(({slug})=>({market:slug})); }
export default async function Page({ params }: { params: Promise<{ market: string }> }) { const { market: slug } = await params; const market = markets.find((item)=>item.slug===slug); if(!market) notFound(); permanentRedirect(`/${market.slug}/`); }
