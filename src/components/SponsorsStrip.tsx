import { prisma } from "@/lib/prisma";
import { getLocale } from "next-intl/server";
import Image from "next/image";

export default async function SponsorsStrip() {
  const [sponsors, locale] = await Promise.all([
    prisma.sponsor.findMany({ orderBy: { displayOrder: "asc" } }).catch(() => []),
    getLocale(),
  ]);

  if (sponsors.length === 0) return null;

  return (
    <section className="py-8 border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-7xl px-4">
        <a
          href={`/${locale}/sponsoren`}
          className="block text-xs font-semibold uppercase tracking-widest text-gray-400 text-center mb-4 hover:text-[#4577ac] transition-colors"
        >
          {locale === "de" ? "Unsere Sponsoren" : "Our Sponsors"}
        </a>
        <div className="flex flex-wrap justify-center items-center gap-3">
          {sponsors.map((s) => (
            <a
              key={s.id}
              href={s.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={s.name}
              className="flex items-center justify-center rounded border border-gray-100 bg-white p-3 hover:border-gray-300 transition-colors w-64 h-52"
            >
              <Image
                src={s.imageUrl}
                alt={s.name}
                width={640}
                height={320}
                className="object-contain w-full h-full"
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
