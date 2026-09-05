import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SellerProfileView } from "@/features/sellers/components/seller-profile-view";
import { getSellerProfileData } from "@/features/sellers/server/seller-service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sellerId: string }>;
}): Promise<Metadata> {
  const { sellerId } = await params;
  const seller = await getSellerProfileData(sellerId);
  if (!seller) {
    return { title: "Seller Not Found" };
  }
  return {
    title: `${seller.name} | Seller Profile`,
    description: `Purchase history and contact details for vehicle seller ${seller.name}`,
  };
}

export default async function SellerDetailPage({
  params,
}: {
  params: Promise<{ sellerId: string }>;
}) {
  const { sellerId } = await params;
  const seller = await getSellerProfileData(sellerId);

  if (!seller) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <SellerProfileView seller={seller} />
    </div>
  );
}
