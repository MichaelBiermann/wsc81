import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";

export default async function RecapsListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isDE = locale === "de";

  const recaps = await prisma.recap.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { eventDate: "desc" },
  });

  const fmt = (d: Date) =>
    d.toLocaleDateString(isDE ? "de-DE" : "en-GB", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 pt-20">
      <h1 className="text-2xl font-bold text-[#4577ac] mb-2">
        {isDE ? "Rückblicke" : "Event Reports"}
      </h1>
      <p className="text-gray-500 mb-8 text-sm">
        {isDE ? "Berichte von vergangenen Veranstaltungen des WSC 81." : "Reports from past WSC 81 events."}
      </p>

      {recaps.length === 0 ? (
        <p className="text-gray-500">{isDE ? "Noch keine Rückblicke vorhanden." : "No recaps yet."}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {recaps.map((recap) => {
            const title = isDE ? recap.titleDe : recap.titleEn;
            const body = isDE ? recap.bodyDe : recap.bodyEn;
            const excerpt = body.replace(/<[^>]+>/g, "").slice(0, 140);

            return (
              <Link
                key={recap.id}
                href={`/${locale}/rueckblicke/${recap.slug}`}
                className="group rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {recap.imageUrl && (
                  <div className="relative h-40 w-full">
                    <Image src={recap.imageUrl} alt={title} fill className="object-cover" unoptimized />
                  </div>
                )}
                <div className="p-5">
                  {recap.eventDate && (
                    <p className="text-xs text-[#4577ac] font-medium mb-1 flex items-center gap-1">
                      <span className="material-symbols-rounded" style={{ fontSize: "14px" }}>calendar_month</span>
                      {fmt(recap.eventDate)}
                    </p>
                  )}
                  <h2 className="font-bold text-gray-900 mb-2 group-hover:text-[#4577ac] transition-colors">{title}</h2>
                  <p className="text-sm text-gray-600 line-clamp-3">{excerpt}…</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
