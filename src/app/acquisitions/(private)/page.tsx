import Link from "next/link";
import {
  Activity, Archive, BadgeDollarSign, CalendarClock, CheckCircle2, CircleDashed,
  Clock3, Flame, Inbox, LayoutDashboard, PhoneCall, Search, UsersRound,
} from "lucide-react";
import { LeadCard } from "@/components/acquisitions/lead-card";
import {
  getAcquisitionDashboardOverview, getAcquisitionLeads, leadMatchesView,
  pipelineViews, type AcquisitionDashboardOverview, type AcquisitionLeadCard,
  type PipelineView,
} from "@/lib/acquisitions/data";
import { createAuthServerClient } from "@/lib/supabase/auth-server";

type DashboardView="overview"|PipelineView;
const views:Array<{key:DashboardView;label:string;icon:typeof Inbox}>=[
  {key:"overview",label:"Overview",icon:LayoutDashboard},{key:"new",label:"New Leads",icon:Inbox},
  {key:"hot",label:"Hot Leads",icon:Flame},{key:"follow-ups",label:"Follow-ups",icon:PhoneCall},
  {key:"offers",label:"Offers",icon:BadgeDollarSign},{key:"under-contract",label:"Under Contract",icon:CircleDashed},
  {key:"closed",label:"Closed",icon:CheckCircle2},{key:"lost",label:"Lost",icon:Archive},
];
const viewKeys=new Set<DashboardView>(["overview",...pipelineViews]);

export default async function AcquisitionDashboard({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const query=await searchParams;
  const activeView=viewKeys.has(query.view as DashboardView)?query.view as DashboardView:"overview";
  const db=await createAuthServerClient();if(!db)throw new Error("Dashboard storage is not configured.");
  const leads=await getAcquisitionLeads(db);
  const overview=await getAcquisitionDashboardOverview(db,leads);
  const counts=Object.fromEntries(views.map(view=>[view.key,view.key==="overview"?leads.filter(activeLead).length:leads.filter(lead=>leadMatchesView(lead,view.key as PipelineView)).length]));
  const search=(query.search??"").trim().toLowerCase().slice(0,120),market=(query.market??"").slice(0,120),manager=(query.manager??"").slice(0,120),sort=query.sort??"priority";
  const base=activeView==="overview"?leads.filter(activeLead):leads.filter(lead=>leadMatchesView(lead,activeView));
  const visible=sortLeads(base.filter(lead=>(!search||`${lead.sellerName} ${lead.address} ${lead.motivations.join(" ")}`.toLowerCase().includes(search))&&(!market||lead.market===market)&&(!manager||(manager==="unassigned"?!lead.assignedManager:lead.assignedManager===manager))),sort);
  const markets=[...new Set(leads.flatMap(lead=>lead.market?[lead.market]:[]))].sort();
  const managers=[...new Set(leads.flatMap(lead=>lead.assignedManager?[lead.assignedManager]:[]))].sort();
  const current=views.find(view=>view.key===activeView)!;const CurrentIcon=current.icon;

  return <main className="px-4 py-6 sm:px-7 sm:py-9 xl:px-10"><div className="mx-auto max-w-[96rem]">
    <header className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow text-[var(--copper-dark)]">Acquisition command center</p><h1 className="font-display mt-3 text-4xl sm:text-5xl">Seller opportunities</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-soft)]">See what needs attention now, then move each seller through a clear and accountable process.</p></div><div className="flex items-center gap-3"><Link href="/acquisitions/analytics" className="focus-ring rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-xs font-bold">View analytics</Link><Link href="/acquisitions/opportunities" className="focus-ring rounded-xl bg-[var(--ink)] px-4 py-3 text-xs font-bold text-white">Property opportunities</Link></div></header>

    <nav aria-label="Lead pipeline" className="mt-8 flex gap-2 overflow-x-auto pb-2">{views.map(({key,label,icon:Icon})=><Link key={key} href={key==="overview"?"/acquisitions":`/acquisitions?view=${key}`} aria-current={activeView===key?"page":undefined} className={`focus-ring flex min-w-max items-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold transition ${activeView===key?"border-[var(--ink)] bg-[var(--ink)] text-white":"border-[var(--line)] bg-white text-[var(--ink-soft)] hover:border-[var(--copper)]"}`}><Icon className={`size-4 ${key==="hot"&&activeView!==key?"text-[#a74726]":""}`}/>{label}<span className={`rounded-full px-2 py-0.5 text-[.65rem] ${activeView===key?"bg-white/15":"bg-[var(--paper)]"}`}>{counts[key]}</span></Link>)}</nav>

    {activeView==="overview"&&<Overview leads={leads} overview={overview}/>} 

    <section className="mt-8 rounded-2xl border border-[var(--line)] bg-white p-4 sm:p-5">
      <form className="grid gap-3 lg:grid-cols-[minmax(14rem,1fr)_13rem_13rem_12rem_auto]">
        <input type="hidden" name="view" value={activeView}/><label className="relative"><span className="sr-only">Search leads</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--ink-soft)]"/><input name="search" defaultValue={query.search} placeholder="Search seller, address, or motivation" className="focus-ring h-11 w-full rounded-xl border border-[var(--line)] pl-10 pr-3 text-sm"/></label>
        <FilterSelect name="market" label="All markets" value={market} options={markets}/><FilterSelect name="manager" label="All assignments" value={manager} options={["unassigned",...managers]} labels={{unassigned:"Unassigned"}}/>
        <label><span className="sr-only">Sort leads</span><select name="sort" defaultValue={sort} className="focus-ring h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm"><option value="priority">Priority first</option><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="score-high">Highest score</option><option value="value-high">Highest value</option></select></label>
        <div className="flex gap-2"><button className="focus-ring h-11 flex-1 rounded-xl bg-[var(--ink)] px-5 text-xs font-bold text-white">Apply</button><Link href={activeView==="overview"?"/acquisitions":`/acquisitions?view=${activeView}`} className="focus-ring grid h-11 place-items-center rounded-xl border border-[var(--line)] px-4 text-xs font-bold">Reset</Link></div>
      </form>
    </section>

    <section className="mt-7"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><CurrentIcon className="size-5 text-[var(--copper)]"/><h2 className="text-lg font-bold">{activeView==="overview"?"Priority leads":current.label}</h2><span className="text-sm text-[var(--ink-soft)]">{visible.length}</span></div>{(search||market||manager)&&<p className="text-xs text-[var(--ink-soft)]">Filtered from {base.length} lead{base.length===1?"":"s"}</p>}</div>
      {visible.length?<div className="mt-5 grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">{visible.map(lead=><LeadCard key={lead.id} lead={lead}/>)}</div>:<div className="mt-5 rounded-2xl border border-dashed border-[var(--line)] bg-white px-6 py-16 text-center"><CurrentIcon className="mx-auto size-7 text-[var(--copper)]"/><h3 className="mt-4 font-bold">No matching leads</h3><p className="mt-2 text-sm text-[var(--ink-soft)]">Try clearing the filters or choose another pipeline stage.</p></div>}
    </section>
  </div></main>;
}

function Overview({leads,overview}:{leads:AcquisitionLeadCard[];overview:AcquisitionDashboardOverview}){
  const active=leads.filter(activeLead),today=new Date();today.setHours(0,0,0,0);
  const metrics=[
    {label:"New today",value:leads.filter(lead=>new Date(lead.receivedAt)>=today).length,detail:"Fresh seller requests",icon:Inbox,tone:"copper"},
    {label:"Hot active",value:active.filter(lead=>lead.classification==="HOT").length,detail:"Score 80–100",icon:Flame,tone:"red"},
    {label:"Overdue tasks",value:overview.openTasks.filter(task=>task.overdue).length,detail:`${overview.openTasks.length} open in queue`,icon:Clock3,tone:"red"},
    {label:"Unassigned",value:active.filter(lead=>!lead.assignedManager).length,detail:"Needs an owner",icon:UsersRound,tone:"ink"},
    {label:"Offers in play",value:overview.pendingOffers,detail:"Presented or countered",icon:BadgeDollarSign,tone:"green"},
  ];
  const stages=[
    {label:"New",count:leads.filter(lead=>lead.status==="new").length,color:"bg-[#bd6d43]"},
    {label:"Follow-up",count:leads.filter(lead=>["attempting_contact","nurture"].includes(lead.status)).length,color:"bg-[#d39a75]"},
    {label:"Qualified",count:leads.filter(lead=>lead.status==="qualified").length,color:"bg-[#6b8584]"},
    {label:"Offer",count:leads.filter(lead=>["offer_prepared","offer_sent","negotiating"].includes(lead.status)).length,color:"bg-[#426a70]"},
    {label:"Contract",count:leads.filter(lead=>lead.status==="under_contract").length,color:"bg-[#52715c]"},
    {label:"Closed",count:leads.filter(lead=>lead.status==="closed").length,color:"bg-[#294d38]"},
  ];
  const total=Math.max(1,stages.reduce((sum,stage)=>sum+stage.count,0));
  return <section aria-label="Dashboard overview" className="mt-7">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{metrics.map(({label,value,detail,icon:Icon,tone})=><article key={label} className="rounded-2xl border border-[var(--line)] bg-white p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-bold text-[var(--ink-soft)]">{label}</p><p className="mt-2 text-3xl font-bold tabular-nums">{value}</p></div><span className={`grid size-10 place-items-center rounded-xl ${tone==="red"?"bg-[#fae8df] text-[#9a4425]":tone==="green"?"bg-[#e5ede7] text-[#42624d]":tone==="copper"?"bg-[#f5e9e1] text-[var(--copper-dark)]":"bg-[var(--paper)]"}`}><Icon className="size-5"/></span></div><p className="mt-3 text-[.68rem] text-[var(--ink-soft)]">{detail}</p></article>)}</div>
    <div className="mt-4 grid gap-4 xl:grid-cols-[.9fr_1.1fr_1.1fr]">
      <article className="rounded-2xl border border-[var(--line)] bg-white p-5 sm:p-6"><div className="flex items-center justify-between"><Heading icon={LayoutDashboard} text="Pipeline health"/><span className="text-xs text-[var(--ink-soft)]">{stages.reduce((sum,stage)=>sum+stage.count,0)} tracked</span></div><div className="mt-6 flex h-3 overflow-hidden rounded-full bg-[var(--paper)]" aria-label="Pipeline distribution">{stages.map(stage=>stage.count>0&&<span key={stage.label} className={stage.color} style={{width:`${stage.count/total*100}%`}} title={`${stage.label}: ${stage.count}`}/>)}</div><div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4">{stages.map(stage=><div key={stage.label} className="flex items-center justify-between gap-3 text-xs"><span className="flex items-center gap-2 text-[var(--ink-soft)]"><i className={`size-2 rounded-full ${stage.color}`}/>{stage.label}</span><strong>{stage.count}</strong></div>)}</div></article>
      <article className="rounded-2xl border border-[var(--line)] bg-white p-5 sm:p-6"><div className="flex items-center justify-between"><Heading icon={CalendarClock} text="Task queue"/><span className="text-xs text-[var(--ink-soft)]">Next {Math.min(5,overview.openTasks.length)}</span></div>{overview.openTasks.length?<ol className="mt-5 divide-y divide-[var(--line)]">{overview.openTasks.slice(0,5).map(task=><li key={task.id} className="py-3 first:pt-0"><Link href={`/acquisitions/leads/${task.leadId}`} className="focus-ring group block rounded"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="truncate text-sm font-bold group-hover:text-[var(--copper-dark)]">{task.title}</p><p className="mt-1 truncate text-xs text-[var(--ink-soft)]">{task.sellerName} · {task.assignedTo??"Unassigned"}</p></div><span className={`min-w-max rounded-full px-2.5 py-1 text-[.62rem] font-bold ${task.overdue?"bg-[#fae8df] text-[#934924]":"bg-[var(--paper)] text-[var(--ink-soft)]"}`}>{task.dueAt?task.overdue?`Overdue ${relative(task.dueAt)}`:`Due ${relative(task.dueAt)}`:"No due date"}</span></div></Link></li>)}</ol>:<EmptyState text="No open tasks. New follow-up tasks will appear here."/>}</article>
      <article className="rounded-2xl border border-[var(--line)] bg-white p-5 sm:p-6"><div className="flex items-center justify-between"><Heading icon={Activity} text="Recent activity"/><span className="text-xs text-[var(--ink-soft)]">Team timeline</span></div>{overview.recentActivities.length?<ol className="mt-5 divide-y divide-[var(--line)]">{overview.recentActivities.slice(0,5).map(item=><li key={item.id} className="py-3 first:pt-0"><Link href={`/acquisitions/leads/${item.leadId}`} className="focus-ring group block rounded"><div className="flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-wide group-hover:text-[var(--copper-dark)]">{item.type} · {item.status.replaceAll("_"," ")}</p><span className="text-[.62rem] text-[var(--ink-soft)]">{relative(item.occurredAt)}</span></div><p className="mt-1 truncate text-sm">{item.sellerName}: <span className="text-[var(--ink-soft)]">{item.summary}</span></p></Link></li>)}</ol>:<EmptyState text="No calls, messages, emails, or appointments logged yet."/>}</article>
    </div>
  </section>;
}

function FilterSelect({name,label,value,options,labels={}}:{name:string;label:string;value:string;options:string[];labels?:Record<string,string>}){return <label><span className="sr-only">{label}</span><select name={name} defaultValue={value} className="focus-ring h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm"><option value="">{label}</option>{options.map(option=><option key={option} value={option}>{labels[option]??option}</option>)}</select></label>}
function Heading({icon:Icon,text}:{icon:typeof Inbox;text:string}){return <h2 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.13em]"><Icon className="size-4 text-[var(--copper)]"/>{text}</h2>}
function EmptyState({text}:{text:string}){return <p className="mt-5 rounded-xl bg-[var(--paper)] p-4 text-sm leading-6 text-[var(--ink-soft)]">{text}</p>}
function activeLead(lead:AcquisitionLeadCard){return !["closed","lost"].includes(lead.status)}
function sortLeads(leads:AcquisitionLeadCard[],sort:string){return [...leads].sort((a,b)=>{if(sort==="newest")return Date.parse(b.receivedAt)-Date.parse(a.receivedAt);if(sort==="oldest")return Date.parse(a.receivedAt)-Date.parse(b.receivedAt);if(sort==="score-high")return(b.score??-1)-(a.score??-1);if(sort==="value-high")return(b.propertyValueEstimate??-1)-(a.propertyValueEstimate??-1);const hot=Number(b.classification==="HOT")-Number(a.classification==="HOT");return hot||(b.score??-1)-(a.score??-1)||Date.parse(b.receivedAt)-Date.parse(a.receivedAt)})}
function relative(value:string){const delta=new Date(value).getTime()-Date.now(),future=delta>0,minutes=Math.max(1,Math.round(Math.abs(delta)/60000));if(minutes<60)return`${future?"in ":""}${minutes}m${future?"":" ago"}`;const hours=Math.round(minutes/60);if(hours<48)return`${future?"in ":""}${hours}h${future?"":" ago"}`;const days=Math.round(hours/24);return`${future?"in ":""}${days}d${future?"":" ago"}`}
