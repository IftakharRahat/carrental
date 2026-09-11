import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSessionActor } from "@/lib/auth/actor";
import { SourceProfileView } from "@/features/sources/components/source-profile-view";
import {
  getCarsForSourceCommission,
  getSourceProfileData,
} from "@/features/sources/server/source-service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sourceId: string }>;
}): Promise<Metadata> {
  const { sourceId } = await params;
  const source = await getSourceProfileData(sourceId);
  if (!source) {
    return { title: "Source Not Found" };
  }
  return {
    title: `${source.name} | Source Profile`,
    description: `Performance summary, linked cars, and commission history for ${source.name}`,
  };
}

export default async function SourceDetailPage({
  params,
}: {
  params: Promise<{ sourceId: string }>;
}) {
  const actor = await getSessionActor();
  if (actor?.role === "VIEWER") {
    redirect("/dashboard");
  }

  const { sourceId } = await params;
  const source = await getSourceProfileData(sourceId);

  if (!source) {
    notFound();
  }

  const availableCars = await getCarsForSourceCommission(sourceId);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <SourceProfileView source={source} availableCars={availableCars} />
    </div>
  );
}
