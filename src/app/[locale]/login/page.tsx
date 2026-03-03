import { getTranslations } from "next-intl/server";
import LoginForm from "@/components/LoginForm";

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

  return (
    <div className="mx-auto max-w-sm px-4 py-12 pt-20">
      <h1 className="text-2xl font-bold text-[#4577ac] mb-2">{t("pageTitle")}</h1>
      <p className="text-gray-600 mb-8">{t("subtitle")}</p>
      <LoginForm locale={locale} callbackUrl={callbackUrl} />
    </div>
  );
}
