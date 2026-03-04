import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import BookingForm from "@/components/BookingForm";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const isDE = locale === "de";
  const t = await getTranslations("Booking");
  const session = await auth();

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) notFound();

  const title = isDE ? event.titleDe : event.titleEn;
  const description = isDE ? event.descriptionDe : event.descriptionEn;

  const fmt = (d: Date) =>
    d.toLocaleDateString(isDE ? "de-DE" : "en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  // Pre-fill booking form if user is logged in
  let prefill: {
    person1Name?: string;
    person1Dob?: string;
    street?: string;
    postalCode?: string;
    city?: string;
    phone?: string;
    email?: string;
    isMember?: boolean;
  } | undefined;

  const sessionUser = session?.user as { id?: string; role?: string } | undefined;
  if (sessionUser?.id && sessionUser.role !== "admin") {
    const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
    if (user) {
      prefill = {
        person1Name: `${user.firstName} ${user.lastName}`,
        person1Dob: user.dob.toISOString().split("T")[0],
        street: user.street,
        postalCode: user.postalCode,
        city: user.city,
        phone: user.phone,
        email: user.email,
        isMember: sessionUser.role === "member",
      };
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 pt-20">
      <Link
        href={`/${locale}/#events`}
        className="text-sm text-[#4577ac] hover:underline mb-6 inline-block"
      >
        ← {isDE ? "Zurück zu Veranstaltungen" : "Back to events"}
      </Link>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left: event details */}
        <div className="lg:w-2/5 lg:sticky lg:top-6">
          {event.imageUrl && (
            <div className="relative h-56 w-full rounded-t-lg overflow-hidden">
              <Image src={event.imageUrl} alt={title} fill className="object-cover" unoptimized />
            </div>
          )}
          <div className={`bg-[#4577ac] text-white px-6 py-4 ${event.imageUrl ? "" : "rounded-t-lg"}`}>
            <p className="text-sm opacity-80 flex items-center gap-1">
              <span className="material-symbols-rounded" style={{ fontSize: "16px" }}>calendar_month</span>
              {fmt(event.startDate)}
              {event.endDate && event.endDate.getTime() !== event.startDate.getTime()
                ? ` – ${fmt(event.endDate)}`
                : ""}
            </p>
            <h1 className="text-xl font-bold mt-1">{title}</h1>
            <p className="text-sm opacity-80 mt-1 flex items-center gap-1">
              <span className="material-symbols-rounded" style={{ fontSize: "16px" }}>location_on</span> {event.location}
            </p>
          </div>

          <div className="bg-white border border-gray-200 border-t-0 rounded-b-lg p-5 mb-4">
            <div
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          </div>

          <div className="bg-[#eef3f9] rounded-lg p-4 text-sm space-y-2">
            {Number(event.totalAmount) > 0 && (<>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">{isDE ? "Gesamtpreis" : "Total price"}</span>
              <span className="font-semibold">€{Number(event.totalAmount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>{isDE ? "Anzahlung" : "Deposit"}</span>
              <span>€{Number(event.depositAmount).toFixed(2)}</span>
            </div>
            </>)}
            {event.registrationDeadline && (
              <div className="flex justify-between text-gray-500">
                <span>{isDE ? "Anmeldeschluss" : "Registration deadline"}</span>
                <span>{fmt(event.registrationDeadline)}</span>
              </div>
            )}
            {event.maxParticipants && (
              <div className="flex justify-between text-gray-500">
                <span>{isDE ? "Max. Teilnehmer" : "Max. participants"}</span>
                <span>{event.maxParticipants}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: booking form */}
        <div className="lg:w-3/5">
          <h2 className="text-xl font-bold text-[#4577ac] mb-2">{t("pageTitle")}</h2>
          <p className="text-gray-500 text-sm mb-6">{t("subtitle", { eventTitle: title })}</p>
          <BookingForm
            event={{
              id: event.id,
              titleDe: event.titleDe,
              titleEn: event.titleEn,
              totalAmount: Number(event.totalAmount),
              depositAmount: Number(event.depositAmount),
              registrationDeadline: event.registrationDeadline?.toISOString() ?? null,
            }}
            locale={locale}
            prefill={prefill}
          />
        </div>
      </div>
    </div>
  );
}
