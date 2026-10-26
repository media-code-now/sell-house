"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { navItems } from "@/lib/content";
import { BrandMark } from "./brand-mark";
import { ButtonLink } from "./ui/button-link";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="absolute inset-x-0 top-0 z-30 border-b border-white/15 text-white">
      <div className="container-shell flex h-20 items-center justify-between">
        <BrandMark light />
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Main navigation">
          {navItems.map((item) => <Link key={item.href} href={item.href} className="focus-ring rounded-sm text-sm text-white/80 transition hover:text-white">{item.label}</Link>)}
        </nav>
        <div className="hidden sm:block"><ButtonLink href="/offer" variant="light">Get My Cash Offer</ButtonLink></div>
        <button onClick={() => setOpen(!open)} className="focus-ring grid size-11 place-items-center rounded-full border border-white/25 lg:hidden" aria-label="Toggle navigation" aria-expanded={open}>{open ? <X /> : <Menu />}</button>
      </div>
      {open && <div className="mx-4 rounded-2xl border border-white/15 bg-[var(--ink)] p-4 shadow-2xl lg:hidden"><nav className="grid" aria-label="Mobile navigation">{navItems.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="border-b border-white/10 px-2 py-4 text-sm">{item.label}</Link>)}<ButtonLink href="/offer" className="mt-4">Get My Cash Offer</ButtonLink></nav></div>}
    </header>
  );
}
