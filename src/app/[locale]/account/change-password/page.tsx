import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import ForcePasswordChange from "@/components/ForcePasswordChange";

export default async function ChangePasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user || (session.user as { role?: string }).role === "admin") {
    redirect(`/${locale}/login`);
  }

  const mustChange = (session.user as { mustChangePassword?: boolean }).mustChangePassword;
  if (!mustChange) {
    redirect(`/${locale}/account`);
  }

  const t = await getTranslations("Account");

  return (
    <div className="mx-auto max-w-sm px-4 py-12 pt-20">
      <h1 className="text-2xl font-bold text-[#4577ac] mb-2">{t("password.changePassword")}</h1>
      <p className="text-gray-600 mb-8">{t("password.forceChangeSubtitle")}</p>
      <ForcePasswordChange locale={locale} labels={{
        currentPassword: t("password.currentPassword"),
        newPassword: t("password.newPassword"),
        confirmPassword: t("password.confirmPassword"),
        save: t("password.save"),
        wrongPassword: t("password.wrongPassword"),
        mismatch: t("password.mismatch"),
        tooShort: t("password.tooShort"),
        error: t("password.error"),
      }} />
    </div>
  );
}
