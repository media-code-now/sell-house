import Link from "next/link";
import { ArrowUpRight, CalendarClock, CircleDollarSign, Home, MapPin, UserRound } from "lucide-react";
import type { AcquisitionLeadCard } from "@/lib/acquisitions/data";

export function LeadCard({ lead }: { lead: AcquisitionLeadCard }) {
  const hot = lead.classification === "HOT";
  return <Link href={`/acquisitions/leads/${lead.id}`} className="focus-ring group block rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[0_5px_24px_rgba(23,37,45,.035)] transition hover:-translate-y-0.5 hover:border-[rgba(189,109,67,.45)] hover:shadow-[0_14px_35px_rgba(23,37,45,.09)] sm:p-6">
    <div className="flex items-start justify-between gap-4"><div><p className={`text-xs font-extrabold tracking-wide ${hot?"text-[#a74726]":"text-[var(--ink-soft)]"}`}>{hot?"🔥 ":""}{lead.classification??"UNSCORED"}{lead.score!==null?` — Score ${lead.score}`:" — Score pending"}</p><h2 className="mt-3 text-lg font-bold">{lead.sellerName}</h2></div><span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--paper)] transition group-hover:bg-[#f4e6dd]"><ArrowUpRight className="size-4"/></span></div>
    <p className="mt-5 flex items-start gap-2 text-sm font-bold leading-6"><MapPin className="mt-0.5 size-4 shrink-0 text-[var(--copper)]"/>{lead.address}</p>{lead.market&&<p className="ml-6 mt-1 text-xs text-[var(--ink-soft)]">{lead.market}</p>}
    <div className="mt-5 grid gap-3 border-y border-[var(--line)] py-4 text-sm">
      <Fact icon={<Home className="size-4"/>} label={lead.motivations.length?lead.motivations.join(" · "):"Motivation not provided"}/>
      <Fact icon={<CircleDollarSign className="size-4"/>} label={`Estimated value: ${currency(lead.propertyValueEstimate)}${lead.propertyValueSource==="homeowner"?" (seller estimate)":""}`}/>
      <Fact icon={<CircleDollarSign className="size-4"/>} label={`Estimated equity: ${currency(lead.estimatedEquity)}`}/>
      <Fact icon={<CalendarClock className="size-4"/>} label={`Timeline: ${lead.timeline??"Not provided"}`}/>
    </div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--ink-soft)]"><span>Received {relativeTime(lead.receivedAt)}</span><span className="rounded-full bg-[var(--paper)] px-2.5 py-1 font-bold capitalize">{lead.status.replaceAll("_"," ")}</span><span className="flex items-center gap-1.5"><UserRound className="size-3.5"/>{lead.assignedManager??"Unassigned"}</span></div>
  </Link>;
}

function Fact({icon,label}:{icon:React.ReactNode;label:string}) { return <p className="flex items-start gap-2 leading-5 text-[var(--ink-soft)]"><span className="mt-0.5 text-[var(--copper)]">{icon}</span>{label}</p>; }
function currency(value:number|null) { return value===null?"Not available":new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(value); }
function relativeTime(value:string) { const elapsed=Math.max(0,Date.now()-new Date(value).getTime()); const minutes=Math.floor(elapsed/60000); if(minutes<1)return "just now";if(minutes<60)return `${minutes} minute${minutes===1?"":"s"} ago`;const hours=Math.floor(minutes/60);if(hours<24)return `${hours} hour${hours===1?"":"s"} ago`;const days=Math.floor(hours/24);if(days<30)return `${days} day${days===1?"":"s"} ago`;return new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric"}).format(new Date(value)); }
