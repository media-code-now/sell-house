import { InteriorPage } from "@/components/interior-page";
import { situations } from "@/lib/content";

export const metadata = { title: "Selling Options" };
export default function Page() { return <InteriorPage eyebrow="Options, not pressure" title="The right way to sell depends on your life." description="Learn when a direct sale may help—and when another path could be a better fit."><section className="bg-white py-20"><div className="container-shell grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{situations.map(({title,description,icon:Icon})=><article key={title} className="rounded-2xl border border-[var(--line)] p-7"><Icon className="size-6 text-[var(--copper)]"/><h2 className="mt-5 text-lg font-bold">{title}</h2><p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{description}</p></article>)}</div></section></InteriorPage> }
