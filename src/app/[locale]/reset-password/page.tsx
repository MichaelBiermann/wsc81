import { getTranslations } from "next-intl/server";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  const { token } = await searchParams;
  const t = await getTranslations("ResetPassword");

  return (
    <div className="mx-auto max-w-sm px-4 py-12 pt-20">
      <h1 className="text-2xl font-bold text-[#4577ac] mb-2">{t("pageTitle")}</h1>
      <p className="text-gray-600 mb-8">{t("subtitle")}</p>
      <ResetPasswordForm locale={locale} token={token ?? ""} />
    </div>
  );
}
