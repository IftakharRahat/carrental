import type { Metadata } from "next";

import { DashboardView } from "@/features/dashboard/components/dashboard-view";
import { getDashboardData } from "@/features/dashboard/server/dashboard-service";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Operational and financial summary for Car Scrap Business.",
};

export default async function DashboardPage() {
  const data = await getDashboardData();

  return <DashboardView data={data} />;
}
