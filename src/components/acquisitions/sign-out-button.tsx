"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  return <button onClick={async()=>{await createClient()?.auth.signOut();router.replace("/acquisitions/login");router.refresh();}} className="focus-ring flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-white/55 hover:bg-white/5 hover:text-white"><LogOut className="size-4"/>Sign out</button>;
}
