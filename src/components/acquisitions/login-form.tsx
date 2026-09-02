"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function AcquisitionLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setLoading(true);
    const client = createClient();
    if (!client) { setError("Authentication is not configured."); setLoading(false); return; }
    const result = await client.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (result.error) { setError("The email or password was not recognized, or this account is not authorized."); setLoading(false); return; }
    router.replace("/acquisitions"); router.refresh();
  }
  return <form onSubmit={submit} className="mt-8 grid gap-5">
    <label className="grid gap-2 text-sm font-bold">Work email<input type="email" required autoComplete="email" value={email} onChange={(event)=>setEmail(event.target.value)} className="focus-ring h-13 rounded-xl border border-[var(--line)] bg-white px-4 font-normal" placeholder="you@company.com"/></label>
    <label className="grid gap-2 text-sm font-bold">Password<input type="password" required autoComplete="current-password" value={password} onChange={(event)=>setPassword(event.target.value)} className="focus-ring h-13 rounded-xl border border-[var(--line)] bg-white px-4 font-normal"/></label>
    {error&&<p role="alert" className="rounded-lg bg-[#f8e7df] px-4 py-3 text-sm text-[#843f24]">{error}</p>}
    <button disabled={loading} className="focus-ring flex h-13 items-center justify-center gap-2 rounded-xl bg-[var(--ink)] px-5 text-sm font-bold text-white transition hover:bg-[#29404b] disabled:opacity-60"><LockKeyhole className="size-4"/>{loading?"Signing in…":"Sign in securely"}<ArrowRight className="size-4"/></button>
  </form>;
}
