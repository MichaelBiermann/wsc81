import { getTranslations } from "next-intl/server";
import RegisterForm from "@/components/RegisterForm";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Register");

  return (
    <div className="mx-auto max-w-lg px-4 py-12 pt-20">
      <h1 className="text-2xl font-bold text-[#4577ac] mb-2">{t("pageTitle")}</h1>
      <p className="text-gray-600 mb-8">{t("subtitle")}</p>
      <RegisterForm locale={locale} />
    </div>
  );
}
