import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import type { AcquisitionUser } from "@/lib/acquisitions/auth";
import { SignOutButton } from "./sign-out-button";
import { DashboardNavigation } from "./dashboard-navigation";

export function DashboardShell({ user, children }: { user: AcquisitionUser; children: React.ReactNode }) {
  const initials = user.fullName.split(/\s+/).map((part)=>part[0]).join("").slice(0,2).toUpperCase();
  return <div className="min-h-screen bg-[#f4f5f3] pb-20 lg:grid lg:grid-cols-[15rem_1fr] lg:pb-0"><aside className="hidden min-h-screen bg-[var(--ink)] p-5 text-white lg:flex lg:flex-col"><Link href="/acquisitions" className="focus-ring rounded"><BrandMark light/></Link><DashboardNavigation role={user.role} variant="desktop"/><div className="mt-auto border-t border-white/10 pt-5"><div className="flex items-center gap-3 px-2"><span className="grid size-9 place-items-center rounded-full bg-[#bd6d43] text-xs font-bold">{initials}</span><span className="min-w-0"><strong className="block truncate text-sm">{user.fullName}</strong><span className="block truncate text-[.65rem] capitalize text-white/40">{user.role.replace("_"," ")}</span></span></div><SignOutButton/></div></aside><div className="min-w-0"><header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--line)] bg-white/95 px-4 backdrop-blur sm:px-7 lg:hidden"><Link href="/acquisitions" className="focus-ring rounded"><BrandMark/></Link><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-full bg-[var(--ink)] text-[.65rem] font-bold text-white">{initials}</span><ShieldCheck className="size-4 text-[#52715c]"/><span className="text-xs font-bold">Private</span></div></header>{children}<DashboardNavigation role={user.role} variant="mobile"/></div></div>;
}
