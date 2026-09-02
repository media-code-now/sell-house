import { redirect } from "next/navigation";
import { CriteriaSettings } from "@/components/acquisitions/criteria-settings";
import { requireAcquisitionUser } from "@/lib/acquisitions/auth";
import { getCriteriaSettings } from "@/lib/acquisitions/criteria-data";
import { createAuthServerClient } from "@/lib/supabase/auth-server";

export default async function AcquisitionCriteriaPage(){const [user,db]=await Promise.all([requireAcquisitionUser(),createAuthServerClient()]);if(user.role!=="administrator")redirect("/acquisitions");if(!db)throw new Error("Dashboard storage is not configured.");const {markets,criteria}=await getCriteriaSettings(db);return <main className="px-4 py-7 sm:px-7 sm:py-9 xl:px-10"><div className="mx-auto max-w-5xl"><p className="eyebrow text-[var(--copper-dark)]">Administrator settings</p><h1 className="font-display mt-3 text-4xl sm:text-5xl">Acquisition criteria</h1><p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--ink-soft)]">Configure how maximum allowable offer is calculated for each market. No criterion is universal, and saved lead analyses retain the exact configuration snapshot used at calculation time.</p><div className="mt-8"><CriteriaSettings markets={markets} criteria={criteria}/></div></div></main>}
