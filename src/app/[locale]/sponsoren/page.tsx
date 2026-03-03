import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

export default async function SponsorenPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations("Sponsors");

  const sponsors = await prisma.sponsor.findMany({ orderBy: { displayOrder: "asc" } });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 pt-20">
      <h1 className="text-2xl font-bold text-[#4577ac] mb-2">{t("pageTitle")}</h1>
      <p className="text-gray-600 mb-10">{t("subtitle")}</p>

      {sponsors.length === 0 ? (
        <p className="text-gray-500">{locale === "de" ? "Keine Sponsoren vorhanden." : "No sponsors listed."}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-6">
          {sponsors.map((s) => (
            <a
              key={s.id}
              href={s.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow gap-3"
              title={s.name}
            >
              <Image
                src={s.imageUrl}
                alt={s.name}
                width={320}
                height={180}
                className="object-contain max-h-44 w-full"
                unoptimized
              />
              <span className="text-xs text-gray-500 text-center">{s.name}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
