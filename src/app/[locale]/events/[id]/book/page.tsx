import { redirect } from "next/navigation";

export default async function BookingRedirect({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  redirect(`/${locale}/events/${id}`);
}
