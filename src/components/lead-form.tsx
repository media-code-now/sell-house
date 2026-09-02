"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import { FormEvent, useState } from "react";

export function LeadForm({ compact = false, initialAddress = "" }: { compact?: boolean; initialAddress?: string }) {
  const [submitted, setSubmitted] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSubmitted(true); }
  if (submitted) return <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl bg-[#edf1ec] p-6 text-center"><CheckCircle2 className="mb-3 size-8 text-[#52715c]"/><h3 className="font-display text-2xl">You’re off to a good start.</h3><p className="mt-2 text-sm text-[var(--ink-soft)]">This phase includes the experience layer. Secure lead persistence connects in the next integration step.</p></div>;
  return (
    <form onSubmit={submit} className={compact ? "grid gap-3" : "grid gap-4"}>
      <div><label htmlFor="address" className="mb-2 block text-xs font-bold uppercase tracking-[.12em]">Property address</label><input id="address" name="address" required defaultValue={initialAddress} autoComplete="street-address" placeholder="123 Main Street" className="focus-ring h-14 w-full rounded-xl border border-black/10 bg-white px-4 text-[var(--ink)] placeholder:text-black/35" /></div>
      {!compact && <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="name" className="mb-2 block text-xs font-bold uppercase tracking-[.12em]">Your name</label><input id="name" name="name" required autoComplete="name" placeholder="Full name" className="focus-ring h-14 w-full rounded-xl border border-black/10 bg-white px-4" /></div><div><label htmlFor="phone" className="mb-2 block text-xs font-bold uppercase tracking-[.12em]">Phone</label><input id="phone" name="phone" required type="tel" autoComplete="tel" placeholder="(555) 000-0000" className="focus-ring h-14 w-full rounded-xl border border-black/10 bg-white px-4" /></div></div>}
      <button type="submit" className="focus-ring flex min-h-14 items-center justify-center gap-2 rounded-xl bg-[var(--copper)] px-5 text-sm font-bold text-white shadow-lg transition hover:bg-[var(--copper-dark)]">Get My Cash Offer <ArrowRight className="size-4" /></button>
      <p className="text-center text-[.7rem] leading-4 text-[var(--ink-soft)]">No fees. No obligation. Your information stays private.</p>
    </form>
  );
}
