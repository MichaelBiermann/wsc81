import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import EventCalendar from "@/components/EventCalendar";
import RegularActivities from "@/components/RegularActivities";
import NewsBlock from "@/components/NewsBlock";
import HeroSlider from "@/components/HeroSlider";
import WelcomeBlock from "@/components/WelcomeBlock";
import ContactBlock from "@/components/ContactBlock";
import Image from "next/image";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Events");
  const session = await auth();
  const isLoggedIn = !!session?.user;

  const [events, regularEvents, newsPosts, sponsors] = await Promise.all([
    prisma.event.findMany({
      where: { startDate: { gte: new Date() }, bookable: true },
      orderBy: { startDate: "asc" },
      take: 6,
    }).catch(() => []),
    prisma.event.findMany({
      where: { bookable: false },
      orderBy: { startDate: "asc" },
    }).catch(() => []),
    prisma.newsPost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 4,
    }).catch(() => []),
    prisma.sponsor.findMany({ orderBy: { displayOrder: "asc" } }).catch(() => []),
  ]);

  return (
    <>
      <HeroSlider locale={locale} />
      <WelcomeBlock locale={locale} />

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4">
          <NewsBlock posts={newsPosts} locale={locale} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="text-2xl font-bold text-[#4577ac] mb-6">{t("upcoming")}</h2>
        <EventCalendar events={events} locale={locale} isLoggedIn={isLoggedIn} />
      </section>

      <section className="bg-[#eef3f9] py-12">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-2xl font-bold text-[#4577ac] mb-2">
            {locale === "de" ? "Weitere Veranstaltungen" : "Regular Activities"}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {locale === "de"
              ? "Regelmäßige Aktivitäten des WSC 81 – keine Anmeldung erforderlich."
              : "Regular WSC 81 activities — no booking required."}
          </p>
          {regularEvents.length > 0 ? (
            <EventCalendar events={regularEvents} locale={locale} isLoggedIn={isLoggedIn} />
          ) : (
            <RegularActivities locale={locale} />
          )}
        </div>
      </section>

      {sponsors.length > 0 && (
        <section className="py-8 border-t border-gray-100">
          <div className="mx-auto max-w-7xl px-4">
            <a href={`/${locale}/sponsoren`} className="text-xs font-semibold uppercase tracking-widest text-gray-400 text-center mb-4 hover:text-[#4577ac] transition-colors">
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
                  className="flex items-center justify-center rounded border border-gray-100 bg-white p-3 hover:border-gray-300 transition-colors"
                >
                  <Image
                    src={s.imageUrl}
                    alt={s.name}
                    width={160}
                    height={80}
                    className="object-contain h-16 w-auto"
                  />
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      <ContactBlock />
    </>
  );
}
