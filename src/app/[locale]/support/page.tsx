import { redirect } from "next/navigation";

export default async function SupportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // Support is now an overlay — redirect to the homepage with the overlay open
  redirect(`/${locale}?support=open`);
}
