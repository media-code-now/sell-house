import type { Metadata } from "next";
import { DashboardShell } from "@/components/acquisitions/dashboard-shell";
import { requireAcquisitionUser } from "@/lib/acquisitions/auth";

export const metadata: Metadata = { title: "Acquisition Dashboard", robots: { index: false, follow: false, nocache: true } };

export default async function PrivateAcquisitionsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAcquisitionUser();
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
