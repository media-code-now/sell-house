import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { AcquisitionLoginForm } from "@/components/acquisitions/login-form";
import { createAuthServerClient } from "@/lib/supabase/auth-server";

export const metadata: Metadata = { title: "Acquisition Team Sign In", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const client = await createAuthServerClient();
  if (client) { const { data: { user } } = await client.auth.getUser(); if (user) { const { data: member } = await client.from("acquisition_team_members").select("active").eq("user_id", user.id).maybeSingle(); if (member?.active) redirect("/acquisitions"); } }
  const { error } = await searchParams;
  return <main className="grid min-h-screen bg-[var(--ink)] lg:grid-cols-[1fr_.8fr]"><section className="hidden p-12 text-white lg:flex lg:flex-col lg:justify-between"><BrandMark light/><div className="max-w-xl"><p className="eyebrow text-[#edb891]">Private acquisition workspace</p><h1 className="font-display mt-5 text-6xl leading-[.98]">Every seller story, property signal, and next step—in one place.</h1><p className="mt-6 max-w-lg leading-7 text-white/55">Review qualified opportunities, understand why each lead scored, and move deliberately from first contact to closing.</p></div><p className="text-xs text-white/35">Authorized team members only. Activity may be monitored.</p></section><section className="flex items-center justify-center bg-[var(--paper)] p-5 sm:p-10"><div className="w-full max-w-md rounded-3xl border border-[var(--line)] bg-white p-7 shadow-2xl sm:p-10"><div className="lg:hidden"><BrandMark/></div><p className="eyebrow mt-8 text-[var(--copper-dark)] lg:mt-0">Team access</p><h2 className="font-display mt-4 text-4xl">Welcome back.</h2><p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">Sign in with your authorized acquisition account.</p>{error==="access"&&<p className="mt-5 rounded-lg bg-[#f8e7df] px-4 py-3 text-sm text-[#843f24]">This account does not have active dashboard access.</p>}{error==="configuration"&&<p className="mt-5 rounded-lg bg-[#f8e7df] px-4 py-3 text-sm text-[#843f24]">Authentication has not been configured.</p>}<AcquisitionLoginForm/></div></section></main>;
}
