import { getTranslations } from "next-intl/server";

export default async function ActivationPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; token: string }>;
  searchParams: Promise<{ status?: string; name?: string; memberNumber?: string }>;
}) {
  const { locale, token } = await params;
  const { status, name, memberNumber } = await searchParams;
  const t = await getTranslations("Activation");

  // If no status yet, trigger activation via API redirect
  if (!status) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    // Server-side: call the activation API
    const res = await fetch(`${baseUrl}/api/membership/activate?token=${token}`, {
      redirect: "manual",
    });
    if (res.status === 302 || res.status === 301) {
      const location = res.headers.get("location");
      if (location) {
        const { redirect } = await import("next/navigation");
        redirect(location);
      }
    }
  }

  const statusMap: Record<string, { title: string; message: string; color: string; icon: string }> = {
    success: { title: t("success.title"), message: t("success.message", { name: name ?? "", memberNumber: memberNumber ?? "" }), color: "green", icon: "✅" },
    invalid: { title: t("invalid.title"), message: t("invalid.message"), color: "red", icon: "❌" },
    expired: { title: t("expired.title"), message: t("expired.message"), color: "yellow", icon: "⏰" },
  };

  const info = statusMap[status ?? "invalid"] ?? statusMap.invalid;
  const colorMap: Record<string, string> = {
    green: "bg-green-50 border-green-400 text-green-800",
    red: "bg-red-50 border-red-400 text-red-800",
    yellow: "bg-yellow-50 border-yellow-400 text-yellow-800",
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <div className="text-5xl mb-4">{info.icon}</div>
      <div className={`rounded-lg border-l-4 p-6 text-left ${colorMap[info.color]}`}>
        <h1 className="text-xl font-bold mb-2">{info.title}</h1>
        <p>{info.message}</p>
      </div>
      <div className="mt-6">
        <a href={`/${locale}`} className="text-[#4577ac] hover:underline">
          {locale === "de" ? "Zurück zur Startseite" : "Back to homepage"}
        </a>
      </div>
    </div>
  );
}
