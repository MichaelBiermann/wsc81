import { getTranslations } from "next-intl/server";
import Link from "next/link";
import RegisterForm from "@/components/RegisterForm";
import { auth } from "@/auth";

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ callbackUrl?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations("Register");
  const isDE = locale === "de";
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <div className="mx-auto max-w-lg px-4 py-12 pt-20">
      {!isLoggedIn && (
        <div className="mb-6 rounded-lg border border-[#4577ac]/30 bg-[#eef3f9] p-4 text-sm text-gray-700">
          <p className="font-medium text-[#4577ac] mb-1 flex items-center gap-1">
            <span className="material-symbols-rounded" style={{ fontSize: "18px" }}>info</span>
            {isDE ? "Anmeldung für Buchungen erforderlich" : "Sign-in required for bookings"}
          </p>
          <p className="mb-2">
            {isDE
              ? "Um Veranstaltungen buchen zu können, benötigen Sie ein Konto. Erstellen Sie jetzt ein neues Konto oder melden Sie sich an, falls Sie bereits registriert sind."
              : "To book events, you need an account. Create a new account below or sign in if you are already registered."}
          </p>
          <Link
            href={`/${locale}/login${sp?.callbackUrl ? `?callbackUrl=${encodeURIComponent(sp.callbackUrl)}` : ""}`}
            className="font-medium text-[#4577ac] hover:underline"
          >
            {isDE ? "Bereits registriert? Hier anmelden →" : "Already registered? Sign in →"}
          </Link>
        </div>
      )}
      <h1 className="text-2xl font-bold text-[#4577ac] mb-2">{t("pageTitle")}</h1>
      <p className="text-gray-600 mb-8">{t("subtitle")}</p>
      <RegisterForm locale={locale} />
    </div>
  );
}
