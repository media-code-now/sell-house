import { coreMetadata } from "@/lib/seo";
import { InteriorPage } from "@/components/interior-page";

export const metadata = coreMetadata("/how-it-works/");
export default function Page() { return <InteriorPage path="/how-it-works/" eyebrow="A clear process" title="Selling without the usual uncertainty." description="From the first property details to closing day, you choose whether—and how quickly—to move forward."><section className="bg-white py-20"><div className="container-shell grid gap-6 md:grid-cols-3">{["Share your property","Review a clear offer","Close on your timeline"].map((title,i)=><article key={title} className="rounded-2xl border border-[var(--line)] p-8"><span className="font-display text-3xl text-[var(--copper)]">0{i+1}</span><h2 className="mt-8 text-xl font-bold">{title}</h2><p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">A straightforward step, guided by a real person and with no obligation to continue.</p></article>)}</div></section></InteriorPage> }
