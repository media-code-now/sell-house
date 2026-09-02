import { redirect } from "next/navigation";
import { createAuthServerClient } from "@/lib/supabase/auth-server";

export type AcquisitionUser = { userId: string; email: string; fullName: string; role: "administrator" | "acquisition_manager" | "analyst" };

export async function requireAcquisitionUser(): Promise<AcquisitionUser> {
  const client = await createAuthServerClient();
  if (!client) redirect("/acquisitions/login?error=configuration");
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/acquisitions/login");
  const { data: member } = await client.from("acquisition_team_members").select("full_name,role,active").eq("user_id", user.id).maybeSingle();
  if (!member?.active) redirect("/acquisitions/login?error=access");
  return { userId: user.id, email: user.email ?? "", fullName: String(member.full_name), role: member.role as AcquisitionUser["role"] };
}
