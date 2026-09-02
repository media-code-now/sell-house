"use client";

import Link from "next/link";
import { BarChart3, Building2, LayoutDashboard, Settings2 } from "lucide-react";
import { usePathname } from "next/navigation";

const links=[
  {href:"/acquisitions",label:"Pipeline",icon:LayoutDashboard,administratorOnly:false},
  {href:"/acquisitions/opportunities",label:"Opportunities",icon:Building2,administratorOnly:false},
  {href:"/acquisitions/analytics",label:"Analytics",icon:BarChart3,administratorOnly:false},
  {href:"/acquisitions/settings/criteria",label:"Criteria",icon:Settings2,administratorOnly:true},
];

export function DashboardNavigation({role,variant}:{role:string;variant:"desktop"|"mobile"}){
  const pathname=usePathname();
  const visible=links.filter(link=>!link.administratorOnly||role==="administrator");
  if(variant==="mobile")return <nav aria-label="Dashboard navigation" className="fixed inset-x-0 bottom-0 z-40 grid border-t border-[var(--line)] bg-white/95 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(23,37,45,.08)] backdrop-blur lg:hidden" style={{gridTemplateColumns:`repeat(${visible.length},minmax(0,1fr))`}}>{visible.map(({href,label,icon:Icon})=>{const active=isActive(pathname,href);return <Link key={href} href={href} aria-current={active?"page":undefined} className={`focus-ring flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-[.62rem] font-bold ${active?"bg-[var(--paper)] text-[var(--copper-dark)]":"text-[var(--ink-soft)]"}`}><Icon className="size-4"/>{label}</Link>})}</nav>;
  return <nav className="mt-12 grid gap-2" aria-label="Dashboard navigation">{visible.map(({href,label,icon:Icon})=>{const active=isActive(pathname,href);return <Link key={href} href={href} aria-current={active?"page":undefined} className={`focus-ring flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${active?"bg-white/10 font-bold text-white":"text-white/65 hover:bg-white/5 hover:text-white"}`}><Icon className={`size-4 ${active?"text-[#edb891]":""}`}/>{label}</Link>})}</nav>;
}

function isActive(pathname:string,href:string){if(href==="/acquisitions")return pathname==="/acquisitions"||pathname.startsWith("/acquisitions/leads/");return pathname.startsWith(href)}
