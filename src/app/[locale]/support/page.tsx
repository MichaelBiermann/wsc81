import { auth } from "@/auth";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import SupportForm from "@/components/SupportForm";

export default async function SupportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await auth();

  const t = await getTranslations("Support");

  if (!session?.user) {
    return (
      <main id="main-content" className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-lg mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("title")}</h1>
          <p className="text-gray-600 mb-6">{t("subtitle")}</p>
          <p className="text-gray-600 mb-4">{t("loginRequired")}</p>
          <Link
            href={`/${locale}/login`}
            className="inline-block bg-[#4577ac] text-white px-4 py-2 rounded font-medium hover:bg-[#2d5a8a] transition-colors"
          >
            {t("loginLink")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("title")}</h1>
        <p className="text-gray-600 mb-6">{t("subtitle")}</p>
        <SupportForm />
      </div>
    </main>
  );
}
