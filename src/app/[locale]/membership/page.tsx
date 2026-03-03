import { getTranslations } from "next-intl/server";
import MembershipForm from "@/components/MembershipForm";

export default async function MembershipPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("Membership");

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 pt-20">
      <h1 className="text-2xl font-bold text-[#4577ac] mb-2">{t("pageTitle")}</h1>
      <p className="text-gray-600 mb-8">{t("subtitle")}</p>
      <MembershipForm locale={locale} />
    </div>
  );
}
