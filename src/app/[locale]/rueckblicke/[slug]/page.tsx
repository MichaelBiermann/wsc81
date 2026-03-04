import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default async function RecapDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const isDE = locale === "de";

  const recap = await prisma.recap.findUnique({ where: { slug } });
  if (!recap || recap.status !== "PUBLISHED") notFound();

  const title = isDE ? recap.titleDe : recap.titleEn;
  const body = isDE ? recap.bodyDe : recap.bodyEn;

  const fmt = (d: Date) =>
    d.toLocaleDateString(isDE ? "de-DE" : "en-GB", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 pt-20">
      <Link
        href={`/${locale}/rueckblicke`}
        className="text-sm text-[#4577ac] hover:underline mb-6 inline-block"
      >
        ← {isDE ? "Alle Rückblicke" : "All recaps"}
      </Link>

      {recap.imageUrl && (
        <div className="relative h-64 w-full rounded-lg overflow-hidden mb-6">
          <Image src={recap.imageUrl} alt={title} fill className="object-cover" unoptimized />
        </div>
      )}

      {recap.eventDate && (
        <p className="text-sm text-[#4577ac] font-medium mb-2 flex items-center gap-1">
          <span className="material-symbols-rounded" style={{ fontSize: "16px" }}>calendar_month</span>
          {fmt(recap.eventDate)}
        </p>
      )}

      <h1 className="text-2xl font-bold text-gray-900 mb-6">{title}</h1>

      <div
        className="prose prose-sm max-w-none text-gray-700"
        dangerouslySetInnerHTML={{ __html: body }}
      />
    </div>
  );
}
