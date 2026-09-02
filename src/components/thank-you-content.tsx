"use client";

import { BadgeCheck, CalendarDays, Check, ChevronDown, CircleDollarSign, Clock3, Handshake, Home, LoaderCircle, MapPin, Search, ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

const steps = [
  { icon: Home, title: "We review the property information", text: "We start with the details you shared about the home and your situation." },
  { icon: Search, title: "We research comparable properties", text: "We look at relevant nearby sales and current local market conditions." },
  { icon: Clock3, title: "We contact you", text: "A home-buying specialist reaches out to learn anything else we need to know." },
  { icon: CircleDollarSign, title: "We present your selling options", text: "After review, we explain the available paths clearly—including any offer we can make." },
  { icon: Handshake, title: "You decide whether to proceed", text: "Ask questions, take your time, and choose what feels right. The decision is always yours." },
];

const assurances = ["No obligation", "No repairs required", "No pressure", "You choose the closing date"];

export function ThankYouContent() {
  const [address, setAddress] = useState("");
  const [draftToken, setDraftToken] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredWindow, setPreferredWindow] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [scheduled, setScheduled] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const summary = JSON.parse(sessionStorage.getItem("haven-submission-summary") || "null") as { address?: string; draftToken?: string } | null;
        setAddress(summary?.address || "Your submitted property");
        setDraftToken(summary?.draftToken || "");
      } catch { setAddress("Your submitted property"); }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  async function schedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      const response = await fetch("/api/leads/schedule", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ draftToken, preferredDate, preferredWindow }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "We couldn’t schedule the call.");
      setScheduled(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "We couldn’t schedule the call."); }
    finally { setBusy(false); }
  }

  const today = new Date().toISOString().split("T")[0];
  return (
    <div className="container-shell py-10 sm:py-16 lg:py-20">
      <section className="mx-auto max-w-3xl text-center"><div className="mx-auto grid size-16 place-items-center rounded-full bg-[#e4ede5]"><BadgeCheck className="size-8 text-[#4f7057]"/></div><p className="eyebrow mt-7 text-[var(--copper-dark)]">Submission received</p><h1 className="font-display text-balance mt-4 text-5xl leading-[1.02] sm:text-7xl">We’re Reviewing Your Property</h1><p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[var(--ink-soft)] sm:text-lg">Thank you. We’ll review the information carefully before discussing any available offer or selling option.</p></section>

      <div className="mx-auto mt-9 flex max-w-2xl items-start gap-3 rounded-2xl border border-[var(--line)] bg-white p-4 text-left shadow-sm sm:items-center sm:p-5"><div className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--paper)]"><MapPin className="size-5 text-[var(--copper)]"/></div><div><p className="text-[.65rem] font-bold uppercase tracking-[.15em] text-[var(--ink-soft)]">Property submitted</p><p className="mt-1 font-bold leading-6">{address || <span className="inline-block h-5 w-52 animate-pulse rounded bg-[var(--sand)]"/>}</p></div></div>

      <div className="mx-auto mt-12 max-w-4xl rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_20px_70px_rgba(20,35,42,.06)] sm:p-10"><div className="text-center"><p className="eyebrow text-[var(--copper-dark)]">What happens next</p><h2 className="font-display mt-3 text-3xl sm:text-4xl">A thoughtful review, then a clear conversation.</h2></div><div className="relative mt-10 grid gap-0"><div className="absolute bottom-8 left-5 top-8 w-px bg-[var(--line)] sm:left-6"/>{steps.map(({icon:Icon,title,text},index)=><div key={title} className="relative grid grid-cols-[2.5rem_1fr] gap-4 pb-8 last:pb-0 sm:grid-cols-[3rem_1fr] sm:gap-5"><div className="z-10 grid size-10 place-items-center rounded-full border border-[var(--line)] bg-[var(--paper)] sm:size-12"><Icon className="size-4 text-[var(--copper-dark)] sm:size-5"/></div><div className="pt-1"><p className="text-[.65rem] font-bold uppercase tracking-[.15em] text-[var(--copper-dark)]">Step {index+1}</p><h3 className="mt-1 font-bold sm:text-lg">{title}</h3><p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{text}</p></div></div>)}</div></div>

      <div className="mx-auto mt-8 grid max-w-4xl grid-cols-2 gap-3 lg:grid-cols-4">{assurances.map((item)=><div key={item} className="flex min-h-24 flex-col items-center justify-center rounded-2xl bg-[#193039] p-4 text-center text-white"><Check className="size-5 text-[#edb891]"/><p className="mt-3 text-xs font-bold sm:text-sm">{item}</p></div>)}</div>

      <section className="mx-auto mt-12 max-w-2xl text-center"><ShieldCheck className="mx-auto size-6 text-[var(--copper)]"/><h2 className="font-display mt-4 text-3xl">Want to choose a time to talk?</h2><p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">Scheduling is completely optional. You can also wait for our team to reach out.</p>
        {!showSchedule && !scheduled && <button onClick={()=>setShowSchedule(true)} type="button" className="focus-ring mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-white px-6 text-sm font-bold transition hover:border-[var(--copper)]"><CalendarDays className="size-4"/>Schedule a Call <ChevronDown className="size-4"/></button>}
        {showSchedule && !scheduled && <form onSubmit={schedule} className="mt-7 rounded-2xl border border-[var(--line)] bg-white p-5 text-left shadow-sm sm:p-6"><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold uppercase tracking-[.12em] text-[var(--ink-soft)]">Preferred day<input required type="date" min={today} value={preferredDate} onChange={(event)=>setPreferredDate(event.target.value)} className="focus-ring mt-2 h-14 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-base font-normal normal-case tracking-normal text-[var(--ink)]"/></label><label className="text-xs font-bold uppercase tracking-[.12em] text-[var(--ink-soft)]">Time of day<select required value={preferredWindow} onChange={(event)=>setPreferredWindow(event.target.value)} className="focus-ring mt-2 h-14 w-full rounded-xl border border-[var(--line)] bg-white px-4 text-base font-normal normal-case tracking-normal text-[var(--ink)]"><option value="">Select a time</option><option>Morning</option><option>Afternoon</option><option>Evening</option></select></label></div>{error&&<p role="alert" className="mt-4 text-sm font-bold text-red-700">{error}</p>}<button disabled={busy} type="submit" className="focus-ring mt-5 flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-[var(--copper)] px-5 text-sm font-bold text-white disabled:opacity-60">{busy?<><LoaderCircle className="size-4 animate-spin"/>Scheduling…</>:"Request This Time"}</button></form>}
        {scheduled && <div className="mt-7 rounded-2xl bg-[#e4ede5] p-6"><BadgeCheck className="mx-auto size-7 text-[#4f7057]"/><h3 className="mt-3 font-bold">Your call request is saved.</h3><p className="mt-2 text-sm text-[var(--ink-soft)]">We’ll confirm the exact time using the contact information you provided.</p></div>}
      </section>
      <p className="mx-auto mt-12 max-w-2xl border-t border-[var(--line)] pt-6 text-center text-xs leading-5 text-[var(--ink-soft)]">Any offer or selling option is subject to review of the property information, comparable properties, ownership, title, and market conditions.</p>
    </div>
  );
}
