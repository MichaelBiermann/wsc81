import { getTranslations } from "next-intl/server";
import LoginForm from "@/components/LoginForm";
import Link from "next/link";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { locale } = await params;
  const { callbackUrl } = await searchParams;
  const t = await getTranslations("Login");

  const fromBooking = callbackUrl && (callbackUrl.includes("/book") || callbackUrl.includes("/events/"));

  return (
    <div className="mx-auto max-w-sm px-4 py-12 pt-20">
      {fromBooking && (
        <Link
          href={callbackUrl}
          className="inline-flex items-center gap-1 text-sm text-[#4577ac] hover:underline mb-6"
        >
          <span className="material-symbols-rounded" style={{ fontSize: 18 }} aria-hidden="true">arrow_back</span>
          {locale === "de" ? "Zurück zur Buchung" : "Back to booking"}
        </Link>
      )}
      <h1 className="text-2xl font-bold text-[#4577ac] mb-2">{t("pageTitle")}</h1>
      <p className="text-gray-600 mb-8">{t("subtitle")}</p>
      <LoginForm locale={locale} callbackUrl={callbackUrl} />
    </div>
  );
}
