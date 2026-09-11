import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSessionActor } from "@/lib/auth/actor";

import { BuyerProfileView } from "@/features/buyers/components/buyer-profile-view";
import {
  ensureStandardBuyerTypes,
  getBuyerProfileData,
} from "@/features/buyers/server/buyer-service";
import { isDatabaseConfigured } from "@/lib/config-state";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ buyerId: string }>;
}): Promise<Metadata> {
  const { buyerId } = await params;
  const buyer = await getBuyerProfileData(buyerId);

  if (!buyer) {
    return { title: "Buyer Not Found" };
  }

  return {
    title: `${buyer.name} | Buyer Profile`,
    description: `Purchase activity and transaction history for buyer ${buyer.name}.`,
  };
}

export default async function BuyerProfilePage({
  params,
}: {
  params: Promise<{ buyerId: string }>;
}) {
  const actor = await getSessionActor();
  if (actor?.role === "VIEWER") {
    redirect("/dashboard");
  }

  const { buyerId } = await params;

  if (!isDatabaseConfigured()) notFound();

  const [buyer, availableTypes] = await Promise.all([
    getBuyerProfileData(buyerId),
    ensureStandardBuyerTypes(),
  ]);

  if (!buyer) notFound();

  return <BuyerProfileView buyer={buyer} availableTypes={availableTypes} />;
}
