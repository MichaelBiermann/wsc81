import { getTranslations } from "next-intl/server";

export default async function MembershipSuccessPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("Membership");

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <div className="text-5xl mb-4">📧</div>
      <h1 className="text-2xl font-bold text-[#4577ac] mb-3">{t("success.title")}</h1>
      <p className="text-gray-600 mb-2">{t("success.message", { email: "" })}</p>
      <p className="text-sm text-gray-400 mb-6">{t("success.expiry")}</p>
      <a href={`/${locale}`} className="text-[#4577ac] hover:underline">
        {locale === "de" ? "Zurück zur Startseite" : "Back to homepage"}
      </a>
    </div>
  );
}
