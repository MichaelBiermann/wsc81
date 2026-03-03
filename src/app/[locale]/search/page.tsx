import { search } from "@/lib/search";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const { q = "" } = await searchParams;
  const t = await getTranslations("Search");

  const results = q.trim().length >= 2 ? await search(q.trim(), locale) : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 pt-20">
      <h1 className="text-2xl font-bold text-[#4577ac] mb-6">{t("pageTitle")}</h1>

      <form method="get" className="flex mb-8 gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder={t("placeholder")}
          className="flex-1 rounded-l border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4577ac]"
          autoFocus
        />
        <button
          type="submit"
          className="rounded-r bg-[#4577ac] px-4 py-2 text-white text-sm hover:bg-[#2d5a8a] transition-colors"
        >
          {t("placeholder")}
        </button>
      </form>

      {q && (
        <p className="text-sm text-gray-500 mb-4">
          {results.length > 0
            ? t("resultsFor", { q })
            : t("noResults")}
        </p>
      )}

      <div className="flex flex-col gap-4">
        {results.map((r) => (
          <div key={r.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs rounded px-2 py-0.5 font-medium ${r.type === "event" ? "bg-[#eef3f9] text-[#4577ac]" : "bg-gray-100 text-gray-600"}`}>
                {r.type === "event" ? t("typeEvent") : t("typeNews")}
              </span>
            </div>
            <Link
              href={r.type === "event"
                ? `/${locale}/events/${r.id}/book`
                : `/${locale}/news/${r.slug}`}
              className="font-semibold text-gray-900 hover:text-[#4577ac] hover:underline"
            >
              {r.title}
            </Link>
            {r.excerpt && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{r.excerpt}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
