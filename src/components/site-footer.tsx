import Link from "next/link";
import { BrandMark } from "./brand-mark";
import { navItems } from "@/lib/content";
import { cities, neighborhoods } from "@/lib/location-content";

export function SiteFooter() {
  return (
    <footer className="bg-[#122028] py-14 text-white">
      <div className="container-shell grid gap-12 md:grid-cols-[1.5fr_1fr_1fr]">
        <div><BrandMark light /><p className="mt-5 max-w-sm text-sm leading-6 text-white/60">A simpler, more human way to explore selling your home—on your timeline and without pressure.</p></div>
        <div><p className="eyebrow text-white/40">Explore</p><div className="mt-5 grid gap-3">{navItems.map((item) => <Link key={item.href} href={item.href} className="text-sm text-white/70 hover:text-white">{item.label}</Link>)}</div></div>
        <div><p className="eyebrow text-white/40">Las Vegas Valley</p><div className="mt-5 grid gap-3">{Object.values(cities).map((market) => <Link key={market.slug} href={`/${market.slug}/`} className="text-sm text-white/70 hover:text-white">{market.name}, {market.stateCode}</Link>)}{Object.values(neighborhoods).map((area) => <Link key={`${area.parentSlug}-${area.slug}`} href={`/${area.parentSlug}/${area.slug}/`} className="text-sm text-white/70 hover:text-white">{area.name}</Link>)}</div></div>
      </div>
      <div className="container-shell mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row sm:justify-between"><p>© {new Date().getFullYear()} Haven Home Offers. All rights reserved.</p><p>Offers subject to property review. No obligation.</p></div>
    </footer>
  );
}
