import Link from "next/link";

export function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className={`focus-ring inline-flex items-center gap-2.5 rounded-sm ${light ? "text-white" : "text-[var(--ink)]"}`} aria-label="Haven Home Offers home">
      <span className="grid size-9 place-items-center rounded-full border border-current/25">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 fill-none stroke-current" strokeWidth="1.7"><path d="M4 12.5 12 5l8 7.5"/><path d="M7.5 10.5V19h9v-8.5M10 19v-5h4v5"/></svg>
      </span>
      <span className="leading-none"><span className="font-display block text-[1.25rem]">Haven</span><span className="mt-1 block text-[.52rem] font-bold tracking-[.2em] uppercase">Home Offers</span></span>
    </Link>
  );
}
