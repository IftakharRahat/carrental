import { redirect } from "next/navigation";

export default async function SalesNewRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const carId =
    typeof query.carId === "string"
      ? query.carId
      : typeof query.car === "string"
        ? query.car
        : undefined;

  if (carId) {
    redirect(`/sell?carId=${encodeURIComponent(carId)}`);
  }
  redirect("/sell");
}
