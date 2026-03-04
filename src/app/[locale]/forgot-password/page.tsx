import { getTranslations } from "next-intl/server";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("ForgotPassword");

  return (
    <div className="mx-auto max-w-sm px-4 py-12 pt-20">
      <h1 className="text-2xl font-bold text-[#4577ac] mb-2">{t("pageTitle")}</h1>
      <p className="text-gray-600 mb-8">{t("subtitle")}</p>
      <ForgotPasswordForm locale={locale} />
    </div>
  );
}
