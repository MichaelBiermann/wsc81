import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function VerifiedPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { locale } = await params;
  const { status } = await searchParams;
  const t = await getTranslations("Verification");

  const isSuccess = status === "success";
  const isExpired = status === "expired";

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      {isSuccess ? (
        <>
          <div className="text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-green-600 mb-3">{t("success.title")}</h1>
          <p className="text-gray-600 mb-6">{t("success.message")}</p>
          <Link
            href={`/${locale}/login`}
            className="inline-block rounded bg-[#4577ac] px-6 py-2.5 text-white font-medium hover:bg-[#2d5a8a] transition-colors"
          >
            {t("success.loginLink")}
          </Link>
        </>
      ) : isExpired ? (
        <>
          <div className="text-5xl mb-4">⏰</div>
          <h1 className="text-2xl font-bold text-orange-600 mb-3">{t("expired.title")}</h1>
          <p className="text-gray-600 mb-6">{t("expired.message")}</p>
          <Link
            href={`/${locale}/register`}
            className="inline-block rounded bg-[#4577ac] px-6 py-2.5 text-white font-medium hover:bg-[#2d5a8a] transition-colors"
          >
            {t("expired.registerAgain")}
          </Link>
        </>
      ) : (
        <>
          <div className="text-5xl mb-4">✗</div>
          <h1 className="text-2xl font-bold text-red-600 mb-3">{t("invalid.title")}</h1>
          <p className="text-gray-600">{t("invalid.message")}</p>
        </>
      )}
    </div>
  );
}
