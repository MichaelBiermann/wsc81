import { getTranslations } from "next-intl/server";

export default async function BookingSuccessPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("Booking");
  const isDE = locale === "de";

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <div className="text-5xl mb-4">✅</div>
      <h1 className="text-2xl font-bold text-green-700 mb-3">{t("success.title")}</h1>
      <p className="text-gray-600 mb-6">{isDE ? "Eine Bestätigung wurde an Ihre E-Mail-Adresse gesendet." : "A confirmation has been sent to your email address."}</p>
      <a href={`/${locale}`} className="text-[#4577ac] hover:underline">{isDE ? "Zurück zur Startseite" : "Back to homepage"}</a>
    </div>
  );
}
