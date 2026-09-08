import type { Metadata } from "next";

import { SecurityView } from "@/features/security/components/security-view";
import { getSecuritySettingsData } from "@/features/security/server/security-service";

export const metadata: Metadata = {
  title: "Security, Users & Backup | Car Scrap Business",
  description:
    "Protect access, data, credentials, and backups (Section 17).",
};

export default async function SecuritySettingsPage() {
  const data = await getSecuritySettingsData();

  return <SecurityView data={data} />;
}
