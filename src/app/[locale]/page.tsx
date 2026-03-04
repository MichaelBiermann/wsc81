import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import EventCalendar from "@/components/EventCalendar";
import RegularActivities from "@/components/RegularActivities";
import NewsBlock from "@/components/NewsBlock";
import HeroSlider from "@/components/HeroSlider";
import WelcomeBlock from "@/components/WelcomeBlock";
import ContactBlock from "@/components/ContactBlock";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Events");
  const session = await auth();
  const isLoggedIn = !!session?.user;

  const [events, newsPosts] = await Promise.all([
    prisma.event.findMany({
      where: { startDate: { gte: new Date() } },
      orderBy: { startDate: "asc" },
      take: 6,
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
          <RegularActivities locale={locale} />
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4">
          <NewsBlock posts={newsPosts} locale={locale} />
        </div>
      </section>

      <ContactBlock />
    </>
  );
}
