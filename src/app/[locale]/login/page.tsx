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
  // Derive the event detail URL by stripping /book (and anything after) from the callbackUrl
  const eventUrl = fromBooking
    ? callbackUrl.replace(/\/book.*$/, "")
    : null;

  return (
    <div className="mx-auto max-w-sm px-4 py-12 pt-20">
      {fromBooking && eventUrl && (
        <Link
          href={eventUrl}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <span className="material-symbols-rounded" style={{ fontSize: 18 }} aria-hidden="true">close</span>
          {locale === "de" ? "Abbrechen" : "Cancel"}
        </Link>
      )}
      <h1 className="text-2xl font-bold text-[#4577ac] mb-2">{t("pageTitle")}</h1>
      <p className="text-gray-600 mb-8">{t("subtitle")}</p>
      <LoginForm locale={locale} callbackUrl={callbackUrl} />
    </div>
  );
}
