import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import EventCalendar from "@/components/EventCalendar";
import RegularActivities from "@/components/RegularActivities";
import NewsBlock from "@/components/NewsBlock";
import HeroSlider from "@/components/HeroSlider";
import WelcomeBlock from "@/components/WelcomeBlock";
import FormsSection from "@/components/FormsSection";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Events");
  const session = await auth();
  const isLoggedIn = !!session?.user;

  const [events, regularEvents, newsPosts] = await Promise.all([
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
  ]);

  return (
    <>
      <HeroSlider locale={locale} />
      <WelcomeBlock locale={locale} />

      <section>
        <div className="mx-auto max-w-7xl px-4">
          <NewsBlock posts={newsPosts} locale={locale} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="text-2xl font-bold text-[#4577ac] mb-6">{t("upcoming")}</h2>
        <EventCalendar events={events} locale={locale} isLoggedIn={isLoggedIn} />
      </section>

      <section id="veranstaltungen" className="bg-[#eef3f9] py-12">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-2xl font-bold text-[#4577ac] mb-2">
            {locale === "de" ? "Weitere Veranstaltungen" : "Regular Activities"}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {locale === "de"
              ? "Regelmäßige Aktivitäten des WSC 81"
              : "Regular WSC 81 activities"}
          </p>
          {regularEvents.length > 0 ? (
            <EventCalendar events={regularEvents} locale={locale} isLoggedIn={isLoggedIn} />
          ) : (
            <RegularActivities locale={locale} />
          )}
        </div>
      </section>

      <FormsSection />
    </>
  );
}
